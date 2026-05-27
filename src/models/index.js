/**
 * Models Index
 * 
 * Initializes all Sequelize models and defines associations.
 * This is the single entry point for all database models.
 */

const { sequelize } = require('../config/database');
const Profile = require('./Profile');
const Repository = require('./Repository');
const Admin = require('./Admin');

// ── Define Associations ──────────────────────────────────────────────

// Profile has many Repositories (cascade delete)
Profile.hasMany(Repository, {
  foreignKey: 'profile_id',
  as: 'repositories',
  onDelete: 'CASCADE',
  hooks: true,
});

// Repository belongs to a Profile
Repository.belongsTo(Profile, {
  foreignKey: 'profile_id',
  as: 'profile',
});

module.exports = {
  sequelize,
  Profile,
  Repository,
  Admin,
};
