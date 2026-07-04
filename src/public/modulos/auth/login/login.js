/*═════════════════════════════════════════════════════
  LOGIN.JS
═════════════════════════════════════════════════════*/

document.addEventListener('DOMContentLoaded', function () {

  const sessaoExistente = obterSessaoAtiva();
  if (sessaoExistente) {
    window.location.href = '../../../index.html';
    return;
  }

  const form = document.getElementById('login-form');
  const inputUsername = document.getElementById('login-username');
  const inputPassword = document.getElementById('login-password');
  const caixaErro = document.getElementById('login-error');
  const botaoTogglePass = document.getElementById('toggle-password');

  /*═══════════════════════════════════MOSTRAR/OCULTAR SENHA═══════════════════════════════════*/
  botaoTogglePass.addEventListener('click', function () {
    const mostrando = inputPassword.type === 'text';
    inputPassword.type = mostrando ? 'password' : 'text';
    botaoTogglePass.querySelector('i').className = mostrando ? 'bi bi-eye' : 'bi bi-eye-slash';
  });

  /*═══════════════════════════════════SUBMIT═══════════════════════════════════*/
  form.addEventListener('submit', function (evento) {
    evento.preventDefault();

    caixaErro.style.display = 'none';

    const username = inputUsername.value.trim();
    const password = inputPassword.value;

    const resultado = autenticarUsuario(username, password);

    if (!resultado.sucesso) {
      caixaErro.textContent = resultado.erro;
      caixaErro.style.display = 'block';
      exibirToastAuth(resultado.erro, 'erro');
      return;
    }

    exibirToastAuth(`Bem-vindo, ${resultado.sessao.username}!`, 'sucesso');

    setTimeout(function () {
      window.location.href = '../../../index.html';
    }, 500);
  });
});
