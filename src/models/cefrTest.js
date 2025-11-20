const { DataTypes } = require('sequelize');
const db = require('../configs/database.js');

const CefrTest = db.define(
    'cefr_tests',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        target_level: {
            type: DataTypes.ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2'),
            allowNull: false,
        },
        passing_score: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 70.0,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        timestamps: false,
        freezeTableName: true,
    }
);

module.exports = CefrTest;
