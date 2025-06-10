var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// adicionado do chat
const express = require('express');
const router = express.Router();
const pool = require('../banco/db');

outer.get('/', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM usuarios'); // ou outro nome de tabela
    res.render('Dashboard', { usuarios: rows });
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
