/* ════════════════════════════════════════════════════════════
   NAVEGAÇÃO
════════════════════════════════════════════════════════════ */

const ROTAS = {
  carrinho: '../../cliente/carrinho/cart.html',
  pedidos:  '../../cliente/pedidos/orders.html',
  perfil:   '../../cliente/perfil/profile.html',
  home:     '../../../index.html',
};

const irPara = (rota) => () => { window.location.href = ROTAS[rota]; };

const irParaCarrinho = irPara('carrinho');
const irParaPedidos  = irPara('pedidos');
const irParaPerfil   = irPara('perfil');
const voltarHome     = irPara('home');

const sair = () => { encerrarSessao(); window.location.href = ROTAS.home; };

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
  set: (chave, valor) => {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch (e) {
      console.error(`Erro ao salvar "${chave}" no localStorage:`, e);
    }
  },
};

/* ════════════════════════════════════════════════════════════
   PRODUTOS
════════════════════════════════════════════════════════════ */

const obterProdutos = () => storage.get('produtos', []);

/* ════════════════════════════════════════════════════════════
   CARRINHO
════════════════════════════════════════════════════════════ */

const obterCarrinho  = ()        => storage.get(authChaveUsuario('carrinho'), []);
const salvarCarrinho = (carrinho) => storage.set(authChaveUsuario('carrinho'), carrinho);

function adicionarAoCarrinho(idProduto) {
  const produto = obterProdutos().find((p) => p.id === idProduto);
  if (!produto) return;

  const carrinho     = obterCarrinho();
  const itemExistente = carrinho.find((item) => item.id === idProduto);

  if (itemExistente) {
    itemExistente.quantidade += 1;
  } else {
    carrinho.push({ ...produto, quantidade: 1 });
  }

  salvarCarrinho(carrinho);
  atualizarContadorCarrinho();
}

function atualizarContadorCarrinho() {
  const total = obterCarrinho().reduce((acc, item) => acc + item.quantidade, 0);
  document.getElementById('cart-count').textContent = total;
}

/* ════════════════════════════════════════════════════════════
   FAVORITOS
════════════════════════════════════════════════════════════ */

const obterFavoritos  = ()          => storage.get(authChaveUsuario('favoritos'), []);
const salvarFavoritos = (favoritos) => storage.set(authChaveUsuario('favoritos'), favoritos);
const isFavorito      = (id)        => obterFavoritos().includes(id);

function toggleFavorito(id, event) {
  event?.stopPropagation();

  let favoritos    = obterFavoritos();
  const favoritado = favoritos.includes(id);

  favoritos = favoritado
    ? favoritos.filter((fid) => fid !== id)
    : [...favoritos, id];

  salvarFavoritos(favoritos);

  const botao = document.querySelector(`.btn-favorite[data-id="${id}"]`);
  if (!botao) return;

  const icone = botao.querySelector('i');
  botao.classList.toggle('active', !favoritado);
  icone.className = favoritado ? 'bi bi-heart' : 'bi bi-heart-fill';
}

/* ════════════════════════════════════════════════════════════
   ESTADO — filtro e ordenação
════════════════════════════════════════════════════════════ */

let categoriaAtual = 'todos';
let ordenacaoAtual = 'padrao';

/* ════════════════════════════════════════════════════════════
   FILTRO
════════════════════════════════════════════════════════════ */

function filtrarCategoria(categoria) {
  categoriaAtual = categoria;
  atualizarBotoesFiltro();
  renderizarProdutos();
}

function atualizarBotoesFiltro() {
  document.querySelectorAll('.btn-filter').forEach((botao) => {
    const ativo = botao.textContent.trim().toLowerCase() === categoriaAtual;
    botao.style.background   = ativo ? 'var(--orange)'      : 'var(--canvas)';
    botao.style.color        = ativo ? 'white'              : 'var(--text-primary)';
    botao.style.borderColor  = ativo ? 'var(--orange)'      : 'var(--border-gray)';
  });
}

