const jwt = require('jsonwebtoken');

// Verifica si el token es válido
exports.verificarToken = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).json({ error: "Acceso denegado" });

    try {
        const verificado = jwt.verify(token, process.env.JWT_SECRET || 'llave_secreta_cafeteria');
        req.user = verificado;
        next();
    } catch (error) {
        res.status(400).json({ error: "Token no válido" });
    }
};

// Verifica si es Administrador
exports.esAdmin = (req, res, next) => {
    if (req.user.rol !== 'administrador') {
        return res.status(403).json({ error: "Permiso denegado: Se requiere rol de Administrador" });
    }
    next();
};