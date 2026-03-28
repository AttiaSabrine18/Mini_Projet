'use strict';

const db   = require('../models');
const algo = require('./algorithmeGenetique');

// ══════════════════════════════════════════════════════════════════════════════
//  POST /api/edt/generer — Générer un EDT automatiquement
// ══════════════════════════════════════════════════════════════════════════════
async function genererEDT({ promotionId, semaine, anneeUniversitaire }) {

  // 1. Récupérer la promotion + ses modules
  const promotion = await db.Promotion.findByPk(promotionId, {
    include: [{
      model:   db.Specialite,
      as:      'specialite',
      include: [{ model: db.Filiere, as: 'filiere' }],
    }],
  });
  if (!promotion) throw { statusCode: 404, message: 'Promotion introuvable.' };

  // 2. Récupérer tous les modules à planifier pour cette promotion
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

  if (!modules.length) {
    throw { statusCode: 404, message: 'Aucun module trouvé pour cette promotion.' };
  }

  // 3. Récupérer toutes les salles disponibles
  const salles = await db.Salle.findAll({
    where: { estActive: true },
    attributes: ['id', 'nom', 'code', 'capacite', 'type'],
  });

  if (!salles.length) throw { statusCode: 404, message: 'Aucune salle disponible.' };

  // 4. Construire la liste des séances requises
  // Chaque module génère N séances selon son volume horaire (1 séance = 2h)
  const seancesRequises = [];
  const groupes = promotion.groupes ? JSON.parse(promotion.groupes) : ['G1'];

  modules.forEach(module => {
    const nbSeances = Math.ceil(module.volumeHoraire / 2); // 2h par séance

    groupes.forEach(groupe => {
      for (let i = 0; i < nbSeances; i++) {
        seancesRequises.push({
          coursId:      module.coursId,
          moduleId:     module.id,
          enseignantId: module.enseignantPrincipalId,
          groupe,
          effectif:     Math.ceil(promotion.effectifReel / groupes.length) || 30,
          type:         mapTypeModule(module.type),
        });
      }
    });
  });

  console.log(`🎯 ${seancesRequises.length} séances à planifier pour ${groupes.length} groupe(s)`);

  // 5. Lancer l'algorithme génétique
  const resultat = algo.lancerAlgoGenetique(seancesRequises, salles);

  // 6. Créer l'emploi du temps en BDD
  const emploiTemps = await db.EmploiTemps.create({
    code:               `EDT-AUTO-${promotionId}-S${semaine}-${Date.now()}`,
    semaine,
    anneeUniversitaire,
    dateDebut:          getDateLundi(),
    dateFin:            getDateSamedi(),
    groupe:             groupes.join(','),
    promotionId,
  });

  // 7. Sauvegarder les sessions générées
  const sessionsData = algo.formaterPourBDD(resultat.edt, emploiTemps.id);
  const sessions     = await db.Session.bulkCreate(sessionsData);

  console.log(`✅ ${sessions.length} séances créées dans la BDD`);

  return {
    emploiTempsId:   emploiTemps.id,
    promotion:       promotion.code,
    semaine,
    score:           resultat.score,
    qualite:         resultat.qualite,
    nbSeances:       sessions.length,
    conflitsResiduels: resultat.conflits,
    edt:             formaterEDTParJour(resultat.edt, salles, modules),
  };
}

// ─── Helper : formater l'EDT par jour pour la réponse ────────────────────────
function formaterEDTParJour(edt, salles, modules) {
  const sallesMap  = Object.fromEntries(salles.map(s => [s.id, s]));
  const modulesMap = Object.fromEntries(modules.map(m => [m.id, m]));
  const parJour    = {};

  algo.JOURS.forEach(jour => { parJour[jour] = []; });

  edt.forEach(gene => {
    const salle  = sallesMap[gene.salleId];
    const module = modulesMap[gene.moduleId];

    parJour[gene.jour].push({
      groupe:      gene.groupe,
      creneau:     `${gene.creneau} → ${getHeureFin(gene.creneau)}`,
      type:        gene.type,
      cours:       module?.cours?.nom || 'Inconnu',
      salle:       salle ? `${salle.nom} (cap. ${salle.capacite})` : 'Inconnue',
      enseignantId: gene.enseignantId,
    });

    // Trier par créneau
    parJour[gene.jour].sort((a, b) => a.creneau.localeCompare(b.creneau));
  });

  return parJour;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function mapTypeModule(type) {
  const map = {
    'COURS_MAGISTRAL':  'COURS_MAGISTRAL',
    'TRAVAUX_DIRIGES':  'TRAVAUX_DIRIGES',
    'TRAVAUX_PRATIQUES':'TRAVAUX_PRATIQUES',
  };
  return map[type] || 'COURS_MAGISTRAL';
}

function getHeureFin(heureDebut) {
  const map = { '08:00':'10:00', '10:00':'12:00', '12:00':'14:00', '14:00':'16:00', '16:00':'18:00' };
  return map[heureDebut] || '10:00';
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