// src/services/location.service.js
const { pool } = require('../config/db');

class LocationService {
  constructor() {
    this.activeConnections = new Map(); // userId -> WebSocket
    this.connectionTimestamps = new Map(); // userId -> last update timestamp
    this.cleanupInterval = setInterval(() => this.cleanupStaleConnections(), 60000);
  }

  async handleConnection(ws, userId) {
    try {
      // Close any existing connection for this user
      const existingConnection = this.activeConnections.get(userId);
      if (existingConnection) {
        existingConnection.close();
      }

      this.activeConnections.set(userId, ws);
      this.connectionTimestamps.set(userId, Date.now());

      // Set last known status as online
      await pool.query(
        'UPDATE users SET last_online = NOW(), is_tracking = true WHERE id = $1',
        [userId]
      );

      console.log(`User ${userId} connected for location tracking`);
    } catch (error) {
      console.error('Error handling connection:', error);
    }
  }

  async handleDisconnection(userId) {
    try {
      this.activeConnections.delete(userId);
      this.connectionTimestamps.delete(userId);

      // Update user status
      await pool.query(
        'UPDATE users SET is_tracking = false WHERE id = $1',
        [userId]
      );

      console.log(`User ${userId} disconnected from location tracking`);
    } catch (error) {
      console.error('Error handling disconnection:', error);
    }
  }

  getActiveConnections() {
    return this.activeConnections.size;
  }

  async handleLocationUpdate(userId, locationData) {
    try {
      const { latitude, longitude, accuracy, timestamp } = locationData;
      
      // Basic validation
      if (!this.isValidCoordinate(latitude, longitude)) {
        console.error('Invalid coordinates received:', locationData);
        return;
      }

      // Update connection timestamp
      this.connectionTimestamps.set(userId, Date.now());

      // Store location update
      await pool.query(
        `INSERT INTO locations (
          user_id, 
          location, 
          accuracy, 
          timestamp
        ) VALUES (
          $1, 
          ST_SetSRID(ST_MakePoint($2, $3), 4326), 
          $4, 
          $5
        )`,
        [userId, longitude, latitude, accuracy, timestamp]
      );

      // Update user's last known location
      await pool.query(
        `UPDATE users SET 
          last_location = ST_SetSRID(ST_MakePoint($2, $3), 4326),
          last_location_update = $4
        WHERE id = $1`,
        [userId, longitude, latitude, timestamp]
      );

    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }

  isValidCoordinate(lat, lon) {
    return (
      typeof lat === 'number' && 
      typeof lon === 'number' && 
      lat >= -90 && 
      lat <= 90 && 
      lon >= -180 && 
      lon <= 180
    );
  }

  cleanupStaleConnections() {
    const staleTimeout = 30000; // 30 seconds
    const now = Date.now();

    for (const [userId, lastUpdate] of this.connectionTimestamps.entries()) {
      if (now - lastUpdate > staleTimeout) {
        const ws = this.activeConnections.get(userId);
        if (ws) {
          ws.close();
          this.handleDisconnection(userId);
        }
      }
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

module.exports = new LocationService();