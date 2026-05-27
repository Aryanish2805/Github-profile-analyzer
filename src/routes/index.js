/**
 * Routes Index
 * 
 * Aggregates all API routes and defines the base paths.
 */

const express = require('express');
const router = express.Router();
const githubRoutes = require('./githubRoutes');
const authRoutes = require('./authRoutes');

// GitHub API routes
router.use('/github', githubRoutes);

// Auth API routes
router.use('/auth', authRoutes);

// General Health Check is also available on /api/health
const githubController = require('../controllers/githubController');
router.get('/health', githubController.healthCheck);

module.exports = router;
