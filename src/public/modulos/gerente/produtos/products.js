/* ════════════════════════════════════════════════════════════
   ESTADO GLOBAL
════════════════════════════════════════════════════════════ */

let idEmEdicao = null;

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

const obterProdutos     = ()      => storage.get('produtos', []);
const salvarNoStorage   = (lista) => storage.set('produtos', lista);

/* ════════════════════════════════════════════════════════════
   FORMULÁRIO — leitura e preenchimento
════════════════════════════════════════════════════════════ */

const CAMPOS_FORM = ['nome', 'descricao', 'preco', 'categoria', 'imagem'];

function lerFormulario() {
  return {
    nome:      document.getElementById('nome').value.trim(),
    descricao: document.getElementById('descricao').value.trim(),
    preco:     document.getElementById('preco').value,
    categoria: document.getElementById('categoria').value,
    imagem:    document.getElementById('imagem').value.trim(),
  };
}

function preencherFormulario(produto) {
  document.getElementById('nome').value      = produto?.nome      ?? '';
  document.getElementById('descricao').value = produto?.descricao ?? '';
  document.getElementById('preco').value     = produto?.preco     ?? '';
  document.getElementById('categoria').value = produto?.categoria ?? 'lanches';
  document.getElementById('imagem').value    = produto?.imagem    ?? '';
}

/* ════════════════════════════════════════════════════════════
   MODAL
════════════════════════════════════════════════════════════ */

function abrirModal() {
  idEmEdicao = null;

  document.getElementById('modal-title').textContent = 'Novo Produto';
  document.getElementById('btn-save').textContent    = 'Adicionar Produto';

  preencherFormulario(null);

  const modal = document.getElementById('modal-form');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('nome').focus();
}

function fecharModal() {
  const modal = document.getElementById('modal-form');
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

document.getElementById('modal-form')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) fecharModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fecharModal();
});

/* ════════════════════════════════════════════════════════════
   CRUD
════════════════════════════════════════════════════════════ */

function salvarProduto() {
  const { nome, descricao, preco, categoria, imagem } = lerFormulario();

  if (!nome || !descricao || !preco) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }

  const lista = obterProdutos();
  const dados = { nome, descricao, preco: parseFloat(preco), categoria, imagem };

  if (idEmEdicao !== null) {
    const index = lista.findIndex((p) => p.id === idEmEdicao);
    if (index !== -1) lista[index] = { ...lista[index], ...dados };
  } else {
    lista.push({ id: Date.now().toString(), ...dados });
  }

  salvarNoStorage(lista);
  fecharModal();
  renderizarProdutos();
}

function editarProduto(id) {
  const produto = obterProdutos().find((p) => p.id === id);
  if (!produto) return;

  idEmEdicao = id;

  document.getElementById('modal-title').textContent = 'Editar Produto';
  document.getElementById('btn-save').textContent    = 'Salvar Alterações';

  preencherFormulario(produto);

  const modal = document.getElementById('modal-form');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function excluirProduto(id) {
  if (!confirm('Deseja excluir este produto?')) return;

  salvarNoStorage(obterProdutos().filter((p) => p.id !== id));
  renderizarProdutos();
}

/* ════════════════════════════════════════════════════════════
   RENDERIZAÇÃO
════════════════════════════════════════════════════════════ */

function resolverImagem(produto) {
  if (produto.imagem?.startsWith('http')) {
    return `<img class="product-image-img" src="${produto.imagem}" alt="${produto.nome}">`;
  }
  return `<span class="product-image-text">${produto.imagem || '🍽️'}</span>`;
}

function criarCardProduto(produto) {
  const card = document.createElement('div');
  card.className = 'product-item';

  card.innerHTML = `
    <div class="product-header">
      <div class="product-image">${resolverImagem(produto)}</div>
      <div class="product-name">${produto.nome}</div>
      <div class="product-price">R$ ${produto.preco.toFixed(2)}</div>
    </div>
    <div class="product-body">
      <div class="product-desc">${produto.descricao}</div>
      <div class="product-footer">
        <button class="btn-icon" data-action="editar" data-id="${produto.id}">
          <i class="bi bi-pencil" aria-hidden="true"></i> Editar
        </button>
        <button class="btn-icon btn-icon-danger" data-action="excluir" data-id="${produto.id}" aria-label="Excluir ${produto.nome}">
          <i class="bi bi-trash" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `;

  card.querySelector('[data-action="editar"]').addEventListener('click', () => editarProduto(produto.id));
  card.querySelector('[data-action="excluir"]').addEventListener('click', () => excluirProduto(produto.id));

  return card;
}

function renderizarProdutos() {
  const grid  = document.getElementById('products-grid');
  const lista = obterProdutos();

  grid.innerHTML = '';

  if (lista.length === 0) {
    grid.innerHTML = `
      <p class="products-empty">
        Nenhum produto cadastrado. Clique em <strong>Novo Produto</strong> para começar.
      </p>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();
  lista.forEach((produto) => fragment.appendChild(criarCardProduto(produto)));
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

document.addEventListener('DOMContentLoaded', renderizarProdutos);