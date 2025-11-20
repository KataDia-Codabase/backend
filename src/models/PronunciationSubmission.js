const { Sequelize, DataTypes } = require('sequelize');
const db = require('../configs/database.js');

const PronunciationSubmission = db.define(
    'pronunciation_submissions',
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
        lesson_vocab_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'lesson_vocab',
                key: 'id',
            },
        },
        user_audio_url: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        generated_transcript: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        language_code: {
            type: DataTypes.ENUM('id-ID', 'en-US'),
            allowNull: false,
        },
        overall_score: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        accuracy_score: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        fluency_score: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        prosody_score: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        stress_score: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        phoneme_errors_json: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        personalized_feedback: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        cefr_level_assessment: {
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

module.exports = PronunciationSubmission;
