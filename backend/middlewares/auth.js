'use strict';

const tokenUtils = require('../utils/tokenUtils');
const { error }  = require('../utils/response');

// ─────────────────────────────────────────────────────────────────────────────
//  Vérification du JWT dans les headers
// ─────────────────────────────────────────────────────────────────────────────
function authentifier(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Token manquant. Veuillez vous connecter.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = tokenUtils.verifierAccessToken(token);
    req.utilisateur = decoded; // { id, email, typeUtilisateur, nom, prenom }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Session expirée. Veuillez vous reconnecter.', 401);
    }
    return error(res, 'Token invalide.', 401);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Restriction par rôle
//  Usage : autoriser('ADMIN') ou autoriser('ETUDIANT', 'ENSEIGNANT')
// ─────────────────────────────────────────────────────────────────────────────
function autoriser(...roles) {
  return (req, res, next) => {
    if (!req.utilisateur) {
      return error(res, 'Non authentifié.', 401);
    }

    if (!roles.includes(req.utilisateur.typeUtilisateur)) {
      return error(res, 'Accès refusé. Vous n\'avez pas les droits nécessaires.', 403);
    }

    next();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Raccourcis pratiques
// ─────────────────────────────────────────────────────────────────────────────
const estEtudiant    = autoriser('ETUDIANT');
const estEnseignant  = autoriser('ENSEIGNANT');
const estAdmin       = autoriser('ADMINISTRATEUR');
const estAuthentifie = authentifier;  // alias lisible

module.exports = {
  authentifier,
  autoriser,
  estEtudiant,
  estEnseignant,
  estAdmin,
  estAuthentifie,
};
