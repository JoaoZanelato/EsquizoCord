// esquizocord-backend/middlewares/validation.js
const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Retorna apenas a primeira mensagem de erro para simplicidade
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
};

module.exports = { validate };