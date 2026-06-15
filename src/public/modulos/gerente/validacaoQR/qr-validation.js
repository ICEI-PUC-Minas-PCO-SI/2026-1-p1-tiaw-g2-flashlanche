/**
 * ═════════════════════════════════════════════════════
 * CONFIGURAÇÃO INICIAL E EVENTOS
 * ═════════════════════════════════════════════════════
 */
document.addEventListener('DOMContentLoaded', () => {
  renderizarHistorico();

  // Permite que leitores de QR code automáticos disparem a função ao simular o "Enter"
  const inputQr = document.getElementById('qr-input');
  inputQr.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      validarQR();
    }
  });
});

function logout() {
  window.location.href = '../../../index.html';
}

/**
 * ═════════════════════════════════════════════════════
 * LÓGICA DE VALIDAÇÃO E CADASTRO
 * ═════════════════════════════════════════════════════
 */
function validarQR() {
  const inputEl = document.getElementById('qr-input');
  const textoLido = inputEl.value.trim();

  // Se o campo estiver vazio, não faz nada
  if (!textoLido) {
    mostrarResultadoErro('Campo vazio', 'Por favor, insira ou escaneie o código do pedido.');
    return;
  }

  try {
    // 1. Tenta converter o texto lido de volta para um objeto JavaScript
    const pedidoEscaneado = JSON.parse(textoLido);

    // 2. Verifica se o objeto tem a estrutura básica de um pedido do FlashLanche
    if (!pedidoEscaneado.id || !pedidoEscaneado.cliente || !pedidoEscaneado.itens) {
      throw new Error("Formato de QR Code não reconhecido pelo sistema.");
    }

    // 3. Puxa os pedidos que já estão cadastrados no computador da lanchonete
    const pedidosLanchonete = JSON.parse(localStorage.getItem('pedidos')) || [];

    // 4. Verifica se este pedido já foi escaneado e cadastrado antes
    const pedidoJaExiste = pedidosLanchonete.find(p => p.id === pedidoEscaneado.id);

    if (pedidoJaExiste) {
      mostrarResultadoAviso(pedidoJaExiste);
      inputEl.value = ''; // Limpa o campo
      return;
    }

    // 5. Cadastra o pedido novo no sistema do gerente
    pedidoEscaneado.status = 'Pendente'; // Atualiza o status
    pedidoEscaneado.dataRetirada = new Date().toISOString(); // Salva a data exata da retirada
    
    pedidosLanchonete.push(pedidoEscaneado);
    localStorage.setItem('pedidos', JSON.stringify(pedidosLanchonete));

    // ════════ INTEGRAÇÃO COM O ESTOQUE ════════
    // Dá baixa automática nos itens que o aluno acabou de retirar
    const produtosEstoque = JSON.parse(localStorage.getItem('produtos')) || [];
    
    pedidoEscaneado.itens.forEach(itemVendido => {
      // Procura o produto no banco de dados
      const produto = produtosEstoque.find(p => p.id === itemVendido.id);
      
      if (produto) {
        // Diminui a quantidade vendida
        produto.quantidade = (produto.quantidade || 0) - itemVendido.quantidade;
        if (produto.quantidade < 0) produto.quantidade = 0;
        
        // Atualiza a etiqueta de status (Disponível, Baixo, Esgotado)
        if (produto.quantidade === 0) {
          produto.status = 'esgotado';
        } else if (produto.quantidade <= 4) {
          produto.status = 'baixo';
        } else {
          produto.status = 'disponivel';
        }
      }
    });
    
    // Salva o estoque atualizado de volta no sistema
    localStorage.setItem('produtos', JSON.stringify(produtosEstoque));

    // 6. Atualiza a interface
    mostrarResultadoSucesso(pedidoEscaneado);
    renderizarHistorico();
    
    // Limpa o input e devolve o foco para o próximo escaneamento
    inputEl.value = '';
    inputEl.focus();

  } catch (erro) {
    // Se o JSON.parse falhar (ex: usuário digitou texto aleatório) ou a estrutura for inválida
    mostrarResultadoErro('QR Code Inválido', 'O código escaneado não é um pedido válido do FlashLanche.');
    inputEl.value = '';
    inputEl.focus();
  }
}

/**
 * ═════════════════════════════════════════════════════
 * RENDERIZAÇÃO DOS RESULTADOS (FEEDBACK VISUAL)
 * ═════════════════════════════════════════════════════
 */
