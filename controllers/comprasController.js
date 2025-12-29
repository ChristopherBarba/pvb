const db = require('../config/db');

exports.registrarCompra = async (req, res) => {
    const { id_usuario, proveedor, productos } = req.body; 
    // productos = [{id_producto: 1, cantidad: 10, precio_unitario: 50}, ...]

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Calcular el total de la compra
        const total_compra = productos.reduce((acc, p) => acc + (p.cantidad * p.precio_unitario), 0);

        // 2. Insertar en la tabla 'compras'
        const [compraRes] = await connection.query(
            "INSERT INTO compras (id_usuario, proveedor, total_compra) VALUES (?, ?, ?)",
            [id_usuario, proveedor, total_compra]
        );
        const id_compra = compraRes.insertId;

        // 3. Procesar cada producto de la compra
        for (let p of productos) {
            // A. Insertar detalle de compra
            await connection.query(
                "INSERT INTO detalle_compras (id_compra, id_producto, cantidad, precio_unitario_compra) VALUES (?, ?, ?, ?)",
                [id_compra, p.id_producto, p.cantidad, p.precio_unitario]
            );

            // B. Obtener datos actuales para recalcular costo promedio
            const [actual] = await connection.query(
                "SELECT stock_actual, costo_promedio FROM productos WHERE id = ?",
                [p.id_producto]
            );

            const stockAnterior = parseFloat(actual[0].stock_actual);
            const costoAnterior = parseFloat(actual[0].costo_promedio);
            const nuevaCantidad = parseFloat(p.cantidad);
            const nuevoPrecio = parseFloat(p.precio_unitario);

            // FÓRMULA COSTO PROMEDIO: ((Stock actual * Costo actual) + (Nueva cantidad * Nuevo precio)) / (Stock total)
            const nuevoCostoPromedio = ((stockAnterior * costoAnterior) + (nuevaCantidad * nuevoPrecio)) / (stockAnterior + nuevaCantidad);

            // C. Actualizar producto (Stock y Costo)
            await connection.query(
                "UPDATE productos SET stock_actual = stock_actual + ?, costo_promedio = ? WHERE id = ?",
                [nuevaCantidad, nuevoCostoPromedio, p.id_producto]
            );
        }

        await connection.commit();
        res.status(201).json({ message: "Compra registrada y stock actualizado", id_compra });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};