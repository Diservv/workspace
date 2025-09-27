const express = require('express');
const router = express.Router();
const analyzeController = require('../controllers/analyzeController');

router.post('/api/analyze', express.json(), analyzeController.analyze);

module.exports = router;
