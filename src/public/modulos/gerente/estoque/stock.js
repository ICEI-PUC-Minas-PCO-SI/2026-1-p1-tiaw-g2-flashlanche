let filtroStatusAtivo = 'todos';

/**
 * ═════════════════════════════════════════════════════
 * STORAGE UNIFICADO (Conectado ao CRUD de Produtos)
 * ═════════════════════════════════════════════════════
 */
const STORAGE_KEYS = {
  PRODUTOS: 'produtos',
};

/**
 * Lê e faz parse de um valor JSON do localStorage.
 * Retorna `padrao` se a chave não existir ou o JSON estiver corrompido,
 * em vez de deixar o erro quebrar a página de estoque inteira.
 */
function obterDoStorage(chave, padrao) {
  const dados = localStorage.getItem(chave);

  if (!dados) {
    return padrao;
  }

  try {
    return JSON.parse(dados);
  } catch (erro) {
    console.error(`Não foi possível ler "${chave}" do localStorage:`, erro);
    return padrao;
  }
}

function salvarNoStorage(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (erro) {
    console.error(`Não foi possível salvar "${chave}" no localStorage:`, erro);
  }
}

function obterEstoque() {
  // Lemos direto da chave 'produtos' que alimenta todo o sistema
  const produtos = obterDoStorage(STORAGE_KEYS.PRODUTOS, []);

  // Garante que todo produto tenha a propriedade de quantidade e status
  produtos.forEach((p) => {
    if (p.quantidade === undefined) {
      p.quantidade = 0;
    }
    p.status = calcularStatus(p.quantidade);
  });

  return produtos;
}

function salvarEstoque(lista) {
  // Salva direto na chave principal
  salvarNoStorage(STORAGE_KEYS.PRODUTOS, lista);
}

function calcularStatus(quantidade) {
  if (quantidade <= 0) return 'esgotado';
  if (quantidade <= 4) return 'baixo';
  return 'disponivel';
}

function atualizarProdutoEstoque(id, alterar) {
  const lista = obterEstoque();
  const produto = lista.find((p) => p.id === id);

  if (!produto) {
    return null;
  }

  alterar(produto);
  produto.status = calcularStatus(produto.quantidade);
  salvarEstoque(lista);

  return produto;
}

/**
 * ═════════════════════════════════════════════════════
 * INICIALIZAÇÃO
 * ═════════════════════════════════════════════════════
 */
function inicializarDados() {
  renderizarTabela();
  atualizarResumoCards();
  popularSelectProdutos();
}

/**
 * ═════════════════════════════════════════════════════
 * RENDERIZAÇÃO E FILTROS
 * ═════════════════════════════════════════════════════
 */
const COMPARADORES_ORDENACAO = {
  nome: (a, b) => a.nome.localeCompare(b.nome),
  'quantidade-asc': (a, b) => a.quantidade - b.quantidade,
  'quantidade-desc': (a, b) => b.quantidade - a.quantidade,
  categoria: (a, b) => a.categoria.localeCompare(b.categoria),
};

function renderizarTabela() {
  const tbody = document.getElementById('stock-body');
  const busca = document.getElementById('search-input').value.toLowerCase().trim();
  const ordenacao = document.getElementById('sort-select').value;

  let filtrado = obterEstoque().filter((item) => {
    if (filtroStatusAtivo === 'todos') return true;
    return item.status === filtroStatusAtivo;
  });

  if (busca !== '') {
    filtrado = filtrado.filter((item) =>
      item.nome.toLowerCase().includes(busca) ||
      item.categoria.toLowerCase().includes(busca)
    );
  }

  filtrado.sort(COMPARADORES_ORDENACAO[ordenacao] || (() => 0));

  tbody.innerHTML = '';

  if (filtrado.length === 0) {
    tbody.appendChild(criarLinhaVazia());
    return;
  }

  filtrado.forEach((item) => {
    tbody.appendChild(criarLinhaTabela(item));
  });
}

function criarLinhaVazia() {
  const tr = document.createElement('tr');
  tr.className = 'empty-row';

  tr.innerHTML = `
    <td colspan="5">
      <i class="bi bi-search"></i> Nenhum produto encontrado.
    </td>`;

  return tr;
}

/**
 * Mapeia a categoria de um produto para a classe de badge correspondente.
 */
function obterClasseCategoria(categoria) {
  const classes = {
    lanches: 'badge-cat-lanches',
    bebidas: 'badge-cat-bebidas',
    doces: 'badge-cat-doces',
  };

  return classes[categoria] || 'badge-cat-outros';
}

/**
 * Deriva a classe visual de quantidade a partir do status já calculado
 * por calcularStatus(), em vez de repetir os mesmos limiares (<=0, <=4)
 * com nomes de classe diferentes.
 */
