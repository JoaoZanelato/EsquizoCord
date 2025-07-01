const express = require("express");
const router = express.Router();

function requireLogin(req, res, next) {
  if(req.session && req.session.user) {
    return next()
  }
  return res.status(401).json({message: 'Acesso não autorixado'})
}

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

// ROTA PARA SALVAR A CHAVE PÚBLICA DE UM USUÁRIO
router.post ('/save-public-key', requireLogin, async (req, res, next) =>{
  const {publicKey} = req.body
  const userId = req.session.user.id_usuario

  if(!publicKey) {
    return res.status(400).json({message: "Chave pública não fornecida."
    })
  }

  try {
    const pool = req.db
    await pool.query(
      "UPDATE Usuarios SET chave_publica = ? WHERE id_usuario = ?", 
      [publicKey, userId]
    )
    res.status(200).json({message: "Chave pública salva com sucesso."})
  } catch(error) {
    console.error("ERRO ao salvar chave pública: ", error)
    next(error)
  }
})

// ROTA PARA BUSCAR A CHAVE PÚBLICA DE OUTRO USUÁRIO
router.get('/:id/public-key', requireLogin, async (req, res, next) =>{
  const userIdToFind = req.params.id
  try{
    const pool = req.db
    const [rows] = await pool.query("SELECT chave_publica FROM Usuarios WHERE id_usuario = ?", [userIdToFind])
  
    if(rows.length > 0 && rows[0].chave_publica) {
      res.json({publicKey: rows[0].chave_publica})
    } else {res.status(404).json({message: "Chave pública não encontrada para este usuário."})}
  } catch (error){next(error)}
})
module.exports = router;
