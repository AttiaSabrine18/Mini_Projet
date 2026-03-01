'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Filiere', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    niveauAcces: {
      type: DataTypes.ENUM('L1', 'L2', 'L3', 'M1', 'M2'),
      allowNull: false,
    },
    dureeEtudes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    creditsTotal: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    estActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    capaciteMax: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    effectifActuel: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    responsableId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
    },
  }, {
    tableName: 'filieres',
    timestamps: false,
  });
};
