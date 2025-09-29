const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

const saltRounds = 10;
const { AI_USER_ID } = require('../utils/ia-helper');

// --- Configuração do Cloudinary e Multer (permanece igual) ---
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

// --- Middleware de Autenticação para API ---
// Em vez de redirecionar, agora retorna um erro 401 (Não Autorizado)
function requireLogin(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ message: 'Autenticação necessária.' });
}

// --- Configuração do Nodemailer (permanece igual) ---
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* --- ROTAS DA API --- */

// ROTA POST: /login
// Autentica o usuário e, em caso de sucesso, retorna os dados do usuário em JSON.
router.post('/login', async (req, res, next) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
  }
  try {
    const pool = req.db;
    const sql = `
        SELECT u.*, t.bckgrnd_color, t.main_color 
        FROM Usuarios u 
        LEFT JOIN Temas t ON u.id_tema = t.id_tema 
        WHERE u.Email = ?
    `;
    const [rows] = await pool.query(sql, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }
    
    const user = rows[0];
    const match = await bcrypt.compare(senha, user.Senha);

    if (match) {
      if (!user.email_verificado) {
        return res.status(403).json({ message: "Sua conta ainda não foi ativada. Por favor, verifique o link enviado para o seu e-mail." });
      }

      // Remove a senha do objeto antes de enviar a resposta
      delete user.Senha;
      
      req.session.user = user;
      res.status(200).json(user);

    } else {
      res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }
  } catch (error) {
    next(error);
  }
});

// ROTA POST: /cadastro
// Cria um novo usuário e envia o e-mail de verificação.
router.post('/cadastro', async (req, res, next) => {
    const { nome, email, senha, confirmar_senha } = req.body;

    if (senha !== confirmar_senha) {
        return res.status(400).json({ message: 'As senhas não conferem.' });
    }

    const pool = req.db;
    try {
        const [userExists] = await pool.query("SELECT id_usuario FROM Usuarios WHERE Nome = ?", [nome]);
        if (userExists.length > 0) {
            return res.status(409).json({ message: 'Este nome de usuário já está em uso.' });
        }

        const [emailExists] = await pool.query("SELECT id_usuario FROM Usuarios WHERE Email = ?", [email]);
        if (emailExists.length > 0) {
            return res.status(409).json({ message: 'Este endereço de e-mail já está registado.' });
        }

        const senhaCriptografada = await bcrypt.hash(senha, saltRounds);
        const token = crypto.randomBytes(32).toString('hex');

        await pool.query(
            "INSERT INTO Usuarios (Nome, Email, Senha, token_verificacao, email_verificado) VALUES (?, ?, ?, ?, 0)",
            [nome, email, senhaCriptografada, token]
        );

        // A URL agora deve apontar para a rota do seu frontend React
        const verificationLink = `http://localhost:3000/verificar-email?token=${token}`;
        
        await transporter.sendMail({
            from: '"EsquizoCord" <no-reply@esquizocord.com>',
            to: email,
            subject: "Verificação de E-mail - EsquizoCord",
            html: `<b>Olá ${nome}!</b><br><p>Obrigado por se cadastrar. Por favor, clique no link a seguir para ativar sua conta: <a href="${verificationLink}">${verificationLink}</a></p>`,
        });

        res.status(201).json({ message: "Cadastro realizado com sucesso! Um link de verificação foi enviado para o seu e-mail." });

    } catch (error) {
        next(error);
    }
});

// ROTA GET: /verificar-email
// Verifica o token de e-mail. Esta rota pode ser mantida, pois não renderiza uma view,
// mas apenas processa uma ação e depois o frontend pode redirecionar.
router.get('/verificar-email', async (req, res, next) => {
    try {
        const { token } = req.query;
        if (!token) {
            // Em uma API, você pode redirecionar para uma página de erro do frontend
            return res.redirect('http://localhost:3000/verificacao-falhou?erro=token_invalido');
        }
        
        const pool = req.db;
        const [result] = await pool.query(
            "UPDATE Usuarios SET email_verificado = 1, token_verificacao = NULL WHERE token_verificacao = ?",
            [token]
        );

        if (result.affectedRows === 0) {
            return res.redirect('http://localhost:3000/verificacao-falhou?erro=token_nao_encontrado');
        }

        // Redireciona para uma página de sucesso no frontend
        res.redirect('http://localhost:3000/verificacao-sucesso');

    } catch (error) {
        next(error);
    }
});

