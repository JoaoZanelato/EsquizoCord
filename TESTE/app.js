// Importações principais
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');


const pool = require('./db');

// Importação das rotas
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

// Inicia a aplicação Express
const app = express();

// Configuração da View Engine (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configuração dos Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para disponibilizar o pool de conexões para todas as rotas
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
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

// Exporta a aplicação para que o bin/www possa usá-la
module.exports = app;
