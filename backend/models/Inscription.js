'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Inscription', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  numeroInscription: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  dateInscription: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  dateValidation: { type: DataTypes.DATE, allowNull: true },
  statut: { type: DataTypes.STRING(20), allowNull: false },
  quitusFinancier: { type: DataTypes.BOOLEAN, defaultValue: false },
  montantFrais: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  statutPaiement: { type: DataTypes.STRING(20), allowNull: true },
  etudiantId: { type: DataTypes.INTEGER, allowNull: false },
  promotionId: { type: DataTypes.INTEGER, allowNull: false },
  validePar: { type: DataTypes.INTEGER, allowNull: true },
  coursId: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'inscriptions',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['etudiantId', 'promotionId'] },
  ],
});
