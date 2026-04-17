'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/inscriptionController');
const { authentifier, autoriser } = require('../middlewares/auth');

// ─── Étudiant ─────────────────────────────────────────────────────
router.get('/ma-fiche',  authentifier, autoriser('ETUDIANT'), ctrl.getMaFiche);
router.put('/ma-fiche',  authentifier, autoriser('ETUDIANT'), ctrl.soumettreFlche);

// ─── Accessible à tous (étudiant voit les filières pour sa fiche) ─
router.get('/filieres',
  authentifier,
  autoriser('ETUDIANT', 'ENSEIGNANT', 'ADMINISTRATEUR'),
  ctrl.getFilieres
);

// ─── Admin ────────────────────────────────────────────────────────
router.get('/admin/filieres-promotions', authentifier, autoriser('ADMINISTRATEUR'), ctrl.getFilieresPromotions);
router.get('/admin/fiches-en-attente',   authentifier, autoriser('ADMINISTRATEUR'), ctrl.getFichesEnAttente);
router.post('/admin/affecter',           authentifier, autoriser('ADMINISTRATEUR'), ctrl.affecterEtudiant);
router.get('/admin/inscrits',            authentifier, autoriser('ADMINISTRATEUR'), ctrl.getInscrits);

module.exports = router;
