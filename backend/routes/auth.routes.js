'use strict';

const express    = require('express');
const { body }   = require('express-validator');
const controller = require('../controllers/authController');
const auth       = require('../middlewares/auth');

const router = express.Router();

// ─── Règles de validation réutilisables ──────────────────────────────────────
const emailRule = body('email')
  .trim()
  .isEmail().withMessage('Email invalide.')
  .normalizeEmail();

const motDePasseRule = body('motDePasse')
  .isLength({ min: 8 }).withMessage('Mot de passe : 8 caractères minimum.')
  .matches(/[A-Z]/).withMessage('Mot de passe : au moins une majuscule.')
  .matches(/[0-9]/).withMessage('Mot de passe : au moins un chiffre.');

const nomRule    = body('nom').trim().notEmpty().withMessage('Nom requis.');
const prenomRule = body('prenom').trim().notEmpty().withMessage('Prénom requis.');

// ─────────────────────────────────────────────────────────────────────────────
//  ROUTES PUBLIQUES
// ─────────────────────────────────────────────────────────────────────────────

// POST /auth/inscription/etudiant
router.post('/inscription/etudiant', [
  emailRule,
  motDePasseRule,
  nomRule,
  prenomRule,
  body('numeroEtudiant').notEmpty().withMessage('Numéro étudiant requis.'),
  body('numeroINE').notEmpty().withMessage('Numéro INE requis.'),
  body('anneeAcademique').notEmpty().withMessage('Année académique requise.'),
  body('niveau').isIn(['L1','L2','L3','M1','M2']).withMessage('Niveau invalide.'),
  body('semestreActuel').isIn(['S1','S2','S3','S4','S5','S6']).withMessage('Semestre invalide.'),
  body('filiereId').isInt({ min: 1 }).withMessage('Filière requise.'),
], controller.inscrireEtudiant);

// POST /auth/inscription/enseignant
router.post('/inscription/enseignant', [
  emailRule,
  motDePasseRule,
  nomRule,
  prenomRule,
  body('matricule').notEmpty().withMessage('Matricule requis.'),
  body('grade').notEmpty().withMessage('Grade requis.'),
  body('specialite').notEmpty().withMessage('Spécialité requise.'),
], controller.inscrireEnseignant);

// GET /auth/verify-email?token=xxxx
router.get('/verify-email', controller.verifierEmail);

// POST /auth/login
router.post('/login', [
  emailRule,
  body('motDePasse').notEmpty().withMessage('Mot de passe requis.'),
], controller.login);

// POST /auth/refresh
router.post('/refresh', controller.refreshToken);

// POST /auth/logout
router.post('/logout', controller.logout);

// POST /auth/mot-de-passe-oublie
router.post('/mot-de-passe-oublie', [emailRule], controller.motDePasseOublie);

// POST /auth/reinitialiser-mot-de-passe
router.post('/reinitialiser-mot-de-passe', [
  body('token').notEmpty().withMessage('Token requis.'),
  body('nouveauMotDePasse').isLength({ min: 8 }).withMessage('Mot de passe trop court.'),
], controller.reinitialiserMotDePasse);

// POST /auth/renvoyer-verification
router.post('/renvoyer-verification', [emailRule], controller.renvoyerVerification);

// ─────────────────────────────────────────────────────────────────────────────
//  ROUTES PROTÉGÉES (JWT requis)
// ─────────────────────────────────────────────────────────────────────────────

// GET /auth/me
router.get('/me', auth.authentifier, controller.moi);

module.exports = router;
