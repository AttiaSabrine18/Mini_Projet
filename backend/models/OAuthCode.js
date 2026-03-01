'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('OAuthCode', {
  id: { type: DataTypes.STRING, primaryKey: true },
  authorizationCode: { type: DataTypes.STRING, allowNull: false, unique: true },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  redirectUri: { type: DataTypes.STRING, allowNull: false },
  scope: { type: DataTypes.STRING, allowNull: true },
  clientId: { type: DataTypes.STRING, allowNull: false },
  utilisateurId: { type: DataTypes.INTEGER, allowNull: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'oauth_codes', timestamps: false });
