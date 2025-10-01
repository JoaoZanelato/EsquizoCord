const express = require("express");
const router = express.Router();
const { encrypt, decrypt } = require("../utils/crypto-helper");
const { getAiResponse, AI_USER_ID } = require("../utils/ia-helper");

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
function requireLogin(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ message: "Acesso não autorizado" });
}

// --- ROTAS DE MENSAGEM DIRETA (DM) ---

// ROTA GET PARA BUSCAR MENSAGENS DIRETAS (CORRIGIDA)
router.get("/dm/:friendId/messages", requireLogin, async (req, res, next) => {
  const friendId = req.params.friendId;
  const currentUserId = req.session.user.id_usuario;
  const pool = req.db;
  try {
    const query = `
            SELECT 
                md.id_mensagem, md.id_remetente, md.ConteudoCriptografado, md.Nonce, md.DataHora, md.tipo,
                u.Nome as autorNome, u.FotoPerfil as autorFoto,
                md.id_mensagem_respondida,
                replied.ConteudoCriptografado as repliedContent,
                replied.Nonce as repliedNonce,
                replied_u.Nome as repliedAuthorName,
                replied_u.id_usuario as repliedAuthorId
            FROM MensagensDiretas md
            JOIN Usuarios u ON md.id_remetente = u.id_usuario
            LEFT JOIN MensagensDiretas replied ON md.id_mensagem_respondida = replied.id_mensagem
            LEFT JOIN Usuarios replied_u ON replied.id_remetente = replied_u.id_usuario
            WHERE (md.id_remetente = ? AND md.id_destinatario = ?) OR (md.id_remetente = ? AND md.id_destinatario = ?)
            ORDER BY md.DataHora ASC
            LIMIT 100;
        `;
    const [messages] = await pool.query(query, [
      currentUserId,
      friendId,
      friendId,
      currentUserId,
    ]);
    // O resto da função permanece igual...
    const decryptedMessages = messages.map((msg) => {
      let repliedTo = null;
      if (msg.id_mensagem_respondida && msg.repliedContent) {
        const repliedDecryptedContent = decrypt({
          ConteudoCriptografado: msg.repliedContent,
          Nonce: msg.repliedNonce,
        });
        repliedTo = {
          autorNome: msg.repliedAuthorName,
          autorId: msg.repliedAuthorId,
          Conteudo: repliedDecryptedContent,
        };
      }
      return {
        ...msg,
        id_usuario: msg.id_remetente,
        Conteudo: decrypt(msg),
        repliedTo: repliedTo,
      };
    });
    res.json(decryptedMessages);
  } catch (error) {
    next(error);
  }
});

// ROTA POST PARA ENVIAR UMA MENSAGEM DIRETA
router.post("/dm/:friendId/messages", requireLogin, async (req, res, next) => {
  const friendId = parseInt(req.params.friendId, 10);
  const currentUser = req.session.user;
  const currentUserId = currentUser.id_usuario;
  const { content, replyingToMessageId, type } = req.body;
  const pool = req.db;
  const io = req.app.get("io");

  if (!content) {
    return res
      .status(400)
      .json({ message: "O conteúdo não pode estar vazio." });
  }

  const { ciphertext, nonce } = encrypt(content);
  const repliedToId = replyingToMessageId || null;
  const messageType = type || "texto";

  try {
    const [result] = await pool.query(
      "INSERT INTO MensagensDiretas (id_remetente, id_destinatario, ConteudoCriptografado, Nonce, id_mensagem_respondida, tipo) VALUES (?, ?, ?, ?, ?, ?)",
      [currentUserId, friendId, ciphertext, nonce, repliedToId, messageType]
    );

    const messageData = {
      id_mensagem: result.insertId,
      id_remetente: currentUserId,
      id_destinatario: friendId,
      Conteudo: content,
      DataHora: new Date(),
      id_mensagem_respondida: repliedToId,
      autorNome: currentUser.Nome,
      autorFoto: currentUser.FotoPerfil,
      id_usuario: currentUserId,
      tipo: messageType,
    };

    if (repliedToId) {
      const [repliedMsgArr] = await pool.query(
        "SELECT md.ConteudoCriptografado, md.Nonce, u.Nome as autorNome, u.id_usuario as autorId FROM MensagensDiretas md JOIN Usuarios u ON md.id_remetente = u.id_usuario WHERE md.id_mensagem = ?",
        [repliedToId]
      );
      if (repliedMsgArr.length > 0) {
        messageData.repliedTo = {
          autorNome: repliedMsgArr[0].autorNome,
          autorId: repliedMsgArr[0].autorId,
          Conteudo: decrypt(repliedMsgArr[0]),
        };
      }
    }

    const ids = [currentUserId, friendId].sort();
    const roomName = `dm-${ids[0]}-${ids[1]}`;

    io.to(roomName).emit("new_dm", messageData);

    if (friendId === AI_USER_ID && messageType === "texto") {
      const aiResponseText = await getAiResponse(content);
      const { ciphertext: aiCiphertext, nonce: aiNonce } =
        encrypt(aiResponseText);

      const [aiResult] = await pool.query(
        "INSERT INTO MensagensDiretas (id_remetente, id_destinatario, ConteudoCriptografado, Nonce) VALUES (?, ?, ?, ?)",
        [AI_USER_ID, currentUserId, aiCiphertext, aiNonce]
      );
      const [aiUserDetails] = await pool.query(
        "SELECT Nome, FotoPerfil FROM Usuarios WHERE id_usuario = ?",
        [AI_USER_ID]
      );

      if (aiUserDetails.length > 0) {
        const aiMessageData = {
          id_mensagem: aiResult.insertId,
          id_remetente: AI_USER_ID,
          id_destinatario: currentUserId,
          Conteudo: aiResponseText,
          DataHora: new Date(),
          autorNome: aiUserDetails[0].Nome,
          autorFoto: aiUserDetails[0].FotoPerfil,
          id_usuario: AI_USER_ID,
          tipo: "texto",
        };
        io.to(roomName).emit("new_dm", aiMessageData);
      }
    }
    res.status(201).json(messageData);
  } catch (error) {
    next(error);
  }
});

