console.log("-> routes/groups.js foi carregado"); // <-- ADICIONADO PARA DEBUG
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { encrypt, decrypt } = require('../utils/crypto-helper');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { AI_USER_ID, getAiResponse } = require('../utils/ia-helper');

function requireLogin(req, res, next) {
    if (req.session && req.session.user) return next();
    return res.status(401).json({ message: 'Acesso não autorizado' });
}
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => ({
    folder: 'esquizocord_groups',
    format: 'png',
    public_id: `group-${req.session.user.id_usuario}-${Date.now()}`,
  }),
});
const upload = multer({ storage: storage });

async function isGroupCreator(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.session.user.id_usuario;
        const pool = req.db;
        const [rows] = await pool.query("SELECT id_criador FROM Grupos WHERE id_grupo = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Grupo não encontrado." });
        }
        if (rows[0].id_criador !== userId) {
            return res.status(403).json({ message: "Apenas o criador pode alterar as configurações do grupo." });
        }
        return next();
    } catch (error) { next(error); }
}

// ROTA POST PARA ENVIAR E GUARDAR UMA NOVA MENSAGEM (COM RESPOSTA)
router.post('/chats/:chatId/messages', requireLogin, async (req, res, next) => {
    const { chatId } = req.params;
    const { content, replyingToMessageId } = req.body;
    const user = req.session.user;
    const pool = req.db;
    const io = req.app.get('io');

    if (!content) {
        return res.status(400).json({ message: "O conteúdo da mensagem não pode estar vazio." });
    }

    const { ciphertext, nonce } = encrypt(content);
    const repliedToId = replyingToMessageId || null;

    try {
        const [groupRows] = await pool.query("SELECT id_grupo FROM Chats WHERE id_chat = ?", [chatId]);
        if (groupRows.length === 0) {
            return res.status(404).json({message: "Chat não pertence a nenhum grupo."});
        }
        const groupId = groupRows[0].id_grupo;

        const [result] = await pool.query(
            "INSERT INTO Mensagens (id_chat, id_usuario, ConteudoCriptografado, Nonce, id_mensagem_respondida) VALUES (?, ?, ?, ?, ?)",
            [chatId, user.id_usuario, ciphertext, nonce, repliedToId]
        );
        const messageId = result.insertId;

        const messageData = {
            id_mensagem: messageId,
            id_chat: parseInt(chatId, 10),
            groupId: groupId,
            Conteudo: content,
            DataHora: new Date(),
            id_usuario: user.id_usuario,
            autorNome: user.Nome,
            autorFoto: user.FotoPerfil,
            id_mensagem_respondida: repliedToId
        };
        
        if (repliedToId) {
            const [repliedMsgArr] = await pool.query("SELECT m.ConteudoCriptografado, m.Nonce, u.Nome as autorNome, u.id_usuario as autorId FROM Mensagens m JOIN Usuarios u ON m.id_usuario = u.id_usuario WHERE m.id_mensagem = ?", [repliedToId]);
            if(repliedMsgArr.length > 0) {
                 messageData.repliedTo = {
                    autorNome: repliedMsgArr[0].autorNome,
                    autorId: repliedMsgArr[0].autorId,
                    Conteudo: decrypt(repliedMsgArr[0])
                 }
            }
        }
        
        const roomName = `group-${groupId}`;
        io.to(roomName).emit('new_group_message', messageData);
        
        const [aiUsers] = await pool.query("SELECT Nome, FotoPerfil FROM Usuarios WHERE id_usuario = ?", [AI_USER_ID]);
        
        if(aiUsers.length > 0) {
            const aiName = aiUsers[0].Nome
            const aiPhoto = aiUsers[0].FotoPerfil

            if (content.includes(`@${aiName}`)) {
                const prompt = content.replace(`@${aiName}`, '').trim()
                const aiResponseText = await getAiResponse(prompt)
                const {ciphertext: aiCiphertext, nonce: aiNonce} = encrypt(aiResponseText)
                
                const [aiResult] = await pool.query("INSERT INTO Mensagens (id_chat, id_usuario, ConteudoCriptografado, Nonce) VALUES (?, ?, ?, ?)", [chatId, AI_USER_ID, aiCiphertext, aiNonce]) 
            
                const aiMessageData = {
                    id_mensagem: aiResult.insertId,
                    id_chat: parseInt(chatId, 10),
                    groupId: groupId,
                    Conteudo: aiResponseText,
                    DataHora: new Date(),
                    id_usuario: AI_USER_ID,
                    autorNome: aiName,
                    autorFoto: aiPhoto
                }
                io.to(roomName).emit('new_group_message', aiMessageData)
            }
        }
        res.status(201).json(messageData);
    } catch (error) {next(error);}
});

