let cupomAtivo = null; // Variável para rastrear o desconto atual

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
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

/*═════════════════════════════════════════════════════CUPOM DE DESCONTO═════════════════════════════════════════*/

function aplicarCupom() {
  const inputCupom = document.getElementById('input-cupom').value.toUpperCase().trim();
  const msgEl = document.getElementById('cupom-msg');

  // Se o usuário clicar em aplicar com o campo vazio, removemos o desconto
  if (!inputCupom) {
    removerCupom();
    return;
  }

  // 1. Busca os cupons do sistema de gerenciamento
  const cupons = JSON.parse(localStorage.getItem('cupons')) || [];
  const cupomEncontrado = cupons.find(c => c.codigo === inputCupom);

  // 2. Valida se o cupom existe
  if (!cupomEncontrado) {
    exibirMensagemCupom("Cupom inválido ou não encontrado.", "var(--red)");
    removerCupom(false);
    return;
  }

  // 3. Valida se está inativo
  if (cupomEncontrado.status !== 'Ativo') {
    exibirMensagemCupom("Este cupom não está mais ativo.", "var(--red)");
    removerCupom(false);
    return;
  }

  // 4. Valida se está expirado (Compara a data de validade com a data de hoje)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // A data no JSON vem como "YYYY-MM-DD", concatenamos a hora para evitar bug de fuso horário
  const validadeCupom = new Date(cupomEncontrado.validade + 'T23:59:59');

  if (validadeCupom < hoje) {
    exibirMensagemCupom("Este cupom já expirou.", "var(--red)");
    removerCupom(false);
    return;
  }

  // SE PASSOU EM TUDO: Cupom Válido!
  cupomAtivo = cupomEncontrado;

  // Salva no localStorage para o Checkout ler depois
  localStorage.setItem('cupomCliente', JSON.stringify(cupomAtivo));

  // Aplica o desconto diretamente nos preços dos itens do carrinho
  aplicarDescontoNoCarrinho(cupomAtivo.desconto);

  exibirMensagemCupom(`Desconto de ${cupomAtivo.desconto}% aplicado com sucesso!`, "var(--green)");

  // Re-renderiza o carrinho com os novos preços e atualiza o resumo
  renderizarCarrinho();
}

function exibirMensagemCupom(texto, cor) {
  const msgEl = document.getElementById('cupom-msg');
  msgEl.innerText = texto;
  msgEl.style.color = cor;
}

function removerCupom(limparCampo = true) {
  cupomAtivo = null;
  localStorage.removeItem('cupomCliente');

  // Restaura os preços originais dos itens do carrinho
  removerDescontoDoCarrinho();

  if (limparCampo) {
    document.getElementById('input-cupom').value = '';
    document.getElementById('cupom-msg').innerText = '';
  }

  renderizarCarrinho();
}

function carregarCupomSalvo() {
  const salvo = JSON.parse(localStorage.getItem('cupomCliente'));
  if (salvo) {
    document.getElementById('input-cupom').value = salvo.codigo;
    aplicarCupom();
  }
}

/*═════════════════════════════════════════════════════APLICAÇÃO DO DESCONTO NO CARRINHO═════════════════════════════════════════*/

function aplicarDescontoNoCarrinho(percentual) {
  let carrinho = obterCarrinho();

  carrinho = carrinho.map(function(item) {
    // Guarda o preço original na primeira vez (preço "de tabela", sem desconto)
    if (item.precoOriginal === undefined) {
      item.precoOriginal = item.preco;
    }

    // Sempre recalcula a partir do preço original, evitando desconto acumulado
    item.preco = item.precoOriginal * (1 - percentual / 100);

    return item;
  });

  salvarCarrinho(carrinho);
}

function removerDescontoDoCarrinho() {
  let carrinho = obterCarrinho();

  carrinho = carrinho.map(function(item) {
    if (item.precoOriginal !== undefined) {
      item.preco = item.precoOriginal;
      delete item.precoOriginal;
    }
    return item;
  });

  salvarCarrinho(carrinho);
}

