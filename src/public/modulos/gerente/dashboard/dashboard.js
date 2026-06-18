document.addEventListener('DOMContentLoaded', () => {
  inicializarDashboard();
});

function logout() {
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
 * CÁLCULO DE MÉTRICAS (TOPO DA TELA)
 * ═════════════════════════════════════════════════════
 */
function carregarMetricas() {
  const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
  const produtos = JSON.parse(localStorage.getItem('produtos')) || [];

  const hoje = new Date().toLocaleDateString('pt-BR');
  
  let pedidosHoje = 0;
  let receitaHoje = 0;

  pedidos.forEach(pedido => {
    // Verifica se o pedido foi criado hoje
    if (pedido.dataCriacao) {
      const dataPedido = new Date(pedido.dataCriacao).toLocaleDateString('pt-BR');
      if (dataPedido === hoje) {
        pedidosHoje++;
        // Soma a receita apenas se o pedido não foi cancelado
        if (pedido.status !== 'Cancelado') {
          receitaHoje += pedido.total;
        }
      }
    }
  });

  // Calcula o total de unidades de todos os produtos no estoque
  let estoqueTotal = 0;
  produtos.forEach(produto => {
    estoqueTotal += (produto.quantidade || 0);
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
  let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

  // Filtra apenas os pedidos que precisam ser preparados (ignora os já entregues ou cancelados)
  const statusPendentes = ['Pendente', 'Confirmado', 'Preparando', 'Pronto'];
  let proximos = pedidos.filter(p => statusPendentes.includes(p.status));

  // Ordena pelo horário de retirada (ex: "18:30" vem antes de "19:00")
  proximos.sort((a, b) => a.horarioRetirada.localeCompare(b.horarioRetirada));

  // Limita para mostrar apenas os 5 mais urgentes
  proximos = proximos.slice(0, 5);

  tbody.innerHTML = '';

  if (proximos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 24px; color: var(--text-secondary);">
          <i class="bi bi-check-circle" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
          Nenhum pedido na fila de preparo no momento.
        </td>
      </tr>
    `;
    return;
  }

  proximos.forEach(pedido => {
    // Resumo dos itens
    let resumoItens = pedido.itens.map(item => `${item.quantidade}x ${item.nome}`).join(', ');
    if (resumoItens.length > 30) resumoItens = resumoItens.substring(0, 30) + '...';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-size: 18px; font-weight: 800; color: var(--orange);"><i class="bi bi-clock"></i> ${pedido.horarioRetirada}</td>
      <td style="font-family: 'Roboto Mono', monospace; font-weight: 700;">${pedido.id}</td>
      <td style="font-weight: 600;">${pedido.cliente.nome}</td>
      <td title="${pedido.itens.map(i => `${i.quantidade}x ${i.nome}`).join('\n')}">${resumoItens}</td>
      <td><span class="status-badge ${obterClasseStatus(pedido.status)}">${pedido.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * ═════════════════════════════════════════════════════
 * TABELA 2: HISTÓRICO GERAL (ORDENADO POR CRIAÇÃO)
 * ═════════════════════════════════════════════════════
 */
function renderizarPedidosRecentes(termoPesquisa = '', statusFiltro = 'todos') {
  const tbody = document.getElementById('recent-orders-body');
  if (!tbody) return;

  let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

  // Ordenação por data (do mais recente para o mais antigo)
  pedidos.sort((a, b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0));

  // APLICAÇÃO DOS FILTROS
  pedidos = pedidos.filter(pedido => {
    
    // 1. Validação de Pesquisa por Texto
    let passouPesquisa = true;
    if (termoPesquisa.trim() !== '') {
      const termo = termoPesquisa.toLowerCase().trim();
      const idCorrespondente = pedido.id && pedido.id.toString().toLowerCase().includes(termo);
      const clienteCorrespondente = pedido.cliente && pedido.cliente.nome && pedido.cliente.nome.toLowerCase().includes(termo);
      
      passouPesquisa = idCorrespondente || clienteCorrespondente;
    }

    // 2. Validação do Filtro de Status
    let passouStatus = true;
    if (statusFiltro !== 'todos') {
      // Limpa o status do banco para bater com o valor do <select> (sem acentos/espaços)
      const statusLimpo = pedido.status ? pedido.status.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") : '';
      passouStatus = statusLimpo === statusFiltro;
    }

    // O pedido só aparece se passar em AMBOS os filtros
    return passouPesquisa && passouStatus;
  });

  // Limita a exibição aos primeiros 8 itens (já filtrados)
  pedidos = pedidos.slice(0, 8);

  tbody.innerHTML = '';

  if (pedidos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhum pedido encontrado com estes filtros.</td></tr>`;
    return;
  }

  // Renderiza as linhas
  pedidos.forEach(pedido => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family: 'Roboto Mono', monospace; font-weight: 700; color: var(--text-secondary);">${pedido.id}</td>
      <td style="font-weight: 600;">${pedido.cliente.nome}</td>
      <td style="font-weight: 600;">R$ ${pedido.total.toFixed(2)}</td>
      <td>${pedido.horarioRetirada}</td>
      <td><span class="status-badge ${obterClasseStatus(pedido.status)}">${pedido.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * ═════════════════════════════════════════════════════
 * UTILITÁRIOS
 * ═════════════════════════════════════════════════════
 */
function obterClasseStatus(status) {
  // 1. Proteção: se não houver status, retorna o padrão para não quebrar a tela
  if (!status) return 'status-pendente';

  // 2. Limpeza: remove espaços em branco, joga pra minúsculo e remove acentos
  // Exemplo: " Concluído " é transformado em "concluido"
  const statusFormatado = status.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");

  switch (statusFormatado) {
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
    case 'concluido': // Removido o acento para coincidir com a formatação acima
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

