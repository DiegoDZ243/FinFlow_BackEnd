require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((err, req, res, next) => {
    if (err?.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'JSON inválido' });
    }
    next(err);
});

app.get('/', (req, res) => {
    res.send('¡Código base del backend de FinFlow!');
});

const authRouter = require('./routes/AhorradoresInteligentes');
const metasRouter = require('./routes/MetasFinancieras');
const aportesMetasRouter = require('./routes/AportesMetas');

app.use('/api/ahorradores', authRouter);
app.use('/api/metas', metasRouter);
app.use('/api/aportes-metas', aportesMetasRouter);

if (require.main === module) {
    sequelize.sync({ force: false })
        .then(() => console.log('Tablas sincronizadas correctamente'))
        .catch(err => console.error('Error al sincronizar:', err));

    app.listen(PORT, () => {
        console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
}

module.exports = app;
