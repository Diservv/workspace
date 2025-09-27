const assert = require('assert');
const tp = require('../utils/textProcessor');

function testSplit() {
  const text = 'Dr. Smith went to the store. He bought milk.\n\nNew paragraph here!';
  const cleaned = tp.limparTexto(text);
  const sentences = tp.dividirFrases(cleaned);
  assert(sentences.length >= 3, 'Should split into at least 3 sentences');
  console.log('split test ok');
}

function testRepeat() {
  const s = ['Hello.', 'World.'];
  const rep = tp.repetirBlocos(s, 2, ' \n');
  assert(rep.length === 2, 'repeat length');
  assert(rep[0].includes('Hello.'), 'contains original');
  console.log('repeat test ok');
}

try {
  testSplit();
  testRepeat();
  console.log('ALL TESTS PASSED');
} catch (e) {
  console.error('TEST FAILED', e);
  process.exit(1);
}
