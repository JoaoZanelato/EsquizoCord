const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
    destination: './public/uploads/group_photos/',
    filename: function(req, file, cb){
        cb(null, 'group-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware de autenticação
function requireLogin(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ message: 'Acesso não autorizado' });
}

// ROTA PARA CRIAR UM NOVO GRUPO
router.post('/criar', requireLogin, upload.single('foto'), async (req, res, next) => {
    const { nome, isPrivate } = req.body;
    const fotoPath = req.file ? `/uploads/group_photos/${req.file.filename}` : null;
    const isPrivateGroup = isPrivate === 'on' ? 1 : 0;
    const creatorId = req.session.user.id_usuario;
    const pool = req.db;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Inserir o grupo
        const [groupResult] = await connection.query(
            "INSERT INTO Grupos (Nome, Foto, IsPrivate, id_criador) VALUES (?, ?, ?, ?)",
            [nome, fotoPath, isPrivateGroup, creatorId]
        );
        const groupId = groupResult.insertId;

        // 2. Adicionar o criador como participante
        await connection.query(
            "INSERT INTO ParticipantesGrupo (id_usuario, id_grupo) VALUES (?, ?)",
            [creatorId, groupId]
        );

        // 3. Adicionar o criador como administrador
        await connection.query(
            "INSERT INTO Administradores (id_usuario, id_grupo) VALUES (?, ?)",
            [creatorId, groupId]
        );

        // 4. Criar um canal de texto padrão 'geral'
        await connection.query(
            "INSERT INTO Chats (id_grupo, Nome) VALUES (?, 'geral')",
            [groupId]
        );

        await connection.commit();
        res.redirect('/dashboard');
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
});

// ROTA PARA BUSCAR DETALHES DE UM GRUPO (CORRIGIDA)
router.get('/:groupId/details', requireLogin, async (req, res, next) => {
    const { groupId } = req.params;
    const pool = req.db;
    try {
        const [detailsResult] = await pool.query("SELECT * FROM Grupos WHERE id_grupo = ?", [groupId]);
        if (detailsResult.length === 0) {
            return res.status(404).json({ message: "Grupo não encontrado." });
        }
        const details = detailsResult[0];

        // --- ESTA É A CONSULTA CORRIGIDA E MAIS ROBUSTA ---
        const [members] = await pool.query(
            `SELECT 
                u.id_usuario, 
                u.Nome, 
                u.FotoPerfil,
                -- Um usuário é admin se ele for o criador OU estiver na tabela de administradores
                (g.id_criador = u.id_usuario OR a.id_admin IS NOT NULL) as isAdmin
            FROM 
                ParticipantesGrupo pg
            JOIN 
                Usuarios u ON pg.id_usuario = u.id_usuario
            JOIN
                Grupos g ON pg.id_grupo = g.id_grupo
            LEFT JOIN 
                Administradores a ON pg.id_usuario = a.id_usuario AND pg.id_grupo = a.id_grupo
            WHERE 
                pg.id_grupo = ?
            GROUP BY u.id_usuario`, // Agrupar para garantir um resultado por usuário
            [groupId]
        );

        const [channels] = await pool.query("SELECT * FROM Chats WHERE id_grupo = ?", [groupId]);

        res.json({ details, members, channels });
    } catch (error) {
        console.error("Erro ao buscar detalhes do grupo:", error); // Adiciona log para depuração
        next(error);
    }
});


// ROTA PARA BUSCAR MENSAGENS DE UM CHAT
router.get('/chats/:chatId/messages', requireLogin, async (req, res, next) => {
    const { chatId } = req.params;
    const pool = req.db;
    try {
        const query = `
            SELECT 
                m.id_mensagem, m.id_usuario, m.ConteudoCriptografado, m.Nonce, m.DataHora,
                u.Nome as autorNome, u.FotoPerfil as autorFoto,
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
            LIMIT 100;
        `;
        const [messages] = await pool.query(query, [chatId]);
        // A lógica de descriptografia deve ser feita no frontend ou aqui se tiver a chave
        res.json(messages);
    } catch (error) {
        next(error);
    }
});

// ROTA PARA ENVIAR MENSAGEM EM UM CHAT
router.post('/chats/:chatId/messages', requireLogin, async (req, res, next) => {
    const { chatId } = req.params;
    const { content, replyingToMessageId } = req.body;
    const userId = req.session.user.id_usuario;
    const pool = req.db;
    const io = req.app.get('io');

    if (!content) {
        return res.status(400).json({ message: "Conteúdo não pode ser vazio." });
    }

    // A criptografia deve ser feita no frontend
    const { ConteudoCriptografado, Nonce } = req.body;

    try {
        const [result] = await pool.query(
            "INSERT INTO Mensagens (id_chat, id_usuario, ConteudoCriptografado, Nonce, id_mensagem_respondida) VALUES (?, ?, ?, ?, ?)",
            [chatId, userId, ConteudoCriptografado, Nonce, replyingToMessageId || null]
        );
        
        const [userResult] = await pool.query("SELECT Nome, FotoPerfil FROM Usuarios WHERE id_usuario = ?", [userId]);
        
        const messageData = {
            id_mensagem: result.insertId,
            id_chat: parseInt(chatId, 10),
            id_usuario: userId,
            Conteudo: content, // Envia o conteúdo descriptografado para o socket
            DataHora: new Date(),
            autorNome: userResult[0].Nome,
            autorFoto: userResult[0].FotoPerfil,
            id_mensagem_respondida: replyingToMessageId || null
        };

        // Se for uma resposta, busca os dados da mensagem original
        if (replyingToMessageId) {
            const [repliedMsgArr] = await pool.query(
                `SELECT m.ConteudoCriptografado, m.Nonce, u.Nome as autorNome, u.id_usuario as autorId 
                 FROM Mensagens m JOIN Usuarios u ON m.id_usuario = u.id_usuario 
                 WHERE m.id_mensagem = ?`, [replyingToMessageId]);
            if (repliedMsgArr.length > 0) {
                // A descriptografia deve ocorrer no cliente
                messageData.repliedTo = {
                    autorNome: repliedMsgArr[0].autorNome,
                    autorId: repliedMsgArr[0].autorId,
                    Conteudo: "Conteúdo criptografado" // Placeholder
                };
            }
        }

        io.to(`group-${chatId}`).emit('new_group_message', messageData);
        res.status(201).json(messageData);
    } catch (error) {
        next(error);
    }
});

