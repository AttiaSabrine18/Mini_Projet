'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Salle', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  nom: { type: DataTypes.STRING(50), allowNull: false },
  batiment: { type: DataTypes.STRING(50), allowNull: false },
  capacite: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.STRING(50), allowNull: false },
  equipements: { type: DataTypes.TEXT, allowNull: true },
  estActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'salles', timestamps: false });
