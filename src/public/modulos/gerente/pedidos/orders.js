/* ════════════════════════════════════════════════════════════
   ESTADO GLOBAL
════════════════════════════════════════════════════════════ */

let pedidoEmEdicaoId = null;

const STATUS_DISPONIVEIS = ['Pendente', 'Confirmado', 'Preparando', 'Pronto', 'Retirado', 'Cancelado'];

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

const obterPedidos  = ()        => storage.get('pedidos', []);
const salvarPedidos = (pedidos) => storage.set('pedidos', pedidos);

/* ════════════════════════════════════════════════════════════
   STATUS — mapeamento de classes CSS
════════════════════════════════════════════════════════════ */

const STATUS_CLASSES = {
  pendente:   'status-pendente',
  confirmado: 'status-confirmado',
  preparando: 'status-preparando',
  pronto:     'status-pronto',
  retirado:   'status-retirado',
  entregue:   'status-retirado',
  'concluído': 'status-retirado',
  cancelado:  'status-cancelado',
};

const obterClasseStatus = (status) => STATUS_CLASSES[status.toLowerCase()] ?? 'status-pendente';

/* ════════════════════════════════════════════════════════════
   RENDERIZAÇÃO DA TABELA
════════════════════════════════════════════════════════════ */

function filtrarPedidos() {
  renderizarTabela();
}

function resumirItens(itens, limite = 35) {
  const texto = itens.map((item) => `${item.quantidade}x ${item.nome}`).join(', ');
  return texto.length > limite ? `${texto.slice(0, limite)}...` : texto;
}

function criarLinhaPedido(pedido) {
  const tr = document.createElement('tr');

  const tituloItens = pedido.itens.map((i) => `${i.quantidade}x ${i.nome}`).join('\n');

  tr.innerHTML = `
    <td class="cell-order-id">${pedido.id}</td>
    <td>
      <div class="cell-client-name">${pedido.cliente.nome}</div>
      <div class="cell-client-time"><i class="bi bi-clock" aria-hidden="true"></i> Para: ${pedido.horarioRetirada}</div>
    </td>
    <td title="${tituloItens}">${resumirItens(pedido.itens)}</td>
    <td class="cell-total">R$ ${pedido.total.toFixed(2)}</td>
    <td>
      <span class="status-badge ${obterClasseStatus(pedido.status)}">${pedido.status}</span>
    </td>
    <td>
      <button class="btn-action" data-id="${pedido.id}" aria-label="Ver detalhes do pedido ${pedido.id}">
        <i class="bi bi-eye" aria-hidden="true"></i> Detalhes
      </button>
    </td>
  `;

  tr.querySelector('[data-id]').addEventListener('click', () => abrirModalDetalhes(pedido.id));

  return tr;
}

function renderizarTabela() {
  const tbody          = document.getElementById('orders-body');
  const filtro          = document.getElementById('filter-status').value.toLowerCase();

  let pedidos = [...obterPedidos()].sort(
    (a, b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0),
  );

  if (filtro) {
    pedidos = pedidos.filter((p) => p.status.toLowerCase() === filtro);
  }

  tbody.innerHTML = '';

  if (pedidos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="cell-empty">Nenhum pedido encontrado.</td>
      </tr>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();
  pedidos.forEach((pedido) => fragment.appendChild(criarLinhaPedido(pedido)));
  tbody.appendChild(fragment);
}

/* ════════════════════════════════════════════════════════════
   MODAL DE DETALHES
════════════════════════════════════════════════════════════ */

function criarLinhaItemModal(item) {
  return `
    <div class="modal-item-row">
      <span><b>${item.quantidade}x</b> ${item.nome}</span>
      <span>R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
    </div>
  `;
}

function preencherSelectStatus(statusAtual) {
  const select = document.getElementById('modal-status');
  select.innerHTML = '';

  STATUS_DISPONIVEIS.forEach((status) => {
    const option = document.createElement('option');
    option.value    = status;
    option.textContent = status;
    option.selected = status === statusAtual;
    select.appendChild(option);
  });
}

function abrirModalDetalhes(idPedido) {
  const pedido = obterPedidos().find((p) => p.id === idPedido);
  if (!pedido) return;

  pedidoEmEdicaoId = idPedido;

  document.getElementById('modal-id').textContent = pedido.id;

  document.getElementById('modal-cliente').innerHTML = `
    <div class="modal-info-line"><b>Nome:</b> ${pedido.cliente.nome}</div>
    <div class="modal-info-line"><b>Contato:</b> ${pedido.cliente.telefone} | ${pedido.cliente.email}</div>
    <div class="modal-info-line modal-info-highlight">
      <i class="bi bi-clock" aria-hidden="true"></i> <b>Horário Agendado:</b> ${pedido.horarioRetirada}
    </div>
  `;

  const itensHtml = pedido.itens.map(criarLinhaItemModal).join('');
  document.getElementById('modal-itens').innerHTML = `
    ${itensHtml}
    <div class="modal-item-total">
      <span>Total Pago:</span>
      <span>R$ ${pedido.total.toFixed(2)}</span>
    </div>
  `;

  preencherSelectStatus(pedido.status);

  const modal = document.getElementById('modal-detalhes');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function fecharModal() {
  const modal = document.getElementById('modal-detalhes');
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  pedidoEmEdicaoId = null;
}

function salvarAlteracao() {
  if (!pedidoEmEdicaoId) return;

  const novoStatus = document.getElementById('modal-status').value;
  const pedidos     = obterPedidos();
  const index       = pedidos.findIndex((p) => p.id === pedidoEmEdicaoId);

  if (index === -1) return;

  const statusAnterior = pedidos[index].status;

  pedidos[index].status = novoStatus;

  if (novoStatus === 'Retirado') {
    pedidos[index].dataRetirada = new Date().toISOString();
  }

  if (novoStatus === 'Cancelado' && statusAnterior !== 'Cancelado') {
    const horarios = storage.get('horariosRetirada', []);
    const indiceHorario = horarios.findIndex((h) => h.hora === pedidos[index].horarioRetirada);

    if (indiceHorario !== -1) {
      horarios[indiceHorario].pedidos = Math.max(horarios[indiceHorario].pedidos - 1, 0);
      storage.set('horariosRetirada', horarios);
    }
  }

  salvarPedidos(pedidos);
  renderizarTabela();
  fecharModal();
}

document.getElementById('modal-detalhes')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) fecharModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fecharModal();
});

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

document.addEventListener('DOMContentLoaded', renderizarTabela);