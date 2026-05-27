/**
 * Auth Controller
 * 
 * Handles admin registration and login.
 * Issues JWT tokens for authenticated sessions.
 */

const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const logger = require('../config/logger');

class AuthController {
  /**
   * POST /api/auth/register
   * Register a new admin user
   */
  async register(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw ApiError.badRequest('Username and password are required');
      }

      if (password.length < 6) {
        throw ApiError.badRequest('Password must be at least 6 characters');
      }

      // Check if admin already exists
      const existing = await Admin.findOne({ where: { username } });
      if (existing) {
        throw ApiError.conflict(`Admin '${username}' already exists`);
      }

      // Create admin (password is hashed by model hook)
      const admin = await Admin.create({ username, password });

      // Generate JWT
      const token = jwt.sign(
        { id: admin.id, username: admin.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      logger.info(`New admin registered: ${username}`);

      return ApiResponse.created(res, {
        admin: {
          id: admin.id,
          username: admin.username,
        },
        token,
      }, 'Admin registered successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Login and receive a JWT token
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw ApiError.badRequest('Username and password are required');
      }

      // Find admin
      const admin = await Admin.findOne({ where: { username } });
      if (!admin) {
        throw ApiError.unauthorized('Invalid credentials');
      }

      // Check password
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        throw ApiError.unauthorized('Invalid credentials');
      }

      // Generate JWT
      const token = jwt.sign(
        { id: admin.id, username: admin.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      logger.info(`Admin logged in: ${username}`);

      return ApiResponse.success(res, {
        admin: {
          id: admin.id,
          username: admin.username,
        },
        token,
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }
}

const controller = new AuthController();
module.exports = {
  register: controller.register.bind(controller),
  login: controller.login.bind(controller),
};
