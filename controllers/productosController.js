exports.crearReceta = async (req, res) => {
    const { id_producto_final, ingredientes } = req.body; 
    // ingredientes = [{id_insumo: 5, cantidad: 0.250}, {id_insumo: 8, cantidad: 0.018}]
    
    try {
        for (let item of ingredientes) {
            await db.query(
                "INSERT INTO recetas (id_producto_final, id_insumo, cantidad_necesaria) VALUES (?, ?, ?)",
                [id_producto_final, item.id_insumo, item.cantidad]
            );
        }
        // Marcamos el producto como receta
        await db.query("UPDATE productos SET es_receta = TRUE WHERE id = ?", [id_producto_final]);
        
        res.json({ message: "Receta creada exitosamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};