router.post('/criar', requireLogin, upload.single('foto'), async (req, res, next) => {
    const { nome, isPrivate } = req.body;
    const id_criador = req.session.user.id_usuario;
    const fotoUrl = req.file ? req.file.path : null;
    const isPrivateBool = isPrivate === 'on';
    if (!nome) return res.status(400).json({ message: 'O nome do grupo é obrigatório.' });
    const pool = req.db;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [groupResult] = await connection.query("INSERT INTO Grupos (Nome, Foto, IsPrivate, id_criador) VALUES (?, ?, ?, ?)", [nome, fotoUrl, isPrivateBool, id_criador]);
        const newGroupId = groupResult.insertId;
        await connection.query("INSERT INTO ParticipantesGrupo (id_usuario, id_grupo) VALUES (?, ?)", [id_criador, newGroupId]);
        await connection.query("INSERT INTO ParticipantesGrupo (id_usuario, id_grupo) VALUES (?, ?)", [AI_USER_ID, newGroupId]);
        await connection.query("INSERT INTO Administradores (id_usuario, id_grupo) VALUES (?, ?)", [id_criador, newGroupId]);
        await connection.query("INSERT INTO Chats (id_grupo, Nome) VALUES (?, 'geral')", [newGroupId]);
        await connection.commit();
        res.status(201).json({ message: 'Grupo criado com sucesso!', groupId: newGroupId });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
});

router.get('/search', requireLogin, async (req, res, next) => {
    const { q } = req.query;
    const pool = req.db;
    try {
        let query;
        let params;
        if (q) {
            query = `SELECT id_grupo, Nome, Foto FROM Grupos WHERE IsPrivate = 0 AND (Nome LIKE ? OR id_grupo = ?)`;
            params = [`%${q}%`, q];
        } else {
            query = `SELECT id_grupo, Nome, Foto FROM Grupos WHERE IsPrivate = 0 ORDER BY Nome ASC`;
            params = [];
        }
        const [groups] = await pool.query(query, params);
        res.json(groups);
    } catch (error) { next(error); }
});

// ROTA GET PARA BUSCAR O HISTÓRICO DE MENSAGENS (COM RESPOSTA)
router.get('/chats/:chatId/messages', requireLogin, async (req, res, next) => {
    const { chatId } = req.params;
    const pool = req.db;
    try {
        const query = `
            SELECT 
                m.id_mensagem, m.ConteudoCriptografado, m.Nonce, m.DataHora, m.id_usuario, 
                u.Nome AS autorNome, u.FotoPerfil AS autorFoto,
                m.id_mensagem_respondida,
                replied.ConteudoCriptografado as repliedContent, 
                replied.Nonce as repliedNonce,
                replied_u.Nome as repliedAuthorName,
                replied_u.id_usuario as repliedAuthorId
            FROM Mensagens m
            JOIN Usuarios u ON m.id_usuario = u.id_usuario
            LEFT JOIN Mensagens replied ON m.id_mensagem_respondida = replied.id_mensagem
            LEFT JOIN Usuarios replied_u ON replied.id_usuario = replied_u.id_usuario
            WHERE m.id_chat = ?
            ORDER BY m.DataHora ASC
            LIMIT 100
        `;
        const [messages] = await pool.query(query, [chatId]);

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
                Conteudo: decrypt(msg),
                repliedTo: repliedTo
            };
        });

        res.json(decryptedMessages);
    } catch (error) {
        next(error);
    }
});

router.post('/:id/join', requireLogin, async (req, res, next) => {
    const groupId = req.params.id;
    const userId = req.session.user.id_usuario;
    const pool = req.db;
    try {
        const [existing] = await pool.query("SELECT * FROM ParticipantesGrupo WHERE id_usuario = ? AND id_grupo = ?", [userId, groupId]);
        if (existing.length > 0) return res.status(409).json({ message: "Você já é membro deste grupo." });
        await pool.query("INSERT INTO ParticipantesGrupo (id_usuario, id_grupo) VALUES (?, ?)", [userId, groupId]);
        res.status(200).json({ message: "Entrou no grupo com sucesso!" });
    } catch (error) {
        if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(404).json({ message: "Grupo não encontrado." });
        next(error);
    }
});

