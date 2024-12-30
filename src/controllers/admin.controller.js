// src/controllers/admin.controller.js
const { pool } = require('../config/db');

const adminController = {
  async getUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const users = await pool.query(
        'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );

      const total = await pool.query('SELECT COUNT(*) FROM users');

      res.json({
        users: users.rows,
        total: parseInt(total.rows[0].count),
        page,
        pages: Math.ceil(parseInt(total.rows[0].count) / limit)
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  async getUserLocations(req, res) {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      let query = `
        SELECT ST_X(location::geometry) as longitude, 
               ST_Y(location::geometry) as latitude, 
               timestamp 
        FROM locations 
        WHERE user_id = $1
      `;
      const params = [userId];

      if (startDate && endDate) {
        query += ' AND timestamp BETWEEN $2 AND $3';
        params.push(startDate, endDate);
      }

      query += ' ORDER BY timestamp DESC LIMIT 1000';

      const locations = await pool.query(query, params);
      res.json(locations.rows);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  async getMetrics(req, res) {
    try {
      const activeUsers = await pool.query(
        'SELECT COUNT(DISTINCT user_id) FROM locations WHERE timestamp > NOW() - INTERVAL \'5 minutes\''
      );

      const totalLocations = await pool.query('SELECT COUNT(*) FROM locations');

      res.json({
        activeUsers: parseInt(activeUsers.rows[0].count),
        totalLocations: parseInt(totalLocations.rows[0].count),
        timestamp: new Date()
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = adminController;