// ROTA DELETE PARA EXCLUIR UMA MENSAGEM DIRETA
router.delete(
  "/dm/messages/:messageId",
  requireLogin,
  async (req, res, next) => {
    const { messageId } = req.params;
    const currentUserId = req.session.user.id_usuario;
    const pool = req.db;
    const io = req.app.get("io");

    try {
      const [msgResult] = await pool.query(
        "SELECT id_remetente, id_destinatario FROM MensagensDiretas WHERE id_mensagem = ?",
        [messageId]
      );
      if (msgResult.length === 0) {
        return res.status(404).json({ message: "Mensagem não encontrada." });
      }
      const message = msgResult[0];

      if (message.id_remetente !== currentUserId) {
        return res.status(403).json({
          message: "Você não pode apagar uma mensagem que não enviou.",
        });
      }

      await pool.query("DELETE FROM MensagensDiretas WHERE id_mensagem = ?", [
        messageId,
      ]);

      const ids = [message.id_remetente, message.id_destinatario].sort();
      const roomName = `dm-${ids[0]}-${ids[1]}`;
      io.to(roomName).emit("dm_message_deleted", {
        messageId: parseInt(messageId, 10),
      });

      res.status(200).json({ message: "Mensagem excluída com sucesso." });
    } catch (error) {
      next(error);
    }
  }
);

// --- ROTAS DE AMIZADE ---

