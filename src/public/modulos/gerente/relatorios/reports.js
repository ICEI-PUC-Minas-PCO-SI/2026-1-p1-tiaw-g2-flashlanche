// Variável global para armazenar a instância do gráfico e evitar sobreposição visual
let graficoInstancia = null;

document.addEventListener('DOMContentLoaded', () => {
  configurarDatasIniciais();
  gerarRelatorio();
});

function logout() {
  window.location.href = '../../../index.html';
}

/**
 * Define como padrão os últimos 7 dias ao abrir a página
 */
function configurarDatasIniciais() {
  const hoje = new Date();
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(hoje.getDate() - 7);

  // Formata para o padrão esperado pelo input type="date" (YYYY-MM-DD)
  document.getElementById('data-inicio').value = seteDiasAtras.toISOString().split('T')[0];
  document.getElementById('data-fim').value = hoje.toISOString().split('T')[0];
}

/**
 * ═════════════════════════════════════════════════════════
 * PROCESSAMENTO DE DADOS E INTELIGÊNCIA
 * ═════════════════════════════════════════════════════════
 */
function gerarRelatorio() {
  const dataInicioStr = document.getElementById('data-inicio').value;
  const dataFimStr = document.getElementById('data-fim').value;

  if (!dataInicioStr || !dataFimStr) {
    alert('Por favor, selecione as datas de início e fim.');
    return;
  }

  // Cria objetos de data cobrindo todo o intervalo do dia
  const dataInicio = new Date(`${dataInicioStr}T00:00:00`);
  const dataFim = new Date(`${dataFimStr}T23:59:59`);

  const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

  // 1. Filtrar pedidos dentro do intervalo de tempo (Ignora os Cancelados)
  const pedidosFiltrados = pedidos.filter(pedido => {
    if (!pedido.dataCriacao || pedido.status === 'Cancelado') return false;
    const dataPedido = new Date(pedido.dataCriacao);
    return dataPedido >= dataInicio && dataPedido <= dataFim;
  });

  // Estruturas para armazenar cálculos agregados
  let receitaTotal = 0;
  const faturamentoPorDia = {};
  const rankingProdutos = {};

  // 2. Processar Matemática e Agrupamentos
  pedidosFiltrados.forEach(pedido => {
    // Cálculo de Receita Geral
    receitaTotal += pedido.total;

    // Agrupamento por Dia (Para o Gráfico)
    const diaFormatado = new Date(pedido.dataCriacao).toLocaleDateString('pt-PT');
    if (!faturamentoPorDia[diaFormatado]) {
      faturamentoPorDia[diaFormatado] = 0;
    }
    faturamentoPorDia[diaFormatado] += pedido.total;

    // 🌟 CORREÇÃO: Validação de segurança para pedidos antigos ou malformados
    if (Array.isArray(pedido.itens)) {
      // Agrupamento por Produto (Para a Tabela)
      pedido.itens.forEach(item => {
        if (!rankingProdutos[item.nome]) {
          rankingProdutos[item.nome] = { quantidade: 0, receitaGerada: 0 };
        }
        rankingProdutos[item.nome].quantidade += item.quantidade;
        rankingProdutos[item.nome].receitaGerada += (item.preco * item.quantidade);
      });
    }
  });

  // Atualizar Cartões de Métricas no topo
  const totalPedidos = pedidosFiltrados.length;
  const ticketMedio = totalPedidos > 0 ? (receitaTotal / totalPedidos) : 0;

  document.getElementById('metrica-receita').innerText = `R$ ${receitaTotal.toFixed(2)}`;
  document.getElementById('metrica-pedidos').innerText = totalPedidos;
  document.getElementById('metrica-ticket').innerText = `R$ ${ticketMedio.toFixed(2)}`;

  // Invoca as funções para desenhar o gráfico e a tabela no ecrã
  desenharGraficoLinha(faturamentoPorDia);
  desenharTabelaRanking(rankingProdutos);
}

/**
 * ═════════════════════════════════════════════════════════
 * RENDERIZAÇÃO: GRÁFICO E TABELA
 * ═════════════════════════════════════════════════════════
 */
function desenharGraficoLinha(dadosPorDia) {
  const ctx = document.getElementById('graficoReceita').getContext('2d');
  
  if (graficoInstancia) {
    graficoInstancia.destroy();
  }

  // Ordenar os dias cronologicamente, caso o objeto os tenha baralhado
  const labelsOrdenadas = Object.keys(dadosPorDia).sort((a, b) => {
    const dataA = a.split('/').reverse().join('-');
    const dataB = b.split('/').reverse().join('-');
    return new Date(dataA) - new Date(dataB);
  });

  const valores = labelsOrdenadas.map(dia => dadosPorDia[dia]);

  graficoInstancia = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labelsOrdenadas,
      datasets: [{
        label: 'Receita Diária (R$)',
        data: valores,
        borderColor: '#ff6b2c',
        backgroundColor: 'rgba(255, 107, 44, 0.1)',
        borderWidth: 3,
        tension: 0.3, // Curva suave na linha
        fill: true,
        pointBackgroundColor: '#ff6b2c',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#eef1f5' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function desenharTabelaRanking(dadosProdutos) {
  const tbody = document.getElementById('tabela-produtos');
  tbody.innerHTML = '';

  // Converte o objeto num array para podermos ordená-lo
  const arrayProdutos = Object.keys(dadosProdutos).map(nome => {
    return {
      nome: nome,
      quantidade: dadosProdutos[nome].quantidade,
      receita: dadosProdutos[nome].receitaGerada
    };
  });

  // Ordenar por quantidade vendida (do maior para o menor)
  arrayProdutos.sort((a, b) => b.quantidade - a.quantidade);

  if (arrayProdutos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-secondary); padding: 24px;">Nenhuma venda registada neste período.</td></tr>`;
    return;
  }

  // Desenhar as linhas
  arrayProdutos.forEach(produto => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 600; color: var(--text-primary);">${produto.nome}</td>
      <td style="text-align: center; font-weight: 700; color: var(--orange);">${produto.quantidade}</td>
      <td style="text-align: right; font-weight: 600;">R$ ${produto.receita.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}