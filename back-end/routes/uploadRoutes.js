const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const uploadController = require('../controllers/uploadController');

// Multer config: accept only PDFs up to 20MB
const upload = multer({ 
	dest: path.join(__dirname, '../uploads/'),
	limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
	fileFilter: (req, file, cb) => {
		const allowed = ['application/pdf'];
		if (allowed.includes(file.mimetype)) cb(null, true);
		else cb(new Error('Apenas arquivos PDF são aceitos.'));
	}
});

router.post('/upload', upload.single('pdf'), uploadController.uploadPDF);
router.post('/extract', upload.single('pdf'), uploadController.extractText);

module.exports = router;
