var filtroStatusAtivo = 'todos';

/* ========================= STORAGE ========================= */

function obterEstoque() {
  var dados = localStorage.getItem('flashlanche_estoque');
  return dados ? JSON.parse(dados) : [];
}

function salvarEstoque(lista) {
  localStorage.setItem('flashlanche_estoque', JSON.stringify(lista));
}

/* ========================= STATUS ========================= */

function calcularStatus(quantidade) {
  if (quantidade <= 0)  return 'esgotado';
  if (quantidade <= 4)  return 'baixo';
  return 'disponivel';
}

/* ========================= DADOS INICIAIS ========================= */

async function inicializarDados() {
  const estoque = obterEstoque();

  if (estoque.length > 0) {
    sincronizarComProdutos(estoque);
    return;
  }

  try {
    const response = await fetch('./db-stock.json');

    if (!response.ok) {
      throw new Error('Erro ao carregar arquivo JSON');
    }

    const dados = await response.json();

    const produtos = dados["db-stock"] || [];

    produtos.forEach(item => {
      item.status = calcularStatus(item.quantidade);
    });

    semeadProdutosSeVazio(produtos);
    salvarEstoque(produtos);

    renderizarTabela();
    atualizarResumoCards();
    popularSelectProdutos();

  } catch (erro) {
    console.error('Erro ao carregar estoque:', erro);

    exibirToast(
      'Não foi possível carregar o estoque.',
      'error'
    );
  }
}

/* ========================= POPULAR LOCALSTORAGE ========================= */

function semeadProdutosSeVazio(estoqueData) {
  var produtosExistentes = localStorage.getItem('produtos');
  if (produtosExistentes && JSON.parse(produtosExistentes).length > 0) return;

  var produtos = [];
  for (var i = 0; i < estoqueData.length; i++) {
    var e = estoqueData[i];
    produtos.push({
      id:        e.id,
      nome:      e.nome,
      categoria: e.categoria,
      descricao: e.descricao,
      preco:     e.preco,
      imagem:    e.imagem
    });
  }
  localStorage.setItem('produtos', JSON.stringify(produtos));
}

/* ========================= SINCRONIZAR ESTOQUE ========================= */

function sincronizarComProdutos(estoqueAtual) {
  var dadosProdutos = localStorage.getItem('produtos');
  if (!dadosProdutos) {
    renderizarTabela();
    atualizarResumoCards();
    popularSelectProdutos();
    return;
  }

  var produtos = JSON.parse(dadosProdutos);
  var estoqueMap = {};
  for (var i = 0; i < estoqueAtual.length; i++) {
    estoqueMap[estoqueAtual[i].id] = estoqueAtual[i];
  }

  var estoqueAtualizado = [];
  for (var j = 0; j < produtos.length; j++) {
    var p = produtos[j];
    if (estoqueMap[p.id]) {
      var item = estoqueMap[p.id];
      item.nome      = p.nome;
      item.categoria = p.categoria;
      item.descricao = p.descricao;
      item.imagem    = p.imagem;
      item.preco     = p.preco;
      estoqueAtualizado.push(item);
    } else {
      estoqueAtualizado.push({
        id:          p.id,
        nome:        p.nome,
        categoria:   p.categoria,
        descricao:   p.descricao,
        preco:       p.preco,
        imagem:      p.imagem,
        quantidade:  0,
        fornecedor:  '',
        dataEntrada: '',
        status:      'esgotado'
      });
    }
  }

  salvarEstoque(estoqueAtualizado);
  renderizarTabela();
  atualizarResumoCards();
  popularSelectProdutos();
}

/* ========================= RENDER ========================= */

function renderizarTabela() {
  var tbody = document.getElementById('stock-body');
  var lista = obterEstoque();
  var busca = document.getElementById('search-input').value.toLowerCase().trim();
  var ordenacao = document.getElementById('sort-select').value;

  var filtrado = lista.filter(function(item) {
    if (filtroStatusAtivo === 'todos') return true;
    return item.status === filtroStatusAtivo;
  });

  if (busca !== '') {
    filtrado = filtrado.filter(function(item) {
      return item.nome.toLowerCase().indexOf(busca) !== -1 ||
             item.categoria.toLowerCase().indexOf(busca) !== -1;
    });
  }

  filtrado.sort(function(a, b) {
    if (ordenacao === 'nome')            return a.nome.localeCompare(b.nome);
    if (ordenacao === 'quantidade-asc')  return a.quantidade - b.quantidade;
    if (ordenacao === 'quantidade-desc') return b.quantidade - a.quantidade;
    if (ordenacao === 'categoria')       return a.categoria.localeCompare(b.categoria);
    return 0;
  });

  tbody.innerHTML = '';

  if (filtrado.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-row">' +
        '<td colspan="5">' +
          '<i class="bi bi-search"></i> Nenhum produto encontrado.' +
        '</td>' +
      '</tr>';
    return;
  }

  for (var i = 0; i < filtrado.length; i++) {
    var item = filtrado[i];
    tbody.appendChild(criarLinhaTabela(item));
  }
}

