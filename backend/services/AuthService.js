'use strict';

const bcrypt       = require('bcrypt');
const { v4: uuid } = require('uuid');
const { Op }       = require('sequelize');

const db           = require('../models');
const emailService = require('../utils/emailService');
const tokenUtils   = require('../utils/tokenUtils');

const SALT_ROUNDS = 12;

// ─────────────────────────────────────────────────────────────────────────────
//  INSCRIPTION ÉTUDIANT  (US1 + US2)
// ─────────────────────────────────────────────────────────────────────────────
async function inscrireEtudiant(data) {
  const {
    email, motDePasse, nom, prenom, dateNaissance, telephone, adresse,
    // Champs étudiant
    numeroEtudiant, numeroINE, anneeAcademique,
    niveau, semestreActuel, groupe, sousGroupe, filiereId,
  } = data;

  // 1. Vérifier unicité email
  const existant = await db.Utilisateur.findOne({ where: { email } });
  if (existant) throw { statusCode: 409, message: 'Cet email est déjà utilisé.' };

  // 2. Vérifier unicité numéro étudiant / INE
  const etuExist = await db.Etudiant.findOne({
    where: { [Op.or]: [{ numeroEtudiant }, { numeroINE }] },
  });
  if (etuExist) throw { statusCode: 409, message: 'Numéro étudiant ou INE déjà existant.' };

  // 3. Hasher le mot de passe
  const sel         = await bcrypt.genSalt(SALT_ROUNDS);
  const motDePasseH = await bcrypt.hash(motDePasse, sel);

  // 4. Token de vérification email
  const tokenVerif   = tokenUtils.genererTokenVerification();
  const tokenExpires = tokenUtils.expiresDans(24);  // 24h

  // 5. Transaction : créer Utilisateur + Etudiant
  const result = await db.sequelize.transaction(async (t) => {
    const utilisateur = await db.Utilisateur.create({
      email,
      motDePasse:        motDePasseH,
      sel,
      nom,
      prenom,
      dateNaissance,
      telephone,
      adresse,
      typeUtilisateur:   'ETUDIANT',
      statut:            'EN_ATTENTE',
      valideEmail:       false,
      tokenVerification: tokenVerif,
      tokenExpiration:   tokenExpires,
    }, { transaction: t });

    const etudiant = await db.Etudiant.create({
      utilisateurId:  utilisateur.id,
      numeroEtudiant,
      numeroINE,
      anneeAcademique,
      niveau,
      semestreActuel,
      groupe,
      sousGroupe,
      filiereId,
    }, { transaction: t });

    return { utilisateur, etudiant };
  });

  // 6. Envoyer email de vérification (non bloquant)
  emailService.sendVerificationEmail(email, prenom, tokenVerif)
    .catch(err => console.warn('⚠️  Email non envoyé (OAuth non configuré) :', err.message));

  return {
    id:    result.utilisateur.id,
    email: result.utilisateur.email,
    nom,
    prenom,
    statut: 'EN_ATTENTE',
    message: 'Inscription réussie. Vérifiez votre email.',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  INSCRIPTION ENSEIGNANT  (US5 + US6)
// ─────────────────────────────────────────────────────────────────────────────
async function inscrireEnseignant(data) {
  const {
    email, motDePasse, nom, prenom, dateNaissance, telephone, adresse,
    // Champs enseignant
    matricule, grade, specialite, dateRecrutement, bureau,
    telephoneInterne, heuresServiceAnnuel,
  } = data;

  // 1. Vérifier unicité email
  const existant = await db.Utilisateur.findOne({ where: { email } });
  if (existant) throw { statusCode: 409, message: 'Cet email est déjà utilisé.' };

  // 2. Vérifier unicité matricule
  const ensExist = await db.Enseignant.findOne({ where: { matricule } });
  if (ensExist) throw { statusCode: 409, message: 'Ce matricule est déjà utilisé.' };

  // 3. Hasher le mot de passe
  const sel         = await bcrypt.genSalt(SALT_ROUNDS);
  const motDePasseH = await bcrypt.hash(motDePasse, sel);

  // 4. Token de vérification email
  const tokenVerif   = tokenUtils.genererTokenVerification();
  const tokenExpires = tokenUtils.expiresDans(24);

  // 5. Transaction
  const result = await db.sequelize.transaction(async (t) => {
    const utilisateur = await db.Utilisateur.create({
      email,
      motDePasse:        motDePasseH,
      sel,
      nom,
      prenom,
      dateNaissance,
      telephone,
      adresse,
      typeUtilisateur:   'ENSEIGNANT',
      statut:            'EN_ATTENTE',
      valideEmail:       false,
      tokenVerification: tokenVerif,
      tokenExpiration:   tokenExpires,
    }, { transaction: t });

    const enseignant = await db.Enseignant.create({
      utilisateurId: utilisateur.id,
      matricule,
      grade,
      specialite,
      dateRecrutement,
      bureau,
      telephoneInterne,
      heuresServiceAnnuel,
    }, { transaction: t });

    return { utilisateur, enseignant };
  });

  // 6. Envoyer email de vérification (non bloquant)
  emailService.sendVerificationEmail(email, prenom, tokenVerif)
    .catch(err => console.warn('⚠️  Email non envoyé (OAuth non configuré) :', err.message));

  return {
    id:     result.utilisateur.id,
    email:  result.utilisateur.email,
    nom,
    prenom,
    statut: 'EN_ATTENTE',
    message: 'Inscription réussie. Vérifiez votre email.',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  VÉRIFICATION EMAIL  (US2 + US6)
// ─────────────────────────────────────────────────────────────────────────────
async function verifierEmail(token) {
  const utilisateur = await db.Utilisateur.findOne({
    where: { tokenVerification: token },
  });

  if (!utilisateur) throw { statusCode: 400, message: 'Token invalide.' };

  // Vérifier expiration
  if (utilisateur.tokenExpiration && new Date() > utilisateur.tokenExpiration) {
    throw { statusCode: 400, message: 'Token expiré. Veuillez vous réinscrire.' };
  }

  // Mettre à jour : email vérifié, statut → EN_ATTENTE (en attente validation admin)
  await utilisateur.update({
    valideEmail:       true,
    tokenVerification: null,
    tokenExpiration:   null,
  });

  return {
    message: 'Email vérifié avec succès. En attente de validation par l\'administrateur.',
    statut:  utilisateur.statut,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  LOGIN  (US3)
// ─────────────────────────────────────────────────────────────────────────────
async function login(email, motDePasse) {
  // 1. Trouver l'utilisateur
  const utilisateur = await db.Utilisateur.findOne({ where: { email } });
  if (!utilisateur) throw { statusCode: 401, message: 'Email ou mot de passe incorrect.' };

  // 2. Vérifier mot de passe
  const valide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
  if (!valide) throw { statusCode: 401, message: 'Email ou mot de passe incorrect.' };

  // 3. Vérifier statut email
  if (!utilisateur.valideEmail) {
    throw { statusCode: 403, message: 'Veuillez vérifier votre email avant de vous connecter.' };
  }

  // 4. Vérifier statut compte
  if (utilisateur.statut === 'EN_ATTENTE') {
    throw { statusCode: 403, message: 'Votre compte est en attente de validation par l\'administrateur.' };
  }
  if (utilisateur.statut === 'SUSPENDU' || utilisateur.statut === 'BLOQUE' || utilisateur.statut === 'INACTIF') {
    throw { statusCode: 403, message: `Votre compte est ${utilisateur.statut.toLowerCase()}. Contactez l'administration.` };
  }

  // 5. Préparer le payload JWT
  const payload = {
    id:              utilisateur.id,
    email:           utilisateur.email,
    typeUtilisateur: utilisateur.typeUtilisateur,
    nom:             utilisateur.nom,
    prenom:          utilisateur.prenom,
  };

  // 6. Générer access token + refresh token
  const accessToken  = tokenUtils.genererAccessToken(payload);
  const refreshToken = tokenUtils.genererRefreshToken({ id: utilisateur.id });

  // 7. Sauvegarder le refresh token dans OAuthToken
  await db.OAuthToken.create({
    id:                   uuid(),
    accessToken,
    accessTokenExpiresAt:  tokenUtils.expiresDans(0.25), // 15 min
    refreshToken,
    refreshTokenExpiresAt: tokenUtils.expiresDans(168),  // 7 jours
    scope:                 'profile',
    clientId:              'app-client',
    utilisateurId:         utilisateur.id,
  });

  // 8. Mise à jour date dernière connexion
  await utilisateur.update({ dateDerniereConnexion: new Date() });

  return {
    accessToken,
    refreshToken,
    utilisateur: {
      id:              utilisateur.id,
      email:           utilisateur.email,
      nom:             utilisateur.nom,
      prenom:          utilisateur.prenom,
      typeUtilisateur: utilisateur.typeUtilisateur,
      statut:          utilisateur.statut,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  REFRESH TOKEN
// ─────────────────────────────────────────────────────────────────────────────
async function refreshAccessToken(refreshToken) {
  // 1. Vérifier la signature du refresh token
  let decoded;
  try {
    decoded = tokenUtils.verifierRefreshToken(refreshToken);
  } catch {
    throw { statusCode: 401, message: 'Refresh token invalide ou expiré.' };
  }

  // 2. Vérifier en BDD que ce refresh token existe et n'est pas expiré
  const tokenEnBDD = await db.OAuthToken.findOne({
    where: {
      refreshToken,
      utilisateurId: decoded.id,
      refreshTokenExpiresAt: { [Op.gt]: new Date() },
    },
  });
  if (!tokenEnBDD) throw { statusCode: 401, message: 'Session expirée. Veuillez vous reconnecter.' };

  // 3. Récupérer l'utilisateur
  const utilisateur = await db.Utilisateur.findByPk(decoded.id);
  if (!utilisateur || utilisateur.statut !== 'ACTIF') {
    throw { statusCode: 403, message: 'Compte inaccessible.' };
  }

  // 4. Générer un nouveau access token
  const payload = {
    id:              utilisateur.id,
    email:           utilisateur.email,
    typeUtilisateur: utilisateur.typeUtilisateur,
    nom:             utilisateur.nom,
    prenom:          utilisateur.prenom,
  };
  const newAccessToken = tokenUtils.genererAccessToken(payload);

  // 5. Mettre à jour en BDD
  await tokenEnBDD.update({
    accessToken:          newAccessToken,
    accessTokenExpiresAt: tokenUtils.expiresDans(0.25),
  });

  return { accessToken: newAccessToken };
}

// ─────────────────────────────────────────────────────────────────────────────
//  LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
async function logout(refreshToken) {
  if (!refreshToken) return;
  await db.OAuthToken.destroy({ where: { refreshToken } });
}

// ─────────────────────────────────────────────────────────────────────────────
//  MOT DE PASSE OUBLIÉ
// ─────────────────────────────────────────────────────────────────────────────
async function motDePasseOublie(email) {
  const utilisateur = await db.Utilisateur.findOne({ where: { email } });

  // On ne révèle pas si l'email existe (sécurité)
  if (!utilisateur) return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' };

  const token   = tokenUtils.genererTokenReset();
  const expires = tokenUtils.expiresDans(1); // 1 heure

  await utilisateur.update({
    tokenReset:          token,
    tokenResetExpiration: expires,
  });

  await emailService.sendResetPasswordEmail(email, utilisateur.prenom, token);

  return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' };
}

// ─────────────────────────────────────────────────────────────────────────────
//  RÉINITIALISER MOT DE PASSE
// ─────────────────────────────────────────────────────────────────────────────
async function reinitialiserMotDePasse(token, nouveauMotDePasse) {
  const utilisateur = await db.Utilisateur.findOne({
    where: {
      tokenReset:          token,
      tokenResetExpiration: { [Op.gt]: new Date() },
    },
  });

  if (!utilisateur) throw { statusCode: 400, message: 'Token invalide ou expiré.' };

  const sel         = await bcrypt.genSalt(SALT_ROUNDS);
  const motDePasseH = await bcrypt.hash(nouveauMotDePasse, sel);

  await utilisateur.update({
    motDePasse:          motDePasseH,
    sel,
    tokenReset:          null,
    tokenResetExpiration: null,
  });

  // Révoquer tous les tokens actifs
  await db.OAuthToken.destroy({ where: { utilisateurId: utilisateur.id } });

  return { message: 'Mot de passe réinitialisé avec succès. Veuillez vous reconnecter.' };
}

// ─────────────────────────────────────────────────────────────────────────────
//  RENVOYER EMAIL DE VÉRIFICATION
// ─────────────────────────────────────────────────────────────────────────────
async function renvoyerEmailVerification(email) {
  const utilisateur = await db.Utilisateur.findOne({ where: { email } });

  if (!utilisateur) throw { statusCode: 404, message: 'Email introuvable.' };
  if (utilisateur.valideEmail) throw { statusCode: 400, message: 'Email déjà vérifié.' };

  const token   = tokenUtils.genererTokenVerification();
  const expires = tokenUtils.expiresDans(24);

  await utilisateur.update({
    tokenVerification: token,
    tokenExpiration:   expires,
  });

  await emailService.sendVerificationEmail(email, utilisateur.prenom, token);

  return { message: 'Email de vérification renvoyé.' };
}

module.exports = {
  inscrireEtudiant,
  inscrireEnseignant,
  verifierEmail,
  login,
  refreshAccessToken,
  logout,
  motDePasseOublie,
  reinitialiserMotDePasse,
  renvoyerEmailVerification,
};
