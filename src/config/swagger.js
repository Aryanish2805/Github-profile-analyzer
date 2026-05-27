/**
 * Swagger/OpenAPI Configuration
 * 
 * Generates API documentation from JSDoc comments in route files.
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GitHub Profile Analyzer API',
      version: '1.0.0',
      description:
        'A production-ready backend service that fetches, analyzes, and stores GitHub user profile insights in a MySQL database.',
      contact: {
        name: 'API Support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Profile: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'torvalds' },
            name: { type: 'string', example: 'Linus Torvalds' },
            bio: { type: 'string', example: '' },
            avatar_url: { type: 'string', format: 'uri' },
            html_url: { type: 'string', format: 'uri' },
            followers: { type: 'integer', example: 200000 },
            following: { type: 'integer', example: 0 },
            public_repos: { type: 'integer', example: 7 },
            account_created_at: { type: 'string', format: 'date-time' },
            most_used_language: { type: 'string', example: 'C' },
            total_stars: { type: 'integer', example: 250000 },
            total_forks: { type: 'integer', example: 100000 },
            avg_repo_stars: { type: 'number', example: 35714.29 },
            profile_score: { type: 'number', example: 98.5 },
            trending_score: { type: 'number', example: 75.2 },
            top_repositories: { type: 'array', items: { type: 'object' } },
            language_stats: { type: 'object' },
            activity_insights: { type: 'object' },
            contribution_data: { type: 'object' },
            analyzed_at: { type: 'string', format: 'date-time' },
          },
        },
        Repository: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            profile_id: { type: 'integer' },
            repo_name: { type: 'string' },
            description: { type: 'string' },
            language: { type: 'string' },
            stars: { type: 'integer' },
            forks: { type: 'integer' },
            open_issues: { type: 'integer' },
            is_fork: { type: 'boolean' },
            html_url: { type: 'string', format: 'uri' },
            topics: { type: 'array', items: { type: 'string' } },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'object' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                totalItems: { type: 'integer' },
                totalPages: { type: 'integer' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // Scan route files for JSDoc comments
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
