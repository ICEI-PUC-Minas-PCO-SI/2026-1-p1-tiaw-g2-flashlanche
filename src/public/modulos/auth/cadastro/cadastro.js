/*═════════════════════════════════════════════════════
  CADASTRO.JS
═════════════════════════════════════════════════════*/

document.addEventListener('DOMContentLoaded', function () {

  const sessaoExistente = obterSessaoAtiva();
  if (sessaoExistente) {
    window.location.href = '../../../index.html';
    return;
  }

  const form = document.getElementById('cadastro-form');
  const inputUsername = document.getElementById('cadastro-username');
  const inputEmail = document.getElementById('cadastro-email');
  const inputTelefone = document.getElementById('cadastro-telefone');
  const inputPassword = document.getElementById('cadastro-password');
  const inputConfirm = document.getElementById('cadastro-confirm');
  const caixaErro = document.getElementById('cadastro-error');
  const botaoTogglePass = document.getElementById('toggle-password');

  /*═══════════════════════════════════MÁSCARA DE TELEFONE═══════════════════════════════════*/
  inputTelefone.addEventListener('input', function () {
    inputTelefone.value = authAplicarMascaraTelefone(inputTelefone.value);
  });

  /*═══════════════════════════════════MOSTRAR/OCULTAR SENHA═══════════════════════════════════*/
  botaoTogglePass.addEventListener('click', function () {
    const mostrando = inputPassword.type === 'text';
    inputPassword.type = mostrando ? 'password' : 'text';
    botaoTogglePass.querySelector('i').className = mostrando ? 'bi bi-eye' : 'bi bi-eye-slash';
  });

  function mostrarErro(mensagem) {
    caixaErro.textContent = mensagem;
    caixaErro.style.display = 'block';
    exibirToastAuth(mensagem, 'erro');
  }

  /*═══════════════════════════════════SUBMIT═══════════════════════════════════*/
  form.addEventListener('submit', function (evento) {
    evento.preventDefault();

    caixaErro.style.display = 'none';

    const username = inputUsername.value.trim();
    const email = inputEmail.value.trim();
    const telefone = inputTelefone.value.trim();
    const password = inputPassword.value;
    const confirmacao = inputConfirm.value;

    if (username.length < 3) {
      mostrarErro('O usuário deve ter pelo menos 3 caracteres.');
      return;
    }

    if (!authEmailValido(email)) {
      mostrarErro('Digite um e-mail válido.');
      return;
    }

    if (!authTelefoneValido(telefone)) {
      mostrarErro('Digite um telefone no formato (DDD) 91234-5678.');
      return;
    }

    if (password.length < 3) {
      mostrarErro('A senha deve ter pelo menos 3 caracteres.');
      return;
    }

    if (password !== confirmacao) {
      mostrarErro('As senhas não coincidem.');
      return;
    }

    const resultado = cadastrarUsuario(username, password, email, telefone);

    if (!resultado.sucesso) {
      mostrarErro(resultado.erro);
      return;
    }

    exibirToastAuth('Conta criada com sucesso! Faça login para continuar.', 'sucesso');

    setTimeout(function () {
      window.location.href = '../login/login.html';
    }, 700);
  });
});
