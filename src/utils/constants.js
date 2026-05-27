/**
 * Application Constants
 * 
 * Centralized magic numbers, scoring weights, and default values.
 * Prevents scattered hardcoded values across the codebase.
 */

module.exports = {
  // ── Profile Score Weights ──────────────────────────────────────────
  SCORE_WEIGHTS: {
    FOLLOWERS: 2,
    TOTAL_STARS: 3,
    PUBLIC_REPOS: 1,
    TOTAL_FORKS: 1.5,
    ACCOUNT_AGE_DAYS: 0.01,    // Bonus for account longevity
    DAYS_SINCE_PUSH: -0.1,     // Penalty for inactivity
  },

  // Maximum raw score before normalization (used for log normalization)
  MAX_RAW_SCORE: 1000000,

  // Normalized score range
  SCORE_MIN: 0,
  SCORE_MAX: 100,

  // ── Trending Score Config ──────────────────────────────────────────
  TRENDING: {
    RECENT_DAYS: 30,           // "Recent" activity window
    PUSH_RECENCY_WEIGHT: 0.4,
    EVENT_FREQUENCY_WEIGHT: 0.3,
    STAR_VELOCITY_WEIGHT: 0.3,
  },

  // ── Pagination Defaults ────────────────────────────────────────────
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  // ── GitHub API ─────────────────────────────────────────────────────
  GITHUB: {
    MAX_REPOS_PER_PAGE: 100,
    MAX_EVENTS_PER_PAGE: 100,
    MAX_PAGES: 10,             // Safety limit for pagination
    RATE_LIMIT_UNAUTH: 60,
    RATE_LIMIT_AUTH: 5000,
  },

  // ── Cache Keys ─────────────────────────────────────────────────────
  CACHE_KEYS: {
    PROFILE: (username) => `profile:${username.toLowerCase()}`,
    PROFILES_LIST: (query) => `profiles:${JSON.stringify(query)}`,
    COMPARISON: (u1, u2) => `compare:${[u1, u2].sort().join(':')}`,
  },

  // ── Sortable Fields ────────────────────────────────────────────────
  SORTABLE_FIELDS: [
    'followers',
    'following',
    'total_stars',
    'total_forks',
    'public_repos',
    'profile_score',
    'trending_score',
    'avg_repo_stars',
    'analyzed_at',
    'created_at',
  ],

  // ── Default Sort ───────────────────────────────────────────────────
  DEFAULT_SORT: 'profile_score',
  DEFAULT_ORDER: 'DESC',

  // ── Validation ─────────────────────────────────────────────────────
  USERNAME_REGEX: /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/,
  USERNAME_MAX_LENGTH: 39,
};
