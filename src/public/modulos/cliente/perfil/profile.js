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

function sair() {
  encerrarSessao();
  window.location.href = '../../../index.html';
}

/*═════════════════════════════════════════════════════STORAGE: CHAVES E HELPERS GENÉRICOS═══════════════════════════════════════════════════════*/

const STORAGE_KEYS = {
  PRODUTOS: 'produtos',
  FAVORITOS: 'favoritos',
  QUANTIDADES: 'favoritosQuantidades',
  CARRINHO: 'carrinho',
};

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

/*═════════════════════════════════════════════════════STORAGE: PRODUTOS═══════════════════════════════════════════════════════*/

function obterProdutos() {
  return obterDoStorage(STORAGE_KEYS.PRODUTOS, []);
}

/*═════════════════════════════════════════════════════STORAGE: FAVORITOS (ARRAY DE IDS)═══════════════════════════════════════════════════════*/

function obterFavoritos() {
  return obterDoStorage(authChaveUsuario(STORAGE_KEYS.FAVORITOS), []);
}

function salvarFavoritos(favoritos) {
  salvarNoStorage(authChaveUsuario(STORAGE_KEYS.FAVORITOS), favoritos);
}

/*═════════════════════════════════════════════════════STORAGE: QUANTIDADES DESEJADAS═══════════════════════════════════════════════════════*/

function obterQuantidades() {
  return obterDoStorage(authChaveUsuario(STORAGE_KEYS.QUANTIDADES), {});
}

function salvarQuantidades(quantidades) {
  salvarNoStorage(authChaveUsuario(STORAGE_KEYS.QUANTIDADES), quantidades);
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
    grid.appendChild(criarEstadoVazio());
    return;
  }

  /*═════════════════════════════════════════════════════LOOP DOS FAVORITOS═════════════════════════════════════════*/

  produtosFavoritos.forEach(function(produto) {
    const quantidade = quantidades[produto.id] || 1;
    grid.appendChild(criarCardFavorito(produto, quantidade));
  });
}

/*═════════════════════════════════════════════════════ESTADO VAZIO═══════════════════════════════════════════════════════*/

function criarEstadoVazio() {
  const estadoVazio = document.createElement('div');
  estadoVazio.className = 'empty-state';

  estadoVazio.innerHTML = `
    <i class="bi bi-heart"></i>
    <h3>Nenhum favorito ainda</h3>
    <p>Os produtos que você favoritar no cardápio vão aparecer aqui.</p>
    <button class="btn-primary-cb">
      Ir para o cardápio
    </button>
  `;

  estadoVazio.querySelector('button').addEventListener('click', irParaLoja);

  return estadoVazio;
}

/*═════════════════════════════════════════════════════CRIAÇÃO DO CARD DE FAVORITO═══════════════════════════════════════════════════════*/

function criarImagemFavorito(produto) {
  const wrapper = document.createElement('div');

  if (produto.imagem && produto.imagem.startsWith('http')) {
    const img = document.createElement('img');
    img.src = produto.imagem;
    img.alt = produto.nome;
    img.className = 'favorite-img';
    wrapper.appendChild(img);
  } else {
    wrapper.className = 'favorite-emoji';
    wrapper.textContent = produto.imagem || '🍔';
  }

  return wrapper;
}

