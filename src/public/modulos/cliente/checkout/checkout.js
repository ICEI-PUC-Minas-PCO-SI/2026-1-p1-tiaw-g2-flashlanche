/* ════════════════════════════════════════════════════════════
   ESTADO GLOBAL
════════════════════════════════════════════════════════════ */

const estado = {
  carrinho:           [],
  horarios:           [],
  horarioSelecionado: null,
};

/* ════════════════════════════════════════════════════════════
   NAVEGAÇÃO
════════════════════════════════════════════════════════════ */

const irParaPedidos = () => { window.location.href = '../pedidos/orders.html'; };
const irParaShop    = () => { window.location.href = '../cardapio/shop.html'; };

/* ════════════════════════════════════════════════════════════
   STORAGE
════════════════════════════════════════════════════════════ */

const storage = {
  get:    (chave, fallback = null) => { try { const d = localStorage.getItem(chave); return d ? JSON.parse(d) : fallback; } catch { return fallback; } },
  set:    (chave, valor)           => { try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { console.error(e); } },
  remove: (chave)                  => localStorage.removeItem(chave),
};

/* ════════════════════════════════════════════════════════════
   INICIALIZAÇÃO
════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  carregarDados();
});

function carregarDados() {
  estado.carrinho = storage.get(authChaveUsuario('carrinho'), []);

  if (estado.carrinho.length === 0) {
    alert('Seu carrinho está vazio! Redirecionando para o cardápio...');
    irParaShop();
    return;
  }

  estado.horarios = storage.get('horariosRetirada', []);

  renderizarResumo();
  renderizarInfoConta();
  renderizarHorarios();
  gerarIdPedido();
}

/* ════════════════════════════════════════════════════════════
   RENDERIZAÇÃO — RESUMO DO PEDIDO
════════════════════════════════════════════════════════════ */

function renderizarResumo() {
  const container = document.getElementById('order-summary');

  const { itensHtml, total } = estado.carrinho.reduce(
    (acc, item) => {
      const subtotal = item.preco * item.quantidade;
      acc.total += subtotal;
      acc.itensHtml += `
        <div class="summary-item">
          <div>
            <span class="summary-item-qty">${item.quantidade}x</span>
            <span class="summary-item-name">${item.nome}</span>
          </div>
          <span class="summary-item-value">R$ ${subtotal.toFixed(2)}</span>
        </div>
      `;
      return acc;
    },
    { itensHtml: '', total: 0 },
  );

  container.innerHTML = `
    ${itensHtml}
    <div class="summary-total">
      <span>Total</span>
      <span class="summary-total-value">R$ ${total.toFixed(2)}</span>
    </div>
  `;
}

/* ════════════════════════════════════════════════════════════
   RENDERIZAÇÃO — HORÁRIOS
════════════════════════════════════════════════════════════ */

function renderizarHorarios() {
  const container   = document.getElementById('horarios-grid');
  const disponiveis = estado.horarios.filter((h) => h.ativo && h.pedidos < h.capacidade);

  if (disponiveis.length === 0) {
    container.innerHTML = '<p class="horarios-empty">Nenhum horário disponível no momento.</p>';
    return;
  }

  container.innerHTML = '';

  disponiveis.forEach((horario) => {
    const vagas = horario.capacidade - horario.pedidos;
    const btn   = document.createElement('button');

    btn.className   = 'horario-btn';
    btn.type        = 'button';
    btn.setAttribute('aria-label', `Horário ${horario.hora}, ${vagas} ${vagas === 1 ? 'vaga' : 'vagas'}`);
    btn.innerHTML   = `
      <span class="horario-hora">${horario.hora}</span>
      <span class="horario-vagas">${vagas} ${vagas === 1 ? 'vaga' : 'vagas'}</span>
    `;

    btn.addEventListener('click', () => selecionarHorario(horario, btn));
    container.appendChild(btn);
  });
}

/* ════════════════════════════════════════════════════════════
   SELEÇÃO DE HORÁRIO
════════════════════════════════════════════════════════════ */

function selecionarHorario(horario, btnClicado) {
  estado.horarioSelecionado = horario;

  document.querySelectorAll('.horario-btn').forEach((btn) => {
    btn.classList.remove('selected');
    btn.setAttribute('aria-pressed', 'false');
  });

  btnClicado.classList.add('selected');
  btnClicado.setAttribute('aria-pressed', 'true');

  validarFormulario();
}

/* ════════════════════════════════════════════════════════════
   RENDERIZAÇÃO — DADOS DA CONTA (SOMENTE LEITURA)
════════════════════════════════════════════════════════════ */

