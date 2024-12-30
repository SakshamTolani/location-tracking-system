const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const cluster = require('cluster');
const jwt = require('jsonwebtoken');
const numCPUs = require('os').cpus().length;
require('dotenv').config();

const locationService = require('./services/location.service');
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require('./routes/user.routes');
const { authMiddleware } = require('./middleware/auth.middleware');
const {redis} = require('./config/db');



const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cachedData = await redis.get(key);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
      
      // Modify res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        redis.setex(key, duration, JSON.stringify(data));
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

redis.on('error', (err) => console.error('Redis Client Error:', err));
redis.on('connect', () => console.log('Redis Client Connected'));

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  const app = express();
  const server = http.createServer(app);

  const wss = new WebSocket.Server({
    server,
    verifyClient: async ({ req }, done) => {
      try {
        const token = new URL(req.url, 'http://localhost').searchParams.get('token');
        if (!token) {
          done(false, 401, 'Unauthorized');
          return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Cache user session
        const sessionKey = `session:${decoded.userId}`;
        await redis.setex(sessionKey, 3600, JSON.stringify({
          userId: decoded.userId,
          lastActive: Date.now()
        }));
        
        req.userId = decoded.userId;
        done(true);
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        done(false, 401, 'Unauthorized');
      }
    }
  });

  app.use(cors());
  app.use(express.json());

  function heartbeat() {
    this.isAlive = true;
    // Update user's last active timestamp in Redis
    if (this.userId) {
      const sessionKey = `session:${this.userId}`;
      redis.setex(sessionKey, 3600, JSON.stringify({
        userId: this.userId,
        lastActive: Date.now()
      }));
    }
  }

  wss.on('connection', async (ws, req) => {
    try {
      ws.isAlive = true;
      ws.userId = req.userId;
      ws.on('pong', heartbeat);

      console.log('New WebSocket connection, userId:', req.userId);

      // Cache connection status
      const connectionKey = `connection:${req.userId}`;
      await redis.setex(connectionKey, 3600, 'connected');

      await locationService.handleConnection(ws, req.userId);

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          // Cache latest location
          const locationKey = `location:${req.userId}`;
          await redis.setex(locationKey, 3600, JSON.stringify(data));
          
          await locationService.handleLocationUpdate(req.userId, data);
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });

      ws.on('error', (error) => console.error('WebSocket error:', error));
      ws.on('close', async () => {
        await redis.del(`connection:${req.userId}`);
        await locationService.handleDisconnection(req.userId);
      });

    } catch (error) {
      console.error('Error handling WebSocket connection:', error);
      ws.close();
    }
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping(() => {});
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  // Apply cache middleware to routes that benefit from caching
  app.use('/api/admin', cacheMiddleware(300), adminRoutes);
  app.use('/api/users', cacheMiddleware(60), userRoutes);

  app.get('/health', async (req, res) => {
    const stats = {
      status: 'healthy',
      worker: process.pid,
      connections: locationService.getActiveConnections(),
      redis: redis.status
    };
    
    try {
      await redis.ping();
      stats.redisConnected = true;
    } catch (error) {
      stats.redisConnected = false;
    }
    
    res.json(stats);
  });

  // Cleanup function for graceful shutdown
  const cleanup = async () => {
    try {
      await redis.quit();
      console.log('Redis connection closed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Worker ${process.pid} started on port ${PORT}`);
  });
}