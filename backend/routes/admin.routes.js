'use strict';

const express    = require('express');
const controller = require('../controllers/adminController');
const auth       = require('../middlewares/auth');

const router = express.Router();

// Toutes les routes admin nécessitent : JWT valide + rôle ADMINISTRATEUR
router.use(auth.authentifier, auth.estAdmin);

// ─── Demandes en attente ──────────────────────────────────────────────────────
// GET  /admin/demandes            → toutes les demandes EN_ATTENTE
// GET  /admin/demandes?type=etudiant  → filtrées par type
router.get('/demandes', controller.getDemandesEnAttente);

// PUT  /admin/demandes/:id/valider  → valider un compte
router.put('/demandes/:id/valider', controller.validerDemande);

// PUT  /admin/demandes/:id/refuser  → refuser un compte
router.put('/demandes/:id/refuser', controller.refuserDemande);

// ─── Gestion des comptes ─────────────────────────────────────────────────────
// GET  /admin/comptes             → tous les comptes (avec filtres)
// GET  /admin/comptes?statut=ACTIF&type=ETUDIANT&page=1&limit=20
router.get('/comptes', controller.getTousLesComptes);

// PATCH /admin/comptes/:id/statut → changer statut (ACTIF, SUSPENDU, BLOQUE)
router.patch('/comptes/:id/statut', controller.changerStatutCompte);

// ─── Dashboard ───────────────────────────────────────────────────────────────
// GET  /admin/statistiques        → stats du dashboard
router.get('/statistiques', controller.getStatistiques);

module.exports = router;