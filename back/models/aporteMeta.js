const { DataTypes } = require('sequelize');

const sequelize = require('../config/db');

const AporteMeta = sequelize.define(
    'AporteMeta',
    {
        claveAporte: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        metaClave: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'metasFinancieras',
                key: 'clave'
            }
        },
        cantidad: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            validate: {
                min: 0.01
            }
        },
        tipoAporte: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'unico',
            validate: {
                isIn: [['unico', 'semanal', 'quincenal', 'mensual', 'legacy']]
            }
        },
        fechaAporte: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    },
    {
        tableName: 'aportesMetas',
        timestamps: false
    }
);

module.exports = AporteMeta;
