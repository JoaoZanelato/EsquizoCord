const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = 'morgan';
const session = require('express-session');

// Importação das rotas
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const groupsRouter = require('./routes/groups');

const app = express();

// --- CORREÇÃO PARA O RENDER ---
// Diz ao Express para confiar no reverse proxy do Render.
// Isto é essencial para que as sessões e os cookies seguros funcionem corretamente.
app.set('trust proxy', 1); 

// Configuração da View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configuração dos Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuração da Sessão Atualizada para Produção
app.use(session({
  secret: 'a_frase_mais_secreta_do_esquizocord', // Mude isto para uma frase aleatória
  resave: false,
  saveUninitialized: false, // Alterado para false, boa prática
  cookie: { 
      secure: process.env.NODE_ENV === 'production', // Cookie seguro apenas em produção (HTTPS)
      httpOnly: true, // Protege contra ataques XSS
      sameSite: 'lax' // Proteção contra ataques CSRF
    } 
}));


// Middleware para disponibilizar a conexão da DB para todas as rotas
// (Certifique-se de que a importação do 'pool' está no seu ficheiro real)
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

// catch 404 and forward to error handler
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
