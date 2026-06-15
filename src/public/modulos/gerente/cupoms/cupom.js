// Variável para guardar temporariamente qual ID será apagado
let cupomIdParaExcluir = null;

// Requisito: Evento na carga de objetos
document.addEventListener('DOMContentLoaded', () => {
  renderizarTabela();
});

function logout() {
  window.location.href = '../../../index.html';
}

/**
 * ═════════════════════════════════════════════════════════
 * OPERAÇÃO READ (Ler e Listar)
 * ═════════════════════════════════════════════════════════
 */
function obterCupons() {
  const dados = localStorage.getItem('cupons');
  return dados ? JSON.parse(dados) : [];
}

function renderizarTabela() {
  const cupons = obterCupons();
  const tbody = document.getElementById('tabela-cupons');
  
  tbody.innerHTML = '';

  if (cupons.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 32px;">
          <i class="bi bi-ticket" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
          Nenhum cupom cadastrado no sistema.
        </td>
      </tr>`;
    return;
  }

  cupons.forEach(cupom => {
    // Formata a data para padrão brasileiro
    let dataFormatada = '--';
    if(cupom.validade) {
      const dataParts = cupom.validade.split('-'); // O input type="date" devolve yyyy-mm-dd
      dataFormatada = `${dataParts[2]}/${dataParts[1]}/${dataParts[0]}`;
    }

    const badgeClass = cupom.status === 'Ativo' ? 'badge-ativo' : 'badge-inativo';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="codigo-cupom">${cupom.codigo}</span></td>
      <td style="font-weight: 600;">${cupom.desconto}%</td>
      <td style="color: var(--text-secondary);">${dataFormatada}</td>
      <td><span class="badge ${badgeClass}">${cupom.status}</span></td>
      <td>
        <div style="display: flex; gap: 8px;">
          <button class="btn-action" onclick="abrirModalCupom('${cupom.id}')" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn-action btn-action-danger" onclick="abrirModalExcluir('${cupom.id}')" title="Excluir">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * ═════════════════════════════════════════════════════════
 * OPERAÇÕES CREATE E UPDATE (Inclusão e Alteração)
 * ═════════════════════════════════════════════════════════
 */
function abrirModalCupom(id = null) {
  const form = document.getElementById('form-cupom');
  form.reset(); // Limpa o formulário

  if (id) {
    // UPDATE: O usuário clicou no botão de editar, então preenchemos os dados
    const cupom = obterCupons().find(c => c.id === id);
    if (cupom) {
      document.getElementById('cupom-id').value = cupom.id;
      document.getElementById('cupom-codigo').value = cupom.codigo;
      document.getElementById('cupom-desconto').value = cupom.desconto;
      document.getElementById('cupom-validade').value = cupom.validade;
      document.getElementById('cupom-status').value = cupom.status;
      
      document.getElementById('modal-titulo').innerText = 'Editar Cupom';
    }
  } else {
    // CREATE: É um cupom novo, ID fica vazio
    document.getElementById('cupom-id').value = '';
    document.getElementById('modal-titulo').innerText = 'Novo Cupom';
  }

  document.getElementById('modal-cupom').classList.add('show');
}

// Requisito: Evento de submissão de formulário (onsubmit)
function salvarCupom(event) {
  event.preventDefault(); // Impede a página de recarregar

  const id = document.getElementById('cupom-id').value;
  const codigo = document.getElementById('cupom-codigo').value.toUpperCase().trim();
  const desconto = parseInt(document.getElementById('cupom-desconto').value);
  const validade = document.getElementById('cupom-validade').value;
  const status = document.getElementById('cupom-status').value;

  let cupons = obterCupons();

  if (id) {
    // ALTERAÇÃO (UPDATE)
    const index = cupons.findIndex(c => c.id === id);
    if (index !== -1) {
      cupons[index] = { id, codigo, desconto, validade, status };
    }
  } else {
    // INCLUSÃO (CREATE)
    const novoCupom = {
      id: 'CUP-' + Date.now(), // Gera um ID único baseado na data
      codigo,
      desconto,
      validade,
      status
    };
    cupons.push(novoCupom);
  }

  // Salva no Repositório
  localStorage.setItem('cupons', JSON.stringify(cupons));
  
  fecharModal('modal-cupom');
  
  // Atualização dinâmica sem recarregar (F5)
  renderizarTabela(); 
}

/**
 * ═════════════════════════════════════════════════════════
 * OPERAÇÃO DELETE (Exclusão)
 * ═════════════════════════════════════════════════════════
 */
function abrirModalExcluir(id) {
  cupomIdParaExcluir = id;
  document.getElementById('modal-excluir').classList.add('show');
}

function confirmarExclusao() {
  if (!cupomIdParaExcluir) return;

  let cupons = obterCupons();
  
  // Filtra removendo o cupom com o ID selecionado
  cupons = cupons.filter(c => c.id !== cupomIdParaExcluir);

  // Salva a nova lista no localStorage
  localStorage.setItem('cupons', JSON.stringify(cupons));
  
  fecharModal('modal-excluir');
  cupomIdParaExcluir = null;
  
  // Atualiza a tela instantaneamente
  renderizarTabela();
}

/**
 * ═════════════════════════════════════════════════════════
 * FUNÇÕES AUXILIARES
 * ═════════════════════════════════════════════════════════
 */
function fecharModal(idModal) {
  document.getElementById(idModal).classList.remove('show');
}