const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');

// Importação de todas as rotas
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const groupsRouter = require('./routes/groups');
const friendsRouter = require('./routes/friends');

const app = express();

// Confia no proxy reverso do Render para que as sessões seguras funcionem
app.set('trust proxy', 1); 

// Configuração da View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configuração dos Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


const  sessionMiddleware = session({
  secret: 'uma_frase_bem_secreta_para_o_esquizocord',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
})

app.use(sessionMiddleware)


// Configuração da Sessão para produção


// Middleware para disponibilizar a conexão da DB para todas as rotas
const pool = require('./db'); 
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Middleware para disponibilizar dados da sessão para as views
app.use((req, res, next) => {
  res.locals.user = req.session.user; 
  next();
});

// Definição das Rotas
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/groups', groupsRouter);
app.use('/friends', friendsRouter);

// Tratamento de erro 404
app.use(function(req, res, next) {
  next(createError(404));
});

// Tratamento de outros erros
app.use(function(err, req, res, next) {
  // Define os locais, fornecendo o erro apenas em desenvolvimento
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Renderiza a página de erro
  res.status(err.status || 500);
  res.render('error');
});

module.exports = {
  app: app,
  sessionMiddleware: sessionMiddleware
}


