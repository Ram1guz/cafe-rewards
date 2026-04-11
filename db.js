require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'ramiro',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'jacaqu_rewards',
    password: process.env.DB_PASSWORD || '5262',
    port: Number(process.env.DB_PORT) || 5432,
});

module.exports = pool;
