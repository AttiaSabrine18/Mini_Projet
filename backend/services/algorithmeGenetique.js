'use strict';

// ══════════════════════════════════════════════════════════════════════════════
//  ALGORITHME GÉNÉTIQUE — Génération automatique de l'EDT
//  Contraintes dures  : salle, enseignant, groupe, capacité
//  Contraintes douces : horaires, pause déjeuner, consécutifs, préférences
// ══════════════════════════════════════════════════════════════════════════════

const JOURS        = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const CRENEAUX     = ['08:00', '10:00', '12:00', '14:00', '16:00'];  // créneaux de 2h
const HEURE_DEBUT  = 8;
const HEURE_FIN    = 18;
const PAUSE_DEBUT  = 12;
const PAUSE_FIN    = 14;

// ─── Paramètres de l'algo génétique ──────────────────────────────────────────
const TAILLE_POPULATION  = 50;
const NB_GENERATIONS     = 200;
const TAUX_MUTATION      = 0.05;
const TAUX_CROISEMENT    = 0.8;
const TAILLE_TOURNOI     = 5;

// ══════════════════════════════════════════════════════════════════════════════
//  STRUCTURES DE DONNÉES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Gene = une séance planifiée
 * { coursId, moduleId, enseignantId, groupeId, salleId, jour, creneau }
 */

/**
 * Chromosome = liste de genes = un EDT complet
 */

// ══════════════════════════════════════════════════════════════════════════════
//  INITIALISATION — Générer une population aléatoire
// ══════════════════════════════════════════════════════════════════════════════
function genererChromosomeAleatoire(seancesRequises, salles) {
  return seancesRequises.map(seance => {
    const jour    = JOURS[Math.floor(Math.random() * JOURS.length)];
    const creneau = CRENEAUX[Math.floor(Math.random() * CRENEAUX.length)];
    const salle   = salles[Math.floor(Math.random() * salles.length)];

    return {
      coursId:      seance.coursId,
      moduleId:     seance.moduleId,
      enseignantId: seance.enseignantId,
      groupe:       seance.groupe,
      effectif:     seance.effectif || 30,
      type:         seance.type,
      salleId:      salle.id,
      salleCapacite: salle.capacite,
      jour,
      creneau,
    };
  });
}

