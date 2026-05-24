/*═════════════════════════════════════════════════════MOCK DE PRODUTOS═══════════════════════════════════════════════════════*/

function inicializarProdutosMockados() {

  const produtosExistentes = localStorage.getItem('produtos');

  /*═════════════════════════════════════════════════════SE JA EXISTEM PRODUTOS═══════════════════════════════════════════════════════*/

  if (produtosExistentes) {
    return;
  }

  /*═════════════════════════════════════════════════════MOCK═══════════════════════════════════════════════════════*/

  const produtosMockados = [

    {
      id: '1',
      nome: 'X-Burguer',
      categoria: 'lanches',
      descricao: 'Hambúrguer artesanal.',
      preco: 24.90,
      imagem: '🍔'
    },

    {
      id: '2',
      nome: 'Batata Frita',
      categoria: 'lanches',
      descricao: 'Porção com cheddar e bacon.',
      preco: 18.50,
      imagem: '🍟'
    },

    {
      id: '3',
      nome: 'Coca-Cola',
      categoria: 'bebidas',
      descricao: 'Lata 350ml.',
      preco: 6.00,
      imagem: '🥤'
    },

    {
      id: '4',
      nome: 'Milkshake',
      categoria: 'doces',
      descricao: 'Milkshake de chocolate.',
      preco: 16.90,
      imagem: '🍫'
    },

    {
      id: '5',
      nome: 'Macarrão',
      categoria: 'refeições',
      descricao: 'Macarrão ao molho vermelho.',
      preco: 27.90,
      imagem: '🍝'
    },

    {
      id: '6',
      nome: 'Brownie',
      categoria: 'doces',
      descricao: 'Brownie artesanal.',
      preco: 12.90,
      imagem: '🍪'
    }
  ];

  /*═════════════════════════════════════════════════════SALVA MOCK═══════════════════════════════════════════*/

  localStorage.setItem(
    'produtos',
    JSON.stringify(produtosMockados)
  );
}

function irParaCarrinho() {
  window.location.href = '../../cliente/carrinho/cart.html';
}

function irParaPedidos() {
  window.location.href = '../../cliente/pedidos/orders.html';
}

function voltarHome() {
  window.location.href = '../../../index.html';
}

/*═════════════════════════════════════════════════════STORAGE═══════════════════════════════════════════════════════*/

function obterProdutos() {
  const dados = localStorage.getItem('produtos');

  return dados ? JSON.parse(dados) : [];
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