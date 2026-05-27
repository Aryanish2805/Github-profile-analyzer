/**
 * Custom API Error Class
 * 
 * Extends Error with HTTP status codes for clean error handling.
 * Used throughout the application to throw meaningful errors
 * that the global error handler can format properly.
 */

class ApiError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {*} errors - Additional error details
   */
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true; // Distinguishes operational errors from programming errors

    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods for common error types
  static badRequest(message = 'Bad Request', errors = null) {
    return new ApiError(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(message, 403);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(message, 404);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(message, 409);
  }

  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new ApiError(message, 429);
  }

  static internal(message = 'Internal Server Error') {
    return new ApiError(message, 500);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable') {
    return new ApiError(message, 503);
  }
}

module.exports = ApiError;
