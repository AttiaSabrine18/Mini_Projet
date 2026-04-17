'use strict';

const express    = require('express');
const router     = express.Router();
const auth       = require('../middlewares/auth');
const upload     = require('../middlewares/upload');
const controller = require('../controllers/actualiteController');

// ─── Routes statiques AVANT les dynamiques ────────────────────────────────────
router.get('/toutes',          auth.authentifier, auth.estAdmin, controller.getToutesActualites);
router.get('/telecharger/:id', auth.authentifier, controller.telechargerPDF);

// ─── Admin uniquement ─────────────────────────────────────────────────────────
router.post(
  '/',
  auth.authentifier,
  auth.estAdmin,
  upload.single('fichierPDF'),
  controller.creerActualite
);

router.put(
  '/:id',
  auth.authentifier,
  auth.estAdmin,
  upload.single('fichierPDF'),
  controller.modifierActualite
);

router.delete('/:id', auth.authentifier, auth.estAdmin, controller.supprimerActualite);

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/:id', auth.authentifier, controller.getActualite);
router.get('/',    auth.authentifier, controller.getActualites);

module.exports = router;