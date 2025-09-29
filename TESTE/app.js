require("dotenv").config();
const cors = require("cors");
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");

// Importação de todas as rotas
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const groupsRouter = require("./routes/groups");
const friendsRouter = require("./routes/friends");

const app = express();

// Confia no proxy reverso (essencial para ambientes como Render, Heroku, etc.)
app.set("trust proxy", 1);

// Configuração da View Engine (EJS)
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Configuração dos Middlewares
app.use(logger("dev"));
// Aumenta o limite de payload para acomodar dados maiores, como imagens
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  cors({
    origin: "http://localhost:3000", // Endereço do seu futuro frontend React
    credentials: true, // Essencial para permitir o envio de cookies de sessão
  })
);

// Configuração da sessão de utilizador
const sessionMiddleware = session({
  secret: "uma_frase_bem_secreta_para_o_esquizocord", // Mude para uma chave mais segura em produção
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // Usar cookies seguros em produção (HTTPS)
    httpOnly: true,
    sameSite: "lax",
  },
});

app.use(sessionMiddleware);

// Middleware para disponibilizar o pool de conexões do banco de dados para todas as rotas
const pool = require("./db");
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Middleware para disponibilizar os dados da sessão do utilizador para as views (EJS)
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Definição das Rotas da Aplicação
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/groups", groupsRouter);
app.use("/friends", friendsRouter);

// Tratamento de erro 404 (página não encontrada)
app.use(function (req, res, next) {
  next(createError(404));
});

// Tratamento de outros erros do servidor
app.use(function (err, req, res, next) {
  // Define os locais, fornecendo o erro apenas em ambiente de desenvolvimento
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // Renderiza a página de erro
  res.status(err.status || 500);
  res.render("error");
});

// Exporta a 'app' e o 'sessionMiddleware' para serem usados no arquivo `bin/www`
// onde o servidor HTTP e o Socket.IO são inicializados.
module.exports = {
  app: app,
  sessionMiddleware: sessionMiddleware,
};
