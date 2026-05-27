/**
 * Standard API Response Wrapper
 * 
 * Provides consistent response format across all endpoints.
 * Every API response follows: { success, message, data, pagination }
 */

class ApiResponse {
  /**
   * Send a success response
   * @param {Object} res - Express response object
   * @param {*} data - Response payload
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default 200)
   * @param {Object} pagination - Pagination metadata (optional)
   */
  static success(res, data, message = 'Success', statusCode = 200, pagination = null) {
    const response = {
      success: true,
      message,
      data,
    };

    if (pagination) {
      response.pagination = pagination;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send a created response (201)
   */
  static created(res, data, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Send an error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default 500)
   * @param {*} errors - Additional error details (optional)
   */
  static error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Build pagination metadata
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {number} totalItems - Total number of items
   * @returns {Object} pagination metadata
   */
  static buildPagination(page, limit, totalItems) {
    const totalPages = Math.ceil(totalItems / limit);
    return {
      page,
      limit,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}

module.exports = ApiResponse;
