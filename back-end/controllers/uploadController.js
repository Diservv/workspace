const path = require('path');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const textProcessor = require('../utils/textProcessor');

exports.uploadPDF = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado.' });
  res.json({ filename: req.file.filename, originalname: req.file.originalname });
};

exports.extractText = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado.' });
  const filePath = path.join(__dirname, '../uploads', req.file.filename);
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    // Processa texto extraído
    const textoLimpo = textProcessor.limparTexto(data.text);
    const frases = textProcessor.dividirFrases(textoLimpo);
    const frasesRepetidas = textProcessor.repetirBlocos(frases, 3);
    res.json({ text: textoLimpo, frases, frasesRepetidas });
  } catch (err) {
    console.error('Extract error:', err);
    res.status(500).json({ error: 'Erro ao extrair texto.' });
  }
};
