const STORAGE_KEY = "flashlanches_orders";

function voltarParaShop() {
  window.location.href = '../cardapio/shop.html';
}

/* ═════════════════════════════════════════════════════
   MOCK DE PEDIDOS
═════════════════════════════════════════════════════ */

function criarPedidosMockados() {
  const pedidosMockados = [
    {
      id: "PED-1001",
      cliente: "Arthur Victor",
      data: "2026-05-24T14:20:00",
      status: "preparando",
      total: 58.80,
      itens: [
        {
          nome: "X-Burguer",
          quantidade: 2,
          preco: 18.90
        },
        {
          nome: "Batata Frita",
          quantidade: 1,
          preco: 12.00
        },
        {
          nome: "Coca-Cola",
          quantidade: 2,
          preco: 4.50
        }
      ]
    },

    {
      id: "PED-1002",
      cliente: "Arthur Victor",
      data: "2026-05-23T20:10:00",
      status: "pronto",
      total: 39.90,
      itens: [
        {
          nome: "X-Salada",
          quantidade: 1,
          preco: 21.90
        },
        {
          nome: "Suco Natural",
          quantidade: 2,
          preco: 9.00
        }
      ]
    }
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidosMockados));
}

function obterPedidos() {
  const pedidos = JSON.parse(localStorage.getItem(STORAGE_KEY));

  if (!pedidos || pedidos.length === 0) {
    criarPedidosMockados();
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  }

  return pedidos;
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

function formatarData(dataISO) {
  const data = new Date(dataISO);

  return data.toLocaleDateString("pt-BR") + " às " +
    data.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
}

function obterClasseStatus(status) {
  return `status-${status}`;
}

function obterTimeline(statusAtual) {
  const etapas = [
    "pendente",
    "confirmado",
    "preparando",
    "pronto",
    "retirado"
  ];

  const indiceAtual = etapas.indexOf(statusAtual);

  return etapas.map((etapa, index) => {
    const ativo = index <= indiceAtual;

    return `
      <div class="timeline-step">
        <div class="timeline-dot ${ativo ? "active" : ""}">
          <i class="bi bi-check"></i>
        </div>

        <div class="timeline-label ${ativo ? "active" : ""}">
          ${etapa}
        </div>
      </div>
    `;
  }).join("");
}

/* ═════════════════════════════════════════════════════
   RENDERIZAÇÃO
═════════════════════════════════════════════════════ */

function renderizarPedidos() {
  const pedidos = obterPedidos();

  const container = document.getElementById("orders-grid");

  if (pedidos.length === 0) {
    container.innerHTML = `
      <div class="orders-empty">
        <div class="orders-empty-icon">
          <i class="bi bi-inbox"></i>
        </div>

        <p style="color: var(--text-secondary); font-size: 16px;">
          Você ainda não fez nenhum pedido
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML = pedidos.map((pedido) => {
    return `
      <div class="order-card">

        <div class="order-header">

          <div>
            <div class="order-id">
              ${pedido.id}
            </div>

            <div class="order-date">
              ${formatarData(pedido.data)}
            </div>
          </div>

          <div class="status-badge ${obterClasseStatus(pedido.status)}">
            ${pedido.status}
          </div>

        </div>

        <div class="order-items">

          ${pedido.itens.map(item => `
            <div class="order-item">
              <div class="order-item-name">
                ${item.quantidade}x ${item.nome}
              </div>

              <div class="order-item-price">
                ${formatarPreco(item.preco * item.quantidade)}
              </div>
            </div>
          `).join("")}

        </div>

        <div class="order-footer">

          <div class="order-total">
            <span class="order-total-label">Total:</span>

            <span class="order-total-value">
              ${formatarPreco(pedido.total)}
            </span>
          </div>

        </div>

        <div class="timeline">
          ${obterTimeline(pedido.status)}
        </div>

      </div>
    `;
  }).join("");
}

renderizarPedidos();

