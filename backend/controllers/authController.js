'use strict';

const { validationResult } = require('express-validator');
const AuthService          = require('../services/AuthService');
const { success, error }   = require('../utils/response');

// ─── Helper : validation express-validator ────────────────────────────────────
function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    error(res, 'Données invalides.', 422, errors.array());
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /auth/inscription/etudiant
// ─────────────────────────────────────────────────────────────────────────────
async function inscrireEtudiant(req, res) {
  if (!checkValidation(req, res)) return;

  try {
    const result = await AuthService.inscrireEtudiant(req.body);
    return success(res, result, 'Inscription réussie. Vérifiez votre email.', 201);
  } catch (err) {
    return error(res, err.message || 'Erreur lors de l\'inscription.', err.statusCode || 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /auth/inscription/enseignant
// ─────────────────────────────────────────────────────────────────────────────
async function inscrireEnseignant(req, res) {
  if (!checkValidation(req, res)) return;

  try {
    const result = await AuthService.inscrireEnseignant(req.body);
    return success(res, result, 'Inscription réussie. Vérifiez votre email.', 201);
  } catch (err) {
    return error(res, err.message || 'Erreur lors de l\'inscription.', err.statusCode || 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  GET /auth/verify-email?token=xxxx
//  → Retourne une page HTML (cliqué depuis email)
// ─────────────────────────────────────────────────────────────────────────────
async function verifierEmail(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send(pageHTML('❌ Token manquant', 'Lien de vérification invalide.', '#ea4335'));
  }

  try {
    const result = await AuthService.verifierEmail(token);
    return res.send(pageHTML(
      '✅ Email vérifié !',
      'Votre email a été confirmé avec succès.<br/><br/>Votre dossier est en cours dexamen par ladministrateur.<br/>Vous recevrez un email dès que votre compte sera activé.',
      '#34a853'
    ));
  } catch (err) {
    return res.status(err.statusCode || 400).send(pageHTML(
      '❌ Lien invalide',
      err.message || 'Ce lien est invalide ou a expiré.',
      '#ea4335'
    ));
  }
}

// ─── Helper : page HTML de résultat ──────────────────────────────────────────
function pageHTML(titre, message, couleur) {
  return `<!DOCTYPE html>
  <html><head><meta charset="UTF-8"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #f5f5f5;
           display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .card { background: #fff; border-radius: 12px; padding: 48px 40px; max-width: 480px;
            width: 90%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .icon { font-size: 56px; margin-bottom: 20px; }
    h1 { color: ${couleur}; font-size: 24px; margin-bottom: 16px; }
    p { color: #555; line-height: 1.7; font-size: 15px; }
    .badge { display: inline-block; margin-top: 24px; padding: 10px 24px;
             background: #f0f0f0; border-radius: 20px; color: #333;
             font-size: 13px; font-weight: bold; }
  </style>
  </head>
  <body>
    <div class="card">
      <div class="icon">${couleur === '#34a853' ? '🎓' : '⚠️'}</div>
      <h1>${titre}</h1>
      <p>${message}</p>
      <div class="badge">Plateforme Universitaire</div>
    </div>
  </body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /auth/login
// ─────────────────────────────────────────────────────────────────────────────
async function login(req, res) {
  if (!checkValidation(req, res)) return;

  const { email, motDePasse } = req.body;

  try {
    const result = await AuthService.login(email, motDePasse);

    // Le refresh token dans un cookie httpOnly (sécurisé)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge:   7 * 24 * 60 * 60 * 1000, // 7 jours
    });

    return success(res, {
      accessToken:  result.accessToken,
      utilisateur:  result.utilisateur,
    }, 'Connexion réussie.');
  } catch (err) {
    return error(res, err.message || 'Erreur de connexion.', err.statusCode || 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /auth/refresh
// ─────────────────────────────────────────────────────────────────────────────
async function refreshToken(req, res) {
  // Lire le refresh token depuis le cookie httpOnly
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) return error(res, 'Refresh token manquant.', 401);

  try {
    const result = await AuthService.refreshAccessToken(token);
    return success(res, result, 'Token renouvelé.');
  } catch (err) {
    return error(res, err.message || 'Erreur de renouvellement.', err.statusCode || 401);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /auth/logout
// ─────────────────────────────────────────────────────────────────────────────
async function logout(req, res) {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  try {
    await AuthService.logout(token);
    res.clearCookie('refreshToken');
    return success(res, {}, 'Déconnexion réussie.');
  } catch (err) {
    return error(res, 'Erreur lors de la déconnexion.', 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /auth/mot-de-passe-oublie
// ─────────────────────────────────────────────────────────────────────────────
async function motDePasseOublie(req, res) {
  if (!checkValidation(req, res)) return;

  try {
    const result = await AuthService.motDePasseOublie(req.body.email);
    return success(res, {}, result.message);
  } catch (err) {
    return error(res, err.message || 'Erreur.', err.statusCode || 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /auth/reinitialiser-mot-de-passe
// ─────────────────────────────────────────────────────────────────────────────
async function reinitialiserMotDePasse(req, res) {
  if (!checkValidation(req, res)) return;

  const { token, nouveauMotDePasse } = req.body;

  try {
    const result = await AuthService.reinitialiserMotDePasse(token, nouveauMotDePasse);
    res.clearCookie('refreshToken');
    return success(res, {}, result.message);
  } catch (err) {
    return error(res, err.message || 'Erreur.', err.statusCode || 400);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /auth/renvoyer-verification
// ─────────────────────────────────────────────────────────────────────────────
async function renvoyerVerification(req, res) {
  if (!checkValidation(req, res)) return;

  try {
    const result = await AuthService.renvoyerEmailVerification(req.body.email);
    return success(res, {}, result.message);
  } catch (err) {
    return error(res, err.message || 'Erreur.', err.statusCode || 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  GET /auth/me  (profil utilisateur connecté)
// ─────────────────────────────────────────────────────────────────────────────
async function moi(req, res) {
  return success(res, req.utilisateur, 'Profil récupéré.');
}

module.exports = {
  inscrireEtudiant,
  inscrireEnseignant,
  verifierEmail,
  login,
  refreshToken,
  logout,
  motDePasseOublie,
  reinitialiserMotDePasse,
  renvoyerVerification,
  moi,
};