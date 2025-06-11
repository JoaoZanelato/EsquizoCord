const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');

// Importação das rotas
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const groupsRouter = require('./routes/groups'); // <-- Rota de grupos adicionada

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
  secret: 'a_frase_mais_secreta_do_esquizocord', // Mude isto para uma frase aleatória
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' } // 'true' em produção (HTTPS)
}));


// Middleware para disponibilizar dados da sessão para as views
app.use((req, res, next) => {
  // Disponibiliza o utilizador da sessão para todas as views
  res.locals.user = req.session.user; 
  next();
});

// Definição das Rotas
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/groups', groupsRouter); // <-- Rota de grupos utilizada

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