// ROTA PARA EXCLUIR UMA MENSAGEM DE GRUPO
router.delete('/messages/:messageId', requireLogin, async (req, res, next) => {
    const { messageId } = req.params;
    const currentUserId = req.session.user.id_usuario;
    const pool = req.db;
    const io = req.app.get('io');
    
    try {
        const [msgResult] = await pool.query("SELECT id_usuario, id_chat FROM Mensagens WHERE id_mensagem = ?", [messageId]);
        if (msgResult.length === 0) return res.status(404).json({ message: "Mensagem não encontrada." });

        const message = msgResult[0];
        const [groupResult] = await pool.query("SELECT id_criador FROM Grupos g JOIN Chats c ON g.id_grupo = c.id_grupo WHERE c.id_chat = ?", [message.id_chat]);
        const [adminResult] = await pool.query("SELECT id_admin FROM Administradores a JOIN Chats c ON a.id_grupo = c.id_grupo WHERE c.id_chat = ? AND a.id_usuario = ?", [message.id_chat, currentUserId]);

        const isCreator = groupResult[0].id_criador === currentUserId;
        const isAdmin = adminResult.length > 0;
        const isAuthor = message.id_usuario === currentUserId;

        if (!isAuthor && !isAdmin && !isCreator) {
            return res.status(403).json({ message: "Você não tem permissão para excluir esta mensagem." });
        }

        await pool.query("UPDATE Mensagens SET id_mensagem_respondida = NULL WHERE id_mensagem_respondida = ?", [messageId]);
        await pool.query("DELETE FROM Mensagens WHERE id_mensagem = ?", [messageId]);

        io.to(`group-${message.id_chat}`).emit('group_message_deleted', { messageId: parseInt(messageId, 10), chatId: message.id_chat });
        res.status(200).json({ message: "Mensagem excluída com sucesso." });
    } catch (error) {
        next(error);
    }
});


// ROTA PARA UM USUÁRIO ENTRAR EM UM GRUPO
router.post('/:groupId/join', requireLogin, async (req, res, next) => {
    const { groupId } = req.params;
    const userId = req.session.user.id_usuario;
    const pool = req.db;
    try {
        await pool.query("INSERT INTO ParticipantesGrupo (id_usuario, id_grupo) VALUES (?, ?)", [userId, groupId]);
        res.status(200).json({ message: "Você entrou no grupo!" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Você já está neste grupo." });
        }
        next(error);
    }
});

// ROTA PARA PESQUISAR GRUPOS PÚBLICOS
router.get('/search', requireLogin, async (req, res, next) => {
    const { q } = req.query;
    const pool = req.db;
    try {
        const query = "SELECT id_grupo, Nome, Foto FROM Grupos WHERE IsPrivate = 0 AND Nome LIKE ?";
        const [groups] = await pool.query(query, [`%${q}%`]);
        res.json(groups);
    } catch (error) {
        next(error);
    }
});

// ROTA PARA ATUALIZAR CONFIGURAÇÕES DO GRUPO
router.post('/:groupId/settings', requireLogin, upload.single('foto'), async (req, res, next) => {
    // Implementar lógica de permissão (verificar se é admin)
    // ...
    res.send("Rota de settings a ser implementada");
});

// ROTA PARA EXCLUIR UM GRUPO
router.delete('/:groupId', requireLogin, async (req, res, next) => {
    const { groupId } = req.params;
    const userId = req.session.user.id_usuario;
    const pool = req.db;
    const connection = await pool.getConnection();

    try {
        const [groupResult] = await connection.query("SELECT id_criador FROM Grupos WHERE id_grupo = ?", [groupId]);
        if (groupResult.length === 0) {
            return res.status(404).json({ message: "Grupo não encontrado." });
        }
        if (groupResult[0].id_criador !== userId) {
            return res.status(403).json({ message: "Apenas o criador pode excluir o grupo." });
        }

        await connection.beginTransaction();
        // A ordem é importante para respeitar as chaves estrangeiras
        await connection.query("DELETE FROM Mensagens WHERE id_chat IN (SELECT id_chat FROM Chats WHERE id_grupo = ?)", [groupId]);
        await connection.query("DELETE FROM Chats WHERE id_grupo = ?", [groupId]);
        await connection.query("DELETE FROM Administradores WHERE id_grupo = ?", [groupId]);
        await connection.query("DELETE FROM ParticipantesGrupo WHERE id_grupo = ?", [groupId]);
        await connection.query("DELETE FROM Grupos WHERE id_grupo = ?", [groupId]);
        
        await connection.commit();
        res.status(200).json({ message: "Grupo excluído com sucesso." });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
});

module.exports = router;