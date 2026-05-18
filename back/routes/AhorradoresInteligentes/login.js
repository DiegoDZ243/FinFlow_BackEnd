const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { models } = require('../../models');

const loginAhorrador = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y password son requeridos' });
        }

        const { Ahorrador } = models;

        const ahorrador = await Ahorrador.findOne({ where: { email } });
        if (!ahorrador) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const passwordValido = await bcrypt.compare(password, ahorrador.password);
        if (!passwordValido) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: ahorrador.clave, email: ahorrador.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            token,
            user: {
                id: ahorrador.clave,
                email: ahorrador.email
            }
        });
    } catch (error) {
        if (error?.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: 'Datos inválidos' });
        }
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { loginAhorrador };
