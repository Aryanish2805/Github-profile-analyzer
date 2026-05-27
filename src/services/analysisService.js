/**
 * Analysis Service
 * 
 * Contains all the business logic for analyzing GitHub profile data.
 * Computes scores, language statistics, activity insights, and rankings.
 */

const { SCORE_WEIGHTS, MAX_RAW_SCORE, SCORE_MIN, SCORE_MAX, TRENDING } = require('../utils/constants');
const logger = require('../config/logger');

class AnalysisService {
  /**
   * Perform full analysis on a GitHub profile and its repositories
   * @param {Object} userData - Raw GitHub user profile data
   * @param {Array} repos - Array of repository objects
   * @param {Array} events - Array of public event objects
   * @returns {Object} Analyzed profile data ready for database storage
   */
  analyzeProfile(userData, repos, events = []) {
    logger.info(`Analyzing profile for: ${userData.login}`);

    const languageStats = this._computeLanguageStats(repos);
    const mostUsedLanguage = this._getMostUsedLanguage(languageStats);
    const totalStars = this._computeTotalStars(repos);
    const totalForks = this._computeTotalForks(repos);
    const topRepositories = this._getTopRepositories(repos, 5);
    const avgRepoStars = repos.length > 0 ? totalStars / repos.length : 0;
    const activityInsights = this._computeActivityInsights(repos, events);
    const contributionData = this._computeContributionData(events);

    const profileScore = this._computeProfileScore({
      followers: userData.followers,
      totalStars,
      publicRepos: userData.public_repos,
      totalForks,
      accountCreatedAt: userData.created_at,
      lastPushedAt: this._getLastPushDate(repos),
    });

    const trendingScore = this._computeTrendingScore(repos, events);

    return {
      username: userData.login,
      name: userData.name,
      bio: userData.bio,
      avatar_url: userData.avatar_url,
      html_url: userData.html_url,
      location: userData.location,
      company: userData.company,
      blog: userData.blog,
      followers: userData.followers,
      following: userData.following,
      public_repos: userData.public_repos,
      account_created_at: userData.created_at,
      most_used_language: mostUsedLanguage,
      total_stars: totalStars,
      total_forks: totalForks,
      avg_repo_stars: Math.round(avgRepoStars * 100) / 100,
      profile_score: profileScore,
      trending_score: trendingScore,
      top_repositories: topRepositories,
      language_stats: languageStats,
      activity_insights: activityInsights,
      contribution_data: contributionData,
      analyzed_at: new Date(),
    };
  }

  /**
   * Prepare repository data for database storage
   * @param {Array} repos - Raw repository data from GitHub
   * @param {number} profileId - The profile's database ID
   * @returns {Array} Formatted repository records
   */
  prepareRepositoryData(repos, profileId) {
    return repos.map((repo) => ({
      profile_id: profileId,
      repo_name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      open_issues: repo.open_issues_count || 0,
      watchers: repo.watchers_count || 0,
      is_fork: repo.fork || false,
      is_archived: repo.archived || false,
      html_url: repo.html_url,
      homepage: repo.homepage,
      default_branch: repo.default_branch || 'main',
      size: repo.size || 0,
      topics: repo.topics || [],
      license: repo.license ? repo.license.spdx_id : null,
      repo_created_at: repo.created_at,
      repo_updated_at: repo.updated_at,
      repo_pushed_at: repo.pushed_at,
    }));
  }

  /**
   * Compare two or more analyzed profiles
   * @param {Array} profiles - Array of profile objects from database
   * @returns {Object} Comparison result with rankings
   */
  compareProfiles(profiles) {
    if (profiles.length < 2) return null;

    const metrics = [
      'followers', 'following', 'public_repos', 'total_stars',
      'total_forks', 'avg_repo_stars', 'profile_score', 'trending_score',
    ];

    const comparison = {
      profiles: profiles.map((p) => ({
        username: p.username,
        name: p.name,
        avatar_url: p.avatar_url,
      })),
      metrics: {},
      winner: null,
    };

    // Compare each metric
    for (const metric of metrics) {
      const values = profiles.map((p) => ({
        username: p.username,
        value: p[metric] || 0,
      }));

      values.sort((a, b) => b.value - a.value);

      comparison.metrics[metric] = {
        values,
        leader: values[0].username,
      };
    }

    // Determine overall winner by profile_score
    const scoreLeader = comparison.metrics.profile_score.leader;
    comparison.winner = {
      username: scoreLeader,
      profile: profiles.find((p) => p.username === scoreLeader),
    };

    return comparison;
  }

