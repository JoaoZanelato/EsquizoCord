const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const saltRounds = 10;

// --- NOVOS MÓDULOS PARA VERIFICAÇÃO DE E-MAIL ---
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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
  params: (req, file) => {
    const userId = req.session.user ? req.session.user.id_usuario : 'unknown_user';
    return {
      folder: 'esquizocord_profiles',
      format: 'png',
      public_id: `user-${userId}-${Date.now()}`,
    };
  },
});
const upload = multer({ storage: storage });


// --- Middleware de Autenticação ---
function requireLogin(req, res, next) {
    if (req.session && req.session.user) return next();
    return res.redirect('/login');
}

// --- CONFIGURAÇÃO DO NODEMAILER ---
// (Substitua pela configuração do seu provedor de e-mail em um ambiente de produção)
// (Lembre-se de colocar as credenciais em variáveis de ambiente no seu arquivo .env)
let transporter = nodemailer.createTransport({
  service: 'gmail', // ou outro serviço
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


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
        
        // Buscar amigos e pedidos
        const [friends] = await pool.query("SELECT u.id_usuario, u.Nome, u.FotoPerfil FROM Usuarios u JOIN Amizades a ON (u.id_usuario = a.id_utilizador_requisitante OR u.id_usuario = a.id_utilizador_requisitado) WHERE (a.id_utilizador_requisitante = ? OR a.id_utilizador_requisitado = ?) AND a.status = 'aceite' AND u.id_usuario != ?", [user.id_usuario, user.id_usuario, user.id_usuario]);
        const [pendingRequests] = await pool.query("SELECT u.id_usuario, u.Nome, u.FotoPerfil, a.id_amizade FROM Usuarios u JOIN Amizades a ON u.id_usuario = a.id_utilizador_requisitante WHERE a.id_utilizador_requisitado = ? AND a.status = 'pendente'", [user.id_usuario]);
        const [sentRequests] = await pool.query("SELECT u.id_usuario, u.Nome, u.FotoPerfil, a.id_amizade FROM Usuarios u JOIN Amizades a ON u.id_usuario = a.id_utilizador_requisitado WHERE a.id_utilizador_requisitante = ? AND a.status = 'pendente'", [user.id_usuario]);

        res.render('Dashboard', { 
            user: user, 
            groups: groups, 
            friends: friends,
            pendingRequests: pendingRequests,
            sentRequests: sentRequests
        });
    } catch (error) { next(error); }
});

router.get('/configuracao', requireLogin, async (req, res, next) => {
    try {
        const pool = req.db;
        const user = req.session.user;
        const [themes] = await pool.query("SELECT * FROM Temas");
        res.render('Configuracao', { user: user, themes: themes });
    } catch (error) { next(error); }
});

router.get('/sair', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.redirect('/configuracao');
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

router.get('/verificar-email', async (req, res, next) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).render('Verificacao', {
                titulo: 'Erro',
                sucesso: false,
                mensagem: 'Token de verificação não fornecido ou inválido.'
            });
        }
        
        const pool = req.db;
        const [result] = await pool.query(
            "UPDATE Usuarios SET email_verificado = 1, token_verificacao = NULL WHERE token_verificacao = ?",
            [token]
        );

        if (result.affectedRows === 0) {
            return res.status(400).render('Verificacao', {
                titulo: 'Erro na Verificação',
                sucesso: false,
                mensagem: 'Este token é inválido, expirou ou a conta já foi ativada.'
            });
        }

        res.render('Verificacao', {
            titulo: 'Sucesso!',
            sucesso: true
        });

    } catch (error) {
        next(error);
    }
});


/* --- ROTAS POST --- */

