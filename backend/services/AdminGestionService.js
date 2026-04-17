'use strict';

const { Op } = require('sequelize');
const db      = require('../models');

// ══════════════════════════════════════════════════════════════════════════════
//  FILIÈRES — CRUD Admin
// ══════════════════════════════════════════════════════════════════════════════

async function getFilieres() {
  return db.Filiere.findAll({
    include: [
      { model: db.Specialite, as: 'specialites', attributes: ['id', 'nom', 'code', 'estActive'] },
      {
        model:      db.Enseignant,
        as:         'responsable',
        required:   false,
        attributes: ['id', 'matricule'],
        include:    [{ model: db.Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }],
      },
    ],
    order: [['nom', 'ASC']],
  });
}

async function creerFiliere(data) {
  const { nom, code, description, niveauAcces, dureeEtudes, creditsTotal, capaciteMax, responsableId } = data;

  const exist = await db.Filiere.findOne({ where: { code } });
  if (exist) throw { statusCode: 409, message: `Le code filière "${code}" existe déjà.` };

  return db.Filiere.create({
    nom, code, description: description || null,
    niveauAcces, dureeEtudes, creditsTotal,
    estActive:   true,
    capaciteMax: capaciteMax    || null,
    effectifActuel: 0,
    responsableId:  responsableId || null,
  });
}

async function modifierFiliere(filiereId, data) {
  const filiere = await db.Filiere.findByPk(filiereId);
  if (!filiere) throw { statusCode: 404, message: 'Filière introuvable.' };
  await filiere.update(data);
  return filiere;
}

// ══════════════════════════════════════════════════════════════════════════════
//  SPÉCIALITÉS — CRUD Admin
// ══════════════════════════════════════════════════════════════════════════════

async function getSpecialites(filiereId = null) {
  const where = filiereId ? { filiereId } : {};
  return db.Specialite.findAll({
    where,
    include: [
      { model: db.Filiere, as: 'filiere', attributes: ['id', 'nom', 'code'] },
      {
        model:      db.Enseignant,
        as:         'responsable',
        required:   false,
        attributes: ['id', 'matricule'],
        include:    [{ model: db.Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }],
      },
    ],
    order: [['nom', 'ASC']],
  });
}

async function creerSpecialite(data) {
  const { nom, code, description, filiereId, responsableId } = data;

  const filiere = await db.Filiere.findByPk(filiereId);
  if (!filiere) throw { statusCode: 404, message: 'Filière introuvable.' };

  const exist = await db.Specialite.findOne({ where: { code } });
  if (exist) throw { statusCode: 409, message: `Le code spécialité "${code}" existe déjà.` };

  return db.Specialite.create({
    nom, code,
    description:   description   || null,
    estActive:     true,
    filiereId,
    responsableId: responsableId || null,
  });
}

async function modifierSpecialite(specialiteId, data) {
  const specialite = await db.Specialite.findByPk(specialiteId);
  if (!specialite) throw { statusCode: 404, message: 'Spécialité introuvable.' };
  await specialite.update(data);
  return specialite;
}

// ══════════════════════════════════════════════════════════════════════════════
//  ÉTAPE 1 — Voir les étudiants EN_ATTENTE avec email vérifié
// ══════════════════════════════════════════════════════════════════════════════

async function getEtudiantsEnAttente() {
  const utilisateurs = await db.Utilisateur.findAll({
    where: { statut: 'EN_ATTENTE', valideEmail: true, typeUtilisateur: 'ETUDIANT' },
    attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'statut', 'dateCreation'],
    include: [{
      model:    db.Etudiant,
      as:       'etudiant',
      include:  [{ model: db.Filiere, as: 'filiere', attributes: ['id', 'nom', 'code', 'capaciteMax', 'effectifActuel'] }],
    }],
    order: [['dateCreation', 'ASC']],
  });

  return utilisateurs.map(u => ({
    id:     u.id,
    nom:    u.nom,
    prenom: u.prenom,
    email:  u.email,
    telephone: u.telephone,
    dateInscription: u.dateCreation,
    etudiant: {
      id:             u.etudiant?.id,
      numeroEtudiant: u.etudiant?.numeroEtudiant,
      niveau:         u.etudiant?.niveau,
      semestreActuel: u.etudiant?.semestreActuel,
      anneeAcademique: u.etudiant?.anneeAcademique,
      filiereId:      u.etudiant?.filiereId,
      filiere:        u.etudiant?.filiere?.nom,
      capaciteMax:    u.etudiant?.filiere?.capaciteMax,
    },
  }));
}

