const express = require("express");
const router = express.Router();

function requireLogin(req, res, next) {
  if(req.session && req.session.user) {
    return next()
  }
  return res.status(401).json({message: 'Acesso não autorizado'})
}

/* GET Rota para listar os usuários. */
router.get("/", async function (req, res, next) {
  try {
    const pool = req.db;
    const [rows] = await pool.query("SELECT id_usuario, Nome, Biografia, Email, FotoPerfil, id_tema FROM usuarios"); // Removida a senha e chaves
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar a lista de usuários:", err);
    next(err);
  }
});

module.exports = router;