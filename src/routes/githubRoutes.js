/**
 * GitHub Routes
 * 
 * Defines all API endpoints for GitHub profile analysis.
 * Includes Swagger JSDoc annotations for API documentation.
 */

const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');
const { validateUsername, validateProfileQuery, validateCompareQuery } = require('../middlewares/validator');
const { authenticate } = require('../middlewares/auth');
const { analyzeLimiter } = require('../middlewares/rateLimiter');
const { cacheMiddleware } = require('../middlewares/cache');
const { CACHE_KEYS } = require('../utils/constants');

/**
 * @swagger
 * /api/github/analyze/{username}:
 *   post:
 *     summary: Analyze a GitHub profile
 *     description: Fetches a GitHub user's profile and repositories, computes analytics, and stores the results in the database.
 *     tags: [GitHub Profiles]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: GitHub username to analyze
 *         example: torvalds
 *     responses:
 *       201:
 *         description: Profile analyzed and stored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *       404:
 *         description: GitHub user not found
 *       429:
 *         description: Rate limit exceeded
 */
router.post(
  '/analyze/:username',
  analyzeLimiter,
  validateUsername,
  githubController.analyzeProfile
);

/**
 * @swagger
 * /api/github/profiles:
 *   get:
 *     summary: Get all analyzed profiles
 *     description: Retrieve all stored profiles with pagination, search, sorting, and filtering.
 *     tags: [GitHub Profiles]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page (max 100)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [followers, following, total_stars, total_forks, public_repos, profile_score, trending_score, avg_repo_stars, analyzed_at, created_at]
 *           default: profile_score
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in username, name, and bio
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by most used language
 *       - in: query
 *         name: min_followers
 *         schema:
 *           type: integer
 *         description: Minimum followers count
 *       - in: query
 *         name: min_stars
 *         schema:
 *           type: integer
 *         description: Minimum total stars
 *     responses:
 *       200:
 *         description: List of profiles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get(
  '/profiles',
  validateProfileQuery,
  cacheMiddleware((req) => CACHE_KEYS.PROFILES_LIST(req.query)),
  githubController.getAllProfiles
);

/**
 * @swagger
 * /api/github/profile/{username}:
 *   get:
 *     summary: Get a single analyzed profile
 *     description: Retrieve the full profile data including repositories for a specific username.
 *     tags: [GitHub Profiles]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: GitHub username
 *         example: torvalds
 *     responses:
 *       200:
 *         description: Profile found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *       404:
 *         description: Profile not found in database
 */
router.get(
  '/profile/:username',
  validateUsername,
  cacheMiddleware((req) => CACHE_KEYS.PROFILE(req.params.username)),
  githubController.getProfile
);

/**
 * @swagger
 * /api/github/profile/{username}:
 *   delete:
 *     summary: Delete a stored profile
 *     description: Remove an analyzed profile and all its repository data. Requires JWT authentication.
 *     tags: [GitHub Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: GitHub username to delete
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 *       401:
 *         description: Unauthorized - JWT token required
 *       404:
 *         description: Profile not found
 */
router.delete(
  '/profile/:username',
  authenticate,
  validateUsername,
  githubController.deleteProfile
);

/**
 * @swagger
 * /api/github/compare:
 *   get:
 *     summary: Compare multiple profiles
 *     description: Side-by-side comparison of 2-5 analyzed profiles across all metrics.
 *     tags: [GitHub Profiles]
 *     parameters:
 *       - in: query
 *         name: users
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated usernames (2-5)
 *         example: torvalds,gaearon
 *     responses:
 *       200:
 *         description: Comparison result
 *       404:
 *         description: One or more profiles not found. Analyze them first.
 */
router.get(
  '/compare',
  validateCompareQuery,
  cacheMiddleware((req) => CACHE_KEYS.COMPARISON(req.query.users.split(',')[0], req.query.users.split(',')[1])),
  githubController.compareProfiles
);

/**
 * @swagger
 * /api/github/stats:
 *   get:
 *     summary: Get database statistics
 *     description: Overview of all stored profiles and aggregate insights.
 *     tags: [GitHub Profiles]
 *     responses:
 *       200:
 *         description: Statistics retrieved
 */
router.get('/stats', githubController.getStats);

module.exports = router;
