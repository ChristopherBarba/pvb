const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');

router.post('/abrir', ventasController.abrirCuenta);
router.post('/agregar', ventasController.agregarDetalle);

module.exports = router;