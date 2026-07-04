/* ════════════════════════════════════════════════════════════
   ESTADO GLOBAL
════════════════════════════════════════════════════════════ */

let graficoInstancia = null;

/* ════════════════════════════════════════════════════════════
   NAVEGAÇÃO
════════════════════════════════════════════════════════════ */

const logout = () => { encerrarSessao(); window.location.href = '../../../index.html'; };

/* ════════════════════════════════════════════════════════════
   STORAGE
════════════════════════════════════════════════════════════ */

const storage = {
  get: (chave, fallback = null) => {
    try { const d = localStorage.getItem(chave); return d ? JSON.parse(d) : fallback; }
    catch { return fallback; }
  },
};

const obterPedidos = () => storage.get('pedidos', []);

/* ════════════════════════════════════════════════════════════
   INICIALIZAÇÃO
════════════════════════════════════════════════════════════ */

function configurarDatasIniciais() {
  const hoje          = new Date();
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(hoje.getDate() - 7);

  document.getElementById('data-inicio').value = seteDiasAtras.toISOString().split('T')[0];
  document.getElementById('data-fim').value    = hoje.toISOString().split('T')[0];
}

/* ════════════════════════════════════════════════════════════
   PROCESSAMENTO DE DADOS
════════════════════════════════════════════════════════════ */

function filtrarPedidosPorPeriodo(pedidos, dataInicio, dataFim) {
  return pedidos.filter((pedido) => {
    if (!pedido.dataCriacao || pedido.status === 'Cancelado') return false;
    const dataPedido = new Date(pedido.dataCriacao);
    return dataPedido >= dataInicio && dataPedido <= dataFim;
  });
}

function agruparDados(pedidosFiltrados) {
  const faturamentoPorDia = {};
  const rankingProdutos   = {};
  let receitaTotal        = 0;

  pedidosFiltrados.forEach((pedido) => {
    receitaTotal += pedido.total;

    const dia = new Date(pedido.dataCriacao).toLocaleDateString('pt-PT');
    faturamentoPorDia[dia] = (faturamentoPorDia[dia] || 0) + pedido.total;

    if (!Array.isArray(pedido.itens)) return;

    pedido.itens.forEach((item) => {
      const atual = rankingProdutos[item.nome] || { quantidade: 0, receitaGerada: 0 };
      atual.quantidade    += item.quantidade;
      atual.receitaGerada += item.preco * item.quantidade;
      rankingProdutos[item.nome] = atual;
    });
  });

  return { receitaTotal, faturamentoPorDia, rankingProdutos };
}

function atualizarMetricas(receitaTotal, totalPedidos) {
  const ticketMedio = totalPedidos > 0 ? receitaTotal / totalPedidos : 0;

  document.getElementById('metrica-receita').textContent = `R$ ${receitaTotal.toFixed(2)}`;
  document.getElementById('metrica-pedidos').textContent = totalPedidos;
  document.getElementById('metrica-ticket').textContent  = `R$ ${ticketMedio.toFixed(2)}`;
}

function gerarRelatorio() {
  const dataInicioStr = document.getElementById('data-inicio').value;
  const dataFimStr    = document.getElementById('data-fim').value;

  if (!dataInicioStr || !dataFimStr) {
    alert('Por favor, selecione as datas de início e fim.');
    return;
  }

  const dataInicio = new Date(`${dataInicioStr}T00:00:00`);
  const dataFim    = new Date(`${dataFimStr}T23:59:59`);

  const pedidosFiltrados = filtrarPedidosPorPeriodo(obterPedidos(), dataInicio, dataFim);
  const { receitaTotal, faturamentoPorDia, rankingProdutos } = agruparDados(pedidosFiltrados);

  atualizarMetricas(receitaTotal, pedidosFiltrados.length);
  desenharGraficoLinha(faturamentoPorDia);
  desenharTabelaRanking(rankingProdutos);
  executarMarketBasketAnalysis(pedidosFiltrados);
  executarAnaliseCurvaABC(rankingProdutos);
}

/* ════════════════════════════════════════════════════════════
   RENDERIZAÇÃO — GRÁFICO
════════════════════════════════════════════════════════════ */

function ordenarDiasCronologicamente(dias) {
  return [...dias].sort((a, b) => {
    const dataA = a.split('/').reverse().join('-');
    const dataB = b.split('/').reverse().join('-');
    return new Date(dataA) - new Date(dataB);
  });
}

function desenharGraficoLinha(dadosPorDia) {
  const ctx = document.getElementById('graficoReceita').getContext('2d');

  graficoInstancia?.destroy();

  const labels = ordenarDiasCronologicamente(Object.keys(dadosPorDia));
  const valores = labels.map((dia) => dadosPorDia[dia]);

  graficoInstancia = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Receita Diária (R$)',
        data: valores,
        borderColor: '#ff6b2c',
        backgroundColor: 'rgba(255, 107, 44, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#ff6b2c',
        pointRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#eef1f5' } },
        x: { grid: { display: false } },
      },
    },
  });
}

