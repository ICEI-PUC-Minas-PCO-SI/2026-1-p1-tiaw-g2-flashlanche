function logout() {
  window.location.href = '../../../index.html';
}

let idEmEdicao = null;

/* ========================= STORAGE ========================= */

function obterProdutos() {
  const dados = localStorage.getItem('produtos');
  return dados ? JSON.parse(dados) : [];
}

function salvarNoStorage(lista) {
  localStorage.setItem('produtos', JSON.stringify(lista));
}

/* ========================= MODAL ========================= */

function abrirModal() {
  idEmEdicao = null;

  document.getElementById('modal-title').innerText = 'Novo Produto';
  document.getElementById('btn-save').innerText = 'Adicionar Produto';

  document.getElementById('nome').value = '';
  document.getElementById('descricao').value = '';
  document.getElementById('preco').value = '';
  document.getElementById('categoria').value = 'lanches';
  document.getElementById('imagem').value = '';

  document.getElementById('modal-form').classList.add('show');
}

function fecharModal() {
  document.getElementById('modal-form').classList.remove('show');
}

/* ========================= CRUD ========================= */

function salvarProduto() {
  const nome = document.getElementById('nome').value.trim();
  const descricao = document.getElementById('descricao').value.trim();
  const preco = document.getElementById('preco').value;
  const categoria = document.getElementById('categoria').value;
  const imagem = document.getElementById('imagem').value.trim();

  if (!nome || !descricao || !preco) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }

  const lista = obterProdutos();

  if (idEmEdicao !== null) {
    for (let i = 0; i < lista.length; i++) {
      if (lista[i].id === idEmEdicao) {
        lista[i].nome = nome;
        lista[i].descricao = descricao;
        lista[i].preco = parseFloat(preco);
        lista[i].categoria = categoria;
        lista[i].imagem = imagem;
      }
    }

  } else {
    lista.push({
      id: Date.now().toString(),
      nome: nome,
      descricao: descricao,
      preco: parseFloat(preco),
      categoria: categoria,
      imagem: imagem
    });
  }

  salvarNoStorage(lista);
  fecharModal();
  renderizarProdutos();
}

function editarProduto(id) {
  const lista = obterProdutos();

  let produto = null;

  for (let i = 0; i < lista.length; i++) {
    if (lista[i].id === id) {
      produto = lista[i];
    }
  }

  if (!produto) {
    return;
  }

  idEmEdicao = id;

  document.getElementById('modal-title').innerText = 'Editar Produto';
  document.getElementById('btn-save').innerText = 'Salvar Alterações';

  document.getElementById('nome').value = produto.nome;
  document.getElementById('descricao').value = produto.descricao;
  document.getElementById('preco').value = produto.preco;
  document.getElementById('categoria').value = produto.categoria;
  document.getElementById('imagem').value = produto.imagem;

  document.getElementById('modal-form').classList.add('show');
}

function excluirProduto(id) {
  const confirmar = confirm('Deseja excluir este produto?');

  if (!confirmar) {
    return;
  }

  const lista = obterProdutos().filter(function(produto) {
    return produto.id !== id;
  });

  salvarNoStorage(lista);
  renderizarProdutos();
}

/* ========================= RENDER ========================= */

function renderizarProdutos() {
  const grid = document.getElementById('products-grid');
  const lista = obterProdutos();

  grid.innerHTML = '';

  if (lista.length === 0) {
    grid.innerHTML =
      '<p style="color: var(--text-secondary); grid-column: 1/-1;">' +
      'Nenhum produto cadastrado. Clique em <strong>Novo Produto</strong> para começar.' +
      '</p>';

    return;
  }

  for (let i = 0; i < lista.length; i++) {
    const produto = lista[i];

    let imagemHtml = '';

    if (produto.imagem && produto.imagem.startsWith('http')) {
      imagemHtml =
        '<img ' +
        'class="product-image-img" ' +
        'src="' + produto.imagem + '" ' +
        'alt="' + produto.nome + '"' +
        '>';
    } else {
      imagemHtml =
        '<span class="product-image-text">' +
        (produto.imagem || '🍽️') +
        '</span>';
    }

    const card = document.createElement('div');

    card.className = 'product-item';

    card.innerHTML =
      '<div class="product-header">' +
        '<div class="product-image">' +
          imagemHtml +
        '</div>' +
        '<div class="product-name">' +
          produto.nome +
        '</div>' +
        '<div class="product-price">' +
          'R$ ' + produto.preco.toFixed(2) +
        '</div>' +
      '</div>' +
      '<div class="product-body">' +
        '<div class="product-desc">' +
          produto.descricao +
        '</div>' +
        '<div class="product-footer">' +
          '<button class="btn-icon" onclick="editarProduto(\'' + produto.id + '\')">' +
            '<i class="bi bi-pencil"></i> Editar' +
          '</button>' +
          '<button class="btn-icon btn-icon-danger" onclick="excluirProduto(\'' + produto.id + '\')">' +
            '<i class="bi bi-trash"></i>' +
          '</button>' +
        '</div>' +
      '</div>';

    grid.appendChild(card);
  }
}

/* ========================= EXIBIR PRODUTOS EXISTENTES ========================= */

window.onload = function() {
  renderizarProdutos();
};

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