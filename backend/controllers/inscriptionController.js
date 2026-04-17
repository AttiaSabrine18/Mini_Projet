'use strict';

const {
  Etudiant, Utilisateur, Filiere, Specialite,
  Promotion, Inscription, Cours, Programme,
} = require('../models');
const { success, error } = require('../utils/response');

// ═══════════════════════════════════════════════════════════════════
//  1. GET /inscriptions/ma-fiche
// ═══════════════════════════════════════════════════════════════════
async function getMaFiche(req, res) {
  try {
    const etudiant = await Etudiant.findOne({
      where: { utilisateurId: req.utilisateur.id },
      include: [
        {
          model: Utilisateur, as: 'utilisateur',
          attributes: ['nom', 'prenom', 'email', 'telephone', 'adresse', 'dateNaissance'],
        },
        { model: Filiere, as: 'filiere', attributes: ['id', 'nom', 'code'] },
      ],
    });

    if (!etudiant) return error(res, 'Profil étudiant introuvable.', 404);

    const inscription = await Inscription.findOne({
      where: { etudiantId: etudiant.id },
      include: [
        { model: Promotion, as: 'promotion', attributes: ['id', 'code', 'niveau', 'anneeUniversitaire'] },
      ],
    });

    const ficheComplete = !!(
      etudiant.filiereId &&
      etudiant.groupe &&
      etudiant.niveau &&
      etudiant.semestreActuel &&
      inscription
    );

    return success(res, { etudiant, inscription, ficheComplete }, 'Fiche récupérée.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════
//  2. PUT /inscriptions/ma-fiche
// ═══════════════════════════════════════════════════════════════════
async function soumettreFlche(req, res) {
  try {
    const {
      dateNaissance, telephone, adresse,
      niveau, semestreActuel, filiereId, anneeAcademique,
      groupe, sousGroupe,
    } = req.body;

    if (!niveau || !semestreActuel || !filiereId || !anneeAcademique)
      return error(res, 'niveau, semestreActuel, filiereId et anneeAcademique sont requis.', 400);

    const filiere = await Filiere.findByPk(filiereId);
    if (!filiere) return error(res, 'Filière introuvable.', 404);

    await Utilisateur.update(
      { dateNaissance: dateNaissance || null, telephone: telephone || null, adresse: adresse || null },
      { where: { id: req.utilisateur.id } }
    );

    const etudiant = await Etudiant.findOne({ where: { utilisateurId: req.utilisateur.id } });
    if (!etudiant) return error(res, 'Profil étudiant introuvable.', 404);

    await etudiant.update({
      niveau, semestreActuel,
      filiereId:       parseInt(filiereId),
      anneeAcademique,
      groupe:          groupe     || null,
      sousGroupe:      sousGroupe || null,
    });

    return success(res, { etudiant }, 'Fiche soumise. En attente d\'affectation par l\'administrateur.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════
//  3. GET /inscriptions/admin/fiches-en-attente
// ═══════════════════════════════════════════════════════════════════
async function getFichesEnAttente(req, res) {
  try {
    const etudiants = await Etudiant.findAll({
      include: [
        {
          model: Utilisateur, as: 'utilisateur',
          where: { statut: 'ACTIF', typeUtilisateur: 'ETUDIANT' },
          attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'adresse', 'dateNaissance', 'statut'],
        },
        { model: Filiere, as: 'filiere', attributes: ['id', 'nom', 'code'] },
      ],
    });

    const enAttente = [];
    for (const etu of etudiants) {
      const insc = await Inscription.findOne({ where: { etudiantId: etu.id, statut: 'VALIDE' } });
      if (!insc) enAttente.push(etu.toJSON());
    }

    return success(res, { total: enAttente.length, etudiants: enAttente }, 'Fiches en attente récupérées.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════
//  4. GET /inscriptions/admin/filieres-promotions
// ═══════════════════════════════════════════════════════════════════
async function getFilieresPromotions(req, res) {
  try {
    const [filieres, promotions] = await Promise.all([
      Filiere.findAll({
        where: { estActive: true },
        attributes: ['id', 'nom', 'code', 'niveauAcces'],
        order: [['nom', 'ASC']],
      }),
      Promotion.findAll({
        where: { estActive: true },
        include: [{ model: Specialite, as: 'specialite', attributes: ['nom', 'code'] }],
        attributes: ['id', 'code', 'niveau', 'anneeUniversitaire', 'groupes', 'specialiteId'],
        order: [['anneeUniversitaire', 'DESC'], ['niveau', 'ASC']],
      }),
    ]);

    return success(res, { filieres, promotions }, 'Données récupérées.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════
//  5. GET /inscriptions/filieres  (accessible à tous les connectés)
// ═══════════════════════════════════════════════════════════════════
async function getFilieres(req, res) {
  try {
    const filieres = await Filiere.findAll({
      where: { estActive: true },
      attributes: ['id', 'nom', 'code', 'niveauAcces'],
      order: [['nom', 'ASC']],
    });
    return success(res, { filieres }, 'Filières récupérées.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════
//  6. POST /inscriptions/admin/affecter
//     ✅ Crée une inscription par cours lié à la promotion
// ═══════════════════════════════════════════════════════════════════
async function affecterEtudiant(req, res) {
  try {
    const { etudiantId, promotionId, filiereId, groupe, sousGroupe } = req.body;

    if (!etudiantId || !promotionId || !filiereId || !groupe)
      return error(res, 'etudiantId, promotionId, filiereId et groupe sont requis.', 400);

    const etudiant = await Etudiant.findByPk(etudiantId, {
      include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom', 'email'] }],
    });
    if (!etudiant) return error(res, 'Étudiant introuvable.', 404);

    const promotion = await Promotion.findByPk(promotionId);
    if (!promotion) return error(res, 'Promotion introuvable.', 404);

    // Mettre à jour le profil étudiant
    await etudiant.update({
      filiereId:  parseInt(filiereId),
      groupe,
      sousGroupe: sousGroupe || null,
    });

    // ── Récupérer tous les cours liés à cette promotion ──────
    const programmes = await Programme.findAll({ where: { promotionId } });
    const coursIds   = [];
    for (const prog of programmes) {
      const coursList = await Cours.findAll({ where: { programmeId: prog.id } });
      coursIds.push(...coursList.map(c => c.id));
    }

    // ── Créer une inscription par cours ──────────────────────
    const inscriptionsCreees = [];
    if (coursIds.length > 0) {
      for (const coursId of coursIds) {
        const num      = `INS-${etudiantId}-${promotionId}-${coursId}`;
        const existing = await Inscription.findOne({ where: { etudiantId, coursId } });
        if (!existing) {
          const insc = await Inscription.create({
            numeroInscription:  num,
            etudiantId,
            promotionId,
            coursId,
            statut:             'VALIDE',
            dateInscription:    new Date(),
            dateValidation:     new Date(),
            validePar:          req.utilisateur.id,
            anneeUniversitaire: promotion.anneeUniversitaire,
          });
          inscriptionsCreees.push(insc);
        } else {
          // Mettre à jour si déjà existante
          await existing.update({ statut: 'VALIDE', dateValidation: new Date(), validePar: req.utilisateur.id });
          inscriptionsCreees.push(existing);
        }
      }
    } else {
      // Pas de cours encore — créer une inscription sans coursId
      const num      = `INS-${etudiantId}-${promotionId}`;
      const existing = await Inscription.findOne({ where: { etudiantId, promotionId } });
      if (!existing) {
        const insc = await Inscription.create({
          numeroInscription:  num,
          etudiantId,
          promotionId,
          coursId:            null,
          statut:             'VALIDE',
          dateInscription:    new Date(),
          dateValidation:     new Date(),
          validePar:          req.utilisateur.id,
          anneeUniversitaire: promotion.anneeUniversitaire,
        });
        inscriptionsCreees.push(insc);
      } else {
        await existing.update({ statut: 'VALIDE', dateValidation: new Date(), validePar: req.utilisateur.id });
        inscriptionsCreees.push(existing);
      }
    }

    return success(res, { etudiant, inscriptions: inscriptionsCreees },
      `${etudiant.utilisateur.prenom} ${etudiant.utilisateur.nom} affecté(e) au groupe ${groupe} — ${inscriptionsCreees.length} inscription(s) créée(s) ✅`);
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════
//  7. GET /inscriptions/admin/inscrits
// ═══════════════════════════════════════════════════════════════════
async function getInscrits(req, res) {
  try {
    const inscriptions = await Inscription.findAll({
      where: { statut: 'VALIDE' },
      include: [
        {
          model: Etudiant, as: 'etudiant',
          include: [
            { model: Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom', 'email'] },
            { model: Filiere,     as: 'filiere',     attributes: ['nom', 'code'] },
          ],
          attributes: ['id', 'numeroEtudiant', 'groupe', 'niveau', 'semestreActuel'],
        },
        {
          model: Promotion, as: 'promotion',
          attributes: ['code', 'niveau', 'anneeUniversitaire'],
        },
      ],
      order: [['dateInscription', 'DESC']],
    });

    // Dédoublonner par étudiant (un étudiant peut avoir plusieurs inscriptions/cours)
    const vus = new Set();
    const uniques = inscriptions.filter(i => {
      const key = i.etudiantId;
      if (vus.has(key)) return false;
      vus.add(key);
      return true;
    });

    return success(res, { total: uniques.length, inscriptions: uniques }, 'Inscrits récupérés.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

module.exports = {
  getMaFiche,
  soumettreFlche,
  getFichesEnAttente,
  getFilieresPromotions,
  getFilieres,
  affecterEtudiant,
  getInscrits,
};
