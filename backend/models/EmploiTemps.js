'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('EmploiTemps', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  groupe: { type: DataTypes.STRING(10), allowNull: true },
  semaine: { type: DataTypes.INTEGER, allowNull: false },
  anneeUniversitaire: { type: DataTypes.STRING(9), allowNull: false },
  dateDebut: { type: DataTypes.DATE, allowNull: false },
  dateFin: { type: DataTypes.DATE, allowNull: false },
  datePublication: { type: DataTypes.DATE, allowNull: true },
  fichierPDF: { type: DataTypes.STRING(500), allowNull: true },
  promotionId: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'emplois_temps', timestamps: false });
