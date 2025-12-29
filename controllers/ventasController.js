const db = require('../config/db');

exports.abrirCuenta = async (req, res) => {
    const { id_usuario, id_mesa, id_corte, tipo_consumo } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO ventas (id_usuario, id_mesa, id_corte, tipo_consumo, estado) VALUES (?, ?, ?, ?, 'abierta')",
            [id_usuario, id_mesa, id_corte, tipo_consumo]
        );
        
        // Si hay mesa, la ponemos como ocupada
        if (id_mesa) {
            await db.query("UPDATE mesas SET estado = 'ocupada' WHERE id = ?", [id_mesa]);
        }
        
        res.status(201).json({ id_venta: result.insertId, message: "Cuenta abierta con éxito" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.agregarDetalle = async (req, res) => {
    const { id_venta, id_producto, cantidad, precio_unitario, es_manual, nombre_personalizado } = req.body;
    
    // Iniciamos una transacción para que todo ocurra o nada ocurra
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const subtotal = cantidad * precio_unitario;

        // 1. Insertar el detalle en la venta
        await connection.query(
            "INSERT INTO detalle_ventas (id_venta, id_producto, nombre_personalizado, cantidad, precio_unitario, subtotal_linea, es_manual) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [id_venta, id_producto, nombre_personalizado, cantidad, precio_unitario, subtotal, es_manual]
        );

        // 2. Manejo de Inventario (Si no es un cobro manual)
        if (!es_manual && id_producto) {
            // Consultamos si el producto es receta
            const [prodInfo] = await connection.query("SELECT es_receta FROM productos WHERE id = ?", [id_producto]);
            
            if (prodInfo[0].es_receta) {
                // CASO RECETA: Buscamos ingredientes
                const [insumos] = await connection.query(
                    "SELECT id_insumo, cantidad_necesaria FROM recetas WHERE id_producto_final = ?", 
                    [id_producto]
                );

                for (let insumo of insumos) {
                    await connection.query(
                        "UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?",
                        [insumo.cantidad_necesaria * cantidad, insumo.id_insumo]
                    );
                }
            } else {
                // CASO PRODUCTO SIMPLE: Descuento directo
                await connection.query(
                    "UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?",
                    [cantidad, id_producto]
                );
            }
        }

        await connection.commit(); // Guardamos todos los cambios
        res.json({ message: "Item agregado e inventario actualizado" });

    } catch (error) {
        await connection.rollback(); // Si algo falló, revertimos todo
        res.status(500).json({ error: "Error al procesar la venta: " + error.message });
    } finally {
        connection.release();
    }
};