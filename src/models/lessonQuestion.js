const { DataTypes } = require('sequelize');
const db = require('../configs/database.js');

const LessonQuestion = db.define(
    'lesson_questions',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        lesson_content_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // Nullable karena mungkin vocab berdiri sendiri tanpa konten panjang
            references: {
                model: 'lesson_contents',
                key: 'id',
            },
        },
        question_text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        timestamps: false,
        freezeTableName: true,
    }
);

module.exports = LessonQuestion;
