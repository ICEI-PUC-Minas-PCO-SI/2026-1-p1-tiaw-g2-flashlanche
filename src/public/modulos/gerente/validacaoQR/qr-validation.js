/* ════════════════════════════════════════════════════════════
   ESTADO GLOBAL
════════════════════════════════════════════════════════════ */

let leitorQR = null;

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
const obterProdutos  = ()       => storage.get('produtos', []);
const salvarProdutos = (lista)  => storage.set('produtos', lista);

/* ════════════════════════════════════════════════════════════
   FORMATAÇÃO
════════════════════════════════════════════════════════════ */

function formatarHora(iso) {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/* ════════════════════════════════════════════════════════════
   ESTOQUE — baixa automática na retirada
════════════════════════════════════════════════════════════ */

function resolverStatusEstoque(quantidade) {
  if (quantidade === 0) return 'esgotado';
  if (quantidade <= 4)  return 'baixo';
  return 'disponivel';
}

function darBaixaNoEstoque(itensVendidos) {
  const produtos = obterProdutos();

  itensVendidos.forEach((itemVendido) => {
    const produto = produtos.find((p) => p.id === itemVendido.id);
    if (!produto) return;

    produto.quantidade = Math.max((produto.quantidade || 0) - itemVendido.quantidade, 0);
    produto.status      = resolverStatusEstoque(produto.quantidade);
  });

  salvarProdutos(produtos);
}

/* ════════════════════════════════════════════════════════════
   VALIDAÇÃO DE QR CODE
════════════════════════════════════════════════════════════ */

function parsearPedidoEscaneado(texto) {
  const pedido = JSON.parse(texto);

  if (!pedido.id || !pedido.cliente || !pedido.itens) {
    throw new Error('Formato de QR Code não reconhecido pelo sistema.');
  }

  return pedido;
}

function registrarPedidoEscaneado(pedido) {
  const pedidos = obterPedidos();

  pedido.status        = 'Pendente';
  pedido.dataRetirada   = new Date().toISOString();

  salvarPedidos([...pedidos, pedido]);
  darBaixaNoEstoque(pedido.itens);
}

function validarQR() {
  const inputEl    = document.getElementById('qr-input');
  const textoLido  = inputEl.value.trim();

  if (!textoLido) {
    mostrarResultadoErro('Campo vazio', 'Por favor, insira ou escaneie o código do pedido.');
    return;
  }

  try {
    const pedidoEscaneado = parsearPedidoEscaneado(textoLido);
    const pedidoJaExiste  = obterPedidos().find((p) => p.id === pedidoEscaneado.id);

    if (pedidoJaExiste) {
      mostrarResultadoAviso(pedidoJaExiste);
      inputEl.value = '';
      return;
    }

    registrarPedidoEscaneado(pedidoEscaneado);
    mostrarResultadoSucesso(pedidoEscaneado);
    renderizarHistorico();

    inputEl.value = '';
    inputEl.focus();

  } catch {
    mostrarResultadoErro('QR Code Inválido', 'O código escaneado não é um pedido válido do FlashLanche.');
    inputEl.value = '';
    inputEl.focus();
  }
}

/* ════════════════════════════════════════════════════════════
   RENDERIZAÇÃO — RESULTADO DA VALIDAÇÃO
════════════════════════════════════════════════════════════ */

function mostrarResultadoSucesso(pedido) {
  const container  = document.getElementById('result-container');
  const resumoItens = pedido.itens.map((item) => `${item.quantidade}x ${item.nome}`).join(', ');

  container.innerHTML = `
    <div class="result-card result-card--success" role="status">
      <div class="result-code">${pedido.id}</div>
      <div class="result-status status-valido">
        <i class="bi bi-check-circle" aria-hidden="true"></i> Pedido Validado e Retirado
      </div>
      <div class="result-info"><i class="bi bi-person" aria-hidden="true"></i> <b>Cliente:</b> ${pedido.cliente.nome}</div>
      <div class="result-info"><i class="bi bi-box-seam" aria-hidden="true"></i> <b>Itens:</b> ${resumoItens}</div>
      <div class="result-info"><i class="bi bi-currency-dollar" aria-hidden="true"></i> <b>Total pago:</b> R$ ${pedido.total.toFixed(2)}</div>
    </div>
  `;
}

function mostrarResultadoAviso(pedido) {
  const container = document.getElementById('result-container');
  const dataFormatada = pedido.dataRetirada ? formatarHora(pedido.dataRetirada) : 'Data desconhecida';

  container.innerHTML = `
    <div class="result-card result-card--warning" role="status">
      <div class="result-code">${pedido.id}</div>
      <div class="result-status status-aviso">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i> Pedido Já Retirado
      </div>
      <div class="result-info">Este QR Code já foi escaneado no sistema às <b>${dataFormatada}</b>.</div>
      <div class="result-info"><b>Cliente:</b> ${pedido.cliente.nome}</div>
    </div>
  `;
}

function mostrarResultadoErro(titulo, mensagem) {
  const container = document.getElementById('result-container');
  container.innerHTML = `
    <div class="result-card result-card--error" role="alert">
      <div class="result-status status-invalido">
        <i class="bi bi-x-circle" aria-hidden="true"></i> ${titulo}
      </div>
      <div class="result-info">${mensagem}</div>
    </div>
  `;
}

/* ════════════════════════════════════════════════════════════
   TABELA DE HISTÓRICO
════════════════════════════════════════════════════════════ */

function criarLinhaHistorico(pedido) {
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td class="cell-order-id">${pedido.id}</td>
    <td>
      <div class="cell-client-name">${pedido.cliente.nome}</div>
      <div class="cell-client-meta">${pedido.itens.length} itens</div>
    </td>
    <td>
      <span class="result-status status-retirado result-status--compact">${pedido.status}</span>
    </td>
    <td>${formatarHora(pedido.dataRetirada)}</td>
    <td>
      <button class="btn-action btn-action-danger" data-id="${pedido.id}" aria-label="Remover pedido ${pedido.id} do histórico">
        <i class="bi bi-trash" aria-hidden="true"></i>
      </button>
    </td>
  `;

  tr.querySelector('[data-id]').addEventListener('click', () => excluirDoHistorico(pedido.id));

  return tr;
}

function renderizarHistorico() {
  const tbody    = document.getElementById('qr-history');
  const pedidos  = [...obterPedidos()].sort(
    (a, b) => new Date(b.dataRetirada || 0) - new Date(a.dataRetirada || 0),
  );

  if (pedidos.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5" class="cell-empty">Nenhum QR escaneado ainda.</td></tr>
    `;
    return;
  }

  tbody.innerHTML = '';
  const fragment = document.createDocumentFragment();
  pedidos.forEach((pedido) => fragment.appendChild(criarLinhaHistorico(pedido)));
  tbody.appendChild(fragment);
}

