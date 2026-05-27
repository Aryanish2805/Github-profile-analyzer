/**
 * Repository Model
 * 
 * Stores individual repository analytics for each analyzed profile.
 * Linked to Profile via profile_id foreign key.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Repository = sequelize.define('Repository', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  profile_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'profiles',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  repo_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  full_name: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  language: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  stars: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  forks: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  open_issues: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  watchers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  is_fork: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  is_archived: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  html_url: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  homepage: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  default_branch: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'main',
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Repository size in KB',
  },
  topics: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  license: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  repo_created_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  repo_updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  repo_pushed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'repositories',
  indexes: [
    { fields: ['profile_id'] },
    { fields: ['language'] },
    { fields: ['stars'] },
  ],
});

module.exports = Repository;
