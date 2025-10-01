// TESTE/app.js
require("dotenv").config();
const cors = require("cors");
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const groupsRouter = require("./routes/groups");
const friendsRouter = require("./routes/friends");
const rolesRouter = require("./routes/roles");

const app = express();

app.set("trust proxy", 1);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

const sessionMiddleware = session({
  secret: "uma_frase_bem_secreta_para_o_esquizocord",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
});

app.use(sessionMiddleware);

const pool = require("./db");
app.use((req, res, next) => {
  req.db = pool;
  next();
});

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/groups", groupsRouter);
app.use("/friends", friendsRouter);
app.use("/groups", rolesRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

// GESTOR DE ERROS CORRIGIDO
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  if (req.accepts("json")) {
    res.json({
      message: err.message,
      error: req.app.get("env") === "development" ? err : {},
    });
  } else {
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    res.render("error");
  }
});

app.use((err, req, res, next) => {
  console.error('Erro global:', err);
  if (err.stack) console.error(err.stack);
  res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
});

module.exports = {
  app: app,
  sessionMiddleware: sessionMiddleware,
};
