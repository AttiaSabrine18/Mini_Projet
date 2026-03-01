'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Etudiant', {
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
    numeroEtudiant: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    numeroINE: {
      type: DataTypes.STRING(11),
      allowNull: false,
      unique: true,
    },
    anneeAcademique: {
      type: DataTypes.STRING(9),
      allowNull: false,
    },
    niveau: {
      type: DataTypes.ENUM('L1', 'L2', 'L3', 'M1', 'M2'),
      allowNull: false,
    },
    semestreActuel: {
      type: DataTypes.ENUM('S1', 'S2', 'S3', 'S4', 'S5', 'S6'),
      allowNull: false,
    },
    groupe: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    sousGroupe: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    moyenneGenerale: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    creditsAcquis: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    tauxAbsence: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    filiereId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'etudiants',
    timestamps: false,
  });
};
