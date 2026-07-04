/* ════════════════════════════════════════════════════════════
   NAVEGAÇÃO
════════════════════════════════════════════════════════════ */

const irParaCheckout  = () => { window.location.href = '../checkout/checkout.html'; };
const voltarParaShop  = () => { window.location.href = '../cardapio/shop.html'; };
const sair            = () => { encerrarSessao(); window.location.href = '../../../index.html'; };

/* ════════════════════════════════════════════════════════════
   STORAGE — utilitários genéricos
════════════════════════════════════════════════════════════ */

const storage = {
  get: (chave, fallback = null) => {
    try {
      const dados = localStorage.getItem(chave);
      return dados ? JSON.parse(dados) : fallback;
    } catch {
      return fallback;
    }
  },
  set:    (chave, valor) => { try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { console.error(e); } },
  remove: (chave)        => localStorage.removeItem(chave),
};

/* ════════════════════════════════════════════════════════════
   CARRINHO
════════════════════════════════════════════════════════════ */

const obterCarrinho  = ()        => storage.get(authChaveUsuario('carrinho'), []);
const salvarCarrinho = (carrinho) => storage.set(authChaveUsuario('carrinho'), carrinho);

function alterarQuantidade(id, delta) {
  let carrinho = obterCarrinho();
  const item   = carrinho.find((p) => p.id === id);
  if (!item) return;

  item.quantidade += delta;

  if (item.quantidade <= 0) {
    carrinho = carrinho.filter((p) => p.id !== id);
  }

  salvarCarrinho(carrinho);
  renderizarCarrinho();
}

const aumentarQuantidade = (id) => alterarQuantidade(id, +1);
const diminuirQuantidade = (id) => alterarQuantidade(id, -1);

function removerItem(id) {
  salvarCarrinho(obterCarrinho().filter((p) => p.id !== id));
  renderizarCarrinho();
}

function limparCarrinho() {
  if (!confirm('Deseja limpar o carrinho?')) return;
  storage.remove(authChaveUsuario('carrinho'));
  removerCupom(true);
  renderizarCarrinho();
}

/* ════════════════════════════════════════════════════════════
   CUPOM DE DESCONTO
════════════════════════════════════════════════════════════ */

let cupomAtivo = null;

function aplicarCupom() {
  const codigo = document.getElementById('input-cupom').value.toUpperCase().trim();

  if (!codigo) { removerCupom(); return; }

  const cupons         = storage.get('cupons', []);
  const cupomEncontrado = cupons.find((c) => c.codigo === codigo);

  if (!cupomEncontrado) {
    exibirMensagemCupom('Cupom inválido ou não encontrado.', 'var(--red)');
    removerCupom(false);
    return;
  }

  if (cupomEncontrado.status !== 'Ativo') {
    exibirMensagemCupom('Este cupom não está mais ativo.', 'var(--red)');
    removerCupom(false);
    return;
  }

  const hoje          = new Date(); hoje.setHours(0, 0, 0, 0);
  const validadeCupom = new Date(`${cupomEncontrado.validade}T23:59:59`);

  if (validadeCupom < hoje) {
    exibirMensagemCupom('Este cupom já expirou.', 'var(--red)');
    removerCupom(false);
    return;
  }

  cupomAtivo = cupomEncontrado;
  storage.set(authChaveUsuario('cupomCliente'), cupomAtivo);
  aplicarDescontoNoCarrinho(cupomAtivo.desconto);
  exibirMensagemCupom(`Desconto de ${cupomAtivo.desconto}% aplicado com sucesso!`, 'var(--green)');
  renderizarCarrinho();
}

function removerCupom(limparCampo = true) {
  cupomAtivo = null;
  storage.remove(authChaveUsuario('cupomCliente'));
  removerDescontoDoCarrinho();

  if (limparCampo) {
    document.getElementById('input-cupom').value = '';
    document.getElementById('cupom-msg').textContent = '';
  }

  renderizarCarrinho();
}

function carregarCupomSalvo() {
  const salvo = storage.get(authChaveUsuario('cupomCliente'));
  if (!salvo) return;
  document.getElementById('input-cupom').value = salvo.codigo;
  aplicarCupom();
}

