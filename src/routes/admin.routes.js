const express = require('express');
const { Location } = require('../models/user.model');
const { pool } = require('../config/db');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

router.get('/users',authMiddleware, adminMiddleware, adminController.getUsers);
router.get('/users/:userId/locations',authMiddleware, adminMiddleware, adminController.getUserLocations);
router.get('/metrics', authMiddleware, adminMiddleware, adminController.getMetrics);

module.exports = router;