const { DataTypes } = require('sequelize');
const db = require('../configs/database.js');

const UserCefrAnswer = db.define(
    'user_cefr_answers',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        result_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'user_cefr_results',
                key: 'id',
            },
        },
        question_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'cefr_questions',
                key: 'id',
            },
        },
        selected_option_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        is_correct: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    },
    {
        timestamps: false,
        freezeTableName: true,
    }
);

module.exports = UserCefrAnswer;
