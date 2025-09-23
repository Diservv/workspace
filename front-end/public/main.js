// Funções utilitárias localStorage
function salvarProjeto(data) {
  localStorage.setItem('ultimoProjeto', JSON.stringify(data));
}
function carregarProjeto() {
  const data = localStorage.getItem('ultimoProjeto');
  return data ? JSON.parse(data) : null;
}

// Elementos DOM
const uploadForm = document.getElementById('uploadForm');
const pdfInput = document.getElementById('pdfInput');
const textoExtraido = document.getElementById('textoExtraido');
const gerarAudioBtn = document.getElementById('gerarAudio');
const audioPlayer = document.getElementById('audioPlayer');
const repeticoesInput = document.getElementById('repeticoes');
const velocidadeInput = document.getElementById('velocidade');
const idiomaSelect = document.getElementById('idioma');

// Permitir edição manual do texto extraído
textoExtraido.removeAttribute('readonly');

// Carregar último projeto
window.onload = () => {
  const projeto = carregarProjeto();
  if (projeto) {
    textoExtraido.value = projeto.texto || '';
    audioPlayer.src = projeto.audioUrl || '';
    if (projeto.audioUrl) audioPlayer.style.display = 'block';
  }
};

// Upload PDF e extração de texto
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = pdfInput.files[0];
  if (!file) return alert('Selecione um PDF!');
  const formData = new FormData();
  formData.append('pdf', file);
  // Upload
  const uploadRes = await fetch('http://localhost:3001/upload', {
    method: 'POST',
    body: formData
  });
  const uploadData = await uploadRes.json();
  // Extração
  const extractRes = await fetch('http://localhost:3001/extract', {
    method: 'POST',
    body: formData
  });
  const extractData = await extractRes.json();
  textoExtraido.value = extractData.text;
  salvarProjeto({ texto: extractData.text });
});

// Gerar áudio
gerarAudioBtn.addEventListener('click', async () => {
  const texto = textoExtraido.value;
  const repeticoes = parseInt(repeticoesInput.value) || 3;
  const velocidade = parseFloat(velocidadeInput.value) || 1;
  const idioma = idiomaSelect.value;
  if (!texto) return alert('Texto vazio!');
  // Chamada TTS
  const ttsRes = await fetch('http://localhost:3001/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: texto, repeticoes, velocidade, idioma })
  });
  const ttsData = await ttsRes.json();
  audioPlayer.src = ttsData.audioUrl;
  audioPlayer.style.display = 'block';
  salvarProjeto({ texto, audioUrl: ttsData.audioUrl });
});
