'use strict';

require('dotenv').config();
const bcrypt = require('bcrypt');
const db     = require('../models');

async function main() {
  try {
    await db.sequelize.authenticate();
    console.log('Connexion MySQL OK');

    const email = 'prof.martin@univ.tn';

    // Supprimer l'ancien si mal créé
    const existant = await db.Utilisateur.findOne({ where: { email } });
    if (existant) {
      console.log('Compte existant trouvé id=' + existant.id + ' — suppression...');
      await existant.destroy();
      console.log('Supprimé.');
    }

    const sel         = await bcrypt.genSalt(12);
    const motDePasseH = await bcrypt.hash('Prof@1234', sel);

    const result = await db.sequelize.transaction(async (t) => {
      const utilisateur = await db.Utilisateur.create({
        email,
        motDePasse:      motDePasseH,
        sel,
        nom:             'Martin',
        prenom:          'Paul',
        typeUtilisateur: 'ENSEIGNANT',
        statut:          'ACTIF',
        valideEmail:     true,
      }, { transaction: t });

      console.log('Utilisateur créé id=' + utilisateur.id);

      const enseignant = await db.Enseignant.create({
        utilisateurId: utilisateur.id,
        matricule:     'ENS-002',
        grade:         'Professeur',
        specialite:    'Mathématiques',
      }, { transaction: t });

      console.log('Enseignant créé id=' + enseignant.id);

      return { utilisateur, enseignant };
    });

    console.log('\n══════════════════════════════════════');
    console.log('  Enseignant créé avec succès !');
    console.log('  Email       :', result.utilisateur.email);
    console.log('  Mot de passe: Prof@1234');
    console.log('  Matricule   :', result.enseignant.matricule);
    console.log('══════════════════════════════════════\n');

  } catch (err) {
    console.error('Erreur :', err.message);
    if (err.errors) err.errors.forEach(e => console.error(' -', e.message));
  }

  process.exit(0);
}

main();