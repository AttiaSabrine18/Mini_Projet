'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Utilisateur = sequelize.define('Utilisateur', {
    id: {
      type:          DataTypes.INTEGER,
      primaryKey:    true,
      autoIncrement: true,
    },
    email: {
      type:      DataTypes.STRING,
      allowNull: false,
      unique:    true,
    },
    motDePasse: {
      type:      DataTypes.STRING,
      allowNull: false,
    },
    sel: {
      type:      DataTypes.STRING,
      allowNull: false,
    },
    nom: {
      type:      DataTypes.STRING(50),
      allowNull: false,
    },
    prenom: {
      type:      DataTypes.STRING(50),
      allowNull: false,
    },
    dateNaissance: {
      type:      DataTypes.DATE,
      allowNull: true,
    },
    telephone: {
      type:      DataTypes.STRING(20),
      allowNull: true,
    },
    adresse: {
      type:      DataTypes.STRING(255),
      allowNull: true,
    },
    photoProfil: {
      type:      DataTypes.STRING(500),
      allowNull: true,
    },
    typeUtilisateur: {
      type:      DataTypes.ENUM('ETUDIANT', 'ENSEIGNANT', 'ADMINISTRATEUR'),
      allowNull: false,
    },
    statut: {
      type:         DataTypes.ENUM('EN_ATTENTE', 'ACTIF', 'INACTIF', 'SUSPENDU', 'BLOQUE'),
      defaultValue: 'EN_ATTENTE',
    },
    dateCreation: {
      type:         DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    dateDerniereConnexion: {
      type:      DataTypes.DATE,
      allowNull: true,
    },
    valideEmail: {
      type:         DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // ── Vérification email ──────────────────────────────────────────────────
    tokenVerification: {
      type:      DataTypes.STRING(64),
      allowNull: true,
    },
    tokenExpiration: {
      type:      DataTypes.DATE,
      allowNull: true,
    },

    // ── Réinitialisation mot de passe ───────────────────────────────────────
    tokenReset: {
      type:      DataTypes.STRING(64),
      allowNull: true,
    },
    tokenResetExpiration: {
      type:      DataTypes.DATE,
      allowNull: true,
    },

  }, {
    tableName:  'utilisateurs',
    timestamps: false,
  });

  return Utilisateur;
};
