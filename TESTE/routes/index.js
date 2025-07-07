const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const saltRounds = 10;
const { AI_USER_ID } = require('../utils/ia-helper');

// Módulos para verificação de e-mail e recuperação de senha
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

// --- Configuração do Nodemailer ---
// Lembre-se de colocar as credenciais em variáveis de ambiente no seu arquivo .env
let transporter = nodemailer.createTransport({
  service: 'gmail',
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
        const onlineUsers = req.app.get('onlineUsers') || new Set();

        // Buscar grupos do utilizador
        const [groups] = await pool.query(
            "SELECT g.id_grupo, g.Nome, g.Foto FROM Grupos g JOIN ParticipantesGrupo pg ON g.id_grupo = pg.id_grupo WHERE pg.id_usuario = ?",
            [user.id_usuario]
        );
        
        // Buscar amigos
        const [friends] = await pool.query("SELECT u.id_usuario, u.Nome, u.FotoPerfil FROM Usuarios u JOIN Amizades a ON (u.id_usuario = a.id_utilizador_requisitante OR u.id_usuario = a.id_utilizador_requisitado) WHERE (a.id_utilizador_requisitante = ? OR a.id_utilizador_requisitado = ?) AND a.status = 'aceite' AND u.id_usuario != ?", [user.id_usuario, user.id_usuario, user.id_usuario]);
        
        // --- ALTERAÇÃO INSERIDA ---
        // Buscar dados da IA para adicioná-la à lista de amigos
        const [aiUser] = await pool.query("SELECT id_usuario, Nome, FotoPerfil FROM Usuarios WHERE id_usuario = ?", [AI_USER_ID]);

        // Adicionar a IA no início da lista de amigos se ela for encontrada
        if (aiUser.length > 0) {
            if (!friends.some(friend => friend.id_usuario === aiUser[0].id_usuario)) {
                friends.unshift(aiUser[0]);
            }
        }
        // --- FIM DA ALTERAÇÃO ---

        const [pendingRequests] = await pool.query("SELECT u.id_usuario, u.Nome, u.FotoPerfil, a.id_amizade FROM Usuarios u JOIN Amizades a ON u.id_usuario = a.id_utilizador_requisitante WHERE a.id_utilizador_requisitado = ? AND a.status = 'pendente'", [user.id_usuario]);
        const [sentRequests] = await pool.query("SELECT u.id_usuario, u.Nome, u.FotoPerfil, a.id_amizade FROM Usuarios u JOIN Amizades a ON u.id_usuario = a.id_utilizador_requisitado WHERE a.id_utilizador_requisitante = ? AND a.status = 'pendente'", [user.id_usuario]);

        res.render('Dashboard', { 
            user: user, 
            groups: groups, 
            friends: friends, // A lista de amigos agora inclui a IA
            pendingRequests: pendingRequests,
            sentRequests: sentRequests,
            onlineUserIds: Array.from(onlineUsers) // Passa a lista de IDs de usuários online
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

// Rota para validar o token de e-mail de cadastro
router.get('/verificar-email', async (req, res, next) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).render('Verificacao', { // Corrigido para 'Verificacao' com 'V' maiúsculo
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
            return res.status(400).render('Verificacao', { // Corrigido para 'Verificacao' com 'V' maiúsculo
                titulo: 'Erro na Verificação',
                sucesso: false,
                mensagem: 'Este token é inválido, expirou ou a conta já foi ativada.'
            });
        }

        res.render('Verificacao', { // Corrigido para 'Verificacao' com 'V' maiúsculo
            titulo: 'Sucesso!',
            sucesso: true
        });

    } catch (error) {
        next(error);
    }
});


/* --- ROTAS DE RECUPERAÇÃO DE SENHA --- */

// Rota para mostrar o formulário de "esqueceu a senha"
router.get('/esqueceu-senha', (req, res) => {
    res.render('Esqueceu-senha', { success: null, error: null });
});

// Rota para mostrar o formulário de redefinição de senha
router.get('/redefinir-senha', async (req, res, next) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.redirect('/esqueceu-senha');
        }

        const pool = req.db;
        const [users] = await pool.query(
            "SELECT * FROM Usuarios WHERE token_redefinir_senha = ? AND expiracao_token_redefinir_senha > NOW()",
            [token]
        );

        if (users.length === 0) {
            return res.render('Redefinir-senha', { token: null, error: 'O link de redefinição é inválido ou expirou. Por favor, tente novamente.' });
        }

        res.render('Redefinir-senha', { token, error: null });

    } catch (error) {
        next(error);
    }
});

router.get('/mensagem', (req, res) => {
    const { titulo, mensagem } = req.query;
    if (!titulo || !mensagem) {
        return res.redirect('/login');
    }
    res.render('Mensagem', { titulo: titulo, mensagem: mensagem });
});

/* --- ROTAS POST --- */

