/*═════════════════════════════════════════════════════MOCK DE PRODUTOS═══════════════════════════════════════════════════════*/

function inicializarProdutosMockados() {
  const produtosExistentes = localStorage.getItem('produtos');

  if (produtosExistentes) {
    return;
  }
}

function irParaCarrinho() {
  window.location.href = '../../cliente/carrinho/cart.html';
}

function irParaPedidos() {
  window.location.href = '../../cliente/pedidos/orders.html';
}

function irParaPerfil() {
  window.location.href = '../../cliente/perfil/profile.html';
}

function voltarHome() {
  window.location.href = '../../../index.html';
}

/*═════════════════════════════════════════════════════STORAGE═══════════════════════════════════════════════════════*/

function obterProdutos() {
  const dados = localStorage.getItem('produtos');

  return dados ? JSON.parse(dados) : [];
}

/*═════════════════════════════════════════════════════CARRINHO═══════════════════════════════════════════════════════*/
function obterCarrinho() {

  const dados = localStorage.getItem('carrinho');

  return dados ? JSON.parse(dados) : [];
}

function salvarCarrinho(carrinho) {

  localStorage.setItem(
    'carrinho',
    JSON.stringify(carrinho)
  );
}

function adicionarAoCarrinho(idProduto) {

  const produtos = obterProdutos();

  const produto = produtos.find(function(prod) {
    return prod.id === idProduto;
  });

  if (!produto) {
    return;
  }

  let carrinho = obterCarrinho();

  const itemExistente = carrinho.find(function(item) {
    return item.id === idProduto;
  });

  /*═════════════════════════════════════════════════════SE JÁ EXISTE═════════════════════════════════════════*/

  if (itemExistente) {

    itemExistente.quantidade += 1;

  } else {

    carrinho.push({
      ...produto,
      quantidade: 1
    });
  }

  salvarCarrinho(carrinho);

  atualizarContadorCarrinho();
}

function atualizarContadorCarrinho() {

  const carrinho = obterCarrinho();

  let totalItens = 0;

  for (let i = 0; i < carrinho.length; i++) {

    totalItens += carrinho[i].quantidade;
  }

  document.getElementById('cart-count').innerText = totalItens;
}

/*═════════════════════════════════════════════════════FAVORITOS═══════════════════════════════════════════════════════*/

function obterFavoritos() {
  const dados = localStorage.getItem('favoritos');

  return dados ? JSON.parse(dados) : [];
}

function salvarFavoritos(favoritos) {
  localStorage.setItem('favoritos', JSON.stringify(favoritos));
}

function isFavorito(id) {
  const favoritos = obterFavoritos();

  return favoritos.includes(id);
}

function toggleFavorito(id, event) {

  if (event) {
    event.stopPropagation();
  }

  let favoritos = obterFavoritos();

  const jaFavoritado = favoritos.includes(id);

  if (jaFavoritado) {

    favoritos = favoritos.filter(function(favoritoId) {
      return favoritoId !== id;
    });

  } else {

    favoritos.push(id);
  }

  salvarFavoritos(favoritos);

  /*═════════════════════════════════════════════════════ATUALIZA O BOTÃO═════════════════════════════════════════*/

  const botao = document.querySelector('.btn-favorite[data-id="' + id + '"]');

  if (botao) {

    const icone = botao.querySelector('i');

    if (jaFavoritado) {
      botao.classList.remove('active');
      icone.className = 'bi bi-heart';
    } else {
      botao.classList.add('active');
      icone.className = 'bi bi-heart-fill';
    }
  }
}


/*═════════════════════════════════════════════════════FILTRO ATUAL═════════════════════════════════════════*/

let categoriaAtual = 'todos';

/*═════════════════════════════════════════════════════ORDENACAO ATUAL═════════════════════════════════════════*/

let ordenacaoAtual = 'padrao';

/*═════════════════════════════════════════════════════FILTRAR PRODUTOS═════════════════════════════════════════*/

function filtrarCategoria(categoria) {

  categoriaAtual = categoria;

  atualizarBotoesFiltro();

  renderizarProdutos();
}

/*═════════════════════════════════════════════════════ORDENAR PRODUTOS═════════════════════════════════════════*/

function ordenarProdutos() {

  const select = document.getElementById('sort-select');

  ordenacaoAtual = select.value;

  renderizarProdutos();
}

/*═════════════════════════════════════════════════════ATUALIZAR BOTÕES═════════════════════════════════════════*/

