/**
 * Database Configuration
 * 
 * Sequelize connection setup using SQLite for local development.
 * This stores all data in a local file, accessible via DB Browser.
 */

const { Sequelize } = require('sequelize');
const logger = require('./logger');
const path = require('path');

// Create Sequelize instance using SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'), // Creates file in project root
  logging: (msg) => logger.debug(msg),
  
  // Define default table options
  define: {
    timestamps: true,  // Adds createdAt and updatedAt
    underscored: true, // Use snake_case column names
  },
});

/**
 * Test database connection
 * @returns {Promise<boolean>} true if connection is successful
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ SQLite connection established successfully.');
    return true;
  } catch (error) {
    logger.error('❌ Unable to connect to SQLite:', error.message);
    throw error;
  }
};

module.exports = { sequelize, testConnection };
