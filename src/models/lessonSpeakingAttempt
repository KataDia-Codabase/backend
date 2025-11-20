const { DataTypes } = require('sequelize');
const db = require('../configs/database.js');

const LessonSpeakingAttempt = db.define(
    'lesson_speaking_attempts',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        lesson_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'lessons',
                key: 'id',
            },
        },
        audio_url: {
            type: DataTypes.STRING(1024),
            allowNull: false,
        },
        ai_score_overall: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        // JSON ini menyimpan detail: pronunciation, fluency, phoneme_errors
        ai_feedback_json: {
            type: DataTypes.JSON,
            allowNull: true,
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

module.exports = LessonSpeakingAttempt;
