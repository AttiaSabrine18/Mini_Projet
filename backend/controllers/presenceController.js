'use strict';

const { Op } = require('sequelize');
const {
  Presence, Etudiant, Session, Enseignant,
  Utilisateur, Cours, Inscription
} = require('../models');
const { success, error } = require('../utils/response');

// ─── Helper ───────────────────────────────────────────────────────────────────
async function getEnseignant(userId) {
  return Enseignant.findOne({ where: { utilisateurId: userId } });
}

// ═════════════════════════════════════════════════════════════════════════════
//  1. GET /presences/sessions/aujourd-hui
//     Enseignant voit toutes ses séances du jour
// ═════════════════════════════════════════════════════════════════════════════
async function getSessionsAujourdhui(req, res) {
  try {
    const enseignant = await getEnseignant(req.utilisateur.id);
    if (!enseignant) return error(res, 'Profil enseignant introuvable.', 403);

    const aujourdhui = new Date().toISOString().slice(0, 10);

    const sessions = await Session.findAll({
      where:   { enseignantId: enseignant.id, date: aujourdhui },
      include: [{ model: Cours, as: 'cours', attributes: ['id', 'nom', 'code'] }],
      order:   [['heureDebut', 'ASC']],
    });

    const sessionsAvecStats = await Promise.all(sessions.map(async (s) => {
      const totalMarques = await Presence.count({ where: { sessionId: s.id } });
      const presents     = await Presence.count({ where: { sessionId: s.id, estPresent: true } });
      return {
        ...s.toJSON(),
        stats: {
          presencesMarquees: totalMarques,
          presents,
          absents:          totalMarques - presents,
          presenceComplete: totalMarques > 0,
        },
      };
    }));

    return success(res, {
      date: aujourdhui, total: sessions.length, sessions: sessionsAvecStats,
    }, 'Séances du jour récupérées.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  2. GET /presences/sessions/:id/etudiants
//     Liste étudiants d'une séance avec statut présence déjà marquée ou pas
// ═════════════════════════════════════════════════════════════════════════════
async function getEtudiantsDuneSeance(req, res) {
  try {
    const sessionId = parseInt(req.params.id);

    const session = await Session.findByPk(sessionId, {
      include: [{ model: Cours, as: 'cours', attributes: ['id', 'nom', 'code'] }],
    });
    if (!session) return error(res, 'Séance introuvable.', 404);

    const inscriptions = await Inscription.findAll({
      where: { coursId: session.coursId },
      include: [{
        model: Etudiant, as: 'etudiant',
        include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom', 'email'] }],
        attributes: ['id', 'numeroEtudiant', 'groupe', 'niveau'],
      }],
    });

    const etudiants = await Promise.all(inscriptions.map(async (insc) => {
      const presence = await Presence.findOne({
        where: { sessionId, etudiantId: insc.etudiant.id },
      });
      return {
        etudiantId:      insc.etudiant.id,
        numeroEtudiant:  insc.etudiant.numeroEtudiant,
        groupe:          insc.etudiant.groupe,
        niveau:          insc.etudiant.niveau,
        nom:             insc.etudiant.utilisateur.nom,
        prenom:          insc.etudiant.utilisateur.prenom,
        presenceMarquee: presence !== null,
        estPresent:      presence ? presence.estPresent : null,
        justification:   presence ? presence.justification : null,
      };
    }));

    etudiants.sort((a, b) => a.nom.localeCompare(b.nom));

    return success(res, { seance: session, total: etudiants.length, etudiants },
      'Liste des étudiants récupérée.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  3. POST /presences
//     Marquer UN étudiant présent/absent
// ═════════════════════════════════════════════════════════════════════════════
async function marquerPresence(req, res) {
  try {
    const { sessionId, etudiantId, estPresent, heureArrivee, justification } = req.body;

    if (!sessionId || !etudiantId || estPresent === undefined)
      return error(res, 'sessionId, etudiantId et estPresent sont requis.', 400);

    const session  = await Session.findByPk(sessionId);
    if (!session)  return error(res, 'Séance introuvable.', 404);

    const etudiant = await Etudiant.findByPk(etudiantId);
    if (!etudiant) return error(res, 'Étudiant introuvable.', 404);

    const enseignant = await getEnseignant(req.utilisateur.id);
    if (!enseignant) return error(res, 'Profil enseignant introuvable.', 403);

    const [presence, created] = await Presence.upsert({
      sessionId, etudiantId, estPresent,
      heureArrivee:  heureArrivee  || null,
      justification: justification || null,
      marquePar:     enseignant.id,
      dateMarquage:  new Date(),
    }, { returning: true });

    return success(res, presence,
      created ? 'Présence enregistrée.' : 'Présence mise à jour.', created ? 201 : 200);
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  4. POST /presences/bulk
//     Marquer TOUTE la classe en une seule requête
// ═════════════════════════════════════════════════════════════════════════════
async function marquerPresenceBulk(req, res) {
  try {
    const { sessionId, presences } = req.body;

    if (!sessionId || !Array.isArray(presences) || presences.length === 0)
      return error(res, 'sessionId et presences[] sont requis.', 400);

    const session = await Session.findByPk(sessionId);
    if (!session) return error(res, 'Séance introuvable.', 404);

    const enseignant = await getEnseignant(req.utilisateur.id);
    if (!enseignant) return error(res, 'Profil enseignant introuvable.', 403);

    const resultats = { enregistres: 0, erreurs: [] };

    for (const p of presences) {
      if (p.etudiantId === undefined || p.estPresent === undefined) {
        resultats.erreurs.push({ etudiantId: p.etudiantId, raison: 'Champs manquants' });
        continue;
      }
      try {
        await Presence.upsert({
          sessionId,
          etudiantId:    p.etudiantId,
          estPresent:    p.estPresent,
          heureArrivee:  p.heureArrivee  || null,
          justification: p.justification || null,
          marquePar:     enseignant.id,
          dateMarquage:  new Date(),
        });
        resultats.enregistres++;
      } catch (e) {
        resultats.erreurs.push({ etudiantId: p.etudiantId, raison: e.message });
      }
    }

    return success(res, resultats,
      `${resultats.enregistres}/${presences.length} présences enregistrées.`, 201);
  } catch (err) {
    return error(res, err.message || 'Erreur bulk.', 500);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  5. PATCH /presences/sessions/:id/statut
//     Prof annule sa séance (absent) / Admin annule / reporter
//     Body: { statut: 'ANNULEE' | 'REPORTEE' | 'ACTIVE' }
// ═════════════════════════════════════════════════════════════════════════════
async function changerStatutSession(req, res) {
  try {
    const sessionId = parseInt(req.params.id);
    const { statut, motif } = req.body;

    const statutsValides = ['ANNULEE', 'REPORTEE', 'ACTIVE'];
    if (!statut || !statutsValides.includes(statut.toUpperCase()))
      return error(res, `Statut invalide. Valeurs : ${statutsValides.join(', ')}`, 400);

    const session = await Session.findByPk(sessionId);
    if (!session) return error(res, 'Séance introuvable.', 404);

    if (req.utilisateur.typeUtilisateur === 'ENSEIGNANT') {
      const enseignant = await getEnseignant(req.utilisateur.id);
      if (!enseignant || session.enseignantId !== enseignant.id)
        return error(res, 'Vous ne pouvez modifier que vos propres séances.', 403);
    }

    // La table sessions utilise estAnnulee (boolean) pas statut
    const estAnnulee = statut.toUpperCase() === 'ANNULEE' || statut.toUpperCase() === 'REPORTEE';
    await session.update({ estAnnulee });

    const messages = {
      ANNULEE:  '📢 Séance annulée.',
      REPORTEE: '📅 Séance reportée.',
      ACTIVE:   '✅ Séance réactivée.',
    };

    return success(res, session, messages[statut.toUpperCase()] || 'Statut mis à jour.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  6. GET /presences/seance/:id
//     Liste complète présences d'une séance avec stats
// ═════════════════════════════════════════════════════════════════════════════
async function getPresencesSeance(req, res) {
  try {
    const sessionId = parseInt(req.params.id);

    const session = await Session.findByPk(sessionId, {
      include: [{ model: Cours, as: 'cours', attributes: ['id', 'nom'] }],
    });
    if (!session) return error(res, 'Séance introuvable.', 404);

    const presences = await Presence.findAll({
      where: { sessionId },
      include: [{
        model: Etudiant, as: 'etudiant',
        include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom', 'email'] }],
        attributes: ['id', 'numeroEtudiant', 'groupe'],
      }],
      order: [[{ model: Etudiant, as: 'etudiant' },
               { model: Utilisateur, as: 'utilisateur' }, 'nom', 'ASC']],
    });

    const total    = presences.length;
    const presents = presences.filter(p => p.estPresent).length;
    const absents  = total - presents;
    const taux     = total > 0 ? Math.round((presents / total) * 100) : 0;

    return success(res, {
      seance:       session,
      statistiques: { total, presents, absents, tauxPresence: `${taux}%` },
      presences,
    }, 'Liste de présence récupérée.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  7. GET /presences/:etudiantId
//     Historique absences d'un étudiant avec stats
// ═════════════════════════════════════════════════════════════════════════════
async function getHistoriqueEtudiant(req, res) {
  try {
    const etudiantId = parseInt(req.params.etudiantId);

    if (req.utilisateur.typeUtilisateur === 'ETUDIANT') {
      const etudiant = await Etudiant.findOne({ where: { utilisateurId: req.utilisateur.id } });
      if (!etudiant || etudiant.id !== etudiantId)
        return error(res, 'Accès refusé. Vous ne pouvez voir que votre propre historique.', 403);
    }

    const presences = await Presence.findAll({
      where: { etudiantId },
      include: [
        {
          model: Session, as: 'session',
          include: [{ model: Cours, as: 'cours', attributes: ['id', 'nom'] }],
          attributes: ['id', 'date', 'heureDebut', 'heureFin', 'type', 'estAnnulee'],
        },
        {
          model: Enseignant, as: 'enseignant',
          include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }],
          attributes: ['id'],
        },
      ],
      order: [[{ model: Session, as: 'session' }, 'date', 'DESC']],
    });

    const total    = presences.length;
    const presents = presences.filter(p => p.estPresent).length;
    const absents  = total - presents;
    const taux     = total > 0 ? Math.round((presents / total) * 100) : 0;

    return success(res, {
      statistiques: { total, presents, absents, tauxPresence: `${taux}%` },
      historique:   presences,
    }, 'Historique récupéré.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  8. GET /presences/admin/seances-sans-presence
//     Admin détecte séances passées sans présences = prof absent sans prévenir
// ═════════════════════════════════════════════════════════════════════════════
async function getSeancesSansPresence(req, res) {
  try {
    const aujourdhui = new Date().toISOString().slice(0, 10);

    const sessions = await Session.findAll({
      where: {
        date:       { [Op.lt]: aujourdhui },
        estAnnulee: false,
      },
      include: [
        { model: Cours, as: 'cours', attributes: ['id', 'nom', 'code'] },
        {
          model: Enseignant, as: 'enseignant',
          include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom', 'email'] }],
          attributes: ['id', 'matricule'],
        },
      ],
      order: [['date', 'DESC']],
    });

    const resultat = (await Promise.all(
      sessions.map(async (s) => {
        const count = await Presence.count({ where: { sessionId: s.id } });
        return count === 0 ? s.toJSON() : null;
      })
    )).filter(Boolean);

    return success(res, { total: resultat.length, seances: resultat },
      `${resultat.length} séance(s) sans présences détectée(s).`);
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

module.exports = {
  getSessionsAujourdhui,
  getEtudiantsDuneSeance,
  marquerPresence,
  marquerPresenceBulk,
  changerStatutSession,
  getPresencesSeance,
  getHistoriqueEtudiant,
  getSeancesSansPresence,
};
