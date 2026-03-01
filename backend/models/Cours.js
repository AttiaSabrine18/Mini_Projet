'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Cours', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  nom: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  volumeHoraireCM: { type: DataTypes.INTEGER, defaultValue: 0 },
  volumeHoraireTD: { type: DataTypes.INTEGER, defaultValue: 0 },
  volumeHoraireTP: { type: DataTypes.INTEGER, defaultValue: 0 },
  credits: { type: DataTypes.INTEGER, allowNull: false },
  coefficient: { type: DataTypes.DECIMAL(4, 2), allowNull: false },
  estOptionnel: { type: DataTypes.BOOLEAN, defaultValue: false },
  programmeId: { type: DataTypes.INTEGER, allowNull: false },
  enseignantPrincipalId: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'cours', timestamps: false });