function atualizarBotoesFiltro() {

  const botoes = document.querySelectorAll('.btn-filter');

  botoes.forEach(function(botao) {

    botao.style.background = 'var(--canvas)';
    botao.style.color = 'var(--text-primary)';
    botao.style.border = '1px solid var(--border-gray)';

    const textoBotao = botao.innerText.toLowerCase();

    if (
      (categoriaAtual === 'todos' && textoBotao === 'todos') ||
      (categoriaAtual === 'lanches' && textoBotao === 'lanches') ||
      (categoriaAtual === 'bebidas' && textoBotao === 'bebidas') ||
      (categoriaAtual === 'doces' && textoBotao === 'doces') ||
      (categoriaAtual === 'refeições' && textoBotao === 'refeições')
    ) {
      botao.style.background = 'var(--orange)';
      botao.style.color = 'white';
      botao.style.border = 'none';
    }
  });
}

/*═════════════════════════════════════════════════════RENDERIZAR PRODUTOS═════════════════════════════════════════*/

function renderizarProdutos() {

  const grid = document.getElementById('product-grid');

  let produtos = obterProdutos();

  /*═════════════════════════════════════════════════════FILTRO═════════════════════════════════════════*/


  if (categoriaAtual !== 'todos') {

    produtos = produtos.filter(function(produto) {
      return produto.categoria === categoriaAtual;
    });
  }

  /*═════════════════════════════════════════════════════ORDENACAO═════════════════════════════════════════*/

  if (ordenacaoAtual === 'menor-preco') {
    produtos.sort(function(a, b) {
      return a.preco - b.preco;
    });
  }

  else if (ordenacaoAtual === 'maior-preco') {
    produtos.sort(function(a, b) {
      return b.preco - a.preco;
    });
  }

  /*═════════════════════════════════════════════════════LIMPA GRID═════════════════════════════════════════*/

  grid.innerHTML = '';

  /*═════════════════════════════════════════════════════SEM PRODUTOS═════════════════════════════════════════*/

  if (produtos.length === 0) {

    grid.innerHTML = `
      <p style="
        grid-column: 1/-1;
        text-align: center;
        color: var(--text-secondary);
        font-size: 18px;
      ">
        Nenhum produto encontrado.
      </p>
    `;

    return;
  }

  /*═════════════════════════════════════════════════════LOOP DOS PRODUTOS═════════════════════════════════════════*/

  for (let i = 0; i < produtos.length; i++) {

    const produto = produtos[i];

    let imagemHtml = '';

    /*═════════════════════════════════════════════════════IMAGEM URL═════════════════════════════════════════*/

    if (produto.imagem && produto.imagem.startsWith('http')) {

      imagemHtml = `
        <img
          src="${produto.imagem}"
          alt="${produto.nome}"
          class="product-img"
        >
      `;

    } else {

      /*═════════════════════════════════════════════════════EMOJI═════════════════════════════════════════*/

      imagemHtml = `
        <div class="product-emoji">
          ${produto.imagem || '🍔'}
        </div>
      `;
    }

    /*═════════════════════════════════════════════════════CARD═════════════════════════════════════════*/

    const card = document.createElement('div');

    card.className = 'product-card';

    card.innerHTML = `
      <div class="product-image">
        ${imagemHtml}

        <button class="btn-favorite ${isFavorito(produto.id) ? 'active' : ''}" data-id="${produto.id}" onclick="toggleFavorito('${produto.id}', event)">
          <i class="bi ${isFavorito(produto.id) ? 'bi-heart-fill' : 'bi-heart'}"></i>
        </button>
      </div>

      <div class="product-content">

        <div class="product-category">
          ${produto.categoria}
        </div>

        <h3 class="product-title">
          ${produto.nome}
        </h3>

        <p class="product-description">
          ${produto.descricao}
        </p>

        <div class="product-footer">

          <span class="product-price">
            R$ ${produto.preco.toFixed(2)}
          </span>

          <button class="btn-add-cart" onclick="adicionarAoCarrinho('${produto.id}')">
            <i class="bi bi-cart-plus"></i>
            Adicionar
          </button>

        </div>
      </div>
    `;

    grid.appendChild(card);
  }
}

/*═════════════════════════════════════════════════════INICIALIZAÇÃO═════════════════════════════════════════*/

window.onload = function() {

  inicializarProdutosMockados();

  renderizarProdutos();

  atualizarBotoesFiltro();

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