const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const saltRounds = 10;

// --- Configuração do Cloudinary ---
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Esta configuração usa as variáveis de ambiente que você colocou no Render e no seu .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configura o multer para fazer o upload diretamente para o Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'esquizocord_profiles', // Nome da pasta no Cloudinary para organizar os uploads
    format: async (req, file) => 'png', // Converte as imagens para png
    public_id: (req, file) => `user-${req.session.userId}-${Date.now()}`, // Cria um nome de arquivo único
  },
});

const upload = multer({ storage: storage });


// Middleware para proteger rotas que exigem login
function requireLogin(req, res, next) {
    if (req.session && req.session.userId) {
        return next(); // Se o usuário está na sessão, continua
    } else {
        return res.redirect('/login'); // Se não, redireciona para a página de login
    }
}


/* --- ROTAS GET PARA RENDERIZAR PÁGINAS --- */

router.get('/', (req, res) => res.render('Home'));
router.get('/login', (req, res) => res.render('Login'));
router.get('/cadastro', (req, res) => res.render('Cadastro'));

// ROTA GET PARA A PÁGINA DE CONFIGURAÇÕES (PROTEGIDA)
router.get('/configuracao', requireLogin, async (req, res, next) => {
    try {
        const pool = req.db;
        const userId = req.session.userId;

        // Busca os dados do usuário logado e os temas disponíveis em paralelo
        const [userResult, themesResult] = await Promise.all([
            pool.query("SELECT id_usuario, Nome, Email, Biografia, FotoPerfil, id_tema FROM Usuarios WHERE id_usuario = ?", [userId]),
            pool.query("SELECT * FROM Temas")
        ]);

        const user = userResult[0][0];
        const themes = themesResult[0];

        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }

        // Renderiza a página passando os dados do usuário e os temas
        res.render('Configuracao', { user: user, themes: themes });
    } catch (error) {
        console.error("Erro ao carregar a página de configurações:", error);
        next(error);
    }
});

// ROTA GET PARA O DASHBOARD (PROTEGIDA)
router.get('/dashboard', requireLogin, async (req, res, next) => {
    try {
        const pool = req.db;
        const userId = req.session.userId;

        // Busca os dados do usuário e os grupos a que pertence
        const [userResult] = await pool.query("SELECT id_usuario, Nome, FotoPerfil FROM Usuarios WHERE id_usuario = ?", [userId]);
        const [groupsResult] = await pool.query(
            "SELECT g.id_grupo, g.Nome, g.Foto FROM Grupos g " +
            "JOIN ParticipantesGrupo pg ON g.id_grupo = pg.id_grupo " +
            "WHERE pg.id_usuario = ?",
            [userId]
        );

        const user = userResult[0];
        const groups = groupsResult;

        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }

        // Dados de exemplo para a lista de amigos (você irá desenvolver a lógica para isto)
        const friends = [];

        res.render('Dashboard', { user: user, groups: groups, friends: friends });
    } catch (error) {
        console.error("Erro ao carregar o dashboard:", error);
        next(error);
    }
});

// ROTA PARA FAZER LOGOUT (SAIR)
router.get('/sair', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/configuracao');
        }
        res.clearCookie('connect.sid'); // Limpa o cookie da sessão
        res.redirect('/'); // Redireciona para a página inicial
    });
});


/* --- ROTAS POST PARA PROCESSAR DADOS --- */

// ROTA POST PARA O FORMULÁRIO DE CADASTRO
router.post('/cadastro', async (req, res, next) => {
  const { nome, email, senha, confirmar_senha } = req.body;
  if (senha !== confirmar_senha) {
    return res.status(400).send("Erro: As senhas não conferem.");
  }
  try {
    const senhaCriptografada = await bcrypt.hash(senha, saltRounds);
    const pool = req.db;
    const sql = "INSERT INTO Usuarios (Nome, Email, Senha) VALUES (?, ?, ?)";
    await pool.query(sql, [nome, email, senhaCriptografada]);
    res.redirect('/login');
  } catch (error) {
    next(error);
  }
});

// ROTA POST PARA O FORMULÁRIO DE LOGIN
router.post('/login', async (req, res, next) => {
  const { email, senha } = req.body;
  try {
    const pool = req.db;
    const sql = "SELECT * FROM Usuarios WHERE Email = ?";
    const [rows] = await pool.query(sql, [email]);

    if (rows.length === 0) {
      return res.status(401).send("Erro: Email ou senha inválidos.");
    }

    const user = rows[0];
    const match = await bcrypt.compare(senha, user.Senha);

    if (match) {
      // Login bem-sucedido: armazena o ID do usuário na sessão
      req.session.userId = user.id_usuario;
      res.redirect('/dashboard');
    } else {
      res.status(401).send("Erro: Email ou senha inválidos.");
    }
  } catch (error) {
    next(error);
  }
});

// ROTA POST PARA SALVAR AS CONFIGURAÇÕES DO PERFIL USANDO CLOUDINARY
router.post('/configuracao', requireLogin, upload.single('fotoPerfil'), async (req, res, next) => {
    try {
        const { nome, biografia, id_tema } = req.body;
        const userId = req.session.userId;
        const pool = req.db;

        // O multer-storage-cloudinary já fez o upload. O URL está em req.file.path.
        const fotoUrl = req.file ? req.file.path : null;
        
        let sql = "UPDATE Usuarios SET Nome = ?, Biografia = ?, id_tema = ?";
        const params = [nome, biografia, id_tema === 'null' ? null : id_tema];

        if (fotoUrl) {
            // Se uma nova foto foi enviada, guarda o URL seguro do Cloudinary
            sql += ", FotoPerfil = ?";
            params.push(fotoUrl);
        }

        sql += " WHERE id_usuario = ?";
        params.push(userId);
        
        await pool.query(sql, params);

        console.log(`Perfil do usuário ${userId} atualizado com sucesso.`);
        res.redirect('/configuracao');

    } catch (error) {
        console.error("Erro ao salvar as configurações:", error);
        next(error);
    }
});


module.exports = router;
