const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.login = async (req, res) => {
    const { usuario, password } = req.body;

    try {
        const [rows] = await db.query("SELECT * FROM usuarios WHERE usuario = ? AND activo = TRUE", [usuario]);
        
        if (rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

        const user = rows[0];

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: "Contraseña incorrecta" });

        // Crear Token con ID y Rol
        const token = jwt.sign(
            { id: user.id, rol: user.rol }, 
            process.env.JWT_SECRET || 'llave_secreta_cafeteria', 
            { expiresIn: '12h' }
        );

        res.json({
            token,
            user: { id: user.id, nombre: user.nombre, rol: user.rol }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};