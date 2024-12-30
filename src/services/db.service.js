// src/services/db.service.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000
});

const queries = {
  // User operations
  async createUser(email, hashedPassword) {
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );
    return result.rows[0];
  },

  async findUserByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  // Location operations
  async addLocation(userId, latitude, longitude, accuracy, timestamp) {
    const result = await pool.query(
      `INSERT INTO locations (user_id, location, accuracy, timestamp) 
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5) 
       RETURNING id, user_id, 
                 ST_X(location::geometry) AS longitude, 
                 ST_Y(location::geometry) AS latitude, 
                 accuracy, timestamp, created_at`,
      [userId, longitude, latitude, accuracy, new Date(timestamp).toISOString()]
    );
    return result.rows[0];
  },

  async addLocationBatch(locations) {
    // Batch insert locations
    const values = locations.map(loc =>
      `(${loc.userId}, ${loc.latitude}, ${loc.longitude}, '${loc.timestamp.toISOString()}')`
    ).join(',');

    const query = `
      INSERT INTO locations (user_id, latitude, longitude, timestamp)
      VALUES ${values}
      RETURNING *`;

    const result = await pool.query(query);
    return result.rows;
  },

  async getLocations(userId, startDate, endDate, limit = 1000) {
    const result = await pool.query(
      `SELECT id, 
              ST_X(location::geometry) AS longitude, 
              ST_Y(location::geometry) AS latitude, 
              accuracy, timestamp 
       FROM locations 
       WHERE user_id = $1 
       AND timestamp BETWEEN $2 AND $3 
       ORDER BY timestamp DESC 
       LIMIT $4`,
      [userId, startDate, endDate, limit]
    );
    return result.rows;
  },

  // Admin operations
  async getUsers(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const users = await pool.query(
      `SELECT id, email, created_at, role FROM users 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const total = await pool.query('SELECT COUNT(*) FROM users');

    return {
      users: users.rows,
      total: parseInt(total.rows[0].count),
      page,
      pages: Math.ceil(parseInt(total.rows[0].count) / limit)
    };
  }
};

module.exports = queries;