function criarCardFavorito(produto, quantidade) {

  const subtotal = (produto.preco * quantidade).toFixed(2);

  const card = document.createElement('div');
  card.className = 'favorite-card';
  card.dataset.produtoId = produto.id;

  card.innerHTML = `
    <div class="favorite-image">
      <button class="btn-remove-fav" title="Remover dos favoritos">
        <i class="bi bi-trash3-fill"></i>
      </button>
    </div>

    <div class="favorite-content">

      <div class="favorite-category"></div>

      <h3 class="favorite-title"></h3>

      <p class="favorite-description"></p>

      <div class="favorite-footer">

        <div class="favorite-price-box">
          <span class="favorite-price">R$ ${produto.preco.toFixed(2)}</span>
          <span class="favorite-subtotal">Subtotal: R$ ${subtotal}</span>
        </div>

        <div class="quantity-control">
          <button class="qty-btn qty-decrease">
            <i class="bi bi-dash"></i>
          </button>

          <input type="number" class="qty-input" value="${quantidade}" min="1">

          <button class="qty-btn qty-increase">
            <i class="bi bi-plus"></i>
          </button>
        </div>

      </div>
    </div>
  `;

  /*═════════════════════════════════════════════════════IMAGEM═════════════════════════════════════════*/

  card.querySelector('.favorite-image').prepend(criarImagemFavorito(produto));

  /*═════════════════════════════════════════════════════TEXTOS DO PRODUTO═════════════════════════════════════════*/

  card.querySelector('.favorite-category').textContent = produto.categoria;
  card.querySelector('.favorite-title').textContent = produto.nome;
  card.querySelector('.favorite-description').textContent = produto.descricao;

  /*═════════════════════════════════════════════════════EVENTOS═════════════════════════════════════════*/

  card.querySelector('.btn-remove-fav').addEventListener('click', function() {
    removerFavorito(produto.id);
  });

  card.querySelector('.qty-decrease').addEventListener('click', function() {
    alterarQuantidade(produto.id, -1);
  });

  card.querySelector('.qty-increase').addEventListener('click', function() {
    alterarQuantidade(produto.id, 1);
  });

  card.querySelector('.qty-input').addEventListener('change', function(evento) {
    definirQuantidade(produto.id, parseInt(evento.target.value, 10));
  });

  return card;
}

/*═════════════════════════════════════════════════════UPDATE: QUANTIDADE DESEJADA═══════════════════════════════════════════════════════*/

function definirQuantidade(id, novaQuantidade) {

  const quantidade = Number.isInteger(novaQuantidade) && novaQuantidade > 0 ? novaQuantidade : 1;

  const quantidades = obterQuantidades();
  quantidades[id] = quantidade;
  salvarQuantidades(quantidades);

  atualizarCardNaTela(id, quantidade);
}

function alterarQuantidade(id, delta) {

  const quantidades = obterQuantidades();
  const atual = quantidades[id] || 1;
  const nova = atual + delta;

  if (nova < 1) {
    return;
  }

  definirQuantidade(id, nova);
}

function atualizarCardNaTela(id, quantidade) {

  const card = document.querySelector(`.favorite-card[data-produto-id="${CSS.escape(String(id))}"]`);

  if (!card) {
    renderizarFavoritos();
    return;
  }

  const produto = obterProdutos().find(function(item) {
    return item.id === id;
  });

  if (!produto) {
    renderizarFavoritos();
    return;
  }

  const input = card.querySelector('.qty-input');
  const subtotalEl = card.querySelector('.favorite-subtotal');

  if (input) {
    input.value = quantidade;
  }

  if (subtotalEl) {
    subtotalEl.textContent = `Subtotal: R$ ${(produto.preco * quantidade).toFixed(2)}`;
  }
}

/*═════════════════════════════════════════════════════DELETE: REMOVER UM FAVORITO═══════════════════════════════════════════════════════*/

