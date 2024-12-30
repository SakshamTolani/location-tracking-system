// src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', authMiddleware, userController.getProfile);
router.get('/locations', authMiddleware, userController.getUserLocations);
router.post('/locations', authMiddleware, userController.storeUserLocation);
router.post('/cleanup', authMiddleware, userController.cleanupTestData);


module.exports = router;