const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const uploadController = require('../controllers/uploadController');

const upload = multer({ dest: path.join(__dirname, '../uploads/') });

router.post('/upload', upload.single('pdf'), uploadController.uploadPDF);
router.post('/extract', upload.single('pdf'), uploadController.extractText);

module.exports = router;
