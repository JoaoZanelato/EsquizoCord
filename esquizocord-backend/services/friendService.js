// esquizocord-backend/services/friendService.js
const { encrypt, decrypt } = require("../utils/crypto-helper");
const { getAiResponse, AI_USER_ID } = require("../utils/ia-helper");

async function searchUsers(query, currentUserId, db) {
  const sql = `
      SELECT u.id_usuario, u.nome, u.foto_perfil 
      FROM usuarios u
      LEFT JOIN amizades a ON 
          (a.id_requisitante = u.id_usuario AND a.id_requisitado = ?) OR
          (a.id_requisitado = u.id_usuario AND a.id_requisitante = ?)
      WHERE 
          u.nome LIKE ?
          AND u.id_usuario NOT IN (?, ?)
          AND a.id_amizade IS NULL
    `;
  const [users] = await db.query(sql, [
    currentUserId,
    currentUserId,
    `%${query}%`,
    currentUserId,
    AI_USER_ID,
  ]);
  return users;
}

async function sendFriendRequest(requesterId, requestedId, db, io) {
  if (requesterId === requestedId) {
    throw { status: 400, message: "Não pode adicionar-se a si mesmo." };
  }
  const [existing] = await db.query(
    "SELECT * FROM amizades WHERE (id_requisitante = ? AND id_requisitado = ?) OR (id_requisitante = ? AND id_requisitado = ?)",
    [requesterId, requestedId, requestedId, requesterId]
  );
  if (existing.length > 0) {
    throw {
      status: 409,
      message: "Já existe um pedido de amizade ou amizade com este utilizador.",
    };
  }

  const [insertResult] = await db.query(
    "INSERT INTO amizades (id_requisitante, id_requisitado, status) VALUES (?, ?, 'pendente')",
    [requesterId, requestedId]
  );
  const newFriendshipId = insertResult.insertId;

  const [requesterUser] = await db.query(
    "SELECT id_usuario, nome, foto_perfil FROM usuarios WHERE id_usuario = ?",
    [requesterId]
  );
  const [requestedUser] = await db.query(
    "SELECT id_usuario, nome, foto_perfil FROM usuarios WHERE id_usuario = ?",
    [requestedId]
  );

  // Notificar o utilizador que recebeu o pedido
  io.to(`user-${requestedId}`).emit("friend_request_received", {
    id_amizade: newFriendshipId,
    ...requesterUser[0],
  });

  return {
    message: "Pedido de amizade enviado!",
    sentRequest: { id_amizade: newFriendshipId, ...requestedUser[0] },
  };
}

async function respondToFriendRequest(
  requestId,
  action,
  currentUserId,
  db,
  io
) {
  const [requestDetails] = await db.query(
    "SELECT id_requisitante FROM amizades WHERE id_amizade = ? AND id_requisitado = ? AND status = 'pendente'",
    [requestId, currentUserId]
  );

  if (requestDetails.length === 0) {
    throw { status: 404, message: "Pedido não encontrado ou não autorizado." };
  }
  const requesterId = requestDetails[0].id_requisitante;

  if (action === "aceite") {
    await db.query(
      "UPDATE amizades SET status = 'aceite' WHERE id_amizade = ?",
      [requestId]
    );
    const [currentUserData] = await db.query(
      "SELECT id_usuario, nome, foto_perfil FROM usuarios WHERE id_usuario = ?",
      [currentUserId]
    );

    io.to(`user-${requesterId}`).emit("friend_request_accepted", {
      newFriend: currentUserData[0],
      requestId: parseInt(requestId),
    });
  } else {
    // 'recusada'
    await db.query("DELETE FROM amizades WHERE id_amizade = ?", [requestId]);
  }
}

async function cancelFriendRequest(requestId, currentUserId, db, io) {
  const [requestDetails] = await db.query(
    "SELECT id_requisitado FROM amizades WHERE id_amizade = ? AND id_requisitante = ?",
    [requestId, currentUserId]
  );
  if (requestDetails.length === 0) {
    throw { status: 403, message: "Não autorizado a cancelar este pedido." };
  }

  const [result] = await db.query("DELETE FROM amizades WHERE id_amizade = ?", [
    requestId,
  ]);

  if (result.affectedRows > 0) {
    const requestedId = requestDetails[0].id_requisitado;
    io.to(`user-${requestedId}`).emit("request_cancelled", {
      requestId: parseInt(requestId),
    });
  } else {
    throw { status: 404, message: "Pedido não encontrado." };
  }
}

async function removeFriend(friendId, currentUserId, db, io) {
  const [result] = await db.query(
    `DELETE FROM amizades WHERE status = 'aceite' AND ((id_requisitante = ? AND id_requisitado = ?) OR (id_requisitante = ? AND id_requisitado = ?))`,
    [currentUserId, friendId, friendId, currentUserId]
  );

  if (result.affectedRows > 0) {
    io.to(`user-${friendId}`).emit("friend_removed", {
      removerId: currentUserId,
    });
  } else {
    throw { status: 404, message: "Amizade não encontrada." };
  }
}