/* ════════════════════════════════════════════════════════════
   ORDENAÇÃO
════════════════════════════════════════════════════════════ */

function ordenarProdutos() {
  ordenacaoAtual = document.getElementById('sort-select').value;
  renderizarProdutos();
}

/* ════════════════════════════════════════════════════════════
   RENDERIZAÇÃO
════════════════════════════════════════════════════════════ */

function resolverImagem(produto) {
  if (produto.imagem?.startsWith('http')) {
    return `<img src="${produto.imagem}" alt="${produto.nome}" class="product-img">`;
  }
  return `<div class="product-emoji">${produto.imagem || '🍔'}</div>`;
}

function criarCardProduto(produto) {
  const favorito = isFavorito(produto.id);

  const card    = document.createElement('div');
  card.className = 'product-card';

  card.innerHTML = `
    <div class="product-image">
      ${resolverImagem(produto)}
      <button
        class="btn-favorite ${favorito ? 'active' : ''}"
        data-id="${produto.id}"
        onclick="toggleFavorito('${produto.id}', event)"
        aria-label="${favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
      >
        <i class="bi ${favorito ? 'bi-heart-fill' : 'bi-heart'}"></i>
      </button>
    </div>

    <div class="product-content">
      <div class="product-category">${produto.categoria}</div>
      <h3 class="product-title">${produto.nome}</h3>
      <p class="product-description">${produto.descricao}</p>

      <div class="product-footer">
        <span class="product-price">R$ ${produto.preco.toFixed(2)}</span>
        <button class="btn-add-cart" onclick="adicionarAoCarrinho('${produto.id}')">
          <i class="bi bi-cart-plus"></i> Adicionar
        </button>
      </div>
    </div>
  `;

  return card;
}

function aplicarFiltroEOrdenacao(produtos) {
  const filtrados = categoriaAtual === 'todos'
    ? [...produtos]
    : produtos.filter((p) => p.categoria === categoriaAtual);

  const ordenadores = {
    'menor-preco': (a, b) => a.preco - b.preco,
    'maior-preco': (a, b) => b.preco - a.preco,
  };

  if (ordenadores[ordenacaoAtual]) {
    filtrados.sort(ordenadores[ordenacaoAtual]);
  }

  return filtrados;
}

function renderizarProdutos() {
  const grid    = document.getElementById('product-grid');
  const produtos = aplicarFiltroEOrdenacao(obterProdutos());

  grid.innerHTML = '';

  if (produtos.length === 0) {
    grid.innerHTML = `
      <p class="empty-state">Nenhum produto encontrado nesta categoria.</p>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();
  produtos.forEach((produto) => fragment.appendChild(criarCardProduto(produto)));
  grid.appendChild(fragment);
}

/* ════════════════════════════════════════════════════════════
   ACESSIBILIDADE — TEXT-TO-SPEECH
════════════════════════════════════════════════════════════ */

const tts = {
  utterance: null,
  paused:    false,

  get synth() { return window.speechSynthesis; },

  prepararTexto() {
    const alvo  = document.querySelector('main') || document.body;
    return (alvo.innerText || alvo.textContent).replace(/\n+/g, '. ').trim();
  },

  resetarUI() {
    const btnPlay  = document.getElementById('tts-play-pause');
    const btnStop  = document.getElementById('tts-stop');
    btnPlay.querySelector('i').className = 'bi bi-play-circle-fill';
    btnPlay.setAttribute('aria-label', 'Iniciar narração da página');
    btnStop.disabled = true;
    this.paused = false;
  },

  iniciar() {
    const texto = this.prepararTexto();
    if (!texto) { alert('Não foi possível encontrar conteúdo legível.'); return; }

    this.utterance        = new SpeechSynthesisUtterance(texto);
    this.utterance.lang   = 'pt-BR';
    this.utterance.rate   = 1.5;
    this.utterance.onend  = () => this.resetarUI();
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
  renderizarProdutos();
  atualizarBotoesFiltro();
  atualizarContadorCarrinho();
});