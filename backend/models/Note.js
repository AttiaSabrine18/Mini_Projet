'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Note', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  valeur: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  valeurSur20: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  mention: { type: DataTypes.STRING(20), allowNull: true },
  dateSaisie: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  dateValidation: { type: DataTypes.DATE, allowNull: true },
  examenId: { type: DataTypes.INTEGER, allowNull: false },
  etudiantId: { type: DataTypes.INTEGER, allowNull: false },
  saisiePar: { type: DataTypes.INTEGER, allowNull: true },
  validePar: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'notes', timestamps: false });
