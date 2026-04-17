'use strict';

const AdminGestionService = require('../services/AdminGestionService');
const { success, error }  = require('../utils/response');

// ── FILIÈRES ──────────────────────────────────────────────────────────────────
async function getFilieres(req, res) {
  try {
    const filieres = await AdminGestionService.getFilieres();
    return success(res, { total: filieres.length, filieres }, 'Filières récupérées.');
  } catch (err) { return error(res, err.message, err.statusCode || 500); }
}

async function creerFiliere(req, res) {
  try {
    const filiere = await AdminGestionService.creerFiliere(req.body);
    return success(res, filiere, 'Filière créée avec succès.', 201);
  } catch (err) { return error(res, err.message, err.statusCode || 500); }
}

async function modifierFiliere(req, res) {
  try {
    const filiere = await AdminGestionService.modifierFiliere(parseInt(req.params.id), req.body);
    return success(res, filiere, 'Filière mise à jour.');
  } catch (err) { return error(res, err.message, err.statusCode || 500); }
}

// ── SPÉCIALITÉS ───────────────────────────────────────────────────────────────
async function getSpecialites(req, res) {
  try {
    const specialites = await AdminGestionService.getSpecialites(req.query.filiereId || null);
    return success(res, { total: specialites.length, specialites }, 'Spécialités récupérées.');
  } catch (err) { return error(res, err.message, err.statusCode || 500); }
}

async function creerSpecialite(req, res) {
  try {
    const specialite = await AdminGestionService.creerSpecialite(req.body);
    return success(res, specialite, 'Spécialité créée avec succès.', 201);
  } catch (err) { return error(res, err.message, err.statusCode || 500); }
}

async function modifierSpecialite(req, res) {
  try {
    const specialite = await AdminGestionService.modifierSpecialite(parseInt(req.params.id), req.body);
    return success(res, specialite, 'Spécialité mise à jour.');
  } catch (err) { return error(res, err.message, err.statusCode || 500); }
}

// ── ÉTUDIANTS EN ATTENTE ──────────────────────────────────────────────────────
async function getEtudiantsEnAttente(req, res) {
  try {
    const etudiants = await AdminGestionService.getEtudiantsEnAttente();
    return success(res, { total: etudiants.length, etudiants }, 'Étudiants en attente récupérés.');
  } catch (err) { return error(res, err.message, err.statusCode || 500); }
}

// ── APERÇU RÉPARTITION ────────────────────────────────────────────────────────
async function apercuRepartition(req, res) {
  try {
    const { utilisateurIds, capaciteGroupe } = req.body;
    const apercu = await AdminGestionService.apercuRepartition(
      utilisateurIds || null,
      capaciteGroupe || 30
    );
    return success(res, apercu, 'Aperçu de répartition généré.');
  } catch (err) { return error(res, err.message, err.statusCode || 500); }
}

// ── VALIDER + AFFECTER GROUPES ────────────────────────────────────────────────
async function validerEtAffecterGroupes(req, res) {
  try {
    const { utilisateurIds, capaciteGroupe } = req.body;

    if (!utilisateurIds?.length) {
      return error(res, 'utilisateurIds (tableau) requis.', 400);
    }

    const resultat = await AdminGestionService.validerEtAffecterGroupes(
      utilisateurIds,
      capaciteGroupe || 30
    );

    return success(res, resultat,
      `${resultat.totalValides} étudiant(s) validés et affectés à leurs groupes.`);
  } catch (err) { return error(res, err.message, err.statusCode || 500); }
}

module.exports = {
  getFilieres, creerFiliere, modifierFiliere,
  getSpecialites, creerSpecialite, modifierSpecialite,
  getEtudiantsEnAttente, apercuRepartition, validerEtAffecterGroupes,
};
