const express = require('express');
const router = express.Router();
const multer = 'multer';

// --- Configuração do Cloudinary (reutilizada) ---
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuração de armazenamento ATUALIZADA para aceder à sessão de forma segura
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // A lógica para gerar o public_id é movida para dentro de uma função
    // para garantir que 'req.session.user' já existe quando for acedido.
    const userId = req.session.user ? req.session.user.id_usuario : 'unknown_user';
    return {
      folder: 'esquizocord_groups',
      format: 'png',
      public_id: `group-${userId}-${Date.now()}`,
    };
  },
});
const upload = multer({ storage: storage });


// --- Middlewares ---
function requireLogin(req, res, next) {
    if (req.session && req.session.user) return next();
    return res.status(401).json({ message: 'Acesso não autorizado' });
}
async function isGroupCreator(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.session.user.id_usuario;
        const pool = req.db;
        const [rows] = await pool.query("SELECT id_criador FROM Grupos WHERE id_grupo = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Grupo não encontrado." });
        if (rows[0].id_criador !== userId) return res.status(403).json({ message: "Apenas o criador pode alterar as configurações do grupo." });
        return next();
    } catch (error) { next(error); }
}

// --- ROTAS ---

// ROTA GET PARA PROCURAR GRUPOS PÚBLICOS
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

// ROTA POST PARA ENTRAR NUM GRUPO
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
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({ message: "Grupo não encontrado." });
        }
        next(error);
    }
});

// ROTA POST PARA CRIAR UM NOVO GRUPO (COM DIAGNÓSTICO MELHORADO)
router.post('/criar', requireLogin, upload.single('foto'), async (req, res, next) => {
    console.log('[LOG 1] Rota /groups/criar alcançada.');
    
    if (!req.session.user || !req.session.user.id_usuario) {
        console.error("[ERRO LOG] Sessão de utilizador inválida na rota de criação de grupo.");
        return res.status(401).json({ message: "Sessão inválida. Por favor, faça login novamente." });
    }

    const { nome, isPrivate } = req.body;
    const id_criador = req.session.user.id_usuario; 
    const fotoUrl = req.file ? req.file.path : null;
    const isPrivateBool = isPrivate === 'on';
    
    console.log(`[LOG 2] Dados recebidos: Nome=${nome}, Privado=${isPrivateBool}, Criador=${id_criador}`);

    if (!nome) return res.status(400).json({ message: 'O nome do grupo é obrigatório.' });

    const pool = req.db;
    const connection = await pool.getConnection();
    console.log('[LOG 3] Conexão com a base de dados obtida.');

    try {
        await connection.beginTransaction();
        console.log('[LOG 4] Transação iniciada.');

        const [groupResult] = await connection.query(
            "INSERT INTO Grupos (Nome, Foto, IsPrivate, id_criador) VALUES (?, ?, ?, ?)",
            [nome, fotoUrl, isPrivateBool, id_criador]
        );
        const newGroupId = groupResult.insertId;
        console.log(`[LOG 5] Grupo ${newGroupId} inserido na tabela Grupos.`);

        await connection.query("INSERT INTO ParticipantesGrupo (id_usuario, id_grupo) VALUES (?, ?)", [id_criador, newGroupId]);
        console.log(`[LOG 6] Criador ${id_criador} inserido como participante.`);

        await connection.query("INSERT INTO Administradores (id_usuario, id_grupo) VALUES (?, ?)", [id_criador, newGroupId]);
        console.log(`[LOG 7] Criador ${id_criador} inserido como administrador.`);

        await connection.query("INSERT INTO Chats (id_grupo, Nome) VALUES (?, 'geral')", [newGroupId]);
        console.log(`[LOG 8] Canal #geral criado para o grupo ${newGroupId}.`);
        
        await connection.commit();
        console.log('[LOG 9] Transação concluída com sucesso (commit).');

        res.status(201).json({ message: 'Grupo criado com sucesso!', groupId: newGroupId });
    } catch (error) {
        await connection.rollback();
        console.error("[ERRO DETALHADO NO CATCH]", error);
        res.status(500).json({ message: "Ocorreu um erro no servidor ao criar o grupo.", error: error.message });
    } finally {
        console.log('[LOG 10] Libertando conexão com a base de dados.');
        connection.release();
    }
});


// ROTA GET PARA BUSCAR OS DETALHES DE UM GRUPO
router.get('/:id/details', requireLogin, async (req, res, next) => {
    const { id } = req.params;
    const pool = req.db;
    try {
        const [details] = await pool.query("SELECT * FROM Grupos WHERE id_grupo = ?", [id]);
        const [channels] = await pool.query("SELECT id_chat, Nome FROM Chats WHERE id_grupo = ?", [id]);
        const [members] = await pool.query(
            "SELECT u.id_usuario, u.Nome, u.FotoPerfil, (SELECT COUNT(*) FROM Administradores a WHERE a.id_usuario = u.id_usuario AND a.id_grupo = pg.id_grupo) > 0 AS isAdmin FROM Usuarios u JOIN ParticipantesGrupo pg ON u.id_usuario = pg.id_usuario WHERE pg.id_grupo = ?",
            [id]
        );
        if (details.length === 0) return res.status(404).json({ message: 'Grupo não encontrado.' });
        res.json({ details: details[0], channels, members });
    } catch (error) { next(error); }
});

// ROTA POST PARA ATUALIZAR AS CONFIGURAÇÕES DE UM GRUPO
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

module.exports = router;
