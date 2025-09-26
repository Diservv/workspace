// Simple persistence (IndexedDB fallback to localStorage)
const DB_NAME = 'dictation_app_v1';
const STORE = 'projects';

function openDb() {
  return new Promise((resolve) => {
    if (!window.indexedDB) return resolve(null);
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function salvarProjeto(data) {
  const db = await openDb();
  if (db) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const req = store.put(data);
      req.onsuccess = () => {
        // wait for transaction to complete
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction error'));
      tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
    });
  }
  localStorage.setItem('ultimoProjeto', JSON.stringify(data));
}

async function carregarProjeto() {
  const db = await openDb();
  if (db) {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result || []).slice(-1)[0] || null);
      req.onerror = () => resolve(null);
    });
  }
  const data = localStorage.getItem('ultimoProjeto');
  return data ? JSON.parse(data) : null;
}

// DOM elements for new UI
const uploadForm = document.getElementById('uploadForm');
const pdfInput = document.getElementById('pdfInput');
const textoExtraido = document.getElementById('textoExtraido');
const wordCounter = document.getElementById('wordCounter');
const btnNext = document.getElementById('btnNext');
const stepInput = document.getElementById('step-input');
const stepConfig = document.getElementById('step-config');
const groupsCountInput = document.getElementById('groupsCount');
const groupsContainer = document.getElementById('groupsContainer');
const btnDictate = document.getElementById('btnDictate');
const btnBack = document.getElementById('btnBack');
const globalSpeed = document.getElementById('globalSpeed');
const globalLang = document.getElementById('globalLang');

const audioBar = document.createElement('div');
audioBar.className = 'audio-bar';
const audioPlayer = document.createElement('audio');
audioPlayer.controls = true;
audioBar.appendChild(audioPlayer);
document.body.appendChild(audioBar);

// API base: explicit backend address. Change if your backend runs elsewhere.
const API_BASE = typeof window.API_BASE !== 'undefined' ? window.API_BASE : 'http://localhost:3001';

const SOFT_WORD_LIMIT = 1000; // per your UI requirement
const HARD_WORD_LIMIT = 1000; // enforce UI hard cap at 1000 for input box

function countWords(s) { return (s.trim().match(/\S+/g) || []).length; }

// Load last project
window.addEventListener('load', async () => {
  const proj = await carregarProjeto();
  if (proj) {
    textoExtraido.value = proj.texto || '';
    updateWordCounter();
  }
});

// Upload handling
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = pdfInput.files[0];
  if (!file) return alert('Select a PDF');
  if (file.size > 20 * 1024 * 1024) return alert('File too large (20MB)');
  const fd = new FormData(); fd.append('pdf', file);
  // Directly call /extract (single upload) instead of uploading twice
  try {
    const ex = await fetch(`${API_BASE}/extract`, { method: 'POST', body: fd });
    if (!ex.ok) {
      const err = await ex.text();
      return alert('Upload/extract failed: ' + err);
    }
    const exd = await ex.json();
    textoExtraido.value = exd.text || textoExtraido.value;
    updateWordCounter();
    await salvarProjeto({ id: Date.now(), texto: textoExtraido.value, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Upload error', err);
    return alert('Upload/extract failed: ' + (err.message || err));
  }
});


// Word counter and limit enforcement
textoExtraido.addEventListener('input', () => {
  updateWordCounter();
  const n = countWords(textoExtraido.value || '');
  if (n > HARD_WORD_LIMIT) {
    alert('Input exceeds 1000 words - please reduce to continue');
    // trim to first 1000 words
    textoExtraido.value = textoExtraido.value.split(/\s+/).slice(0, HARD_WORD_LIMIT).join(' ');
    updateWordCounter();
  }
  if (window._autosaveTimer) clearTimeout(window._autosaveTimer);
  window._autosaveTimer = setTimeout(() => salvarProjeto({ id: Date.now(), texto: textoExtraido.value, updatedAt: new Date().toISOString() }), 2000);
});

function updateWordCounter() {
  const n = countWords(textoExtraido.value || '');
  wordCounter.textContent = `${n} words`;
  wordCounter.style.color = n > SOFT_WORD_LIMIT ? 'orange' : '';
}

