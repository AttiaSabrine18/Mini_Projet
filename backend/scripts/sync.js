'use strict';

require('dotenv').config();
const db = require('../models');

async function sync() {
  try {
    console.log('⏳ Connexion à MySQL (XAMPP)...');
    await db.sequelize.authenticate();
    console.log('✅ Connexion réussie');

    console.log('⏳ Synchronisation des tables...');
    await db.sequelize.sync({ alter: true });
    console.log('✅ Toutes les tables sont synchronisées\n');

    // Lister les tables créées
    const [tables] = await db.sequelize.query('SHOW TABLES');
    console.log('📋 Tables en base :');
    tables.forEach(t => console.log('   -', Object.values(t)[0]));

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur de synchronisation :', err.message);
    process.exit(1);
  }
}

sync();
