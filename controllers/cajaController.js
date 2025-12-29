const db = require('../config/db');

const cajaController = {
    // 1. Abrir Turno / Corte
    abrirCorte: async (req, res) => {
        const { id_usuario, monto_inicial } = req.body;
        try {
            // Verificamos si ya hay un corte abierto para este usuario o en general
            const [abiertos] = await db.query("SELECT id FROM cortes_caja WHERE estado = 'abierto'");
            if (abiertos.length > 0) {
                return res.status(400).json({ error: "Ya existe un corte de caja abierto." });
            }

            const [result] = await db.query(
                "INSERT INTO cortes_caja (id_usuario, monto_inicial, estado) VALUES (?, ?, 'abierto')",
                [id_usuario, monto_inicial]
            );
            res.status(201).json({ id_corte: result.insertId, message: "Turno abierto con éxito" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 2. Registrar Salida de Dinero (Gastos durante el turno)
    registrarSalida: async (req, res) => {
        const { id_corte, id_usuario, monto, motivo } = req.body;
        try {
            // 1. Registrar el movimiento
            await db.query(
                "INSERT INTO movimientos_caja (id_corte, id_usuario, tipo, monto, motivo) VALUES (?, ?, 'salida', ?, ?)",
                [id_corte, id_usuario, monto, motivo]
            );

            // 2. Actualizar el acumulado de salidas en el corte
            await db.query(
                "UPDATE cortes_caja SET total_salidas = total_salidas + ? WHERE id = ?",
                [monto, id_corte]
            );

            res.json({ message: "Salida de dinero registrada" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 3. Cerrar Corte (Cierre de día)
    cerrarCorte: async (req, res) => {
        const { id_corte, monto_final_real } = req.body;
        try {
            // Obtenemos los totales de ventas para este corte
            const [totales] = await db.query(
                `SELECT 
                    SUM(CASE WHEN metodo_pago = 'efectivo' THEN total_venta ELSE 0 END) as efectivo,
                    SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total_venta ELSE 0 END) as tarjeta,
                    SUM(monto_extra) as propinas
                 FROM ventas WHERE id_corte = ? AND estado = 'pagada'`,
                [id_corte]
            );

            await db.query(
                `UPDATE cortes_caja SET 
                    fecha_cierre = CURRENT_TIMESTAMP,
                    total_ventas_efectivo = ?,
                    total_ventas_tarjeta = ?,
                    total_propinas = ?,
                    monto_final_real = ?,
                    estado = 'cerrado'
                 WHERE id = ?`,
                [totales[0].efectivo || 0, totales[0].tarjeta || 0, totales[0].propinas || 0, monto_final_real, id_corte]
            );

            res.json({ message: "Caja cerrada exitosamente" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = cajaController;