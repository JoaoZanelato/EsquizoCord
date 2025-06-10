// db.js

// comando chat
const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: 'localhost', // ou IP do seu servidor
  user: 'seu_usuario',
  password: 'sua_senha',
  database: 'nome_do_banco',
  connectionLimit: 5
});

module.exports = pool;