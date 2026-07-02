const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

// Test the connection
pool.connect()
    .then(() => console.log('✅ Connected to PostgreSQL Database successfully!'))
    .catch(err => console.error('❌ Database connection error', err.stack));

module.exports = pool;