document.addEventListener('DOMContentLoaded', () => {
  inicializarDashboard();
});

function logout() {
  encerrarSessao();
  window.location.href = '../../../index.html';
}

function inicializarDashboard() {
  carregarMetricas();
  renderizarProximasRetiradas();
  renderizarPedidosRecentes(); // Renderiza inicialmente sem filtros

  // CONFIGURAÇÃO DOS FILTROS (PESQUISA E STATUS)
  const inputPesquisa = document.getElementById('search-input');
  const selectStatus = document.getElementById('status-filter');

  // Função unificada que lê ambos os campos e atualiza a tabela
  const aplicarFiltros = () => {
    const termo = inputPesquisa ? inputPesquisa.value : '';
    const status = selectStatus ? selectStatus.value : 'todos';
    renderizarPedidosRecentes(termo, status);
  };

  // Ouve digitação no campo de texto
  if (inputPesquisa) {
    inputPesquisa.addEventListener('input', aplicarFiltros);
  }

  // Ouve mudanças na caixa de seleção de status
  if (selectStatus) {
    selectStatus.addEventListener('change', aplicarFiltros);
  }
}

/**
 * ═════════════════════════════════════════════════════
 * STORAGE: CHAVES E HELPER GENÉRICO (SOMENTE LEITURA)
 * ═════════════════════════════════════════════════════
 */
const STORAGE_KEYS = {
  PEDIDOS: 'pedidos',
  PRODUTOS: 'produtos',
};

/**
 * Lê e faz parse de um valor JSON do localStorage.
 * Retorna `padrao` se a chave não existir ou o JSON estiver corrompido,
 * em vez de deixar o erro quebrar o dashboard inteiro.
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

function obterPedidos() {
  return obterDoStorage(STORAGE_KEYS.PEDIDOS, []);
}

function obterProdutos() {
  return obterDoStorage(STORAGE_KEYS.PRODUTOS, []);
}

/**
 * ═════════════════════════════════════════════════════
 * CÁLCULO DE MÉTRICAS (TOPO DA TELA)
 * ═════════════════════════════════════════════════════
 */
function carregarMetricas() {
  const pedidos = obterPedidos();
  const produtos = obterProdutos();

  const hoje = new Date().toLocaleDateString('pt-BR');

  let pedidosHoje = 0;
  let receitaHoje = 0;

  pedidos.forEach((pedido) => {
    if (!pedido.dataCriacao) {
      return;
    }

    // Verifica se o pedido foi criado hoje
    const dataPedido = new Date(pedido.dataCriacao).toLocaleDateString('pt-BR');

    if (dataPedido !== hoje) {
      return;
    }

    pedidosHoje++;

    // Soma a receita apenas se o pedido não foi cancelado
    if (pedido.status !== 'Cancelado') {
      receitaHoje += pedido.total || 0;
    }
  });

  // Calcula o total de unidades de todos os produtos no estoque
  let estoqueTotal = 0;
  produtos.forEach((produto) => {
    estoqueTotal += produto.quantidade || 0;
  });

  // Atualiza o HTML
  document.getElementById('pedidos-hoje').innerText = pedidosHoje;
  document.getElementById('total-produtos').innerText = produtos.length;
  document.getElementById('estoque-total').innerText = estoqueTotal;
  document.getElementById('receita-total').innerText = `R$ ${receitaHoje.toFixed(2)}`;
}

/**
 * ═════════════════════════════════════════════════════
 * TABELA 1: PRÓXIMAS RETIRADAS (ORDENADO POR HORÁRIO)
 * ═════════════════════════════════════════════════════
 */
function renderizarProximasRetiradas() {
  const tbody = document.getElementById('upcoming-orders-body');

  // Filtra apenas os pedidos que precisam ser preparados (ignora os já entregues ou cancelados)
  const statusEmPreparo = ['Pendente', 'Confirmado', 'Preparando', 'Pronto'];

  let proximos = obterPedidos().filter((pedido) => statusEmPreparo.includes(pedido.status));

  // Ordena pelo horário de retirada (ex: "18:30" vem antes de "19:00")
  proximos.sort((a, b) => a.horarioRetirada.localeCompare(b.horarioRetirada));

  // Limita para mostrar apenas os 5 mais urgentes
  proximos = proximos.slice(0, 5);

  tbody.innerHTML = '';

  if (proximos.length === 0) {
    tbody.appendChild(criarLinhaVaziaFilaPreparo());
    return;
  }

  proximos.forEach((pedido) => {
    tbody.appendChild(criarLinhaProximaRetirada(pedido));
  });
}

