'use strict';

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// ─── Sécurité ─────────────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5000',
  credentials: true,   // Important pour les cookies (refresh token)
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Route de santé ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '🚀 API Plateforme Universitaire opérationnelle',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',  require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// (Ajouter les autres routes ici au fur et à mesure)
// app.use('/api/etudiants',   require('./routes/etudiant.routes'));
// app.use('/api/enseignants', require('./routes/enseignant.routes'));
// app.use('/api/admin',       require('./routes/admin.routes'));
// app.use('/api/emplois',     require('./routes/emploi.routes'));

// ─── Gestion des routes inconnues ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} introuvable.` });
});

// ─── Gestion globale des erreurs ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Erreur non gérée :', err);
  res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
});

module.exports = app;