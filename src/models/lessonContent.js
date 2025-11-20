const { DataTypes } = require('sequelize');
const db = require('../configs/database.js');

const LessonContent = db.define(
    'lesson_contents',
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
        // Diisi jika tipe Reading atau Speaking (Prompt)
        text_content: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Diisi jika tipe Listening
        media_url: {
            type: DataTypes.STRING(1024),
            allowNull: true,
        },
    },
    {
        timestamps: false,
        freezeTableName: true,
    }
);

module.exports = LessonContent;
