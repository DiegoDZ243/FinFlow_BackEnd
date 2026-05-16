const express = require('express');
const router = express.Router();
const { verificarToken } = require('../../middleware/auth');

const { registrarAhorrador } = require('./registrar');
const { loginAhorrador } = require('./login');
const { eliminarCuenta } = require('./delete');

router.post('/registrar', registrarAhorrador);
router.post('/login', loginAhorrador);
router.delete('/cuenta', verificarToken, eliminarCuenta);

module.exports = router;