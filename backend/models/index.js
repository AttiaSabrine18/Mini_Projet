'use strict';

const sequelize = require('../config/database');

// ─── Import Models ────────────────────────────────────────────────────────────
const Utilisateur    = require('./Utilisateur')(sequelize);
const Administrateur = require('./Administrateur')(sequelize);
const Enseignant     = require('./Enseignant')(sequelize);
const Etudiant       = require('./Etudiant')(sequelize);
const Filiere        = require('./Filiere')(sequelize);
const Specialite     = require('./Specialite')(sequelize);
const Promotion      = require('./Promotion')(sequelize);
const Programme      = require('./Programme')(sequelize);
const EmploiTemps    = require('./EmploiTemps')(sequelize);
const Salle          = require('./Salle')(sequelize);
const Session        = require('./Session')(sequelize);
const Cours          = require('./Cours')(sequelize);
const Module         = require('./Module')(sequelize);
const Inscription    = require('./Inscription')(sequelize);
const Presence       = require('./Presence')(sequelize);
const Examen         = require('./Examen')(sequelize);
const Note           = require('./Note')(sequelize);
const Document       = require('./Document')(sequelize);
const Forum          = require('./Forum')(sequelize);
const Message        = require('./Message')(sequelize);
const OAuthClient    = require('./OAuthClient')(sequelize);
const OAuthToken     = require('./OAuthToken')(sequelize);
const OAuthCode      = require('./OAuthCode')(sequelize);

// ─── Utilisateur associations ─────────────────────────────────────────────────
Utilisateur.hasOne(Administrateur, { foreignKey: 'utilisateurId', as: 'administrateur', onDelete: 'CASCADE' });
Administrateur.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' });

Utilisateur.hasOne(Enseignant, { foreignKey: 'utilisateurId', as: 'enseignant', onDelete: 'CASCADE' });
Enseignant.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' });

Utilisateur.hasOne(Etudiant, { foreignKey: 'utilisateurId', as: 'etudiant', onDelete: 'CASCADE' });
Etudiant.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' });

Utilisateur.hasMany(Message, { foreignKey: 'auteurId', as: 'messages' });
Message.belongsTo(Utilisateur, { foreignKey: 'auteurId', as: 'auteur' });

Utilisateur.hasMany(OAuthCode,  { foreignKey: 'utilisateurId', as: 'oauthCodes',  onDelete: 'CASCADE' });
OAuthCode.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'user' });

Utilisateur.hasMany(OAuthToken, { foreignKey: 'utilisateurId', as: 'oauthTokens', onDelete: 'CASCADE' });
OAuthToken.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'user' });

// ─── Filiere associations ─────────────────────────────────────────────────────
Filiere.hasMany(Etudiant,  { foreignKey: 'filiereId', as: 'etudiants' });
Etudiant.belongsTo(Filiere, { foreignKey: 'filiereId', as: 'filiere' });

Filiere.belongsTo(Enseignant, { foreignKey: 'responsableId', as: 'responsable' });
Enseignant.hasOne(Filiere,    { foreignKey: 'responsableId', as: 'filiereResponsable' });

Filiere.hasMany(Specialite,  { foreignKey: 'filiereId', as: 'specialites' });
Specialite.belongsTo(Filiere, { foreignKey: 'filiereId', as: 'filiere' });

// ─── Specialite associations ──────────────────────────────────────────────────
Specialite.belongsTo(Enseignant, { foreignKey: 'responsableId', as: 'responsable' });
Enseignant.hasMany(Specialite,   { foreignKey: 'responsableId', as: 'specialites' });

Specialite.hasMany(Promotion,  { foreignKey: 'specialiteId', as: 'promotions' });
Promotion.belongsTo(Specialite, { foreignKey: 'specialiteId', as: 'specialite' });

// ─── Promotion associations ───────────────────────────────────────────────────
Promotion.belongsTo(Enseignant, { foreignKey: 'responsableId', as: 'responsable' });
Enseignant.hasMany(Promotion,   { foreignKey: 'responsableId', as: 'promotions' });

Promotion.hasMany(EmploiTemps,  { foreignKey: 'promotionId', as: 'emploisTemps' });
EmploiTemps.belongsTo(Promotion, { foreignKey: 'promotionId', as: 'promotion' });

Promotion.hasMany(Inscription,  { foreignKey: 'promotionId', as: 'inscriptions' });
Inscription.belongsTo(Promotion, { foreignKey: 'promotionId', as: 'promotion' });

Promotion.hasMany(Programme,  { foreignKey: 'promotionId', as: 'programmes' });
Programme.belongsTo(Promotion, { foreignKey: 'promotionId', as: 'promotion' });

// ─── Programme associations ───────────────────────────────────────────────────
Programme.hasMany(Cours,  { foreignKey: 'programmeId', as: 'cours' });
Cours.belongsTo(Programme, { foreignKey: 'programmeId', as: 'programme' });

// ─── EmploiTemps associations ─────────────────────────────────────────────────
EmploiTemps.hasMany(Session,  { foreignKey: 'emploiTempsId', as: 'sessions' });
Session.belongsTo(EmploiTemps, { foreignKey: 'emploiTempsId', as: 'emploiTemps' });

// ─── Salle associations ───────────────────────────────────────────────────────
Salle.hasMany(Session,  { foreignKey: 'salleId', as: 'sessions' });
Session.belongsTo(Salle, { foreignKey: 'salleId', as: 'salle' });

// ─── Enseignant associations ──────────────────────────────────────────────────
Enseignant.hasMany(Cours,   { foreignKey: 'enseignantPrincipalId', as: 'coursEnseignes' });
Cours.belongsTo(Enseignant, { foreignKey: 'enseignantPrincipalId', as: 'enseignantPrincipal' });

