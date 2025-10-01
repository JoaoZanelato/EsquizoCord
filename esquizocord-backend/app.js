// esquizocord-backend/app.js
require("dotenv").config();
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
const createError = require("http-errors");

// Importação de Rotas
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const groupsRouter = require("./routes/groups");
const friendsRouter = require("./routes/friends");

const app = express();

// Middlewares essenciais
app.set("trust proxy", 1);
app.use(logger("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // URL do seu frontend React
    credentials: true,
  })
);

// Configuração da Sessão
const sessionMiddleware = session({
  secret:
    process.env.SESSION_SECRET || "uma_frase_bem_secreta_para_o_esquizocord",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
});
app.use(sessionMiddleware);

// Pool de Conexão com a Base de Dados
const pool = require("./db");
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Rotas da API
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/groups", groupsRouter);
app.use("/friends", friendsRouter);

// Tratamento de Erro 404
app.use(function (req, res, next) {
  next(createError(404, "Endpoint não encontrado."));
});

// Gestor de Erros Global
app.use(function (err, req, res, next) {
  console.error(err.stack); // Log do erro para debugging
  res.status(err.status || 500).json({
    message: err.message || "Ocorreu um erro interno no servidor.",
    // Em desenvolvimento, pode ser útil enviar o stack do erro
    error: req.app.get("env") === "development" ? err : {},
  });
});

module.exports = {
  app: app,
  sessionMiddleware: sessionMiddleware,
};