// --- ROTA DE CADASTRO ATUALIZADA ---
router.post('/cadastro', async (req, res, next) => {
  const { nome, email, senha, confirmar_senha } = req.body;
  if (senha !== confirmar_senha) {
    return res.status(400).send("Erro: As senhas não conferem.");
  }
  
  const pool = req.db;

  try {
    // 1. Verifica se o nome ou e-mail já existem
    const [existingUsers] = await pool.query("SELECT Nome, Email FROM Usuarios WHERE Nome = ? OR Email = ?", [nome, email]);
    if (existingUsers.length > 0) {
      return res.status(409).send("Erro: Nome de usuário ou e-mail já está em uso.");
    }
    
    // 2. Criptografa a senha e gera o token
    const senhaCriptografada = await bcrypt.hash(senha, saltRounds);
    const token = crypto.randomBytes(32).toString('hex');
    
    // 3. Insere o novo usuário com o token
    await pool.query(
        "INSERT INTO Usuarios (Nome, Email, Senha, token_verificacao, email_verificado) VALUES (?, ?, ?, ?, 0)",
        [nome, email, senhaCriptografada, token]
    );

    // 4. Envia o e-mail de verificação
    const verificationLink = `http://${req.headers.host}/verificar-email?token=${token}`;
    await transporter.sendMail({
        from: '"EsquizoCord" <no-reply@esquizocord.com>',
        to: email,
        subject: "Verificação de E-mail - EsquizoCord",
        html: `<b>Olá ${nome}!</b><br><p>Obrigado por se cadastrar. Por favor, clique no link a seguir para ativar sua conta: <a href="${verificationLink}">${verificationLink}</a></p>`,
    });

    res.send("Cadastro realizado com sucesso! Um link de verificação foi enviado para o seu e-mail.");

  } catch (error) {
    // Trata o erro específico de entrada duplicada do DB
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).send('Erro: Nome de usuário ou e-mail já cadastrado.');
    }
    next(error); 
  }
});


// --- ROTA DE LOGIN ATUALIZADA ---
router.post('/login', async (req, res, next) => {
  const { email, senha } = req.body;
  try {
    const pool = req.db;
    const sql = `
        SELECT u.*, t.bckgrnd_color, t.main_color 
        FROM Usuarios u 
        LEFT JOIN Temas t ON u.id_tema = t.id_tema 
        WHERE u.Email = ?
    `;
    const [rows] = await pool.query(sql, [email]);

    if (rows.length === 0) return res.status(401).send("Erro: Email ou senha inválidos.");
    
    const user = rows[0];
    const match = await bcrypt.compare(senha, user.Senha);

    if (match) {
      // 1. Verifica se o e-mail do usuário foi verificado
      if (!user.email_verificado) {
          return res.status(403).send("Erro: Sua conta ainda não foi verificada. Por favor, verifique seu e-mail.");
      }

      // 2. Se verificado, cria a sessão e redireciona
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
        const params = [nome, biografia, id_tema === 'null' ? null : parseInt(id_tema, 10)];

        if (fotoUrl) {
            sql += ", FotoPerfil = ?";
            params.push(fotoUrl);
        }
        sql += " WHERE id_usuario = ?";
        params.push(userId);
        
        await pool.query(sql, params);

        const [updatedUserResult] = await pool.query(
            `SELECT u.*, t.bckgrnd_color, t.main_color 
             FROM Usuarios u 
             LEFT JOIN Temas t ON u.id_tema = t.id_tema 
             WHERE u.id_usuario = ?`,
            [userId]
        );
        req.session.user = updatedUserResult[0];

        req.session.save(err => {
            if (err) return next(err);
            res.redirect('/configuracao');
        });
    } catch (error) {
        next(error);
    }
});

// Rota para verificar e-mail (para recuperação de conta, etc. - manter se necessário)
router.post('/verificar-email', async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ valido: false, mensagem: 'Email não fornecido.' });
  }

  try {
    const pool = req.db;
    const [rows] = await pool.query("SELECT * FROM Usuarios WHERE Email = ?", [email]);

    if (rows.length === 0) {
      return res.status(404).json({ valido: false, mensagem: 'Email não encontrado.' });
    }

    res.json({ valido: true, mensagem: 'Email encontrado.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;