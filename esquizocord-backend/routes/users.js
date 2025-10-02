// esquizocord-backend/routes/users.js
const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const { validate } = require("../middlewares/validation");
const { requireLogin } = require("../middlewares/auth");
const userService = require("../services/userService");
const { setupMulter } = require("../utils/multer-config");

const profileUpload = setupMulter("esquizocord_profiles");

const passwordValidation = [
  body("currentPassword").notEmpty(),
  body("newPassword").isLength({ min: 6 }),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword)
      throw new Error("As novas senhas não coincidem.");
    return true;
  }),
];

// --- INÍCIO DA NOVA ROTA E VALIDAÇÃO ---
const statusValidation = [
  body("status").isIn(["online", "ausente", "ocupado", "invisivel"]),
  body("status_personalizado").isLength({ max: 128 }).trim().escape(),
];

router.post(
  "/status",
  requireLogin,
  statusValidation,
  validate,
  async (req, res, next) => {
    try {
      await userService.updateUserStatus(
        {
          userId: req.session.user.id_usuario,
          ...req.body,
        },
        req.db
      );

      // Notificar outros utilizadores sobre a mudança de status via Socket.IO
      req.app.get("io").emit("user_status_changed", {
        userId: req.session.user.id_usuario,
        status: req.body.status,
        status_personalizado: req.body.status_personalizado,
      });

      res.status(200).json({ message: "Status atualizado com sucesso!" });
    } catch (error) {
      next(error);
    }
  }
);
// --- FIM DA NOVA ROTA E VALIDAÇÃO ---

router.get("/temas", requireLogin, async (req, res, next) => {
  try {
    const themes = await userService.getThemes(req.db);
    res.json(themes);
  } catch (error) {
    next(error);
  }
});

router.get(
  "/:id/profile",
  requireLogin,
  [param("id").isInt()],
  validate,
  async (req, res, next) => {
    try {
      const profile = await userService.getUserProfile(req.params.id, req.db);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:id/full-profile",
  requireLogin,
  [param("id").isInt()],
  validate,
  async (req, res, next) => {
    try {
      const profileData = await userService.getFullUserProfile(
        parseInt(req.params.id),
        req.session.user.id_usuario,
        req.db
      );
      res.json(profileData);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/configuracao",
  requireLogin,
  profileUpload.single("fotoPerfil"),
  async (req, res, next) => {
    try {
      const fotoUrl = req.file ? req.file.path : null;
      const updatedUser = await userService.updateUserProfile(
        {
          userId: req.session.user.id_usuario,
          fotoUrl,
          ...req.body,
        },
        req.db
      );
      req.session.user = updatedUser; // Atualiza a sessão
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/change-password",
  requireLogin,
  passwordValidation,
  validate,
  async (req, res, next) => {
    try {
      await userService.changePassword(
        { userId: req.session.user.id_usuario, ...req.body },
        req.db
      );
      res.status(200).json({ message: "Senha alterada com sucesso!" });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/me",
  requireLogin,
  [body("senha").notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      await userService.deleteAccount(
        req.session.user.id_usuario,
        req.body.senha,
        req.db
      );
      req.session.destroy((err) => {
        if (err) return next(err);
        res
          .clearCookie("connect.sid")
          .status(200)
          .json({ message: "Conta apagada com sucesso." });
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