  // ── Private Methods ────────────────────────────────────────────────

  /**
   * Count repositories per language
   * @private
   */
  _computeLanguageStats(repos) {
    const stats = {};
    for (const repo of repos) {
      if (repo.language) {
        stats[repo.language] = (stats[repo.language] || 0) + 1;
      }
    }
    // Sort by count descending
    return Object.fromEntries(
      Object.entries(stats).sort(([, a], [, b]) => b - a)
    );
  }

  /**
   * Get the most frequently used language
   * @private
   */
  _getMostUsedLanguage(languageStats) {
    const entries = Object.entries(languageStats);
    if (entries.length === 0) return null;
    return entries[0][0]; // Already sorted descending
  }

  /**
   * Sum all stargazers across repositories
   * @private
   */
  _computeTotalStars(repos) {
    return repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  }

  /**
   * Sum all forks across repositories
   * @private
   */
  _computeTotalForks(repos) {
    return repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
  }

  /**
   * Get top N repositories sorted by stars
   * @private
   */
  _getTopRepositories(repos, n = 5) {
    return repos
      .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
      .slice(0, n)
      .map((repo) => ({
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        html_url: repo.html_url,
        topics: repo.topics || [],
      }));
  }

  /**
   * Get the most recent push date across all repos
   * @private
   */
  _getLastPushDate(repos) {
    if (repos.length === 0) return null;
    const dates = repos
      .filter((r) => r.pushed_at)
      .map((r) => new Date(r.pushed_at));
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates));
  }

  /**
   * Compute profile score using weighted formula with logarithmic normalization
   * @private
   */
  _computeProfileScore({ followers, totalStars, publicRepos, totalForks, accountCreatedAt, lastPushedAt }) {
    const now = new Date();
    const accountAge = accountCreatedAt
      ? (now - new Date(accountCreatedAt)) / (1000 * 60 * 60 * 24)
      : 0;
    const daysSinceLastPush = lastPushedAt
      ? (now - new Date(lastPushedAt)) / (1000 * 60 * 60 * 24)
      : 365;

    // Calculate raw score
    let rawScore =
      followers * SCORE_WEIGHTS.FOLLOWERS +
      totalStars * SCORE_WEIGHTS.TOTAL_STARS +
      publicRepos * SCORE_WEIGHTS.PUBLIC_REPOS +
      totalForks * SCORE_WEIGHTS.TOTAL_FORKS +
      accountAge * SCORE_WEIGHTS.ACCOUNT_AGE_DAYS +
      daysSinceLastPush * SCORE_WEIGHTS.DAYS_SINCE_PUSH;

    // Ensure non-negative
    rawScore = Math.max(rawScore, 0);

    // Logarithmic normalization to [0, 100]
    const normalized = rawScore > 0
      ? (Math.log10(rawScore + 1) / Math.log10(MAX_RAW_SCORE + 1)) * SCORE_MAX
      : SCORE_MIN;

    return Math.round(Math.min(Math.max(normalized, SCORE_MIN), SCORE_MAX) * 100) / 100;
  }

  /**
   * Compute trending score based on recent activity
   * @private
   */
  _computeTrendingScore(repos, events) {
    const now = new Date();
    const recentDays = TRENDING.RECENT_DAYS;
    const cutoff = new Date(now - recentDays * 24 * 60 * 60 * 1000);

    // Push recency: how recently was the last push?
    const recentPushes = repos.filter(
      (r) => r.pushed_at && new Date(r.pushed_at) > cutoff
    );
    const pushRecency = Math.min(recentPushes.length / Math.max(repos.length, 1), 1);

    // Event frequency: number of events in the recent window
    const recentEvents = events.filter(
      (e) => e.created_at && new Date(e.created_at) > cutoff
    );
    const eventFrequency = Math.min(recentEvents.length / 100, 1);

    // Star velocity: stars on recently pushed repos
    const recentStars = recentPushes.reduce(
      (sum, r) => sum + (r.stargazers_count || 0),
      0
    );
    const starVelocity = Math.min(recentStars / 1000, 1);

    const score =
      pushRecency * TRENDING.PUSH_RECENCY_WEIGHT +
      eventFrequency * TRENDING.EVENT_FREQUENCY_WEIGHT +
      starVelocity * TRENDING.STAR_VELOCITY_WEIGHT;

    return Math.round(score * SCORE_MAX * 100) / 100;
  }

  /**
   * Compute activity insights from repos and events
   * @private
   */
  _computeActivityInsights(repos, events) {
    const now = new Date();

    // Last push date
    const lastPush = this._getLastPushDate(repos);

    // Average open issues per repo
    const avgOpenIssues = repos.length > 0
      ? repos.reduce((sum, r) => sum + (r.open_issues_count || 0), 0) / repos.length
      : 0;

    // Repo age distribution
    const ageCategories = { recent: 0, moderate: 0, old: 0 };
    for (const repo of repos) {
      if (!repo.created_at) continue;
      const ageMonths = (now - new Date(repo.created_at)) / (1000 * 60 * 60 * 24 * 30);
      if (ageMonths < 6) ageCategories.recent++;
      else if (ageMonths < 24) ageCategories.moderate++;
      else ageCategories.old++;
    }

    // Fork ratio
    const originalRepos = repos.filter((r) => !r.fork);
    const forkedRepos = repos.filter((r) => r.fork);

    // Event type distribution (from recent events)
    const eventTypes = {};
    for (const event of events) {
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
    }

    // Active days (unique days with events)
    const activeDays = new Set(
      events.map((e) => new Date(e.created_at).toISOString().split('T')[0])
    ).size;

    return {
      last_push_date: lastPush ? lastPush.toISOString() : null,
      days_since_last_push: lastPush
        ? Math.floor((now - lastPush) / (1000 * 60 * 60 * 24))
        : null,
      avg_open_issues: Math.round(avgOpenIssues * 100) / 100,
      repo_age_distribution: ageCategories,
      original_repos: originalRepos.length,
      forked_repos: forkedRepos.length,
      fork_ratio: repos.length > 0
        ? Math.round((forkedRepos.length / repos.length) * 100) / 100
        : 0,
      recent_event_types: eventTypes,
      active_days_last_90: activeDays,
      total_repo_size_kb: repos.reduce((sum, r) => sum + (r.size || 0), 0),
    };
  }

  /**
   * Compute contribution graph summary from events
   * @private
   */
  _computeContributionData(events) {
    if (!events || events.length === 0) {
      return {
        total_events: 0,
        push_events: 0,
        pr_events: 0,
        issue_events: 0,
        review_events: 0,
        daily_average: 0,
        most_active_day: null,
        contribution_streak: 0,
      };
    }

    // Count event types
    const pushEvents = events.filter((e) => e.type === 'PushEvent').length;
    const prEvents = events.filter(
      (e) => e.type === 'PullRequestEvent'
    ).length;
    const issueEvents = events.filter(
      (e) => e.type === 'IssuesEvent'
    ).length;
    const reviewEvents = events.filter(
      (e) => e.type === 'PullRequestReviewEvent'
    ).length;

    // Daily contribution counts
    const dailyCounts = {};
    for (const event of events) {
      const day = new Date(event.created_at).toISOString().split('T')[0];
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    }

    const days = Object.keys(dailyCounts).sort();
    const totalDays = days.length;
    const dailyAverage = totalDays > 0 ? events.length / totalDays : 0;

    // Most active day
    let mostActiveDay = null;
    let maxCount = 0;
    for (const [day, count] of Object.entries(dailyCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostActiveDay = day;
      }
    }

    // Contribution streak (consecutive days)
    let currentStreak = 0;
    let maxStreak = 0;
    for (let i = 0; i < days.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prev = new Date(days[i - 1]);
        const curr = new Date(days[i]);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      maxStreak = Math.max(maxStreak, currentStreak);
    }

    return {
      total_events: events.length,
      push_events: pushEvents,
      pr_events: prEvents,
      issue_events: issueEvents,
      review_events: reviewEvents,
      daily_average: Math.round(dailyAverage * 100) / 100,
      most_active_day: mostActiveDay,
      most_active_day_count: maxCount,
      contribution_streak: maxStreak,
      active_days: totalDays,
    };
  }
}

// Export singleton instance
module.exports = new AnalysisService();