// ROTA GET PARA PROCURAR USUÁRIOS
router.get("/search", requireLogin, async (req, res, next) => {
  const { q } = req.query;
  const currentUserId = req.session.user.id_usuario;
  if (!q) return res.json([]);
  const pool = req.db;
  try {
    const query = `
      SELECT u.id_usuario, u.Nome, u.FotoPerfil 
      FROM Usuarios u
      LEFT JOIN Amizades a ON 
          (a.id_utilizador_requisitante = u.id_usuario AND a.id_utilizador_requisitado = ?) OR
          (a.id_utilizador_requisitado = u.id_usuario AND a.id_utilizador_requisitante = ?)
      WHERE 
          u.Nome LIKE ?
          AND u.id_usuario != ? 
          AND u.id_usuario != ?
          AND a.id_amizade IS NULL
    `;

    const [users] = await pool.query(query, [
      currentUserId,
      currentUserId,
      `%${q}%`,
      currentUserId,
      AI_USER_ID,
    ]);
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// ROTA POST PARA ENVIAR PEDIDO DE AMIZADE
router.post("/request", requireLogin, async (req, res, next) => {
  const { requestedId } = req.body;
  const requesterUser = req.session.user;
  const requesterId = requesterUser.id_usuario;
  const pool = req.db;
  const io = req.app.get("io");

  if (!requestedId || requesterId == requestedId) {
    return res.status(400).json({ message: "Pedido inválido." });
  }

  try {
    const [existing] = await pool.query(
      "SELECT * FROM Amizades WHERE (id_utilizador_requisitante = ? AND id_utilizador_requisitado = ?) OR (id_utilizador_requisitante = ? AND id_utilizador_requisitado = ?)",
      [requesterId, requestedId, requestedId, requesterId]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        message: "Já existe um pedido de amizade com este utilizador.",
      });
    }

    const [insertResult] = await pool.query(
      "INSERT INTO Amizades (id_utilizador_requisitante, id_utilizador_requisitado, status) VALUES (?, ?, 'pendente')",
      [requesterId, requestedId]
    );
    const newFriendshipId = insertResult.insertId;

    const newRequestForTarget = {
      id_amizade: newFriendshipId,
      id_usuario: requesterId,
      Nome: requesterUser.Nome,
      FotoPerfil: requesterUser.FotoPerfil,
    };
    io.to(`user-${requestedId}`).emit(
      "friend_request_received",
      newRequestForTarget
    );

    const [requestedUser] = await pool.query(
      "SELECT id_usuario, Nome, FotoPerfil FROM Usuarios WHERE id_usuario = ?",
      [requestedId]
    );
    const newSentRequest = { id_amizade: newFriendshipId, ...requestedUser[0] };

    res.status(201).json({
      message: "Pedido de amizade enviado!",
      sentRequest: newSentRequest,
    });
  } catch (error) {
    next(error);
  }
});

// ROTA POST PARA RESPONDER A UM PEDIDO
router.post("/respond", requireLogin, async (req, res, next) => {
  const { requestId, action } = req.body;
  const currentUser = req.session.user;
  const currentUserId = currentUser.id_usuario;
  const pool = req.db;
  const io = req.app.get("io");

  if (!requestId || !["aceite", "recusada"].includes(action)) {
    return res.status(400).json({ message: "Pedido inválido." });
  }

  try {
    const [requestDetails] = await pool.query(
      "SELECT id_utilizador_requisitante FROM Amizades WHERE id_amizade = ? AND id_utilizador_requisitado = ?",
      [requestId, currentUserId]
    );
    if (requestDetails.length === 0) {
      return res.status(404).json({
        message: "Pedido não encontrado ou você não pode responder a ele.",
      });
    }
    const requesterId = requestDetails[0].id_utilizador_requisitante;

    if (action === "aceite") {
      await pool.query(
        "UPDATE Amizades SET status = 'aceite' WHERE id_amizade = ?",
        [requestId]
      );
      const newFriendData = {
        id_usuario: currentUserId,
        Nome: currentUser.Nome,
        FotoPerfil: currentUser.FotoPerfil,
      };
      io.to(`user-${requesterId}`).emit("friend_request_accepted", {
        newFriend: newFriendData,
        requestId: parseInt(requestId),
      });
    } else {
      await pool.query("DELETE FROM Amizades WHERE id_amizade = ?", [
        requestId,
      ]);
    }

    res.status(200).json({ message: `Pedido ${action} com sucesso.` });
  } catch (error) {
    next(error);
  }
});

// ROTA POST PARA CANCELAR UM PEDIDO ENVIADO
router.post("/cancel", requireLogin, async (req, res, next) => {
  const { requestId } = req.body;
  const currentUserId = req.session.user.id_usuario;
  const pool = req.db;
  const io = req.app.get("io");

  if (!requestId) {
    return res.status(400).json({ message: "ID do pedido é obrigatório." });
  }

  try {
    const [requestDetails] = await pool.query(
      "SELECT id_utilizador_requisitado FROM Amizades WHERE id_amizade = ? AND id_utilizador_requisitante = ?",
      [requestId, currentUserId]
    );
    if (requestDetails.length === 0) {
      return res
        .status(403)
        .json({ message: "Não autorizado a cancelar este pedido." });
    }
    const requestedId = requestDetails[0].id_utilizador_requisitado;
    const [result] = await pool.query(
      "DELETE FROM Amizades WHERE id_amizade = ?",
      [requestId]
    );

    if (result.affectedRows > 0) {
      io.to(`user-${requestedId}`).emit("request_cancelled", {
        requestId: parseInt(requestId),
      });
      res.status(200).json({ message: "Pedido de amizade cancelado." });
    } else {
      res.status(404).json({ message: "Pedido não encontrado." });
    }
  } catch (error) {
    next(error);
  }
});

// ROTA DELETE PARA REMOVER UMA AMIZADE
router.delete("/:friendId", requireLogin, async (req, res, next) => {
  const friendId = req.params.friendId;
  const currentUserId = req.session.user.id_usuario;
  const pool = req.db;
  const io = req.app.get("io");

  if (!friendId) {
    return res.status(400).json({ message: "ID do amigo é obrigatório." });
  }

  try {
    const [result] = await pool.query(
      `DELETE FROM Amizades WHERE status = 'aceite' AND ((id_utilizador_requisitante = ? AND id_utilizador_requisitado = ?) OR (id_utilizador_requisitante = ? AND id_utilizador_requisitado = ?))`,
      [currentUserId, friendId, friendId, currentUserId]
    );

    if (result.affectedRows > 0) {
      io.to(`user-${friendId}`).emit("friend_removed", {
        removerId: currentUserId,
      });
      res.status(200).json({ message: "Amigo removido com sucesso." });
    } else {
      res.status(404).json({ message: "Amizade não encontrada." });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
