'use strict';

const ForumService       = require('../services/ForumService');
const { success, error } = require('../utils/response');

// ─── POST /forum — Créer un thread (Enseignant) ───────────────────────────────
async function creerThread(req, res) {
  try {
    const forum = await ForumService.creerThread(req.body, req.utilisateur.id);
    return success(res, forum, 'Thread créé avec succès.', 201);
  } catch (err) {
    return error(res, err.message || 'Erreur.', err.statusCode || 500);
  }
}

// ─── GET /forum — Liste tous les threads ─────────────────────────────────────
async function getTousLesThreads(req, res) {
  try {
    const { page, limit, type, coursId } = req.query;
    const result = await ForumService.getTousLesThreads({ page, limit, type, coursId });
    return success(res, result, 'Threads récupérés.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', err.statusCode || 500);
  }
}

// ─── GET /forum/:id — Détail thread + messages ───────────────────────────────
async function getThreadParId(req, res) {
  try {
    const forum = await ForumService.getThreadParId(parseInt(req.params.id));
    return success(res, forum, 'Thread récupéré.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', err.statusCode || 500);
  }
}

// ─── POST /forum/:id/messages — Répondre à un thread ────────────────────────
async function ajouterMessage(req, res) {
  try {
    const { contenu, parentId } = req.body;
    if (!contenu) return error(res, 'Contenu requis.', 400);

    const message = await ForumService.ajouterMessage(
      req.params.id,
      contenu,
      req.utilisateur.id,
      parentId || null
    );
    return success(res, message, 'Message ajouté.', 201);
  } catch (err) {
    return error(res, err.message || 'Erreur.', err.statusCode || 500);
  }
}

// ─── DELETE /forum/:id — Supprimer un thread ─────────────────────────────────
async function supprimerThread(req, res) {
  try {
    const result = await ForumService.supprimerThread(
      parseInt(req.params.id),
      req.utilisateur.id,
      req.utilisateur.typeUtilisateur
    );
    return success(res, {}, result.message);
  } catch (err) {
    return error(res, err.message || 'Erreur.', err.statusCode || 500);
  }
}

module.exports = {
  creerThread,
  getTousLesThreads,
  getThreadParId,
  ajouterMessage,
  supprimerThread,
};