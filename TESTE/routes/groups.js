const express = require('express');
const router = express.Router();

// Importa a mesma configuração do multer e do Cloudinary de 'index.js'
// NOTA: Numa aplicação maior, esta configuração seria partilhada a partir de um ficheiro de configuração.
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'esquizocord_groups',
    format: async (req, file) => 'png',
    public_id: (req, file) => `group-${req.session.userId}-${Date.now()}`,
  },
});
const upload = multer({ storage: storage });

// Middleware para proteger as rotas
function requireLogin(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.status(401).json({ message: 'Acesso não autorizado' });
    }
}

// ROTA POST PARA CRIAR UM NOVO GRUPO
router.post('/criar', requireLogin, upload.single('foto'), async (req, res, next) => {
    const { nome } = req.body;
    const id_criador = req.session.userId;
    const fotoUrl = req.file ? req.file.path : null;
    
    if (!nome) {
        return res.status(400).json({ message: 'O nome do grupo é obrigatório.' });
    }

    const pool = req.db;
    const connection = await pool.getConnection(); // Usar transação para garantir consistência

    try {
        await connection.beginTransaction();

        // 1. Inserir o novo grupo na tabela Grupos
        const [groupResult] = await connection.query(
            "INSERT INTO Grupos (Nome, Foto, id_criador) VALUES (?, ?, ?)",
            [nome, fotoUrl, id_criador]
        );
        const newGroupId = groupResult.insertId;

        // 2. Inserir o criador como o primeiro participante
        await connection.query(
            "INSERT INTO ParticipantesGrupo (id_usuario, id_grupo) VALUES (?, ?)",
            [id_criador, newGroupId]
        );
        
        // 3. Inserir o criador como o primeiro administrador
        await connection.query(
            "INSERT INTO Administradores (id_usuario, id_grupo) VALUES (?, ?)",
            [id_criador, newGroupId]
        );
        
        // 4. (Opcional) Criar um canal de texto '#geral' por defeito para o novo grupo
        await connection.query(
            "INSERT INTO Chats (id_grupo, Nome) VALUES (?, 'geral')",
            [newGroupId]
        );

        await connection.commit(); // Se tudo correu bem, confirma as alterações
        res.status(201).json({ message: 'Grupo criado com sucesso!', groupId: newGroupId });

    } catch (error) {
        await connection.rollback(); // Se algo deu errado, desfaz tudo
        console.error("Erro ao criar grupo:", error);
        next(error);
    } finally {
        connection.release(); // Liberta a conexão de volta para o pool
    }
});

// ROTA GET PARA BUSCAR OS CANAIS E MEMBROS DE UM GRUPO
router.get('/:id/canais', requireLogin, async (req, res, next) => {
    const { id } = req.params;
    const pool = req.db;

    try {
        // Busca os canais
        const [channels] = await pool.query("SELECT id_chat, Nome FROM Chats WHERE id_grupo = ?", [id]);
        
        // Busca os membros e identifica quem é admin
        const [members] = await pool.query(
            "SELECT u.id_usuario, u.Nome, u.FotoPerfil, " +
            "(SELECT COUNT(*) FROM Administradores a WHERE a.id_usuario = u.id_usuario AND a.id_grupo = pg.id_grupo) > 0 AS isAdmin " +
            "FROM Usuarios u " +
            "JOIN ParticipantesGrupo pg ON u.id_usuario = pg.id_usuario " +
            "WHERE pg.id_grupo = ?",
            [id]
        );

        res.json({ channels, members });
    } catch (error) {
        console.error("Erro ao buscar dados do grupo:", error);
        next(error);
    }
});


module.exports = router;
