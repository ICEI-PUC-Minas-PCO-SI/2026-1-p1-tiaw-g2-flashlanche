function logout() {
  window.location.href = '../../../index.html';
}

let horarios = JSON.parse(localStorage.getItem('horariosRetirada')) || [];

function salvarNoStorage() {
  localStorage.setItem('horariosRetirada', JSON.stringify(horarios));
}

function abrirModal() {
  document.getElementById('modal-form').classList.add('show');
}

function fecharModal() {
  document.getElementById('modal-form').classList.remove('show');
  document.getElementById('hora').value = '';
  document.getElementById('capacidade').value = 5;
}

function salvarHorario() {
  const hora = document.getElementById('hora').value;
  const capacidade = Number(document.getElementById('capacidade').value);

  if (!hora || capacidade <= 0) {
    alert('Preencha o horário e a capacidade corretamente.');
    return;
  }

  const existe = horarios.some(h => h.hora === hora);

  if (existe) {
    alert('Esse horário já foi cadastrado.');
    return;
  }

  horarios.push({
    id: Date.now(),
    hora: hora,
    capacidade: capacidade,
    pedidos: 0,
    ativo: true
  });

  horarios.sort((a, b) => a.hora.localeCompare(b.hora));

  salvarNoStorage();
  renderizarHorarios();
  fecharModal();
}

function renderizarHorarios() {
  const grid = document.getElementById('timeslots-grid');

  if (!grid) return;

  grid.innerHTML = '';

  if (horarios.length === 0) {
    grid.innerHTML = '<p>Nenhum horário cadastrado.</p>';
    return;
  }

  horarios.forEach(horario => {
    const lotado = horario.pedidos >= horario.capacidade;

    const card = document.createElement('div');
    card.className = `timeslot-card ${lotado || !horario.ativo ? 'disabled' : ''}`;

    card.innerHTML = `
      <div class="timeslot-time">${horario.hora}</div>
      <div class="timeslot-status">
        ${horario.ativo ? 'Ativo' : 'Desativado'}
      </div>

      <div class="timeslot-badge ${lotado ? 'full' : ''}">
        ${horario.pedidos}/${horario.capacidade} pedidos
      </div>

      <div class="timeslot-actions">
        <button class="btn-icon" onclick="alternarHorario(${horario.id})">
          ${horario.ativo ? 'Desativar' : 'Ativar'}
        </button>

        <button class="btn-icon btn-icon-danger" onclick="excluirHorario(${horario.id})">
          Excluir
        </button>
      </div>
    `;

    grid.appendChild(card);
  });
}

function alternarHorario(id) {
  const horario = horarios.find(h => h.id === id);

  if (horario) {
    horario.ativo = !horario.ativo;
    salvarNoStorage();
    renderizarHorarios();
  }
}

function excluirHorario(id) {
  if (!confirm('Deseja excluir esse horário?')) return;

  horarios = horarios.filter(h => h.id !== id);
  salvarNoStorage();
  renderizarHorarios();
}

// Função para usar na tela de pedido
function carregarHorariosNoPedido(selectId) {
  const select = document.getElementById(selectId);

  if (!select) return;

  select.innerHTML = '<option value="">Selecione um horário</option>';

  const horariosDisponiveis = horarios.filter(h =>
    h.ativo && h.pedidos < h.capacidade
  );

  horariosDisponiveis.forEach(horario => {
    const option = document.createElement('option');
    option.value = horario.id;
    option.textContent = `${horario.hora} - ${horario.pedidos}/${horario.capacidade} pedidos`;
    select.appendChild(option);
  });
}

// Chamar quando o pedido for confirmado
function registrarPedidoNoHorario(idHorario) {
  const horario = horarios.find(h => h.id == idHorario);

  if (!horario) {
    alert('Horário não encontrado.');
    return false;
  }

  if (!horario.ativo) {
    alert('Esse horário está desativado.');
    return false;
  }

  if (horario.pedidos >= horario.capacidade) {
    alert('Esse horário está lotado.');
    return false;
  }

  horario.pedidos++;

  salvarNoStorage();
  renderizarHorarios();

  return true;
}

document.addEventListener('DOMContentLoaded', renderizarHorarios);
