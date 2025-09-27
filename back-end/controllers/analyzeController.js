const textProcessor = require('../utils/textProcessor');

// POST /api/analyze
// body: { text, requestedGroups (optional) }
exports.analyze = async (req, res) => {
  try {
    const { text = '', requestedGroups } = req.body || {};
    if (!text || !text.trim()) return res.status(400).json({ error: 'Texto não enviado.' });

    const cleaned = textProcessor.limparTexto(text);
    const sentences = textProcessor.dividirFrases(cleaned);

    // Simple grouping: split sentences into roughly equal groups if requested
    let groups = [];
    const nGroups = Math.max(1, Math.min(10, parseInt(requestedGroups, 10) || 1));
    const perGroup = Math.ceil(sentences.length / nGroups);
    for (let i = 0; i < nGroups; i++) {
      const slice = sentences.slice(i * perGroup, (i + 1) * perGroup);
      const groupText = slice.join(' ');
      groups.push({ index: i + 1, text: groupText, sentences: slice, wordCount: (groupText.match(/\S+/g) || []).length, charCount: groupText.length });
    }

    res.json({ jobId: `local-${Date.now()}`, groups, warnings: [] });
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'Erro ao analisar texto.' });
  }
};
