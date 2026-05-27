/**
 * Profile Model
 * 
 * Stores analyzed GitHub profile data including computed insights,
 * language statistics, and scoring metrics.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  avatar_url: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  html_url: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  company: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  blog: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  followers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  following: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  public_repos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  account_created_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  // ── Computed Analytics ─────────────────────────────────────────
  most_used_language: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  total_stars: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  total_forks: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  avg_repo_stars: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  profile_score: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  trending_score: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },

  // ── JSON Fields ────────────────────────────────────────────────
  top_repositories: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Top 5 repositories sorted by stars',
  },
  language_stats: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Repository count by language',
  },
  activity_insights: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Activity metrics: last push, avg issues, repo age distribution',
  },
  contribution_data: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Contribution graph summary data',
  },

  analyzed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'profiles',
  indexes: [
    { unique: true, fields: ['username'] },
    { fields: ['profile_score'] },
    { fields: ['total_stars'] },
    { fields: ['followers'] },
  ],
});

module.exports = Profile;
