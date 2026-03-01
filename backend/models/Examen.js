'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Examen', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  type: { type: DataTypes.STRING(50), allowNull: false },
  titre: { type: DataTypes.STRING(200), allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  heureDebut: { type: DataTypes.STRING(5), allowNull: false },
  duree: { type: DataTypes.INTEGER, allowNull: false },
  coefficient: { type: DataTypes.DECIMAL(4, 2), allowNull: false },
  bareme: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  surveillantIds: { type: DataTypes.TEXT, allowNull: true },
  statut: { type: DataTypes.STRING(20), allowNull: false },
  moduleId: { type: DataTypes.INTEGER, allowNull: false },
  enseignantId: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'examens', timestamps: false });
