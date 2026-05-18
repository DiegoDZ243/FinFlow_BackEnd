const { models, sequelize } = require('../models');
const { ensureLegacyMontoMigrated, recalcularMontoAlcanzado } = require('../services/metaMontoSync');

const { Meta, AporteMeta } = models;

const crearAporteMeta = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { metaClave, cantidad, fechaAporte, tipoAporte, tipo } = req.body;
        const ahorradorId = req.user.id;

        if (!metaClave || !cantidad) {
            await t.rollback();
            return res.status(400).json({ error: 'metaClave y cantidad son requeridos' });
        }

        const meta = await Meta.findByPk(metaClave, { transaction: t });
        if (!meta) {
            await t.rollback();
            return res.status(404).json({ error: 'Meta no encontrada' });
        }

        if (meta.ahorradorId !== ahorradorId) {
            await t.rollback();
            return res.status(403).json({ error: 'No tiene permiso para aportar a esta meta' });
        }

        await ensureLegacyMontoMigrated(meta, { transaction: t });

        const nuevoAporte = await AporteMeta.create(
            {
                metaClave,
                cantidad,
                tipoAporte: tipoAporte || tipo || 'unico',
                fechaAporte: fechaAporte || undefined
            },
            { transaction: t }
        );

        await recalcularMontoAlcanzado(metaClave, { transaction: t });

        await t.commit();
        return res.status(201).json(nuevoAporte);
    } catch (error) {
        console.error('Error al crear aporte:', error);
        await t.rollback();
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const actualizarAporteMeta = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params; // claveAporte
        const ahorradorId = req.user.id;
        const { cantidad, fechaAporte, tipoAporte, tipo } = req.body;

        const aporte = await AporteMeta.findByPk(id, { transaction: t });
        if (!aporte) {
            await t.rollback();
            return res.status(404).json({ error: 'Aporte no encontrado' });
        }

        const meta = await Meta.findByPk(aporte.metaClave, { transaction: t });
        if (!meta) {
            await t.rollback();
            return res.status(404).json({ error: 'Meta no encontrada' });
        }

        if (meta.ahorradorId !== ahorradorId) {
            await t.rollback();
            return res.status(403).json({ error: 'No tiene permiso para editar este aporte' });
        }

        await aporte.update(
            {
                cantidad: cantidad !== undefined ? cantidad : aporte.cantidad,
                tipoAporte: (tipoAporte !== undefined ? tipoAporte : (tipo !== undefined ? tipo : aporte.tipoAporte)),
                fechaAporte: fechaAporte !== undefined ? fechaAporte : aporte.fechaAporte
            },
            { transaction: t }
        );

        await recalcularMontoAlcanzado(aporte.metaClave, { transaction: t });

        await t.commit();
        return res.json(aporte);
    } catch (error) {
        console.error('Error al actualizar aporte:', error);
        await t.rollback();
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const eliminarAporteMeta = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params; // claveAporte
        const ahorradorId = req.user.id;

        const aporte = await AporteMeta.findByPk(id, { transaction: t });
        if (!aporte) {
            await t.rollback();
            return res.status(404).json({ error: 'Aporte no encontrado' });
        }

        const meta = await Meta.findByPk(aporte.metaClave, { transaction: t });
        if (!meta) {
            await t.rollback();
            return res.status(404).json({ error: 'Meta no encontrada' });
        }

        if (meta.ahorradorId !== ahorradorId) {
            await t.rollback();
            return res.status(403).json({ error: 'No tiene permiso para eliminar este aporte' });
        }

        await aporte.destroy({ transaction: t });
        await recalcularMontoAlcanzado(aporte.metaClave, { transaction: t });

        await t.commit();
        return res.json({ message: 'Aporte eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar aporte:', error);
        await t.rollback();
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const listarAportesDeMeta = async (req, res) => {
    try {
        const { metaClave } = req.params;
        const ahorradorId = req.user.id;

        const meta = await Meta.findByPk(metaClave);
        if (!meta) {
            return res.status(404).json({ error: 'Meta no encontrada' });
        }

        if (meta.ahorradorId !== ahorradorId) {
            return res.status(403).json({ error: 'No tiene permiso para acceder a esta meta' });
        }

        const aportes = await AporteMeta.findAll({
            where: { metaClave },
            order: [['fechaAporte', 'DESC'], ['claveAporte', 'DESC']]
        });

        return res.json(aportes);
    } catch (error) {
        console.error('Error al listar aportes:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    crearAporteMeta,
    actualizarAporteMeta,
    eliminarAporteMeta,
    listarAportesDeMeta
};