function removerFavorito(id) {

  const favoritos = obterFavoritos().filter(function(favoritoId) {
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

  const carrinho = obterDoStorage(authChaveUsuario(STORAGE_KEYS.CARRINHO), []);

  const total = Array.isArray(carrinho)
    ? carrinho.reduce(function(soma, item) {
        return soma + (item.quantidade || 1);
      }, 0)
    : 0;

  contador.innerText = total;
}

/*═════════════════════════════════════════════════════INICIALIZAÇÃO═════════════════════════════════════════*/

window.onload = function() {

  renderizarSaudacao();
  inicializarFormularioConta();

  renderizarFavoritos();

  atualizarContadorCarrinho();

};

/*═════════════════════════════════════════════════════MEUS DADOS (CONTA)═══════════════════════════════════════════════════════*/

function renderizarSaudacao() {
  const elemento = document.getElementById('profile-greeting');
  const usuario = obterUsuarioAtual();

  if (elemento && usuario) {
    elemento.textContent = `Olá, ${usuario.username}!`;
  }
}

function inicializarFormularioConta() {
  const usuario = obterUsuarioAtual();

  if (!usuario) {
    return;
  }

  const inputUsername = document.getElementById('account-username');
  const inputEmail = document.getElementById('account-email');
  const inputTelefone = document.getElementById('account-telefone');

  inputUsername.value = usuario.username;
  inputEmail.value = usuario.email;
  inputTelefone.value = usuario.telefone;

  inputTelefone.addEventListener('input', function () {
    inputTelefone.value = authAplicarMascaraTelefone(inputTelefone.value);
  });

  document.getElementById('account-form').addEventListener('submit', function (evento) {
    evento.preventDefault();

    const resultado = atualizarDadosConta(inputEmail.value, inputTelefone.value);

    exibirFeedbackConta('account-feedback', resultado);
  });

  const botaoTogglePassword = document.getElementById('toggle-password-form');
  const formSenha = document.getElementById('password-form');

  botaoTogglePassword.addEventListener('click', function () {
    const visivel = formSenha.style.display !== 'none';
    formSenha.style.display = visivel ? 'none' : 'block';
  });

  formSenha.addEventListener('submit', function (evento) {
    evento.preventDefault();

    const senhaAtual = document.getElementById('account-current-password').value;
    const novaSenha = document.getElementById('account-new-password').value;
    const confirmacao = document.getElementById('account-confirm-password').value;

    if (novaSenha !== confirmacao) {
      exibirFeedbackConta('password-feedback', { sucesso: false, erro: 'As senhas não coincidem.' });
      return;
    }

    const resultado = alterarSenhaConta(senhaAtual, novaSenha);

    exibirFeedbackConta('password-feedback', resultado);

    if (resultado.sucesso) {
      formSenha.reset();
    }
  });
}

function exibirFeedbackConta(elementoId, resultado) {
  const elemento = document.getElementById(elementoId);

  elemento.style.display = 'block';
  elemento.classList.remove('erro', 'sucesso');
  elemento.classList.add(resultado.sucesso ? 'sucesso' : 'erro');
  elemento.textContent = resultado.sucesso
    ? 'Dados atualizados com sucesso!'
    : resultado.erro;
}

/* ════════════════════════════════ ACESSIBILIDADE: TEXT-TO-SPEECH (TTS) ════════════════════════════════ */

let ttsUtterance = null;
let isPaused = false;

function prepararTextoLeitura() {
  const mainContent = document.querySelector('main') || document.body;

  let textoParaLer = mainContent.innerText || mainContent.textContent;

  textoParaLer = textoParaLer.replace(/\n+/g, '. ').trim();

  return textoParaLer;
}

function toggleLeitura() {
  const btnPlayPause = document.getElementById('tts-play-pause');
  const btnStop = document.getElementById('tts-stop');
  const iconePlayPause = btnPlayPause.querySelector('i');

  if (isPaused) {
    window.speechSynthesis.resume();
    isPaused = false;
    iconePlayPause.className = 'bi bi-pause-circle-fill';
    btnPlayPause.setAttribute('aria-label', 'Pausar narração');
    return;
  }

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    isPaused = true;
    iconePlayPause.className = 'bi bi-play-circle-fill';
    btnPlayPause.setAttribute('aria-label', 'Continuar narração');
    return;
  }

  const texto = prepararTextoLeitura();
  if (!texto) {
    alert("Não foi possível encontrar conteúdo legível na página.");
    return;
  }

  ttsUtterance = new SpeechSynthesisUtterance(texto);
  ttsUtterance.lang = 'pt-BR'; 
  ttsUtterance.rate = 1.5; 

 
  ttsUtterance.onend = () => {
    resetarUI();
  };

  ttsUtterance.onerror = (e) => {
    console.error('Ocorreu um erro no Text-To-Speech:', e);
    resetarUI();
  };

  window.speechSynthesis.speak(ttsUtterance);

  iconePlayPause.className = 'bi bi-pause-circle-fill';
  btnPlayPause.setAttribute('aria-label', 'Pausar narração');
  btnStop.disabled = false;
  isPaused = false;
}


function pararLeitura() {
  if (window.speechSynthesis.speaking || isPaused) {
    window.speechSynthesis.cancel();
    resetarUI();
  }
}


function resetarUI() {
  const btnPlayPause = document.getElementById('tts-play-pause');
  const btnStop = document.getElementById('tts-stop');
  const iconePlayPause = btnPlayPause.querySelector('i');

  iconePlayPause.className = 'bi bi-play-circle-fill';
  btnPlayPause.setAttribute('aria-label', 'Iniciar narração da página');
  btnStop.disabled = true;
  isPaused = false;
}

window.addEventListener('beforeunload', () => {
  window.speechSynthesis.cancel();
});