const { models, sequelize } = require('../models');
const { ensureLegacyMontoMigrated, recalcularMontoAlcanzado } = require('../services/metaMontoSync');
const { Meta, PlanDeAhorro, Ahorrador, AporteMeta } = models;

const crearMeta = async (req, res) => {
    try {
        const { identificador, montoObjetivo, montoAlcanzado, fechaInicio, fechaLimite, descripcion } = req.body;
        const ahorradorId = req.user.id;

        if (!identificador || !montoObjetivo || !fechaInicio || !fechaLimite) {
            return res.status(400).json({ error: 'Todos los campos requeridos deben ser proporcionados' });
        }

        const nuevaMeta = await Meta.create({
            identificador,
            montoObjetivo,
            montoAlcanzado: montoAlcanzado || 0,
            fechaInicio,
            fechaLimite,
            descripcion,
            ahorradorId
        });

        res.status(201).json(nuevaMeta);
    } catch (error) {
        console.error('Error al crear meta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const obtenerTodasMetas = async (req, res) => {
    try {
        const ahorradorId = req.user.id;
        const metas = await Meta.findAll({ where: { ahorradorId } });
        res.json(metas);
    } catch (error) {
        console.error('Error al obtener metas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const obtenerMetaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const ahorradorId = req.user.id;
        const meta = await Meta.findByPk(id);

        if (!meta) {
            return res.status(404).json({ error: 'Meta no encontrada' });
        }

        if (meta.ahorradorId !== ahorradorId) {
            return res.status(403).json({ error: 'No tiene permiso para acceder a esta meta' });
        }

        res.json(meta);
    } catch (error) {
        console.error('Error al obtener meta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const actualizarMeta = async (req, res) => {
    try {
        const { id } = req.params;
        const ahorradorId = req.user.id;
        const { identificador, montoObjetivo, montoAlcanzado, fechaInicio, fechaLimite, descripcion, estado } = req.body;

        const meta = await Meta.findByPk(id);

        if (!meta) {
            return res.status(404).json({ error: 'Meta no encontrada' });
        }

        if (meta.ahorradorId !== ahorradorId) {
            return res.status(403).json({ error: 'No tiene permiso para actualizar esta meta' });
        }

        await meta.update({
            identificador: identificador || meta.identificador,
            montoObjetivo: montoObjetivo || meta.montoObjetivo,
            montoAlcanzado: montoAlcanzado !== undefined ? montoAlcanzado : meta.montoAlcanzado,
            fechaInicio: fechaInicio || meta.fechaInicio,
            fechaLimite: fechaLimite || meta.fechaLimite,
            descripcion: descripcion !== undefined ? descripcion : meta.descripcion,
            estado: estado !== undefined ? estado : meta.estado
        });

        res.json(meta);
    } catch (error) {
        console.error('Error al actualizar meta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const eliminarMeta = async (req, res) => {
    try {
        const { id } = req.params;
        const ahorradorId = req.user.id;

        const meta = await Meta.findByPk(id);

        if (!meta) {
            return res.status(404).json({ error: 'Meta no encontrada' });
        }

        if (meta.ahorradorId !== ahorradorId) {
            return res.status(403).json({ error: 'No tiene permiso para eliminar esta meta' });
        }

        await meta.destroy();

        res.json({ message: 'Meta eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar meta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const obtenerProgreso = async (req, res) => {
    try {
        const { id } = req.params;
        const ahorradorId = req.user.id;

        const meta = await Meta.findByPk(id);

        if (!meta) {
            return res.status(404).json({ error: 'Meta no encontrada' });
        }

        if (meta.ahorradorId !== ahorradorId) {
            return res.status(403).json({ error: 'No tiene permiso para acceder a esta meta' });
        }

        const progreso = parseFloat(meta.montoAlcanzado);
        const objetivo = parseFloat(meta.montoObjetivo);
        const porcentaje = objetivo > 0 ? (progreso / objetivo) * 100 : 0;

        res.json({
            metaId: meta.clave,
            montoAlcanzado: progreso,
            montoObjetivo: objetivo,
            porcentaje: parseFloat(porcentaje.toFixed(2)),
            faltan: Math.max(0, objetivo - progreso)
        });
    } catch (error) {
        console.error('Error al obtener progreso:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const aportarMeta = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const ahorradorId = req.user.id;
        const { monto, tipoAporte, tipo } = req.body;

        if (!monto || monto <= 0) {
            await t.rollback();
            return res.status(400).json({ error: 'Monto debe ser mayor a 0' });
        }

        const meta = await Meta.findByPk(id, { transaction: t });

        if (!meta) {
            await t.rollback();
            return res.status(404).json({ error: 'Meta no encontrada' });
        }

        if (meta.ahorradorId !== ahorradorId) {
            await t.rollback();
            return res.status(403).json({ error: 'No tiene permiso para aportar a esta meta' });
        }

        //NUEVA VALIDACIÓN
        const faltante = meta.montoObjetivo - meta.montoAlcanzado;
        
        if (monto > faltante) {
            await t.rollback();
            return res.status(400).json({ 
                error: `El aporte excede el objetivo. Solo te faltan ${faltante} pesos para completar esta meta.` 
            });
        }

        await ensureLegacyMontoMigrated(meta, { transaction: t });

        await AporteMeta.create(
            {
                metaClave: id,
                cantidad: monto,
                tipoAporte: tipoAporte || tipo || 'unico',
                fechaAporte: new Date()
            },
            { transaction: t }
        );

        const nuevoMontoStr = await recalcularMontoAlcanzado(id, { transaction: t });
        const nuevoMonto = parseFloat(nuevoMontoStr);

        const progreso = parseFloat(meta.montoObjetivo);
        const porcentaje = progreso > 0 ? (nuevoMonto / progreso) * 100 : 0;

        await t.commit();

        res.json({
            message: 'Aporte realizado correctamente',
            meta: {
                id: meta.clave,
                montoAlcanzado: nuevoMonto,
                montoObjetivo: meta.montoObjetivo,
                porcentaje: parseFloat(porcentaje.toFixed(2))
            }
        });
    } catch (error) {
        console.error('Error al aportar:', error);
        await t.rollback();
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const crearPlanDeAhorro = async (req, res) => {
    try {
        const { metaId, montoMensual, mesesEstimados, fechaInicio } = req.body;

        if (!metaId || !montoMensual || !mesesEstimados || !fechaInicio) {
            return res.status(400).json({ error: 'Todos los campos requeridos deben ser proporcionados' });
        }

        const meta = await Meta.findByPk(metaId);
        if (!meta) {
            return res.status(404).json({ error: 'Meta no encontrada' });
        }

        const plan = await PlanDeAhorro.create({
            metaId,
            montoMensual,
            mesesEstimados,
            fechaInicio
        });

        res.status(201).json(plan);
    } catch (error) {
        console.error('Error al crear plan de ahorro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const obtenerPlanDeMeta = async (req, res) => {
    try {
        const { id } = req.params;

        const plan = await PlanDeAhorro.findAll({
            where: { metaId: id },
            include: [{ model: Meta, as: 'meta' }]
        });

        res.json(plan);
    } catch (error) {
        console.error('Error al obtener plan:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    crearMeta,
    obtenerTodasMetas,
    obtenerMetaPorId,
    actualizarMeta,
    eliminarMeta,
    obtenerProgreso,
    aportarMeta,
    crearPlanDeAhorro,
    obtenerPlanDeMeta
};
