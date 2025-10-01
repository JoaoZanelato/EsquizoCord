// esquizocord-backend/middlewares/auth.js

function requireLogin(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ message: 'Autenticação necessária.' });
}

module.exports = { requireLogin };