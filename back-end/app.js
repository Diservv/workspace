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
});
