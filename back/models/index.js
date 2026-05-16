const sequelize = require('../config/db');
const Ahorrador = require('./ahorradorInteligente');
const Ingreso = require('./ingreso'); 
const Egreso = require('./egreso'); 
const Meta = require('./metaFinanciera');
const PlanDeAhorro = require('./planDeAhorro');
const AporteMeta = require('./aporteMeta');

Ahorrador.hasMany(Ingreso, { foreignKey: 'ahorradorId' });
Ahorrador.hasMany(Egreso, { foreignKey: 'ahorradorId' });
Ahorrador.hasMany(Meta, { foreignKey: 'ahorradorId' });
Ahorrador.hasMany(PlanDeAhorro, { foreignKey: 'ahorradorId' });

Ingreso.belongsTo(Ahorrador, { foreignKey: 'ahorradorId' });
Egreso.belongsTo(Ahorrador, { foreignKey: 'ahorradorId' });
Meta.belongsTo(Ahorrador, { foreignKey: 'ahorradorId' });
PlanDeAhorro.belongsTo(Ahorrador, { foreignKey: 'ahorradorId' });
PlanDeAhorro.belongsTo(Meta, { foreignKey: 'metaId', as: 'meta' });

Meta.hasMany(AporteMeta, { foreignKey: 'metaClave', as: 'aportes' });
AporteMeta.belongsTo(Meta, { foreignKey: 'metaClave', as: 'meta' });

module.exports = { sequelize, models: { Ahorrador, Ingreso, Egreso, Meta, PlanDeAhorro, AporteMeta } }; 
