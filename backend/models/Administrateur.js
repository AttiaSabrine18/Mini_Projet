'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Administrateur', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    utilisateurId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    matricule: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    service: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    permissions: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    niveauAcces: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  }, {
    tableName: 'administrateurs',
    timestamps: false,
  });
};
