const { Sequelize, DataTypes } = require('sequelize');
const db = require('../configs/database.js');

const User = db.define(
    'users',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        full_name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        preferred_language: {
            type: DataTypes.ENUM('id-ID', 'en-US'),
            allowNull: false,
            defaultValue: 'id-ID',
        },
        xp_points: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        current_streak: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        last_practice_date: {
            type: DataTypes.DATEONLY,
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

module.exports = User;