router.get('/:id/details', requireLogin, async (req, res, next) => {
    const { id } = req.params;
    const pool = req.db;
    try {
        const [details] = await pool.query("SELECT * FROM Grupos WHERE id_grupo = ?", [id]);
        const [channels] = await pool.query("SELECT id_chat, Nome FROM Chats WHERE id_grupo = ?", [id]);
        const [members] = await pool.query("SELECT u.id_usuario, u.Nome, u.FotoPerfil, (SELECT COUNT(*) FROM Administradores a WHERE a.id_usuario = u.id_usuario AND a.id_grupo = pg.id_grupo) > 0 AS isAdmin FROM Usuarios u JOIN ParticipantesGrupo pg ON u.id_usuario = pg.id_usuario WHERE pg.id_grupo = ?", [id]);
        if (details.length === 0) return res.status(404).json({ message: 'Grupo não encontrado.' });
        res.json({ details: details[0], channels, members });
    } catch (error) { next(error); }
});

router.post('/:id/settings', requireLogin, isGroupCreator, upload.single('foto'), async (req, res, next) => {
    const { id } = req.params;
    const { nome, isPrivate } = req.body;
    const fotoUrl = req.file ? req.file.path : null;
    const isPrivateBool = isPrivate === 'on';
    const pool = req.db;
    try {
        let sql = "UPDATE Grupos SET Nome = ?, IsPrivate = ?";
        const params = [nome, isPrivateBool];
        if (fotoUrl) {
            sql += ", Foto = ?";
            params.push(fotoUrl);
        }
        sql += " WHERE id_grupo = ?";
        params.push(id);
        await pool.query(sql, params);
        res.json({ message: "Grupo atualizado com sucesso." });
    } catch (error) { next(error); }
});

router.delete('/:id', requireLogin, isGroupCreator, async (req, res, next) => {
    const { id } = req.params;
    const pool = req.db;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query("DELETE FROM Mensagens WHERE id_chat IN (SELECT id_chat FROM Chats WHERE id_grupo = ?)", [id]);
        await connection.query("DELETE FROM Chats WHERE id_grupo = ?", [id]);
        await connection.query("DELETE FROM Administradores WHERE id_grupo = ?", [id]);
        await connection.query("DELETE FROM Moderadores WHERE id_grupo = ?", [id]);
        await connection.query("DELETE FROM ParticipantesGrupo WHERE id_grupo = ?", [id]);
        await connection.query("DELETE FROM Grupos WHERE id_grupo = ?", [id]);
        await connection.commit();
        res.status(200).json({ message: "Grupo e todos os seus dados foram excluídos com sucesso." });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
});

// ROTA DELETE PARA EXCLUIR UMA MENSAGEM DE GRUPO
router.delete('/messages/:messageId', requireLogin, async (req, res, next) => {
    const { messageId } = req.params;
    const userId = req.session.user.id_usuario;
    const pool = req.db;
    const io = req.app.get('io');

    try {
        const [messageResult] = await pool.query("SELECT id_usuario, id_chat FROM Mensagens WHERE id_mensagem = ?", [messageId]);
        if (messageResult.length === 0) {
            return res.status(404).json({ message: "Mensagem não encontrada." });
        }
        const message = messageResult[0];

        const [chatResult] = await pool.query("SELECT id_grupo FROM Chats WHERE id_chat = ?", [message.id_chat]);
        if (chatResult.length === 0) {
            return res.status(404).json({ message: "Grupo não encontrado." });
        }
        const groupId = chatResult[0].id_grupo;

        const [adminResult] = await pool.query("SELECT id_usuario FROM Administradores WHERE id_grupo = ? AND id_usuario = ?", [groupId, userId]);
        const isUserAdmin = adminResult.length > 0;

        if (message.id_usuario !== userId && !isUserAdmin) {
            return res.status(403).json({ message: "Você não tem permissão para excluir esta mensagem." });
        }

        await pool.query("DELETE FROM Mensagens WHERE id_mensagem = ?", [messageId]);

        const roomName = `group-${groupId}`;
        io.to(roomName).emit('group_message_deleted', { messageId: parseInt(messageId, 10), chatId: message.id_chat });

        res.status(200).json({ message: "Mensagem excluída com sucesso." });

    } catch (error) {
        next(error);
    }
});

module.exports = router;""