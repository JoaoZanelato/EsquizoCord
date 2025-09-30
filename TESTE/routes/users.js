const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10;

function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ message: "Acesso não autorizado" });
}

/* GET Rota para listar os usuários. */
router.get("/", async function (req, res, next) {
  try {
    const pool = req.db;
    const [rows] = await pool.query(
      "SELECT id_usuario, Nome, Biografia, Email, FotoPerfil, id_tema FROM usuarios"
    ); // Removida a senha e chaves
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar a lista de usuários:", err);
    next(err);
  }
});

// Rota pra deletar conta e tudo relacionado a ela (chats, grupos, mensagens)
router.delete("/me", requireLogin, async (req, res, next) => {
  const userId = req.session.user.id_usuario;
  const { senha } = req.body; // Recebe a senha do frontend

  if (!senha) {
    return res
      .status(400)
      .json({ message: "A senha é obrigatória para excluir a conta." });
  }

  const pool = req.db;
  const connection = await pool.getConnection();

  try {
    const [users] = await connection.query(
      "SELECT Senha FROM Usuarios WHERE id_usuario = ?",
      [userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const user = users[0];
    const match = await bcrypt.compare(senha, user.Senha);

    if (!match) {
      return res.status(403).json({
        message: "Senha incorreta. A exclusão da conta foi cancelada.",
      });
    }

    await connection.beginTransaction();

    await connection.query(
      "DELETE FROM MensagensDiretas WHERE id_remetente = ? OR id_destinatario = ?",
      [userId, userId]
    );
    await connection.query("DELETE FROM Mensagens WHERE id_usuario = ?", [
      userId,
    ]);
    await connection.query(
      "DELETE FROM ParticipantesGrupo WHERE id_usuario = ?",
      [userId]
    );
    await connection.query("DELETE FROM Administradores WHERE id_usuario = ?", [
      userId,
    ]);
    await connection.query("DELETE FROM Moderadores WHERE id_usuario = ?", [
      userId,
    ]);
    await connection.query(
      "DELETE FROM Amizades WHERE id_utilizador_requisitante = ? OR id_utilizador_requisitado = ?",
      [userId, userId]
    );

    const [groupsCreated] = await connection.query(
      "SELECT id_grupo FROM Grupos WHERE id_criador = ?",
      [userId]
    );
    for (const group of groupsCreated) {
      await connection.query(
        "DELETE FROM Mensagens WHERE id_chat IN (SELECT id_chat FROM Chats WHERE id_grupo = ?)",
        [group.id_grupo]
      );
      await connection.query("DELETE FROM Chats WHERE id_grupo = ?", [
        group.id_grupo,
      ]);
      await connection.query(
        "DELETE FROM ParticipantesGrupo WHERE id_grupo = ?",
        [group.id_grupo]
      );
      await connection.query("DELETE FROM Grupos WHERE id_grupo = ?", [
        group.id_grupo,
      ]);
    }

    await connection.query("DELETE FROM Usuarios WHERE id_usuario = ?", [
      userId,
    ]);
    await connection.commit();

    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Conta excluída com sucesso." });
    });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao excluir a conta:", error);
    next(error);
  } finally {
    connection.release();
  }
});

