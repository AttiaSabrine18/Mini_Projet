'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Session', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  type: {
    type: DataTypes.ENUM('COURS_MAGISTRAL', 'TRAVAUX_DIRIGES', 'TRAVAUX_PRATIQUES', 'EXAMEN'),
    allowNull: false,
  },
  date: { type: DataTypes.DATE, allowNull: false },
  heureDebut: { type: DataTypes.STRING(5), allowNull: false },
  heureFin: { type: DataTypes.STRING(5), allowNull: false },
  groupe: { type: DataTypes.STRING(10), allowNull: true },
  estAnnulee: { type: DataTypes.BOOLEAN, defaultValue: false },
  emploiTempsId: { type: DataTypes.INTEGER, allowNull: false },
  moduleId: { type: DataTypes.INTEGER, allowNull: false },
  coursId: { type: DataTypes.INTEGER, allowNull: true },
  enseignantId: { type: DataTypes.INTEGER, allowNull: false },
  salleId: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'sessions', timestamps: false });