function criarLinhaTabela(item) {
  var tr = document.createElement('tr');
  tr.classList.add('row-' + item.status);

  var catClass = 'badge-cat-outros';
  if (item.categoria === 'lanches') catClass = 'badge-cat-lanches';
  else if (item.categoria === 'bebidas') catClass = 'badge-cat-bebidas';
  else if (item.categoria === 'doces')   catClass = 'badge-cat-doces';

  var qtyClass = 'qty-ok';
  if (item.quantidade <= 0) qtyClass = 'qty-zero';
  else if (item.quantidade <= 4) qtyClass = 'qty-low';

  var statusInfo = obterInfoStatus(item.status);

  tr.innerHTML =
    '<td>' +
      '<div class="produto-cell">' +
        '<div class="produto-emoji">' + (item.imagem || '🍽️') + '</div>' +
        '<div>' +
          '<div class="produto-nome">' + item.nome + '</div>' +
          '<div class="produto-desc">' + item.descricao + '</div>' +
        '</div>' +
      '</div>' +
    '</td>' +
    '<td><span class="badge-cat ' + catClass + '">' + item.categoria + '</span></td>' +
    '<td>' +
      '<div class="qty-controls">' +
        '<button class="qty-btn-sm" title="Diminuir" onclick="alterarQuantidadeRapido(\'' + item.id + '\', -1)">' +
          '<i class="bi bi-dash"></i>' +
        '</button>' +
        '<span class="qty-display ' + qtyClass + '">' + item.quantidade + '</span>' +
        '<button class="qty-btn-sm" title="Aumentar" onclick="alterarQuantidadeRapido(\'' + item.id + '\', 1)">' +
          '<i class="bi bi-plus"></i>' +
        '</button>' +
      '</div>' +
    '</td>' +
    '<td>' +
      '<span class="badge-status badge-status-' + item.status + '">' +
        statusInfo.icone + ' ' + statusInfo.texto +
      '</span>' +
    '</td>' +
    '<td>' +
      '<div class="acoes-cell">' +
        '<button class="btn-acao" title="Editar quantidade" onclick="abrirModalEditar(\'' + item.id + '\')">' +
          '<i class="bi bi-pencil"></i> Editar' +
        '</button>' +
        '<button class="btn-acao btn-acao-danger" title="Zerar estoque" onclick="abrirModalExcluir(\'' + item.id + '\')">' +
          '<i class="bi bi-trash3"></i>' +
        '</button>' +
      '</div>' +
    '</td>';

  return tr;
}

function obterInfoStatus(status) {
  if (status === 'esgotado') return { icone: '✕', texto: 'Esgotado' };
  if (status === 'baixo')    return { icone: '⚠', texto: 'Estoque Baixo' };
  return { icone: '✓', texto: 'Disponível' };
}

/* ========================= CARD RESUMO ========================= */

function atualizarResumoCards() {
  var lista = obterEstoque();
  var ok  = lista.filter(function(i) { return i.status === 'disponivel'; }).length;
  var low = lista.filter(function(i) { return i.status === 'baixo'; }).length;
  var out = lista.filter(function(i) { return i.status === 'esgotado'; }).length;

  document.getElementById('count-ok').textContent    = ok;
  document.getElementById('count-low').textContent   = low;
  document.getElementById('count-out').textContent   = out;
  document.getElementById('count-total').textContent = lista.length;
}

/* ========================= SOMAR/SUBTRAIR QUANTIDADE ========================= */

function alterarQuantidadeRapido(id, delta) {
  var lista = obterEstoque();
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].id === id) {
      var novaQtd = lista[i].quantidade + delta;
      if (novaQtd < 0) novaQtd = 0;
      lista[i].quantidade = novaQtd;
      lista[i].status = calcularStatus(novaQtd);
      break;
    }
  }
  salvarEstoque(lista);
  renderizarTabela();
  atualizarResumoCards();
  exibirToast('Quantidade atualizada!', 'success');
}

/* ========================= MODAL ADICIONAR ========================= */

function popularSelectProdutos() {
  var select = document.getElementById('add-produto-id');
  var lista = obterEstoque();
  select.innerHTML = '<option value="">Selecione um produto…</option>';
  for (var i = 0; i < lista.length; i++) {
    var opt = document.createElement('option');
    opt.value = lista[i].id;
    opt.textContent = lista[i].imagem + ' ' + lista[i].nome + ' (atual: ' + lista[i].quantidade + ')';
    select.appendChild(opt);
  }
}

function abrirModalAdicionar() {
  document.getElementById('add-quantidade').value = 1;
  popularSelectProdutos();
  abrirModal('modal-adicionar');
}

