/**
 * JWT Authentication Middleware
 * 
 * Verifies JWT tokens from Authorization header.
 * Used to protect admin-only endpoints (e.g., DELETE).
 */

const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiError');

/**
 * Middleware to verify JWT token
 * Expects header: Authorization: Bearer <token>
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw ApiError.unauthorized('No authorization token provided');
    }

    // Extract token from "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw ApiError.unauthorized('Invalid authorization format. Use: Bearer <token>');
    }

    const token = parts[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request object
    req.admin = {
      id: decoded.id,
      username: decoded.username,
    };

    next();
  } catch (error) {
    // Re-throw ApiError instances directly
    if (error instanceof ApiError) {
      return next(error);
    }

    // JWT-specific errors are handled by the global error handler
    next(error);
  }
};

/**
 * Optional auth — doesn't fail if no token, just sets req.admin if valid
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = { id: decoded.id, username: decoded.username };
      }
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }
  next();
};

module.exports = { authenticate, optionalAuth };
