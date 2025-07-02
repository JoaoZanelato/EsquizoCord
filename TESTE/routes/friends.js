const express = require('express');
const router = express.Router();
const { encrypt, decrypt } = require('../utils/crypto-helper');

// ROTA GET PARA BUSCAR MENSAGENS DIRETAS
router.get('/dm/:friendId/messages', requireLogin, async (req, res, next) => {
    const friendId = req.params.friendId;
    const currentUserId = req.session.user.id_usuario;
    const pool = req.db;
    try {
        // Query atualizada para as novas colunas
        const query = `
            SELECT id_mensagem, id_remetente, ConteudoCriptografado, Nonce, DataHora
            FROM MensagensDiretas
            WHERE (id_remetente = ? AND id_destinatario = ?) OR (id_remetente = ? AND id_destinatario = ?)
            ORDER BY DataHora ASC
            LIMIT 100;
        `;
        const [messages] = await pool.query(query, [currentUserId, friendId, friendId, currentUserId]);
        
        const decryptedMessages = messages.map(msg => ({
            ...msg,
            Conteudo: decrypt(msg)
        }));

        res.json(decryptedMessages);
    } catch (error) {
        next(error);
    }
});

// ROTA POST PARA ENVIAR UMA MENSAGEM DIRETA
router.post('/dm/:friendId/messages', requireLogin, async (req, res, next) => {
    const friendId = req.params.friendId;
    const currentUserId = req.session.user.id_usuario;
    const { content } = req.body;
    const pool = req.db;
    const io = req.app.get('io');

    if (!content) {
        return res.status(400).json({ message: "O conteúdo não pode estar vazio." });
    }

    const { ciphertext, nonce } = encrypt(content);

    try {
        // INSERT atualizado para as novas colunas
        const [result] = await pool.query(
            "INSERT INTO MensagensDiretas (id_remetente, id_destinatario, ConteudoCriptografado, Nonce) VALUES (?, ?, ?, ?)",
            [currentUserId, friendId, ciphertext, nonce]
        );
        const messageData = {
            id_mensagem: result.insertId,
            id_remetente: currentUserId,
            id_destinatario: parseInt(friendId, 10),
            Conteudo: content,
            DataHora: new Date()
        };
        const ids = [currentUserId, parseInt(friendId, 10)].sort();
        const roomName = `dm-${ids[0]}-${ids[1]}`;
        io.to(roomName).emit('new_dm', messageData);
        res.status(201).json(messageData);
    } catch (error) {
        next(error);
    }
});


// --- O resto do seu arquivo friends.js ---
function requireLogin(req, res, next) {
    if (req.session && req.session.user) return next();
    return res.status(401).json({ message: 'Acesso não autorizado' });
}

router.get('/search', requireLogin, async (req, res, next) => {
    const { q } = req.query;
    const currentUserId = req.session.user.id_usuario;
    if (!q) return res.json([]);
    const pool = req.db;
    try {
        const query = `SELECT id_usuario, Nome, FotoPerfil FROM Usuarios WHERE Nome LIKE ? AND id_usuario != ?`;
        const [users] = await pool.query(query, [`%${q}%`, currentUserId]);
        res.json(users);
    } catch (error) { next(error); }
});

router.post('/request', requireLogin, async (req, res, next) => {
    const { username } = req.body; // Alterado para receber username
    const requesterId = req.session.user.id_usuario;
    const pool = req.db;

    if (!username) {
        return res.status(400).json({ message: "Nome de usuário é obrigatório." });
    }

    try {
        // Busca o ID do usuário pelo nome
        const [users] = await pool.query("SELECT id_usuario FROM Usuarios WHERE Nome = ?", [username]);
        if (users.length === 0) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }
        const requestedId = users[0].id_usuario;

        if (requesterId == requestedId) {
            return res.status(400).json({ message: "Você não pode adicionar a si mesmo." });
        }

        const [existing] = await pool.query(
            "SELECT * FROM Amizades WHERE (id_utilizador_requisitante = ? AND id_utilizador_requisitado = ?) OR (id_utilizador_requisitante = ? AND id_utilizador_requisitado = ?)",
            [requesterId, requestedId, requestedId, requesterId]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: "Já existe um pedido de amizade com este utilizador." });
        }
        await pool.query("INSERT INTO Amizades (id_utilizador_requisitante, id_utilizador_requisitado, status) VALUES (?, ?, 'pendente')", [requesterId, requestedId]);
        res.status(201).json({ message: "Pedido de amizade enviado!" });
    } catch (error) { next(error); }
});

router.post('/respond', requireLogin, async (req, res, next) => {
    const { requestId, action } = req.body;
    const currentUserId = req.session.user.id_usuario;
    if (!requestId || !['aceite', 'recusada'].includes(action)) {
        return res.status(400).json({ message: "Pedido inválido." });
    }
    const pool = req.db;
    try {
        if (action === 'aceite') {
            await pool.query("UPDATE Amizades SET status = 'aceite' WHERE id_amizade = ? AND id_utilizador_requisitado = ?", [requestId, currentUserId]);
        } else {
            await pool.query("DELETE FROM Amizades WHERE id_amizade = ? AND id_utilizador_requisitado = ?", [requestId, currentUserId]);
        }
        res.status(200).json({ message: `Pedido ${action} com sucesso.` });
    } catch (error) { next(error); }
});

router.post('/cancel', requireLogin, async (req, res, next) => {
    const { requestId } = req.body;
    const currentUserId = req.session.user.id_usuario;
    if (!requestId) {
        return res.status(400).json({ message: "ID do pedido é obrigatório." });
    }
    const pool = req.db;
    try {
        const [result] = await pool.query(
            "DELETE FROM Amizades WHERE id_amizade = ? AND id_utilizador_requisitante = ?",
            [requestId, currentUserId]
        );
        if (result.affectedRows > 0) {
            res.status(200).json({ message: "Pedido de amizade cancelado." });
        } else {
            res.status(403).json({ message: "Não autorizado a cancelar este pedido." });
        }
    } catch (error) {
        next(error);
    }
});
module.exports = router;