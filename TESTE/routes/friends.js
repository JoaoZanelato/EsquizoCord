const express = require('express');
const router = express.Router();
const { encrypt, decrypt } = require('../utils/crypto-helper');

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
function requireLogin(req, res, next) {
    if (req.session && req.session.user) return next();
    return res.status(401).json({ message: 'Acesso não autorizado' });
}


// --- ROTAS DE MENSAGEM DIRETA (DM) ---

// ROTA GET PARA BUSCAR MENSAGENS DIRETAS
router.get('/dm/:friendId/messages', requireLogin, async (req, res, next) => {
    const friendId = req.params.friendId;
    const currentUserId = req.session.user.id_usuario;
    const pool = req.db;
    try {
        const query = `
            SELECT 
                md.id_mensagem, md.id_remetente, md.ConteudoCriptografado, md.Nonce, md.DataHora,
                u.Nome as autorNome, u.FotoPerfil as autorFoto,
                md.id_mensagem_respondida,
                replied.ConteudoCriptografado as repliedContent,
                replied.Nonce as repliedNonce,
                replied_u.Nome as repliedAuthorName,
                replied_u.id_usuario as repliedAuthorId
            FROM MensagensDiretas md
            JOIN Usuarios u ON md.id_remetente = u.id_usuario
            LEFT JOIN MensagensDiretas replied ON md.id_mensagem_respondida = replied.id_mensagem
            LEFT JOIN Usuarios replied_u ON replied.id_remetente = replied_u.id_usuario
            WHERE (md.id_remetente = ? AND md.id_destinatario = ?) OR (md.id_remetente = ? AND md.id_destinatario = ?)
            ORDER BY md.DataHora ASC
            LIMIT 100;
        `;
        const [messages] = await pool.query(query, [currentUserId, friendId, friendId, currentUserId]);
        
        const decryptedMessages = messages.map(msg => {
            let repliedTo = null;
            if (msg.id_mensagem_respondida && msg.repliedContent) {
                const repliedDecryptedContent = decrypt({ ConteudoCriptografado: msg.repliedContent, Nonce: msg.repliedNonce });
                repliedTo = {
                    autorNome: msg.repliedAuthorName,
                    autorId: msg.repliedAuthorId,
                    Conteudo: repliedDecryptedContent
                };
            }
            return {
                ...msg,
                id_usuario: msg.id_remetente,
                Conteudo: decrypt(msg),
                repliedTo: repliedTo
            };
        });

        res.json(decryptedMessages);
    } catch (error) {
        next(error);
    }
});

// ROTA POST PARA ENVIAR UMA MENSAGEM DIRETA
router.post('/dm/:friendId/messages', requireLogin, async (req, res, next) => {
    const friendId = req.params.friendId;
    const currentUser = req.session.user; // Usar o objeto de usuário completo da sessão
    const currentUserId = currentUser.id_usuario;
    const { content, replyingToMessageId } = req.body;
    const pool = req.db;
    const io = req.app.get('io');

    if (!content) {
        return res.status(400).json({ message: "O conteúdo não pode estar vazio." });
    }

    const { ciphertext, nonce } = encrypt(content);
    const repliedToId = replyingToMessageId || null;

    try {
        const [result] = await pool.query(
            "INSERT INTO MensagensDiretas (id_remetente, id_destinatario, ConteudoCriptografado, Nonce, id_mensagem_respondida) VALUES (?, ?, ?, ?, ?)",
            [currentUserId, friendId, ciphertext, nonce, repliedToId]
        );

        // --- CORREÇÃO E MELHORIA APLICADA AQUI ---
        const messageData = {
            id_mensagem: result.insertId,
            id_remetente: currentUserId,
            id_destinatario: parseInt(friendId, 10),
            Conteudo: content,
            DataHora: new Date(),
            id_mensagem_respondida: repliedToId,
            // Adiciona os dados do autor diretamente no payload do WebSocket
            autorNome: currentUser.Nome,
            autorFoto: currentUser.FotoPerfil,
            id_usuario: currentUserId // Garante consistência com o objeto de mensagem de grupo
        };
        // -----------------------------------------

        if (repliedToId) {
            // A query aqui já foi corrigida na sua solicitação anterior para incluir 'autorId'
            const [repliedMsgArr] = await pool.query("SELECT md.ConteudoCriptografado, md.Nonce, u.Nome as autorNome, u.id_usuario as autorId FROM MensagensDiretas md JOIN Usuarios u ON md.id_remetente = u.id_usuario WHERE md.id_mensagem = ?", [repliedToId]);
            if (repliedMsgArr.length > 0) {
                messageData.repliedTo = {
                    autorNome: repliedMsgArr[0].autorNome,
                    autorId: repliedMsgArr[0].autorId,
                    Conteudo: decrypt(repliedMsgArr[0])
                };
            }
        }

        const ids = [currentUserId, parseInt(friendId, 10)].sort();
        const roomName = `dm-${ids[0]}-${ids[1]}`;
        io.to(roomName).emit('new_dm', messageData);
        res.status(201).json(messageData);
    } catch (error) {
        next(error);
    }
});

