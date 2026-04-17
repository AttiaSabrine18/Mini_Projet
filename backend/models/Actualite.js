'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Actualite', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  titre: { type: DataTypes.STRING(200), allowNull: false },
  contenu: { type: DataTypes.TEXT, allowNull: false },
  fichierPDF: { type: DataTypes.STRING(500), allowNull: true },
  datePublication: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  estPubliee: { type: DataTypes.BOOLEAN, defaultValue: true },
  adminId: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'actualites', timestamps: false });