Enseignant.hasMany(Session,   { foreignKey: 'enseignantId', as: 'sessionsAnimees' });
Session.belongsTo(Enseignant, { foreignKey: 'enseignantId', as: 'enseignant' });

Enseignant.hasMany(Examen,   { foreignKey: 'enseignantId', as: 'examensSurveilles' });
Examen.belongsTo(Enseignant, { foreignKey: 'enseignantId', as: 'enseignant' });

Enseignant.hasMany(Document,   { foreignKey: 'enseignantId', as: 'documentsDeposes' });
Document.belongsTo(Enseignant, { foreignKey: 'enseignantId', as: 'enseignant' });

Enseignant.hasMany(Forum,   { foreignKey: 'createdBy', as: 'forumsCrees' });
Forum.belongsTo(Enseignant, { foreignKey: 'createdBy', as: 'createur' });

Enseignant.hasMany(Module,   { foreignKey: 'enseignantPrincipalId', as: 'modules' });
Module.belongsTo(Enseignant, { foreignKey: 'enseignantPrincipalId', as: 'enseignantPrincipal' });

Enseignant.hasMany(Presence,   { foreignKey: 'marquePar', as: 'presencesMarquees' });
Presence.belongsTo(Enseignant, { foreignKey: 'marquePar', as: 'enseignant' });

// ─── Cours associations ───────────────────────────────────────────────────────
Cours.hasMany(Document,   { foreignKey: 'coursId', as: 'documents' });
Document.belongsTo(Cours, { foreignKey: 'coursId', as: 'cours' });

Cours.hasMany(Forum,   { foreignKey: 'coursId', as: 'forums' });
Forum.belongsTo(Cours, { foreignKey: 'coursId', as: 'cours' });

Cours.hasMany(Inscription,   { foreignKey: 'coursId', as: 'inscriptions' });
Inscription.belongsTo(Cours, { foreignKey: 'coursId', as: 'cours' });

Cours.hasMany(Module,   { foreignKey: 'coursId', as: 'modules' });
Module.belongsTo(Cours, { foreignKey: 'coursId', as: 'cours' });

Cours.hasMany(Session,   { foreignKey: 'coursId', as: 'seances' });
Session.belongsTo(Cours, { foreignKey: 'coursId', as: 'cours' });

// ─── Module associations ──────────────────────────────────────────────────────
Module.hasMany(Document,   { foreignKey: 'moduleId', as: 'documents' });
Document.belongsTo(Module, { foreignKey: 'moduleId', as: 'module' });

Module.hasMany(Examen,   { foreignKey: 'moduleId', as: 'examens' });
Examen.belongsTo(Module, { foreignKey: 'moduleId', as: 'module' });

Module.hasMany(Session,   { foreignKey: 'moduleId', as: 'sessions' });
Session.belongsTo(Module, { foreignKey: 'moduleId', as: 'module' });

// ─── Session associations ─────────────────────────────────────────────────────
Session.hasMany(Presence,   { foreignKey: 'sessionId', as: 'presences' });
Presence.belongsTo(Session, { foreignKey: 'sessionId', as: 'session' });

// ─── Etudiant associations ────────────────────────────────────────────────────
Etudiant.hasMany(Document,   { foreignKey: 'etudiantId', as: 'documents' });
Document.belongsTo(Etudiant, { foreignKey: 'etudiantId', as: 'etudiant' });

Etudiant.hasMany(Inscription,   { foreignKey: 'etudiantId', as: 'inscriptions' });
Inscription.belongsTo(Etudiant, { foreignKey: 'etudiantId', as: 'etudiant' });

Etudiant.hasMany(Note,   { foreignKey: 'etudiantId', as: 'notes' });
Note.belongsTo(Etudiant, { foreignKey: 'etudiantId', as: 'etudiant' });

Etudiant.hasMany(Presence,   { foreignKey: 'etudiantId', as: 'presences' });
Presence.belongsTo(Etudiant, { foreignKey: 'etudiantId', as: 'etudiant' });

// ─── Examen associations ──────────────────────────────────────────────────────
Examen.hasMany(Note,   { foreignKey: 'examenId', as: 'notes' });
Note.belongsTo(Examen, { foreignKey: 'examenId', as: 'examen' });

// ─── Forum associations ───────────────────────────────────────────────────────
Forum.hasMany(Message,   { foreignKey: 'forumId', as: 'messages' });
Message.belongsTo(Forum, { foreignKey: 'forumId', as: 'forum' });

// ─── Message self-referencing (replies) ───────────────────────────────────────
Message.hasMany(Message,   { foreignKey: 'parentId', as: 'replies' });
Message.belongsTo(Message, { foreignKey: 'parentId', as: 'parent' });

// ─── OAuthClient associations ─────────────────────────────────────────────────
OAuthClient.hasMany(OAuthCode,  { foreignKey: 'clientId', as: 'codes',  onDelete: 'CASCADE' });
OAuthCode.belongsTo(OAuthClient, { foreignKey: 'clientId', as: 'client' });

OAuthClient.hasMany(OAuthToken, { foreignKey: 'clientId', as: 'tokens', onDelete: 'CASCADE' });
OAuthToken.belongsTo(OAuthClient, { foreignKey: 'clientId', as: 'client' });

module.exports = {
  sequelize,
  Utilisateur,
  Administrateur,
  Enseignant,
  Etudiant,
  Filiere,
  Specialite,
  Promotion,
  Programme,
  EmploiTemps,
  Salle,
  Session,
  Cours,
  Module,
  Inscription,
  Presence,
  Examen,
  Note,
  Document,
  Forum,
  Message,
  OAuthClient,
  OAuthToken,
  OAuthCode,
};
