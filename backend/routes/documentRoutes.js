'use strict';

const express    = require('express');
const router     = express.Router();
const auth       = require('../middlewares/auth');
const upload     = require('../middlewares/upload');
const controller = require('../controllers/documentController');

// ─── Enseignant uniquement ────────────────────────────────────────────────────

// POST /api/documents/upload → uploader un PDF
router.post(
  '/upload',
  auth.authentifier,
  auth.estEnseignant,
  upload.single('fichier'),
  controller.uploaderDocument
);

// GET /api/documents/mes-cours → voir mes documents
router.get(
  '/mes-cours',
  auth.authentifier,
  auth.estEnseignant,
  controller.getMesDocuments
);

// DELETE /api/documents/:id → supprimer mon document
router.delete(
  '/:id',
  auth.authentifier,
  auth.estEnseignant,
  controller.supprimerDocument
);

// ─── Enseignant + Étudiant ────────────────────────────────────────────────────

// GET /api/documents/cours/:coursId → consulter les docs d'un cours
router.get(
  '/cours/:coursId',
  auth.authentifier,
  controller.getDocumentsByCours
);

// GET /api/documents/telecharger/:id → télécharger un PDF protégé
router.get(
  '/telecharger/:id',
  auth.authentifier,
  controller.telechargerDocument
);
module.exports = router;