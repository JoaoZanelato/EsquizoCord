// TESTE/routes/roles.js
const express = require("express");
const router = express.Router();

// Middleware para verificar se o usuário é o criador do grupo (permissão máxima)
async function isGroupCreator(req, res, next) {
  try {
    const { groupId } = req.params;
    const userId = req.session.user.id_usuario;
    const pool = req.db;
    const [rows] = await pool.query(
      "SELECT id_criador FROM Grupos WHERE id_grupo = ?",
      [groupId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Grupo não encontrado." });
    }
    if (rows[0].id_criador !== userId) {
      return res
        .status(403)
        .json({ message: "Apenas o criador pode gerir os cargos." });
    }
    return next();
  } catch (error) {
    next(error);
  }
}

// ROTA GET: Obter todos os cargos de um grupo
router.get("/:groupId/roles", async (req, res, next) => {
  try {
    const pool = req.db;
    const [roles] = await pool.query(
      "SELECT * FROM Cargos WHERE id_grupo = ?",
      [req.params.groupId]
    );
    res.json(roles);
  } catch (error) {
    next(error);
  }
});

// ROTA POST: Criar um novo cargo
router.post("/:groupId/roles", isGroupCreator, async (req, res, next) => {
  const { nome_cargo, cor, permissoes } = req.body;
  if (!nome_cargo) {
    return res.status(400).json({ message: "O nome do cargo é obrigatório." });
  }
  try {
    const pool = req.db;
    const [result] = await pool.query(
      "INSERT INTO Cargos (id_grupo, nome_cargo, cor, permissoes) VALUES (?, ?, ?, ?)",
      [req.params.groupId, nome_cargo, cor || "#99aab5", permissoes || 0]
    );
    res
      .status(201)
      .json({ id_cargo: result.insertId, nome_cargo, cor, permissoes });
  } catch (error) {
    next(error);
  }
});

// ROTA PUT: Atualizar um cargo
router.put(
  "/:groupId/roles/:roleId",
  isGroupCreator,
  async (req, res, next) => {
    const { nome_cargo, cor, permissoes } = req.body;
    try {
      const pool = req.db;
      await pool.query(
        "UPDATE Cargos SET nome_cargo = ?, cor = ?, permissoes = ? WHERE id_cargo = ? AND id_grupo = ?",
        [nome_cargo, cor, permissoes, req.params.roleId, req.params.groupId]
      );
      res.status(200).json({ message: "Cargo atualizado com sucesso." });
    } catch (error) {
      next(error);
    }
  }
);

// ROTA DELETE: Apagar um cargo
router.delete(
  "/:groupId/roles/:roleId",
  isGroupCreator,
  async (req, res, next) => {
    try {
      const pool = req.db;
      // Primeiro, remove as associações de usuários a este cargo
      await pool.query("DELETE FROM CargosUsuario WHERE id_cargo = ?", [
        req.params.roleId,
      ]);
      // Depois, apaga o cargo
      await pool.query("DELETE FROM Cargos WHERE id_cargo = ?", [
        req.params.roleId,
      ]);
      res.status(200).json({ message: "Cargo apagado com sucesso." });
    } catch (error) {
      next(error);
    }
  }
);

// ROTA PUT: Atribuir cargos a um membro
router.put(
  "/:groupId/members/:memberId/roles",
  isGroupCreator,
  async (req, res, next) => {
    const { roles } = req.body; // `roles` deve ser um array de IDs de cargos
    const { memberId } = req.params;

    const pool = req.db;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // Apaga todos os cargos atuais do usuário no grupo
      await connection.query(
        "DELETE FROM CargosUsuario WHERE id_usuario = ? AND id_cargo IN (SELECT id_cargo FROM Cargos WHERE id_grupo = ?)",
        [memberId, req.params.groupId]
      );
      // Insere os novos cargos, se houver algum
      if (roles && roles.length > 0) {
        const values = roles.map((roleId) => [memberId, roleId]);
        await connection.query(
          "INSERT INTO CargosUsuario (id_usuario, id_cargo) VALUES ?",
          [values]
        );
      }
      await connection.commit();
      res
        .status(200)
        .json({ message: "Cargos do membro atualizados com sucesso." });
    } catch (error) {
      await connection.rollback();
      next(error);
    } finally {
      connection.release();
    }
  }
);

module.exports = router;
