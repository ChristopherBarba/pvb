const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/cajaController');

router.post('/abrir', cajaController.abrirCorte);
router.post('/salida', cajaController.registrarSalida);
router.post('/cerrar', cajaController.cerrarCorte);

module.exports = router;