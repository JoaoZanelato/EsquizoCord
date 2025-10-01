// esquizocord-backend/services/dashboardService.js
const { AI_USER_ID } = require("../utils/ia-helper");

async function getDashboardData(userId, onlineUserIds, db) {
  const [groups] = await db.query(
    "SELECT g.id_grupo, g.nome, g.foto FROM grupos g JOIN participantes_grupo pg ON g.id_grupo = pg.id_grupo WHERE pg.id_usuario = ?",
    [userId]
  );

  const [friends] = await db.query(
    `SELECT u.id_usuario, u.nome, u.foto_perfil 
         FROM usuarios u 
         JOIN amizades a ON (u.id_usuario = a.id_requisitante OR u.id_usuario = a.id_requisitado) 
         WHERE (a.id_requisitante = ? OR a.id_requisitado = ?) AND a.status = 'aceite' AND u.id_usuario != ?`,
    [userId, userId, userId]
  );

  // Garante que a IA está sempre na lista de amigos
  const [aiUser] = await db.query(
    "SELECT id_usuario, nome, foto_perfil FROM usuarios WHERE id_usuario = ?",
    [AI_USER_ID]
  );
  if (
    aiUser.length > 0 &&
    !friends.some((friend) => friend.id_usuario === AI_USER_ID)
  ) {
    friends.unshift(aiUser[0]);
  }

  const [pendingRequests] = await db.query(
    `SELECT u.id_usuario, u.nome, u.foto_perfil, a.id_amizade 
         FROM usuarios u 
         JOIN amizades a ON u.id_usuario = a.id_requisitante 
         WHERE a.id_requisitado = ? AND a.status = 'pendente'`,
    [userId]
  );

  const [sentRequests] = await db.query(
    `SELECT u.id_usuario, u.nome, u.foto_perfil, a.id_amizade 
         FROM usuarios u 
         JOIN amizades a ON u.id_usuario = a.id_requisitado 
         WHERE a.id_requisitante = ? AND a.status = 'pendente'`,
    [userId]
  );

  return {
    groups,
    friends,
    pendingRequests,
    sentRequests,
    onlineUserIds,
  };
}

module.exports = { getDashboardData };
