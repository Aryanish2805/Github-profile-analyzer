/**
 * Database Configuration
 * 
 * Sequelize connection setup with environment-based configuration.
 * Supports connection pooling and dialect-specific options.
 */

const { Sequelize } = require('sequelize');
const logger = require('./logger');

// Create Sequelize instance from environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME || 'github_analyzer',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg),
    
    // Connection pool configuration
    pool: {
      max: 10,       // Maximum number of connections in pool
      min: 0,        // Minimum number of connections in pool
      acquire: 30000, // Max time (ms) to try getting a connection before throwing error
      idle: 10000,    // Max time (ms) a connection can be idle before being released
    },

    // MySQL-specific options
    dialectOptions: {
      // Support for full UTF-8 (including emojis in bios)
      charset: 'utf8mb4',
      connectTimeout: 10000,
    },

    // Define default table options
    define: {
      timestamps: true,  // Adds createdAt and updatedAt
      underscored: true, // Use snake_case column names
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
  }
);

/**
 * Test database connection
 * @returns {Promise<boolean>} true if connection is successful
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ MySQL connection established successfully.');
    return true;
  } catch (error) {
    logger.error('❌ Unable to connect to MySQL:', error.message);
    throw error;
  }
};

module.exports = { sequelize, testConnection };
