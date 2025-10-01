// esquizocord-backend/routes/friends.js
const express = require("express");
const router = express.Router();
const { body, query, param } = require("express-validator");
const { validate } = require("../middlewares/validation");
const { requireLogin } = require("../middlewares/auth");
const friendService = require("../services/friendService");

// --- Validações ---
const searchValidation = [
  query("q")
    .notEmpty()
    .withMessage("O termo de pesquisa não pode estar vazio.")
    .trim()
    .escape(),
];
const requestValidation = [
  body("requestedId").isInt().withMessage("ID do utilizador inválido."),
];
const respondValidation = [
  body("requestId").isInt(),
  body("action").isIn(["aceite", "recusada"]),
];
const cancelValidation = [body("requestId").isInt()];
const friendIdValidation = [param("friendId").isInt()];
const messageIdValidation = [param("messageId").isInt()];
const sendMessageValidation = [
  param("friendId").isInt(),
  body("content").notEmpty().trim(),
  body("type").isIn(["texto", "imagem"]).optional(),
  body("replyingToMessageId").isInt().optional(),
];

// --- Rotas ---
router.get(
  "/search",
  requireLogin,
  searchValidation,
  validate,
  async (req, res, next) => {
    try {
      const users = await friendService.searchUsers(
        req.query.q,
        req.session.user.id_usuario,
        req.db
      );
      res.json(users);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/request",
  requireLogin,
  requestValidation,
  validate,
  async (req, res, next) => {
    try {
      const result = await friendService.sendFriendRequest(
        req.session.user.id_usuario,
        req.body.requestedId,
        req.db,
        req.app.get("io")
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/respond",
  requireLogin,
  respondValidation,
  validate,
  async (req, res, next) => {
    try {
      await friendService.respondToFriendRequest(
        req.body.requestId,
        req.body.action,
        req.session.user.id_usuario,
        req.db,
        req.app.get("io")
      );
      res
        .status(200)
        .json({ message: `Pedido ${req.body.action} com sucesso.` });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/cancel",
  requireLogin,
  cancelValidation,
  validate,
  async (req, res, next) => {
    try {
      await friendService.cancelFriendRequest(
        req.body.requestId,
        req.session.user.id_usuario,
        req.db,
        req.app.get("io")
      );
      res.status(200).json({ message: "Pedido de amizade cancelado." });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:friendId",
  requireLogin,
  friendIdValidation,
  validate,
  async (req, res, next) => {
    try {
      await friendService.removeFriend(
        req.params.friendId,
        req.session.user.id_usuario,
        req.db,
        req.app.get("io")
      );
      res.status(200).json({ message: "Amigo removido com sucesso." });
    } catch (error) {
      next(error);
    }
  }
);

// --- Rotas de Mensagens Diretas ---
router.get(
  "/dm/:friendId/messages",
  requireLogin,
  friendIdValidation,
  validate,
  async (req, res, next) => {
    try {
      const messages = await friendService.getDirectMessages(
        req.params.friendId,
        req.session.user.id_usuario,
        req.db
      );
      res.json(messages);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/dm/:friendId/messages",
  requireLogin,
  sendMessageValidation,
  validate,
  async (req, res, next) => {
    try {
      const messageData = await friendService.sendDirectMessage(
        {
          content: req.body.content,
          type: req.body.type || "texto",
          repliedToId: req.body.replyingToMessageId || null,
          sender: req.session.user,
          recipientId: parseInt(req.params.friendId),
        },
        req.db,
        req.app.get("io")
      );
      res.status(201).json(messageData);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/dm/messages/:messageId",
  requireLogin,
  messageIdValidation,
  validate,
  async (req, res, next) => {
    try {
      await friendService.deleteDirectMessage(
        req.params.messageId,
        req.session.user.id_usuario,
        req.db,
        req.app.get("io")
      );
      res.status(200).json({ message: "Mensagem apagada com sucesso." });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
