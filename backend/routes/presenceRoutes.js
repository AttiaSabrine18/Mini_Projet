'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/presenceController');
const { authentifier, autoriser } = require('../middlewares/auth');

// ⚠️  ORDRE IMPORTANT : routes fixes AVANT routes paramétrées

// ─── Routes fixes ─────────────────────────────────────────────────────────────

// 1. Séances du jour (enseignant)
router.get('/sessions/aujourd-hui',
  authentifier, autoriser('ENSEIGNANT'),
  ctrl.getSessionsAujourdhui
);

// 2. Séances sans présences (admin détecte profs absents)
router.get('/admin/seances-sans-presence',
  authentifier, autoriser('ADMINISTRATEUR'),
  ctrl.getSeancesSansPresence
);

// 3. Marquer UN étudiant
router.post('/',
  authentifier, autoriser('ENSEIGNANT'),
  ctrl.marquerPresence
);

// 4. Marquer TOUTE la classe
router.post('/bulk',
  authentifier, autoriser('ENSEIGNANT'),
  ctrl.marquerPresenceBulk
);

// ─── Routes paramétrées ───────────────────────────────────────────────────────

// 5. Liste étudiants d'une séance (avant marquage)
router.get('/sessions/:id/etudiants',
  authentifier, autoriser('ENSEIGNANT', 'ADMINISTRATEUR'),
  ctrl.getEtudiantsDuneSeance
);

// 6. Changer statut séance (annuler, reporter, démarrer...)
router.patch('/sessions/:id/statut',
  authentifier, autoriser('ENSEIGNANT', 'ADMINISTRATEUR'),
  ctrl.changerStatutSession
);

// 7. Liste présences complète d'une séance
router.get('/seance/:id',
  authentifier, autoriser('ENSEIGNANT', 'ADMINISTRATEUR'),
  ctrl.getPresencesSeance
);

// 8. Historique étudiant — EN DERNIER (évite conflit avec routes fixes)
router.get('/:etudiantId',
  authentifier, autoriser('ETUDIANT', 'ENSEIGNANT', 'ADMINISTRATEUR'),
  ctrl.getHistoriqueEtudiant
);

module.exports = router;
