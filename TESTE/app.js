const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');

// Importação das rotas
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const groupsRouter = require('./routes/groups'); // <-- Garanta que esta linha existe

const app = express();

// Configuração da View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configuração dos Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuração da Sessão
app.use(session({
  secret: 'uma_frase_bem_secreta_para_o_esquizocord', // Mude isto para uma frase aleatória
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));


// Middleware para disponibilizar dados da sessão para as views
app.use((req, res, next) => {
  res.locals.user = req.session.user; 
  next();
});

// Definição das Rotas
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/groups', groupsRouter); // <-- E que esta linha também existe

// catch 404 e error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
