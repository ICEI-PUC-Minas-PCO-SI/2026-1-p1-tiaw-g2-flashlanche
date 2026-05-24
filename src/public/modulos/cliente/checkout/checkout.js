function irParaPedidos() {
window.location.href = '../pedidos/orders.html';
let horarios = JSON.parse(localStorage.getItem('horariosRetirada')) || [];
let horarioSelecionado = null;

function salvarHorarios() {
  localStorage.setItem('horariosRetirada', JSON.stringify(horarios));
}

function carregarHorariosPedido() {
  const grid = document.getElementById('horarios-grid');
  const btnConfirmar = document.getElementById('btn-confirm');

  if (!grid) return;

  grid.innerHTML = '';
  horarioSelecionado = null;
  btnConfirmar.disabled = true;

  const horariosDisponiveis = horarios.filter(h =>
    h.ativo === true && h.pedidos < h.capacidade
  );

  if (horariosDisponiveis.length === 0) {
    grid.innerHTML = '<p>Nenhum horário disponível no momento.</p>';
    return;
  }

  horariosDisponiveis.forEach(horario => {
    const botao = document.createElement('button');
    botao.className = 'horario-btn';
    botao.type = 'button';

    botao.innerHTML = `
      <strong>${horario.hora}</strong><br>
      <small>${horario.pedidos}/${horario.capacidade} pedidos</small>
    `;

    botao.onclick = () => selecionarHorario(horario.id, botao);

    grid.appendChild(botao);
  });
}

function selecionarHorario(idHorario, botaoClicado) {
  document.querySelectorAll('.horario-btn').forEach(btn => {
    btn.classList.remove('selected');
  });

  botaoClicado.classList.add('selected');
  horarioSelecionado = idHorario;

  document.getElementById('btn-confirm').disabled = false;
}

function confirmarPedido() {
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const telefone = document.getElementById('telefone').value.trim();

  if (!nome || !email || !telefone) {
    alert('Preencha nome, email e telefone.');
    return;
  }

  if (!horarioSelecionado) {
    alert('Selecione um horário de retirada.');
    return;
  }

  const horario = horarios.find(h => h.id == horarioSelecionado);

  if (!horario) {
    alert('Horário não encontrado.');
    return;
  }

  if (!horario.ativo) {
    alert('Esse horário está desativado.');
    carregarHorariosPedido();
    return;
  }

  if (horario.pedidos >= horario.capacidade) {
    alert('Esse horário está lotado.');
    carregarHorariosPedido();
    return;
  }

  horario.pedidos++;

  salvarHorarios();

  const codigoPedido = 'PED-' + Date.now();

  document.getElementById('pedido-id').textContent = codigoPedido;
  document.getElementById('modal-order-code').textContent = codigoPedido;

  const qrDiv = document.getElementById('qr-code-modal');
  qrDiv.innerHTML = '';

  new QRCode(qrDiv, {
    text: codigoPedido,
    width: 180,
    height: 180
  });

  document.getElementById('modal-success').classList.add('show');
}

function irParaPedidos() {
  window.location.href = '../pedidos/orders.html';
}

document.addEventListener('DOMContentLoaded', carregarHorariosPedido);
}
