/**
 * ═════════════════════════════════════════════════════
 * VARIÁVEIS GLOBAIS E INICIALIZAÇÃO
 * ═════════════════════════════════════════════════════
 */
let pedidoEmEdicaoId = null;

document.addEventListener('DOMContentLoaded', () => {
  renderizarTabela();
});

function logout() {
  window.location.href = '../../../index.html';
}

/**
 * ═════════════════════════════════════════════════════
 * RENDERIZAÇÃO E FILTRAGEM DOS PEDIDOS
 * ═════════════════════════════════════════════════════
 */
function obterPedidos() {
  const dados = localStorage.getItem('pedidos');
  return dados ? JSON.parse(dados) : [];
}

function filtrarPedidos() {
  renderizarTabela();
}

function renderizarTabela() {
  const tbody = document.getElementById('orders-body');
  const filtroSelecionado = document.getElementById('filter-status').value.toLowerCase();
  let pedidos = obterPedidos();

  // Ordena os pedidos dos mais recentes para os mais antigos
  pedidos.sort((a, b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0));

  // Aplica o filtro de status, se houver algum selecionado
  if (filtroSelecionado !== "") {
    pedidos = pedidos.filter(pedido => pedido.status.toLowerCase() === filtroSelecionado);
  }

  tbody.innerHTML = '';

  if (pedidos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 32px;">
          Nenhum pedido encontrado.
        </td>
      </tr>
    `;
    return;
  }

  pedidos.forEach(pedido => {
    // Cria um resumo em texto dos itens (Ex: "2x Hambúrguer, 1x Suco...")
    let resumoItens = pedido.itens.map(item => `${item.quantidade}x ${item.nome}`).join(', ');
    
    // Se o texto ficar muito grande, corta e coloca "..."
    if (resumoItens.length > 35) {
      resumoItens = resumoItens.substring(0, 35) + '...';
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family: 'Roboto Mono', monospace; font-weight: 700; color: var(--orange);">
        ${pedido.id}
      </td>
      <td>
        <div style="font-weight: 600;">${pedido.cliente.nome}</div>
        <div style="font-size: 11px; color: var(--text-secondary);"><i class="bi bi-clock"></i> Para: ${pedido.horarioRetirada}</div>
      </td>
      <td title="${pedido.itens.map(i => `${i.quantidade}x ${i.nome}`).join('\n')}">
        ${resumoItens}
      </td>
      <td style="font-weight: 600;">R$ ${pedido.total.toFixed(2)}</td>
      <td>
        <span class="status-badge ${obterClasseStatus(pedido.status)}">
          ${pedido.status}
        </span>
      </td>
      <td>
        <button class="btn-action" onclick="abrirModalDetalhes('${pedido.id}')">
          <i class="bi bi-eye"></i> Detalhes
        </button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

function obterClasseStatus(status) {
  const statusFormatado = status.toLowerCase();
  switch (statusFormatado) {
    case 'pendente': return 'status-pendente';
    case 'confirmado': return 'status-confirmado';
    case 'preparando': return 'status-preparando';
    case 'pronto': return 'status-pronto';
    case 'retirado': case 'entregue': case 'concluído': return 'status-retirado';
    case 'cancelado': return 'status-cancelado';
    default: return 'status-pendente';
  }
}

/**
 * ═════════════════════════════════════════════════════
 * LÓGICA DO MODAL E ATUALIZAÇÃO DE STATUS
 * ═════════════════════════════════════════════════════
 */
function abrirModalDetalhes(idPedido) {
  const pedidos = obterPedidos();
  const pedido = pedidos.find(p => p.id === idPedido);

  if (!pedido) return;

  pedidoEmEdicaoId = idPedido; // Salva o ID globalmente para podermos editar depois

  // Preenche dados básicos
  document.getElementById('modal-id').innerText = pedido.id;
  
  // Preenche dados do cliente
  document.getElementById('modal-cliente').innerHTML = `
    <div style="font-size: 14px;"><b>Nome:</b> ${pedido.cliente.nome}</div>
    <div style="font-size: 14px;"><b>Contato:</b> ${pedido.cliente.telefone} | ${pedido.cliente.email}</div>
    <div style="font-size: 14px; margin-top: 4px; color: var(--orange);"><i class="bi bi-clock"></i> <b>Horário Agendado:</b> ${pedido.horarioRetirada}</div>
  `;

  // Lista de itens detalhada
  let itensHtml = '';
  pedido.itens.forEach(item => {
    itensHtml += `
      <div class="item-list" style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-gray); border-radius: 0; background: transparent; padding: 8px 0;">
        <div><b>${item.quantidade}x</b> ${item.nome}</div>
        <div>R$ ${(item.preco * item.quantidade).toFixed(2)}</div>
      </div>
    `;
  });
  itensHtml += `
    <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 16px; font-weight: 700; color: var(--orange);">
      <div>Total Pago:</div>
      <div>R$ ${pedido.total.toFixed(2)}</div>
    </div>
  `;
  document.getElementById('modal-itens').innerHTML = itensHtml;

  // Configura o Select com os status disponíveis e marca o atual
  const statusDisponiveis = ['Pendente', 'Confirmado', 'Preparando', 'Pronto', 'Retirado', 'Cancelado'];
  const selectStatus = document.getElementById('modal-status');
  selectStatus.innerHTML = '';
  
  statusDisponiveis.forEach(status => {
    const option = document.createElement('option');
    option.value = status;
    option.innerText = status;
    if (pedido.status === status) option.selected = true;
    selectStatus.appendChild(option);
  });

  // Mostra o Modal
  document.getElementById('modal-detalhes').classList.add('show');
}

function fecharModal() {
  document.getElementById('modal-detalhes').classList.remove('show');
  pedidoEmEdicaoId = null;
}

function salvarAlteracao() {
  if (!pedidoEmEdicaoId) return;

  const novoStatus = document.getElementById('modal-status').value;
  let pedidos = obterPedidos();
  
  // Encontra o índice do pedido correto no Array
  const index = pedidos.findIndex(p => p.id === pedidoEmEdicaoId);

  if (index !== -1) {
    // Atualiza o status
    pedidos[index].status = novoStatus;
    
    // Se o status for alterado para 'Retirado', marca a hora exata (útil para o histórico do QR Code)
    if (novoStatus === 'Retirado') {
      pedidos[index].dataRetirada = new Date().toISOString();
    }

    // Salva no banco de dados local
    localStorage.setItem('pedidos', JSON.stringify(pedidos));
    
    // Atualiza a tabela respeitando o filtro que estiver selecionado
    renderizarTabela();
    fecharModal();
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