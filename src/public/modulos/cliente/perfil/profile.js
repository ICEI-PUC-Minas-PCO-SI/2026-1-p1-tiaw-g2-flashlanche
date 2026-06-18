/*═════════════════════════════════════════════════════NAVEGAÇÃO═══════════════════════════════════════════════════════*/

function voltarHome() {
  window.location.href = '../../../index.html';
}

function irParaCarrinho() {
  window.location.href = '../../cliente/carrinho/cart.html';
}

function irParaPedidos() {
  window.location.href = '../../cliente/pedidos/orders.html';
}

function irParaLoja() {
  window.location.href = '../../cliente/cardapio/shop.html';
}

/*═════════════════════════════════════════════════════STORAGE: PRODUTOS═══════════════════════════════════════════════════════*/

function obterProdutos() {
  const dados = localStorage.getItem('produtos');

  return dados ? JSON.parse(dados) : [];
}

/*═════════════════════════════════════════════════════STORAGE: FAVORITOS (ARRAY DE IDS)═══════════════════════════════════════════════════════*/

function obterFavoritos() {
  const dados = localStorage.getItem('favoritos');

  return dados ? JSON.parse(dados) : [];
}

function salvarFavoritos(favoritos) {
  localStorage.setItem('favoritos', JSON.stringify(favoritos));
}

/*═════════════════════════════════════════════════════STORAGE: QUANTIDADES DESEJADAS═══════════════════════════════════════════════════════*/

function obterQuantidades() {
  const dados = localStorage.getItem('favoritosQuantidades');

  return dados ? JSON.parse(dados) : {};
}

function salvarQuantidades(quantidades) {
  localStorage.setItem('favoritosQuantidades', JSON.stringify(quantidades));
}

function obterQuantidade(id) {
  const quantidades = obterQuantidades();

  return quantidades[id] || 1;
}

/*═════════════════════════════════════════════════════READ: RENDERIZAR FAVORITOS═══════════════════════════════════════════════════════*/

