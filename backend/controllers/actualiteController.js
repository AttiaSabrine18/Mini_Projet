'use strict';

const db                 = require('../models');
const { success, error } = require('../utils/response');
const fs                 = require('fs');

// POST /api/actualites → créer une actualité (admin)
async function creerActualite(req, res) {
  try {
    const { titre, contenu, estPubliee } = req.body;

    if (!titre || !contenu) {
      return error(res, 'Les champs titre et contenu sont obligatoires.', 400);
    }

    const admin = await db.Administrateur.findOne({
      where: { utilisateurId: req.utilisateur.id },
    });
    if (!admin) return error(res, 'Profil administrateur introuvable.', 404);

    const actualite = await db.Actualite.create({
      titre,
      contenu,
      fichierPDF:      req.file ? req.file.path : null,
      datePublication: new Date(),
      estPubliee:      estPubliee !== undefined ? estPubliee : true,
      adminId:         admin.id,
    });

    return success(res, actualite, 'Actualité créée avec succès.', 201);
  } catch (err) {
    console.error('Erreur creerActualite:', err);
    return error(res, err.message || 'Erreur.', 500);
  }
}

// GET /api/actualites → lister toutes les actualités publiées
async function getActualites(req, res) {
  try {
    const actualites = await db.Actualite.findAll({
      where: { estPubliee: true },
      include: [
        {
          model: db.Administrateur,
          as: 'admin',
          include: [
            { model: db.Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }
          ],
        },
      ],
      order: [['datePublication', 'DESC']],
    });

    return success(res, actualites, `${actualites.length} actualité(s).`);
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// GET /api/actualites/toutes → toutes y compris non publiées (admin)
async function getToutesActualites(req, res) {
  try {
    const actualites = await db.Actualite.findAll({
      include: [
        {
          model: db.Administrateur,
          as: 'admin',
          include: [
            { model: db.Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }
          ],
        },
      ],
      order: [['datePublication', 'DESC']],
    });

    return success(res, actualites, `${actualites.length} actualité(s).`);
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// GET /api/actualites/:id → détail d'une actualité
async function getActualite(req, res) {
  try {
    const actualite = await db.Actualite.findByPk(req.params.id, {
      include: [
        {
          model: db.Administrateur,
          as: 'admin',
          include: [
            { model: db.Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }
          ],
        },
      ],
    });

    if (!actualite) return error(res, 'Actualité introuvable.', 404);
    return success(res, actualite);
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// PUT /api/actualites/:id → modifier (admin)
async function modifierActualite(req, res) {
  try {
    const admin = await db.Administrateur.findOne({
      where: { utilisateurId: req.utilisateur.id },
    });
    if (!admin) return error(res, 'Profil administrateur introuvable.', 404);

    const actualite = await db.Actualite.findOne({
      where: { id: req.params.id, adminId: admin.id },
    });
    if (!actualite) return error(res, 'Actualité introuvable ou non autorisée.', 404);

    const { titre, contenu, estPubliee } = req.body;

    // Si nouveau fichier → supprimer l'ancien
    if (req.file && actualite.fichierPDF && fs.existsSync(actualite.fichierPDF)) {
      fs.unlinkSync(actualite.fichierPDF);
    }

    await actualite.update({
      titre:      titre      ?? actualite.titre,
      contenu:    contenu    ?? actualite.contenu,
      estPubliee: estPubliee ?? actualite.estPubliee,
      fichierPDF: req.file   ? req.file.path : actualite.fichierPDF,
    });

    return success(res, actualite, 'Actualité modifiée avec succès.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// DELETE /api/actualites/:id → supprimer (admin)
async function supprimerActualite(req, res) {
  try {
    const admin = await db.Administrateur.findOne({
      where: { utilisateurId: req.utilisateur.id },
    });
    if (!admin) return error(res, 'Profil administrateur introuvable.', 404);

    const actualite = await db.Actualite.findOne({
      where: { id: req.params.id, adminId: admin.id },
    });
    if (!actualite) return error(res, 'Actualité introuvable ou non autorisée.', 404);

    if (actualite.fichierPDF && fs.existsSync(actualite.fichierPDF)) {
      fs.unlinkSync(actualite.fichierPDF);
    }

    await actualite.destroy();
    return success(res, {}, 'Actualité supprimée avec succès.');
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// GET /api/actualites/telecharger/:id → télécharger le PDF
async function telechargerPDF(req, res) {
  try {
    const actualite = await db.Actualite.findByPk(req.params.id);
    if (!actualite)          return error(res, 'Actualité introuvable.', 404);
    if (!actualite.fichierPDF) return error(res, 'Aucun fichier PDF attaché.', 404);
    if (!fs.existsSync(actualite.fichierPDF)) return error(res, 'Fichier introuvable sur le serveur.', 404);

    return res.download(actualite.fichierPDF, `${actualite.titre}.pdf`);
  } catch (err) {
    return error(res, err.message || 'Erreur téléchargement.', 500);
  }
}

module.exports = {
  creerActualite,
  getActualites,
  getToutesActualites,
  getActualite,
  modifierActualite,
  supprimerActualite,
  telechargerPDF,
};