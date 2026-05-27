/**
 * Rate Limiter Middleware
 * 
 * Limits the number of requests per IP within a time window.
 * Configurable via environment variables.
 */

const rateLimit = require('express-rate-limit');
const ApiResponse = require('../utils/apiResponse');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,   // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    ApiResponse.error(
      res,
      'Too many requests. Please try again later.',
      429
    );
  },
  message: 'Too many requests from this IP, please try again later.',
});

// Stricter limiter for the analyze endpoint (GitHub API calls are expensive)
const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,                   // 30 analyze requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponse.error(
      res,
      'Too many analysis requests. GitHub API has rate limits. Please try again later.',
      429
    );
  },
});

// Auth endpoint limiter (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,                   // 10 auth attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponse.error(
      res,
      'Too many authentication attempts. Please try again later.',
      429
    );
  },
});

module.exports = { apiLimiter, analyzeLimiter, authLimiter };