function genererPopulation(seancesRequises, salles) {
  return Array.from({ length: TAILLE_POPULATION }, () =>
    genererChromosomeAleatoire(seancesRequises, salles)
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  FITNESS — Calculer le score d'un chromosome
//  Score élevé = meilleur EDT
// ══════════════════════════════════════════════════════════════════════════════
function calculerFitness(chromosome) {
  let penalites = 0;

  for (let i = 0; i < chromosome.length; i++) {
    const a = chromosome[i];  // ← déclaré dans la boucle externe

    // ── CONTRAINTES DURES : comparaison avec les autres séances ──────────────
    for (let j = i + 1; j < chromosome.length; j++) {
      const b = chromosome[j];

      const memeCreneauJour = a.jour === b.jour && a.creneau === b.creneau;

      if (memeCreneauJour) {
        // 1. Même salle au même moment
        if (a.salleId === b.salleId) penalites += 100;

        // 2. Même enseignant au même moment
        if (a.enseignantId === b.enseignantId) penalites += 100;

        // 3. Même groupe au même moment
        if (a.groupe === b.groupe) penalites += 100;
      }
    }

    // ── CONTRAINTES DURES individuelles ──────────────────────────────────────

    // 4. Capacité salle < effectif groupe
    if (a.salleCapacite < a.effectif) penalites += 50;

    // ── CONTRAINTES DOUCES ────────────────────────────────────────────────────
    const heure = parseInt(a.creneau.split(':')[0]);

    // 5. Cours avant 8h ou après 18h
    if (heure < HEURE_DEBUT || heure >= HEURE_FIN) penalites += 10;

    // 6. Cours pendant la pause déjeuner (12h-14h)
    if (heure >= PAUSE_DEBUT && heure < PAUSE_FIN) penalites += 15;
  }

  // ── CONTRAINTE DOUCE : Max 4h consécutifs par groupe ─────────────────────
  const parGroupeJour = {};
  chromosome.forEach(gene => {
    const key = `${gene.groupe}-${gene.jour}`;
    if (!parGroupeJour[key]) parGroupeJour[key] = [];
    parGroupeJour[key].push(parseInt(gene.creneau.split(':')[0]));
  });

  Object.values(parGroupeJour).forEach(heures => {
    heures.sort((a, b) => a - b);
    let consecutifs = 2; // chaque créneau = 2h
    for (let k = 1; k < heures.length; k++) {
      if (heures[k] - heures[k - 1] === 2) {
        consecutifs += 2;
        if (consecutifs > 4) penalites += 5;
      } else {
        consecutifs = 2;
      }
    }
  });

  return 1000 - penalites; // fitness max = 1000
}

// ══════════════════════════════════════════════════════════════════════════════
//  SÉLECTION — Tournoi
// ══════════════════════════════════════════════════════════════════════════════
function selectionTournoi(population, scores) {
  let meilleurIdx = Math.floor(Math.random() * population.length);

  for (let i = 1; i < TAILLE_TOURNOI; i++) {
    const idx = Math.floor(Math.random() * population.length);
    if (scores[idx] > scores[meilleurIdx]) meilleurIdx = idx;
  }

  return population[meilleurIdx];
}

// ══════════════════════════════════════════════════════════════════════════════
//  CROISEMENT — One-point crossover
// ══════════════════════════════════════════════════════════════════════════════
function croiser(parent1, parent2) {
  if (Math.random() > TAUX_CROISEMENT) return [...parent1];

  const point  = Math.floor(Math.random() * parent1.length);
  const enfant = [
    ...parent1.slice(0, point),
    ...parent2.slice(point),
  ];

  return enfant;
}

// ══════════════════════════════════════════════════════════════════════════════
//  MUTATION — Changer aléatoirement un créneau ou une salle
// ══════════════════════════════════════════════════════════════════════════════
function muter(chromosome, salles) {
  return chromosome.map(gene => {
    if (Math.random() < TAUX_MUTATION) {
      const typesMutation = ['jour', 'creneau', 'salle'];
      const type = typesMutation[Math.floor(Math.random() * typesMutation.length)];

      if (type === 'jour') {
        return { ...gene, jour: JOURS[Math.floor(Math.random() * JOURS.length)] };
      }
      if (type === 'creneau') {
        return { ...gene, creneau: CRENEAUX[Math.floor(Math.random() * CRENEAUX.length)] };
      }
      if (type === 'salle') {
        const salle = salles[Math.floor(Math.random() * salles.length)];
        return { ...gene, salleId: salle.id, salleCapacite: salle.capacite };
      }
    }
    return gene;
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  ALGORITHME PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
function lancerAlgoGenetique(seancesRequises, salles, onProgress = null) {
  console.log(`🧬 Démarrage algo génétique — ${seancesRequises.length} séances à placer`);
  console.log(`   Population: ${TAILLE_POPULATION} | Générations: ${NB_GENERATIONS}`);

  // 1. Population initiale
  let population = genererPopulation(seancesRequises, salles);

  let meilleurChromosome = null;
  let meilleurScore      = -Infinity;
  let historique         = [];

  // 2. Boucle évolutive
  for (let gen = 0; gen < NB_GENERATIONS; gen++) {
    // Calculer fitness de chaque chromosome
    const scores = population.map(calculerFitness);

    // Trouver le meilleur de cette génération
    const maxScore = Math.max(...scores);
    const maxIdx   = scores.indexOf(maxScore);

    if (maxScore > meilleurScore) {
      meilleurScore      = maxScore;
      meilleurChromosome = [...population[maxIdx]];
    }

    historique.push({ generation: gen, score: maxScore });

    // Log toutes les 50 générations
    if (gen % 50 === 0) {
      console.log(`   Gen ${gen}: meilleur score = ${maxScore}/1000`);
      if (onProgress) onProgress({ generation: gen, score: maxScore, total: NB_GENERATIONS });
    }

    // Condition d'arrêt anticipé si score parfait
    if (meilleurScore >= 990) {
      console.log(`✅ Score optimal atteint à la génération ${gen}`);
      break;
    }

    // 3. Créer nouvelle génération
    const nouvellePopulation = [];

    // Élitisme : garder le meilleur
    nouvellePopulation.push([...meilleurChromosome]);

    while (nouvellePopulation.length < TAILLE_POPULATION) {
      const parent1 = selectionTournoi(population, scores);
      const parent2 = selectionTournoi(population, scores);
      const enfant  = croiser(parent1, parent2);
      const mutant  = muter(enfant, salles);
      nouvellePopulation.push(mutant);
    }

    population = nouvellePopulation;
  }

  console.log(`\n🏆 Résultat final — Score: ${meilleurScore}/1000`);

  return {
    edt:         meilleurChromosome,
    score:       meilleurScore,
    qualite:     meilleurScore >= 900 ? 'Excellent' : meilleurScore >= 700 ? 'Bon' : 'Acceptable',
    historique,
    conflits:    detecterConflits(meilleurChromosome),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
//  DÉTECTION DES CONFLITS RÉSIDUELS
// ══════════════════════════════════════════════════════════════════════════════
function detecterConflits(chromosome) {
  const conflits = [];

  for (let i = 0; i < chromosome.length; i++) {
    for (let j = i + 1; j < chromosome.length; j++) {
      const a = chromosome[i];
      const b = chromosome[j];

      if (a.jour === b.jour && a.creneau === b.creneau) {
        if (a.salleId === b.salleId) {
          conflits.push({ type: 'SALLE', message: `Conflit salle ${a.salleId} — ${a.jour} ${a.creneau}` });
        }
        if (a.enseignantId === b.enseignantId) {
          conflits.push({ type: 'ENSEIGNANT', message: `Conflit enseignant ${a.enseignantId} — ${a.jour} ${a.creneau}` });
        }
        if (a.groupe === b.groupe) {
          conflits.push({ type: 'GROUPE', message: `Conflit groupe ${a.groupe} — ${a.jour} ${a.creneau}` });
        }
      }
    }
  }

  return conflits;
}

// ══════════════════════════════════════════════════════════════════════════════
//  FORMATTER — Convertir le résultat en sessions pour la BDD
// ══════════════════════════════════════════════════════════════════════════════
function formaterPourBDD(edt, emploiTempsId) {
  const heuresParCreneau = { '08:00': '10:00', '10:00': '12:00', '12:00': '14:00', '14:00': '16:00', '16:00': '18:00' };

  return edt.map((gene, index) => ({
    code:          `SES-AUTO-${emploiTempsId}-${index + 1}`,
    type:          gene.type || 'COURS_MAGISTRAL',
    date:          prochaineDate(gene.jour),
    heureDebut:    gene.creneau,
    heureFin:      heuresParCreneau[gene.creneau] || '10:00',
    groupe:        gene.groupe,
    estAnnulee:    false,
    emploiTempsId,
    coursId:       gene.coursId,
    moduleId:      gene.moduleId,
    salleId:       gene.salleId,
    enseignantId:  gene.enseignantId,
  }));
}

// Helper : trouver la prochaine date pour un jour donné
function prochaineDate(nomJour) {
  const jours = { 'Lundi': 1, 'Mardi': 2, 'Mercredi': 3, 'Jeudi': 4, 'Vendredi': 5, 'Samedi': 6 };
  const today = new Date();
  const jourCible = jours[nomJour] || 1;
  const diff = (jourCible - today.getDay() + 7) % 7 || 7;
  const date = new Date(today);
  date.setDate(today.getDate() + diff);
  return date.toISOString().split('T')[0];
}

module.exports = {
  lancerAlgoGenetique,
  formaterPourBDD,
  detecterConflits,
  calculerFitness,
  JOURS,
  CRENEAUX,
};