function exibirMensagemCupom(texto, cor) {
  const el   = document.getElementById('cupom-msg');
  el.textContent = texto;
  el.style.color = cor;
}

/* ════════════════════════════════════════════════════════════
   DESCONTO NO CARRINHO
════════════════════════════════════════════════════════════ */

function aplicarDescontoNoCarrinho(percentual) {
  const carrinho = obterCarrinho().map((item) => {
    const precoOriginal = item.precoOriginal ?? item.preco;
    return { ...item, precoOriginal, preco: precoOriginal * (1 - percentual / 100) };
  });
  salvarCarrinho(carrinho);
}

function removerDescontoDoCarrinho() {
  const carrinho = obterCarrinho().map(({ precoOriginal, preco, ...resto }) => ({
    ...resto,
    preco: precoOriginal ?? preco,
  }));
  salvarCarrinho(carrinho);
}

/* ════════════════════════════════════════════════════════════
   RENDERIZAÇÃO
════════════════════════════════════════════════════════════ */

function resolverImagem(item) {
  if (item.imagem?.startsWith('http')) {
    return `<img src="${item.imagem}" alt="${item.nome}" class="cart-item-img">`;
  }
  return `<div class="cart-item-image">${item.imagem || '🍔'}</div>`;
}

function criarItemHtml(item) {
  return `
    <div class="cart-item">
      ${resolverImagem(item)}
      <div class="cart-item-info">
        <div class="cart-item-name">${item.nome}</div>
        <div class="cart-item-price">R$ ${item.preco.toFixed(2)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="diminuirQuantidade('${item.id}')" aria-label="Diminuir quantidade">−</button>
        <div class="qty-display" aria-label="Quantidade: ${item.quantidade}">${item.quantidade}</div>
        <button class="qty-btn" onclick="aumentarQuantidade('${item.id}')" aria-label="Aumentar quantidade">+</button>
        <button class="btn-remove" onclick="removerItem('${item.id}')">Remover</button>
      </div>
    </div>
  `;
}

function renderizarCarrinho() {
  const container = document.getElementById('cart-items-container');
  const carrinho  = obterCarrinho();

  if (carrinho.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <p class="cart-empty-icon"><i class="bi bi-inbox" aria-hidden="true"></i></p>
        <p>Seu carrinho está vazio</p>
        <button class="btn-checkout btn-checkout--auto" onclick="voltarParaShop()">Ir para a Loja</button>
      </div>
    `;
    atualizarResumo([]);
    return;
  }

  container.innerHTML = carrinho.map(criarItemHtml).join('');
  atualizarResumo(carrinho);
}

/* ════════════════════════════════════════════════════════════
   RESUMO
════════════════════════════════════════════════════════════ */

function atualizarResumo(carrinho) {
  const { subtotal, totalComDesconto } = carrinho.reduce(
    (acc, item) => {
      const original = item.precoOriginal ?? item.preco;
      acc.subtotal        += original        * item.quantidade;
      acc.totalComDesconto += item.preco      * item.quantidade;
      return acc;
    },
    { subtotal: 0, totalComDesconto: 0 },
  );

  const taxa          = 0;
  const valorDesconto = subtotal - totalComDesconto;
  const total         = totalComDesconto + taxa;

  const rowDesconto = document.getElementById('row-desconto');
  rowDesconto.style.display = valorDesconto > 0.001 ? 'flex' : 'none';

  document.getElementById('subtotal').textContent      = subtotal.toFixed(2);
  document.getElementById('taxa').textContent          = taxa.toFixed(2);
  document.getElementById('valor-desconto').textContent = valorDesconto.toFixed(2);
  document.getElementById('total').textContent         = total.toFixed(2);
  document.getElementById('btn-checkout').disabled     = carrinho.length === 0;
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

/* ════════════════════════════════════════════════════════════
   INICIALIZAÇÃO
════════════════════════════════════════════════════════════ */

window.addEventListener('DOMContentLoaded', () => {
  renderizarCarrinho();
  carregarCupomSalvo();
});