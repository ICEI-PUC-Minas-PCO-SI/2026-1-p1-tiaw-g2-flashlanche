/* ════════════════════════════════════════════════════════════
   NAVEGAÇÃO
════════════════════════════════════════════════════════════ */

const logout = () => { encerrarSessao(); window.location.href = '../../../index.html'; };

/* ════════════════════════════════════════════════════════════
   STORAGE
════════════════════════════════════════════════════════════ */

const storage = {
  get: (chave, fallback = null) => {
    try { const d = localStorage.getItem(chave); return d ? JSON.parse(d) : fallback; }
    catch { return fallback; }
  },
  set: (chave, valor) => { try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { console.error(e); } },
};

const obterHorarios = ()         => storage.get('horariosRetirada', []);
const salvarHorarios = (lista)   => storage.set('horariosRetirada', lista);

/* ════════════════════════════════════════════════════════════
   MODAL
════════════════════════════════════════════════════════════ */

function abrirModal() {
  const modal = document.getElementById('modal-form');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('hora').focus();
}

function fecharModal() {
  const modal = document.getElementById('modal-form');
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');

  document.getElementById('hora').value       = '';
  document.getElementById('capacidade').value = 5;
}

document.getElementById('modal-form')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) fecharModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fecharModal();
});

/* ════════════════════════════════════════════════════════════
   CRUD DE HORÁRIOS
════════════════════════════════════════════════════════════ */

function salvarHorario() {
  const hora       = document.getElementById('hora').value;
  const capacidade = Number(document.getElementById('capacidade').value);

  if (!hora || capacidade <= 0) {
    alert('Preencha o horário e a capacidade corretamente.');
    return;
  }

  const horarios = obterHorarios();

  if (horarios.some((h) => h.hora === hora)) {
    alert('Esse horário já foi cadastrado.');
    return;
  }

  const novoHorario = { id: Date.now(), hora, capacidade, pedidos: 0, ativo: true };
  const atualizados  = [...horarios, novoHorario].sort((a, b) => a.hora.localeCompare(b.hora));

  salvarHorarios(atualizados);
  renderizarHorarios();
  fecharModal();
}

function alternarHorario(id) {
  const horarios = obterHorarios();
  const horario  = horarios.find((h) => h.id === id);
  if (!horario) return;

  horario.ativo = !horario.ativo;
  salvarHorarios(horarios);
  renderizarHorarios();
}

function excluirHorario(id) {
  if (!confirm('Deseja excluir esse horário?')) return;

  salvarHorarios(obterHorarios().filter((h) => h.id !== id));
  renderizarHorarios();
}

/* ════════════════════════════════════════════════════════════
   RENDERIZAÇÃO
════════════════════════════════════════════════════════════ */

function criarCardHorario(horario) {
  const lotado = horario.pedidos >= horario.capacidade;

  const card = document.createElement('div');
  card.className = `timeslot-card ${lotado || !horario.ativo ? 'disabled' : ''}`;

  card.innerHTML = `
    <div class="timeslot-time">${horario.hora}</div>
    <div class="timeslot-status">${horario.ativo ? 'Ativo' : 'Desativado'}</div>

    <div class="timeslot-badge ${lotado ? 'full' : ''}">
      ${horario.pedidos}/${horario.capacidade} pedidos
    </div>

    <div class="timeslot-actions">
      <button class="btn-icon" data-action="alternar" data-id="${horario.id}">
        ${horario.ativo ? 'Desativar' : 'Ativar'}
      </button>
      <button class="btn-icon btn-icon-danger" data-action="excluir" data-id="${horario.id}">
        Excluir
      </button>
    </div>
  `;

  card.querySelector('[data-action="alternar"]').addEventListener('click', () => alternarHorario(horario.id));
  card.querySelector('[data-action="excluir"]').addEventListener('click', () => excluirHorario(horario.id));

  return card;
}

