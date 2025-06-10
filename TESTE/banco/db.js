const express = require('express');
const mysql = require('mysql2/promise'); // Use a versão com Promises para código mais limpo

const app = express();
const port = 3000;

// 1. Configuração do Pool de Conexões com o MariaDB
const pool = mysql.createPool({
  host: 'localhost',       // ou o IP do seu servidor de banco de dados
  user: 'root',     // seu usuário do MariaDB
  password: '123456',   // sua senha do MariaDB
  database: 'EsquizoData',   // nome do banco de dados
  waitForConnections: true,
  connectionLimit: 10,     // número máximo de conexões no pool
  queueLimit: 0
});

// 2. Rota de Exemplo para Testar a Conexão
app.get('/usuarios', async (req, res) => {
  try {
    const [rows, fields] = await pool.query('SELECT * FROM usuarios');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).send('Erro no servidor');
  }
});

app.listen(port, () => {
  console.log(`Servidor Express rodando na porta ${port}`);
});