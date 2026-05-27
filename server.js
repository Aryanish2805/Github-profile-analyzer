/**
 * Server Entry Point
 * 
 * Loads environment variables, connects to the database,
 * and starts the Express server.
 */

require('dotenv').config();
const app = require('./src/app');
const { sequelize, testConnection } = require('./src/config/database');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 3000;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

let server;

const startServer = async () => {
  try {
    // 1. Test database connection
    await testConnection();

    // 2. Sync database schema (in production, use migrations instead)
    if (process.env.NODE_ENV !== 'production') {
      logger.info('Syncing database schema (development mode)...');
      await sequelize.sync({ alter: true });
      logger.info('Database schema synced successfully');
    }

    // 3. Start listening
    server = app.listen(PORT, () => {
      logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      logger.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      logger.info('Process terminated!');
      sequelize.close();
    });
  }
});