// ROTA GET: /dashboard
// Endpoint protegido que retorna os dados iniciais para o painel.
router.get('/dashboard', requireLogin, async (req, res, next) => {
    try {
        const pool = req.db;
        const user = req.session.user;
        const onlineUsers = req.app.get('onlineUsers') || new Set();

        const [groups] = await pool.query(
            "SELECT g.id_grupo, g.Nome, g.Foto FROM Grupos g JOIN ParticipantesGrupo pg ON g.id_grupo = pg.id_grupo WHERE pg.id_usuario = ?",
            [user.id_usuario]
        );
        
        const [friends] = await pool.query("SELECT u.id_usuario, u.Nome, u.FotoPerfil FROM Usuarios u JOIN Amizades a ON (u.id_usuario = a.id_utilizador_requisitante OR u.id_usuario = a.id_utilizador_requisitado) WHERE (a.id_utilizador_requisitante = ? OR a.id_utilizador_requisitado = ?) AND a.status = 'aceite' AND u.id_usuario != ?", [user.id_usuario, user.id_usuario, user.id_usuario]);
        
        const [aiUser] = await pool.query("SELECT id_usuario, Nome, FotoPerfil FROM Usuarios WHERE id_usuario = ?", [AI_USER_ID]);
        if (aiUser.length > 0 && !friends.some(friend => friend.id_usuario === aiUser[0].id_usuario)) {
            friends.unshift(aiUser[0]);
        }

        const [pendingRequests] = await pool.query("SELECT u.id_usuario, u.Nome, u.FotoPerfil, a.id_amizade FROM Usuarios u JOIN Amizades a ON u.id_usuario = a.id_utilizador_requisitante WHERE a.id_utilizador_requisitado = ? AND a.status = 'pendente'", [user.id_usuario]);
        const [sentRequests] = await pool.query("SELECT u.id_usuario, u.Nome, u.FotoPerfil, a.id_amizade FROM Usuarios u JOIN Amizades a ON u.id_usuario = a.id_utilizador_requisitado WHERE a.id_utilizador_requisitante = ? AND a.status = 'pendente'", [user.id_usuario]);

        res.json({ 
            groups, 
            friends,
            pendingRequests,
            sentRequests,
            onlineUserIds: Array.from(onlineUsers)
        });
    } catch (error) { next(error); }
});

// ROTA POST: /configuracao
// Atualiza as informações do perfil do usuário.
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

        // Atualiza a sessão com os novos dados do usuário
        const [updatedUserResult] = await pool.query(
            `SELECT u.*, t.bckgrnd_color, t.main_color 
             FROM Usuarios u 
             LEFT JOIN Temas t ON u.id_tema = t.id_tema 
             WHERE u.id_usuario = ?`,
            [userId]
        );
        delete updatedUserResult[0].Senha;
        req.session.user = updatedUserResult[0];

        res.status(200).json(updatedUserResult[0]);
    } catch (error) {
        next(error);
    }
});

// ROTA GET: /temas
// Nova rota para o React buscar a lista de temas disponíveis.
router.get('/temas', requireLogin, async (req, res, next) => {
    try {
        const pool = req.db;
        const [themes] = await pool.query("SELECT * FROM Temas");
        res.json(themes);
    } catch (error) {
        next(error);
    }
});

// ROTA POST: /sair
// Faz o logout do usuário.
router.post('/sair', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Não foi possível fazer logout.' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logout realizado com sucesso.' });
    });
});

// ROTA GET: /session
// Uma rota útil para o frontend verificar se o usuário ainda está logado.
router.get('/session', (req, res) => {
  if (req.session && req.session.user) {
    res.status(200).json({ user: req.session.user });
  } else {
    res.status(401).json({ user: null });
  }
});


/* --- ROTAS DE RECUPERAÇÃO DE SENHA (a lógica permanece, mas as respostas são JSON) --- */
router.post('/esqueceu-senha', async (req, res, next) => {
    try {
        const { email } = req.body;
        const pool = req.db;
        const [users] = await pool.query("SELECT * FROM Usuarios WHERE Email = ?", [email]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'Este e-mail não está registado na nossa plataforma.' });
        }
        
        const user = users[0];
        const token = crypto.randomBytes(32).toString('hex');
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1);

        await pool.query(
            "UPDATE Usuarios SET token_redefinir_senha = ?, expiracao_token_redefinir_senha = ? WHERE id_usuario = ?",
            [token, expiryDate, user.id_usuario]
        );

        // A URL deve apontar para a rota de redefinição no frontend
        const resetLink = `http://localhost:3000/redefinir-senha?token=${token}`;

        await transporter.sendMail({
            from: '"EsquizoCord" <no-reply@esquizocord.com>',
            to: user.Email,
            subject: "Recuperação de Senha - EsquizoCord",
            html: `<b>Olá ${user.Nome}!</b><br><p>Recebemos um pedido para redefinir a sua senha. Por favor, clique no link a seguir para criar uma nova senha: <a href="${resetLink}">${resetLink}</a></p><p>Se não foi você que solicitou, por favor ignore este e-mail.</p>`,
        });

        res.status(200).json({ message: 'Um link de recuperação foi enviado para o seu e-mail.' });

    } catch (error) {
        next(error);
    }
});

router.post('/redefinir-senha', async (req, res, next) => {
    try {
        const { token, senha, confirmar_senha } = req.body;
        if (senha !== confirmar_senha) {
            return res.status(400).json({ message: 'As senhas não coincidem.' });
        }

        const pool = req.db;
        const [users] = await pool.query(
            "SELECT * FROM Usuarios WHERE token_redefinir_senha = ? AND expiracao_token_redefinir_senha > NOW()",
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'O link de redefinição é inválido ou expirou.' });
        }

        const user = users[0];
        const senhaCriptografada = await bcrypt.hash(senha, saltRounds);

        await pool.query(
            "UPDATE Usuarios SET Senha = ?, token_redefinir_senha = NULL, expiracao_token_redefinir_senha = NULL WHERE id_usuario = ?",
            [senhaCriptografada, user.id_usuario]
        );
        
        res.status(200).json({ message: "Senha redefinida com sucesso! Você já pode fazer login." });

    } catch (error) {
        next(error);
    }
});

module.exports = router;