function mostrarResultadoSucesso(pedido) {
  const container = document.getElementById('result-container');
  
  // Formata os itens para exibir resumidamente (Ex: "2x Hambúrguer, 1x Coca-Cola")
  const resumoItens = pedido.itens.map(item => `${item.quantidade}x ${item.nome}`).join(', ');

  container.innerHTML = `
    <div class="result-card" style="border-color: var(--green);">
      <div class="result-code">${pedido.id}</div>
      <div class="result-status status-valido">
        <i class="bi bi-check-circle"></i> Pedido Validado e Retirado
      </div>
      <div class="result-info"><i class="bi bi-person"></i> <b>Cliente:</b> ${pedido.cliente.nome}</div>
      <div class="result-info"><i class="bi bi-box-seam"></i> <b>Itens:</b> ${resumoItens}</div>
      <div class="result-info"><i class="bi bi-currency-dollar"></i> <b>Total pago:</b> R$ ${pedido.total.toFixed(2)}</div>
    </div>
  `;
}

function mostrarResultadoAviso(pedido) {
  const container = document.getElementById('result-container');
  
  // Formata a data em que o pedido foi retirado (se existir)
  let dataFormatada = 'Data desconhecida';
  if (pedido.dataRetirada) {
    const data = new Date(pedido.dataRetirada);
    dataFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  container.innerHTML = `
    <div class="result-card" style="border-color: #f1c40f;">
      <div class="result-code">${pedido.id}</div>
      <div class="result-status status-invalido" style="background: rgba(241, 196, 15, 0.12); color: #e67e22;">
        <i class="bi bi-exclamation-triangle"></i> Pedido Já Retirado
      </div>
      <div class="result-info">Este QR Code já foi escaneado no sistema às <b>${dataFormatada}</b>.</div>
      <div class="result-info"><b>Cliente:</b> ${pedido.cliente.nome}</div>
    </div>
  `;
}

function mostrarResultadoErro(titulo, mensagem) {
  const container = document.getElementById('result-container');
  container.innerHTML = `
    <div class="result-card" style="border-color: #d64545;">
      <div class="result-status status-invalido">
        <i class="bi bi-x-circle"></i> ${titulo}
      </div>
      <div class="result-info">${mensagem}</div>
    </div>
  `;
}

/**
 * ═════════════════════════════════════════════════════
 * TABELA DE HISTÓRICO
 * ═════════════════════════════════════════════════════
 */
function renderizarHistorico() {
  const tbody = document.getElementById('qr-history');
  const pedidosLanchonete = JSON.parse(localStorage.getItem('pedidos')) || [];

  if (pedidosLanchonete.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-secondary);">Nenhum QR escaneado ainda.</td>
      </tr>
    `;
    return;
  }

  // Ordena para que os escaneamentos mais recentes apareçam no topo
  const pedidosOrdenados = pedidosLanchonete.sort((a, b) => {
    return new Date(b.dataRetirada || 0) - new Date(a.dataRetirada || 0);
  });

  tbody.innerHTML = '';

  pedidosOrdenados.forEach(pedido => {
    let horaRetirada = '--:--';
    if (pedido.dataRetirada) {
      const data = new Date(pedido.dataRetirada);
      horaRetirada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family: 'Roboto Mono', monospace; font-weight: 700; color: var(--orange);">${pedido.id}</td>
      <td>
        <div style="font-weight: 600;">${pedido.cliente.nome}</div>
        <div style="font-size: 11px; color: var(--text-secondary);">${pedido.itens.length} itens</div>
      </td>
      <td>
        <span class="result-status status-retirado" style="margin: 0; padding: 4px 8px; font-size: 10px;">
          ${pedido.status}
        </span>
      </td>
      <td>${horaRetirada}</td>
      <td>
        <button class="btn-action btn-action-danger" onclick="excluirDoHistorico('${pedido.id}')">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function excluirDoHistorico(id) {
  if (!confirm('Deseja remover este pedido do histórico? Isso apagará os dados dele no sistema da lanchonete.')) {
    return;
  }

  let pedidosLanchonete = JSON.parse(localStorage.getItem('pedidos')) || [];
  pedidosLanchonete = pedidosLanchonete.filter(p => p.id !== id);
  localStorage.setItem('pedidos', JSON.stringify(pedidosLanchonete));
  
  renderizarHistorico();
}

/**
 * ═════════════════════════════════════════════════════
 * CÂMERA E LEITURA EM TEMPO REAL
 * ═════════════════════════════════════════════════════
 */
let leitorQR;

function abrirCamera() {
  const cameraContainer = document.getElementById('camera-container');
  const btnAbrirCamera = document.getElementById('btn-abrir-camera');
  
  cameraContainer.style.display = 'block';
  btnAbrirCamera.disabled = true;

  // Inicializa o leitor apontando para a div com id="reader"
  leitorQR = new Html5Qrcode("reader");

  // Configuração: usa a câmera traseira ('environment') e define o tamanho da área de leitura
  const configuracao = { 
    fps: 10, 
    qrbox: { width: 250, height: 250 } 
  };

  leitorQR.start(
    { facingMode: "environment" }, 
    configuracao, 
    aoLerQRCodeComSucesso, 
    aoFalharLeitura
  ).catch((erro) => {
    alert("Erro ao acessar a câmera. Verifique se o navegador tem permissão.");
    fecharCamera();
  });
}

function fecharCamera() {
  const cameraContainer = document.getElementById('camera-container');
  const btnAbrirCamera = document.getElementById('btn-abrir-camera');

  if (leitorQR) {
    leitorQR.stop().then(() => {
      cameraContainer.style.display = 'none';
      btnAbrirCamera.disabled = false;
      leitorQR.clear();
    }).catch(erro => console.error("Erro ao parar a câmera:", erro));
  } else {
    cameraContainer.style.display = 'none';
    btnAbrirCamera.disabled = false;
  }
}

// Quando a câmera consegue capturar e traduzir o QR Code
function aoLerQRCodeComSucesso(textoDecodificado) {
  // 1. Fecha a câmera para não continuar lendo
  fecharCamera();

  // 2. Joga o texto escaneado no input
  const inputEl = document.getElementById('qr-input');
  inputEl.value = textoDecodificado;

  // 3. Chama automaticamente a sua função de validação que já está pronta
  validarQR();
}

// Essa função roda a cada frame que a câmera tenta achar um QR e falha (completamente normal)
function aoFalharLeitura(erro) {
  // Omitido para não poluir o console, pois ele falha dezenas de vezes por segundo
  // até o usuário alinhar o QR code perfeitamente na câmera.
}

function criarPedidoManual() {
  const id = document.getElementById('pedido-id').value.trim();
  const clienteNome = document.getElementById('pedido-cliente').value.trim();
  const total = Number(document.getElementById('pedido-total').value);
  const status = document.getElementById('pedido-status').value;

  if (!id || !clienteNome) {
    alert('Preencha ID e Cliente.');
    return;
  }

  const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

  const existe = pedidos.find(p => p.id === id);

  if (existe) {
    alert('Já existe um pedido com este ID.');
    return;
  }

  const novoPedido = {
    id,
    cliente: {
      nome: clienteNome
    },
    itens: [],
    total,
    status,
    dataRetirada: new Date().toISOString()
  };

  pedidos.push(novoPedido);

  localStorage.setItem(
    'pedidos',
    JSON.stringify(pedidos)
  );

  renderizarHistorico();

  alert('Pedido criado com sucesso.');
}

function buscarPedido() {
  const id = document.getElementById('pedido-id').value.trim();

  if (!id) {
    alert('Informe um ID.');
    return;
  }

  const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

  const pedido = pedidos.find(p => p.id === id);

  if (!pedido) {
    alert('Pedido não encontrado.');
    return;
  }

  document.getElementById('pedido-cliente').value =
    pedido.cliente?.nome || '';

  document.getElementById('pedido-total').value =
    pedido.total || 0;

  document.getElementById('pedido-status').value =
    pedido.status || 'Pendente';
}

function atualizarPedido() {
  const id = document.getElementById('pedido-id').value.trim();

  const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

  const indice = pedidos.findIndex(
    p => p.id === id
  );

  if (indice === -1) {
    alert('Pedido não encontrado.');
    return;
  }

  pedidos[indice].cliente.nome =
    document.getElementById('pedido-cliente').value.trim();

  pedidos[indice].total =
    Number(document.getElementById('pedido-total').value);

  pedidos[indice].status =
    document.getElementById('pedido-status').value;

  localStorage.setItem(
    'pedidos',
    JSON.stringify(pedidos)
  );

  renderizarHistorico();

  alert('Pedido atualizado.');
}

function deletarPedidoManual() {
  const id = document.getElementById('pedido-id').value.trim();

  if (!id) {
    alert('Informe um ID.');
    return;
  }

  if (!confirm('Deseja excluir este pedido?')) {
    return;
  }

  let pedidos =
    JSON.parse(localStorage.getItem('pedidos')) || [];

  pedidos = pedidos.filter(
    p => p.id !== id
  );

  localStorage.setItem(
    'pedidos',
    JSON.stringify(pedidos)
  );

  renderizarHistorico();

  limparFormularioPedido();

  alert('Pedido removido.');
}

function limparFormularioPedido() {
  document.getElementById('pedido-id').value = '';
  document.getElementById('pedido-cliente').value = '';
  document.getElementById('pedido-total').value = '';
  document.getElementById('pedido-status').value = 'Pendente';
}