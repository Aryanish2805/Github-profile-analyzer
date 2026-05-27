/**
 * GitHub API Configuration
 * 
 * Centralized config for GitHub API requests.
 * Supports optional personal access token for higher rate limits.
 */

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Build request headers for GitHub API
 * Includes auth token if provided in environment
 * @returns {Object} headers object
 */
const getHeaders = () => {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'GitHub-Profile-Analyzer/1.0',
  };

  // Add auth token if available (increases rate limit from 60 to 5000 req/hr)
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
};

/**
 * GitHub API endpoint builders
 */
const endpoints = {
  user: (username) => `${GITHUB_API_BASE}/users/${username}`,
  repos: (username, page = 1, perPage = 100) =>
    `${GITHUB_API_BASE}/users/${username}/repos?page=${page}&per_page=${perPage}&sort=updated`,
  events: (username, page = 1) =>
    `${GITHUB_API_BASE}/users/${username}/events/public?page=${page}&per_page=100`,
  rateLimit: () => `${GITHUB_API_BASE}/rate_limit`,
};

module.exports = {
  GITHUB_API_BASE,
  getHeaders,
  endpoints,
};
