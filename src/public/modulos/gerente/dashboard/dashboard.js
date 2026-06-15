const mockProdutos = [
  { id: 1, nome: "X-Burger", quantidade: 15, preco: 18.90 },
  { id: 2, nome: "X-Salada", quantidade: 22, preco: 21.50 },
  { id: 3, nome: "Batata Frita M", quantidade: 40, preco: 12.00 },
  { id: 4, nome: "Refrigerante Lata", quantidade: 65, preco: 6.00 },
  { id: 5, nome: "Suco Natural", quantidade: 18, preco: 8.50 }
];

const hoje = new Date().toISOString().split('T')[0];

const mockPedidos = [
  {
    id: 1001,
    cliente: { nome: "Carlos Silva" },
    total: 44.90,
    horarioRetirada: "18:30",
    status: "Pendente",
    dataCriacao: `${hoje}T18:00:00.000Z`,
    itens: [
      { nome: "X-Burger", quantidade: 2 },
      { nome: "Refrigerante Lata", quantidade: 1 }
    ]
  },
  {
    id: 1002,
    cliente: { nome: "Ana Beatriz" },
    total: 33.50,
    horarioRetirada: "18:45",
    status: "Confirmado",
    dataCriacao: `${hoje}T18:10:00.000Z`,
    itens: [
      { nome: "X-Salada", quantidade: 1 },
      { nome: "Batata Frita M", quantidade: 1 }
    ]
  },
  {
    id: 1003,
    cliente: { nome: "Marcos Oliveira" },
    total: 20.50,
    horarioRetirada: "19:15",
    status: "Preparando",
    dataCriacao: `${hoje}T18:15:00.000Z`,
    itens: [
      { nome: "Batata Frita M", quantidade: 1 },
      { nome: "Suco Natural", quantidade: 1 }
    ]
  },
  {
    id: 1004,
    cliente: { nome: "Julia Costa" },
    total: 57.80,
    horarioRetirada: "19:30",
    status: "Pronto",
    dataCriacao: `${hoje}T18:20:00.000Z`,
    itens: [
      { nome: "X-Burger", quantidade: 2 },
      { nome: "X-Salada", quantidade: 1 }
    ]
  },
  {
    id: 1005,
    cliente: { nome: "Lucas Almeida" },
    total: 24.90,
    horarioRetirada: "17:15",
    status: "Retirado",
    dataCriacao: `${hoje}T16:45:00.000Z`,
    itens: [
      { nome: "X-Burger", quantidade: 1 },
      { nome: "Refrigerante Lata", quantidade: 1 }
    ]
  },
  {
    id: 1006,
    cliente: { nome: "Mariana Souza" },
    total: 18.00,
    horarioRetirada: "17:30",
    status: "Cancelado",
    dataCriacao: `${hoje}T17:00:00.000Z`,
    itens: [
      { nome: "Refrigerante Lata", quantidade: 3 }
    ]
  }
];

if (!localStorage.getItem('produtos')) {
  localStorage.setItem('produtos', JSON.stringify(mockProdutos));
}

if (!localStorage.getItem('pedidos')) {
  localStorage.setItem('pedidos', JSON.stringify(mockPedidos));
}

document.addEventListener('DOMContentLoaded', () => {
  inicializarDashboard();
});

function logout() {
  window.location.href = '../../../index.html';
}

function inicializarDashboard() {
  carregarMetricas();
  renderizarProximasRetiradas();
  renderizarPedidosRecentes();

  const inputPesquisa = document.getElementById('search-input');
  const selectStatus = document.getElementById('status-filter');

  const aplicarFiltros = () => {
    const termo = inputPesquisa ? inputPesquisa.value : '';
    const status = selectStatus ? selectStatus.value : 'todos';
    renderizarPedidosRecentes(termo, status);
  };

  if (inputPesquisa) {
    inputPesquisa.addEventListener('input', aplicarFiltros);
  }

  if (selectStatus) {
    selectStatus.addEventListener('change', aplicarFiltros);
  }
}

function carregarMetricas() {
  const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
  const produtos = JSON.parse(localStorage.getItem('produtos')) || [];

  const hojeData = new Date().toLocaleDateString('pt-BR');
  
  let pedidosHoje = 0;
  let receitaHoje = 0;

  pedidos.forEach(pedido => {
    if (pedido.dataCriacao) {
      const dataPedido = new Date(pedido.dataCriacao).toLocaleDateString('pt-BR');
      if (dataPedido === hojeData) {
        pedidosHoje++;
        if (pedido.status !== 'Cancelado') {
          receitaHoje += pedido.total;
        }
      }
    }
  });

  let estoqueTotal = 0;
  produtos.forEach(produto => {
    estoqueTotal += (produto.quantidade || 0);
  });

  document.getElementById('pedidos-hoje').innerText = pedidosHoje;
  document.getElementById('total-produtos').innerText = produtos.length;
  document.getElementById('estoque-total').innerText = estoqueTotal;
  document.getElementById('receita-total').innerText = `R$ ${receitaHoje.toFixed(2)}`;
}

function renderizarProximasRetiradas() {
  const tbody = document.getElementById('upcoming-orders-body');
  let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

  const statusPendentes = ['Pendente', 'Confirmado', 'Preparando', 'Pronto'];
  let proximos = pedidos.filter(p => statusPendentes.includes(p.status));

  proximos.sort((a, b) => a.horarioRetirada.localeCompare(b.horarioRetirada));

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

function renderizarPedidosRecentes(termoPesquisa = '', statusFiltro = 'todos') {
  const tbody = document.getElementById('recent-orders-body');
  if (!tbody) return;

  let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

  pedidos.sort((a, b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0));

  pedidos = pedidos.filter(pedido => {
    let passouPesquisa = true;
    if (termoPesquisa.trim() !== '') {
      const termo = termoPesquisa.toLowerCase().trim();
      const idCorrespondente = pedido.id && pedido.id.toString().toLowerCase().includes(termo);
      const clienteCorrespondente = pedido.cliente && pedido.cliente.nome && pedido.cliente.nome.toLowerCase().includes(termo);
      
      passouPesquisa = idCorrespondente || clienteCorrespondente;
    }

    let passouStatus = true;
    if (statusFiltro !== 'todos') {
      const statusLimpo = pedido.status ? pedido.status.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") : '';
      passouStatus = statusLimpo === statusFiltro;
    }

    return passouPesquisa && passouStatus;
  });

  pedidos = pedidos.slice(0, 8);

  tbody.innerHTML = '';

  if (pedidos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhum pedido encontrado com estes filtros.</td></tr>`;
    return;
  }

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

function obterClasseStatus(status) {
  if (!status) return 'status-pendente';

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
    case 'concluido': 
      return 'status-retirado';
    case 'cancelado': 
      return 'status-cancelado';
    default: 
      return 'status-pendente';
  }
}
