/**
 * Profile Service
 * 
 * Orchestrates the fetch → analyze → store pipeline.
 * Handles CRUD operations for profiles and repositories.
 * Implements search, pagination, sorting, and filtering.
 */

const { Op } = require('sequelize');
const { Profile, Repository } = require('../models');
const githubService = require('./githubService');
const analysisService = require('./analysisService');
const { invalidateCache } = require('../middlewares/cache');
const { PAGINATION, DEFAULT_SORT, DEFAULT_ORDER, SORTABLE_FIELDS } = require('../utils/constants');
const ApiError = require('../utils/apiError');
const logger = require('../config/logger');

class ProfileService {
  /**
   * Fetch, analyze, and store a GitHub profile
   * If the profile already exists, it is updated (upsert).
   * @param {string} username - GitHub username
   * @returns {Promise<Object>} Stored profile with repositories
   */
  async analyzeAndStore(username) {
    logger.info(`Starting analysis pipeline for: ${username}`);

    // Step 1: Fetch data from GitHub API
    const [userData, repos, events] = await Promise.all([
      githubService.fetchUserProfile(username),
      githubService.fetchUserRepos(username),
      githubService.fetchUserEvents(username),
    ]);

    // Step 2: Analyze the data
    const analysisResult = analysisService.analyzeProfile(userData, repos, events);

    // Step 3: Upsert profile (create or update)
    const [profile, created] = await Profile.upsert(analysisResult, {
      returning: true,
    });

    // Fetch the profile to get the ID (upsert doesn't always return it)
    const savedProfile = await Profile.findOne({
      where: { username: analysisResult.username },
    });

    // Step 4: Replace repository data
    // Delete existing repositories for this profile
    await Repository.destroy({
      where: { profile_id: savedProfile.id },
    });

    // Insert new repository data
    const repoData = analysisService.prepareRepositoryData(repos, savedProfile.id);
    if (repoData.length > 0) {
      await Repository.bulkCreate(repoData);
    }

    // Step 5: Invalidate relevant caches
    invalidateCache('profile:');
    invalidateCache('profiles:');
    invalidateCache('compare:');

    // Step 6: Return complete profile with repositories
    const result = await Profile.findOne({
      where: { id: savedProfile.id },
      include: [{
        model: Repository,
        as: 'repositories',
        attributes: { exclude: ['created_at', 'updated_at'] },
      }],
    });

    logger.info(`Analysis complete for ${username}. Profile ${created ? 'created' : 'updated'}.`);
    return { profile: result, isNew: created };
  }

  /**
   * Get all profiles with pagination, search, sorting, and filtering
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} { profiles, pagination }
   */
  async getAllProfiles(query = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      sort = DEFAULT_SORT,
      order = DEFAULT_ORDER,
      search,
      language,
      min_followers,
      min_stars,
    } = query;

    // Build WHERE clause
    const where = {};

    // Search by username or name
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { bio: { [Op.like]: `%${search}%` } },
      ];
    }

    // Filter by most used language
    if (language) {
      where.most_used_language = { [Op.like]: language };
    }

    // Filter by minimum followers
    if (min_followers) {
      where.followers = { [Op.gte]: parseInt(min_followers, 10) };
    }

    // Filter by minimum stars
    if (min_stars) {
      where.total_stars = { [Op.gte]: parseInt(min_stars, 10) };
    }

    // Validate sort field
    const sortField = SORTABLE_FIELDS.includes(sort) ? sort : DEFAULT_SORT;
    const sortOrder = ['ASC', 'DESC'].includes(order.toUpperCase())
      ? order.toUpperCase()
      : DEFAULT_ORDER;

    const offset = (page - 1) * limit;

    const { count, rows } = await Profile.findAndCountAll({
      where,
      order: [[sortField, sortOrder]],
      limit,
      offset,
      attributes: {
        exclude: ['top_repositories', 'language_stats', 'activity_insights', 'contribution_data'],
      },
    });

    return {
      profiles: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get a single profile by username with full data
   * @param {string} username - GitHub username
   * @returns {Promise<Object>} Profile with repositories
   */
  async getProfile(username) {
    const profile = await Profile.findOne({
      where: { username: username.toLowerCase() },
      include: [{
        model: Repository,
        as: 'repositories',
        attributes: { exclude: ['created_at', 'updated_at'] },
        order: [['stars', 'DESC']],
      }],
    });

    if (!profile) {
      throw ApiError.notFound(`Profile for '${username}' not found in database. Use POST /api/github/analyze/${username} first.`);
    }

    return profile;
  }

  /**
   * Delete a profile and its repositories
   * @param {string} username - GitHub username
   * @returns {Promise<boolean>}
   */
  async deleteProfile(username) {
    const profile = await Profile.findOne({
      where: { username: username.toLowerCase() },
    });

    if (!profile) {
      throw ApiError.notFound(`Profile for '${username}' not found`);
    }

    // Cascade delete will handle repositories
    await profile.destroy();

    // Invalidate caches
    invalidateCache('profile:');
    invalidateCache('profiles:');
    invalidateCache('compare:');

    logger.info(`Profile deleted: ${username}`);
    return true;
  }

  /**
   * Compare multiple profiles
   * @param {Array<string>} usernames - Array of usernames to compare
   * @returns {Promise<Object>} Comparison result
   */
  async compareProfiles(usernames) {
    const profiles = [];

    for (const username of usernames) {
      const profile = await Profile.findOne({
        where: { username: username.toLowerCase() },
      });

      if (!profile) {
        throw ApiError.notFound(
          `Profile for '${username}' not found. Analyze it first with POST /api/github/analyze/${username}`
        );
      }

      profiles.push(profile);
    }

    return analysisService.compareProfiles(profiles);
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Stats summary
   */
  async getStats() {
    const totalProfiles = await Profile.count();
    const totalRepos = await Repository.count();
    const avgScore = await Profile.findOne({
      attributes: [
        [Profile.sequelize.fn('AVG', Profile.sequelize.col('profile_score')), 'avg_score'],
        [Profile.sequelize.fn('MAX', Profile.sequelize.col('profile_score')), 'max_score'],
        [Profile.sequelize.fn('AVG', Profile.sequelize.col('followers')), 'avg_followers'],
        [Profile.sequelize.fn('AVG', Profile.sequelize.col('total_stars')), 'avg_stars'],
      ],
      raw: true,
    });

    // Top languages across all profiles
    const profiles = await Profile.findAll({
      attributes: ['language_stats'],
      raw: true,
    });

    const globalLanguageStats = {};
    for (const profile of profiles) {
      const stats = typeof profile.language_stats === 'string'
        ? JSON.parse(profile.language_stats)
        : profile.language_stats;
      if (stats) {
        for (const [lang, count] of Object.entries(stats)) {
          globalLanguageStats[lang] = (globalLanguageStats[lang] || 0) + count;
        }
      }
    }

    // Sort and get top 10
    const topLanguages = Object.fromEntries(
      Object.entries(globalLanguageStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
    );

    return {
      total_profiles: totalProfiles,
      total_repositories: totalRepos,
      avg_profile_score: avgScore ? Math.round((avgScore.avg_score || 0) * 100) / 100 : 0,
      max_profile_score: avgScore ? Math.round((avgScore.max_score || 0) * 100) / 100 : 0,
      avg_followers: avgScore ? Math.round(avgScore.avg_followers || 0) : 0,
      avg_stars: avgScore ? Math.round(avgScore.avg_stars || 0) : 0,
      top_languages: topLanguages,
    };
  }
}

// Export singleton instance
module.exports = new ProfileService();
