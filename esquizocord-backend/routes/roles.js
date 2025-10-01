// esquizocord-backend/routes/roles.js
const express = require("express");
const router = express.Router();

const PERMISSIONS = {
  GERIR_CARGOS: 1,
  EXPULSAR_MEMBROS: 2,
  APAGAR_MENSAGENS: 4,
  CRIAR_CANAIS: 8,
   VISUALIZAR_RELATORIOS: 16,
};

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

router.post("/:groupId/roles", isGroupCreator, async (req, res, next) => {
  const { nome_cargo, cor, icone } = req.body;
  const permissoes =
    typeof req.body.permissoes === "number" ? req.body.permissoes : 0;

  if (!nome_cargo) {
    return res.status(400).json({ message: "O nome do cargo é obrigatório." });
  }
  try {
    const pool = req.db;
    const [result] = await pool.query(
      "INSERT INTO Cargos (id_grupo, nome_cargo, cor, permissoes, icone) VALUES (?, ?, ?, ?, ?)",
      [
        req.params.groupId,
        nome_cargo,
        cor || "#99aab5",
        permissoes,
        icone || null,
      ]
    );
    const [newRole] = await pool.query(
      "SELECT * FROM Cargos WHERE id_cargo = ?",
      [result.insertId]
    );
    res.status(201).json(newRole[0]);
  } catch (error) {
    next(error);
  }
});

router.put(
  "/:groupId/roles/:roleId",
  isGroupCreator,
  async (req, res, next) => {
    const { nome_cargo, cor, icone } = req.body;
    const permissoes =
      typeof req.body.permissoes === "number" ? req.body.permissoes : 0;

    try {
      const pool = req.db;
      await pool.query(
        "UPDATE Cargos SET nome_cargo = ?, cor = ?, permissoes = ?, icone = ? WHERE id_cargo = ? AND id_grupo = ?",
        [
          nome_cargo,
          cor,
          permissoes,
          icone || null,
          req.params.roleId,
          req.params.groupId,
        ]
      );
      res.status(200).json({ message: "Cargo atualizado com sucesso." });
    } catch (error) {
      console.error("ERRO AO ATUALIZAR CARGO:", error);
      next(error);
    }
  }
);

router.delete(
  "/:groupId/roles/:roleId",
  isGroupCreator,
  async (req, res, next) => {
    try {
      const pool = req.db;
      await pool.query("DELETE FROM CargosUsuario WHERE id_cargo = ?", [
        req.params.roleId,
      ]);
      await pool.query("DELETE FROM Cargos WHERE id_cargo = ?", [
        req.params.roleId,
      ]);
      res.status(200).json({ message: "Cargo apagado com sucesso." });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:groupId/members/:memberId/roles",
  isGroupCreator,
  async (req, res, next) => {
    const { roles } = req.body;
    const { memberId } = req.params;
    const pool = req.db;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        "DELETE FROM CargosUsuario WHERE id_usuario = ? AND id_cargo IN (SELECT id_cargo FROM Cargos WHERE id_grupo = ?)",
        [memberId, req.params.groupId]
      );
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
