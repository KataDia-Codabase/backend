const { Sequelize, DataTypes } = require('sequelize');
const db = require('../configs/database.js');

const Lesson = db.define(
    'lessons',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        language_code: {
            type: DataTypes.ENUM('id-ID', 'en-US'),
            allowNull: false,
        },
        cefr_level: {
            type: DataTypes.ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2'),
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
    },
    {
        timestamps: false,
        freezeTableName: true,
    }
);

module.exports = Lesson;
