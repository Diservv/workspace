// Funções de processamento de texto

const ABBREVIATIONS = [
  'Mr', 'Mrs', 'Ms', 'Dr', 'Sr', 'Sra', 'Srs', 'Prof', 'Ex', 'Av', 'etc', 'i.e', 'e.g'
];

function limparTexto(texto) {
  if (!texto) return '';
  // Normalize line endings and collapse multiple spaces but preserve paragraph breaks
  let t = texto.replace(/\r\n?/g, '\n');
  // Collapse multiple blank lines to maximum two
  t = t.replace(/\n{3,}/g, '\n\n');
  // Trim spaces on each line
  t = t.split('\n').map(l => l.trim()).join('\n');
  // Replace multiple spaces with single space inside lines
  t = t.split('\n').map(l => l.replace(/\s+/g, ' ')).join('\n');
  return t.trim();
}

function dividirFrases(texto) {
  if (!texto) return [];
  // First split by paragraphs
  const paragraphs = texto.split(/\n\n/).map(p => p.trim()).filter(Boolean);
  const sentences = [];
  const sentenceEnd = /([\.\!\?])+\s+/; // naive delimiter

  paragraphs.forEach(par => {
    // Split by sentence-like boundaries but try to avoid common abbreviations
    let remaining = par;
    while (remaining.length) {
      const match = remaining.match(/([\s\S]+?[\.\!\?]+)(\s+|$)/);
      if (!match) {
        sentences.push(remaining.trim());
        break;
      }
      let candidate = match[1].trim();
      // If candidate ends with an abbreviation (e.g., "Dr.") and no space after, treat as not end
      const lastToken = candidate.split(' ').slice(-1)[0].replace(/\.$/, '');
      if (ABBREVIATIONS.map(a => a.toLowerCase()).includes((lastToken || '').toLowerCase())) {
        // join with next part
        const rest = remaining.slice(match.index + match[0].length);
        // find next punctuation to close sentence or fallback
        const nextMatch = rest.match(/([\s\S]+?[\.\!\?]+)(\s+|$)/);
        if (nextMatch) {
          candidate = (candidate + ' ' + nextMatch[1]).trim();
          // advance remaining accordingly
          remaining = rest.slice(nextMatch[0].length);
        } else {
          sentences.push(remaining.trim());
          break;
        }
      } else {
        remaining = remaining.slice(match.index + match[0].length);
      }
      sentences.push(candidate);
    }
  });

  return sentences.filter(Boolean);
}

function repetirBlocos(frases, vezes = 3, separator = ' \n') {
  // Repeat each sentence block with a separator (default newline) to make audio pauses readable
  if (!Array.isArray(frases)) return [];
  const rep = Math.max(1, Math.min(20, parseInt(vezes, 10) || 3));
  return frases.map(f => Array(rep).fill(f).join(separator));
}

module.exports = {
  limparTexto,
  dividirFrases,
  repetirBlocos
};
