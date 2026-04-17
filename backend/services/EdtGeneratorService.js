'use strict';

const db   = require('../models');
const algo = require('./algorithmeGenetique');

async function genererEDT({ promotionId, semaine, anneeUniversitaire }) {

  // 1. Récupérer la promotion
  const promotion = await db.Promotion.findByPk(promotionId, {
    include: [{
      model:   db.Specialite,
      as:      'specialite',
      include: [{ model: db.Filiere, as: 'filiere' }],
    }],
  });
  if (!promotion) throw { statusCode: 404, message: 'Promotion introuvable.' };

  // 2. Récupérer les modules
  const modules = await db.Module.findAll({
    include: [{
      model:    db.Cours,
      as:       'cours',
      required: true,
      include:  [{
        model:    db.Programme,
        as:       'programme',
        where:    { promotionId },
        required: true,
      }],
    }, {
      model:    db.Enseignant,
      as:       'enseignantPrincipal',
      required: true,
      include:  [{ model: db.Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }],
    }],
  });

  if (!modules.length) throw { statusCode: 404, message: 'Aucun module trouvé pour cette promotion.' };

  // 3. Récupérer les salles
  const salles = await db.Salle.findAll({
    where:      { estActive: true },
    attributes: ['id', 'nom', 'code', 'capacite', 'type'],
  });
  if (!salles.length) throw { statusCode: 404, message: 'Aucune salle disponible.' };

  // 4. Construire les séances requises
  const seancesRequises = [];
  const groupes = promotion.groupes ? JSON.parse(promotion.groupes) : ['G1'];

  modules.forEach(module => {
    const nbSeances = Math.ceil((module.volumeHoraire || 2) / 2);
    groupes.forEach(groupe => {
      for (let i = 0; i < nbSeances; i++) {
        seancesRequises.push({
          coursId:      module.coursId,
          moduleId:     module.id,
          enseignantId: module.enseignantPrincipalId,
          groupe,
          effectif:     Math.ceil((promotion.effectifReel || 30) / groupes.length),
          type:         mapTypeModule(module.type),
        });
      }
    });
  });

  console.log(`🎯 ${seancesRequises.length} séances à planifier`);

  // 5. Algorithme génétique
  const resultat = algo.lancerAlgoGenetique(seancesRequises, salles);

  // 6. Créer l'emploi du temps
  const emploiTemps = await db.EmploiTemps.create({
    code:               `EDT-AUTO-${promotionId}-S${semaine}-${Date.now()}`,
    semaine,
    anneeUniversitaire,
    dateDebut:          getDateLundi(),
    dateFin:            getDateSamedi(),
    groupe:             groupes.join(','),
    promotionId,
  });

  // 7. Sauvegarder les sessions
  const sessionsData = algo.formaterPourBDD(resultat.edt, emploiTemps.id);
  await db.Session.bulkCreate(sessionsData);

  // 8. Re-fetch avec toutes les associations pour le frontend
  const sessionsCompletes = await db.Session.findAll({
    where:   { emploiTempsId: emploiTemps.id },
    include: [
      {
        model:      db.Cours,
        as:         'cours',
        attributes: ['id', 'nom', 'code'],
        required:   false,
      },
      {
        model:      db.Module,
        as:         'module',
        attributes: ['id', 'nom', 'type'],
        required:   false,
      },
      {
        model:      db.Salle,
        as:         'salle',
        attributes: ['id', 'nom', 'batiment', 'capacite'],
        required:   false,
      },
      {
        model:      db.Enseignant,
        as:         'enseignant',
        attributes: ['id', 'grade'],
        required:   false,
        include: [{
          model:      db.Utilisateur,
          as:         'utilisateur',
          attributes: ['nom', 'prenom'],
        }],
      },
      {
        model:      db.EmploiTemps,
        as:         'emploiTemps',
        attributes: ['semaine', 'anneeUniversitaire', 'groupe'],
      },
    ],
    order: [['date', 'ASC'], ['heureDebut', 'ASC']],
  });

  // 9. Formater pour le frontend
  const sessionsFormatees = sessionsCompletes.map(s => ({
    id:         s.id,
    code:       s.code,
    type:       s.type,
    date:       s.date,
    heureDebut: s.heureDebut,
    heureFin:   s.heureFin,
    groupe:     s.groupe,
    estAnnulee: s.estAnnulee,
    cours:      s.cours    ? { nom: s.cours.nom, code: s.cours.code }                                   : null,
    module:     s.module   ? { nom: s.module.nom, type: s.module.type }                                  : null,
    salle:      s.salle    ? { nom: s.salle.nom, batiment: s.salle.batiment || '', capacite: s.salle.capacite } : null,
    enseignant: s.enseignant?.utilisateur
      ? { nom: s.enseignant.utilisateur.nom, prenom: s.enseignant.utilisateur.prenom, grade: s.enseignant.grade }
      : null,
    emploiTemps: s.emploiTemps
      ? { semaine: s.emploiTemps.semaine, annee: s.emploiTemps.anneeUniversitaire, groupe: s.emploiTemps.groupe }
      : null,
  }));

  console.log(`✅ ${sessionsFormatees.length} séances générées`);

  return {
    emploiTempsId: emploiTemps.id,
    promotion:     promotion.code,
    semaine,
    score:         resultat.score,
    qualite:       resultat.qualite,
    nbSeances:     sessionsFormatees.length,
    conflits:      resultat.conflits,   // ← consistent name
    edt:           sessionsFormatees,   // ← flat array, not grouped by day
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mapTypeModule(type) {
  const map = {
    COURS_MAGISTRAL:   'COURS_MAGISTRAL',
    TRAVAUX_DIRIGES:   'TRAVAUX_DIRIGES',
    TRAVAUX_PRATIQUES: 'TRAVAUX_PRATIQUES',
  };
  return map[type] || 'COURS_MAGISTRAL';
}

function getDateLundi() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

function getDateSamedi() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 5;
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

module.exports = { genererEDT };
