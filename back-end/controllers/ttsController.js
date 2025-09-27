const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const path = require('path');
const axios = require('axios');

// Instantiate client: if GOOGLE_APPLICATION_CREDENTIALS is set, SDK will use it.
// Optionally support GOOGLE_CREDENTIALS_JSON env var containing the JSON payload.
let clientOptions = {};
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  try {
    const os = require('os');
    const tmpPath = path.join(os.tmpdir(), `.google_creds_${Date.now()}.json`);
    fs.writeFileSync(tmpPath, process.env.GOOGLE_CREDENTIALS_JSON);
    clientOptions.keyFilename = tmpPath;
  } catch (e) {
    console.warn('Could not write GOOGLE_CREDENTIALS_JSON to disk:', e.message);
  }
}
const client = new textToSpeech.TextToSpeechClient(clientOptions);

// Limits
const SOFT_WORD_LIMIT = 5000;
const HARD_WORD_LIMIT = 10000;

// Chunking settings (words per chunk)
const DEFAULT_MAX_WORDS_PER_CHUNK = 500; // safe default, adjust as needed

function chunkByWords(text, maxWords = DEFAULT_MAX_WORDS_PER_CHUNK) {
  const words = (text || '').split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return [words.join(' ')];
  const chunks = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  return chunks;
}

function countWords(s) {
  if (!s) return 0;
  return (s.trim().match(/\S+/g) || []).length;
}

function safeFileName(base) {
  return base.replace(/[^a-z0-9_\-\.]/gi, '_');
}

exports.gerarAudio = async (req, res) => {
  const { text, idioma = 'pt-BR', velocidade = 1.0, repeticoes = 1 } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Texto não enviado.' });

  const words = countWords(text);
  if (words > HARD_WORD_LIMIT) return res.status(400).json({ error: `Texto maior que o limite de ${HARD_WORD_LIMIT} palavras.` });
  if (words > SOFT_WORD_LIMIT) {
    console.warn(`Aviso: texto com ${words} palavras > soft limit ${SOFT_WORD_LIMIT}`);
  }

  // If repetitions requested, repeat text server-side with a separator to ensure pauses
  const rep = Math.max(1, Math.min(20, parseInt(repeticoes, 10) || 1));
  const finalText = Array(rep).fill(text).join('\n\n');

  const request = {
    input: { text: finalText },
    voice: { languageCode: idioma, ssmlGender: 'NEUTRAL' },
    audioConfig: { audioEncoding: 'MP3', speakingRate: parseFloat(velocidade) || 1.0 }
  };

  try {
    // Select provider explicitly if TTS_PROVIDER is set, otherwise prefer ELEVENLABS if API key present
    const provider = (process.env.TTS_PROVIDER || (process.env.ELEVENLABS_API_KEY ? 'eleven' : 'google')).toLowerCase();

    // Chunk finalText to avoid provider input limits
    const maxWords = parseInt(process.env.MAX_WORDS_PER_CHUNK || DEFAULT_MAX_WORDS_PER_CHUNK, 10);
    const chunks = chunkByWords(finalText, maxWords);
    const audioUrls = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk.trim()) continue;

      if (provider === 'eleven') {
        if (!process.env.ELEVENLABS_API_KEY) return res.status(500).json({ error: 'ELEVENLABS_API_KEY não configurado.' });
        const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
        const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
        const headers = {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        };
        const body = { text: chunk, model: 'eleven_monolingual_v1', voice: voiceId };
        const elevenRes = await axios.post(elevenUrl, body, { headers, responseType: 'arraybuffer' });
        const audioFile = safeFileName(`eleven_audio_${Date.now()}_${i}.mp3`);
        const audioPath = path.join(__dirname, '../uploads', audioFile);
        await util.promisify(fs.writeFile)(audioPath, elevenRes.data, 'binary');
        audioUrls.push(`/uploads/${audioFile}`);
      } else if (provider === 'google') {
        // Google synthesize per chunk
        const requestChunk = {
          input: { text: chunk },
          voice: { languageCode: idioma, ssmlGender: 'NEUTRAL' },
          audioConfig: { audioEncoding: 'MP3', speakingRate: parseFloat(velocidade) || 1.0 }
        };
        const [response] = await client.synthesizeSpeech(requestChunk);
        const audioFile = safeFileName(`google_audio_${Date.now()}_${i}.mp3`);
        const audioPath = path.join(__dirname, '../uploads', audioFile);
        await util.promisify(fs.writeFile)(audioPath, response.audioContent, 'binary');
        audioUrls.push(`/uploads/${audioFile}`);
      } else {
        return res.status(400).json({ error: `TTS provider desconhecido: ${provider}` });
      }
    }

    if (audioUrls.length === 0) return res.status(500).json({ error: 'Nenhum áudio gerado.' });
    // Backwards compatible: audioUrl as first item, and audioUrls array
    res.json({ audioUrl: audioUrls[0], audioUrls });
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ error: 'Erro ao gerar áudio.' });
  }
};
