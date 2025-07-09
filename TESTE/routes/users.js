const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');

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

// Rota pra deletar conta e tudo relacionado a ela (chats, grupos, mensagens)
router.delete('/me', requireLogin, async (req, res, next) => {
  const userId = req.session.user.id_usuario;
  const { senha } = req.body; // Recebe a senha do frontend

  if (!senha) {
      return res.status(400).json({ message: 'A senha é obrigatória para excluir a conta.' });
  }

  const pool = req.db;
  const connection = await pool.getConnection();

  try {
      const [users] = await connection.query('SELECT Senha FROM Usuarios WHERE id_usuario = ?', [userId]);
      if (users.length === 0) {
          return res.status(404).json({ message: 'Usuário não encontrado.' });
      }

      const user = users[0];
      const match = await bcrypt.compare(senha, user.Senha);

      if (!match) {
          return res.status(403).json({ message: 'Senha incorreta. A exclusão da conta foi cancelada.' });
      }

      await connection.beginTransaction();

      await connection.query('DELETE FROM MensagensDiretas WHERE id_remetente = ? OR id_destinatario = ?', [userId, userId]);
      await connection.query('DELETE FROM Mensagens WHERE id_usuario = ?', [userId]);
      await connection.query('DELETE FROM ParticipantesGrupo WHERE id_usuario = ?', [userId]);
      await connection.query('DELETE FROM Administradores WHERE id_usuario = ?', [userId]);
      await connection.query('DELETE FROM Moderadores WHERE id_usuario = ?', [userId]);
      await connection.query('DELETE FROM Amizades WHERE id_utilizador_requisitante = ? OR id_utilizador_requisitado = ?', [userId, userId]);
      
      const [groupsCreated] = await connection.query('SELECT id_grupo FROM Grupos WHERE id_criador = ?', [userId]);
      for (const group of groupsCreated) {
          await connection.query("DELETE FROM Mensagens WHERE id_chat IN (SELECT id_chat FROM Chats WHERE id_grupo = ?)", [group.id_grupo]);
          await connection.query("DELETE FROM Chats WHERE id_grupo = ?", [group.id_grupo]);
          await connection.query("DELETE FROM ParticipantesGrupo WHERE id_grupo = ?", [group.id_grupo]);
          await connection.query("DELETE FROM Grupos WHERE id_grupo = ?", [group.id_grupo]);
      }

      await connection.query('DELETE FROM Usuarios WHERE id_usuario = ?', [userId]);
      await connection.commit();

      req.session.destroy(err => {
          if (err) return next(err);
          res.clearCookie('connect.sid');
          res.status(200).json({ message: 'Conta excluída com sucesso.' });
      });

  } catch (error) {
      await connection.rollback();
      console.error("Erro ao excluir a conta:", error);
      next(error);
  } finally {
      connection.release();
  }
});

module.exports = router;