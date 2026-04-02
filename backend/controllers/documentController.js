'use strict';

const db                 = require('../models');
const { success, error } = require('../utils/response');

// POST /api/documents/upload
async function uploaderDocument(req, res) {
  try {
    if (!req.file) {
      return error(res, 'Aucun fichier PDF reçu.', 400);
    }

    const { titre, type, coursId, moduleId } = req.body;

    if (!titre || !type || !coursId) {
      return error(res, 'Les champs titre, type et coursId sont obligatoires.', 400);
    }

    const typesValides = ['COURS', 'TD', 'TP', 'EXAMEN'];
    if (!typesValides.includes(type)) {
      return error(res, `Type invalide. Valeurs acceptées : ${typesValides.join(', ')}`, 400);
    }

    // Récupérer l'enseignant connecté
    const enseignant = await db.Enseignant.findOne({
      where: { utilisateurId: req.utilisateur.id },
    });
    if (!enseignant) return error(res, 'Profil enseignant introuvable.', 404);

    // Vérifier que le cours appartient à cet enseignant
    const cours = await db.Cours.findOne({
      where: {
        id: coursId,
        enseignantPrincipalId: enseignant.id,
      },
    });
    if (!cours) {
      return error(res, 'Cours introuvable ou vous n\'êtes pas l\'enseignant principal.', 403);
    }

    // Créer le document en BDD
    const document = await db.Document.create({
      titre,
      type,
      format:       'pdf',
      taille:       req.file.size,
      url:          req.file.path,
      dateDepot:    new Date(),
      enseignantId: enseignant.id,
      coursId:      parseInt(coursId),
      moduleId:     moduleId ? parseInt(moduleId) : null,
      deposePar:    req.utilisateur.id,
    });

    return success(res, {
      id:        document.id,
      titre:     document.titre,
      type:      document.type,
      taille:    document.taille,
      url:       document.url,
      dateDepot: document.dateDepot,
      cours:     { id: cours.id, nom: cours.nom, code: cours.code },
    }, 'Document uploadé avec succès.', 201);

  } catch (err) {
    console.error('Erreur upload:', err);
    return error(res, err.message || 'Erreur lors de l\'upload.', 500);
  }
}

// GET /api/documents/cours/:coursId
async function getDocumentsByCours(req, res) {
  try {
    const { coursId } = req.params;

    // Vérifier que le cours existe
    const cours = await db.Cours.findOne({
      where: { id: coursId },
      include: [
        {
          model: db.Programme,
          as: 'programme',
          include: [
            {
              model: db.Promotion,
              as: 'promotion',
              include: [
                {
                  model: db.Specialite,
                  as: 'specialite',
                  include: [
                    { model: db.Filiere, as: 'filiere' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    if (!cours) return error(res, 'Cours introuvable.', 404);

    // Si c'est un étudiant → vérifier qu'il appartient à la bonne filière
    if (req.utilisateur.typeUtilisateur === 'ETUDIANT') {
      const etudiant = await db.Etudiant.findOne({
        where: { utilisateurId: req.utilisateur.id },
      });

      if (!etudiant) return error(res, 'Profil étudiant introuvable.', 404);

      // Récupérer la filière du cours
      const filiereIdCours = cours.programme?.promotion?.specialite?.filiereId;

      if (!filiereIdCours || etudiant.filiereId !== filiereIdCours) {
        return error(res, 'Accès refusé. Ce cours n\'appartient pas à votre filière.', 403);
      }
    }

    // Récupérer les documents
    const documents = await db.Document.findAll({
      where: { coursId },
      order: [['dateDepot', 'DESC']],
    });

    return success(res, documents, `${documents.length} document(s) trouvé(s).`);

  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// GET /api/documents/mes-cours
async function getMesDocuments(req, res) {
  try {
    const enseignant = await db.Enseignant.findOne({
      where: { utilisateurId: req.utilisateur.id },
    });
    if (!enseignant) return error(res, 'Enseignant introuvable.', 404);

    const documents = await db.Document.findAll({
      where: { enseignantId: enseignant.id },
      include: [
        { model: db.Cours, as: 'cours', attributes: ['id', 'nom', 'code'] },
      ],
      order: [['dateDepot', 'DESC']],
    });

    return success(res, documents, `${documents.length} document(s).`);
  } catch (err) {
    return error(res, err.message || 'Erreur.', 500);
  }
}

// DELETE /api/documents/:id
async function supprimerDocument(req, res) {
  try {
    const fs = require('fs');

    const enseignant = await db.Enseignant.findOne({
      where: { utilisateurId: req.utilisateur.id },
    });
    if (!enseignant) return error(res, 'Enseignant introuvable.', 404);

    const document = await db.Document.findOne({
      where: { id: req.params.id, enseignantId: enseignant.id },
    });
    if (!document) return error(res, 'Document introuvable ou non autorisé.', 404);

    if (fs.existsSync(document.url)) fs.unlinkSync(document.url);

    await document.destroy();
    return success(res, {}, 'Document supprimé avec succès.');
  } catch (err) {
    return error(res, err.message || 'Erreur suppression.', 500);
  }
}
// GET /api/documents/telecharger/:id
async function telechargerDocument(req, res) {
  try {
    const document = await db.Document.findByPk(req.params.id, {
      include: [
        {
          model: db.Cours,
          as: 'cours',
          include: [
            {
              model: db.Programme,
              as: 'programme',
              include: [
                {
                  model: db.Promotion,
                  as: 'promotion',
                  include: [
                    { model: db.Specialite, as: 'specialite' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    if (!document) return error(res, 'Document introuvable.', 404);

    // Si étudiant → vérifier filière
    if (req.utilisateur.typeUtilisateur === 'ETUDIANT') {
      const etudiant = await db.Etudiant.findOne({
        where: { utilisateurId: req.utilisateur.id },
      });
      if (!etudiant) return error(res, 'Profil étudiant introuvable.', 404);

      const filiereIdCours = document.cours?.programme?.promotion?.specialite?.filiereId;

      if (!filiereIdCours || etudiant.filiereId !== filiereIdCours) {
        return error(res, 'Accès refusé. Ce cours n\'appartient pas à votre filière.', 403);
      }
    }

    // Incrémenter le compteur
    await document.increment('nbTelechargements');

    // Envoyer le fichier
    const fs = require('fs');
    if (!fs.existsSync(document.url)) {
      return error(res, 'Fichier introuvable sur le serveur.', 404);
    }

    return res.download(document.url, `${document.titre}.pdf`);

  } catch (err) {
    return error(res, err.message || 'Erreur téléchargement.', 500);
  }
}

// ← remplace l'ancien module.exports par celui-ci
module.exports = {
  uploaderDocument,
  getDocumentsByCours,
  getMesDocuments,
  supprimerDocument,
  telechargerDocument,
};

