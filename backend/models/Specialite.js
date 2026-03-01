'use strict';

const { DataTypes } = require('sequelize');

const Specialite = (sequelize) => sequelize.define('Specialite', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nom: { type: DataTypes.STRING(100), allowNull: false },
  code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  estActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  filiereId: { type: DataTypes.INTEGER, allowNull: false },
  responsableId: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'specialites', timestamps: false });

module.exports = Specialite;
