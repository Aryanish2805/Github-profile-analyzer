/**
 * Validation Middleware
 * 
 * Uses express-validator to validate request parameters.
 * Provides reusable validation chains for common patterns.
 */

const { param, query, validationResult } = require('express-validator');
const { USERNAME_REGEX, SORTABLE_FIELDS, PAGINATION } = require('../utils/constants');
const ApiResponse = require('../utils/apiResponse');

/**
 * Process validation results and return errors if any
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(
      res,
      'Validation failed',
      400,
      errors.array().map((e) => ({ field: e.path, message: e.msg, value: e.value }))
    );
  }
  next();
};

/**
 * Validate GitHub username parameter
 */
const validateUsername = [
  param('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .matches(USERNAME_REGEX)
    .withMessage(
      'Invalid GitHub username. Must be 1-39 characters, alphanumeric or hyphens, cannot start/end with hyphen.'
    ),
  handleValidationErrors,
];

/**
 * Validate query parameters for listing profiles
 */
const validateProfileQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: PAGINATION.MAX_LIMIT })
    .withMessage(`Limit must be between 1 and ${PAGINATION.MAX_LIMIT}`)
    .toInt(),
  query('sort')
    .optional()
    .isIn(SORTABLE_FIELDS)
    .withMessage(`Sort must be one of: ${SORTABLE_FIELDS.join(', ')}`),
  query('order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Order must be ASC or DESC'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must be 100 characters or less'),
  query('language')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Language filter must be 50 characters or less'),
  query('min_followers')
    .optional()
    .isInt({ min: 0 })
    .withMessage('min_followers must be a non-negative integer')
    .toInt(),
  query('min_stars')
    .optional()
    .isInt({ min: 0 })
    .withMessage('min_stars must be a non-negative integer')
    .toInt(),
  handleValidationErrors,
];

/**
 * Validate comparison query parameters
 */
const validateCompareQuery = [
  query('users')
    .notEmpty()
    .withMessage('users query parameter is required (comma-separated usernames)')
    .custom((value) => {
      const users = value.split(',').map((u) => u.trim());
      if (users.length < 2) {
        throw new Error('At least 2 usernames are required for comparison');
      }
      if (users.length > 5) {
        throw new Error('Maximum 5 usernames allowed for comparison');
      }
      for (const user of users) {
        if (!USERNAME_REGEX.test(user)) {
          throw new Error(`Invalid GitHub username: ${user}`);
        }
      }
      return true;
    }),
  handleValidationErrors,
];

module.exports = {
  validateUsername,
  validateProfileQuery,
  validateCompareQuery,
  handleValidationErrors,
};
