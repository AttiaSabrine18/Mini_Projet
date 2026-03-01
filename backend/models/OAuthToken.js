'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('OAuthToken', {
  id: { type: DataTypes.STRING, primaryKey: true },
  accessToken: { type: DataTypes.STRING, allowNull: false, unique: true },
  accessTokenExpiresAt: { type: DataTypes.DATE, allowNull: false },
  refreshToken: { type: DataTypes.STRING, allowNull: true, unique: true },
  refreshTokenExpiresAt: { type: DataTypes.DATE, allowNull: true },
  scope: { type: DataTypes.STRING, allowNull: true },
  clientId: { type: DataTypes.STRING, allowNull: false },
  utilisateurId: { type: DataTypes.INTEGER, allowNull: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'oauth_tokens', timestamps: false });
