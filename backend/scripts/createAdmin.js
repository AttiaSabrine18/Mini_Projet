'use strict';

require('dotenv').config();
const bcrypt = require('bcrypt');
const db     = require('../models');

async function main() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Connexion MySQL OK');

    await db.sequelize.sync({ alter: true });
    console.log('✅ Tables synchronisées');

    const email = 'attiasabrine450@gmail.com';

    // Vérifier si l'admin existe déjà
    const existant = await db.Utilisateur.findOne({ where: { email } });
    if (existant) {
      console.log('ℹ️  Ce compte existe déjà (id=' + existant.id + ') statut=' + existant.statut);
      process.exit(0);
    }

    // Créer le mot de passe
    const sel         = await bcrypt.genSalt(12);
    const motDePasseH = await bcrypt.hash('Admin@1234', sel);

    // Transaction : Utilisateur + Administrateur
    const result = await db.sequelize.transaction(async (t) => {
      const utilisateur = await db.Utilisateur.create({
        email,
        motDePasse:      motDePasseH,
        sel,
        nom:             'Attia',
        prenom:          'Sabrine',
        typeUtilisateur: 'ADMINISTRATEUR',
        statut:          'ACTIF',
        valideEmail:     true,
      }, { transaction: t });

      console.log('✅ Utilisateur créé id=', utilisateur.id);

      const admin = await db.Administrateur.create({
        utilisateurId: utilisateur.id,
        matricule:     'ADM-001',
        service:       'Direction des Etudes',
        role:          'SUPER_ADMIN',
        niveauAcces:   2,
      }, { transaction: t });

      console.log('✅ Administrateur créé id=', admin.id);

      return { utilisateur, admin };
    });

    console.log('\n══════════════════════════════════════');
    console.log('  ✅ Compte admin créé avec succès !');
    console.log('  Email       :', result.utilisateur.email);
    console.log('  Mot de passe: Admin@1234');
    console.log('  Role        :', result.admin.role);
    console.log('══════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Erreur :', err.message);
    if (err.errors) err.errors.forEach(e => console.error('  -', e.message));
  }

  process.exit(0);
}

main();