async function getDirectMessages(friendId, currentUserId, db) {
  const query = `
        SELECT 
            md.id_mensagem, md.id_remetente, md.conteudo_criptografado, md.nonce, md.data_hora, md.tipo,
            u.nome as autorNome, u.foto_perfil as autorFoto, u.id_usuario,
            md.id_mensagem_respondida,
            replied.conteudo_criptografado as repliedContent,
            replied.nonce as repliedNonce,
            replied_u.nome as repliedAuthorName,
            replied_u.id_usuario as repliedAuthorId
        FROM mensagens_diretas md
        JOIN usuarios u ON md.id_remetente = u.id_usuario
        LEFT JOIN mensagens_diretas replied ON md.id_mensagem_respondida = replied.id_mensagem
        LEFT JOIN usuarios replied_u ON replied.id_remetente = replied_u.id_usuario
        WHERE (md.id_remetente = ? AND md.id_destinatario = ?) OR (md.id_remetente = ? AND md.id_destinatario = ?)
        ORDER BY md.data_hora ASC
        LIMIT 100;
    `;
  const [messages] = await db.query(query, [
    currentUserId,
    friendId,
    friendId,
    currentUserId,
  ]);

  return messages.map((msg) => {
    let repliedTo = null;
    if (msg.id_mensagem_respondida && msg.repliedContent) {
      repliedTo = {
        autorNome: msg.repliedAuthorName,
        autorId: msg.repliedAuthorId,
        Conteudo: decrypt({
          ConteudoCriptografado: msg.repliedContent,
          Nonce: msg.repliedNonce,
        }),
      };
    }
    return {
      ...msg,
      Conteudo: decrypt({
        ConteudoCriptografado: msg.conteudo_criptografado,
        Nonce: msg.nonce,
      }),
      repliedTo,
    };
  });
}

async function sendDirectMessage(
  { content, type, repliedToId, sender, recipientId },
  db,
  io
) {
  const { ciphertext, nonce } = encrypt(content);

  const [result] = await db.query(
    "INSERT INTO mensagens_diretas (id_remetente, id_destinatario, conteudo_criptografado, nonce, id_mensagem_respondida, tipo) VALUES (?, ?, ?, ?, ?, ?)",
    [sender.id_usuario, recipientId, ciphertext, nonce, repliedToId, type]
  );

  const messageData = {
    id_mensagem: result.insertId,
    id_remetente: sender.id_usuario,
    id_destinatario: recipientId,
    Conteudo: content,
    data_hora: new Date(),
    autorNome: sender.nome,
    autorFoto: sender.foto_perfil,
    id_usuario: sender.id_usuario,
    tipo: type,
  };

  if (repliedToId) {
    // Lógica para adicionar dados da mensagem respondida
  }

  const roomName = `dm-${[sender.id_usuario, recipientId].sort().join("-")}`;
  io.to(roomName).emit("new_dm", messageData);

  // Lógica da IA
  if (recipientId === AI_USER_ID && type === "texto") {
    const aiResponseText = await getAiResponse(content);
    const { ciphertext: aiCiphertext, nonce: aiNonce } =
      encrypt(aiResponseText);
    const [aiUserDetails] = await db.query(
      "SELECT nome, foto_perfil FROM usuarios WHERE id_usuario = ?",
      [AI_USER_ID]
    );

    const [aiResult] = await db.query(
      "INSERT INTO mensagens_diretas (id_remetente, id_destinatario, conteudo_criptografado, nonce, tipo) VALUES (?, ?, ?, ?, 'texto')",
      [AI_USER_ID, sender.id_usuario, aiCiphertext, aiNonce]
    );

    const aiMessageData = {
      id_mensagem: aiResult.insertId,
      id_remetente: AI_USER_ID,
      id_destinatario: sender.id_usuario,
      Conteudo: aiResponseText,
      data_hora: new Date(),
      autorNome: aiUserDetails[0].nome,
      autorFoto: aiUserDetails[0].foto_perfil,
      id_usuario: AI_USER_ID,
      tipo: "texto",
    };
    io.to(roomName).emit("new_dm", aiMessageData);
  }

  return messageData;
}

async function deleteDirectMessage(messageId, currentUserId, db, io) {
  const [msgResult] = await db.query(
    "SELECT id_remetente, id_destinatario FROM mensagens_diretas WHERE id_mensagem = ?",
    [messageId]
  );
  if (msgResult.length === 0) {
    throw { status: 404, message: "Mensagem não encontrada." };
  }
  const message = msgResult[0];

  if (message.id_remetente !== currentUserId) {
    throw {
      status: 403,
      message: "Não pode apagar uma mensagem que não enviou.",
    };
  }

  await db.query("DELETE FROM mensagens_diretas WHERE id_mensagem = ?", [
    messageId,
  ]);

  const roomName = `dm-${[message.id_remetente, message.id_destinatario]
    .sort()
    .join("-")}`;
  io.to(roomName).emit("dm_message_deleted", {
    messageId: parseInt(messageId, 10),
  });
}

module.exports = {
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getDirectMessages,
  sendDirectMessage,
  deleteDirectMessage,
};
