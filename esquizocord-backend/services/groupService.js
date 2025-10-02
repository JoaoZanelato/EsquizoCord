// esquizocord-backend/services/groupService.js
const { encrypt, decrypt } = require("../utils/crypto-helper");
const { getAiResponse, AI_USER_ID } = require("../utils/ia-helper");

const PERMISSIONS = {
  GERIR_CARGOS: 1,
  EXPULSAR_MEMBROS: 2,
  APAGAR_MENSAGENS: 4,
  CRIAR_CANAIS: 8,
  VISUALIZAR_RELATORIOS: 16,
};

// --- Funções de verificação de permissão ---
async function getUserPermissions(userId, groupId, db) {
  const [rows] = await db.query(
    `SELECT SUM(c.permissoes) AS total_permissoes 
         FROM cargos_usuario cu 
         JOIN cargos c ON cu.id_cargo = c.id_cargo 
         WHERE cu.id_usuario = ? AND c.id_grupo = ?`,
    [userId, groupId]
  );
  return rows[0]?.total_permissoes || 0;
}

async function isGroupCreator(userId, groupId, db) {
  const [rows] = await db.query(
    "SELECT id_criador FROM grupos WHERE id_grupo = ?",
    [groupId]
  );
  if (rows.length === 0)
    throw { status: 404, message: "Grupo não encontrado." };
  return rows[0].id_criador === userId;
}

async function banMember(groupId, memberId, currentUserId, db, io) {
  const hasPermission =
    (await getUserPermissions(currentUserId, groupId, db)) &
    PERMISSIONS.EXPULSAR_MEMBROS;
  if (!hasPermission) {
    throw {
      status: 403,
      message: "Você não tem permissão para banir membros.",
    };
  }

  if (currentUserId === memberId) {
    throw { status: 400, message: "Você não pode banir-se a si mesmo." };
  }

  const groupCreator = await isGroupCreator(memberId, groupId, db);
  if (groupCreator) {
    throw { status: 403, message: "O dono do grupo não pode ser banido." };
  }

  // Adiciona o utilizador à lista de banidos
  await db.query(
    "INSERT INTO banimentos (id_grupo, id_usuario) VALUES (?, ?) ON DUPLICATE KEY UPDATE id_usuario = id_usuario",
    [groupId, memberId]
  );

  // Remove o utilizador do grupo
  const [result] = await db.query(
    "DELETE FROM participantes_grupo WHERE id_grupo = ? AND id_usuario = ?",
    [groupId, memberId]
  );

  if (result.affectedRows > 0) {
    io.to(`group-${groupId}`).emit("member_kicked", {
      groupId: parseInt(groupId),
      kickedUserId: parseInt(memberId),
      kickerUserId: currentUserId,
    });
  } else {
    throw { status: 404, message: "Membro não encontrado neste grupo." };
  }
}

