// src/controllers/user.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const dbService = require('../services/db.service');
const { isISO8601 } = require('validator');

const userController = {
  async register(req, res) {
    try {
      const { email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(
        'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
        [email, hashedPassword]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error.constraint === 'users_email_key') {
        return res.status(400).json({ message: 'Email already exists' });
      }
      res.status(500).json({ message: 'Server error', error: error });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];

      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const locations = await pool.query(
        'SELECT ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude, timestamp FROM locations WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 100',
        [userId]
      );

      res.json({
        user: req.user,
        locations: locations.rows
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  async storeUserLocation(req, res) {
    try {
      const userId = req.user.id;
      const { latitude, longitude, accuracy, timestamp } = req.body;


      console.log("Received timestamp:", timestamp); // Log timestamp for debugging

      // Validate input
      if (!latitude) {
        console.error("Invalid input: Latitude is missing or invalid:", { latitude });
        return res.status(400).json({ message: 'Latitude is required and must be valid.' });
      }

      if (!longitude) {
        console.error("Invalid input: Longitude is missing or invalid:", { longitude });
        return res.status(400).json({ message: 'Longitude is required and must be valid.' });
      }

      if (!timestamp) {
        console.error("Invalid input: Timestamp is missing:", { timestamp });
        return res.status(400).json({ message: 'Timestamp is required.' });
      }

      if (!isISO8601(timestamp)) {
        console.error("Invalid input: Timestamp is not ISO 8601 compliant:", { timestamp });
        return res.status(400).json({ message: 'Timestamp must be in ISO 8601 format.' });
      }

      const location = await dbService.addLocation(userId, latitude, longitude, accuracy, timestamp);

      res.status(201).json({
        message: 'Location stored successfully',
        location,
      });
    } catch (error) {
      console.error('Error storing user location:', error);
      res.status(500).json({ message: 'Error storing location', error });
    }
  },


  async getUserLocations(req, res) {
    try {
      const userId = req.user.id;

      const query = `
        SELECT 
          ST_X(ST_AsText(location::geometry)) as longitude,
          ST_Y(ST_AsText(location::geometry)) as latitude,
          accuracy,
          timestamp
        FROM locations 
        WHERE user_id = $1 
        ORDER BY timestamp DESC 
        LIMIT 100`;

      const result = await pool.query(query, [userId]);

      const locations = result.rows.map(row => ({
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        accuracy: row.accuracy,
        timestamp: row.timestamp
      }));

      res.json(locations);
    } catch (error) {
      console.error('Error fetching user locations:', error);
      res.status(500).json({ message: 'Error fetching location history' });
    }
  },
  async cleanupTestData(req, res) {
    try {
      const { emails, locationIds } = req.body;

      if (!emails || emails.length === 0) {
        return res.status(400).json({ message: 'No emails provided for cleanup.' });
      }

      if (!locationIds || locationIds.length === 0) {
        return res.status(400).json({ message: 'No location IDs provided for cleanup.' });
      }

      // Delete locations by IDs
      await pool.query('DELETE FROM locations WHERE id = ANY($1::int[])', [locationIds]);

      // Delete users by emails
      await pool.query('DELETE FROM users WHERE email = ANY($1::text[])', [emails]);

      res.status(200).json({ message: 'Test data cleaned up successfully.' });
    } catch (error) {
      console.error('Error during cleanup:', error);
      res.status(500).json({ message: 'Error cleaning up test data.', error });
    }
  },

};

module.exports = userController;