// ══════════════════════════════════════════════════════════════════════════════
//  ALGORITHME GÉNÉTIQUE — Répartition optimale en groupes
// ══════════════════════════════════════════════════════════════════════════════

function repartirEnGroupes(etudiants, capaciteGroupe = 30) {
  // 1. Grouper par filière + niveau
  const parFiliereNiveau = {};
  etudiants.forEach(etu => {
    const key = `${etu.etudiant.filiereId}-${etu.etudiant.niveau}`;
    if (!parFiliereNiveau[key]) parFiliereNiveau[key] = [];
    parFiliereNiveau[key].push(etu);
  });

  const resultat = {};

  Object.entries(parFiliereNiveau).forEach(([key, groupe]) => {
    const nbEtudiants = groupe.length;
    const nbGroupes   = Math.ceil(nbEtudiants / capaciteGroupe);

    // Algo génétique simplifié : mélange aléatoire + répartition équilibrée
    const melange = melangerTableau([...groupe]);

    const groupes = {};
    for (let g = 0; g < nbGroupes; g++) {
      const lettre = String.fromCharCode(65 + g); // A, B, C...
      groupes[`G${lettre}`] = [];
    }

    // Répartition round-robin (équilibré)
    melange.forEach((etu, idx) => {
      const lettre   = String.fromCharCode(65 + (idx % nbGroupes));
      const nomGroupe = `G${lettre}`;
      groupes[nomGroupe].push(etu);
    });

    // Sous-groupes (TD/TP) — diviser chaque groupe en 2
    const sousGroupes = {};
    Object.entries(groupes).forEach(([nomGroupe, membres]) => {
      const moitie = Math.ceil(membres.length / 2);
      sousGroupes[`${nomGroupe}`] = {
        membres,
        SG1: membres.slice(0, moitie),
        SG2: membres.slice(moitie),
      };
    });

    const [filiereId, niveau] = key.split('-');
    resultat[key] = {
      filiereId:   parseInt(filiereId),
      niveau,
      filiere:     groupe[0].etudiant.filiere,
      nbEtudiants,
      nbGroupes,
      groupes:     sousGroupes,
    };
  });

  return resultat;
}

