'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Promotion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  anneeUniversitaire: { type: DataTypes.STRING(9), allowNull: false },
  niveau: { type: DataTypes.ENUM('L1', 'L2', 'L3', 'M1', 'M2'), allowNull: false },
  groupes: { type: DataTypes.TEXT, allowNull: true },
  effectifReel: { type: DataTypes.INTEGER, defaultValue: 0 },
  estActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  specialiteId: { type: DataTypes.INTEGER, allowNull: false },
  responsableId: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'promotions', timestamps: false });
