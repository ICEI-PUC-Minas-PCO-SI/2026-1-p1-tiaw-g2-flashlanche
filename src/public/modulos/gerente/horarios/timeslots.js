function logout() {
  window.location.href = '../../../index.html';
}

let horarios = JSON.parse(localStorage.getItem('horariosRetirada')) || [];

function salvarNoStorage() {
  localStorage.setItem('horariosRetirada', JSON.stringify(horarios));
}

function abrirModal() {
  document.getElementById('modal-form').classList.add('show');
}

function fecharModal() {
  document.getElementById('modal-form').classList.remove('show');
  document.getElementById('hora').value = '';
  document.getElementById('capacidade').value = 5;
}

function salvarHorario() {
  const hora = document.getElementById('hora').value;
  const capacidade = Number(document.getElementById('capacidade').value);

  if (!hora || capacidade <= 0) {
    alert('Preencha o horário e a capacidade corretamente.');
    return;
  }

  const existe = horarios.some(h => h.hora === hora);

  if (existe) {
    alert('Esse horário já foi cadastrado.');
    return;
  }

  horarios.push({
    id: Date.now(),
    hora: hora,
    capacidade: capacidade,
    pedidos: 0,
    ativo: true
  });

  horarios.sort((a, b) => a.hora.localeCompare(b.hora));

  salvarNoStorage();
  renderizarHorarios();
  fecharModal();
}

function renderizarHorarios() {
  const grid = document.getElementById('timeslots-grid');

  if (!grid) return;

  grid.innerHTML = '';

  if (horarios.length === 0) {
    grid.innerHTML = '<p>Nenhum horário cadastrado.</p>';
    return;
  }

  horarios.forEach(horario => {
    const lotado = horario.pedidos >= horario.capacidade;

    const card = document.createElement('div');
    card.className = `timeslot-card ${lotado || !horario.ativo ? 'disabled' : ''}`;

    card.innerHTML = `
      <div class="timeslot-time">${horario.hora}</div>
      <div class="timeslot-status">
        ${horario.ativo ? 'Ativo' : 'Desativado'}
      </div>

      <div class="timeslot-badge ${lotado ? 'full' : ''}">
        ${horario.pedidos}/${horario.capacidade} pedidos
      </div>

      <div class="timeslot-actions">
        <button class="btn-icon" onclick="alternarHorario(${horario.id})">
          ${horario.ativo ? 'Desativar' : 'Ativar'}
        </button>

        <button class="btn-icon btn-icon-danger" onclick="excluirHorario(${horario.id})">
          Excluir
        </button>
      </div>
    `;

    grid.appendChild(card);
  });
}

function alternarHorario(id) {
  const horario = horarios.find(h => h.id === id);

  if (horario) {
    horario.ativo = !horario.ativo;
    salvarNoStorage();
    renderizarHorarios();
  }
}

function excluirHorario(id) {
  if (!confirm('Deseja excluir esse horário?')) return;

  horarios = horarios.filter(h => h.id !== id);
  salvarNoStorage();
  renderizarHorarios();
}

// Função para usar na tela de pedido
function carregarHorariosNoPedido(selectId) {
  const select = document.getElementById(selectId);

  if (!select) return;

  select.innerHTML = '<option value="">Selecione um horário</option>';

  const horariosDisponiveis = horarios.filter(h =>
    h.ativo && h.pedidos < h.capacidade
  );

  horariosDisponiveis.forEach(horario => {
    const option = document.createElement('option');
    option.value = horario.id;
    option.textContent = `${horario.hora} - ${horario.pedidos}/${horario.capacidade} pedidos`;
    select.appendChild(option);
  });
}

// Chamar quando o pedido for confirmado
function registrarPedidoNoHorario(idHorario) {
  const horario = horarios.find(h => h.id == idHorario);

  if (!horario) {
    alert('Horário não encontrado.');
    return false;
  }

  if (!horario.ativo) {
    alert('Esse horário está desativado.');
    return false;
  }

  if (horario.pedidos >= horario.capacidade) {
    alert('Esse horário está lotado.');
    return false;
  }

  horario.pedidos++;

  salvarNoStorage();
  renderizarHorarios();

  return true;
}

document.addEventListener('DOMContentLoaded', renderizarHorarios);

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
  ttsUtterance.rate = 1.5; // Velocidade da leitura

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