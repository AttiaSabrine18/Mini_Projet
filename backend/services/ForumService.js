'use strict';

const db = require('../models');

// ─────────────────────────────────────────────────────────────────────────────
//  POST /forum — Créer un thread (Enseignant seulement) US22
// ─────────────────────────────────────────────────────────────────────────────
async function creerThread(data, utilisateurId) {
  // Récupérer l'enseignant
  const enseignant = await db.Enseignant.findOne({ where: { utilisateurId } });
  if (!enseignant) throw { statusCode: 403, message: 'Profil enseignant introuvable.' };

  const { titre, description, type, coursId, estPrive } = data;

  // Vérifier que le cours existe si fourni
  if (coursId) {
    const cours = await db.Cours.findByPk(coursId);
    if (!cours) throw { statusCode: 404, message: 'Cours introuvable.' };
  }

  const forum = await db.Forum.create({
    titre,
    description:   description || null,
    type:          type        || 'GENERAL',
    estPrive:      estPrive    !== undefined ? estPrive : false,
    dateCreation:  new Date(),
    nbMessages:    0,
    coursId:       coursId    || null,
    createdBy:     enseignant.id,
  });

  // Récupérer avec les associations pour la réponse
  const forumComplet = await db.Forum.findByPk(forum.id, {
    include: [
      {
        model:      db.Enseignant,
        as:         'createur',
        attributes: ['id', 'matricule', 'grade'],
        include:    [{ model: db.Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }],
      },
      {
        model:      db.Cours,
        as:         'cours',
        attributes: ['id', 'nom', 'code'],
        required:   false,
      },
    ],
  });

  return forumComplet;
}

// ─────────────────────────────────────────────────────────────────────────────
//  GET /forum — Liste tous les threads
// ─────────────────────────────────────────────────────────────────────────────
async function getTousLesThreads({ page = 1, limit = 20, type, coursId } = {}) {
  const where  = {};
  if (type)    where.type    = type.toUpperCase();
  if (coursId) where.coursId = parseInt(coursId);

  const offset = (page - 1) * limit;

  const { count, rows } = await db.Forum.findAndCountAll({
    where,
    include: [
      {
        model:      db.Enseignant,
        as:         'createur',
        attributes: ['id', 'matricule'],
        include:    [{ model: db.Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }],
      },
      {
        model:      db.Cours,
        as:         'cours',
        attributes: ['id', 'nom', 'code'],
        required:   false,
      },
    ],
    order:  [['dateCreation', 'DESC']],
    limit:  parseInt(limit),
    offset,
  });

  return {
    total:      count,
    page:       parseInt(page),
    totalPages: Math.ceil(count / limit),
    threads:    rows,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  GET /forum/:id — Détail d'un thread avec tous ses messages (populate)
// ─────────────────────────────────────────────────────────────────────────────
async function getThreadParId(forumId) {
  const forum = await db.Forum.findByPk(forumId, {
    include: [
      // Créateur du forum
      {
        model:      db.Enseignant,
        as:         'createur',
        attributes: ['id', 'matricule', 'grade'],
        include:    [{ model: db.Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom', 'photoProfil'] }],
      },
      // Cours associé
      {
        model:      db.Cours,
        as:         'cours',
        attributes: ['id', 'nom', 'code'],
        required:   false,
      },
      // Tous les messages avec auteur + réponses imbriquées
      {
        model:   db.Message,
        as:      'messages',
        where:   { parentId: null },  // messages racines seulement
        required: false,
        include: [
          // Auteur du message
          {
            model:      db.Utilisateur,
            as:         'auteur',
            attributes: ['id', 'nom', 'prenom', 'typeUtilisateur', 'photoProfil'],
          },
          // Réponses au message (1 niveau)
          {
            model:   db.Message,
            as:      'replies',
            required: false,
            include: [{
              model:      db.Utilisateur,
              as:         'auteur',
              attributes: ['id', 'nom', 'prenom', 'typeUtilisateur', 'photoProfil'],
            }],
            order: [['datePublication', 'ASC']],
          },
        ],
        order: [['datePublication', 'ASC']],
      },
    ],
  });

  if (!forum) throw { statusCode: 404, message: 'Thread introuvable.' };

  return forum;
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /forum/:id/messages — Répondre à un thread (tous les rôles)
// ─────────────────────────────────────────────────────────────────────────────
async function ajouterMessage(forumId, contenu, auteurId, parentId = null) {
  const forum = await db.Forum.findByPk(forumId);
  if (!forum) throw { statusCode: 404, message: 'Thread introuvable.' };

  const message = await db.Message.create({
    contenu,
    datePublication: new Date(),
    nbLikes:         0,
    forumId:         parseInt(forumId),
    auteurId,
    parentId:        parentId || null,
  });

  // Incrémenter le compteur de messages
  await forum.update({ nbMessages: forum.nbMessages + 1 });

  // Récupérer avec auteur pour la réponse
  const messageComplet = await db.Message.findByPk(message.id, {
    include: [{
      model:      db.Utilisateur,
      as:         'auteur',
      attributes: ['id', 'nom', 'prenom', 'typeUtilisateur'],
    }],
  });

  return messageComplet;
}

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /forum/:id — Supprimer un thread (créateur ou admin)
// ─────────────────────────────────────────────────────────────────────────────
async function supprimerThread(forumId, utilisateurId, typeUtilisateur) {
  const forum = await db.Forum.findByPk(forumId, {
    include: [{ model: db.Enseignant, as: 'createur' }],
  });

  if (!forum) throw { statusCode: 404, message: 'Thread introuvable.' };

  // Vérifier que c'est le créateur ou un admin
  const estAdmin = typeUtilisateur === 'ADMINISTRATEUR';
  const estCreateur = forum.createur?.utilisateurId === utilisateurId;

  if (!estAdmin && !estCreateur) {
    throw { statusCode: 403, message: 'Vous ne pouvez supprimer que vos propres threads.' };
  }

  await forum.destroy();
  return { message: 'Thread supprimé avec succès.' };
}

module.exports = {
  creerThread,
  getTousLesThreads,
  getThreadParId,
  ajouterMessage,
  supprimerThread,
};