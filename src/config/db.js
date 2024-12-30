const { Pool } = require('pg');
const Redis = require('ioredis');

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 20,
  idleTimeoutMillis: 30000
});

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

pool.query('CREATE EXTENSION IF NOT EXISTS postgis;').catch(console.error);

module.exports = { pool, redis };