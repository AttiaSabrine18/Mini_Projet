'use strict';

const { Op } = require('sequelize');
const db      = require('../models');

// ─────────────────────────────────────────────────────────────────────────────
//  GET /edt — Voir l'emploi du temps selon le rôle
// ─────────────────────────────────────────────────────────────────────────────
async function getEDT(utilisateur, filtres = {}) {
  const { jour, matiere, salle } = filtres;

  // Construction des conditions sur Session
  const whereSession = {};
  if (jour)     whereSession['$emploiTemps.code$'] = { [Op.like]: `%${jour}%` };
  if (matiere)  whereSession['$cours.nom$']        = { [Op.like]: `%${matiere}%` };
  if (salle)    whereSession['$salle.nom$']         = { [Op.like]: `%${salle}%` };

  // ── Inclusions communes ───────────────────────────────────────────────────
  const include = [
    {
      model:      db.EmploiTemps,
      as:         'emploiTemps',
      attributes: ['id', 'code', 'semaine', 'anneeUniversitaire', 'dateDebut', 'dateFin', 'groupe'],
      include: [{
        model:      db.Promotion,
        as:         'promotion',
        attributes: ['id', 'code', 'niveau', 'anneeUniversitaire'],
      }],
    },
    {
      model:      db.Cours,
      as:         'cours',
      attributes: ['id', 'nom', 'code', 'volumeHoraireCM', 'volumeHoraireTD', 'volumeHoraireTP'],
    },
    {
      model:      db.Module,
      as:         'module',
      attributes: ['id', 'nom', 'code', 'type'],
      required:   false,
    },
    {
      model:      db.Salle,
      as:         'salle',
      attributes: ['id', 'nom', 'code', 'batiment', 'capacite', 'type'],
      required:   false,
    },
    {
      model:      db.Enseignant,
      as:         'enseignant',
      attributes: ['id', 'matricule', 'grade'],
      required:   false,
      include: [{
        model:      db.Utilisateur,
        as:         'utilisateur',
        attributes: ['nom', 'prenom'],
      }],
    },
  ];

  // ── ÉTUDIANT : voit son groupe uniquement ─────────────────────────────────
  if (utilisateur.typeUtilisateur === 'ETUDIANT') {
    const etudiant = await db.Etudiant.findOne({
      where: { utilisateurId: utilisateur.id },
    });
    if (!etudiant) throw { statusCode: 404, message: 'Profil étudiant introuvable.' };

    whereSession.groupe = etudiant.groupe;

    const sessions = await db.Session.findAll({
      where:   whereSession,
      include,
      order:   [['date', 'ASC'], ['heureDebut', 'ASC']],
    });

    return { role: 'ETUDIANT', groupe: etudiant.groupe, sessions: formatSessions(sessions) };
  }

  // ── ENSEIGNANT : voit ses propres classes ─────────────────────────────────
  if (utilisateur.typeUtilisateur === 'ENSEIGNANT') {
    const enseignant = await db.Enseignant.findOne({
      where: { utilisateurId: utilisateur.id },
    });
    if (!enseignant) throw { statusCode: 404, message: 'Profil enseignant introuvable.' };

    whereSession.enseignantId = enseignant.id;

    const sessions = await db.Session.findAll({
      where:   whereSession,
      include,
      order:   [['date', 'ASC'], ['heureDebut', 'ASC']],
    });

    return { role: 'ENSEIGNANT', matricule: enseignant.matricule, sessions: formatSessions(sessions) };
  }

  // ── ADMIN : voit tout ─────────────────────────────────────────────────────
  const sessions = await db.Session.findAll({
    where:   whereSession,
    include,
    order:   [['date', 'ASC'], ['heureDebut', 'ASC']],
  });

  return { role: 'ADMINISTRATEUR', sessions: formatSessions(sessions) };
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /edt — Créer une séance (admin seulement)
// ─────────────────────────────────────────────────────────────────────────────
async function creerSeance(data) {
  const {
    code, type, date, heureDebut, heureFin,
    groupe, emploiTempsId, coursId, moduleId,
    salleId, enseignantId,
  } = data;

  // Vérifier unicité du code
  const exist = await db.Session.findOne({ where: { code } });
  if (exist) throw { statusCode: 409, message: 'Ce code de séance existe déjà.' };

  // Vérifier conflit salle (même salle, même date, chevauchement horaire)
  if (salleId) {
    const conflit = await db.Session.findOne({
      where: {
        salleId,
        date,
        estAnnulee: false,
        [Op.or]: [
          { heureDebut: { [Op.between]: [heureDebut, heureFin] } },
          { heureFin:   { [Op.between]: [heureDebut, heureFin] } },
        ],
      },
    });
    if (conflit) throw { statusCode: 409, message: `Conflit : la salle est déjà occupée de ${conflit.heureDebut} à ${conflit.heureFin}.` };
  }

  const session = await db.Session.create({
    code, type, date,
    heureDebut, heureFin: heureFin || data.heureFin,
    groupe,
    emploiTempsId,
    coursId,
    moduleId:     moduleId    || null,
    salleId:      salleId     || null,
    enseignantId: enseignantId || null,
    estAnnulee:   false,
  });

  return session;
}

// ─────────────────────────────────────────────────────────────────────────────
//  GET /edt/groupes — Groupes d'un étudiant (US13)
// ─────────────────────────────────────────────────────────────────────────────
async function getGroupesEtudiant(utilisateurId) {
  const etudiant = await db.Etudiant.findOne({
    where:   { utilisateurId },
    include: [{
      model:      db.Filiere,
      as:         'filiere',
      attributes: ['nom', 'code'],
    }],
  });

  if (!etudiant) throw { statusCode: 404, message: 'Profil étudiant introuvable.' };

  // Récupérer toutes les sessions de son groupe
  const sessions = await db.Session.findAll({
    where:      { groupe: etudiant.groupe, estAnnulee: false },
    attributes: ['groupe', 'date', 'heureDebut', 'heureFin', 'type'],
    include: [{
      model:      db.Cours,
      as:         'cours',
      attributes: ['nom'],
    }],
    order: [['date', 'ASC']],
  });

  return {
    etudiant: {
      id:             etudiant.id,
      niveau:         etudiant.niveau,
      groupe:         etudiant.groupe,
      sousGroupe:     etudiant.sousGroupe,
      anneeAcademique: etudiant.anneeAcademique,
      filiere:        etudiant.filiere?.nom,
    },
    sessions: sessions.length,
    etudiantId: etudiant.id,
    groupeInfo: sessions,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  GET /edt/classes — Classes d'un enseignant (US16)
// ─────────────────────────────────────────────────────────────────────────────
async function getClassesEnseignant(utilisateurId) {
  const enseignant = await db.Enseignant.findOne({
    where: { utilisateurId },
  });

  if (!enseignant) throw { statusCode: 404, message: 'Profil enseignant introuvable.' };

  const sessions = await db.Session.findAll({
    where:   { enseignantId: enseignant.id, estAnnulee: false },
    include: [
      { model: db.Cours,      as: 'cours',      attributes: ['nom', 'code'] },
      { model: db.Salle,      as: 'salle',      attributes: ['nom', 'batiment'], required: false },
      { model: db.EmploiTemps, as: 'emploiTemps', attributes: ['groupe', 'anneeUniversitaire'] },
    ],
    order: [['date', 'ASC'], ['heureDebut', 'ASC']],
  });

  // Grouper par cours
  const parCours = {};
  sessions.forEach(s => {
    const nomCours = s.cours?.nom || 'Inconnu';
    if (!parCours[nomCours]) parCours[nomCours] = [];
    parCours[nomCours].push({
      date:       s.date,
      heureDebut: s.heureDebut,
      heureFin:   s.heureFin,
      type:       s.type,
      groupe:     s.emploiTemps?.groupe,
      salle:      s.salle ? `${s.salle.nom} (${s.salle.batiment})` : null,
    });
  });

  return {
    enseignant: { matricule: enseignant.matricule, grade: enseignant.grade },
    totalSeances: sessions.length,
    parCours,
  };
}

// ─── Helper : formater les sessions pour la réponse ──────────────────────────
function formatSessions(sessions) {
  return sessions.map(s => ({
    id:         s.id,
    code:       s.code,
    type:       s.type,
    date:       s.date,
    heureDebut: s.heureDebut,
    heureFin:   s.heureFin,
    groupe:     s.groupe,
    estAnnulee: s.estAnnulee,
    cours: s.cours ? { nom: s.cours.nom, code: s.cours.code } : null,
    module: s.module ? { nom: s.module.nom, type: s.module.type } : null,
    salle:  s.salle  ? { nom: s.salle.nom, batiment: s.salle.batiment, capacite: s.salle.capacite } : null,
    enseignant: s.enseignant?.utilisateur
      ? { nom: s.enseignant.utilisateur.nom, prenom: s.enseignant.utilisateur.prenom, grade: s.enseignant.grade }
      : null,
    emploiTemps: s.emploiTemps
      ? { semaine: s.emploiTemps.semaine, annee: s.emploiTemps.anneeUniversitaire, groupe: s.emploiTemps.groupe }
      : null,
  }));
}

module.exports = {
  getEDT,
  creerSeance,
  getGroupesEtudiant,
  getClassesEnseignant,
};