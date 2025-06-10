const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const saltRounds = 10;

// Configuração do Multer para upload de imagens de perfil
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Certifique-se de que esta pasta existe no seu projeto: public/images/uploads
    cb(null, 'public/images/uploads/'); 
  },
  filename: function (req, file, cb) {
    // Garante um nome de ficheiro único adicionando a data e o ID do utilizador
    const userId = req.session.userId;
    cb(null, `user-${userId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage: storage });


// Middleware para proteger rotas que exigem login
function requireLogin(req, res, next) {
    if (req.session && req.session.userId) {
        return next(); // Se o utilizador está na sessão, continua
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

        // Busca os dados do utilizador logado e os temas disponíveis em paralelo
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

        // Busca os dados do utilizador e os grupos a que pertence
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

        // Dados de exemplo para a lista de amigos
        const friends = [
            { id: 1, nome: 'Amigo Exemplo 1', status: 'online', foto: '/images/logo.png' },
            { id: 2, nome: 'Amigo Exemplo 2', status: 'offline', foto: '/images/logo.png' }
        ];

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
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});


/* --- ROTAS POST PARA PROCESSAR DADOS --- */
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
      req.session.userId = user.id_usuario;
      res.redirect('/dashboard'); // Redireciona para o novo dashboard
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
        const userId = req.session.userId;
        const pool = req.db;
        let fotoPath = null;
        if (req.file) {
            fotoPath = `/images/uploads/${req.file.filename}`;
        }
        let sql = "UPDATE Usuarios SET Nome = ?, Biografia = ?, id_tema = ?";
        const params = [nome, biografia, id_tema === 'null' ? null : id_tema];
        if (fotoPath) {
            sql += ", FotoPerfil = ?";
            params.push(fotoPath);
        }
        sql += " WHERE id_usuario = ?";
        params.push(userId);
        await pool.query(sql, params);
        res.redirect('/configuracao');
    } catch (error) {
        next(error);
    }
});

module.exports = router;