function excluirDoHistorico(id) {
  if (!confirm('Deseja remover este pedido do histórico? Isso apagará os dados dele no sistema da lanchonete.')) {
    return;
  }

  salvarPedidos(obterPedidos().filter((p) => p.id !== id));
  renderizarHistorico();
}

/* ════════════════════════════════════════════════════════════
   CÂMERA — LEITURA EM TEMPO REAL
════════════════════════════════════════════════════════════ */

function abrirCamera() {
  const cameraContainer = document.getElementById('camera-container');
  const btnAbrirCamera  = document.getElementById('btn-abrir-camera');

  cameraContainer.style.display = 'block';
  btnAbrirCamera.disabled       = true;

  leitorQR = new Html5Qrcode('reader');

  const configuracao = { fps: 10, qrbox: { width: 250, height: 250 } };

  leitorQR
    .start({ facingMode: 'environment' }, configuracao, aoLerQRCodeComSucesso, aoFalharLeitura)
    .catch(() => {
      alert('Erro ao acessar a câmera. Verifique se o navegador tem permissão.');
      fecharCamera();
    });
}

function fecharCamera() {
  const cameraContainer = document.getElementById('camera-container');
  const btnAbrirCamera  = document.getElementById('btn-abrir-camera');

  if (!leitorQR) {
    cameraContainer.style.display = 'none';
    btnAbrirCamera.disabled       = false;
    return;
  }

  leitorQR
    .stop()
    .then(() => {
      cameraContainer.style.display = 'none';
      btnAbrirCamera.disabled       = false;
      leitorQR.clear();
    })
    .catch((erro) => console.error('Erro ao parar a câmera:', erro));
}

function aoLerQRCodeComSucesso(textoDecodificado) {
  fecharCamera();
  document.getElementById('qr-input').value = textoDecodificado;
  validarQR();
}

function aoFalharLeitura() {}

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

document.addEventListener('DOMContentLoaded', () => {
  renderizarHistorico();

  // Permite que leitores de QR físicos disparem a validação simulando "Enter"
  document.getElementById('qr-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') validarQR();
  });
});