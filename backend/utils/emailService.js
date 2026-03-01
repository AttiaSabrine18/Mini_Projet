'use strict';

const nodemailer = require('nodemailer');
require('dotenv').config();

// ─── Transport SMTP Gmail simple ──────────────────────────────────────────────
function getTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

// ─── Adresse expéditeur ───────────────────────────────────────────────────────
function getSenderAddress() {
  return `"Plateforme Universitaire" <${process.env.MAIL_USER}>`;
}

// ─── Template HTML de base ────────────────────────────────────────────────────
function baseTemplate(content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>Plateforme Universitaire</h1></div>
        <div class="body">${content}</div>
        <div class="footer">Cet email a ete envoye automatiquement. Ne pas repondre.</div>
      </div>
    </body>
    </html>
  `;
}

// ─── 1. Email de verification (apres inscription) ─────────────────────────────
async function sendVerificationEmail(destinataire, prenom, token) {
const lien = `${process.env.API_URL}/api/auth/verify-email?token=${token}`;

  const html = baseTemplate(`
    <p>Bonjour <strong>${prenom}</strong>,</p>
    <p>Merci pour votre inscription. Veuillez verifier votre adresse email :</p>
    <a href="${lien}" class="btn">Verifier mon email</a>
    <p>Ce lien est valable <strong>24 heures</strong>.</p>
    <p>Si vous n'avez pas cree de compte, ignorez cet email.</p>
  `);

  await getTransport().sendMail({
    from:    getSenderAddress(),
    to:      destinataire,
    subject: 'Verifiez votre adresse email',
    html,
  });
}

// ─── 2. Email de validation par admin ─────────────────────────────────────────
async function sendValidationEmail(destinataire, prenom) {
  const html = baseTemplate(`
    <p>Bonjour <strong>${prenom}</strong>,</p>
    <p>Votre compte a ete valide par l'administrateur.</p>
    <p>Vous pouvez maintenant acceder a votre espace :</p>
    <a href="${process.env.FRONTEND_URL}/login" class="btn" style="background:#34a853">
      Se connecter
    </a>
  `);

  await getTransport().sendMail({
    from:    getSenderAddress(),
    to:      destinataire,
    subject: 'Votre compte a ete valide',
    html,
  });
}

// ─── 3. Email de refus par admin ──────────────────────────────────────────────
async function sendRefusEmail(destinataire, prenom, raison) {
  const html = baseTemplate(`
    <p>Bonjour <strong>${prenom}</strong>,</p>
    <p>Votre demande d'inscription a ete refusee.</p>
    ${raison ? `<p><strong>Motif :</strong> ${raison}</p>` : ''}
    <p>Contactez l'administration pour plus d'informations.</p>
  `);

  await getTransport().sendMail({
    from:    getSenderAddress(),
    to:      destinataire,
    subject: "Demande d'inscription refusee",
    html,
  });
}

// ─── 4. Email de reinitialisation de mot de passe ─────────────────────────────
async function sendResetPasswordEmail(destinataire, prenom, token) {
  const lien = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const html = baseTemplate(`
    <p>Bonjour <strong>${prenom}</strong>,</p>
    <p>Vous avez demande la reinitialisation de votre mot de passe :</p>
    <a href="${lien}" class="btn" style="background:#f4511e">Reinitialiser mon mot de passe</a>
    <p>Ce lien est valable <strong>1 heure</strong>.</p>
  `);

  await getTransport().sendMail({
    from:    getSenderAddress(),
    to:      destinataire,
    subject: 'Reinitialisation de mot de passe',
    html,
  });
}

module.exports = {
  sendVerificationEmail,
  sendValidationEmail,
  sendRefusEmail,
  sendResetPasswordEmail,
};