function renderizarInfoConta() {
  const container = document.getElementById('account-info-card');
  const usuario    = obterUsuarioAtual();

  if (!usuario) {
    container.innerHTML = '<p class="account-info-hint">Não foi possível carregar os dados da conta.</p>';
    return;
  }

  container.innerHTML = `
    <div class="account-info-row">
      <i class="bi bi-person-fill" aria-hidden="true"></i>
      <div>
        <div class="account-info-label">Usuário</div>
        <div class="account-info-value">${usuario.username}</div>
      </div>
    </div>
    <div class="account-info-row">
      <i class="bi bi-envelope-fill" aria-hidden="true"></i>
      <div>
        <div class="account-info-label">E-mail</div>
        <div class="account-info-value">${usuario.email}</div>
      </div>
    </div>
    <div class="account-info-row">
      <i class="bi bi-telephone-fill" aria-hidden="true"></i>
      <div>
        <div class="account-info-label">Telefone</div>
        <div class="account-info-value">${usuario.telefone}</div>
      </div>
    </div>
    <p class="account-info-hint">Esses são os dados cadastrados na sua conta e serão usados no seu pedido.</p>
  `;
}

/* ════════════════════════════════════════════════════════════
   VALIDAÇÃO DO FORMULÁRIO
════════════════════════════════════════════════════════════ */

function validarFormulario() {
  document.getElementById('btn-confirm').disabled = estado.horarioSelecionado === null;
}

/* ════════════════════════════════════════════════════════════
   ID DO PEDIDO
════════════════════════════════════════════════════════════ */

function gerarIdPedido() {
  const id = 'PED-' + Math.floor(10_000_000 + Math.random() * 90_000_000);
  document.getElementById('pedido-id').textContent = id;
  return id;
}

/* ════════════════════════════════════════════════════════════
   CONFIRMAR PEDIDO
════════════════════════════════════════════════════════════ */

function confirmarPedido() {
  const btnConfirm = document.getElementById('btn-confirm');
  btnConfirm.disabled  = true;
  btnConfirm.innerHTML = '<i class="bi bi-hourglass-split" aria-hidden="true"></i> Processando...';

  const usuario = obterUsuarioAtual();

  if (!usuario) {
    alert('Não foi possível identificar sua conta. Faça login novamente.');
    btnConfirm.disabled  = false;
    btnConfirm.innerHTML = '<i class="bi bi-check-circle" aria-hidden="true"></i> Confirmar Pedido';
    return;
  }

  const cliente = {
    nome:      usuario.username,
    email:     usuario.email,
    telefone:  usuario.telefone,
  };

  const pedidoId = document.getElementById('pedido-id').textContent;
  const total    = estado.carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

  // Itens compactados — sem imagens para caber no QR Code
  const itens = estado.carrinho.map(({ id, nome, preco, quantidade }) => ({ id, nome, preco, quantidade }));

  const pedido = {
    id:               pedidoId,
    usuario:          usuario.username,
    cliente,
    itens,
    horarioRetirada:  estado.horarioSelecionado.hora,
    total,
    status:           'Pendente',
    dataCriacao:      new Date().toISOString(),
  };

  const chavePedidosUsuario = authChaveUsuario('pedidos');
  const meusPedidos = storage.get(chavePedidosUsuario, []);
  storage.set(chavePedidosUsuario, [...meusPedidos, pedido]);
  storage.remove(authChaveUsuario('carrinho'));

  const horarios = storage.get('horariosRetirada', []);
  const indiceHorario = horarios.findIndex((h) => h.id === estado.horarioSelecionado.id);
  if (indiceHorario !== -1) {
    horarios[indiceHorario].pedidos += 1;
    storage.set('horariosRetirada', horarios);
  }

  // Atualiza UI
  document.getElementById('modal-order-code').textContent = pedidoId;
  gerarQRCode(pedido);
  document.getElementById('modal-success').classList.add('show');
}

/* ════════════════════════════════════════════════════════════
   QR CODE
════════════════════════════════════════════════════════════ */

function gerarQRCode(pedido) {
  const container    = document.getElementById('qr-code-modal');
  container.innerHTML = '';

  new QRCode(container, {
    text:         JSON.stringify(pedido),
    width:        220,
    height:       220,
    colorDark:    '#000000',
    colorLight:   '#ffffff',
    correctLevel: QRCode.CorrectLevel.L,
  });
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
    tts.synth.resume();
    tts.paused = false;
    const btn = document.getElementById('tts-play-pause');
    btn.querySelector('i').className = 'bi bi-pause-circle-fill';
    btn.setAttribute('aria-label', 'Pausar narração');
    return;
  }
  if (tts.synth.speaking) {
    tts.synth.pause();
    tts.paused = true;
    const btn = document.getElementById('tts-play-pause');
    btn.querySelector('i').className = 'bi bi-play-circle-fill';
    btn.setAttribute('aria-label', 'Continuar narração');
    return;
  }
  tts.iniciar();
}

function pararLeitura() {
  if (tts.synth.speaking || tts.paused) {
    tts.synth.cancel();
    tts.resetarUI();
  }
}

window.addEventListener('beforeunload', () => tts.synth.cancel());