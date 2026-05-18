const { models } = require('../../models');

const eliminarCuenta = async (req, res) => {
    try {
        const { Ahorrador, Meta, AporteMeta, Ingreso, Egreso, PlanDeAhorro } = models;
        const userId = req.user.id;

        const metas = await Meta.findAll({ where: { ahorradorId: userId } });
        const metaIds = metas.map(m => m.clave);

        if (metaIds.length > 0) {
            await AporteMeta.destroy({ where: { metaClave: metaIds } });
        }

        await Meta.destroy({ where: { ahorradorId: userId } });
        await Ingreso.destroy({ where: { ahorradorId: userId } });
        await Egreso.destroy({ where: { ahorradorId: userId } });
        await PlanDeAhorro.destroy({ where: { ahorradorId: userId } });
        await Ahorrador.destroy({ where: { clave: userId } });

        res.json({ message: 'Cuenta eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar cuenta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { eliminarCuenta };
