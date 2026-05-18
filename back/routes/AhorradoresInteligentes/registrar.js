const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { models } = require('../../models');

const registrarAhorrador = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y password son requeridos' });
        }

        const { Ahorrador } = models;

        const existente = await Ahorrador.findOne({ where: { email } });
        if (existente) {
            return res.status(409).json({ error: 'El email ya está registrado' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const nuevoAhorrador = await Ahorrador.create({
            email,
            password: passwordHash
        });

        res.status(201).json({ 
            message: 'Usuario registrado exitosamente',
            user: {
                id: nuevoAhorrador.clave,
                email: nuevoAhorrador.email
            }
        });
    } catch (error) {
        if (error?.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: 'Datos inválidos' });
        }
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { registrarAhorrador };