// --- Lógica de Grupos ---
async function createGroup({ nome, isPrivate, fotoUrl, creatorId }, db) {
  const connection = await db.getConnection();
  const TODAS_PERMISSOES = Object.values(PERMISSIONS).reduce(
    (sum, p) => sum | p,
    0
  );
  try {
    await connection.beginTransaction();
    const [groupResult] = await connection.query(
      "INSERT INTO grupos (nome, foto, is_private, id_criador) VALUES (?, ?, ?, ?)",
      [nome, fotoUrl, isPrivate, creatorId]
    );
    const newGroupId = groupResult.insertId;

    const [roleResult] = await connection.query(
      "INSERT INTO cargos (id_grupo, nome_cargo, cor, permissoes, icone) VALUES (?, 'Dono', '#FAA61A', ?, '👑')",
      [newGroupId, TODAS_PERMISSOES]
    );
    const ownerRoleId = roleResult.insertId;

    await connection.query(
      "INSERT INTO cargos_usuario (id_usuario, id_cargo) VALUES (?, ?)",
      [creatorId, ownerRoleId]
    );
    await connection.query(
      "INSERT INTO participantes_grupo (id_usuario, id_grupo) VALUES (?, ?)",
      [creatorId, newGroupId]
    );
    await connection.query(
      "INSERT INTO participantes_grupo (id_usuario, id_grupo) VALUES (?, ?)",
      [AI_USER_ID, newGroupId]
    );
    await connection.query(
      "INSERT INTO chats (id_grupo, nome) VALUES (?, 'geral')",
      [newGroupId]
    );

    await connection.commit();
    return { message: "Grupo criado com sucesso!", groupId: newGroupId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getGroupDetails(groupId, currentUserId, db) {
  const [details] = await db.query("SELECT * FROM grupos WHERE id_grupo = ?", [
    groupId,
  ]);
  if (details.length === 0)
    throw { status: 404, message: "Grupo não encontrado." };

  const [channels] = await db.query(
    "SELECT id_chat, nome, tipo FROM chats WHERE id_grupo = ?", // <-- ALTERAÇÃO AQUI
    [groupId]
  );
  const [members] = await db.query(
    `SELECT u.id_usuario, u.nome, u.foto_perfil,
            (SELECT JSON_ARRAYAGG(JSON_OBJECT('id_cargo', c.id_cargo, 'nome_cargo', c.nome_cargo, 'cor', c.cor, 'icone', c.icone, 'permissoes', c.permissoes))
             FROM cargos_usuario cu JOIN cargos c ON cu.id_cargo = c.id_cargo
             WHERE cu.id_usuario = u.id_usuario AND c.id_grupo = pg.id_grupo) as cargos
         FROM usuarios u 
         JOIN participantes_grupo pg ON u.id_usuario = pg.id_usuario 
         WHERE pg.id_grupo = ?`,
    [groupId]
  );

  const currentUserPermissions = await getUserPermissions(
    currentUserId,
    groupId,
    db
  );

  return {
    details: details[0],
    channels,
    members: members.map((m) => ({
      ...m,
      cargos: m.cargos ? JSON.parse(m.cargos) : [],
    })),
    currentUserPermissions,
  };
}

async function updateGroupSettings(
  groupId,
  userId,
  { nome, isPrivate, fotoUrl },
  db
) {
  if (!(await isGroupCreator(userId, groupId, db))) {
    throw { status: 403, message: "Apenas o criador pode alterar o grupo." };
  }

  let sql = "UPDATE grupos SET nome = ?, is_private = ?";
  const params = [nome, isPrivate];
  if (fotoUrl) {
    sql += ", foto = ?";
    params.push(fotoUrl);
  }
  sql += " WHERE id_grupo = ?";
  params.push(groupId);
  await db.query(sql, params);
}

async function deleteGroup(groupId, userId, db) {
  if (!(await isGroupCreator(userId, groupId, db))) {
    throw { status: 403, message: "Apenas o criador pode apagar o grupo." };
  }
  await db.query("DELETE FROM grupos WHERE id_grupo = ?", [groupId]);
}

async function searchPublicGroups(query, userId, db) {
  const sql = query
    ? `SELECT id_grupo, nome, foto FROM grupos WHERE is_private = 0 AND (nome LIKE ? OR id_grupo = ?) AND id_grupo NOT IN (SELECT id_grupo FROM participantes_grupo WHERE id_usuario = ?)`
    : `SELECT id_grupo, nome, foto FROM grupos WHERE is_private = 0 AND id_grupo NOT IN (SELECT id_grupo FROM participantes_grupo WHERE id_usuario = ?) ORDER BY nome ASC`;
  const params = query ? [`%${query}%`, query, userId] : [userId];
  const [groups] = await db.query(sql, params);
  return groups;
}

async function joinGroup(groupId, userId, db) {
  const [group] = await db.query(
    "SELECT is_private FROM grupos WHERE id_grupo = ?",
    [groupId]
  );
  if (group.length === 0)
    throw { status: 404, message: "Grupo não encontrado." };
  if (group[0].is_private)
    throw { status: 403, message: "Este grupo é privado." };

  const [isBanned] = await db.query(
    "SELECT id_banimento FROM banimentos WHERE id_grupo = ? AND id_usuario = ?",
    [groupId, userId]
  );

  if (isBanned.length > 0) {
    throw {
      status: 403,
      message: "Você foi banido deste grupo e não pode entrar.",
    };
  }

  const [existing] = await db.query(
    "SELECT * FROM participantes_grupo WHERE id_usuario = ? AND id_grupo = ?",
    [userId, groupId]
  );
  if (existing.length > 0)
    throw { status: 409, message: "Você já é membro deste grupo." };

  await db.query(
    "INSERT INTO participantes_grupo (id_usuario, id_grupo) VALUES (?, ?)",
    [userId, groupId]
  );
}

// --- Lógica de Canais ---
// --- INÍCIO DA ALTERAÇÃO ---
async function createChannel(groupId, userId, channelName, channelType, db) {
  if (
    !(
      (await getUserPermissions(userId, groupId, db)) & PERMISSIONS.CRIAR_CANAIS
    )
  ) {
    throw { status: 403, message: "Permissão para criar canais negada." };
  }
  const [result] = await db.query(
    "INSERT INTO chats (id_grupo, nome, tipo) VALUES (?, ?, ?)",
    [groupId, channelName, channelType]
  );
  return {
    id_chat: result.insertId,
    id_grupo: parseInt(groupId),
    nome: channelName,
    tipo: channelType,
  };
}
// --- FIM DA ALTERAÇÃO ---

async function deleteChannel(groupId, channelId, userId, db, io) {
  if (
    !(
      (await getUserPermissions(userId, groupId, db)) & PERMISSIONS.CRIAR_CANAIS
    )
  ) {
    throw { status: 403, message: "Permissão para apagar canais negada." };
  }
  const [channel] = await db.query(
    "SELECT nome FROM chats WHERE id_chat = ? AND id_grupo = ?",
    [channelId, groupId]
  );
  if (channel.length === 0)
    throw { status: 404, message: "Canal não encontrado neste grupo." };
  if (channel[0].nome === "geral")
    throw { status: 403, message: "O canal 'geral' não pode ser apagado." };

  await db.query("DELETE FROM chats WHERE id_chat = ?", [channelId]);
  io.to(`group-${groupId}`).emit("group_channel_deleted", {
    channelId: parseInt(channelId),
    groupId: parseInt(groupId),
  });
}

// --- Lógica de Mensagens de Grupo ---
async function getGroupMessages(chatId, db) {
  const query = `
        SELECT m.*, u.nome as autorNome, u.foto_perfil as autorFoto
        FROM mensagens m JOIN usuarios u ON m.id_usuario = u.id_usuario
        WHERE m.id_chat = ? ORDER BY m.data_hora ASC LIMIT 100
    `;
  const [messages] = await db.query(query, [chatId]);

  // Decriptar em lote
  return messages.map((msg) => ({
    ...msg,
    Conteudo: decrypt({
      ConteudoCriptografado: msg.conteudo_criptografado,
      Nonce: msg.nonce,
    }),
  }));
}

async function sendGroupMessage(
  { content, type, repliedToId, sender, chatId },
  db,
  io
) {
  const { ciphertext, nonce } = encrypt(content);

  const [groupRows] = await db.query(
    "SELECT id_grupo FROM chats WHERE id_chat = ?",
    [chatId]
  );
  if (groupRows.length === 0)
    throw { status: 404, message: "Chat não encontrado." };
  const groupId = groupRows[0].id_grupo;

  const [result] = await db.query(
    "INSERT INTO mensagens (id_chat, id_usuario, conteudo_criptografado, nonce, id_mensagem_respondida, tipo) VALUES (?, ?, ?, ?, ?, ?)",
    [chatId, sender.id_usuario, ciphertext, nonce, repliedToId, type]
  );

  const messageData = {
    id_mensagem: result.insertId,
    id_chat: parseInt(chatId),
    groupId: groupId,
    Conteudo: content,
    data_hora: new Date(),
    id_usuario: sender.id_usuario,
    autorNome: sender.nome,
    autorFoto: sender.foto_perfil,
    tipo,
    id_mensagem_respondida: repliedToId,
  };

  io.to(`group-${groupId}`).emit("new_group_message", messageData);

  if (type === "texto" && content.includes("@EsquizoIA")) {
    const aiResponseText = await getAiResponse(
      content.replace("@EsquizoIA", "").trim()
    );
    // Enviar a resposta da IA...
  }
  return messageData;
}

async function editGroupMessage(messageId, newContent, userId, db, io) {
  const [msg] = await db.query(
    "SELECT m.id_usuario, m.tipo, c.id_grupo FROM mensagens m JOIN chats c ON m.id_chat = c.id_chat WHERE m.id_mensagem = ?",
    [messageId]
  );
  if (msg.length === 0) {
    throw { status: 404, message: "Mensagem não encontrada." };
  }

  if (msg[0].id_usuario !== userId) {
    throw { status: 403, message: "Apenas o autor pode editar a mensagem." };
  }
  if (msg[0].tipo !== "texto") {
    throw {
      status: 400,
      message: "Apenas mensagens de texto podem ser editadas.",
    };
  }

  const { ciphertext, nonce } = encrypt(newContent);

  await db.query(
    "UPDATE mensagens SET conteudo_criptografado = ?, nonce = ?, foi_editada = 1 WHERE id_mensagem = ?",
    [ciphertext, nonce, messageId]
  );

  io.to(`group-${msg[0].id_grupo}`).emit("group_message_edited", {
    messageId: parseInt(messageId),
    chatId: msg[0].id_chat,
    newContent: newContent,
  });
}

async function deleteGroupMessage(messageId, userId, db, io) {
  const [msg] = await db.query(
    "SELECT m.id_usuario, c.id_grupo FROM mensagens m JOIN chats c ON m.id_chat = c.id_chat WHERE m.id_mensagem = ?",
    [messageId]
  );
  if (msg.length === 0)
    throw { status: 404, message: "Mensagem não encontrada." };

  const hasDeletePerm =
    (await getUserPermissions(userId, msg[0].id_grupo, db)) &
    PERMISSIONS.APAGAR_MENSAGENS;

  if (msg[0].id_usuario !== userId && !hasDeletePerm) {
    throw { status: 403, message: "Permissão para apagar a mensagem negada." };
  }

  await db.query("DELETE FROM mensagens WHERE id_mensagem = ?", [messageId]);
  io.to(`group-${msg[0].id_grupo}`).emit("group_message_deleted", {
    messageId: parseInt(messageId),
    chatId: msg[0].id_chat,
  });
}

// --- Lógica de Cargos ---
async function getRoles(groupId, db) {
  return db.query("SELECT * FROM cargos WHERE id_grupo = ?", [groupId]);
}

async function createRole(groupId, userId, roleData, db) {
  if (!(await isGroupCreator(userId, groupId, db)))
    throw { status: 403, message: "Apenas o criador pode gerir cargos." };
  const { nome_cargo, cor, permissoes, icone } = roleData;
  const [result] = await db.query(
    "INSERT INTO cargos (id_grupo, nome_cargo, cor, permissoes, icone) VALUES (?, ?, ?, ?, ?)",
    [groupId, nome_cargo, cor || "#99aab5", permissoes || 0, icone || null]
  );
  const [newRole] = await db.query("SELECT * FROM cargos WHERE id_cargo = ?", [
    result.insertId,
  ]);
  return newRole[0];
}

async function updateRole(groupId, roleId, userId, roleData, db) {
  if (!(await isGroupCreator(userId, groupId, db)))
    throw { status: 403, message: "Apenas o criador pode gerir cargos." };
  const { nome_cargo, cor, permissoes, icone } = roleData;
  await db.query(
    "UPDATE cargos SET nome_cargo = ?, cor = ?, permissoes = ?, icone = ? WHERE id_cargo = ? AND id_grupo = ?",
    [nome_cargo, cor, permissoes, icone, roleId, groupId]
  );
}

async function deleteRole(groupId, roleId, userId, db) {
  if (!(await isGroupCreator(userId, groupId, db)))
    throw { status: 403, message: "Apenas o criador pode gerir cargos." };
  // ON DELETE CASCADE trata da tabela cargos_usuario
  await db.query("DELETE FROM cargos WHERE id_cargo = ? AND id_grupo = ?", [
    roleId,
    groupId,
  ]);
}

async function updateUserRoles(groupId, memberId, userId, roleIds, db) {
  if (!(await isGroupCreator(userId, groupId, db)))
    throw { status: 403, message: "Apenas o criador pode gerir cargos." };

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    // Apaga apenas os cargos deste grupo para este utilizador
    await connection.query(
      "DELETE FROM cargos_usuario WHERE id_usuario = ? AND id_cargo IN (SELECT id_cargo FROM cargos WHERE id_grupo = ?)",
      [memberId, groupId]
    );
    if (roleIds && roleIds.length > 0) {
      const values = roleIds.map((roleId) => [memberId, roleId]);
      await connection.query(
        "INSERT INTO cargos_usuario (id_usuario, id_cargo) VALUES ?",
        [values]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  PERMISSIONS,
  getUserPermissions,
  isGroupCreator,
  banMember,
  createGroup,
  getGroupDetails,
  updateGroupSettings,
  deleteGroup,
  searchPublicGroups,
  joinGroup,
  createChannel,
  deleteChannel,
  getGroupMessages,
  sendGroupMessage,
  deleteGroupMessage,
  editGroupMessage,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  updateUserRoles,
};
