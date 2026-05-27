/**
 * Cache Middleware
 * 
 * Express middleware that checks the in-memory cache before
 * hitting the database or GitHub API. Reduces response times
 * for repeated requests.
 */

const cache = require('../config/cache');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../config/logger');

/**
 * Cache middleware factory
 * @param {Function} keyBuilder - Function that takes req and returns a cache key string
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (keyBuilder) => {
  return (req, res, next) => {
    try {
      const key = keyBuilder(req);
      const cached = cache.get(key);

      if (cached) {
        logger.debug(`Cache HIT: ${key}`);
        return ApiResponse.success(
          res,
          cached.data,
          cached.message || 'Success (cached)',
          200,
          cached.pagination || null
        );
      }

      logger.debug(`Cache MISS: ${key}`);

      // Store the original json method so we can intercept the response
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Only cache successful responses
        if (body && body.success) {
          cache.set(key, {
            data: body.data,
            message: body.message,
            pagination: body.pagination,
          });
          logger.debug(`Cache SET: ${key}`);
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      // If cache fails, just continue without caching
      logger.warn(`Cache error: ${error.message}`);
      next();
    }
  };
};

/**
 * Invalidate cache entries matching a pattern
 * @param {string} pattern - Key prefix to invalidate
 */
const invalidateCache = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter((key) => key.startsWith(pattern));
  matchingKeys.forEach((key) => cache.del(key));
  logger.debug(`Cache invalidated: ${matchingKeys.length} keys matching "${pattern}"`);
};

/**
 * Flush entire cache
 */
const flushCache = () => {
  cache.flushAll();
  logger.debug('Cache flushed');
};

module.exports = { cacheMiddleware, invalidateCache, flushCache };
