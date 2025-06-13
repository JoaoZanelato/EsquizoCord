const express = require('express');
const router = express.Router();

function requireLogin(req, res, next) {
    if (req.session && req.session.user) return next();
    return res.status(401).json({ message: 'Acesso não autorizado' });
}

// ROTA GET PARA PROCURAR UTILIZADORES
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

// ROTA GET PARA BUSCAR MENSAGENS DIRETAS 
router.get('/dm/:friendId/messages', requireLogin, async (req, res, next) => {
    const friendId = req.params.friendId;
    const currentUserId = req.session.user.id_usuario;
    const pool = req.db;
    try {
        const query = `
            SELECT id_mensagem, id_remetente, Conteudo, DataHora
            FROM MensagensDiretas
            WHERE (id_remetente = ? AND id_destinatario = ?) OR (id_remetente = ? AND id_destinatario = ?)
            ORDER BY DataHora ASC
            LIMIT 100;
        `;
        const [messages] = await pool.query(query, [currentUserId, friendId, friendId, currentUserId]);
        res.json(messages);
    } catch (error) {
        next(error);
    }
})

// ROTA POST PARA ENVIAR UM PEDIDO DE AMIZADE
router.post('/request', requireLogin, async (req, res, next) => {
    const { requestedId } = req.body;
    const requesterId = req.session.user.id_usuario;
    if (!requestedId || requesterId == requestedId) {
        return res.status(400).json({ message: "Pedido inválido." });
    }
    const pool = req.db;
    try {
        const [existing] = await pool.query(
            "SELECT * FROM Amizades WHERE (id_utilizador_requisitante = ? AND id_utilizador_requisitado = ?) OR (id_utilizador_requisitante = ? AND id_utilizador_requisitado = ?)",
            [requesterId, requestedId, requestedId, requesterId]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: "Já existe uma relação com este utilizador." });
        }
        await pool.query("INSERT INTO Amizades (id_utilizador_requisitante, id_utilizador_requisitado, status) VALUES (?, ?, 'pendente')", [requesterId, requestedId]);
        res.status(201).json({ message: "Pedido de amizade enviado!" });
    } catch (error) { next(error); }
});

// ROTA POST PARA RESPONDER A UM PEDIDO DE AMIZADE
router.post('/respond', requireLogin, async (req, res, next) => {
    const { requestId, action } = req.body; // action será 'aceite' ou 'recusada'
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

// NOVA ROTA POST PARA CANCELAR UM PEDIDO DE AMIZADE ENVIADO
router.post('/cancel', requireLogin, async (req, res, next) => {
    const { requestId } = req.body;
    const currentUserId = req.session.user.id_usuario;
    if (!requestId) {
        return res.status(400).json({ message: "ID do pedido é obrigatório." });
    }
    const pool = req.db;
    try {
        // Exclui o pedido, garantindo que apenas o remetente pode cancelar
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
    try {
        const [result] = await pool.query("INSERT INTO MensagensDiretas (id_remetente, id_destinatario, Conteudo) VALUES (?, ?, ?)",
            [currentUserId, friendId, content]
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



module.exports = router;
