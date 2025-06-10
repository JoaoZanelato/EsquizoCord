const express = require("express");
const router = express.Router();

/* GET Rota para listar os usuários. */
router.get("/", async function (req, res, next) {
  try {
    // Acessa o pool de conexões que o app.js nos deu via `req.db`.
    const pool = req.db;

    // Faz a consulta para buscar os usuários.
    const [rows] = await pool.query("SELECT * FROM usuarios");

    // Responde com os dados dos usuários em formato JSON.
    // Ou, se preferir renderizar uma página: res.render('uma-view', { usuarios: rows });
    res.json(rows);
  } catch (err) {
    // Se algo der errado, passa o erro para o handler central do Express.
    console.error("Erro ao buscar a lista de usuários:", err);
    next(err);
  }
});

module.exports = router;
