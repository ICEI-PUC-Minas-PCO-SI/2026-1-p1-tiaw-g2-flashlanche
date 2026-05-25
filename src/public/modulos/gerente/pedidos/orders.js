const STORAGE_KEY = "flashlanches_orders";

const STATUS = [
  "pendente",
  "confirmado",
  "preparando",
  "pronto",
  "retirado",
  "cancelado"
];

let pedidoSelecionado = null;

function logout() {
  window.location.href = '../../../index.html';
}

/* ═════════════════════════════════════════════════════
   STORAGE
═════════════════════════════════════════════════════ */

function obterPedidos() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function salvarPedidos(pedidos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
}

/* ═════════════════════════════════════════════════════
   HELPERS
═════════════════════════════════════════════════════ */

function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function obterClasseStatus(status) {
  return `status-${status}`;
}

/* ═════════════════════════════════════════════════════
   RENDER
═════════════════════════════════════════════════════ */

function renderizarPedidos(lista = obterPedidos()) {
  const tbody = document.getElementById("orders-body");

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center;">
          Nenhum pedido encontrado
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = lista.map((pedido) => {
    return `
      <tr>

        <td>
          <strong>${pedido.id}</strong>
        </td>

        <td>
          ${pedido.cliente}
        </td>

        <td>
          ${pedido.itens.length} item(ns)
        </td>

        <td>
          ${formatarPreco(pedido.total)}
        </td>

        <td>
          <div class="status-badge ${obterClasseStatus(pedido.status)}">
            ${pedido.status}
          </div>
        </td>

        <td>
          <button
            class="btn-action"
            onclick="abrirModal('${pedido.id}')"
          >
            Detalhes
          </button>
        </td>

      </tr>
    `;
  }).join("");
}

/* ═════════════════════════════════════════════════════
   FILTRO
═════════════════════════════════════════════════════ */

function filtrarPedidos() {
  const status = document.getElementById("filter-status").value;

  const pedidos = obterPedidos();

  if (!status) {
    renderizarPedidos(pedidos);
    return;
  }

  const filtrados = pedidos.filter(p => p.status === status);

  renderizarPedidos(filtrados);
}

/* ═════════════════════════════════════════════════════
   MODAL
═════════════════════════════════════════════════════ */

function abrirModal(idPedido) {
  const pedidos = obterPedidos();

  pedidoSelecionado = pedidos.find(p => p.id === idPedido);

  if (!pedidoSelecionado) return;

  document.getElementById("modal-detalhes")
    .classList.add("show");

  document.getElementById("modal-id")
    .textContent = pedidoSelecionado.id;

  document.getElementById("modal-cliente")
    .textContent = pedidoSelecionado.cliente;

  document.getElementById("modal-itens")
    .innerHTML = pedidoSelecionado.itens.map(item => `
      <div class="item-list">
        ${item.quantidade}x ${item.nome}
        —
        ${formatarPreco(item.preco * item.quantidade)}
      </div>
    `).join("");

  const selectStatus = document.getElementById("modal-status");

  selectStatus.innerHTML = STATUS.map(status => `
    <option
      value="${status}"
      ${status === pedidoSelecionado.status ? "selected" : ""}
    >
      ${status}
    </option>
  `).join("");
}

function fecharModal() {
  document.getElementById("modal-detalhes")
    .classList.remove("show");
}

/* ═════════════════════════════════════════════════════
   ALTERAR STATUS
═════════════════════════════════════════════════════ */

function salvarAlteracao() {
  const novoStatus = document.getElementById("modal-status").value;

  const pedidos = obterPedidos();

  const pedidosAtualizados = pedidos.map(pedido => {
    if (pedido.id === pedidoSelecionado.id) {
      pedido.status = novoStatus;
    }

    return pedido;
  });

  salvarPedidos(pedidosAtualizados);

  fecharModal();

  filtrarPedidos();
}

/* ═════════════════════════════════════════════════════
   INIT
═════════════════════════════════════════════════════ */

renderizarPedidos();