// ROTA DELETE PARA EXCLUIR UMA MENSAGEM DIRETA
router.delete('/dm/messages/:messageId', requireLogin, async (req, res, next) => {
    const { messageId } = req.params;
    const currentUserId = req.session.user.id_usuario;
    const pool = req.db;
    const io = req.app.get('io');

    try {
        const [msgResult] = await pool.query("SELECT id_remetente, id_destinatario FROM MensagensDiretas WHERE id_mensagem = ?", [messageId]);
        if (msgResult.length === 0) {
            return res.status(404).json({ message: "Mensagem não encontrada." });
        }
        const message = msgResult[0];

        if (message.id_remetente !== currentUserId) {
            return res.status(403).json({ message: "Você não pode apagar uma mensagem que não enviou." });
        }

        await pool.query("DELETE FROM MensagensDiretas WHERE id_mensagem = ?", [messageId]);

        const ids = [message.id_remetente, message.id_destinatario].sort();
        const roomName = `dm-${ids[0]}-${ids[1]}`;
        io.to(roomName).emit('dm_message_deleted', { messageId: parseInt(messageId, 10) });

        res.status(200).json({ message: "Mensagem excluída com sucesso." });
    } catch (error) {
        next(error);
    }
});


// --- ROTAS DE AMIZADE ---

// ROTA GET PARA PROCURAR USUÁRIOS
router.get('/search', requireLogin, async (req, res, next) => {
    const { q } = req.query;
    const currentUserId = req.session.user.id_usuario;
    if (!q) return res.json([]);
    const pool = req.db;
    try {
        // Exclui o próprio usuário e amigos existentes dos resultados
        const query = `
            SELECT id_usuario, Nome, FotoPerfil FROM Usuarios 
            WHERE Nome LIKE ? AND id_usuario != ?
            AND id_usuario NOT IN (
                SELECT id_utilizador_requisitado FROM Amizades WHERE id_utilizador_requisitante = ?
                UNION
                SELECT id_utilizador_requisitante FROM Amizades WHERE id_utilizador_requisitado = ?
            )
        `;
        const [users] = await pool.query(query, [`%${q}%`, currentUserId, currentUserId, currentUserId]);
        res.json(users);
    } catch (error) { 
        next(error); 
    }
});


// ROTA POST PARA ENVIAR PEDIDO DE AMIZADE
router.post('/request', requireLogin, async (req, res, next) => {
    const { requestedId } = req.body; // <-- ALTERAÇÃO: Recebe o ID do usuário
    const requesterId = req.session.user.id_usuario;
    const pool = req.db;

    if (!requestedId) {
        return res.status(400).json({ message: "ID do usuário é obrigatório." });
    }

    if (requesterId == requestedId) {
        return res.status(400).json({ message: "Você não pode adicionar a si mesmo." });
    }

    try {
        const [existing] = await pool.query(
            "SELECT * FROM Amizades WHERE (id_utilizador_requisitante = ? AND id_utilizador_requisitado = ?) OR (id_utilizador_requisitante = ? AND id_utilizador_requisitado = ?)",
            [requesterId, requestedId, requestedId, requesterId]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: "Já existe um pedido de amizade com este utilizador." });
        }

        await pool.query("INSERT INTO Amizades (id_utilizador_requisitante, id_utilizador_requisitado, status) VALUES (?, ?, 'pendente')", [requesterId, requestedId]);
        res.status(201).json({ message: "Pedido de amizade enviado!" });
    } catch (error) { 
        next(error); 
    }
});

// ROTA POST PARA RESPONDER A UM PEDIDO
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

// ROTA POST PARA CANCELAR UM PEDIDO ENVIADO
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