function obterClasseQuantidade(status) {
  const classes = {
    esgotado: 'qty-zero',
    baixo: 'qty-low',
    disponivel: 'qty-ok',
  };

  return classes[status] || 'qty-ok';
}

function criarLinhaTabela(item) {
  const tr = document.createElement('tr');
  tr.classList.add('row-' + item.status);

  const statusInfo = obterInfoStatus(item.status);

  tr.innerHTML = `
    <td>
      <div class="produto-cell">
        <div class="produto-emoji"></div>
        <div>
          <div class="produto-nome"></div>
          <div class="produto-desc"></div>
        </div>
      </div>
    </td>
    <td><span class="badge-cat ${obterClasseCategoria(item.categoria)}"></span></td>
    <td>
      <div class="qty-controls">
        <button class="qty-btn-sm" title="Diminuir">
          <i class="bi bi-dash"></i>
        </button>
        <span class="qty-display ${obterClasseQuantidade(item.status)}"></span>
        <button class="qty-btn-sm" title="Aumentar">
          <i class="bi bi-plus"></i>
        </button>
      </div>
    </td>
    <td>
      <span class="badge-status badge-status-${item.status}">${statusInfo.icone} <span></span></span>
    </td>
    <td>
      <div class="acoes-cell">
        <button class="btn-acao" title="Editar quantidade">
          <i class="bi bi-pencil"></i> Editar
        </button>
        <button class="btn-acao btn-acao-danger" title="Zerar estoque">
          <i class="bi bi-trash3"></i>
        </button>
      </div>
    </td>
  `;

  /*═════════════════════════════════════════════════════TEXTOS DO PRODUTO (textContent evita injeção de HTML)═════════════════════════════════════════*/

  tr.querySelector('.produto-emoji').textContent = item.imagem || '🍽️';
  tr.querySelector('.produto-nome').textContent = item.nome;
  tr.querySelector('.produto-desc').textContent = item.descricao || '';
  tr.querySelector('.badge-cat').textContent = item.categoria;
  tr.querySelector('.qty-display').textContent = item.quantidade;
  tr.querySelector('.badge-status span').textContent = statusInfo.texto;

  /*═════════════════════════════════════════════════════EVENTOS (listeners em vez de onclick inline)═════════════════════════════════════════*/

  const [btnDiminuir, btnAumentar] = tr.querySelectorAll('.qty-btn-sm');
  btnDiminuir.addEventListener('click', () => alterarQuantidadeRapido(item.id, -1));
  btnAumentar.addEventListener('click', () => alterarQuantidadeRapido(item.id, 1));

  const [btnEditar, btnExcluir] = tr.querySelectorAll('.btn-acao');
  btnEditar.addEventListener('click', () => abrirModalEditar(item.id));
  btnExcluir.addEventListener('click', () => abrirModalExcluir(item.id));

  return tr;
}

function obterInfoStatus(status) {
  if (status === 'esgotado') return { icone: '✕', texto: 'Esgotado' };
  if (status === 'baixo') return { icone: '⚠', texto: 'Estoque Baixo' };
  return { icone: '✓', texto: 'Disponível' };
}

/**
 * ═════════════════════════════════════════════════════
 * CARDS DE RESUMO E FILTROS
 * ═════════════════════════════════════════════════════
 */
function atualizarResumoCards() {
  const lista = obterEstoque();
  const ok = lista.filter(i => i.status === 'disponivel').length;
  const low = lista.filter(i => i.status === 'baixo').length;
  const out = lista.filter(i => i.status === 'esgotado').length;

  document.getElementById('count-ok').textContent = ok;
  document.getElementById('count-low').textContent = low;
  document.getElementById('count-out').textContent = out;
  document.getElementById('count-total').textContent = lista.length;
}

function filtrarStatus(btn) {
  filtroStatusAtivo = btn.getAttribute('data-filter');
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderizarTabela();
}

function aplicarFiltros() {
  renderizarTabela();
}

/**
 * ═════════════════════════════════════════════════════
 * MODAL ADICIONAR ESTOQUE
 * ═════════════════════════════════════════════════════
 */
