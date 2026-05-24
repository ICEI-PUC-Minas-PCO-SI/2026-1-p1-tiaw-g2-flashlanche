function irParaCheckout() {

  window.location.href = '../checkout/checkout.html';
}

function voltarParaShop() {

  window.location.href = '../cardapio/shop.html';
}

/*═════════════════════════════════════════════════════STORAGE═════════════════════════════════════════*/

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

/*═════════════════════════════════════════════════════RENDER═════════════════════════════════════════*/

function renderizarCarrinho() {

  const container = document.getElementById(
    'cart-items-container'
  );

  const carrinho = obterCarrinho();

  container.innerHTML = '';

  /*═════════════════════════════════════════════════════CARRINHO VAZIO═════════════════════════════════════════*/

  if (carrinho.length === 0) {

    container.innerHTML = `
      <div class="cart-empty">
        <p style="font-size: 48px; margin-bottom: 16px;">
          <i class="bi bi-inbox"></i>
        </p>

        <p>Seu carrinho está vazio</p>

        <button
          class="btn-checkout"
          style="width: auto; margin-top: 16px;"
          onclick="voltarParaShop()"
        >
          Ir para a Loja
        </button>
      </div>
    `;

    atualizarResumo();

    return;
  }

  /*═════════════════════════════════════════════════════LOOP ITENS═════════════════════════════════════════*/

  for (let i = 0; i < carrinho.length; i++) {

    const item = carrinho[i];

    let imagemHtml = '';

    if (
      item.imagem &&
      item.imagem.startsWith('http')
    ) {

      imagemHtml = `
        <img
          src="${item.imagem}"
          alt="${item.nome}"
          style="
            width: 70px;
            height: 70px;
            object-fit: cover;
            border-radius: 12px;
          "
        >
      `;

    } else {

      imagemHtml = `
        <div class="cart-item-image">
          ${item.imagem || '🍔'}
        </div>
      `;
    }

    const itemHtml = `
      <div class="cart-item">

        ${imagemHtml}

        <div class="cart-item-info">

          <div class="cart-item-name">
            ${item.nome}
          </div>

          <div class="cart-item-price">
            R$ ${item.preco.toFixed(2)}
          </div>

        </div>

        <div class="cart-item-controls">

          <button
            class="qty-btn"
            onclick="diminuirQuantidade('${item.id}')"
          >
            -
          </button>

          <div class="qty-display">
            ${item.quantidade}
          </div>

          <button
            class="qty-btn"
            onclick="aumentarQuantidade('${item.id}')"
          >
            +
          </button>

          <button
            class="btn-remove"
            onclick="removerItem('${item.id}')"
          >
            Remover
          </button>

        </div>

      </div>
    `;

    container.innerHTML += itemHtml;
  }

  atualizarResumo();
}

/*═════════════════════════════════════════════════════RESUMO═════════════════════════════════════════*/

function atualizarResumo() {

  const carrinho = obterCarrinho();

  let subtotal = 0;

  for (let i = 0; i < carrinho.length; i++) {

    subtotal +=
      carrinho[i].preco *
      carrinho[i].quantidade;
  }

  const taxa = 0;

  const total = subtotal + taxa;

  document.getElementById('subtotal').innerText =
    subtotal.toFixed(2);

  document.getElementById('taxa').innerText =
    taxa.toFixed(2);

  document.getElementById('total').innerText =
    total.toFixed(2);

  document.getElementById('btn-checkout').disabled =
    carrinho.length === 0;
}

/*═════════════════════════════════════════════════════QUANTIDADE═════════════════════════════════════════*/

function aumentarQuantidade(idProduto) {

  const carrinho = obterCarrinho();

  const item = carrinho.find(function(prod) {
    return prod.id === idProduto;
  });

  if (!item) {
    return;
  }

  item.quantidade += 1;

  salvarCarrinho(carrinho);

  renderizarCarrinho();
}

function diminuirQuantidade(idProduto) {

  let carrinho = obterCarrinho();

  const item = carrinho.find(function(prod) {
    return prod.id === idProduto;
  });

  if (!item) {
    return;
  }

  item.quantidade -= 1;

  /*═════════════════════════════════════════════════════REMOVE SE ZERAR═════════════════════════════════════════*/

  if (item.quantidade <= 0) {

    carrinho = carrinho.filter(function(prod) {
      return prod.id !== idProduto;
    });
  }

  salvarCarrinho(carrinho);

  renderizarCarrinho();
}

/*═════════════════════════════════════════════════════REMOVER═════════════════════════════════════════*/

function removerItem(idProduto) {

  let carrinho = obterCarrinho();

  carrinho = carrinho.filter(function(prod) {
    return prod.id !== idProduto;
  });

  salvarCarrinho(carrinho);

  renderizarCarrinho();
}

/*═════════════════════════════════════════════════════LIMPAR═════════════════════════════════════════*/

function limparCarrinho() {

  const confirmar = confirm(
    'Deseja limpar o carrinho?'
  );

  if (!confirmar) {
    return;
  }

  localStorage.removeItem('carrinho');

  renderizarCarrinho();
}

/*═════════════════════════════════════════════════════INIT═════════════════════════════════════════*/

window.onload = function() {

  renderizarCarrinho();
};