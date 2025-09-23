const express = require('express');
const router = express.Router();
const ttsController = require('../controllers/ttsController');

router.post('/tts', ttsController.gerarAudio);

module.exports = router;
