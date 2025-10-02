// esquizocord-backend/routes/groups.js
const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const { validate } = require("../middlewares/validation");
const { requireLogin } = require("../middlewares/auth");
const groupService = require("../services/groupService");
const { setupMulter } = require("../utils/multer-config");

const groupUpload = setupMulter("esquizocord_groups");
const chatImageUpload = setupMulter("esquizocord_chat_images", {
  width: 800,
  height: 800,
  crop: "limit",
});

// --- Validações ---
const groupIdValidation = [param("groupId").isInt({ min: 1 })];
const channelIdValidation = [param("channelId").isInt({ min: 1 })];
const memberIdValidation = [param("memberId").isInt({ min: 1 })];
const roleIdValidation = [param("roleId").isInt({ min: 1 })];
const messageIdValidation = [param("messageId").isInt({ min: 1 })];
const editMessageValidation = [
  param("messageId").isInt(),
  body("content")
    .notEmpty()
    .withMessage("O conteúdo não pode estar vazio.")
    .trim(),
];

// --- Rotas de Grupo ---
router.post(
  "/upload/chat-image",
  requireLogin,
  chatImageUpload.single("chat-image"),
  (req, res, next) => {
    try {
      if (!req.file) {
        throw { status: 400, message: "Nenhum ficheiro de imagem enviado." };
      }
      res.status(200).json({ url: req.file.path });
    } catch (error) {
      next(error);
    }
  }
);
router.post(
  "/criar",
  requireLogin,
  groupUpload.single("foto"),
  [
    body("nome")
      .isLength({ min: 1, max: 100 })
      .withMessage("O nome do grupo é obrigatório.")
      .trim()
      .escape(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await groupService.createGroup(
        {
          nome: req.body.nome,
          isPrivate: req.body.isPrivate === "on",
          fotoUrl: req.file ? req.file.path : null,
          creatorId: req.session.user.id_usuario,
        },
        req.db
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/search",
  requireLogin,
  [query("q").trim().escape()],
  async (req, res, next) => {
    try {
      const groups = await groupService.searchPublicGroups(
        req.query.q || "",
        req.session.user.id_usuario,
        req.db
      );
      res.json(groups);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/:groupId/join",
  requireLogin,
  groupIdValidation,
  validate,
  async (req, res, next) => {
    try {
      await groupService.joinGroup(
        req.params.groupId,
        req.session.user.id_usuario,
        req.db
      );
      res.status(200).json({ message: "Entrou no grupo com sucesso!" });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:groupId/details",
  requireLogin,
  groupIdValidation,
  validate,
  async (req, res, next) => {
    try {
      const details = await groupService.getGroupDetails(
        req.params.groupId,
        req.session.user.id_usuario,
        req.db
      );
      res.json(details);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/:groupId/settings",
  requireLogin,
  groupIdValidation,
  groupUpload.single("foto"),
  validate,
  async (req, res, next) => {
    try {
      await groupService.updateGroupSettings(
        req.params.groupId,
        req.session.user.id_usuario,
        {
          nome: req.body.nome,
          isPrivate: req.body.isPrivate === "on",
          fotoUrl: req.file ? req.file.path : null,
        },
        req.db
      );
      res.status(200).json({ message: "Grupo atualizado com sucesso." });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:groupId",
  requireLogin,
  groupIdValidation,
  validate,
  async (req, res, next) => {
    try {
      await groupService.deleteGroup(
        req.params.groupId,
        req.session.user.id_usuario,
        req.db
      );
      res.status(200).json({ message: "Grupo apagado com sucesso." });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:groupId/members/:memberId",
  requireLogin,
  [...groupIdValidation, ...memberIdValidation],
  validate,
  async (req, res, next) => {
    try {
      await groupService.banMember(
        req.params.groupId,
        req.params.memberId,
        req.session.user.id_usuario,
        req.db,
        req.app.get("io")
      );
      res.status(200).json({ message: "Membro banido com sucesso." });
    } catch (error) {
      next(error);
    }
  }
);

// --- Rotas de Canais ---
// --- INÍCIO DA ALTERAÇÃO ---
router.post(
  "/:groupId/channels",
  requireLogin,
  groupIdValidation,
  [
    body("channelName").isLength({ min: 1, max: 100 }).trim().escape(),
    body("channelType")
      .isIn(["TEXTO", "VOZ"])
      .withMessage("Tipo de canal inválido."),
  ],
  validate,
  async (req, res, next) => {
    try {
      const newChannel = await groupService.createChannel(
        req.params.groupId,
        req.session.user.id_usuario,
        req.body.channelName,
        req.body.channelType,
        req.db
      );
      res.status(201).json(newChannel);
    } catch (error) {
      next(error);
    }
  }
);
// --- FIM DA ALTERAÇÃO ---

router.delete(
  "/:groupId/channels/:channelId",
  requireLogin,
  [...groupIdValidation, ...channelIdValidation],
  validate,
  async (req, res, next) => {
    try {
      await groupService.deleteChannel(
        req.params.groupId,
        req.params.channelId,
        req.session.user.id_usuario,
        req.db,
        req.app.get("io")
      );
      res.status(200).json({ message: "Canal apagado com sucesso." });
    } catch (error) {
      next(error);
    }
  }
);

// --- Rotas de Mensagens de Grupo ---
router.get(
  "/chats/:channelId/messages",
  requireLogin,
  channelIdValidation,
  validate,
  async (req, res, next) => {
    try {
      const messages = await groupService.getGroupMessages(
        req.params.channelId,
        req.db
      );
      res.json(messages);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/chats/:channelId/messages",
  requireLogin,
  channelIdValidation,
  [body("content").notEmpty().trim()],
  validate,
  async (req, res, next) => {
    try {
      const messageData = await groupService.sendGroupMessage(
        {
          ...req.body,
          sender: req.session.user,
          chatId: req.params.channelId,
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

router.put(
  "/messages/:messageId",
  requireLogin,
  editMessageValidation,
  validate,
  async (req, res, next) => {
    try {
      await groupService.editGroupMessage(
        req.params.messageId,
        req.body.content,
        req.session.user.id_usuario,
        req.db,
        req.app.get("io")
      );
      res.status(200).json({ message: "Mensagem editada com sucesso." });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/messages/:messageId",
  requireLogin,
  messageIdValidation,
  validate,
  async (req, res, next) => {
    try {
      await groupService.deleteGroupMessage(
        req.params.messageId,
        req.session.user.id_usuario,
        req.db,
        req.app.get("io")
      );
      res.status(200).json({ message: "Mensagem apagada." });
    } catch (error) {
      next(error);
    }
  }
);

// --- Rotas de Cargos ---
router.get(
  "/:groupId/roles",
  requireLogin,
  groupIdValidation,
  validate,
  async (req, res, next) => {
    try {
      const [roles] = await groupService.getRoles(req.params.groupId, req.db);
      res.json(roles);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/:groupId/roles",
  requireLogin,
  groupIdValidation,
  validate,
  async (req, res, next) => {
    try {
      const newRole = await groupService.createRole(
        req.params.groupId,
        req.session.user.id_usuario,
        req.body,
        req.db
      );
      res.status(201).json(newRole);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:groupId/roles/:roleId",
  requireLogin,
  [...groupIdValidation, ...roleIdValidation],
  validate,
  async (req, res, next) => {
    try {
      await groupService.updateRole(
        req.params.groupId,
        req.params.roleId,
        req.session.user.id_usuario,
        req.body,
        req.db
      );
      res.status(200).json({ message: "Cargo atualizado." });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:groupId/roles/:roleId",
  requireLogin,
  [...groupIdValidation, ...roleIdValidation],
  validate,
  async (req, res, next) => {
    try {
      await groupService.deleteRole(
        req.params.groupId,
        req.params.roleId,
        req.session.user.id_usuario,
        req.db
      );
      res.status(200).json({ message: "Cargo apagado." });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:groupId/members/:memberId/roles",
  requireLogin,
  [...groupIdValidation, ...memberIdValidation],
  [body("roles").isArray()],
  validate,
  async (req, res, next) => {
    try {
      await groupService.updateUserRoles(
        req.params.groupId,
        req.params.memberId,
        req.session.user.id_usuario,
        req.body.roles,
        req.db
      );
      res.status(200).json({ message: "Cargos do membro atualizados." });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