function salvarAdicao() {
  var id = document.getElementById('add-produto-id').value;
  var qtd = parseInt(document.getElementById('add-quantidade').value);

  if (!id) {
    exibirToast('Selecione um produto.', 'error');
    return;
  }
  if (isNaN(qtd) || qtd < 1) {
    exibirToast('Informe uma quantidade válida.', 'error');
    return;
  }

  var lista = obterEstoque();
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].id === id) {
      lista[i].quantidade += qtd;
      lista[i].status = calcularStatus(lista[i].quantidade);
      break;
    }
  }

  salvarEstoque(lista);
  fecharModal('modal-adicionar');
  renderizarTabela();
  atualizarResumoCards();
  exibirToast('Estoque adicionado com sucesso!', 'success');
}

/* ========================= MODAL EDITAR ========================= */

function abrirModalEditar(id) {
  var lista = obterEstoque();
  var item = null;
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].id === id) { item = lista[i]; break; }
  }
  if (!item) return;

  document.getElementById('edit-produto-id').value    = id;
  document.getElementById('edit-quantidade').value     = item.quantidade;
  document.getElementById('edit-fornecedor').value     = item.fornecedor   || '';
  document.getElementById('edit-data-entrada').value   = item.dataEntrada  || '';

  document.getElementById('edit-produto-info').innerHTML =
    '<div class="edit-produto-emoji">' + (item.imagem || '🍽️') + '</div>' +
    '<div>' +
      '<div class="edit-produto-nome">' + item.nome + '</div>' +
      '<div class="edit-produto-atual">Quantidade atual: <strong>' + item.quantidade + '</strong></div>' +
    '</div>';

  abrirModal('modal-editar');
}

function salvarEdicao() {
  var id         = document.getElementById('edit-produto-id').value;
  var qtd        = parseInt(document.getElementById('edit-quantidade').value);
  var fornecedor = document.getElementById('edit-fornecedor').value.trim();
  var dataEntrada = document.getElementById('edit-data-entrada').value;

  if (isNaN(qtd) || qtd < 0) {
    exibirToast('Informe uma quantidade válida (mínimo 0).', 'error');
    return;
  }

  var lista = obterEstoque();
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].id === id) {
      lista[i].quantidade  = qtd;
      lista[i].status      = calcularStatus(qtd);
      lista[i].fornecedor  = fornecedor;
      lista[i].dataEntrada = dataEntrada;
      break;
    }
  }

  salvarEstoque(lista);
  fecharModal('modal-editar');
  renderizarTabela();
  atualizarResumoCards();
  exibirToast('Quantidade atualizada!', 'success');
}

/* ========================= MODAL EXCLUIR ========================= */

function abrirModalExcluir(id) {
  var lista = obterEstoque();
  var item = null;
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].id === id) { item = lista[i]; break; }
  }
  if (!item) return;

  document.getElementById('excluir-produto-id').value    = id;
  document.getElementById('excluir-produto-nome').textContent = item.nome;
  abrirModal('modal-excluir');
}

function confirmarExclusao() {
  var id = document.getElementById('excluir-produto-id').value;
  var lista = obterEstoque();

  for (var i = 0; i < lista.length; i++) {
    if (lista[i].id === id) {
      lista[i].quantidade = 0;
      lista[i].status = 'esgotado';
      break;
    }
  }

  salvarEstoque(lista);
  fecharModal('modal-excluir');
  renderizarTabela();
  atualizarResumoCards();
  exibirToast('Estoque zerado.', 'warning');
}

/* ========================= FILTROS E BUSCA ========================= */

function filtrarStatus(btn) {
  filtroStatusAtivo = btn.getAttribute('data-filter');

  var botoes = document.querySelectorAll('.filter-btn');
  for (var i = 0; i < botoes.length; i++) {
    botoes[i].classList.remove('active');
  }
  btn.classList.add('active');

  renderizarTabela();
}

function aplicarFiltros() {
  renderizarTabela();
}

/* ========================= CONTROLE DE QUANTIDADE ========================= */

function alterarQtdInput(inputId, delta) {
  var input = document.getElementById(inputId);
  var min = parseInt(input.min) || 0;
  var val = parseInt(input.value) || 0;
  val = val + delta;
  if (val < min) val = min;
  input.value = val;
}

/* ========================= ITENS MODAL ========================= */

function abrirModal(id) {
  document.getElementById(id).classList.add('show');
}

function fecharModal(id) {
  document.getElementById(id).classList.remove('show');
}

function fecharModalSeClicouFora(event, id) {
  if (event.target.id === id) {
    fecharModal(id);
  }
}

/* ========================= AVISOS ========================= */

var toastTimer = null;

function exibirToast(mensagem, tipo) {
  var toast = document.getElementById('toast');
  toast.textContent = mensagem;
  toast.className = 'toast-msg show ' + (tipo || '');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    toast.classList.remove('show');
  }, 2800);
}

/* ========================= LOGOUT ========================= */

function logout() {
  window.location.href = '../../../index.html';
}

/* ========================= FECHAR MODAL COM ESC ========================= */

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    fecharModal('modal-adicionar');
    fecharModal('modal-editar');
    fecharModal('modal-excluir');
  }
});

/* ========================= INICIALIZACAO DA PAGINA ========================= */

window.onload = function() {
  inicializarDados();
};