/* ════════════════════════════════════════════════════════════
   RENDERIZAÇÃO — TABELA DE RANKING
════════════════════════════════════════════════════════════ */

function criarLinhaRanking(produto) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="cell-product-name">${produto.nome}</td>
    <td class="cell-qty">${produto.quantidade}</td>
    <td class="cell-revenue">R$ ${produto.receita.toFixed(2)}</td>
  `;
  return tr;
}

function desenharTabelaRanking(dadosProdutos) {
  const tbody = document.getElementById('tabela-produtos');
  tbody.innerHTML = '';

  const arrayProdutos = Object.entries(dadosProdutos)
    .map(([nome, dados]) => ({ nome, quantidade: dados.quantidade, receita: dados.receitaGerada }))
    .sort((a, b) => b.quantidade - a.quantidade);

  if (arrayProdutos.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="3" class="cell-empty">Nenhuma venda registada neste período.</td></tr>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();
  arrayProdutos.forEach((produto) => fragment.appendChild(criarLinhaRanking(produto)));
  tbody.appendChild(fragment);
}

/* ════════════════════════════════════════════════════════════
   DATA MINING — MARKET BASKET ANALYSIS (APRIORI)
════════════════════════════════════════════════════════════ */

function coletarContagens(pedidos) {
  const contagemItens = {};
  const contagemPares = {};
  let totalPedidosValidos = 0;

  pedidos.forEach((pedido) => {
    if (!Array.isArray(pedido.itens) || pedido.itens.length === 0) return;

    totalPedidosValidos++;

    const produtosUnicos = [...new Set(pedido.itens.map((item) => item.nome))];

    produtosUnicos.forEach((produto) => {
      contagemItens[produto] = (contagemItens[produto] || 0) + 1;
    });

    for (let i = 0; i < produtosUnicos.length; i++) {
      for (let j = i + 1; j < produtosUnicos.length; j++) {
        const [a, b] = [produtosUnicos[i], produtosUnicos[j]].sort();
        const chave = `${a}|||${b}`;
        contagemPares[chave] = (contagemPares[chave] || 0) + 1;
      }
    }
  });

  return { contagemItens, contagemPares, totalPedidosValidos };
}

function encontrarMelhorRegra(contagemItens, contagemPares, totalPedidosValidos) {
  let melhorRegra    = null;
  let maiorConfianca = 0;

  for (const [chave, ocorrenciaJuntos] of Object.entries(contagemPares)) {
    // Ignora pares com pouca recorrência quando já há volume suficiente de pedidos
    if (ocorrenciaJuntos < 2 && totalPedidosValidos > 5) continue;

    const [produtoA, produtoB] = chave.split('|||');
    const confiancaA_B = ocorrenciaJuntos / contagemItens[produtoA];
    const confiancaB_A = ocorrenciaJuntos / contagemItens[produtoB];

    if (confiancaA_B > maiorConfianca) {
      maiorConfianca = confiancaA_B;
      melhorRegra = { antecedente: produtoA, consequente: produtoB, confianca: confiancaA_B };
    }
    if (confiancaB_A > maiorConfianca) {
      maiorConfianca = confiancaB_A;
      melhorRegra = { antecedente: produtoB, consequente: produtoA, confianca: confiancaB_A };
    }
  }

  return melhorRegra;
}

function executarMarketBasketAnalysis(pedidos) {
  const { contagemItens, contagemPares, totalPedidosValidos } = coletarContagens(pedidos);
  const melhorRegra = encontrarMelhorRegra(contagemItens, contagemPares, totalPedidosValidos);
  renderizarInsightMarketBasket(melhorRegra);
}

function renderizarInsightMarketBasket(regra) {
  const container = document.getElementById('insight-container');
  if (!container) return;

  if (!regra || regra.confianca < 0.4) {
    container.innerHTML = `
      <div class="insight-card empty">
        <i class="bi bi-lightbulb insight-empty-icon" aria-hidden="true"></i>
        <p class="insight-empty-text">A analisar os dados de compra... Registre mais pedidos para gerar insights comerciais automáticos.</p>
      </div>
    `;
    return;
  }

  const percentual = Math.round(regra.confianca * 100);

  container.innerHTML = `
    <div class="insight-card">
      <div class="insight-icon">
        <i class="bi bi-stars" aria-hidden="true"></i>
      </div>
      <div class="insight-content">
        <h4 class="insight-title"><i class="bi bi-cpu" aria-hidden="true"></i> Análise de Cesta de Compras</h4>
        <p class="insight-text">
          <strong>${percentual}%</strong> dos clientes que compram <strong>${regra.antecedente}</strong> também compram <strong>${regra.consequente}</strong>.
        </p>
        <p class="insight-suggestion">
          <i class="bi bi-arrow-right-circle-fill insight-suggestion-icon" aria-hidden="true"></i>
          <strong>Sugestão Estratégica:</strong> Crie um combo promocional entre estes produtos para alavancar o faturamento diário.
        </p>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════════════════
   ANÁLISE DE PORTFÓLIO — CURVA ABC (PRINCÍPIO DE PARETO)
