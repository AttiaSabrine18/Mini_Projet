'use strict';

const { error } = require('../utils/response');

// ─── Enseignant seulement ─────────────────────────────────────────────────────
function isEnseignant(req, res, next) {
  if (!req.utilisateur) return error(res, 'Non authentifié.', 401);
  if (req.utilisateur.typeUtilisateur !== 'ENSEIGNANT') {
    return error(res, 'Accès réservé aux enseignants.', 403);
  }
  next();
}

module.exports = isEnseignant;