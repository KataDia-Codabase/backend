const { DataTypes } = require('sequelize');
const db = require('../configs/database.js');

const UserLessonProgress = db.define(
    'user_lesson_progress',
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
        score: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('in_progress', 'completed'),
            defaultValue: 'in_progress',
        },
        completed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        timestamps: false,
        freezeTableName: true,
    }
);

module.exports = UserLessonProgress;
