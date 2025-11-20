const { DataTypes } = require('sequelize');
const db = require('../configs/database.js');

const CefrQuestion = db.define(
    'cefr_questions',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        cefr_test_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'cefr_tests',
                key: 'id',
            },
        },
        section_type: {
            type: DataTypes.ENUM(
                'listening',
                'reading',
                'vocabulary',
                'speaking'
            ),
            allowNull: false,
        },
        // Teks soal, paragraf bacaan, atau prompt speaking
        text_content: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Audio soal listening
        media_url: {
            type: DataTypes.STRING(1024),
            allowNull: true,
        },
        order_index: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        timestamps: false,
        freezeTableName: true,
    }
);

module.exports = CefrQuestion;
