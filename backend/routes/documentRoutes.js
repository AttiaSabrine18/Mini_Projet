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

// GET /api/documents/mes-cours-liste → liste des cours de l'enseignant
router.get(
  '/mes-cours-liste',          // ← AVANT /mes-cours pour éviter tout conflit
  auth.authentifier,
  auth.estEnseignant,
  controller.getMesCoursListe
);

// GET /api/documents/mes-cours → voir mes documents
router.get(
  '/mes-cours',
  auth.authentifier,
  auth.estEnseignant,
  controller.getMesDocuments
);
// GET /api/documents/cours-filiere → liste des cours de la filière (étudiant)
router.get(
  '/cours-filiere',
  auth.authentifier,
  controller.getCoursFiliere
);


// GET /api/documents/mes-filieres
router.get(
  '/mes-filieres',
  auth.authentifier,
  auth.estEnseignant,
  controller.getMesFilieres
);

// GET /api/documents/groupes-par-filiere/:filiereId
router.get(
  '/groupes-par-filiere/:filiereId',
  auth.authentifier,
  auth.estEnseignant,
  controller.getGroupesByFiliere
);

// GET /api/documents/cours-par-filiere/:filiereId
router.get(
  '/cours-par-filiere/:filiereId',
  auth.authentifier,
  auth.estEnseignant,
  controller.getCoursByFiliere
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