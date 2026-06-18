document.addEventListener('DOMContentLoaded', () => {
  renderizarPedidos();
});

function voltarParaShop() {
  window.location.href = '../cardapio/shop.html';
}

/**
 * ═════════════════════════════════════════════════════
 * RENDERIZAÇÃO DA LISTA DE PEDIDOS
 * ═════════════════════════════════════════════════════
 */
function renderizarPedidos() {
  const container = document.getElementById('orders-grid');
  const pedidosSalvos = localStorage.getItem('pedidos');
  const pedidos = pedidosSalvos ? JSON.parse(pedidosSalvos) : [];

  if (pedidos.length === 0) {
    // Mantém a tela vazia (que já está no HTML original) se não houver pedidos
    return;
  }

  // Ordena para os pedidos mais recentes aparecerem primeiro
  pedidos.reverse();

  container.innerHTML = ''; // Limpa a tela de "vazio"

  pedidos.forEach(pedido => {
    // 1. Formata a data e hora em que o pedido foi criado
    let dataFormatada = 'Data não registrada';
    if (pedido.dataCriacao) {
      const data = new Date(pedido.dataCriacao);
      dataFormatada = data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    // 2. Define a cor do Badge de Status
    let classeStatus = 'status-pendente';
    let iconeStatus = 'bi-clock-history';
    
    if (pedido.status === 'Retirado' || pedido.status === 'Concluído' || pedido.status === 'Entregue') {
      classeStatus = 'status-retirado';
      iconeStatus = 'bi-check-circle';
    }

    // 3. Monta a lista de itens
    let itensHtml = '';
    pedido.itens.forEach(item => {
      const subtotal = item.preco * item.quantidade;
      itensHtml += `
        <div class="order-item">
          <div class="order-item-name">${item.quantidade}x ${item.nome}</div>
          <div class="order-item-price">R$ ${subtotal.toFixed(2)}</div>
        </div>
      `;
    });

    // 4. Cria o Card do Pedido
    const card = document.createElement('div');
    card.className = 'order-card';
    
    // Convertendo o objeto do pedido para string para passar pelo onclick
    const pedidoString = encodeURIComponent(JSON.stringify(pedido));

    card.innerHTML = `
      <div class="order-header">
        <div>
          <div class="order-id">${pedido.id}</div>
          <div class="order-date">${dataFormatada}</div>
        </div>
        <div class="status-badge ${classeStatus}">
          <i class="bi ${iconeStatus}"></i> ${pedido.status}
        </div>
      </div>

      <div class="order-items">
        ${itensHtml}
      </div>

      <div class="order-footer">
        <div class="order-total">
          <span class="order-total-label">Total:</span>
          <span class="order-total-value">R$ ${pedido.total.toFixed(2)}</span>
        </div>
        <div class="order-actions">
          <button class="btn-action btn-action-primary" onclick="abrirModalPedido('${pedidoString}')">
            <i class="bi bi-qr-code"></i> Ver QR Code
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

/**
 * ═════════════════════════════════════════════════════
 * LÓGICA DO MODAL E QR CODE
 * ═════════════════════════════════════════════════════
 */
function abrirModalPedido(pedidoStringCodificada) {
  // Descodifica e transforma a string de volta em um objeto JavaScript
  const pedido = JSON.parse(decodeURIComponent(pedidoStringCodificada));
  
  // Preenche os textos do Modal
  document.getElementById('modal-pedido-id').innerText = pedido.id;
  document.getElementById('modal-pedido-horario').innerText = pedido.horarioRetirada;
  document.getElementById('modal-pedido-total').innerText = 'R$ ' + pedido.total.toFixed(2);

  // Define o badge do Modal
  const badgeContainer = document.getElementById('modal-status-badge');
  if (pedido.status === 'Pendente') {
    badgeContainer.innerHTML = `<span class="status-badge status-pendente"><i class="bi bi-clock-history"></i> ${pedido.status}</span>`;
  } else {
    badgeContainer.innerHTML = `<span class="status-badge status-retirado"><i class="bi bi-check-circle"></i> ${pedido.status}</span>`;
  }

  // Gera o QR Code ou oculta dependendo do status
  const qrContainer = document.getElementById('modal-qr-container');
  const qrAviso = document.getElementById('modal-qr-aviso');
  const canvasParaDesenhar = document.getElementById('qr-code-canvas');
  
  canvasParaDesenhar.innerHTML = ''; // Limpa QR codes antigos

  if (pedido.status === 'Pendente') {
    qrContainer.style.display = 'flex';
    qrAviso.innerText = 'Apresente este QR Code no balcão para retirar seu lanche.';
    
    // IMPORTANTE: Aqui garantimos que o QR Code será gerado exatamente 
    // como geramos na tela de Checkout (com o objeto compacto)
    const qrDataString = JSON.stringify(pedido);

    new QRCode(canvasParaDesenhar, {
      text: qrDataString,
      width: 200,
      height: 200,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.L
    });
  } else {
    // Se o pedido já foi retirado, não precisa mostrar o QR code
    qrContainer.style.display = 'none';
    qrAviso.innerText = 'Este pedido já foi finalizado/retirado. Obrigado por comprar no FlashLanche!';
  }

  // Exibe o Modal
  const modal = document.getElementById('modal-pedido');
  modal.style.display = 'flex';
}

function fecharModal() {
  const modal = document.getElementById('modal-pedido');
  modal.style.display = 'none';
}

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