const { DataTypes } = require('sequelize');
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
        current_cefr_level: {
            type: DataTypes.ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2'),
            defaultValue: 'A1',
        },
        xp_points: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
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
            defaultValue: DataTypes.NOW,
        },
    },
    {
        timestamps: false,
        freezeTableName: true,
    }
);

module.exports = User;