════════════════════════════════════════════════════════════ */

function prepararDadosParaCurvaABC(rankingProdutos) {
  const produtosOrdenados = Object.entries(rankingProdutos)
    .map(([nome, dados]) => ({ nome, receita: dados.receitaGerada }))
    .sort((a, b) => b.receita - a.receita);

  const receitaTotalProdutos = produtosOrdenados.reduce((acc, p) => acc + p.receita, 0);

  return { produtosOrdenados, receitaTotalProdutos };
}

function aplicarCorteParetoABC(produtosOrdenados, receitaTotalProdutos) {
  let acumulador = 0;

  return produtosOrdenados.map((produto) => {
    acumulador += produto.receita;
    const percentualAcumulado  = acumulador / receitaTotalProdutos;
    const percentualIndividual = produto.receita / receitaTotalProdutos;

    let classe;
    if (percentualAcumulado <= 0.80) {
      classe = 'A';
    } else if (percentualAcumulado <= 0.95) {
      classe = 'B';
    } else {
      classe = 'C';
    }

    return {
      nome: produto.nome,
      receita: produto.receita,
      percentualIndividual,
      percentualAcumulado,
      classe,
    };
  });
}

function agruparPorClasseABC(produtosClassificados) {
  const grupos = { classeA: [], classeB: [], classeC: [] };

  produtosClassificados.forEach((produto) => {
    if (produto.classe === 'A') grupos.classeA.push(produto);
    else if (produto.classe === 'B') grupos.classeB.push(produto);
    else grupos.classeC.push(produto);
  });

  return grupos;
}

function classificarProdutosABC(rankingProdutos) {
  const { produtosOrdenados, receitaTotalProdutos } = prepararDadosParaCurvaABC(rankingProdutos);

  if (receitaTotalProdutos === 0 || produtosOrdenados.length === 0) {
    return { semDados: true, classeA: [], classeB: [], classeC: [], receitaTotalProdutos: 0 };
  }

  const produtosClassificados = aplicarCorteParetoABC(produtosOrdenados, receitaTotalProdutos);
  const { classeA, classeB, classeC } = agruparPorClasseABC(produtosClassificados);

  return { semDados: false, classeA, classeB, classeC, receitaTotalProdutos };
}

function formatarListaProdutosABC(produtos, limite = 3) {
  const nomes = produtos.map((p) => p.nome);
  if (nomes.length <= limite) return nomes.join(', ');

  const visiveis  = nomes.slice(0, limite);
  const restantes = nomes.length - limite;
  return `${visiveis.join(', ')} e mais ${restantes} item${restantes > 1 ? 's' : ''}`;
}