function renderizarFavoritos() {

  const grid = document.getElementById('favorites-grid');
  const contador = document.getElementById('favorites-count');

  const favoritos = obterFavoritos();
  const produtos = obterProdutos();
  const quantidades = obterQuantidades();

  /*═════════════════════════════════════════════════════CRUZA FAVORITOS COM PRODUTOS═════════════════════════════════════════*/

  const produtosFavoritos = produtos.filter(function(produto) {
    return favoritos.includes(produto.id);
  });

  if (contador) {
    contador.innerText = produtosFavoritos.length;
  }

  /*═════════════════════════════════════════════════════LIMPA GRID═════════════════════════════════════════*/

  grid.innerHTML = '';

  /*═════════════════════════════════════════════════════SEM FAVORITOS═════════════════════════════════════════*/

  if (produtosFavoritos.length === 0) {

    grid.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-heart"></i>
        <h3>Nenhum favorito ainda</h3>
        <p>Os produtos que você favoritar no cardápio vão aparecer aqui.</p>
        <button class="btn-primary-cb" onclick="irParaLoja()">
          <i class="bi bi-shop"></i>
          Ir para o cardápio
        </button>
      </div>
    `;

    return;
  }

  /*═════════════════════════════════════════════════════LOOP DOS FAVORITOS═════════════════════════════════════════*/

  for (let i = 0; i < produtosFavoritos.length; i++) {

    const produto = produtosFavoritos[i];
    const quantidade = quantidades[produto.id] || 1;

    let imagemHtml = '';

    /*═════════════════════════════════════════════════════IMAGEM URL═════════════════════════════════════════*/

    if (produto.imagem && produto.imagem.startsWith('http')) {

      imagemHtml = `
        <img
          src="${produto.imagem}"
          alt="${produto.nome}"
          class="favorite-img"
        >
      `;

    } else {

      /*═════════════════════════════════════════════════════EMOJI═════════════════════════════════════════*/

      imagemHtml = `
        <div class="favorite-emoji">
          ${produto.imagem || '🍔'}
        </div>
      `;
    }

    const subtotal = (produto.preco * quantidade).toFixed(2);

    /*═════════════════════════════════════════════════════CARD═════════════════════════════════════════*/

    const card = document.createElement('div');

    card.className = 'favorite-card';

    card.innerHTML = `
      <div class="favorite-image">
        ${imagemHtml}

        <button class="btn-remove-fav" onclick="removerFavorito('${produto.id}')" title="Remover dos favoritos">
          <i class="bi bi-trash3-fill"></i>
        </button>
      </div>

      <div class="favorite-content">

        <div class="favorite-category">
          ${produto.categoria}
        </div>

        <h3 class="favorite-title">
          ${produto.nome}
        </h3>

        <p class="favorite-description">
          ${produto.descricao}
        </p>

        <div class="favorite-footer">

          <div class="favorite-price-box">
            <span class="favorite-price">R$ ${produto.preco.toFixed(2)}</span>
            <span class="favorite-subtotal">Subtotal: R$ ${subtotal}</span>
          </div>

          <div class="quantity-control">
            <button class="qty-btn" onclick="diminuirQuantidade('${produto.id}')">
              <i class="bi bi-dash"></i>
            </button>

            <input
              type="number"
              class="qty-input"
              id="qty-${produto.id}"
              value="${quantidade}"
              min="1"
              onchange="atualizarQuantidade('${produto.id}', this.value)"
            >

            <button class="qty-btn" onclick="aumentarQuantidade('${produto.id}')">
              <i class="bi bi-plus"></i>
            </button>
          </div>

        </div>
      </div>
    `;

    grid.appendChild(card);
  }
}

/*═════════════════════════════════════════════════════UPDATE: QUANTIDADE DESEJADA═══════════════════════════════════════════════════════*/

function atualizarQuantidade(id, valor) {

  let quantidade = parseInt(valor, 10);

  if (isNaN(quantidade) || quantidade < 1) {
    quantidade = 1;
  }

  const quantidades = obterQuantidades();

  quantidades[id] = quantidade;

  salvarQuantidades(quantidades);

  renderizarFavoritos();
}

function aumentarQuantidade(id) {

  const quantidades = obterQuantidades();

  const atual = quantidades[id] || 1;

  quantidades[id] = atual + 1;

  salvarQuantidades(quantidades);

  renderizarFavoritos();
}

function diminuirQuantidade(id) {

  const quantidades = obterQuantidades();

  const atual = quantidades[id] || 1;

  if (atual <= 1) {
    return;
  }

  quantidades[id] = atual - 1;

  salvarQuantidades(quantidades);

  renderizarFavoritos();
}

/*═════════════════════════════════════════════════════DELETE: REMOVER UM FAVORITO═══════════════════════════════════════════════════════*/

function removerFavorito(id) {

  let favoritos = obterFavoritos();

  favoritos = favoritos.filter(function(favoritoId) {
    return favoritoId !== id;
  });

  salvarFavoritos(favoritos);

  /*═════════════════════════════════════════════════════REMOVE A QUANTIDADE SALVA DESSE ITEM═════════════════════════════════════════*/

  const quantidades = obterQuantidades();

  delete quantidades[id];

  salvarQuantidades(quantidades);

  renderizarFavoritos();
}

/*═════════════════════════════════════════════════════DELETE: LIMPAR TODOS OS FAVORITOS═══════════════════════════════════════════════════════*/

function limparFavoritos() {

  const favoritos = obterFavoritos();

  if (favoritos.length === 0) {
    return;
  }

  const confirmar = confirm('Tem certeza que deseja remover todos os produtos dos favoritos?');

  if (!confirmar) {
    return;
  }

  salvarFavoritos([]);
  salvarQuantidades({});

  renderizarFavoritos();
}

/*═════════════════════════════════════════════════════CONTADOR DO CARRINHO═══════════════════════════════════════════════════════*/

function atualizarContadorCarrinho() {

  const contador = document.getElementById('cart-count');

  if (!contador) {
    return;
  }

  const dados = localStorage.getItem('carrinho');

  let carrinho = [];

  try {
    carrinho = dados ? JSON.parse(dados) : [];
  } catch (erro) {
    carrinho = [];
  }

  let total = 0;

  if (Array.isArray(carrinho)) {
    carrinho.forEach(function(item) {
      total += item.quantidade || 1;
    });
  }

  contador.innerText = total;
}

/*═════════════════════════════════════════════════════INICIALIZAÇÃO═════════════════════════════════════════*/

window.onload = function() {

  renderizarFavoritos();

  atualizarContadorCarrinho();

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