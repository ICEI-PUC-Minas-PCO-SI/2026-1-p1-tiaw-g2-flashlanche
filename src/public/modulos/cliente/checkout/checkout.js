/**
 * ═════════════════════════════════════════════════════
 * ESTADO GLOBAL DA TELA DE CHECKOUT
 * ═════════════════════════════════════════════════════
 */
let carrinho = [];
let horarios = [];
let horarioSelecionado = null;

// Inicialização quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
  carregarDadosStorage();
  configurarEventosValidacao();
});

/**
 * ═════════════════════════════════════════════════════
 * CARREGAMENTO DE DADOS (CARRINHO E HORÁRIOS)
 * ═════════════════════════════════════════════════════
 */
function carregarDadosStorage() {
  // 1. Carrega os itens do carrinho
  const carrinhoSalvo = localStorage.getItem('carrinho');
  carrinho = carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];

  // Se o carrinho estiver vazio, volta para a loja
  if (carrinho.length === 0) {
    alert('Seu carrinho está vazio! Redirecionando para o cardápio...');
    window.location.href = '../cardapio/shop.html';
    return;
  }

  // 2. Carrega os horários de retirada criados pelo gerente
  const horariosSalvos = localStorage.getItem('horariosRetirada');
  horarios = horariosSalvos ? JSON.parse(horariosSalvos) : [];

  renderizarResumoPedido();
  renderizarHorariosDisponiveis();
}

/**
 * ═════════════════════════════════════════════════════
 * RENDERIZAÇÃO DA INTERFACE
 * ═════════════════════════════════════════════════════
 */
function renderizarResumoPedido() {
  const container = document.getElementById('order-summary');
  let html = '';
  let total = 0;

  carrinho.forEach(item => {
    const subtotalItem = item.preco * item.quantidade;
    total += subtotalItem;

    html += `
      <div class="summary-item">
        <div>
          <span class="summary-item-qty">${item.quantidade}x</span>
          <span style="font-weight: 600; margin-left: 8px;">${item.nome}</span>
        </div>
        <div style="font-weight: 600;">R$ ${subtotalItem.toFixed(2)}</div>
      </div>
    `;
  });

  html += `
    <div class="summary-total">
      <span>Total</span>
      <span style="color: var(--orange);">R$ ${total.toFixed(2)}</span>
    </div>
  `;

  container.innerHTML = html;
}

function renderizarHorariosDisponiveis() {
  const container = document.getElementById('horarios-grid');
  container.innerHTML = '';

  // Filtra apenas os horários ativos e que ainda têm capacidade
  const horariosDisponiveis = horarios.filter(h => h.ativo && h.pedidos < h.capacidade);

  if (horariosDisponiveis.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; color: var(--text-secondary); text-align: center;">Nenhum horário disponível no momento.</p>';
    return;
  }

  horariosDisponiveis.forEach(horario => {
    const btn = document.createElement('div');
    btn.className = 'horario-btn';
    
    // Mostra a hora e quantas vagas restam
    const vagasRestantes = horario.capacidade - horario.pedidos;
    
    btn.innerHTML = `
      <div style="font-weight: 700; font-size: 16px;">${horario.hora}</div>
      <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
        ${vagasRestantes} ${vagasRestantes === 1 ? 'vaga' : 'vagas'}
      </div>
    `;

    btn.onclick = () => selecionarHorario(horario, btn);
    container.appendChild(btn);
  });
}

/**
 * ═════════════════════════════════════════════════════
 * LÓGICA DE VALIDAÇÃO E SELEÇÃO
 * ═════════════════════════════════════════════════════
 */
function selecionarHorario(horario, elementoClicado) {
  horarioSelecionado = horario;

  // Remove a classe 'selected' de todos os botões
  document.querySelectorAll('.horario-btn').forEach(btn => {
    btn.classList.remove('selected');
  });

  // Adiciona a classe 'selected' no botão clicado
  elementoClicado.classList.add('selected');
  
  validarFormulario();
}

function configurarEventosValidacao() {
  const inputs = ['nome', 'email', 'telefone'];
  inputs.forEach(id => {
    document.getElementById(id).addEventListener('input', validarFormulario);
  });
}

function validarFormulario() {
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const btnConfirm = document.getElementById('btn-confirm');

  // Libera o botão de confirmar apenas se todos os dados estiverem preenchidos e um horário for selecionado
  if (nome !== '' && email !== '' && telefone !== '' && horarioSelecionado !== null) {
    btnConfirm.disabled = false;
  } else {
    btnConfirm.disabled = true;
  }
}

/**
 * ═════════════════════════════════════════════════════
 * PROCESSAMENTO DO PEDIDO E QR CODE
 * ═════════════════════════════════════════════════════
 */
function confirmarPedido() {
  const btnConfirm = document.getElementById('btn-confirm');
  btnConfirm.disabled = true;
  btnConfirm.innerHTML = '<i class="bi bi-hourglass-split"></i> Processando...';

  const cliente = {
    nome: document.getElementById('nome').value.trim(),
    email: document.getElementById('email').value.trim(),
    telefone: document.getElementById('telefone').value.trim()
  };

  const pedidoId = 'PED-' + Math.floor(10000000 + Math.random() * 90000000);
  const total = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

  // 1. COMPACTAÇÃO: Criamos uma lista de itens SEM as imagens para economizar espaço
  const itensCompactados = carrinho.map(item => ({
    id: item.id,
    nome: item.nome,
    preco: item.preco,
    quantidade: item.quantidade
  }));

  // 2. Montamos o objeto que vai trafegar via QR Code
  const novoPedido = {
    id: pedidoId,
    cliente: cliente,
    itens: itensCompactados, // usa a lista leve, sem imagens
    horarioRetirada: horarioSelecionado.hora,
    total: total,
    status: 'Pendente',
    dataCriacao: new Date().toISOString()
  };

  // Salva no localStorage do ALUNO (para o histórico dele)
  const pedidosSalvos = localStorage.getItem('pedidos');
  const pedidos = pedidosSalvos ? JSON.parse(pedidosSalvos) : [];
  pedidos.push(novoPedido);
  localStorage.setItem('pedidos', JSON.stringify(pedidos));

  // Limpa o carrinho do aluno
  localStorage.removeItem('carrinho');

  // Atualiza a tela
  document.getElementById('pedido-id').innerText = pedidoId;
  document.getElementById('modal-order-code').innerText = pedidoId;

  // Gera o QR Code com o objeto compactado
  gerarQRCode(novoPedido);

  document.getElementById('modal-success').classList.add('show');
}

function gerarQRCode(dadosPedido) {
  const container = document.getElementById('qr-code-modal');
  container.innerHTML = ''; 

  // Transforma o pedido leve em texto. Agora ele cabe folgado no QR Code!
  const qrDataString = JSON.stringify(dadosPedido);

  new QRCode(container, {
    text: qrDataString,
    width: 220,
    height: 220,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.L // Mantém nível L para maximizar o espaço de texto
  });
}

/**
 * ═════════════════════════════════════════════════════
 * NAVEGAÇÃO
 * ═════════════════════════════════════════════════════
 */
function irParaPedidos() {
  window.location.href = '../pedidos/orders.html';
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