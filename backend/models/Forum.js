'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Forum', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  titre: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  type: { type: DataTypes.ENUM('GENERAL', 'QUESTIONS_REPONSES', 'COMPTES_RENDUS', 'ANNOUCES'), allowNull: false },
  estPrive: { type: DataTypes.BOOLEAN, defaultValue: true },
  dateCreation: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  nbMessages: { type: DataTypes.INTEGER, defaultValue: 0 },
  coursId: { type: DataTypes.INTEGER, allowNull: false },
  createdBy: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'forums', timestamps: false });
