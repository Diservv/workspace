// Express app config
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Rotas de upload/extract
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/', uploadRoutes);


// Rota TTS real
const ttsRoutes = require('./routes/ttsRoutes');
app.use('/', ttsRoutes);

// Analyze API
const analyzeRoutes = require('./routes/analyzeRoutes');
app.use('/', analyzeRoutes);

// Servir arquivos de áudio
app.use('/uploads', express.static(__dirname + '/uploads'));

// Middleware de erros
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ error: 'Erro interno do servidor.' });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`Backend rodando na porta ${PORT}`);
	// Simple cleanup: delete files older than retentionDays in uploads folder
	const retentionDays = parseInt(process.env.UPLOAD_RETENTION_DAYS || '14', 10);
	const uploadsDir = __dirname + '/uploads';
	const msThreshold = retentionDays * 24 * 60 * 60 * 1000;
	setInterval(async () => {
		try {
			const files = require('fs').readdirSync(uploadsDir);
			const now = Date.now();
			for (const f of files) {
				try {
					const full = uploadsDir + '/' + f;
					const stat = require('fs').statSync(full);
					if (now - stat.mtimeMs > msThreshold) {
						require('fs').unlinkSync(full);
						console.log('Removed old upload:', full);
					}
				} catch (e) {
					// ignore per-file errors
				}
			}
		} catch (err) {
			// ignore directory errors
		}
	}, 1000 * 60 * 60); // run hourly
});