function renderizarHorarios() {
  const grid = document.getElementById('timeslots-grid');
  if (!grid) return;

  const horarios = obterHorarios();

  grid.innerHTML = '';

  if (horarios.length === 0) {
    grid.innerHTML = '<p class="timeslots-empty">Nenhum horário cadastrado.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  horarios.forEach((horario) => fragment.appendChild(criarCardHorario(horario)));
  grid.appendChild(fragment);
}

/* ════════════════════════════════════════════════════════════
   INTEGRAÇÃO COM A TELA DE PEDIDO
════════════════════════════════════════════════════════════ */

function carregarHorariosNoPedido(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const disponiveis = obterHorarios().filter((h) => h.ativo && h.pedidos < h.capacidade);

  select.innerHTML = '<option value="">Selecione um horário</option>';

  disponiveis.forEach((horario) => {
    const option = document.createElement('option');
    option.value       = horario.id;
    option.textContent = `${horario.hora} - ${horario.pedidos}/${horario.capacidade} pedidos`;
    select.appendChild(option);
  });
}

function registrarPedidoNoHorario(idHorario) {
  const horarios = obterHorarios();
  const horario  = horarios.find((h) => h.id == idHorario);

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
  salvarHorarios(horarios);
  renderizarHorarios();

  return true;
}

/* ════════════════════════════════════════════════════════════
   ACESSIBILIDADE — TEXT-TO-SPEECH
════════════════════════════════════════════════════════════ */

const tts = {
  utterance: null,
  paused:    false,

  get synth() { return window.speechSynthesis; },

  prepararTexto() {
    const alvo = document.querySelector('main') || document.body;
    return (alvo.innerText || alvo.textContent).replace(/\n+/g, '. ').trim();
  },

  resetarUI() {
    const btnPlay = document.getElementById('tts-play-pause');
    const btnStop = document.getElementById('tts-stop');
    btnPlay.querySelector('i').className = 'bi bi-play-circle-fill';
    btnPlay.setAttribute('aria-label', 'Iniciar narração da página');
    btnStop.disabled = true;
    this.paused = false;
  },

  iniciar() {
    const texto = this.prepararTexto();
    if (!texto) { alert('Não foi possível encontrar conteúdo legível.'); return; }

    this.utterance         = new SpeechSynthesisUtterance(texto);
    this.utterance.lang    = 'pt-BR';
    this.utterance.rate    = 1.5;
    this.utterance.onend   = () => this.resetarUI();
    this.utterance.onerror = (e) => { console.error('Erro TTS:', e); this.resetarUI(); };

    this.synth.speak(this.utterance);

    const btnPlay = document.getElementById('tts-play-pause');
    const btnStop = document.getElementById('tts-stop');
    btnPlay.querySelector('i').className = 'bi bi-pause-circle-fill';
    btnPlay.setAttribute('aria-label', 'Pausar narração');
    btnStop.disabled = false;
    this.paused = false;
  },
};

function toggleLeitura() {
  if (tts.paused) {
    tts.synth.resume(); tts.paused = false;
    const btn = document.getElementById('tts-play-pause');
    btn.querySelector('i').className = 'bi bi-pause-circle-fill';
    btn.setAttribute('aria-label', 'Pausar narração');
    return;
  }
  if (tts.synth.speaking) {
    tts.synth.pause(); tts.paused = true;
    const btn = document.getElementById('tts-play-pause');
    btn.querySelector('i').className = 'bi bi-play-circle-fill';
    btn.setAttribute('aria-label', 'Continuar narração');
    return;
  }
  tts.iniciar();
}

function pararLeitura() {
  if (tts.synth.speaking || tts.paused) { tts.synth.cancel(); tts.resetarUI(); }
}

window.addEventListener('beforeunload', () => tts.synth.cancel());

/* ════════════════════════════════════════════════════════════
   INICIALIZAÇÃO
════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', renderizarHorarios);