function renderizarCurvaABC(resultado) {
  const container = document.getElementById('abc-curve-container');
  if (!container) return;

  if (resultado.semDados) {
    container.innerHTML = `
      <div class="abc-card abc-card--empty">
        <i class="bi bi-pie-chart-fill abc-empty-icon" aria-hidden="true"></i>
        <p class="abc-empty-text">Aguardando Dados — registe vendas no período selecionado para gerar o diagnóstico de portfólio (Curva ABC).</p>
      </div>
    `;
    return;
  }

  const { classeA, classeB, classeC, receitaTotalProdutos } = resultado;

  const receitaClasseA    = classeA.reduce((acc, p) => acc + p.receita, 0);
  const percentualClasseA = receitaTotalProdutos > 0 ? (receitaClasseA / receitaTotalProdutos) * 100 : 0;
  const nomesClasseA      = formatarListaProdutosABC(classeA);

  let blocoEstoque = '';
  if (classeA.length > 0) {
    blocoEstoque = `
      <p class="abc-directive abc-directive--warning">
        <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
        <span><strong>Recomendação de Estoque:</strong> Monitore de perto os insumos de <strong>${nomesClasseA}</strong>. A falta crônica de qualquer um destes itens gerará impacto severo e imediato no seu caixa.</span>
      </p>
    `;
  }

  let blocoOtimizacao = '';
  if (classeC.length > 0) {
    const produtoMenosRelevante = classeC[classeC.length - 1];
    blocoOtimizacao = `
      <p class="abc-directive abc-directive--tip">
        <i class="bi bi-lightbulb-fill" aria-hidden="true"></i>
        <span><strong>Dica de Performance:</strong> O produto <strong>${produtoMenosRelevante.nome}</strong> foi classificado como <span class="abc-badge abc-badge--c">Classe C</span> (baixa relevância financeira). Avalie criar promoções integradas ou revisar sua permanência no menu universitário.</span>
      </p>
    `;
  }

  container.innerHTML = `
    <div class="abc-card">
      <div class="abc-icon"><i class="bi bi-pie-chart-fill" aria-hidden="true"></i></div>
      <div class="abc-content">
        <h4 class="abc-title"><i class="bi bi-award" aria-hidden="true"></i> Análise de Portfólio &amp; Curva ABC (Pareto)</h4>
        <p class="abc-text">
          Seu faturamento é altamente dependente de <strong>${classeA.length}</strong> produto${classeA.length !== 1 ? 's' : ''} prioritário${classeA.length !== 1 ? 's' : ''}
          (Classe A): <strong>${nomesClasseA}</strong>. Juntos, eles geram <strong>${percentualClasseA.toFixed(1)}%</strong> do seu retorno financeiro no período.
        </p>
        <div class="abc-summary">
          <span class="abc-badge abc-badge--a"><i class="bi bi-check-circle-fill" aria-hidden="true"></i> Classe A: ${classeA.length}</span>
          <span class="abc-badge abc-badge--b"><i class="bi bi-dash-circle-fill" aria-hidden="true"></i> Classe B: ${classeB.length}</span>
          <span class="abc-badge abc-badge--c"><i class="bi bi-exclamation-circle-fill" aria-hidden="true"></i> Classe C: ${classeC.length}</span>
        </div>
        ${blocoEstoque}
        ${blocoOtimizacao}
      </div>
    </div>
  `;
}

function executarAnaliseCurvaABC(rankingProdutos) {
  const resultado = classificarProdutosABC(rankingProdutos);
  renderizarCurvaABC(resultado);
}

/* ════════════════════════════════════════════════════════════
   ACESSIBILIDADE — TEXT-TO-SPEECH
════════════════════════════════════════════════════════════ */

const tts = {
  utterance: null,
  paused:    false,

  get synth() { return window.speechSynthesis; },

  prepararTexto() {
    const alvo = document.querySelector('main') || document.body;
    return (alvo.innerText || alvo.textContent).replace(/\n+/g, '. ').trim();
  },

  resetarUI() {
    const btnPlay = document.getElementById('tts-play-pause');
    const btnStop = document.getElementById('tts-stop');
    btnPlay.querySelector('i').className = 'bi bi-play-circle-fill';
    btnPlay.setAttribute('aria-label', 'Iniciar narração da página');
    btnStop.disabled = true;
    this.paused = false;
  },

  iniciar() {
    const texto = this.prepararTexto();
    if (!texto) { alert('Não foi possível encontrar conteúdo legível.'); return; }

    this.utterance         = new SpeechSynthesisUtterance(texto);
    this.utterance.lang    = 'pt-BR';
    this.utterance.rate    = 1.5;
    this.utterance.onend   = () => this.resetarUI();
    this.utterance.onerror = (e) => { console.error('Erro TTS:', e); this.resetarUI(); };

    this.synth.speak(this.utterance);

    const btnPlay = document.getElementById('tts-play-pause');
    const btnStop = document.getElementById('tts-stop');
    btnPlay.querySelector('i').className = 'bi bi-pause-circle-fill';
    btnPlay.setAttribute('aria-label', 'Pausar narração');
    btnStop.disabled = false;
    this.paused = false;
  },
};

function toggleLeitura() {
  if (tts.paused) {
    tts.synth.resume(); tts.paused = false;
    const btn = document.getElementById('tts-play-pause');
    btn.querySelector('i').className = 'bi bi-pause-circle-fill';
    btn.setAttribute('aria-label', 'Pausar narração');
    return;
  }
  if (tts.synth.speaking) {
    tts.synth.pause(); tts.paused = true;
    const btn = document.getElementById('tts-play-pause');
    btn.querySelector('i').className = 'bi bi-play-circle-fill';
    btn.setAttribute('aria-label', 'Continuar narração');
    return;
  }
  tts.iniciar();
}

function pararLeitura() {
  if (tts.synth.speaking || tts.paused) { tts.synth.cancel(); tts.resetarUI(); }
}

window.addEventListener('beforeunload', () => tts.synth.cancel());

/* ════════════════════════════════════════════════════════════
   INICIALIZAÇÃO
════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  configurarDatasIniciais();
  gerarRelatorio();
});