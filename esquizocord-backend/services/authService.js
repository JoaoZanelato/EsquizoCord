// esquizocord-backend/services/authService.js
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const saltRounds = 10;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- NOVO TEMPLATE DE E-MAIL ---
const createEmailTemplate = (
  title,
  preheader,
  name,
  body,
  buttonLink,
  buttonText
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { margin: 0; padding: 0; background-color: #202225; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #2f3136; color: #dcddde; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header img { width: 80px; height: 80px; border-radius: 50%; }
            .content { padding: 20px; background-color: #36393f; border-radius: 8px; }
            h1 { color: #ffffff; font-size: 24px; }
            p { font-size: 16px; line-height: 1.5; }
            .button-container { text-align: center; margin-top: 30px; }
            .button { background-color: #5865F2; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #72767d; }
        </style>
    </head>
    <body>
        <div style="display: none; font-size: 1px; color: #333333; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
            ${preheader}
        </div>
        <div class="container">
            <div class="header">
                <img src="https://raw.githubusercontent.com/JoaoZanelato/EsquizoCord/main/esquizocord-frontend/public/images/logo.png" alt="EsquizoCord Logo">
            </div>
            <div class="content">
                <h1>Olá, ${name}!</h1>
                <p>${body}</p>
                <div class="button-container">
                    <a href="${buttonLink}" class="button">${buttonText}</a>
                </div>
            </div>
            <div class="footer">
                <p>&copy; 2025 EsquizoCord. Se não solicitou este e-mail, pode ignorá-lo com segurança.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

async function registerUser({ nome, email, senha }, db) {
  const [userExists] = await db.query(
    "SELECT id_usuario FROM usuarios WHERE nome = ? OR email = ?",
    [nome, email]
  );
  if (userExists.length > 0) {
    throw {
      status: 409,
      message: "Este nome de utilizador ou e-mail já está em uso.",
    };
  }

  const senhaCriptografada = await bcrypt.hash(senha, saltRounds);
  const token = crypto.randomBytes(32).toString("hex");

  await db.query(
    "INSERT INTO usuarios (nome, email, senha, token_verificacao) VALUES (?, ?, ?, ?)",
    [nome, email, senhaCriptografada, token]
  );

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verificationLink = `${frontendUrl}/verificar-email?token=${token}`;

  const emailBody = `Obrigado por se registar no EsquizoCord! Para começar a conversar, por favor, verifique a sua conta clicando no botão abaixo.`;
  const emailHtml = createEmailTemplate(
    "Verificação de E-mail - EsquizoCord",
    "Confirme o seu e-mail para ativar a sua conta.",
    nome,
    emailBody,
    verificationLink,
    "Verificar E-mail"
  );

  try {
    console.log("A tentar enviar e-mail de verificação para:", email);
    await transporter.sendMail({
      from: '"EsquizoCord" <no-reply@esquizocord.com>',
      to: email,
      subject: "Verificação de E-mail - EsquizoCord",
      html: emailHtml,
    });
    console.log("E-mail de verificação enviado com sucesso.");
  } catch (emailError) {
    console.error("### ERRO AO ENVIAR E-MAIL DE VERIFICAÇÃO ###:", emailError);
  }
}

async function loginUser(email, senha, db) {
  const sql = `
    SELECT u.*, t.bckgrnd_color, t.main_color 
    FROM usuarios u 
    LEFT JOIN temas t ON u.id_tema = t.id_tema 
    WHERE u.email = ?
  `;
  const [rows] = await db.query(sql, [email]);

  if (rows.length === 0) {
    throw {
      status: 401,
      message: "Utilizador não encontrado com este e-mail.",
    };
  }

  const user = rows[0];
  const match = await bcrypt.compare(senha, user.senha);

  if (!match) {
    throw { status: 401, message: "Senha incorreta." };
  }

  if (!user.email_verificado) {
    throw {
      status: 403,
      message: "A sua conta ainda não foi ativada. Verifique o seu e-mail.",
    };
  }

  delete user.senha;
  return user;
}

async function verifyEmail(token, db) {
  const [users] = await db.query(
    "SELECT id_usuario FROM usuarios WHERE token_verificacao = ?",
    [token]
  );
  if (users.length === 0) {
    throw {
      status: 400,
      message: "Token de verificação inválido ou expirado.",
    };
  }
  const userId = users[0].id_usuario;
  await db.query(
    "UPDATE usuarios SET email_verificado = 1, token_verificacao = NULL WHERE id_usuario = ?",
    [userId]
  );
}

async function resendVerification(email, db) {
  const [users] = await db.query(
    "SELECT nome, token_verificacao, email_verificado FROM usuarios WHERE email = ?",
    [email]
  );
  if (users.length === 0) {
    throw { status: 404, message: "E-mail não registado." };
  }
  const user = users[0];
  if (user.email_verificado) {
    throw { status: 400, message: "Este e-mail já foi verificado." };
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verificationLink = `${frontendUrl}/verificar-email?token=${user.token_verificacao}`;
  const emailBody =
    "Recebemos um pedido para reenviar o seu e-mail de verificação. Clique no botão abaixo para ativar a sua conta.";
  const emailHtml = createEmailTemplate(
    "Reenvio de Verificação de E-mail - EsquizoCord",
    "Ative a sua conta EsquizoCord.",
    user.nome,
    emailBody,
    verificationLink,
    "Ativar Conta"
  );

  await transporter.sendMail({
    from: '"EsquizoCord" <no-reply@esquizocord.com>',
    to: email,
    subject: "Reenvio de Verificação de E-mail - EsquizoCord",
    html: emailHtml,
  });
}

async function forgotPassword(email, db) {
  const [users] = await db.query("SELECT * FROM usuarios WHERE email = ?", [
    email,
  ]);
  if (users.length === 0) {
    throw {
      status: 404,
      message: "Este e-mail não está registado na nossa plataforma.",
    };
  }

  const user = users[0];
  const token = crypto.randomBytes(32).toString("hex");
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 1);

  await db.query(
    "UPDATE usuarios SET token_redefinir_senha = ?, expiracao_token_redefinir_senha = ? WHERE id_usuario = ?",
    [token, expiryDate, user.id_usuario]
  );

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetLink = `${frontendUrl}/redefinir-senha?token=${token}`;
  const emailBody =
    "Recebemos um pedido para redefinir a sua senha. Se não foi você, por favor ignore este e-mail. Caso contrário, clique no botão abaixo para criar uma nova senha.";
  const emailHtml = createEmailTemplate(
    "Recuperação de Senha - EsquizoCord",
    "Redefina a sua senha do EsquizoCord.",
    user.nome,
    emailBody,
    resetLink,
    "Redefinir Senha"
  );

  await transporter.sendMail({
    from: '"EsquizoCord" <no-reply@esquizocord.com>',
    to: user.email,
    subject: "Recuperação de Senha - EsquizoCord",
    html: emailHtml,
  });
}

async function resetPassword(token, newPassword, db) {
  const [users] = await db.query(
    "SELECT * FROM usuarios WHERE token_redefinir_senha = ? AND expiracao_token_redefinir_senha > NOW()",
    [token]
  );

  if (users.length === 0) {
    throw {
      status: 400,
      message: "O link de redefinição é inválido ou expirou.",
    };
  }

  const user = users[0];
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  await db.query(
    "UPDATE usuarios SET senha = ?, token_redefinir_senha = NULL, expiracao_token_redefinir_senha = NULL WHERE id_usuario = ?",
    [hashedNewPassword, user.id_usuario]
  );
}

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
