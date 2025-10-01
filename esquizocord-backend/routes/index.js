// esquizocord-backend/routes/index.js
const express = require("express");
const router = express.Router();
const { body, query } = require("express-validator");
const { validate } = require("../middlewares/validation");
const { requireLogin } = require("../middlewares/auth");
const authService = require("../services/authService");
const dashboardService = require("../services/dashboardService");

// --- Validation Middlewares ---
const loginValidation = [
  body("email").isEmail().withMessage("Formato de e-mail inválido."),
  body("senha").notEmpty().withMessage("A senha é obrigatória."),
];

const registerValidation = [
  body("nome")
    .isLength({ min: 3 })
    .withMessage("O nome deve ter pelo menos 3 caracteres.")
    .trim()
    .escape(),
  body("email")
    .isEmail()
    .withMessage("Formato de e-mail inválido.")
    .normalizeEmail(),
  body("senha")
    .isLength({ min: 6 })
    .withMessage("A senha deve ter pelo menos 6 caracteres."),
  body("confirmar_senha").custom((value, { req }) => {
    if (value !== req.body.senha) {
      throw new Error("A confirmação de senha não corresponde à senha.");
    }
    return true;
  }),
];

// --- Auth Routes ---
router.post("/login", loginValidation, validate, async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    const user = await authService.loginUser(email, senha, req.db);
    req.session.user = user;
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/cadastro",
  registerValidation,
  validate,
  async (req, res, next) => {
    try {
      await authService.registerUser(req.body, req.db);
      res
        .status(201)
        .json({
          message: "Registo realizado com sucesso! Verifique o seu e-mail.",
        });
    } catch (error) {
      next(error);
    }
  }
);

router.post("/sair", (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res
      .clearCookie("connect.sid")
      .status(200)
      .json({ message: "Logout realizado com sucesso." });
  });
});

router.get("/session", (req, res) => {
  if (req.session && req.session.user) {
    return res.status(200).json({ user: req.session.user });
  }
  res.status(401).json({ user: null });
});

// --- Email Verification Routes ---
router.get(
  "/verificar-email",
  [
    query("token")
      .notEmpty()
      .withMessage("Token é obrigatório.")
      .trim()
      .escape(),
  ],
  validate,
  async (req, res, next) => {
    try {
      await authService.verifyEmail(req.query.token, req.db);
      res.status(200).json({ message: "E-mail verificado com sucesso!" });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/reenviar-verificacao",
  [body("email").isEmail().withMessage("E-mail inválido.").normalizeEmail()],
  validate,
  async (req, res, next) => {
    try {
      await authService.resendVerification(req.body.email, req.db);
      res
        .status(200)
        .json({ message: "E-mail de verificação reenviado com sucesso." });
    } catch (error) {
      next(error);
    }
  }
);

// --- Password Reset Routes ---
router.post(
  "/esqueceu-senha",
  [body("email").isEmail().normalizeEmail()],
  validate,
  async (req, res, next) => {
    try {
      await authService.forgotPassword(req.body.email, req.db);
      res
        .status(200)
        .json({
          message:
            "Se existir uma conta com este e-mail, um link de recuperação foi enviado.",
        });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/redefinir-senha",
  [body("token").notEmpty(), body("senha").isLength({ min: 6 })],
  validate,
  async (req, res, next) => {
    try {
      await authService.resetPassword(req.body.token, req.body.senha, req.db);
      res.status(200).json({ message: "Senha redefinida com sucesso!" });
    } catch (error) {
      next(error);
    }
  }
);

// --- Dashboard Route ---
router.get("/dashboard", requireLogin, async (req, res, next) => {
  try {
    const userId = req.session.user.id_usuario;
    const onlineUsers = req.app.get("onlineUsers") || new Set();
    const data = await dashboardService.getDashboardData(
      userId,
      Array.from(onlineUsers),
      req.db
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
