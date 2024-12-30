// models/user.model.js
const mongoose = require('mongoose');
const { pool } = require('../config/db');

// PostgreSQL user operations
const userQueries = {
  async createUser(email, hashedPassword) {
    const result = await pool.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, hashedPassword, 'user']
    );
    return result.rows[0];
  },

  async findUserByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  async findUserById(id) {
    const result = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }
};

// MongoDB location schema
// const locationSchema = new mongoose.Schema({
//   userId: { type: Number, required: true },
//   locations: [{
//     latitude: Number,
//     longitude: Number,
//     timestamp: { type: Date, default: Date.now }
//   }]
// }, { timestamps: true });

// locationSchema.index({ userId: 1 });
// locationSchema.index({ "locations.timestamp": -1 });

// const Location = mongoose.model('Location', locationSchema);

// module.exports = { userQueries, Location };
module.exports = { userQueries };