function criarLinhaVaziaFilaPreparo() {
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td colspan="5" class="table-message table-empty">
      <i class="bi bi-check-circle table-empty-icon"></i>
      Nenhum pedido na fila de preparo no momento.
    </td>
  `;

  return tr;
}

function criarLinhaProximaRetirada(pedido) {
  // Resumo dos itens
  let resumoItens = pedido.itens.map((item) => `${item.quantidade}x ${item.nome}`).join(', ');

  if (resumoItens.length > 30) {
    resumoItens = resumoItens.substring(0, 30) + '...';
  }

  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td class="horario-retirada"><i class="bi bi-clock"></i> <span></span></td>
    <td class="pedido-id"></td>
    <td class="cliente-nome"></td>
    <td class="resumo-itens"></td>
    <td><span class="status-badge ${obterClasseStatus(pedido.status)}"></span></td>
  `;

  /*═════════════════════════════════════════════════════TEXTOS DO PEDIDO (textContent evita injeção de HTML)═════════════════════════════════════════*/
  // O nome do cliente vem do formulário público de pedidos, então NUNCA deve
  // ser inserido via innerHTML — textContent garante que é tratado só como texto.

  tr.querySelector('.horario-retirada span').textContent = pedido.horarioRetirada;
  tr.querySelector('.pedido-id').textContent = pedido.id;
  tr.querySelector('.cliente-nome').textContent = pedido.cliente.nome;

  const celulaItens = tr.querySelector('.resumo-itens');
  celulaItens.textContent = resumoItens;

  celulaItens.title = pedido.itens.map((item) => `${item.quantidade}x ${item.nome}`).join('\n');

  tr.querySelector('.status-badge').textContent = pedido.status;

  return tr;
}

/**
 * ═════════════════════════════════════════════════════
 * TABELA 2: HISTÓRICO GERAL (ORDENADO POR CRIAÇÃO)
 * ═════════════════════════════════════════════════════
 */
function renderizarPedidosRecentes(termoPesquisa = '', statusFiltro = 'todos') {
  const tbody = document.getElementById('recent-orders-body');

  if (!tbody) {
    return;
  }

  let pedidos = obterPedidos();

  // Ordenação por data (do mais recente para o mais antigo)
  pedidos.sort((a, b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0));

  // APLICAÇÃO DOS FILTROS (pesquisa por texto + status)
  pedidos = pedidos.filter((pedido) => passaNosFiltros(pedido, termoPesquisa, statusFiltro));

  // Limita a exibição aos primeiros 8 itens (já filtrados)
  pedidos = pedidos.slice(0, 8);

  tbody.innerHTML = '';

  if (pedidos.length === 0) {
    tbody.appendChild(criarLinhaVaziaHistorico());
    return;
  }

  pedidos.forEach((pedido) => {
    tbody.appendChild(criarLinhaPedidoRecente(pedido));
  });
}

function passaNosFiltros(pedido, termoPesquisa, statusFiltro) {
  // 1. Validação de Pesquisa por Texto
  let passouPesquisa = true;

  if (termoPesquisa.trim() !== '') {
    const termo = termoPesquisa.toLowerCase().trim();
    const idCorrespondente = pedido.id && pedido.id.toString().toLowerCase().includes(termo);
    const clienteCorrespondente = pedido.cliente && pedido.cliente.nome && pedido.cliente.nome.toLowerCase().includes(termo);

    passouPesquisa = idCorrespondente || clienteCorrespondente;
  }

  // 2. Validação do Filtro de Status (normaliza para bater com o valor do <select>)
  let passouStatus = true;

  if (statusFiltro !== 'todos') {
    passouStatus = normalizarTexto(pedido.status) === statusFiltro;
  }

  // O pedido só aparece se passar em AMBOS os filtros
  return passouPesquisa && passouStatus;
}

function criarLinhaVaziaHistorico() {
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td colspan="5" class="table-message table-empty">Nenhum pedido encontrado com estes filtros.</td>
  `;

  return tr;
}

function criarLinhaPedidoRecente(pedido) {
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td class="pedido-id-secundario"></td>
    <td class="cliente-nome"></td>
    <td class="pedido-total"></td>
    <td class="pedido-horario"></td>
    <td><span class="status-badge ${obterClasseStatus(pedido.status)}"></span></td>
  `;

  tr.querySelector('.pedido-id-secundario').textContent = pedido.id;
  tr.querySelector('.cliente-nome').textContent = pedido.cliente.nome;
  tr.querySelector('.pedido-total').textContent = `R$ ${pedido.total.toFixed(2)}`;
  tr.querySelector('.pedido-horario').textContent = pedido.horarioRetirada;
  tr.querySelector('.status-badge').textContent = pedido.status;

  return tr;
}

/**
 * ═════════════════════════════════════════════════════
 * UTILITÁRIOS
 * ═════════════════════════════════════════════════════
 */

function normalizarTexto(texto) {
  return texto ? texto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
}

function obterClasseStatus(status) {
  switch (normalizarTexto(status)) {
    case 'pendente':
      return 'status-pendente';
    case 'confirmado':
      return 'status-confirmado';
    case 'preparando':
      return 'status-preparando';
    case 'pronto':
      return 'status-pronto';
    case 'retirado':
    case 'entregue':
    case 'concluido': // Sem acento, para coincidir com a normalização acima
      return 'status-retirado';
    case 'cancelado':
      return 'status-cancelado';
    default:
      return 'status-pendente';
  }
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