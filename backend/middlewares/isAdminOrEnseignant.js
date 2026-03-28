'use strict';

const { error } = require('../utils/response');

// ─── Admin OU Enseignant ──────────────────────────────────────────────────────
function isAdminOrEnseignant(req, res, next) {
  if (!req.utilisateur) return error(res, 'Non authentifié.', 401);
  const roles = ['ADMINISTRATEUR', 'ENSEIGNANT'];
  if (!roles.includes(req.utilisateur.typeUtilisateur)) {
    return error(res, 'Accès réservé aux administrateurs et enseignants.', 403);
  }
  next();
}

module.exports = isAdminOrEnseignant;