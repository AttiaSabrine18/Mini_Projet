'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  contenu: { type: DataTypes.TEXT, allowNull: false },
  datePublication: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  nbLikes: { type: DataTypes.INTEGER, defaultValue: 0 },
  forumId: { type: DataTypes.INTEGER, allowNull: false },
  auteurId: { type: DataTypes.INTEGER, allowNull: false },
  parentId: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'messages', timestamps: false });
