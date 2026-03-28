'use strict';

const express          = require('express');
const { body }         = require('express-validator');
const controller       = require('../controllers/edtController');
const { authentifier } = require('../middlewares/auth');
const isAdmin          = require('../middlewares/isAdmin');
const isEnseignant     = require('../middlewares/isEnseignant');
const { error }        = require('../utils/response');

const router = express.Router();

router.use(authentifier);

const isEtudiant = (req, res, next) => {
  if (req.utilisateur.typeUtilisateur !== 'ETUDIANT') {
    return error(res, 'Acces reserve aux etudiants.', 403);
  }
  next();
};

// GET /edt — EDT selon le role
router.get('/', controller.getEDT);

// POST /edt — Creer une seance manuellement (admin)
router.post('/', isAdmin, [
  body('code').notEmpty().withMessage('Code requis.'),
  body('type').isIn(['COURS_MAGISTRAL','TRAVAUX_DIRIGES','TRAVAUX_PRATIQUES','EXAMEN']),
  body('date').isISO8601().withMessage('Date invalide.'),
  body('heureDebut').notEmpty(),
  body('heureFin').notEmpty(),
  body('emploiTempsId').isInt({ min: 1 }),
  body('coursId').isInt({ min: 1 }),
  body('moduleId').isInt({ min: 1 }),
], controller.creerSeance);

// POST /edt/generer — Generer EDT automatiquement (algo genetique)
router.post('/generer', isAdmin, controller.genererEDT);

// GET /edt/groupes — Groupes etudiant (US13)
router.get('/groupes', isEtudiant, controller.getGroupesEtudiant);

// GET /edt/classes — Classes enseignant (US16)
router.get('/classes', isEnseignant, controller.getClassesEnseignant);

module.exports = router;