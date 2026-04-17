'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../models');
const { authentifier } = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

router.use(authentifier);

router.get('/', isAdmin, async (req, res) => {
  try {
    const promotions = await db.Promotion.findAll({
      where: { estActive: true },
      attributes: ['id', 'code', 'niveau', 'anneeUniversitaire', 'effectifReel', 'groupes'],
      include: [{
        model: db.Specialite,
        as: 'specialite',
        attributes: ['nom'],
        include: [{ model: db.Filiere, as: 'filiere', attributes: ['nom'] }],
      }],
      order: [['niveau', 'ASC']],
    });
    res.json({ success: true, data: promotions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
