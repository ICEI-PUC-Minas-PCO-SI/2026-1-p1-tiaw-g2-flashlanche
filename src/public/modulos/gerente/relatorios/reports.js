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

    //  CORREÇÃO: Validação de segurança para pedidos antigos ou malformados
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

  // NOVA CHAMADA DE DATA MINING:
  executarMarketBasketAnalysis(pedidosFiltrados);
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

/**
 * ═════════════════════════════════════════════════════════
 * DATA MINING: MARKET BASKET ANALYSIS (ALGORITMO APRIORI)
 * ═════════════════════════════════════════════════════════
 */
function executarMarketBasketAnalysis(pedidos) {
  const contagemItens = {};
  const contagemPares = {};
  let totalPedidosValidos = 0;

  // 1. Varrer os pedidos para recolher dados
  pedidos.forEach(pedido => {
    if (!Array.isArray(pedido.itens) || pedido.itens.length === 0) return;
    
    totalPedidosValidos++;

    // Extrair apenas os nomes dos produtos (usamos Set para evitar contar duas vezes o mesmo produto no mesmo pedido)
    const produtosUnicos = [...new Set(pedido.itens.map(item => item.nome))];

    // Contar a frequência individual de cada produto (Suporte do Antecedente)
    produtosUnicos.forEach(produto => {
      contagemItens[produto] = (contagemItens[produto] || 0) + 1;
    });

    // Contar a frequência das combinações de produtos em pares
    for (let i = 0; i < produtosUnicos.length; i++) {
      for (let j = i + 1; j < produtosUnicos.length; j++) {
        // Ordenar alfabeticamente para garantir que [A, B] e [B, A] geram a mesma chave
        const par = [produtosUnicos[i], produtosUnicos[j]].sort();
        const chavePar = `${par[0]}|||${par[1]}`;
        contagemPares[chavePar] = (contagemPares[chavePar] || 0) + 1;
      }
    }
  });

  // 2. Calcular a Regra de Associação mais forte (Confiança = N(A ∩ B) / N(A))
  let melhorRegra = null;
  let maiorConfianca = 0;

  for (const chavePar in contagemPares) {
    const ocorrenciaJuntos = contagemPares[chavePar];
    
    // Ignorar regras muito fracas baseadas em compras acidentais (ex: apareceram juntos apenas 1 vez)
    // Se tiver poucos pedidos no sistema, aceitamos; caso contrário, exigimos que o par apareça pelo menos 2 vezes
    if (ocorrenciaJuntos < 2 && totalPedidosValidos > 5) continue;

    const [produtoA, produtoB] = chavePar.split('|||');

    // Confiança se a pessoa compra A e depois B
    const confiancaA_B = ocorrenciaJuntos / contagemItens[produtoA];
    // Confiança se a pessoa compra B e depois A
    const confiancaB_A = ocorrenciaJuntos / contagemItens[produtoB];

    // Verificar qual das duas relações matemáticas tem a maior percentagem de acerto
    if (confiancaA_B > maiorConfianca) {
      maiorConfianca = confiancaA_B;
      melhorRegra = { antecedente: produtoA, consequente: produtoB, confianca: confiancaA_B };
    }
    if (confiancaB_A > maiorConfianca) {
      maiorConfianca = confiancaB_A;
      melhorRegra = { antecedente: produtoB, consequente: produtoA, confianca: confiancaB_A };
    }
  }

  // 3. Renderizar o resultado
  renderizarInsightMarketBasket(melhorRegra);
}

function renderizarInsightMarketBasket(regra) {
  const container = document.getElementById('insight-container');
  if (!container) return;

  // Critério: Se não encontrar padrões ou a confiança for muito baixa (ex: menor que 40%), não sugerir
  if (!regra || regra.confianca < 0.4) {
    container.innerHTML = `
      <div class="insight-card empty">
        <i class="bi bi-lightbulb" style="font-size: 24px;"></i>
        <p style="margin: 0;">A analisar os dados de compra... Registre mais pedidos para gerar insights comerciais automáticos.</p>
      </div>
    `;
    return;
  }

  const percentual = Math.round(regra.confianca * 100);

  container.innerHTML = `
    <div class="insight-card">
      <div class="insight-icon">
        <i class="bi bi-stars"></i>
      </div>
      <div class="insight-content">
        <h4 class="insight-title"><i class="bi bi-cpu"></i> Inteligência Artificial (Data Mining)</h4>
        <p class="insight-text">
          <strong>${percentual}%</strong> dos clientes que compram <strong>${regra.antecedente}</strong> também compram <strong>${regra.consequente}</strong>.
        </p>
        <p class="insight-suggestion">
          <i class="bi bi-arrow-right-circle-fill" style="color: var(--orange);"></i>
          <strong>Sugestão Estratégica:</strong> Crie um combo promocional entre estes produtos para alavancar o faturamento diário.
        </p>
      </div>
    </div>
  `;
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