// Importações principais
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// 1. Importa o pool de conexões do seu arquivo db.js
const pool = require('./db');

// Importação das rotas
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

// Inicia a aplicação Express
const app = express();
const port = 3000;

// Configuração da View Engine (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configuração dos Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 2. Middleware para disponibilizar o pool de conexões para todas as rotas
//    Qualquer rota agora pode acessar o banco de dados através de `req.db`
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Definição das Rotas
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Middleware para tratar erro 404 (Not Found)
app.use(function(req, res, next) {
  next(createError(404));
});

// Middleware para tratar outros erros
app.use(function(err, req, res, next) {
  // Define informações do erro para o template de erro
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Renderiza a página de erro
  res.status(err.status || 500);
  res.render('error');
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});