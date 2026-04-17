'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../models');

// GET /api/cours — liste tous les cours
router.get('/', async (req, res) => {
  try {
    const cours = await db.Cours.findAll({
      attributes: ['id', 'nom', 'code'],
      order: [['nom', 'ASC']],
    });
    res.json({ success: true, data: cours });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
