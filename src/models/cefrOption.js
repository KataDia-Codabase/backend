const { DataTypes } = require('sequelize');
const db = require('../configs/database.js');

const CefrOption = db.define(
    'cefr_options',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        cefr_question_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'cefr_questions',
                key: 'id',
            },
        },
        option_text: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        is_correct: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        timestamps: false,
        freezeTableName: true,
    }
);

module.exports = CefrOption;