function popularSelectProdutos() {
  const select = document.getElementById('add-produto-id');
  const estoque = obterEstoque();

  select.innerHTML = '<option value="">Selecione um produto…</option>';
  estoque.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.imagem || '🍽️'} ${p.nome} (Atual: ${p.quantidade})`;
    select.appendChild(opt);
  });
}

function abrirModalAdicionar() {
  document.getElementById('add-quantidade').value = 1;
  popularSelectProdutos();
  abrirModal('modal-adicionar');
}

function salvarAdicao() {
  const id = document.getElementById('add-produto-id').value;
  const qtd = parseInt(document.getElementById('add-quantidade').value, 10);

  if (!id) return exibirToast('Selecione um produto.', 'error');
  if (isNaN(qtd) || qtd < 1) return exibirToast('Informe uma quantidade válida.', 'error');

  const produto = atualizarProdutoEstoque(id, (p) => {
    p.quantidade += qtd;
  });

  if (!produto) return;

  fecharModal('modal-adicionar');
  renderizarTabela();
  atualizarResumoCards();
  popularSelectProdutos();
  exibirToast('Estoque adicionado com sucesso!', 'success');
}

/**
 * ═════════════════════════════════════════════════════
 * MODAL EDITAR QUANTIDADE RAPIDA / MANUAL
 * ═════════════════════════════════════════════════════
 */
function alterarQuantidadeRapido(id, delta) {
  const produto = atualizarProdutoEstoque(id, (p) => {
    p.quantidade = Math.max(0, p.quantidade + delta);
  });

  if (!produto) return;

  renderizarTabela();
  atualizarResumoCards();
  exibirToast('Quantidade atualizada!', 'success');
}

function abrirModalEditar(id) {
  const item = obterEstoque().find(p => p.id === id);
  if (!item) return;

  document.getElementById('edit-produto-id').value = id;
  document.getElementById('edit-quantidade').value = item.quantidade;
  document.getElementById('edit-fornecedor').value = item.fornecedor || '';
  document.getElementById('edit-data-entrada').value = item.dataEntrada || '';

  preencherInfoProdutoEdicao(item);

  abrirModal('modal-editar');
}

function preencherInfoProdutoEdicao(item) {
  const container = document.getElementById('edit-produto-info');

  container.innerHTML = `
    <div class="edit-produto-emoji"></div>
    <div>
      <div class="edit-produto-nome"></div>
      <div class="edit-produto-atual">Quantidade atual: <strong></strong></div>
    </div>
  `;

  container.querySelector('.edit-produto-emoji').textContent = item.imagem || '🍽️';
  container.querySelector('.edit-produto-nome').textContent = item.nome;
  container.querySelector('strong').textContent = item.quantidade;
}

function salvarEdicao() {
  const id = document.getElementById('edit-produto-id').value;
  const qtd = parseInt(document.getElementById('edit-quantidade').value, 10);
  const fornecedor = document.getElementById('edit-fornecedor').value.trim();
  const dataEntrada = document.getElementById('edit-data-entrada').value;

  if (isNaN(qtd) || qtd < 0) return exibirToast('Informe uma quantidade válida (mínimo 0).', 'error');

  const produto = atualizarProdutoEstoque(id, (p) => {
    p.quantidade = qtd;
    p.fornecedor = fornecedor;
    p.dataEntrada = dataEntrada;
  });

  if (!produto) return;

  fecharModal('modal-editar');
  renderizarTabela();
  atualizarResumoCards();
  exibirToast('Quantidade atualizada!', 'success');
}

/**
 * ═════════════════════════════════════════════════════
 * MODAL ZERAR ESTOQUE
 * ═════════════════════════════════════════════════════
 */
function abrirModalExcluir(id) {
  const item = obterEstoque().find(p => p.id === id);
  if (!item) return;

  document.getElementById('excluir-produto-id').value = id;
  document.getElementById('excluir-produto-nome').textContent = item.nome;
  abrirModal('modal-excluir');
}

function confirmarExclusao() {
  const id = document.getElementById('excluir-produto-id').value;

  // Apenas zera a quantidade, não exclui o produto do cardápio!
  atualizarProdutoEstoque(id, (p) => {
    p.quantidade = 0;
  });

  fecharModal('modal-excluir');
  renderizarTabela();
  atualizarResumoCards();
  exibirToast('Estoque zerado com sucesso.', 'warning');
}

/**
 * ═════════════════════════════════════════════════════
 * UTILITÁRIOS (MODAIS, INPUTS, TOAST, LOGOUT)
 * ═════════════════════════════════════════════════════
 */
function alterarQtdInput(inputId, delta) {
  const input = document.getElementById(inputId);
  const min = parseInt(input.min) || 0;
  let val = (parseInt(input.value) || 0) + delta;
  input.value = val < min ? min : val;
}

function abrirModal(id) { document.getElementById(id).classList.add('show'); }
function fecharModal(id) { document.getElementById(id).classList.remove('show'); }
function fecharModalSeClicouFora(event, id) { if (event.target.id === id) fecharModal(id); }

let toastTimer = null;
function exibirToast(mensagem, tipo) {
  const toast = document.getElementById('toast');
  toast.textContent = mensagem;
  toast.className = `toast-msg show ${tipo || ''}`;

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function logout() { encerrarSessao(); window.location.href = '../../../index.html'; }

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    fecharModal('modal-adicionar');
    fecharModal('modal-editar');
    fecharModal('modal-excluir');
  }
});

window.onload = inicializarDados;

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