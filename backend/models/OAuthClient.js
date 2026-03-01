'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('OAuthClient', {
  id: { type: DataTypes.STRING, primaryKey: true },
  clientId: { type: DataTypes.STRING, allowNull: false, unique: true },
  clientSecret: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  grants: { type: DataTypes.JSON, allowNull: false },
  redirectUris: { type: DataTypes.JSON, allowNull: false },
  scope: { type: DataTypes.STRING, defaultValue: 'profile email' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE },
}, { tableName: 'oauth_clients', timestamps: true });
