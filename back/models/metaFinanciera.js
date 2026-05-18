const {DataTypes} = require('sequelize'); 

const sequelize = require('../config/db'); 

const MetaFinanciera=sequelize.define("metasFinancieras",{
    clave:{
        type: DataTypes.UUID, 
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    identificador:{
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            len:[4,30]
        }
    },
    fechaInicio:{
        type:DataTypes.DATE,
        allowNull:false
    },
    fechaLimite:{
        type:DataTypes.DATE,
        allowNull:false
    },
    montoObjetivo:{
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: 1
        }
    },
    montoAlcanzado:{
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    },
    descripcion:{
        type: DataTypes.TEXT,
        allowNull:true
    },
    estado:{
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    ahorradorId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'ahorradoresInteligentes',
            key: 'clave'
        }
    }
},
{
    tableName:'metasFinancieras',
    timestamps:false
});

module.exports=MetaFinanciera; 