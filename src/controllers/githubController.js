/**
 * GitHub Controller
 * 
 * Handles HTTP requests for profile analysis, retrieval, deletion,
 * comparison, and health checks. Maps requests to service calls
 * and formats responses.
 */

const profileService = require('../services/profileService');
const githubService = require('../services/githubService');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../config/logger');

class GitHubController {
  /**
   * POST /api/github/analyze/:username
   * Fetch, analyze, and store a GitHub profile
   */
  async analyzeProfile(req, res, next) {
    try {
      const { username } = req.params;
      logger.info(`API: Analyze profile request for ${username}`);

      const { profile, isNew } = await profileService.analyzeAndStore(username);

      return ApiResponse.success(
        res,
        profile,
        isNew
          ? `Profile for '${username}' analyzed and stored successfully`
          : `Profile for '${username}' re-analyzed and updated successfully`,
        isNew ? 201 : 200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/github/profiles
   * Fetch all analyzed profiles with pagination, search, and sorting
   */
  async getAllProfiles(req, res, next) {
    try {
      const { profiles, pagination } = await profileService.getAllProfiles(req.query);

      return ApiResponse.success(
        res,
        profiles,
        `Found ${pagination.totalItems} profiles`,
        200,
        pagination
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/github/profile/:username
   * Fetch a single analyzed profile with full data
   */
  async getProfile(req, res, next) {
    try {
      const { username } = req.params;
      const profile = await profileService.getProfile(username);

      return ApiResponse.success(
        res,
        profile,
        `Profile for '${username}' retrieved successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/github/profile/:username
   * Delete a stored profile (requires JWT authentication)
   */
  async deleteProfile(req, res, next) {
    try {
      const { username } = req.params;
      await profileService.deleteProfile(username);

      return ApiResponse.success(
        res,
        null,
        `Profile for '${username}' deleted successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/github/compare?users=user1,user2
   * Compare multiple GitHub profiles
   */
  async compareProfiles(req, res, next) {
    try {
      const { users } = req.query;
      const usernames = users.split(',').map((u) => u.trim());

      const comparison = await profileService.compareProfiles(usernames);

      return ApiResponse.success(
        res,
        comparison,
        `Comparison of ${usernames.length} profiles completed`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/github/stats
   * Get database statistics and insights
   */
  async getStats(req, res, next) {
    try {
      const stats = await profileService.getStats();

      return ApiResponse.success(
        res,
        stats,
        'Database statistics retrieved'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/health
   * Health check endpoint
   */
  async healthCheck(req, res, next) {
    try {
      // Check GitHub API rate limit
      const rateLimit = await githubService.checkRateLimit();

      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        github_api: {
          rate_limit: rateLimit
            ? {
                limit: rateLimit.limit,
                remaining: rateLimit.remaining,
                reset: new Date(rateLimit.reset * 1000).toISOString(),
              }
            : 'unavailable',
          authenticated: !!process.env.GITHUB_TOKEN,
        },
        memory: {
          rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        },
      };

      return ApiResponse.success(res, health, 'Service is healthy');
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance with bound methods
const controller = new GitHubController();
module.exports = {
  analyzeProfile: controller.analyzeProfile.bind(controller),
  getAllProfiles: controller.getAllProfiles.bind(controller),
  getProfile: controller.getProfile.bind(controller),
  deleteProfile: controller.deleteProfile.bind(controller),
  compareProfiles: controller.compareProfiles.bind(controller),
  getStats: controller.getStats.bind(controller),
  healthCheck: controller.healthCheck.bind(controller),
};
