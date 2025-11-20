const { DataTypes } = require('sequelize');
const db = require('../configs/database.js');

const UserCefrResult = db.define(
    'user_cefr_results',
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
        cefr_test_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'cefr_tests',
                key: 'id',
            },
        },
        total_score: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        is_passed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        taken_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        timestamps: false,
        freezeTableName: true,
    }
);

module.exports = UserCefrResult;
