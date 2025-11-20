const { Sequelize, DataTypes } = require('sequelize');
const db = require('../configs/database.js');

const LessonVocab = db.define(
    'lesson_vocab',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        lesson_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'lessons',
                key: 'id',
            },
        },
        phrase: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        translation: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        audio_url: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    },
    {
        timestamps: false,
        freezeTableName: true,
    }
);

module.exports = LessonVocab;
