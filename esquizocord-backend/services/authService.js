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

  const verificationLink = `http://localhost:5173/verificar-email?token=${token}`;
  await transporter.sendMail({
    from: '"EsquizoCord" <no-reply@esquizocord.com>',
    to: email,
    subject: "Verificação de E-mail - EsquizoCord",
    html: `<b>Olá ${nome}!</b><br><p>Obrigado por se registar. Clique no link a seguir para ativar a sua conta: <a href="${verificationLink}">${verificationLink}</a></p>`,
  });
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
  const verificationLink = `http://localhost:5173/verificar-email?token=${user.token_verificacao}`;
  await transporter.sendMail({
    from: '"EsquizoCord" <no-reply@esquizocord.com>',
    to: email,
    subject: "Reenvio de Verificação de E-mail - EsquizoCord",
    html: `<b>Olá ${user.nome}!</b><br><p>Clique no link a seguir para ativar a sua conta: <a href="${verificationLink}">${verificationLink}</a></p>`,
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

  const resetLink = `http://localhost:5173/redefinir-senha?token=${token}`;
  await transporter.sendMail({
    from: '"EsquizoCord" <no-reply@esquizocord.com>',
    to: user.email,
    subject: "Recuperação de Senha - EsquizoCord",
    html: `<b>Olá ${user.nome}!</b><br><p>Recebemos um pedido para redefinir a sua senha. Clique no link a seguir para criar uma nova senha: <a href="${resetLink}">${resetLink}</a></p><p>Se não foi você que solicitou, por favor ignore este e-mail.</p>`,
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
