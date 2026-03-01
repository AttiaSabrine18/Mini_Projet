'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Presence', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  estPresent: { type: DataTypes.BOOLEAN, defaultValue: false },
  heureArrivee: { type: DataTypes.STRING(5), allowNull: true },
  justification: { type: DataTypes.STRING(200), allowNull: true },
  justifiee: { type: DataTypes.BOOLEAN, defaultValue: false },
  dateMarquage: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  sessionId: { type: DataTypes.INTEGER, allowNull: false },
  etudiantId: { type: DataTypes.INTEGER, allowNull: false },
  marquePar: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'presences',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['sessionId', 'etudiantId'] },
  ],
});
