'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Document', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  titre: { type: DataTypes.STRING(200), allowNull: false },
  type: { type: DataTypes.ENUM('COURS', 'TD', 'TP', 'EXAMEN'), allowNull: false },
  format: { type: DataTypes.STRING(10), allowNull: false },
  taille: { type: DataTypes.INTEGER, allowNull: false },
  url: { type: DataTypes.STRING(500), allowNull: false },
  dateDepot: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  nbTelechargements: { type: DataTypes.INTEGER, defaultValue: 0 },
  coursId: { type: DataTypes.INTEGER, allowNull: true },
  moduleId: { type: DataTypes.INTEGER, allowNull: true },
  enseignantId: { type: DataTypes.INTEGER, allowNull: true },
  etudiantId: { type: DataTypes.INTEGER, allowNull: true },
  deposePar: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'documents', timestamps: false });
