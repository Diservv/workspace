const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const path = require('path');

// Instancia cliente Google TTS
const client = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(__dirname, '../../google-tts-key.json') // coloque sua chave JSON aqui
});

exports.gerarAudio = async (req, res) => {9
  const { text, idioma = 'pt-BR', velocidade = 1.0 } = req.body;
  if (!text) return res.status(400).json({ error: 'Texto não enviado.' });

  const request = {
    input: { text },
    voice: { languageCode: idioma, ssmlGender: 'NEUTRAL' },
    audioConfig: { audioEncoding: 'WAVE', speakingRate: velocidade }
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    const audioFile = `audio_${Date.now()}.WAVE`;
    const audioPath = path.join(__dirname, '../uploads', audioFile);
    await util.promisify(fs.writeFile)(audioPath, response.audioContent, 'binary');
    // Retorna URL local do arquivo
    res.json({ audioUrl: `/uploads/${audioFile}` });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar áudio.' });
  }
};
