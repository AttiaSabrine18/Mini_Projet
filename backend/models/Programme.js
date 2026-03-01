'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Programme', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  nom: { type: DataTypes.STRING(200), allowNull: false },
  semestre: { type: DataTypes.ENUM('S1', 'S2', 'S3', 'S4', 'S5', 'S6'), allowNull: false },
  volumeHoraireTotal: { type: DataTypes.INTEGER, allowNull: false },
  creditsSemestre: { type: DataTypes.INTEGER, allowNull: false },
  estValide: { type: DataTypes.BOOLEAN, defaultValue: false },
  promotionId: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'programmes', timestamps: false });
