const { DataTypes } = require('sequelize');
const db = require('../configs/database.js');

const UserCefrSpeaking = db.define(
    'user_cefr_speaking',
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
        audio_url: {
            type: DataTypes.STRING(1024),
            allowNull: true,
        },
        // Hanya skor, tanpa JSON feedback detail (sesuai request)
        ai_score: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
    },
    {
        timestamps: false,
        freezeTableName: true,
    }
);

module.exports = UserCefrSpeaking;
