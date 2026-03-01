'use strict';

const nodemailer = require('nodemailer');
require('dotenv').config();

// ─── Transport SMTP Gmail ─────────────────────────────────────────────────────
function getTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

function getSenderAddress() {
  return `"Plateforme Universitaire" <${process.env.MAIL_USER}>`;
}

// ─── Template HTML de base ────────────────────────────────────────────────────
function baseTemplate(content) {
  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <style>
      body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px;
                   overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
      .header { background: #1a73e8; padding: 28px 32px; color: #fff; }
      .header h1 { margin: 0; font-size: 22px; }
      .body { padding: 32px; color: #333; line-height: 1.6; }
      .btn { display: inline-block; margin: 20px 0; padding: 14px 28px;
             background: #1a73e8; color: #fff !important; text-decoration: none;
             border-radius: 6px; font-weight: bold; }
      .footer { padding: 16px 32px; background: #f5f5f5; font-size: 12px; color: #999; }
      .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      .info-table td { padding: 10px 12px; border-bottom: 1px solid #eee; }
      .info-table td:first-child { font-weight: bold; color: #555; width: 40%; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 20px;
               background: #fff3cd; color: #856404; font-weight: bold; font-size: 13px; }
    </style>
    </head><body>
      <div class="container">
        <div class="header"><h1>🎓 Plateforme Universitaire</h1></div>
        <div class="body">${content}</div>
        <div class="footer">Email automatique — Ne pas repondre directement.</div>
      </div>
    </body></html>
  `;
}

// ─── 1. Email de verification (apres inscription) ─────────────────────────────
async function sendVerificationEmail(destinataire, prenom, token) {
  // Pointe directement vers le backend API (pas besoin de frontend)
  const lien = `${process.env.API_URL}/api/auth/verify-email?token=${token}`;

  const html = baseTemplate(`
    <p>Bonjour <strong>${prenom}</strong>,</p>
    <p>Merci pour votre inscription sur la Plateforme Universitaire.</p>
    <p>Cliquez sur le bouton ci-dessous pour verifier votre adresse email :</p>
    <a href="${lien}" class="btn">✅ Verifier mon email</a>
    <p style="color:#999;font-size:13px">Ce lien est valable <strong>24 heures</strong>.<br/>
    Si vous n'avez pas cree de compte, ignorez cet email.</p>
  `);

  await getTransport().sendMail({
    from:    getSenderAddress(),
    to:      destinataire,
    subject: '✅ Verifiez votre adresse email — Plateforme Universitaire',
    html,
  });
}

// ─── 2. Notification admin : nouvel utilisateur en attente ────────────────────
async function sendNotificationAdmin(utilisateur, profil) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return; // si pas configure, on skip

  const lienAdmin = `${process.env.FRONTEND_URL}/admin/demandes`;

  // Infos selon le type
  const estEtudiant = utilisateur.typeUtilisateur === 'ETUDIANT';

  const lignesSpecifiques = estEtudiant ? `
    <tr><td>Numero etudiant</td><td>${profil.numeroEtudiant}</td></tr>
    <tr><td>Numero INE</td><td>${profil.numeroINE}</td></tr>
    <tr><td>Niveau</td><td>${profil.niveau}</td></tr>
    <tr><td>Semestre</td><td>${profil.semestreActuel}</td></tr>
    <tr><td>Annee academique</td><td>${profil.anneeAcademique}</td></tr>
    <tr><td>Groupe</td><td>${profil.groupe || '—'}</td></tr>
  ` : `
    <tr><td>Matricule</td><td>${profil.matricule}</td></tr>
    <tr><td>Grade</td><td>${profil.grade}</td></tr>
    <tr><td>Specialite</td><td>${profil.specialite}</td></tr>
    <tr><td>Bureau</td><td>${profil.bureau || '—'}</td></tr>
  `;

  const html = baseTemplate(`
    <p>Bonjour Administrateur,</p>
    <p>Un nouveau <strong>${estEtudiant ? 'etudiant' : 'enseignant'}</strong> vient de verifier son email
    et attend votre validation :</p>

    <table class="info-table">
      <tr><td>Nom complet</td><td><strong>${utilisateur.prenom} ${utilisateur.nom}</strong></td></tr>
      <tr><td>Email</td><td>${utilisateur.email}</td></tr>
      <tr><td>Telephone</td><td>${utilisateur.telephone || '—'}</td></tr>
      <tr><td>Type</td><td><span class="badge">${utilisateur.typeUtilisateur}</span></td></tr>
      <tr><td>Statut</td><td><span class="badge">EN ATTENTE</span></td></tr>
      ${lignesSpecifiques}
      <tr><td>Date inscription</td><td>${new Date(utilisateur.dateCreation).toLocaleString('fr-FR')}</td></tr>
    </table>

    <p>Veuillez vous connecter au panneau d'administration pour valider ou refuser cette demande :</p>
    <a href="${lienAdmin}" class="btn" style="background:#f4b400;color:#000 !important">
      📋 Voir les demandes en attente
    </a>
  `);

  await getTransport().sendMail({
    from:    getSenderAddress(),
    to:      adminEmail,
    subject: `🔔 Nouvelle demande ${estEtudiant ? 'etudiant' : 'enseignant'} — ${utilisateur.prenom} ${utilisateur.nom}`,
    html,
  });
}

// ─── 3. Email de validation par admin ─────────────────────────────────────────
async function sendValidationEmail(destinataire, prenom) {
  const html = baseTemplate(`
    <p>Bonjour <strong>${prenom}</strong>,</p>
    <p>🎉 Bonne nouvelle ! Votre compte a ete <strong style="color:#34a853">valide par l'administrateur</strong>.</p>
    <p>Vous pouvez maintenant acceder a votre espace personnel :</p>
    <a href="${process.env.FRONTEND_URL}/login" class="btn" style="background:#34a853">
      Se connecter
    </a>
  `);

  await getTransport().sendMail({
    from:    getSenderAddress(),
    to:      destinataire,
    subject: '🎉 Votre compte a ete valide — Plateforme Universitaire',
    html,
  });
}

// ─── 4. Email de refus par admin ──────────────────────────────────────────────
async function sendRefusEmail(destinataire, prenom, raison) {
  const html = baseTemplate(`
    <p>Bonjour <strong>${prenom}</strong>,</p>
    <p>Nous vous informons que votre demande d'inscription a ete <strong style="color:#ea4335">refusee</strong>.</p>
    ${raison ? `<p><strong>Motif :</strong> ${raison}</p>` : ''}
    <p>Pour toute question, veuillez contacter l'administration.</p>
  `);

  await getTransport().sendMail({
    from:    getSenderAddress(),
    to:      destinataire,
    subject: "❌ Demande d'inscription refusee — Plateforme Universitaire",
    html,
  });
}

// ─── 5. Email de reinitialisation de mot de passe ─────────────────────────────
async function sendResetPasswordEmail(destinataire, prenom, token) {
  const lien = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const html = baseTemplate(`
    <p>Bonjour <strong>${prenom}</strong>,</p>
    <p>Vous avez demande la reinitialisation de votre mot de passe :</p>
    <a href="${lien}" class="btn" style="background:#f4511e">🔒 Reinitialiser mon mot de passe</a>
    <p style="color:#999;font-size:13px">Ce lien est valable <strong>1 heure</strong>.<br/>
    Si vous n'avez pas fait cette demande, ignorez cet email.</p>
  `);

  await getTransport().sendMail({
    from:    getSenderAddress(),
    to:      destinataire,
    subject: '🔒 Reinitialisation de mot de passe — Plateforme Universitaire',
    html,
  });
}

module.exports = {
  sendVerificationEmail,
  sendNotificationAdmin,
  sendValidationEmail,
  sendRefusEmail,
  sendResetPasswordEmail,
};