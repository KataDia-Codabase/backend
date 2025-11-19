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
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
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
        profile_picture: {
            type: DataTypes.STRING(255),
            defaultValue: 'blank-profile-pic.png',
        },
        refresh_token: {
            type: DataTypes.TEXT,
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