/*═════════════════════════════════════════════════════RENDER═════════════════════════════════════════*/

function renderizarCarrinho() {
  const container = document.getElementById('cart-items-container');
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
        <button class="btn-checkout" style="width: auto; margin-top: 16px;" onclick="voltarParaShop()">Ir para a Loja</button>
      </div>
    `;
    atualizarResumo();
    return;
  }

  /*═════════════════════════════════════════════════════LOOP ITENS═════════════════════════════════════════*/
  for (let i = 0; i < carrinho.length; i++) {
    const item = carrinho[i];
    let imagemHtml = '';

    if (item.imagem && item.imagem.startsWith('http')) {
      imagemHtml = `<img src="${item.imagem}" alt="${item.nome}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 12px;">`;
    } else {
      imagemHtml = `<div class="cart-item-image">${item.imagem || '🍔'}</div>`;
    }

    const itemHtml = `
      <div class="cart-item">
        ${imagemHtml}
        <div class="cart-item-info">
          <div class="cart-item-name">${item.nome}</div>
          <div class="cart-item-price">R$ ${item.preco.toFixed(2)}</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="diminuirQuantidade('${item.id}')">-</button>
          <div class="qty-display">${item.quantidade}</div>
          <button class="qty-btn" onclick="aumentarQuantidade('${item.id}')">+</button>
          <button class="btn-remove" onclick="removerItem('${item.id}')">Remover</button>
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
  let total = 0;

  for (let i = 0; i < carrinho.length; i++) {
    const item = carrinho[i];
    const precoOriginal = item.precoOriginal !== undefined ? item.precoOriginal : item.preco;

    subtotal += precoOriginal * item.quantidade;
    total += item.preco * item.quantidade;
  }

  const taxa = 0;
  const valorDesconto = subtotal - total;

  // Lógica do desconto baseada na diferença entre preço original e preço com desconto
  if (valorDesconto > 0.001) {
    document.getElementById('row-desconto').style.display = 'flex';
    document.getElementById('valor-desconto').innerText = valorDesconto.toFixed(2);
  } else {
    document.getElementById('row-desconto').style.display = 'none';
  }

  total += taxa;

  document.getElementById('subtotal').innerText = subtotal.toFixed(2);
  document.getElementById('taxa').innerText = taxa.toFixed(2);
  document.getElementById('total').innerText = total.toFixed(2);
  document.getElementById('btn-checkout').disabled = carrinho.length === 0;
}

/*═════════════════════════════════════════════════════QUANTIDADE═════════════════════════════════════════*/

function aumentarQuantidade(idProduto) {
  const carrinho = obterCarrinho();
  const item = carrinho.find(function(prod) { return prod.id === idProduto; });
  if (!item) return;

  item.quantidade += 1;
  salvarCarrinho(carrinho);
  renderizarCarrinho();
}

function diminuirQuantidade(idProduto) {
  let carrinho = obterCarrinho();
  const item = carrinho.find(function(prod) { return prod.id === idProduto; });
  if (!item) return;

  item.quantidade -= 1;
  if (item.quantidade <= 0) {
    carrinho = carrinho.filter(function(prod) { return prod.id !== idProduto; });
  }

  salvarCarrinho(carrinho);
  renderizarCarrinho();
}

function removerItem(idProduto) {
  let carrinho = obterCarrinho();
  carrinho = carrinho.filter(function(prod) { return prod.id !== idProduto; });
  salvarCarrinho(carrinho);
  renderizarCarrinho();
}

function limparCarrinho() {
  const confirmar = confirm('Deseja limpar o carrinho?');
  if (!confirmar) return;
  localStorage.removeItem('carrinho');
  removerCupom(true); // Se zerou o carrinho, limpa o cupom também
  renderizarCarrinho();
}

/*═════════════════════════════════════════════════════INIT═════════════════════════════════════════*/

window.onload = function() {
  renderizarCarrinho();
  carregarCupomSalvo(); // Verifica se já tinha um cupom atrelado e o reaplica
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