/* ════════════════════════════════════════════════════════════
   NAVEGAÇÃO
════════════════════════════════════════════════════════════ */

const voltarParaShop = () => { window.location.href = '../cardapio/shop.html'; };
const sair           = () => { encerrarSessao(); window.location.href = '../../../index.html'; };

/* ════════════════════════════════════════════════════════════
   STORAGE
════════════════════════════════════════════════════════════ */

const storage = {
  get: (chave, fallback = null) => {
    try { const d = localStorage.getItem(chave); return d ? JSON.parse(d) : fallback; }
    catch { return fallback; }
  },
};

/* ════════════════════════════════════════════════════════════
   MAPEAMENTO DE STATUS
════════════════════════════════════════════════════════════ */

const STATUS_MAP = {
  Pendente:   { classe: 'status-pendente',   icone: 'bi-clock-history',  qrVisivel: true  },
  Confirmado: { classe: 'status-confirmado', icone: 'bi-check-circle',   qrVisivel: true  },
  Preparando: { classe: 'status-preparando', icone: 'bi-fire',           qrVisivel: true  },
  Pronto:     { classe: 'status-pronto',     icone: 'bi-bag-check',      qrVisivel: true  },
  Retirado:   { classe: 'status-retirado',   icone: 'bi-check-all',      qrVisivel: false },
  Concluído:  { classe: 'status-retirado',   icone: 'bi-check-all',      qrVisivel: false },
  Entregue:   { classe: 'status-retirado',   icone: 'bi-check-all',      qrVisivel: false },
  Cancelado:  { classe: 'status-cancelado',  icone: 'bi-x-circle',       qrVisivel: false },
};

const resolverStatus = (status) =>
  STATUS_MAP[status] ?? { classe: 'status-pendente', icone: 'bi-clock-history', qrVisivel: true };

/* ════════════════════════════════════════════════════════════
   FORMATAÇÃO
════════════════════════════════════════════════════════════ */

function formatarData(iso) {
  if (!iso) return 'Data não registrada';
  const d = new Date(iso);
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function badgeHtml(status) {
  const { classe, icone } = resolverStatus(status);
  return `<span class="status-badge ${classe}"><i class="bi ${icone}" aria-hidden="true"></i> ${status}</span>`;
}

/* ════════════════════════════════════════════════════════════
   RENDERIZAÇÃO — CARD DE PEDIDO
════════════════════════════════════════════════════════════ */

function criarCardPedido(pedido) {
  const { classe, icone } = resolverStatus(pedido.status);

  const itensHtml = pedido.itens.map((item) => `
    <div class="order-item">
      <span class="order-item-name">${item.quantidade}x ${item.nome}</span>
      <span class="order-item-price">R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
    </div>
  `).join('');

  const card = document.createElement('article');
  card.className = 'order-card';
  card.setAttribute('aria-label', `Pedido ${pedido.id}`);

  // Passa o id do pedido em vez de serializar o objeto inteiro no atributo onclick
  card.innerHTML = `
    <div class="order-header">
      <div>
        <div class="order-id">${pedido.id}</div>
        <div class="order-date">${formatarData(pedido.dataCriacao)}</div>
      </div>
      <div class="status-badge ${classe}">
        <i class="bi ${icone}" aria-hidden="true"></i> ${pedido.status}
      </div>
    </div>

    <div class="order-items">${itensHtml}</div>

    <div class="order-footer">
      <div class="order-total">
        <span class="order-total-label">Total:</span>
        <span class="order-total-value">R$ ${pedido.total.toFixed(2)}</span>
      </div>
      <div class="order-actions">
        <button class="btn-action btn-action-primary" data-id="${pedido.id}" aria-label="Ver QR Code do pedido ${pedido.id}">
          <i class="bi bi-qr-code" aria-hidden="true"></i> Ver QR Code
        </button>
      </div>
    </div>
  `;

  // Usa event listener em vez de onclick inline — evita serializar o pedido no HTML
  card.querySelector('[data-id]').addEventListener('click', () => abrirModal(pedido));

  return card;
}

/* ════════════════════════════════════════════════════════════
   RENDERIZAÇÃO — LISTA
════════════════════════════════════════════════════════════ */

function renderizarPedidos() {
  const container = document.getElementById('orders-grid');

  // Cada cliente só enxerga o próprio histórico, salvo isoladamente no checkout.
  const pedidos = storage.get(authChaveUsuario('pedidos'), []);

  if (pedidos.length === 0) return; // mantém o estado vazio do HTML

  // Mais recentes primeiro
  const ordenados = [...pedidos].reverse();

  container.innerHTML = '';

  const fragment = document.createDocumentFragment();
  ordenados.forEach((pedido) => fragment.appendChild(criarCardPedido(pedido)));
  container.appendChild(fragment);
}

/* ════════════════════════════════════════════════════════════
   MODAL DE DETALHES
════════════════════════════════════════════════════════════ */

function abrirModal(pedido) {
  const { qrVisivel } = resolverStatus(pedido.status);

  document.getElementById('modal-pedido-id').textContent      = pedido.id;
  document.getElementById('modal-pedido-horario').textContent = pedido.horarioRetirada;
  document.getElementById('modal-pedido-total').textContent   = `R$ ${pedido.total.toFixed(2)}`;
  document.getElementById('modal-status-badge').innerHTML     = badgeHtml(pedido.status);

  const qrContainer = document.getElementById('modal-qr-container');
  const qrAviso     = document.getElementById('modal-qr-aviso');
  const qrCanvas    = document.getElementById('qr-code-canvas');

  qrCanvas.innerHTML          = '';
  qrContainer.style.display   = qrVisivel ? 'flex' : 'none';
  qrAviso.textContent         = qrVisivel
    ? 'Apresente este QR Code no balcão para retirar seu lanche.'
    : 'Este pedido já foi finalizado. Obrigado por comprar no FlashLanche!';

  if (qrVisivel) {
    new QRCode(qrCanvas, {
      text:         JSON.stringify(pedido),
      width:        200,
      height:       200,
      colorDark:    '#000000',
      colorLight:   '#ffffff',
      correctLevel: QRCode.CorrectLevel.L,
    });
  }

  const modal = document.getElementById('modal-pedido');
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('modal-fechar').focus();
}

function fecharModal() {
  const modal = document.getElementById('modal-pedido');
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
}

// Fecha ao clicar no overlay
document.getElementById('modal-pedido')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) fecharModal();
});

// Fecha com Escape
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

document.addEventListener('DOMContentLoaded', renderizarPedidos);