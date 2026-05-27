/**
 * Cache Configuration
 * 
 * In-memory cache using node-cache.
 * Used to reduce redundant GitHub API calls and database queries.
 */

const NodeCache = require('node-cache');

// TTL from environment, default 10 minutes
const ttl = parseInt(process.env.CACHE_TTL, 10) || 600;

const cache = new NodeCache({
  stdTTL: ttl,           // Default time-to-live in seconds
  checkperiod: ttl * 0.2, // Automatic delete check interval
  useClones: false,       // Return references instead of clones (faster)
  maxKeys: 500,           // Maximum number of cached keys
});

module.exports = cache;
