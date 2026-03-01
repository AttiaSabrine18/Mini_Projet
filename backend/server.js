'use strict';

require('dotenv').config();
const app = require('./app');
const db  = require('./models');

const PORT = process.env.PORT || 3000;

async function demarrerServeur() {
  try {
    // 1. Tester la connexion MySQL
    await db.sequelize.authenticate();
    console.log('✅ Connexion MySQL (XAMPP) établie');

    // 2. Synchroniser les modèles (alter:true = met à jour sans supprimer)
    await db.sequelize.sync({ alter: true });
    console.log('✅ Modèles synchronisés avec la base de données');

    // 3. Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`📋 Health check : http://localhost:${PORT}/health`);
      console.log(`🔐 Auth API     : http://localhost:${PORT}/api/auth`);
      console.log(`🌍 Environnement : ${process.env.NODE_ENV || 'development'}\n`);
    });

  } catch (err) {
    console.error('❌ Impossible de démarrer le serveur :', err.message);
    process.exit(1);
  }
}

demarrerServeur();
