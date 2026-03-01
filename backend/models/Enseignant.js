'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Enseignant', {
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
    grade: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    specialite: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    dateRecrutement: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    bureau: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    telephoneInterne: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    heuresServiceAnnuel: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    heuresEffectuees: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    estResponsableFiliere: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'enseignants',
    timestamps: false,
  });
};