// Rota de cadastro
router.post('/cadastro', async (req, res, next) => {
  const { nome, email, senha, confirmar_senha } = req.body;
  if (senha !== confirmar_senha) {
    return res.status(400).send("Erro: As senhas não conferem.");
  }
  
  const pool = req.db;

  try {
    const [existingUsers] = await pool.query("SELECT Nome, Email FROM Usuarios WHERE Nome = ? OR Email = ?", [nome, email]);
    if (existingUsers.length > 0) {
      return res.status(409).send("Erro: Nome de usuário ou e-mail já está em uso.");
    }
    
    const senhaCriptografada = await bcrypt.hash(senha, saltRounds);
    const token = crypto.randomBytes(32).toString('hex');
    
    await pool.query(
        "INSERT INTO Usuarios (Nome, Email, Senha, token_verificacao, email_verificado) VALUES (?, ?, ?, ?, 0)",
        [nome, email, senhaCriptografada, token]
    );

    const verificationLink = `http://${req.headers.host}/verificar-email?token=${token}`;
    await transporter.sendMail({
        from: '"EsquizoCord" <no-reply@esquizocord.com>',
        to: email,
        subject: "Verificação de E-mail - EsquizoCord",
        html: `<b>Olá ${nome}!</b><br><p>Obrigado por se cadastrar. Por favor, clique no link a seguir para ativar sua conta: <a href="${verificationLink}">${verificationLink}</a></p>`,
    });

    const titulo = "Verifique seu E-mail";
    const mensagem = "Cadastro realizado com sucesso! Um link de verificação foi enviado para o seu e-mail para ativar sua conta.";
    res.redirect(`/mensagem?titulo=${encodeURIComponent(titulo)}&mensagem=${encodeURIComponent(mensagem)}`);

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).send('Erro: Nome de usuário ou e-mail já cadastrado.');
    }
    next(error); 
  }
});


// Rota de login
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

    // Se o usuário não existe, renderiza com erro
    if (rows.length === 0) {
      return res.render('Login', { error: 'E-mail ou senha inválidos.' });
    }
    
    const user = rows[0];
    const match = await bcrypt.compare(senha, user.Senha);

    if (match) {
      if (!user.email_verificado) {
        // (Já modificado na etapa anterior)
        const titulo = "Conta não verificada";
        const mensagem = "Sua conta ainda não foi ativada. Por favor, verifique o link enviado para o seu e-mail.";
        return res.redirect(`/mensagem?titulo=${encodeURIComponent(titulo)}&mensagem=${encodeURIComponent(mensagem)}`);
      }

      req.session.user = user;
      req.session.save(err => {
        if (err) return next(err);
        res.redirect('/dashboard');
      });
    } else {
      // Se a senha não confere, renderiza com erro
      res.render('Login', { error: 'E-mail ou senha inválidos.' });
    }
  } catch (error) {
    next(error);
  }
});

// Garanta que a rota GET para /login também passe o erro como nulo
router.get('/login', (req, res) => res.render('Login', { error: null }));


// Rota de configuração do perfil
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


// Rota para processar o pedido de recuperação de senha com debugging
router.post('/esqueceu-senha', async (req, res, next) => {
    console.log("-> Rota POST /esqueceu-senha atingida.");
    try {
        const { email } = req.body;
        const pool = req.db;
        
        console.log(`-> Procurando pelo email: ${email}`);
        const [users] = await pool.query("SELECT * FROM Usuarios WHERE Email = ?", [email]);

        // Se o e-mail não for encontrado na base de dados
        if (users.length === 0) {
            console.log("-> Email não encontrado na base de dados.");
            return res.render('Esqueceu-senha', {
                success: null,
                error: 'Este e-mail não está registado na nossa plataforma.'
            });
        }

        // Se o e-mail for encontrado, prossiga com o envio
        const user = users[0];
        console.log(`-> Email encontrado para o utilizador: ${user.Nome}. A preparar o envio...`);
        
        const token = crypto.randomBytes(32).toString('hex');
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1);

        await pool.query(
            "UPDATE Usuarios SET token_redefinir_senha = ?, expiracao_token_redefinir_senha = ? WHERE id_usuario = ?",
            [token, expiryDate, user.id_usuario]
        );

        const resetLink = `http://${req.headers.host}/redefinir-senha?token=${token}`;

        await transporter.sendMail({
            from: '"EsquizoCord" <no-reply@esquizocord.com>',
            to: user.Email,
            subject: "Recuperação de Senha - EsquizoCord",
            html: `<b>Olá ${user.Nome}!</b><br><p>Recebemos um pedido para redefinir a sua senha. Por favor, clique no link a seguir para criar uma nova senha: <a href="${resetLink}">${resetLink}</a></p><p>Se não foi você que solicitou, por favor ignore este e-mail.</p>`,
        });

        console.log("-> Email de recuperação enviado com sucesso!");
        // Renderiza a página com uma mensagem de sucesso
        res.render('Esqueceu-senha', {
            error: null,
            success: 'Um link de recuperação foi enviado para o seu e-mail. Verifique a sua caixa de entrada e a pasta de spam.'
        });

    } catch (error) {
        // Se ocorrer qualquer erro, ele será impresso na consola
        console.error("!!! Ocorreu um erro ao processar o pedido de recuperação de senha:", error);
        next(error); // Passa o erro para o handler de erros do Express
    }
});
// Rota para processar a redefinição da senha
router.post('/redefinir-senha', async (req, res, next) => {
    try {
        const { token, senha, confirmar_senha } = req.body;
        if (senha !== confirmar_senha) {
            return res.render('Redefinir-senha', { token, error: 'As senhas não coincidem.' });
        }

        const pool = req.db;
        const [users] = await pool.query(
            "SELECT * FROM Usuarios WHERE token_redefinir_senha = ? AND expiracao_token_redefinir_senha > NOW()",
            [token]
        );

        if (users.length === 0) {
            return res.render('Redefinir-senha', { token: null, error: 'O link de redefinição é inválido ou expirou.' });
        }

        const user = users[0];
        const senhaCriptografada = await bcrypt.hash(senha, saltRounds);

        await pool.query(
            "UPDATE Usuarios SET Senha = ?, token_redefinir_senha = NULL, expiracao_token_redefinir_senha = NULL WHERE id_usuario = ?",
            [senhaCriptografada, user.id_usuario]
        );
        
        // Idealmente, redirecionar para a página de login com uma mensagem de sucesso.
        // Uma forma de fazer isso é usando "flash messages", mas para simplificar, apenas redirecionamos.
        res.redirect('/login'); 

    } catch (error) {
        next(error);
    }
});

module.exports = router;