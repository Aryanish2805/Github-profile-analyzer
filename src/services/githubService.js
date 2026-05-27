/**
 * GitHub Service
 * 
 * Handles all communication with the GitHub REST API.
 * Fetches user profiles, repositories, and public events.
 * Includes pagination handling and error normalization.
 */

const axios = require('axios');
const { getHeaders, endpoints } = require('../config/github');
const { GITHUB } = require('../utils/constants');
const ApiError = require('../utils/apiError');
const logger = require('../config/logger');

class GitHubService {
  constructor() {
    // Create a reusable axios instance with GitHub defaults
    this.client = axios.create({
      timeout: 15000, // 15 second timeout
      headers: getHeaders(),
    });
  }

  /**
   * Fetch a GitHub user's public profile
   * @param {string} username - GitHub username
   * @returns {Promise<Object>} User profile data
   */
  async fetchUserProfile(username) {
    try {
      logger.info(`Fetching GitHub profile for: ${username}`);
      const response = await this.client.get(endpoints.user(username));
      return response.data;
    } catch (error) {
      this._handleGitHubError(error, username);
    }
  }

  /**
   * Fetch all public repositories for a user (paginated)
   * Handles GitHub's 100-per-page limit by fetching multiple pages
   * @param {string} username - GitHub username
   * @returns {Promise<Array>} Array of repository objects
   */
  async fetchUserRepos(username) {
    try {
      logger.info(`Fetching repositories for: ${username}`);
      const allRepos = [];
      let page = 1;

      while (page <= GITHUB.MAX_PAGES) {
        const url = endpoints.repos(username, page, GITHUB.MAX_REPOS_PER_PAGE);
        const response = await this.client.get(url);
        const repos = response.data;

        if (!repos || repos.length === 0) break;

        allRepos.push(...repos);

        // If we got fewer than max per page, there are no more pages
        if (repos.length < GITHUB.MAX_REPOS_PER_PAGE) break;

        page++;
      }

      logger.info(`Fetched ${allRepos.length} repositories for ${username}`);
      return allRepos;
    } catch (error) {
      this._handleGitHubError(error, username);
    }
  }

  /**
   * Fetch recent public events for contribution analysis
   * GitHub only returns the last 300 events (max 10 pages of 30)
   * @param {string} username - GitHub username
   * @returns {Promise<Array>} Array of event objects
   */
  async fetchUserEvents(username) {
    try {
      logger.info(`Fetching events for: ${username}`);
      const allEvents = [];
      let page = 1;
      const maxPages = 3; // Only fetch last 3 pages of events

      while (page <= maxPages) {
        const url = endpoints.events(username, page);
        const response = await this.client.get(url);
        const events = response.data;

        if (!events || events.length === 0) break;

        allEvents.push(...events);

        if (events.length < 100) break;
        page++;
      }

      logger.info(`Fetched ${allEvents.length} events for ${username}`);
      return allEvents;
    } catch (error) {
      // Events endpoint can fail for users with no activity — don't throw
      logger.warn(`Failed to fetch events for ${username}: ${error.message}`);
      return [];
    }
  }

  /**
   * Check current GitHub API rate limit status
   * @returns {Promise<Object>} Rate limit info
   */
  async checkRateLimit() {
    try {
      const response = await this.client.get(endpoints.rateLimit());
      return response.data.rate;
    } catch (error) {
      logger.warn('Failed to check GitHub rate limit');
      return null;
    }
  }

  /**
   * Normalize GitHub API errors into ApiError instances
   * @private
   */
  _handleGitHubError(error, username) {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 404:
          throw ApiError.notFound(`GitHub user '${username}' not found`);
        case 403:
          if (data.message && data.message.includes('rate limit')) {
            throw ApiError.tooManyRequests(
              'GitHub API rate limit exceeded. Please add a GITHUB_TOKEN to .env or try again later.'
            );
          }
          throw ApiError.forbidden(`GitHub API access forbidden: ${data.message}`);
        case 401:
          throw ApiError.unauthorized('Invalid GitHub token. Check your GITHUB_TOKEN in .env');
        default:
          throw new ApiError(
            `GitHub API error: ${data.message || 'Unknown error'}`,
            status
          );
      }
    }

    // Network errors
    if (error.code === 'ECONNABORTED') {
      throw ApiError.serviceUnavailable('GitHub API request timed out');
    }

    throw ApiError.serviceUnavailable(
      `Failed to reach GitHub API: ${error.message}`
    );
  }
}

// Export singleton instance
module.exports = new GitHubService();
