const express = require('express');
const router = express.Router();

// Middleware para proteger as rotas
function requireLogin(req, res, next) {
    if (req.session && req.session.user) return next();
    return res.status(401).json({ message: 'Acesso não autorizado' });
}

// ROTA GET PARA PROCURAR UTILIZADORES
router.get('/search', requireLogin, async (req, res, next) => {
    const { q } = req.query;
    const currentUserId = req.session.user.id_usuario;

    if (!q) return res.json([]);

    const pool = req.db;
    try {
        // Procura por utilizadores que não sejam o próprio utilizador
        const query = `
            SELECT id_usuario, Nome, FotoPerfil 
            FROM Usuarios 
            WHERE Nome LIKE ? AND id_usuario != ?
        `;
        const [users] = await pool.query(query, [`%${q}%`, currentUserId]);
        res.json(users);
    } catch (error) { 
        console.error("Erro ao procurar utilizadores:", error);
        next(error); 
    }
});

// ROTA POST PARA ENVIAR UM PEDIDO DE AMIZADE
router.post('/request', requireLogin, async (req, res, next) => {
    const { requestedId } = req.body;
    const requesterId = req.session.user.id_usuario;

    if (!requestedId || requesterId == requestedId) {
        return res.status(400).json({ message: "Pedido inválido." });
    }

    const pool = req.db;
    try {
        // Verifica se já existe uma amizade ou pedido (em qualquer direção)
        const [existing] = await pool.query(
            "SELECT * FROM Amizades WHERE (id_utilizador_requisitante = ? AND id_utilizador_requisitado = ?) OR (id_utilizador_requisitante = ? AND id_utilizador_requisitado = ?)",
            [requesterId, requestedId, requestedId, requesterId]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: "Já existe uma relação com este utilizador." });
        }

        // Cria o novo pedido de amizade
        const sql = "INSERT INTO Amizades (id_utilizador_requisitante, id_utilizador_requisitado, status) VALUES (?, ?, 'pendente')";
        await pool.query(sql, [requesterId, requestedId]);

        res.status(201).json({ message: "Pedido de amizade enviado!" });

    } catch (error) {
        console.error("Erro ao enviar pedido de amizade:", error);
        next(error);
    }
});

// ROTA POST PARA RESPONDER A UM PEDIDO DE AMIZADE (ACEITAR/RECUSAR)
router.post('/respond', requireLogin, async (req, res, next) => {
    const { requestId, action } = req.body; // action será 'aceite' ou 'recusada'
    const currentUserId = req.session.user.id_usuario;

    if (!requestId || !['aceite', 'recusada'].includes(action)) {
        return res.status(400).json({ message: "Pedido inválido." });
    }
    
    const pool = req.db;
    try {
        if (action === 'aceite') {
            await pool.query(
                "UPDATE Amizades SET status = 'aceite' WHERE id_amizade = ? AND id_utilizador_requisitado = ?", 
                [requestId, currentUserId]
            );
        } else { // 'recusada'
            await pool.query(
                "DELETE FROM Amizades WHERE id_amizade = ? AND id_utilizador_requisitado = ?", 
                [requestId, currentUserId]
            );
        }
        res.status(200).json({ message: `Pedido ${action} com sucesso.` });
    } catch (error) {
        next(error);
    }
});


module.exports = router;
