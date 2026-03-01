'use strict';

const AdminService       = require('../services/AdminService');
const { success, error } = require('../utils/response');

// ─── US8 — GET /admin/demandes ────────────────────────────────────────────────
async function getDemandesEnAttente(req, res) {
  try {
    const { type } = req.query; // ?type=etudiant ou ?type=enseignant
    const demandes = await AdminService.getDemandesEnAttente(type);
    return success(res, { demandes, total: demandes.length }, 'Demandes en attente récupérées.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', err.statusCode || 500);
  }
}

// ─── US9/10 — PUT /admin/demandes/:id/valider ────────────────────────────────
async function validerDemande(req, res) {
  try {
    const result = await AdminService.validerDemande(
      parseInt(req.params.id),
      req.utilisateur.id
    );
    return success(res, result, `Compte de ${result.prenom} ${result.nom} validé avec succès.`);
  } catch (err) {
    return error(res, err.message || 'Erreur.', err.statusCode || 500);
  }
}

// ─── US9/10 — PUT /admin/demandes/:id/refuser ────────────────────────────────
async function refuserDemande(req, res) {
  try {
    const { raison } = req.body;
    const result = await AdminService.refuserDemande(
      parseInt(req.params.id),
      req.utilisateur.id,
      raison
    );
    return success(res, result, 'Demande refusée.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', err.statusCode || 500);
  }
}

// ─── US11 — GET /admin/comptes ───────────────────────────────────────────────
async function getTousLesComptes(req, res) {
  try {
    const { statut, type, page, limit } = req.query;
    const result = await AdminService.getTousLesComptes({
      statut,
      type,
      page:  parseInt(page)  || 1,
      limit: parseInt(limit) || 20,
    });
    return success(res, result, 'Comptes récupérés.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', err.statusCode || 500);
  }
}

// ─── US11 — PATCH /admin/comptes/:id/statut ──────────────────────────────────
async function changerStatutCompte(req, res) {
  try {
    const { statut } = req.body;
    if (!statut) return error(res, 'Statut requis.', 400);

    const result = await AdminService.changerStatutCompte(
      parseInt(req.params.id),
      statut.toUpperCase(),
      req.utilisateur.id
    );
    return success(res, result, `Statut mis à jour → ${result.statut}`);
  } catch (err) {
    return error(res, err.message || 'Erreur.', err.statusCode || 500);
  }
}

// ─── US24 — GET /admin/statistiques ──────────────────────────────────────────
async function getStatistiques(req, res) {
  try {
    const stats = await AdminService.getStatistiques();
    return success(res, stats, 'Statistiques récupérées.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', err.statusCode || 500);
  }
}

module.exports = {
  getDemandesEnAttente,
  validerDemande,
  refuserDemande,
  getTousLesComptes,
  changerStatutCompte,
  getStatistiques,
};