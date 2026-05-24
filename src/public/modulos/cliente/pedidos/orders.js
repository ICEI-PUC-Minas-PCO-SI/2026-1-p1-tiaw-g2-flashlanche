document.addEventListener('DOMContentLoaded', () => {
    const inputNome = document.getElementById('nome');
    const inputEmail = document.getElementById('email');
    const inputTelefone = document.getElementById('telefone');
    const formCheckout = document.getElementById('form-checkout');

    const resumoContainer = document.getElementById('resumo-carrinho-container');
    const orderNumberValue = document.querySelector('.checkout-number-value');

    // 1. CARREGAR ITENS DO CARRINHO
    const itensCarrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    
    if (resumoContainer && itensCarrinho.length > 0) {
        resumoContainer.innerHTML = itensCarrinho.map(item => `
            <div class="d-flex justify-content-between align-items-center w-100 mb-1" style="font-size: 15px;">
                <span style="color: var(--text-secondary);">${item.quantidade}x ${item.nome}</span>
                <span style="font-weight: 600; color: var(--text-primary);">R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
            </div>
        `).join('');
    }

    // 2. GERAR NÚMERO DO PEDIDO
    let numeroPedido = localStorage.getItem('flashlanche_ultimo_numero');
    if (!numeroPedido) {
        numeroPedido = '#' + Math.floor(1000 + Math.random() * 9000);
        localStorage.setItem('flashlanche_ultimo_numero', numeroPedido);
    }
    if (orderNumberValue) {
        orderNumberValue.textContent = numeroPedido;
    }

    // 3. MÁSCARA DE TELEFONE
    if (inputTelefone) {
        inputTelefone.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            if (value.length > 6) { e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`; }
            else if (value.length > 2) { e.target.value = `(${value.slice(0, 2)}) ${value.slice(2)}`; }
            else if (value.length > 0) { e.target.value = `(${value}`; }
            else { e.target.value = ''; }
        });
    }

    // 4. ENVIO DO FORMULÁRIO E SALVAMENTO NO LOCALSTORAGE
    if (formCheckout) {
        formCheckout.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const emailValue = inputEmail ? inputEmail.value.trim() : '';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (!emailRegex.test(emailValue)) {
                alert('Por favor, insira um e-mail válido.');
                if (inputEmail) inputEmail.focus();
                return;
            }

            const telefoneValue = inputTelefone ? inputTelefone.value.replace(/\D/g, '') : '';
            if (telefoneValue.length < 10 || telefoneValue.length > 11) {
                alert('Por favor, insira um telefone válido com DDD (10 ou 11 dígitos).');
                if (inputTelefone) inputTelefone.focus();
                return;
            }

            const dadosPedidoFinal = {
                numeroPedido: numeroPedido,
                cliente: {
                    nome: inputNome ? inputNome.value.trim() : '',
                    email: emailValue,
                    telefone: inputTelefone ? inputTelefone.value : ''
                },
                itens: itensCarrinho,
                status: 'Pendente',
                dataHora: new Date().toLocaleString('pt-BR')
            };

            const pedidosExistentes = JSON.parse(localStorage.getItem('flashlanche_pedidos')) || [];
            pedidosExistentes.push(dadosPedidoFinal);
            localStorage.setItem('flashlanche_pedidos', JSON.stringify(pedidosExistentes));

            localStorage.removeItem('carrinho');
            localStorage.removeItem('flashlanche_ultimo_numero');

            alert(`Pedido ${numeroPedido} confirmado com sucesso!`);
            window.location.href = '../pedidos/orders.html'; 
        });
    }
});

function voltarParaShop() {
    window.location.href = '../cardapio/shop.html';
}