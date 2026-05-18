const { models } = require('../models');

const { Meta, AporteMeta } = models;

const toDecimalString = (value) => {
    const num = value === null || value === undefined ? 0 : Number(value);
    if (!Number.isFinite(num)) return '0.00';
    return num.toFixed(2);
};

// Si una meta ya tenia progreso historico en montoAlcanzado pero no existen registros
// en aportesMetas, creamos un aporte inicial para no perder ese progreso.
const ensureLegacyMontoMigrated = async (meta, { transaction } = {}) => {
    if (!meta) return;

    const currentMonto = Number(meta.montoAlcanzado || 0);
    if (!Number.isFinite(currentMonto) || currentMonto <= 0) return;

    const count = await AporteMeta.count({
        where: { metaClave: meta.clave },
        transaction
    });

    if (count > 0) return;

    await AporteMeta.create(
        {
            metaClave: meta.clave,
            cantidad: toDecimalString(currentMonto),
            tipoAporte: 'legacy',
            fechaAporte: meta.fechaInicio || new Date()
        },
        { transaction }
    );
};

// Recalcula el montoAlcanzado como SUM(cantidad) para garantizar sincronizacion.
const recalcularMontoAlcanzado = async (metaClave, { transaction } = {}) => {
    const sum = await AporteMeta.sum('cantidad', {
        where: { metaClave },
        transaction
    });

    const nuevoMonto = toDecimalString(sum || 0);
    await Meta.update(
        { montoAlcanzado: nuevoMonto },
        {
            where: { clave: metaClave },
            transaction
        }
    );

    return nuevoMonto;
};

module.exports = {
    ensureLegacyMontoMigrated,
    recalcularMontoAlcanzado
};