// Next -> analyze and show groups
btnNext.addEventListener('click', async () => {
  const text = textoExtraido.value || '';
  if (!text.trim()) return alert('Enter some text or upload a PDF');
  const requestedGroups = parseInt(groupsCountInput.value, 10) || 1;
  const res = await fetch(`${API_BASE}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, requestedGroups }) });
  const data = await res.json();
  if (data.error) return alert(data.error);
  populateGroupsUI(data.groups);
  stepInput.style.display = 'none';
  stepConfig.style.display = '';
});

function populateGroupsUI(groups) {
  groupsContainer.innerHTML = '';
  // keep current analyzed groups for reference
  window.currentAnalyzeGroups = groups;
  groups.forEach(g => {
    const card = document.createElement('div');
    card.className = 'group-card';
    const title = document.createElement('h4');
    title.textContent = `Group ${g.index} (${g.wordCount} words)`;
    const txt = document.createElement('div');
    txt.innerHTML = g.sentences.map(s => `<span class="sentence">${escapeHtml(s)}</span>`).join(' ');
    const repLabel = document.createElement('label');
    repLabel.textContent = 'Repetitions:';
    const repInput = document.createElement('input');
    repInput.type = 'number'; repInput.min = 2; repInput.max = 10; repInput.value = 2; repInput.dataset.groupIndex = g.index;
    card.appendChild(title);
    card.appendChild(txt);
    card.appendChild(repLabel);
    card.appendChild(repInput);
    groupsContainer.appendChild(card);
  });
}

function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Back to input
btnBack.addEventListener('click', () => {
  stepConfig.style.display = 'none';
  stepInput.style.display = '';
});

// Dictate -> gather group settings and call TTS
btnDictate.addEventListener('click', async () => {
  // Collect per-group settings from UI
  const groups = Array.from(groupsContainer.querySelectorAll('.group-card')).map(card => {
    const indexMatch = card.querySelector('h4').textContent.match(/Group (\d+)/);
    const index = indexMatch ? indexMatch[1] : '1';
    const rep = parseInt(card.querySelector('input[type="number"]').value, 10) || 2;
    const sentences = Array.from(card.querySelectorAll('.sentence')).map(s => s.textContent);
    return { index: parseInt(index, 10), repetitions: rep, sentences };
  });

  // Build finalText using per-group repetitions
  let finalText = '';
  for (const g of groups) {
    const groupText = (g.sentences || []).join(' ').trim();
    if (!groupText) continue;
    const times = Math.max(1, Math.min(10, parseInt(g.repetitions, 10) || 1));
    for (let r = 0; r < times; r++) {
      finalText += groupText + '\n\n';
    }
  }

  if (!finalText.trim()) return alert('No group text to dictate.');

  const velocidadeVal = parseFloat(globalSpeed.value) || 1.0;
  const idiomaVal = globalLang.value;

  // Send finalText to backend; backend will chunk if needed
  const res = await fetch(`${API_BASE}/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: finalText, repeticoes: 1, velocidade: velocidadeVal, idioma: idiomaVal }) });
  const data = await res.json();
  if (data.error) return alert('TTS error: ' + data.error);
  const urls = data.audioUrls || (data.audioUrl ? [data.audioUrl] : []);
  if (!urls.length) return alert('No audio returned');
  // Render playback overlay with text and highlight capability
  startPlaybackWithHighlight(urls, finalText, { velocidade: velocidadeVal, idioma: idiomaVal });
});

// Dark / Light toggle wiring
const toggleThemeBtn = document.getElementById('toggleTheme');
function applyTheme(theme) {
  if (theme === 'dark') document.body.classList.add('dark');
  else document.body.classList.remove('dark');
}

// load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);

toggleThemeBtn.addEventListener('click', () => {
  const now = document.body.classList.toggle('dark') ? 'dark' : 'light';
  localStorage.setItem('theme', now);
});

// Simple playback + highlight logic: approximate timings per word
function startPlaybackWithHighlight(urls, fullText, payload) {
  // Build overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed'; overlay.style.left = 0; overlay.style.top = 0; overlay.style.right = 0; overlay.style.bottom = 0; overlay.style.background = 'rgba(0,0,0,0.6)'; overlay.style.zIndex = 9999; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
  const panel = document.createElement('div'); panel.style.width = '80%'; panel.style.maxHeight = '70%'; panel.style.overflow = 'auto'; panel.style.background = '#fff'; panel.style.padding = '16px'; panel.style.borderRadius = '8px';
  const textContainer = document.createElement('div'); textContainer.style.fontSize = '1.25rem'; textContainer.style.lineHeight = '1.6'; textContainer.id = 'dictationText';
  // split fullText into visible words (preserve spaces between spans)
  const words = fullText.split(/\s+/).filter(Boolean);
  textContainer.innerHTML = words.map(w => `<span class="highlight">${escapeHtml(w)}</span>`).join(' ');
  panel.appendChild(textContainer);
  const closeBtn = document.createElement('button'); closeBtn.textContent = 'Close'; closeBtn.style.display = 'block'; closeBtn.style.marginTop = '12px';
  panel.appendChild(closeBtn);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // Play sequential URLs and estimate timings
  let currentWordIdx = 0;
  const spans = Array.from(textContainer.querySelectorAll('.highlight'));
  const wordsCount = spans.length;

  let urlIdx = 0;
  const audio = audioPlayer;
  audio.src = urls[0];
  audio.play();

  function clearActive() { spans.forEach(s => s.classList.remove('active')); }

  audio.ontimeupdate = () => {
    // estimate position in current chunk by fraction and map to words in chunk proportionally
    const dur = audio.duration || 1;
    const frac = Math.min(1, audio.currentTime / dur);
    // map fraction to some words count per chunk; approximate equal split by number of urls
    const approxWordsPerChunk = Math.ceil(wordsCount / urls.length);
    const base = urlIdx * approxWordsPerChunk;
    const localWord = Math.floor(frac * approxWordsPerChunk);
    const idx = Math.min(wordsCount - 1, base + localWord);
    if (idx !== currentWordIdx) {
      currentWordIdx = idx;
      clearActive();
      if (spans[currentWordIdx]) spans[currentWordIdx].classList.add('active');
    }
  };

  audio.onended = () => {
    urlIdx++;
    if (urlIdx >= urls.length) {
      // finished
      audio.onended = null;
      audio.ontimeupdate = null;
      return;
    }
    audio.src = urls[urlIdx];
    audio.play();
  };

  closeBtn.onclick = () => {
    audio.pause();
    // clear handlers to avoid accessing removed DOM
    audio.onended = null;
    audio.ontimeupdate = null;
    audio.src = '';
    clearActive();
    overlay.remove();
  };

}

