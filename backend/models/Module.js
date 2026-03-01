'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Module', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  nom: { type: DataTypes.STRING(200), allowNull: false },
  type: { type: DataTypes.STRING, allowNull: true },
  groupeCible: { type: DataTypes.STRING(10), allowNull: true },
  volumeHoraire: { type: DataTypes.INTEGER, allowNull: false },
  coefficient: { type: DataTypes.DECIMAL(4, 2), allowNull: false },
  sallePreferee: { type: DataTypes.STRING(50), allowNull: true },
  coursId: { type: DataTypes.INTEGER, allowNull: false },
  enseignantPrincipalId: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'modules', timestamps: false });
