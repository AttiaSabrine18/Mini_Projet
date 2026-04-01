'use strict';

const express          = require('express');
const { body }         = require('express-validator');
const controller       = require('../controllers/forumController');
const { authentifier } = require('../middlewares/auth');
const isEnseignant     = require('../middlewares/isEnseignant');
const isAdminOrEnseignant = require('../middlewares/isAdminOrEnseignant');

const router = express.Router();

// Toutes les routes nécessitent JWT
router.use(authentifier);

// ─────────────────────────────────────────────────────────────────────────────
//  POST /forum — Créer un thread (Enseignant seulement) US22
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', isEnseignant, [
  body('titre').trim().notEmpty().withMessage('Titre requis.')
    .isLength({ max: 200 }).withMessage('Titre trop long (max 200 caractères).'),
  body('type').optional()
    .isIn(['GENERAL', 'QUESTIONS_REPONSES', 'COMPTES_RENDUS', 'ANNOUCES'])
    .withMessage('Type invalide.'),
  body('coursId').optional().isInt({ min: 1 }).withMessage('coursId invalide.'),
], controller.creerThread);

// ─────────────────────────────────────────────────────────────────────────────
//  GET /forum — Tous les threads (Étudiant + Enseignant + Admin)
//  Filtres : ?type=GENERAL  &coursId=1  &page=1  &limit=20
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', controller.getTousLesThreads);

// ─────────────────────────────────────────────────────────────────────────────
//  GET /forum/:id — Détail thread + tous ses messages (populate)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', controller.getThreadParId);

// ─────────────────────────────────────────────────────────────────────────────
//  POST /forum/:id/messages — Répondre à un thread (tous les rôles)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/messages', [
  body('contenu').trim().notEmpty().withMessage('Contenu requis.'),
  body('parentId').optional().isInt({ min: 1 }),
], controller.ajouterMessage);

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /forum/:id — Supprimer un thread (créateur ou admin)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', isAdminOrEnseignant, controller.supprimerThread);

module.exports = router;