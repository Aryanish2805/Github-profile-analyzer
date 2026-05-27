/**
 * Global Error Handler Middleware
 * 
 * Catches all errors thrown by controllers/services and formats
 * them into a consistent API response. Distinguishes between
 * operational errors (ApiError) and unexpected errors.
 */

const logger = require('../config/logger');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // Default to 500 if no status code set
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // ── Sequelize Validation Error ─────────────────────────────────
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ── Sequelize Unique Constraint Error ──────────────────────────
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Duplicate entry: resource already exists';
    errors = err.errors.map((e) => ({
      field: e.path,
      value: e.value,
      message: e.message,
    }));
  }

  // ── Sequelize Database Error ───────────────────────────────────
  if (err.name === 'SequelizeDatabaseError') {
    statusCode = 500;
    message = 'Database Error';
    // Don't expose raw SQL errors in production
    if (process.env.NODE_ENV === 'production') {
      errors = null;
    }
  }

  // ── JWT Errors ─────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }

  // ── Axios Errors (GitHub API) ──────────────────────────────────
  if (err.isAxiosError) {
    if (err.response) {
      statusCode = err.response.status;
      message = err.response.data?.message || 'GitHub API Error';
    } else if (err.code === 'ECONNABORTED') {
      statusCode = 504;
      message = 'GitHub API request timed out';
    } else {
      statusCode = 503;
      message = 'GitHub API is unreachable';
    }
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message}`, {
      url: req.originalUrl,
      method: req.method,
      stack: err.stack,
    });
  } else {
    logger.warn(`${statusCode} - ${message}`, {
      url: req.originalUrl,
      method: req.method,
    });
  }

  // Send response
  return ApiResponse.error(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? errors : undefined
  );
};

module.exports = errorHandler;
