/**
 * Application Setup
 * 
 * Configures Express app with middleware, routes, and error handling.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const logger = require('./config/logger');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');

// Initialize Express app
const app = express();

// ── Security Middlewares ─────────────────────────────────────────────
// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Apply general API rate limiting
app.use('/api', apiLimiter);

// ── Standard Middlewares ─────────────────────────────────────────────
// Parse JSON request body
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// HTTP request logging (pipe morgan output to winston)
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// ── API Documentation ────────────────────────────────────────────────
// Swagger UI setup
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'GitHub Profile Analyzer API Docs',
  })
);

// ── Routes ───────────────────────────────────────────────────────────
// Mount API routes
app.use('/api', routes);

// Handle undefined routes
app.use('*', (req, res, next) => {
  const error = new Error(`Can't find ${req.originalUrl} on this server!`);
  error.statusCode = 404;
  next(error);
});

// ── Error Handling ───────────────────────────────────────────────────
// Global error handler middleware
app.use(errorHandler);

module.exports = app;
