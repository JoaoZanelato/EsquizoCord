// esquizocord-backend/services/userService.js
const bcrypt = require("bcrypt");
const saltRounds = 10;

async function getUserProfile(userId, db) {
  const [users] = await db.query(
    "SELECT id_usuario, nome, foto_perfil, biografia, data_cadastro FROM usuarios WHERE id_usuario = ?",
    [userId]
  );
  if (users.length === 0) {
    throw { status: 404, message: "Utilizador não encontrado." };
  }
  return users[0];
}

async function getFullUserProfile(targetUserId, currentUserId, db) {
  const userProfile = await getUserProfile(targetUserId, db);

  const [friendship] = await db.query(
    "SELECT * FROM amizades WHERE (id_requisitante = ? AND id_requisitado = ?) OR (id_requisitante = ? AND id_requisitado = ?)",
    [currentUserId, targetUserId, targetUserId, currentUserId]
  );

  const [mutualGroups] = await db.query(
    `SELECT g.id_grupo, g.nome, g.foto 
         FROM grupos g
         JOIN participantes_grupo pg1 ON g.id_grupo = pg1.id_grupo
         JOIN participantes_grupo pg2 ON g.id_grupo = pg2.id_grupo
         WHERE pg1.id_usuario = ? AND pg2.id_usuario = ?`,
    [currentUserId, targetUserId]
  );

  // Query para amigos em comum (simplificada)
  const [mutualFriends] = await db.query(
    `SELECT u.id_usuario, u.nome, u.foto_perfil
       FROM usuarios u
       WHERE u.id_usuario IN (
           SELECT friend_id FROM (
               SELECT IF(id_requisitante = ?, id_requisitado, id_requisitante) as friend_id FROM amizades WHERE (id_requisitante = ? OR id_requisitado = ?) AND status = 'aceite'
           ) as currentUserFriends
           WHERE friend_id IN (
               SELECT IF(id_requisitante = ?, id_requisitado, id_requisitante) as friend_id FROM amizades WHERE (id_requisitante = ? OR id_requisitado = ?) AND status = 'aceite'
           )
       ) AND u.id_usuario NOT IN (?, ?, 1)`,
    [
      currentUserId,
      currentUserId,
      currentUserId,
      targetUserId,
      targetUserId,
      targetUserId,
      currentUserId,
      targetUserId,
    ]
  );

  return {
    user: userProfile,
    friendship: friendship.length > 0 ? friendship[0] : null,
    mutuals: {
      groups: mutualGroups,
      friends: mutualFriends,
    },
  };
}

async function updateUserProfile(
  { userId, nome, biografia, id_tema, fotoUrl },
  db
) {
  let sql = "UPDATE usuarios SET nome = ?, biografia = ?, id_tema = ?";
  const params = [
    nome,
    biografia,
    id_tema === "null" ? null : parseInt(id_tema, 10),
  ];

  if (fotoUrl) {
    sql += ", foto_perfil = ?";
    params.push(fotoUrl);
  }
  sql += " WHERE id_usuario = ?";
  params.push(userId);

  await db.query(sql, params);

  const [updatedUserResult] = await db.query(
    `SELECT u.*, t.bckgrnd_color, t.main_color FROM usuarios u LEFT JOIN temas t ON u.id_tema = t.id_tema WHERE u.id_usuario = ?`,
    [userId]
  );
  if (updatedUserResult.length > 0) {
    delete updatedUserResult[0].senha;
    return updatedUserResult[0];
  }
  throw { status: 404, message: "Utilizador não encontrado após atualização." };
}

async function changePassword({ userId, currentPassword, newPassword }, db) {
  const [users] = await db.query(
    "SELECT senha FROM usuarios WHERE id_usuario = ?",
    [userId]
  );
  if (users.length === 0) {
    throw { status: 404, message: "Utilizador não encontrado." };
  }
  const user = users[0];
  const match = await bcrypt.compare(currentPassword, user.senha);
  if (!match) {
    throw { status: 403, message: "A senha atual está incorreta." };
  }
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
  await db.query("UPDATE usuarios SET senha = ? WHERE id_usuario = ?", [
    hashedNewPassword,
    userId,
  ]);
}

async function deleteAccount(userId, password, db) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.query(
      "SELECT senha FROM usuarios WHERE id_usuario = ?",
      [userId]
    );
    if (users.length === 0) {
      throw { status: 404, message: "Utilizador não encontrado." };
    }
    const match = await bcrypt.compare(password, users[0].senha);
    if (!match) {
      throw { status: 403, message: "Senha incorreta." };
    }
    // A base de dados está configurada com ON DELETE CASCADE,
    // o que simplifica a exclusão. Apenas apagar o utilizador
    // irá remover em cascata a maioria dos dados relacionados.
    await connection.query("DELETE FROM usuarios WHERE id_usuario = ?", [
      userId,
    ]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error; // Re-lança o erro para ser tratado pela rota
  } finally {
    connection.release();
  }
}

async function getThemes(db) {
  const [themes] = await db.query("SELECT * FROM temas");
  return themes;
}

module.exports = {
  getUserProfile,
  getFullUserProfile,
  updateUserProfile,
  changePassword,
  deleteAccount,
  getThemes,
};
