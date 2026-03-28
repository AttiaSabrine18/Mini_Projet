'use strict';

const { error } = require('../utils/response');

// ─── Admin seulement ──────────────────────────────────────────────────────────
function isAdmin(req, res, next) {
  if (!req.utilisateur) return error(res, 'Non authentifié.', 401);
  if (req.utilisateur.typeUtilisateur !== 'ADMINISTRATEUR') {
    return error(res, 'Accès réservé aux administrateurs.', 403);
  }
  next();
}

module.exports = isAdmin;