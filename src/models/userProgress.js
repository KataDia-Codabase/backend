const { Sequelize, DataTypes } = require('sequelize');
const db = require('../configs/database.js');

const UserProgress = db.define(
    'user_progress',
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
        status: {
            type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
            defaultValue: 'not_started',
        },
        completed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        timestamps: false,
        freezeTableName: true,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'lesson_id'],
                name: 'user_lesson_unique',
            },
        ],
    }
);

module.exports = UserProgress;
