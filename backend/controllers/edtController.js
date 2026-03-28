'use strict';

const EdtService          = require('../services/EdtService');
const EdtGeneratorService = require('../services/EdtGeneratorService');
const { success, error }  = require('../utils/response');

async function getEDT(req, res) {
  try {
    const filtres = { jour: req.query.jour || null, matiere: req.query.matiere || null, salle: req.query.salle || null };
    const result = await EdtService.getEDT(req.utilisateur, filtres);
    return success(res, result, 'Emploi du temps recupere.');
  } catch (err) { return error(res, err.message || 'Erreur.', err.statusCode || 500); }
}

async function creerSeance(req, res) {
  try {
    const session = await EdtService.creerSeance(req.body);
    return success(res, session, 'Seance creee avec succes.', 201);
  } catch (err) { return error(res, err.message || 'Erreur.', err.statusCode || 500); }
}

async function genererEDT(req, res) {
  try {
    const { promotionId, semaine, anneeUniversitaire } = req.body;
    if (!promotionId || !semaine || !anneeUniversitaire) {
      return error(res, 'promotionId, semaine et anneeUniversitaire sont requis.', 400);
    }
    console.log(`Generation EDT — Promotion ${promotionId} Semaine ${semaine}`);
    const result = await EdtGeneratorService.genererEDT({ promotionId, semaine, anneeUniversitaire });
    return success(res, result, `EDT genere — Score: ${result.score}/1000 (${result.qualite})`, 201);
  } catch (err) { return error(res, err.message || 'Erreur generation EDT.', err.statusCode || 500); }
}

async function getGroupesEtudiant(req, res) {
  try {
    const result = await EdtService.getGroupesEtudiant(req.utilisateur.id);
    return success(res, result, 'Informations groupe recuperees.');
  } catch (err) { return error(res, err.message || 'Erreur.', err.statusCode || 500); }
}

async function getClassesEnseignant(req, res) {
  try {
    const result = await EdtService.getClassesEnseignant(req.utilisateur.id);
    return success(res, result, 'Classes recuperees.');
  } catch (err) { return error(res, err.message || 'Erreur.', err.statusCode || 500); }
}

module.exports = { getEDT, creerSeance, genererEDT, getGroupesEtudiant, getClassesEnseignant };