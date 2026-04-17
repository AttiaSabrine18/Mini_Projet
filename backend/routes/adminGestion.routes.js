'use strict';

const express          = require('express');
const { body }         = require('express-validator');
const ctrl             = require('../controllers/adminGestionController');
const { authentifier } = require('../middlewares/auth');
const isAdmin          = require('../middlewares/isAdmin');

const router = express.Router();

router.use(authentifier, isAdmin);

// ══════════════════════════════════════════════════════════════════════════════
//  FILIÈRES
// ══════════════════════════════════════════════════════════════════════════════
router.get   ('/filieres',      ctrl.getFilieres);
router.post  ('/filieres', [
  body('nom').notEmpty().withMessage('Nom requis.'),
  body('code').notEmpty().withMessage('Code requis.'),
  body('niveauAcces').isIn(['L1','L2','L3','M1','M2']).withMessage('niveauAcces invalide.'),
  body('dureeEtudes').isInt({ min: 1 }).withMessage('dureeEtudes requis.'),
  body('creditsTotal').isInt({ min: 1 }).withMessage('creditsTotal requis.'),
], ctrl.creerFiliere);
router.put   ('/filieres/:id',  ctrl.modifierFiliere);

// ══════════════════════════════════════════════════════════════════════════════
//  SPÉCIALITÉS
// ══════════════════════════════════════════════════════════════════════════════
router.get   ('/specialites',      ctrl.getSpecialites);          // ?filiereId=1
router.post  ('/specialites', [
  body('nom').notEmpty().withMessage('Nom requis.'),
  body('code').notEmpty().withMessage('Code requis.'),
  body('filiereId').isInt({ min: 1 }).withMessage('filiereId requis.'),
], ctrl.creerSpecialite);
router.put   ('/specialites/:id',  ctrl.modifierSpecialite);

// ══════════════════════════════════════════════════════════════════════════════
//  GESTION DES ÉTUDIANTS & GROUPES
// ══════════════════════════════════════════════════════════════════════════════

// Voir les étudiants dont l'email est vérifié mais compte pas encore activé
router.get('/etudiants/attente', ctrl.getEtudiantsEnAttente);

// Aperçu de répartition AVANT de valider (simulation)
router.post('/groupes/apercu', [
  body('capaciteGroupe').optional().isInt({ min: 5, max: 60 }),
], ctrl.apercuRepartition);

// Valider les comptes + affecter les groupes automatiquement
router.post('/groupes/valider', [
  body('utilisateurIds').isArray({ min: 1 }).withMessage('utilisateurIds (tableau) requis.'),
  body('capaciteGroupe').optional().isInt({ min: 5, max: 60 }),
], ctrl.validerEtAffecterGroupes);

module.exports = router;
