// db.js

// 1. Importa as bibliotecas necessárias
const mysql = require("mysql2/promise");
require("dotenv").config(); // Carrega as variáveis do arquivo .env

// 2. Cria o pool de conexões com configuração explícita de SSL
console.log("Criando pool de conexões com o banco de dados...");
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Configuração SSL segura usando uma variável de ambiente.
  // Isso mantém seu certificado seguro e fora do controle de versão.
  ssl: {
    // Lê o certificado diretamente da variável de ambiente DB_CA_CERT.
    ca: process.env.DB_CA_CERT,
  },
});

// 3. Exporta o pool para ser usado em outros arquivos
module.exports = pool;
