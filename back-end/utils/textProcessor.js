// Funções de processamento de texto

function dividirFrases(texto) {
  // Divide por pontuação comum
  return texto.match(/[^.!?\r\n]+[.!?\r\n]*/g) || [];
}

function repetirBlocos(frases, vezes = 3) {
  // Repete cada bloco de frases
  return frases.map(f => f.repeat(vezes));
}

function limparTexto(texto) {
  // Remove espaços extras e normaliza quebras
  return texto.replace(/\s+/g, ' ').replace(/\n/g, '\n').trim();
}

module.exports = {
  dividirFrases,
  repetirBlocos,
  limparTexto
};