// ROTA GET PARA BUSCAR UM PERFIL DE USUÁRIO PÚBLICO
router.get("/:id/profile", requireLogin, async (req, res, next) => {
  const { id } = req.params;
  const pool = req.db;

  try {
    const [users] = await pool.query(
      "SELECT id_usuario, Nome, FotoPerfil, Biografia FROM Usuarios WHERE id_usuario = ?",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    res.json(users[0]);
  } catch (error) {
    next(error);
  }
});
router.post("/change-password", requireLogin, async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.session.user.id_usuario;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res
      .status(400)
      .json({ message: "Todos os campos são obrigatórios." });
  }

  if (newPassword !== confirmPassword) {
    return res
      .status(400)
      .json({ message: "A nova senha e a confirmação não coincidem." });
  }

  const pool = req.db;
  try {
    const [users] = await pool.query(
      "SELECT Senha FROM Usuarios WHERE id_usuario = ?",
      [userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const user = users[0];
    const match = await bcrypt.compare(currentPassword, user.Senha);

    if (!match) {
      return res.status(403).json({ message: "A senha atual está incorreta." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    await pool.query("UPDATE Usuarios SET Senha = ? WHERE id_usuario = ?", [
      hashedNewPassword,
      userId,
    ]);

    res.status(200).json({ message: "Senha alterada com sucesso!" });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    next(error);
  }
});

router.get("/:id/full-profile", requireLogin, async (req, res, next) => {
  const targetUserId = parseInt(req.params.id, 10);
  const currentUserId = req.session.user.id_usuario;
  const pool = req.db;

  // Se o utilizador estiver a ver o seu próprio perfil, não precisamos de calcular mútuos.
  if (targetUserId === currentUserId) {
    const [self] = await pool.query(
      "SELECT id_usuario, Nome, FotoPerfil, Biografia FROM Usuarios WHERE id_usuario = ?",
      [currentUserId]
    );
    return res.json({ user: self[0] });
  }

  try {
    // 1. Buscar informações básicas do utilizador alvo
    const [users] = await pool.query(
      "SELECT id_usuario, Nome, FotoPerfil, Biografia FROM Usuarios WHERE id_usuario = ?",
      [targetUserId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }
    const userProfile = users[0];

    // 2. Verificar o estado da amizade
    const [friendship] = await pool.query(
      "SELECT * FROM Amizades WHERE (id_utilizador_requisitante = ? AND id_utilizador_requisitado = ?) OR (id_utilizador_requisitante = ? AND id_utilizador_requisitado = ?)",
      [currentUserId, targetUserId, targetUserId, currentUserId]
    );

    // 3. Buscar grupos em comum
    const [mutualGroups] = await pool.query(
      `
            SELECT g.id_grupo, g.Nome, g.Foto 
            FROM Grupos g
            JOIN ParticipantesGrupo pg1 ON g.id_grupo = pg1.id_grupo
            JOIN ParticipantesGrupo pg2 ON g.id_grupo = pg2.id_grupo
            WHERE pg1.id_usuario = ? AND pg2.id_usuario = ?`,
      [currentUserId, targetUserId]
    );

    // 4. Buscar amigos em comum (Esta é uma query complexa)
    const [mutualFriends] = await pool.query(
      `
            SELECT u.id_usuario, u.Nome, u.FotoPerfil
            FROM Usuarios u
            WHERE u.id_usuario IN (
                -- Amigos do utilizador atual
                SELECT CASE WHEN a1.id_utilizador_requisitante = ? THEN a1.id_utilizador_requisitado ELSE a1.id_utilizador_requisitante END
                FROM Amizades a1
                WHERE (a1.id_utilizador_requisitante = ? OR a1.id_utilizador_requisitado = ?) AND a1.status = 'aceite'
            ) AND u.id_usuario IN (
                -- Amigos do utilizador alvo
                SELECT CASE WHEN a2.id_utilizador_requisitante = ? THEN a2.id_utilizador_requisitado ELSE a2.id_utilizador_requisitante END
                FROM Amizades a2
                WHERE (a2.id_utilizador_requisitante = ? OR a2.id_utilizador_requisitado = ?) AND a2.status = 'aceite'
            ) AND u.id_usuario NOT IN (?, ?, 1)`, 
      [
        currentUserId,
        currentUserId,
        currentUserId,
        targetUserId,
        targetUserId,
        targetUserId,
        currentUserId,
        targetUserId,
      ]
    );

    res.json({
      user: userProfile,
      friendship: friendship.length > 0 ? friendship[0] : null,
      mutuals: {
        groups: mutualGroups,
        friends: mutualFriends,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
