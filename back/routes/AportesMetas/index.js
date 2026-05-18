const express = require('express');
const router = express.Router();

const { verificarToken } = require('../../middleware/auth');
const {
    crearAporteMeta,
    actualizarAporteMeta,
    eliminarAporteMeta,
    listarAportesDeMeta
} = require('../../controllers/aporteMetaController');

// Listar aportes por meta
router.get('/meta/:metaClave', verificarToken, listarAportesDeMeta);

// CRUD basico
router.post('/', verificarToken, crearAporteMeta);
router.put('/:id', verificarToken, actualizarAporteMeta);
router.delete('/:id', verificarToken, eliminarAporteMeta);

module.exports = router;
