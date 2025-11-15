const { Sequelize } = require('sequelize');

const db = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        timezone: '+07:00',
        define: {
            freezeTableName: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
        dialectOptions: {
            dateStrings: true,
            typeCast: true,
            timezone: '+07:00',
        },
    }
);

module.exports = db;
