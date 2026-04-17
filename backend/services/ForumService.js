'use strict';

const db = require('../models');

// ─────────────────────────────────────────────────────────────────────────────
//  Shared include: Cours → Programme → Promotion
// ─────────────────────────────────────────────────────────────────────────────
const coursInclude = {
  model:      db.Cours,
  as:         'cours',
  required:   false,
  attributes: ['id', 'nom', 'code'],
  include: [{
    model:      db.Programme,
    as:         'programme',
    required:   false,
    attributes: ['id'],
    include: [{
      model:      db.Promotion,
      as:         'promotion',
      required:   false,
      attributes: ['id', 'niveau', 'anneeUniversitaire'],
    }],
  }],
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /forum — Créer un thread (Enseignant seulement)
// ─────────────────────────────────────────────────────────────────────────────
async function creerThread(data, utilisateurId) {
  const enseignant = await db.Enseignant.findOne({ where: { utilisateurId } });
  if (!enseignant) throw { statusCode: 403, message: 'Profil enseignant introuvable.' };

  const { titre, description, type, coursId, estPrive } = data;

  if (coursId) {
    const cours = await db.Cours.findByPk(coursId);
    if (!cours) throw { statusCode: 404, message: 'Cours introuvable.' };
  }

  const forum = await db.Forum.create({
    titre,
    description:  description || null,
    type:         type        || 'GENERAL',
    estPrive:     estPrive !== undefined ? estPrive : false,
    dateCreation: new Date(),
    nbMessages:   0,
    coursId:      coursId || null,
    createdBy:    enseignant.id,
  });

  return db.Forum.findByPk(forum.id, {
    include: [
      {
        model:      db.Enseignant,
        as:         'createur',
        attributes: ['id', 'matricule', 'grade'],
        include:    [{ model: db.Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }],
      },
      coursInclude,
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  GET /forum — Liste tous les threads
// ─────────────────────────────────────────────────────────────────────────────
async function getTousLesThreads({ page = 1, limit = 20, type, coursId } = {}) {
  const where  = {};
  if (type)    where.type    = type.toUpperCase();
  if (coursId) where.coursId = parseInt(coursId);

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { count, rows } = await db.Forum.findAndCountAll({
    where,
    include: [
      {
        model:      db.Enseignant,
        as:         'createur',
        attributes: ['id', 'matricule'],
        include:    [{ model: db.Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }],
      },
      coursInclude,
    ],
    order:    [['dateCreation', 'DESC']],
    limit:    parseInt(limit),
    offset,
    distinct: true,
  });

  return {
    total:      count,
    page:       parseInt(page),
    totalPages: Math.ceil(count / parseInt(limit)),
    threads:    rows,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  GET /forum/:id — Thread + toutes ses réponses
// ─────────────────────────────────────────────────────────────────────────────
async function getThreadParId(forumId) {
  const messageIncludes = [
    {
      model:      db.Utilisateur,
      as:         'auteur',
      attributes: ['id', 'nom', 'prenom', 'typeUtilisateur', 'photoProfil'],
    },
    {
      model:    db.Message,
      as:       'replies',
      required: false,
      include: [{
        model:      db.Utilisateur,
        as:         'auteur',
        attributes: ['id', 'nom', 'prenom', 'typeUtilisateur', 'photoProfil'],
      }],
    },
  ];

  if (db.Attachment) {
    messageIncludes.push({
      model:    db.Attachment,
      as:       'attachments',
      required: false,
    });
  }

  const forum = await db.Forum.findByPk(forumId, {
    include: [
      {
        model:      db.Enseignant,
        as:         'createur',
        attributes: ['id', 'utilisateurId', 'matricule', 'grade'],
        include:    [{ model: db.Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom', 'photoProfil'] }],
      },
      coursInclude,
      {
        model:    db.Message,
        as:       'messages',
        where:    { parentId: null },
        required: false,
        include:  messageIncludes,
        order:    [['datePublication', 'ASC']],
      },
    ],
  });

  if (!forum) throw { statusCode: 404, message: 'Thread introuvable.' };

  return {
    id:           forum.id,
    titre:        forum.titre,
    description:  forum.description,
    type:         forum.type,
    estPrive:     forum.estPrive,
    dateCreation: forum.dateCreation,
    nbReponses:   forum.nbMessages,
    createur: forum.createur ? {
      id:            forum.createur.id,
      utilisateurId: forum.createur.utilisateurId,
      nom:           forum.createur.utilisateur?.nom,
      prenom:        forum.createur.utilisateur?.prenom,
      matricule:     forum.createur.matricule,
      grade:         forum.createur.grade,
    } : null,
    cours: forum.cours
      ? { id: forum.cours.id, nom: forum.cours.nom, code: forum.cours.code }
      : null,
    reponses: (forum.messages || []).map(msg => ({
      id:              msg.id,
      contenu:         msg.contenu,
      datePublication: msg.datePublication,
      auteurId:        msg.auteurId,
      nbLikes:         msg.nbLikes || 0,
      attachments:     (msg.attachments || []).map(a => ({
        id:       a.id,
        filename: a.filename,
        filepath: a.filepath,
        mimetype: a.mimetype,
        filesize: a.filesize,
      })),
      auteur: {
        id:              msg.auteur?.id,
        nom:             msg.auteur?.nom,
        prenom:          msg.auteur?.prenom,
        typeUtilisateur: msg.auteur?.typeUtilisateur,
      },
      sousReponses: (msg.replies || []).map(r => ({
        id:              r.id,
        contenu:         r.contenu,
        datePublication: r.datePublication,
        auteurId:        r.auteurId,
        auteur: {
          id:              r.auteur?.id,
          nom:             r.auteur?.nom,
          prenom:          r.auteur?.prenom,
          typeUtilisateur: r.auteur?.typeUtilisateur,
        },
      })),
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /forum/:id/reponse
// ─────────────────────────────────────────────────────────────────────────────
async function ajouterReponse(forumId, contenu, auteurId, parentId = null, files = []) {
  const forum = await db.Forum.findByPk(forumId);
  if (!forum) throw { statusCode: 404, message: 'Thread introuvable.' };

  const message = await db.Message.create({
    contenu,
    datePublication: new Date(),
    nbLikes:         0,
    forumId:         parseInt(forumId),
    auteurId,
    parentId:        parentId ? parseInt(parentId) : null,
  });

  let savedAttachments = [];
  if (db.Attachment && files && files.length > 0) {
    savedAttachments = await db.Attachment.bulkCreate(
      files.map(file => ({
        filename:  file.originalname,
        filepath:  file.filename,
        mimetype:  file.mimetype,
        filesize:  file.size,
        messageId: message.id,
      }))
    );
  }

  await forum.update({ nbMessages: forum.nbMessages + 1 });

  const fetchIncludes = [{
    model:      db.Utilisateur,
    as:         'auteur',
    attributes: ['id', 'nom', 'prenom', 'typeUtilisateur'],
  }];
  if (db.Attachment) {
    fetchIncludes.push({ model: db.Attachment, as: 'attachments', required: false });
  }

  const reponseComplete = await db.Message.findByPk(message.id, { include: fetchIncludes });

  return {
    id:              reponseComplete.id,
    contenu:         reponseComplete.contenu,
    datePublication: reponseComplete.datePublication,
    parentId:        reponseComplete.parentId,
    auteurId:        reponseComplete.auteurId,
    nbLikes:         reponseComplete.nbLikes || 0,
    attachments:     (reponseComplete.attachments || savedAttachments).map(a => ({
      id:       a.id,
      filename: a.filename,
      filepath: a.filepath,
      mimetype: a.mimetype,
      filesize: a.filesize,
    })),
    auteur: {
      id:              reponseComplete.auteur?.id,
      nom:             reponseComplete.auteur?.nom,
      prenom:          reponseComplete.auteur?.prenom,
      typeUtilisateur: reponseComplete.auteur?.typeUtilisateur,
    },
  };
}

const ajouterMessage = ajouterReponse;

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /forum/:id
// ─────────────────────────────────────────────────────────────────────────────
async function supprimerThread(forumId, utilisateurId, typeUtilisateur) {
  const forum = await db.Forum.findByPk(forumId, {
    include: [{ model: db.Enseignant, as: 'createur' }],
  });

  if (!forum) throw { statusCode: 404, message: 'Thread introuvable.' };

  const estAdmin    = typeUtilisateur === 'ADMINISTRATEUR';
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
  ajouterReponse,
  ajouterMessage,
  supprimerThread,
};
