'use strict';

const db           = require('../models');
const emailService = require('../utils/emailService');

// ─────────────────────────────────────────────────────────────────────────────
//  US8 — Lister toutes les demandes EN_ATTENTE
// ─────────────────────────────────────────────────────────────────────────────
async function getDemandesEnAttente(type = null) {
  const where = { statut: 'EN_ATTENTE', valideEmail: true };
  if (type) where.typeUtilisateur = type.toUpperCase();

  const utilisateurs = await db.Utilisateur.findAll({
    where,
    attributes: ['id','nom','prenom','email','telephone','typeUtilisateur','statut','dateCreation'],
    include: [
      {
        model:    db.Etudiant,
        as:       'etudiant',
        required: false,
        include:  [{ model: db.Filiere, as: 'filiere', attributes: ['nom','code'] }],
      },
      {
        model:    db.Enseignant,
        as:       'enseignant',
        required: false,
      },
    ],
    order: [['dateCreation', 'ASC']],
  });

  return utilisateurs.map(u => {
    const base = {
      id:              u.id,
      nom:             u.nom,
      prenom:          u.prenom,
      email:           u.email,
      telephone:       u.telephone,
      type:            u.typeUtilisateur,
      statut:          u.statut,
      dateInscription: u.dateCreation,
    };

    if (u.etudiant) {
      base.profil = {
        numeroEtudiant:  u.etudiant.numeroEtudiant,
        numeroINE:       u.etudiant.numeroINE,
        niveau:          u.etudiant.niveau,
        semestreActuel:  u.etudiant.semestreActuel,
        anneeAcademique: u.etudiant.anneeAcademique,
        groupe:          u.etudiant.groupe,
        filiere:         u.etudiant.filiere?.nom || null,
      };
    }

    if (u.enseignant) {
      base.profil = {
        matricule:   u.enseignant.matricule,
        grade:       u.enseignant.grade,
        specialite:  u.enseignant.specialite,
        bureau:      u.enseignant.bureau,
      };
    }

    return base;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  US9/US10 — Valider une demande (étudiant ou enseignant)
// ─────────────────────────────────────────────────────────────────────────────
async function validerDemande(utilisateurId, adminId) {
  const utilisateur = await db.Utilisateur.findByPk(utilisateurId);
  if (!utilisateur) throw { statusCode: 404, message: 'Utilisateur introuvable.' };

  if (utilisateur.statut !== 'EN_ATTENTE') {
    throw { statusCode: 400, message: `Ce compte est déjà ${utilisateur.statut}.` };
  }

  // Activer le compte
  await utilisateur.update({ statut: 'ACTIF' });

  // Envoyer email de confirmation à l'utilisateur
  emailService.sendValidationEmail(utilisateur.email, utilisateur.prenom)
    .catch(err => console.warn('⚠️  Email validation échoué :', err.message));

  console.log(`✅ Compte validé — ${utilisateur.email} par admin #${adminId}`);

  return {
    id:     utilisateur.id,
    email:  utilisateur.email,
    nom:    utilisateur.nom,
    prenom: utilisateur.prenom,
    type:   utilisateur.typeUtilisateur,
    statut: 'ACTIF',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  US9/US10 — Refuser une demande
// ─────────────────────────────────────────────────────────────────────────────
async function refuserDemande(utilisateurId, adminId, raison = null) {
  const utilisateur = await db.Utilisateur.findByPk(utilisateurId);
  if (!utilisateur) throw { statusCode: 404, message: 'Utilisateur introuvable.' };

  if (utilisateur.statut !== 'EN_ATTENTE') {
    throw { statusCode: 400, message: `Ce compte est déjà ${utilisateur.statut}.` };
  }

  // Marquer comme inactif
  await utilisateur.update({ statut: 'INACTIF' });

  // Envoyer email de refus
  emailService.sendRefusEmail(utilisateur.email, utilisateur.prenom, raison)
    .catch(err => console.warn('⚠️  Email refus échoué :', err.message));

  console.log(`❌ Compte refusé — ${utilisateur.email} par admin #${adminId} | Raison: ${raison}`);

  return {
    id:     utilisateur.id,
    email:  utilisateur.email,
    statut: 'INACTIF',
    raison,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  US11 — Lister tous les comptes (avec filtres)
// ─────────────────────────────────────────────────────────────────────────────
async function getTousLesComptes({ statut, type, page = 1, limit = 20 } = {}) {
  const where = {};
  if (statut) where.statut          = statut.toUpperCase();
  if (type)   where.typeUtilisateur = type.toUpperCase();

  const offset = (page - 1) * limit;

  const { count, rows } = await db.Utilisateur.findAndCountAll({
    where,
    attributes: ['id','nom','prenom','email','typeUtilisateur','statut','dateCreation','dateDerniereConnexion','valideEmail'],
    include: [
      { model: db.Etudiant,     as: 'etudiant',     required: false, attributes: ['numeroEtudiant','niveau'] },
      { model: db.Enseignant,   as: 'enseignant',   required: false, attributes: ['matricule','grade'] },
      { model: db.Administrateur, as: 'administrateur', required: false, attributes: ['matricule','role'] },
    ],
    order:  [['dateCreation', 'DESC']],
    limit,
    offset,
  });

  return {
    total:      count,
    page,
    totalPages: Math.ceil(count / limit),
    comptes:    rows,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  US11 — Suspendre / Bloquer / Réactiver un compte
// ─────────────────────────────────────────────────────────────────────────────
async function changerStatutCompte(utilisateurId, nouveauStatut, adminId) {
  const statutsValides = ['ACTIF', 'SUSPENDU', 'BLOQUE', 'INACTIF'];
  if (!statutsValides.includes(nouveauStatut)) {
    throw { statusCode: 400, message: `Statut invalide. Valeurs : ${statutsValides.join(', ')}` };
  }

  const utilisateur = await db.Utilisateur.findByPk(utilisateurId);
  if (!utilisateur) throw { statusCode: 404, message: 'Utilisateur introuvable.' };

  await utilisateur.update({ statut: nouveauStatut });

  console.log(`🔄 Statut modifié — ${utilisateur.email} → ${nouveauStatut} par admin #${adminId}`);

  return {
    id:     utilisateur.id,
    email:  utilisateur.email,
    statut: nouveauStatut,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  US24 — Statistiques dashboard admin
// ─────────────────────────────────────────────────────────────────────────────
async function getStatistiques() {
  const [
    totalEtudiants,
    totalEnseignants,
    totalAdmins,
    enAttente,
    actifs,
    suspendus,
  ] = await Promise.all([
    db.Utilisateur.count({ where: { typeUtilisateur: 'ETUDIANT' } }),
    db.Utilisateur.count({ where: { typeUtilisateur: 'ENSEIGNANT' } }),
    db.Utilisateur.count({ where: { typeUtilisateur: 'ADMINISTRATEUR' } }),
    db.Utilisateur.count({ where: { statut: 'EN_ATTENTE', valideEmail: true } }),
    db.Utilisateur.count({ where: { statut: 'ACTIF' } }),
    db.Utilisateur.count({ where: { statut: 'SUSPENDU' } }),
  ]);

  return {
    utilisateurs: {
      total:       totalEtudiants + totalEnseignants + totalAdmins,
      etudiants:   totalEtudiants,
      enseignants: totalEnseignants,
      admins:      totalAdmins,
    },
    statuts: {
      enAttente,
      actifs,
      suspendus,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Créer un compte admin (depuis seed ou super-admin)
// ─────────────────────────────────────────────────────────────────────────────
async function creerAdmin(data) {
  const bcrypt = require('bcrypt');
  const { email, motDePasse, nom, prenom, matricule, service, role } = data;

  const existant = await db.Utilisateur.findOne({ where: { email } });
  if (existant) throw { statusCode: 409, message: 'Email déjà utilisé.' };

  const sel         = await bcrypt.genSalt(12);
  const motDePasseH = await bcrypt.hash(motDePasse, sel);

  const result = await db.sequelize.transaction(async (t) => {
    const utilisateur = await db.Utilisateur.create({
      email, motDePasse: motDePasseH, sel,
      nom, prenom,
      typeUtilisateur: 'ADMINISTRATEUR',
      statut:          'ACTIF',
      valideEmail:     true,
    }, { transaction: t });

    const admin = await db.Administrateur.create({
      utilisateurId: utilisateur.id,
      matricule,
      service:       service || 'Direction',
      role:          role    || 'ADMIN',
      niveauAcces:   2,
    }, { transaction: t });

    return { utilisateur, admin };
  });

  return {
    id:     result.utilisateur.id,
    email:  result.utilisateur.email,
    role:   result.admin.role,
    statut: 'ACTIF',
  };
}

module.exports = {
  getDemandesEnAttente,
  validerDemande,
  refuserDemande,
  getTousLesComptes,
  changerStatutCompte,
  getStatistiques,
  creerAdmin,
};