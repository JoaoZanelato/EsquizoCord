const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const saltRounds = 10;

// --- Configuração do Cloudinary e Multer ---
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'esquizocord_profiles',
    format: 'png',
    public_id: (req, file) => `user-${req.session.user.id_usuario}-${Date.now()}`,
  },
});
const upload = multer({ storage: storage });


// --- Middleware de Autenticação ---
function requireLogin(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect('/login');
    }
}


/* --- ROTAS GET --- */

router.get('/', (req, res) => res.render('Home'));
router.get('/login', (req, res) => res.render('Login'));
router.get('/cadastro', (req, res) => res.render('Cadastro'));

router.get('/dashboard', requireLogin, async (req, res, next) => {
    try {
        const pool = req.db;
        const user = req.session.user;

        // Buscar grupos do utilizador
        const [groups] = await pool.query(
            "SELECT g.id_grupo, g.Nome, g.Foto FROM Grupos g JOIN ParticipantesGrupo pg ON g.id_grupo = pg.id_grupo WHERE pg.id_usuario = ?",
            [user.id_usuario]
        );
        
        // Buscar amigos (status = aceite)
        const [friends] = await pool.query(
            "SELECT u.id_usuario, u.Nome, u.FotoPerfil FROM Usuarios u JOIN Amizades a ON (u.id_usuario = a.id_utilizador_requisitante OR u.id_usuario = a.id_utilizador_requisitado) WHERE (a.id_utilizador_requisitante = ? OR a.id_utilizador_requisitado = ?) AND a.status = 'aceite' AND u.id_usuario != ?",
            [user.id_usuario, user.id_usuario, user.id_usuario]
        );

        // Buscar pedidos de amizade pendentes (onde o utilizador logado é o 'requisitado')
        const [pendingRequests] = await pool.query(
             "SELECT u.id_usuario, u.Nome, u.FotoPerfil, a.id_amizade FROM Usuarios u JOIN Amizades a ON u.id_usuario = a.id_utilizador_requisitante WHERE a.id_utilizador_requisitado = ? AND a.status = 'pendente'",
             [user.id_usuario]
        );

        res.render('Dashboard', { 
            user: user, 
            groups: groups, 
            friends: friends,
            pendingRequests: pendingRequests
        });
    } catch (error) {
        next(error);
    }
});

router.get('/configuracao', requireLogin, async (req, res, next) => {
    try {
        const pool = req.db;
        const user = req.session.user;
        const [themes] = await pool.query("SELECT * FROM Temas");
        res.render('Configuracao', { user: user, themes: themes });
    } catch (error) {
        next(error);
    }
});

router.get('/sair', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.redirect('/configuracao');
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});


/* --- ROTAS POST --- */

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
      req.session.user = user;
      req.session.save(err => {
        if (err) return next(err);
        res.redirect('/dashboard');
      });
    } else {
      res.status(401).send("Erro: Email ou senha inválidos.");
    }
  } catch (error) {
    next(error);
  }
});

router.post('/configuracao', requireLogin, upload.single('fotoPerfil'), async (req, res, next) => {
    try {
        const { nome, biografia, id_tema } = req.body;
        const userId = req.session.user.id_usuario;
        const pool = req.db;
        const fotoUrl = req.file ? req.file.path : null;
        let sql = "UPDATE Usuarios SET Nome = ?, Biografia = ?, id_tema = ?";
        const params = [nome, biografia, id_tema === 'null' ? null : id_tema];
        if (fotoUrl) {
            sql += ", FotoPerfil = ?";
            params.push(fotoUrl);
        }
        sql += " WHERE id_usuario = ?";
        params.push(userId);
        await pool.query(sql, params);
        const [updatedUser] = await pool.query("SELECT * FROM Usuarios WHERE id_usuario = ?", [userId]);
        req.session.user = updatedUser[0];
        req.session.save(err => {
            if (err) return next(err);
            res.redirect('/configuracao');
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
