/* ═══════════════════════════════════════════════════
   QR CODE — geração determinística de padrão pixelado
═══════════════════════════════════════════════════ */
function generateQRPattern(gridId, cols, darkColor = '#20242b') {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  // LCG com seed baseada no id para resultado determinístico
  let s = gridId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  };

  const total = cols * cols;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    // Padrão finder nos três cantos superiores
    const inFinder = (row < 3 && col < 3)
                  || (row < 3 && col >= cols - 3)
                  || (row >= cols - 3 && col < 3);

    const isDark = inFinder ? true : rand() > 0.42;

    const cell = document.createElement('div');
    cell.className = 'qr-cell';
    cell.style.background = isDark ? darkColor : 'transparent';
    fragment.appendChild(cell);
  }

  grid.appendChild(fragment);
}

generateQRPattern('hero-qr-mini', 7);
generateQRPattern('qr-full-grid', 9);
generateQRPattern('rp-qr-grid',   7);

/* ═══════════════════════════════════════════════════
   HEADER — sombra ao scrollar
═══════════════════════════════════════════════════ */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 8);
}, { passive: true });

/* ═══════════════════════════════════════════════════
   SCROLL ANIMATIONS — fade-up via IntersectionObserver
═══════════════════════════════════════════════════ */
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-up, .step-item').forEach(el => fadeObserver.observe(el));

// Dispara para elementos já visíveis no carregamento inicial
document.querySelectorAll('.fade-up').forEach(el => {
  if (el.getBoundingClientRect().top < window.innerHeight) {
    el.classList.add('visible');
  }
});

/* ═══════════════════════════════════════════════════
   STEPS — interação e ciclo automático
═══════════════════════════════════════════════════ */
const stepItems = document.querySelectorAll('.step-item');
const stepNums  = document.querySelectorAll('.step-num');
const tabs      = document.querySelectorAll('.rp-tab');

const SCREENS = {
  browse:   document.getElementById('screen-browse'),
  schedule: document.getElementById('screen-schedule'),
  qr:       document.getElementById('screen-qr'),
};
const TAB_ORDER = ['browse', 'browse', 'schedule', 'qr', 'qr'];

function activateStep(idx) {
  stepNums.forEach((num, i) => {
    num.className = 'step-num ' + (i < idx ? 'done' : i === idx ? 'active' : 'next');
  });

  const tabKey = TAB_ORDER[idx] ?? 'browse';
  tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabKey));
  Object.entries(SCREENS).forEach(([key, el]) => {
    if (el) el.style.display = key === tabKey ? 'block' : 'none';
  });
}

let autoCycle = true;
let cycleIdx  = 0;

stepItems.forEach((item, idx) => {
  item.addEventListener('click', () => {
    autoCycle = false;
    activateStep(idx);
  });
});

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const key = tab.dataset.tab;
    tabs.forEach(t => t.classList.toggle('active', t === tab));
    Object.entries(SCREENS).forEach(([k, el]) => {
      if (el) el.style.display = k === key ? 'block' : 'none';
    });
  });
});

setInterval(() => {
  if (!autoCycle) return;
  activateStep(cycleIdx);
  cycleIdx = (cycleIdx + 1) % stepItems.length;
}, 2400);



/* ═══════════════════════════════════════════════════
   TTS — Leitor de Tela (Text-To-Speech)
   Encapsulado para não poluir o escopo global
═══════════════════════════════════════════════════ */
(function initTTS() {
  const btnPlayPause = document.getElementById('tts-play-pause');
  const btnStop      = document.getElementById('tts-stop');
  if (!btnPlayPause || !btnStop) return;

  let utterance = null;
  let isPaused  = false;

  /** Extrai o texto legível da página, priorizando <main> */
  function getPageText() {
    const root = document.querySelector('main') || document.body;
    return (root.innerText || root.textContent)
      .replace(/\n+/g, '. ')
      .trim();
  }

  /** Volta a UI ao estado inicial */
  function resetUI() {
    btnPlayPause.querySelector('i').className = 'bi bi-play-circle-fill';
    btnPlayPause.setAttribute('aria-label', 'Iniciar narração da página');
    btnStop.disabled = true;
    isPaused = false;
  }

  /** Play / Pause / Resume */
  function toggle() {
    const icon = btnPlayPause.querySelector('i');

    // Cenário: retomar após pausa
    if (isPaused) {
      window.speechSynthesis.resume();
      isPaused = false;
      icon.className = 'bi bi-pause-circle-fill';
      btnPlayPause.setAttribute('aria-label', 'Pausar narração');
      return;
    }

    // Cenário: pausar durante leitura
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      isPaused = true;
      icon.className = 'bi bi-play-circle-fill';
      btnPlayPause.setAttribute('aria-label', 'Continuar narração');
      return;
    }

    // Cenário: iniciar do zero
    const text = getPageText();
    if (!text) {
      alert('Não foi possível encontrar conteúdo legível na página.');
      return;
    }

    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.onend   = resetUI;
    utterance.onerror = (e) => { console.error('Erro TTS:', e); resetUI(); };

    window.speechSynthesis.speak(utterance);
    icon.className = 'bi bi-pause-circle-fill';
    btnPlayPause.setAttribute('aria-label', 'Pausar narração');
    btnStop.disabled = false;
  }

  /** Parar definitivamente */
  function stop() {
    if (window.speechSynthesis.speaking || isPaused) {
      window.speechSynthesis.cancel();
      resetUI();
    }
  }

  btnPlayPause.addEventListener('click', toggle);
  btnStop.addEventListener('click', stop);

  // Interrompe ao sair da página para evitar voz órfã
  window.addEventListener('beforeunload', () => window.speechSynthesis.cancel());
})();