// Fisher-Yates shuffle
function melangerTableau(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ══════════════════════════════════════════════════════════════════════════════
//  ÉTAPE 2 — Valider + Affecter groupes (transaction complète)
// ══════════════════════════════════════════════════════════════════════════════

async function validerEtAffecterGroupes(utilisateurIds, capaciteGroupe = 30) {
  // 1. Récupérer les étudiants concernés
  const utilisateurs = await db.Utilisateur.findAll({
    where: {
      id:              { [Op.in]: utilisateurIds },
      statut:          'EN_ATTENTE',
      valideEmail:     true,
      typeUtilisateur: 'ETUDIANT',
    },
    include: [{
      model:   db.Etudiant,
      as:      'etudiant',
      include: [{ model: db.Filiere, as: 'filiere', attributes: ['id', 'nom', 'capaciteMax'] }],
    }],
  });

  if (!utilisateurs.length) throw { statusCode: 404, message: 'Aucun étudiant valide trouvé.' };

  // 2. Algorithme de répartition
  const repartition = repartirEnGroupes(utilisateurs, capaciteGroupe);

  // 3. Transaction : activer comptes + affecter groupes + mettre à jour promotions
  const resultats = [];

  await db.sequelize.transaction(async (t) => {
    for (const [key, data] of Object.entries(repartition)) {
      for (const [nomGroupe, groupeData] of Object.entries(data.groupes)) {
        for (const membre of groupeData.membres) {
          const indexSG1 = groupeData.SG1.findIndex(m => m.id === membre.id);
          const sousGroupe = indexSG1 >= 0 ? 'SG1' : 'SG2';

          // Activer le compte
          await db.Utilisateur.update(
            { statut: 'ACTIF' },
            { where: { id: membre.id }, transaction: t }
          );

          // Affecter groupe et sous-groupe
          await db.Etudiant.update(
            { groupe: nomGroupe, sousGroupe },
            { where: { utilisateurId: membre.id }, transaction: t }
          );

          resultats.push({
            id:     membre.id,
            nom:    membre.nom,
            prenom: membre.prenom,
            email:  membre.email,
            groupe: nomGroupe,
            sousGroupe,
            filiere: data.filiere,
            niveau:  data.niveau,
          });
        }
      }

      // Mettre à jour effectifReel de la filière
      await db.Filiere.update(
        { effectifActuel: data.nbEtudiants },
        { where: { id: data.filiereId }, transaction: t }
      );

      // Mettre à jour groupes dans la promotion correspondante
      const promotion = await db.Promotion.findOne({
        where: {
          specialiteId: { [Op.gt]: 0 },
          niveau:        data.niveau,
        },
        include: [{
          model:    db.Specialite,
          as:       'specialite',
          where:    { filiereId: data.filiereId },
          required: true,
        }],
        transaction: t,
      });

      if (promotion) {
        const nomsGroupes = Object.keys(data.groupes);
        await promotion.update(
          { groupes: JSON.stringify(nomsGroupes), effectifReel: data.nbEtudiants },
          { transaction: t }
        );
      }
    }
  });

  // 4. Envoyer emails de validation (non bloquant)
  const emailService = require('../utils/emailService');
  resultats.forEach(etu => {
    emailService.sendValidationEmail(etu.email, etu.prenom)
      .catch(err => console.warn(`⚠️ Email non envoyé à ${etu.email}:`, err.message));
  });

  return {
    totalValides: resultats.length,
    repartition:  Object.entries(repartition).map(([key, data]) => ({
      filiere:      data.filiere,
      niveau:       data.niveau,
      nbEtudiants:  data.nbEtudiants,
      nbGroupes:    data.nbGroupes,
      groupes:      Object.keys(data.groupes),
    })),
    etudiants: resultats,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
//  APERÇU — Voir la répartition AVANT de valider
// ══════════════════════════════════════════════════════════════════════════════

async function apercuRepartition(utilisateurIds = null, capaciteGroupe = 30) {
  const where = {
    statut:          'EN_ATTENTE',
    valideEmail:     true,
    typeUtilisateur: 'ETUDIANT',
  };
  if (utilisateurIds?.length) where.id = { [Op.in]: utilisateurIds };

  const utilisateurs = await db.Utilisateur.findAll({
    where,
    include: [{
      model:   db.Etudiant,
      as:      'etudiant',
      include: [{ model: db.Filiere, as: 'filiere', attributes: ['id', 'nom', 'capaciteMax'] }],
    }],
  });

  if (!utilisateurs.length) throw { statusCode: 404, message: 'Aucun étudiant en attente.' };

  const repartition = repartirEnGroupes(utilisateurs, capaciteGroupe);

  return {
    totalEtudiants: utilisateurs.length,
    capaciteGroupe,
    apercu: Object.entries(repartition).map(([key, data]) => ({
      filiere:     data.filiere,
      niveau:      data.niveau,
      nbEtudiants: data.nbEtudiants,
      nbGroupes:   data.nbGroupes,
      groupes:     Object.entries(data.groupes).map(([nom, g]) => ({
        nom,
        nbMembres:     g.membres.length,
        nbSousGroupe1: g.SG1.length,
        nbSousGroupe2: g.SG2.length,
      })),
    })),
  };
}

module.exports = {
  // Filières
  getFilieres,
  creerFiliere,
  modifierFiliere,
  // Spécialités
  getSpecialites,
  creerSpecialite,
  modifierSpecialite,
  // Étudiants & Groupes
  getEtudiantsEnAttente,
  apercuRepartition,
  validerEtAffecterGroupes,
};
