function voltarParaShop() {
  window.location.href = '../cardapio/shop.html';
}

<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', () => {
    const inputTelefone = document.getElementById('telefone');
    const inputEmail = document.getElementById('email');
    const formCheckout = document.getElementById('form-checkout');

    if (inputTelefone) {
        inputTelefone.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            
            if (value.length > 6) {
                e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
            } else if (value.length > 2) {
                e.target.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
            } else if (value.length > 0) {
                e.target.value = `(${value}`;
            } else {
                e.target.value = '';
            }
        });
    }

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

            alert('Formulário validado com sucesso! Prosseguindo com o pedido...');
        });
    }
});
=======
>>>>>>> origin/main
