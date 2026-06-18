/* ════════════════════════════════ ACESSIBILIDADE: TEXT-TO-SPEECH (TTS) ════════════════════════════════ */

let ttsUtterance = null;
let isPaused = false;

/**
 * Prepara o texto da página para ser lido, focando no conteúdo principal
 */
function prepararTextoLeitura() {
  // Dá preferência ao conteúdo dentro da tag <main> para não ler menus repetitivos,
  // caso a tag não exista, lê todo o <body>.
  const mainContent = document.querySelector('main') || document.body;
  
  // Extrai apenas o texto limpo sem as tags de código HTML
  let textoParaLer = mainContent.innerText || mainContent.textContent;
  
  // Limpa quebras de linha em excesso para não gerar pausas longas na voz
  textoParaLer = textoParaLer.replace(/\n+/g, '. ').trim();
  
  return textoParaLer;
}

/**
 * Controla os Cenários 1, 2 e 3 (Iniciar, Pausar e Continuar)
 */
function toggleLeitura() {
  const btnPlayPause = document.getElementById('tts-play-pause');
  const btnStop = document.getElementById('tts-stop');
  const iconePlayPause = btnPlayPause.querySelector('i');

  // Cenário 3: Continuar (A leitura estava pausada)
  if (isPaused) {
    window.speechSynthesis.resume();
    isPaused = false;
    iconePlayPause.className = 'bi bi-pause-circle-fill';
    btnPlayPause.setAttribute('aria-label', 'Pausar narração');
    return;
  }

  // Cenário 2: Pausar (A leitura está em andamento)
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    isPaused = true;
    iconePlayPause.className = 'bi bi-play-circle-fill';
    btnPlayPause.setAttribute('aria-label', 'Continuar narração');
    return;
  }

  // Cenário 1: Iniciar (A leitura do zero)
  const texto = prepararTextoLeitura();
  if (!texto) {
    alert("Não foi possível encontrar conteúdo legível na página.");
    return;
  }

  ttsUtterance = new SpeechSynthesisUtterance(texto);
  ttsUtterance.lang = 'pt-BR'; // Idioma suportado pela voz do navegador (Pode usar 'pt-PT' também)
  ttsUtterance.rate = 1.; // Velocidade da leitura

  // Quando a leitura termina naturalmente, reseta a UI
  ttsUtterance.onend = () => {
    resetarUI();
  };

  ttsUtterance.onerror = (e) => {
    console.error('Ocorreu um erro no Text-To-Speech:', e);
    resetarUI();
  };

  // Envia o comando para o navegador começar a falar
  window.speechSynthesis.speak(ttsUtterance);
  
  // Atualiza a Interface (UI)
  iconePlayPause.className = 'bi bi-pause-circle-fill';
  btnPlayPause.setAttribute('aria-label', 'Pausar narração');
  btnStop.disabled = false;
  isPaused = false;
}

/**
 * Cenário 4: Parar a narração definitivamente
 */
function pararLeitura() {
  if (window.speechSynthesis.speaking || isPaused) {
    window.speechSynthesis.cancel();
    resetarUI();
  }
}

/**
 * Função auxiliar para voltar os botões ao estado original
 */
function resetarUI() {
  const btnPlayPause = document.getElementById('tts-play-pause');
  const btnStop = document.getElementById('tts-stop');
  const iconePlayPause = btnPlayPause.querySelector('i');

  iconePlayPause.className = 'bi bi-play-circle-fill';
  btnPlayPause.setAttribute('aria-label', 'Iniciar narração da página');
  btnStop.disabled = true;
  isPaused = false;
}

// Prevenção de Bug: Garante que a síntese de voz para caso o utilizador mude de página ou feche o separador
window.addEventListener('beforeunload', () => {
  window.speechSynthesis.cancel();
});