'use strict';

const crypto = require('crypto');
const jwt    = require('jsonwebtoken');
require('dotenv').config();

// ─── Token de vérification email (aléatoire 64 chars hex) ────────────────────
const genererTokenVerification = () => crypto.randomBytes(32).toString('hex');

// ─── Token de reset password ──────────────────────────────────────────────────
const genererTokenReset = () => crypto.randomBytes(32).toString('hex');

// ─── Générer un JWT d'accès (15 min) ─────────────────────────────────────────
const genererAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

// ─── Générer un JWT de refresh (7 jours) ─────────────────────────────────────
const genererRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

// ─── Vérifier un access token ────────────────────────────────────────────────
const verifierAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);

// ─── Vérifier un refresh token ───────────────────────────────────────────────
const verifierRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

// ─── Date d'expiration dans N heures ─────────────────────────────────────────
const expiresDans = (heures) => {
  const d = new Date();
  d.setHours(d.getHours() + heures);
  return d;
};

module.exports = {
  genererTokenVerification,
  genererTokenReset,
  genererAccessToken,
  genererRefreshToken,
  verifierAccessToken,
  verifierRefreshToken,
  expiresDans,
};
