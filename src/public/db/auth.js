/*═════════════════════════════════════════════════════
  AUTH.JS
═════════════════════════════════════════════════════*/

const AUTH_STORAGE_KEYS = {
  USERS: 'users',
  SESSION: 'activeSession',
};

/*═════════════════════════════════════════════════════
  STORAGE: HELPERS GENÉRICOS
═════════════════════════════════════════════════════*/

function authObterDoStorage(chave, padrao) {
  const dados = localStorage.getItem(chave);

  if (!dados) {
    return padrao;
  }

  try {
    return JSON.parse(dados);
  } catch (erro) {
    console.error(`Não foi possível ler "${chave}" do localStorage:`, erro);
    return padrao;
  }
}

function authSalvarNoStorage(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (erro) {
    console.error(`Não foi possível salvar "${chave}" no localStorage:`, erro);
  }
}

/*═════════════════════════════════════════════════════
  STORAGE POR USUÁRIO
═════════════════════════════════════════════════════*/

function authChaveUsuario(chaveBase) {
  const sessao = obterSessaoAtiva();
  const usuario = sessao ? sessao.username : 'anonimo';
  return `${chaveBase}:${usuario}`;
}

/*═════════════════════════════════════════════════════
  CENÁRIO A: INICIALIZAÇÃO DOS USUÁRIOS MOCK
═════════════════════════════════════════════════════*/

function inicializarUsuariosMock() {
  const usuariosExistentes = localStorage.getItem(AUTH_STORAGE_KEYS.USERS);

  if (usuariosExistentes !== null) {
    return;
  }

  const usuariosMock = [
    { username: 'user', password: '123', email: 'user@flashlanche.com', telefone: '(31) 91234-5678', admin: false },
    { username: 'admin', password: '123', email: 'admin@flashlanche.com', telefone: '(31) 99876-5432', admin: true },
  ];

  authSalvarNoStorage(AUTH_STORAGE_KEYS.USERS, usuariosMock);
}

// Roda imediatamente ao carregar o script, em qualquer página.
inicializarUsuariosMock();

/*═════════════════════════════════════════════════════
  MIGRAÇÃO: USUÁRIOS ANTIGOS SEM E-MAIL/TELEFONE
═════════════════════════════════════════════════════*/

function migrarUsuariosAntigos() {
  const usuarios = obterUsuarios();
  let precisaSalvar = false;

  usuarios.forEach(function (usuario) {
    if (!usuario.email) {
      usuario.email = `${usuario.username}@flashlanche.com`;
      precisaSalvar = true;
    }
    if (!usuario.telefone) {
      usuario.telefone = '(31) 90000-0000';
      precisaSalvar = true;
    }
  });

  if (precisaSalvar) {
    authSalvarNoStorage(AUTH_STORAGE_KEYS.USERS, usuarios);
  }
}

migrarUsuariosAntigos();

/*═════════════════════════════════════════════════════
  VALIDAÇÃO — E-MAIL E TELEFONE
═════════════════════════════════════════════════════*/

const AUTH_REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUTH_REGEX_TELEFONE = /^\(\d{2}\)\s9\d{4}-\d{4}$/;

function authAplicarMascaraTelefone(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);

  if (digitos.length === 0) return '';
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 7) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;

  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

function authEmailValido(email) {
  return AUTH_REGEX_EMAIL.test((email || '').trim());
}

function authTelefoneValido(telefone) {
  return AUTH_REGEX_TELEFONE.test((telefone || '').trim());
}

/*═════════════════════════════════════════════════════
  USERS: LEITURA E CADASTRO
═════════════════════════════════════════════════════*/

function obterUsuarios() {
  return authObterDoStorage(AUTH_STORAGE_KEYS.USERS, []);
}

function cadastrarUsuario(username, password, email, telefone) {
  const usuarios = obterUsuarios();

  const usernameNormalizado = (username || '').trim();
  const emailNormalizado = (email || '').trim();
  const telefoneNormalizado = (telefone || '').trim();

  if (!usernameNormalizado || !password || !emailNormalizado || !telefoneNormalizado) {
    return { sucesso: false, erro: 'Preencha todos os campos.' };
  }

  if (!authEmailValido(emailNormalizado)) {
    return { sucesso: false, erro: 'Digite um e-mail válido.' };
  }

  if (!authTelefoneValido(telefoneNormalizado)) {
    return { sucesso: false, erro: 'Digite um telefone no formato (DDD) 91234-5678.' };
  }

  const usernameEmUso = usuarios.some(function (usuario) {
    return usuario.username.toLowerCase() === usernameNormalizado.toLowerCase();
  });

  if (usernameEmUso) {
    return { sucesso: false, erro: 'Esse nome de usuário já existe.' };
  }

  const emailEmUso = usuarios.some(function (usuario) {
    return (usuario.email || '').toLowerCase() === emailNormalizado.toLowerCase();
  });

  if (emailEmUso) {
    return { sucesso: false, erro: 'Esse e-mail já está cadastrado.' };
  }

  usuarios.push({
    username: usernameNormalizado,
    password: password,
    email: emailNormalizado,
    telefone: telefoneNormalizado,
    admin: false,
  });

  authSalvarNoStorage(AUTH_STORAGE_KEYS.USERS, usuarios);

  return { sucesso: true };
}


function atualizarDadosConta(email, telefone) {
  const sessao = obterSessaoAtiva();

  if (!sessao) {
    return { sucesso: false, erro: 'Sessão inválida. Faça login novamente.' };
  }

  const emailNormalizado = (email || '').trim();
  const telefoneNormalizado = (telefone || '').trim();

  if (!authEmailValido(emailNormalizado)) {
    return { sucesso: false, erro: 'Digite um e-mail válido.' };
  }

  if (!authTelefoneValido(telefoneNormalizado)) {
    return { sucesso: false, erro: 'Digite um telefone no formato (DDD) 91234-5678.' };
  }

  const usuarios = obterUsuarios();
  const indice = usuarios.findIndex(function (usuario) {
    return usuario.username === sessao.username;
  });

  if (indice === -1) {
    return { sucesso: false, erro: 'Usuário não encontrado.' };
  }

  const emailEmUsoPorOutraConta = usuarios.some(function (usuario, i) {
    return i !== indice && (usuario.email || '').toLowerCase() === emailNormalizado.toLowerCase();
  });

  if (emailEmUsoPorOutraConta) {
    return { sucesso: false, erro: 'Esse e-mail já está em uso por outra conta.' };
  }

  usuarios[indice].email = emailNormalizado;
  usuarios[indice].telefone = telefoneNormalizado;

  authSalvarNoStorage(AUTH_STORAGE_KEYS.USERS, usuarios);

  return { sucesso: true };
}

function alterarSenhaConta(senhaAtual, novaSenha) {
  const sessao = obterSessaoAtiva();

  if (!sessao) {
    return { sucesso: false, erro: 'Sessão inválida. Faça login novamente.' };
  }

  const usuarios = obterUsuarios();
  const usuario = usuarios.find(function (u) { return u.username === sessao.username; });

  if (!usuario) {
    return { sucesso: false, erro: 'Usuário não encontrado.' };
  }

  if (usuario.password !== senhaAtual) {
    return { sucesso: false, erro: 'Senha atual incorreta.' };
  }

  if (!novaSenha || novaSenha.length < 3) {
    return { sucesso: false, erro: 'A nova senha deve ter pelo menos 3 caracteres.' };
  }

  usuario.password = novaSenha;

  authSalvarNoStorage(AUTH_STORAGE_KEYS.USERS, usuarios);

  return { sucesso: true };
}

function obterSessaoAtiva() {
  const dados = sessionStorage.getItem(AUTH_STORAGE_KEYS.SESSION);

  if (!dados) {
    return null;
  }

  try {
    return JSON.parse(dados);
  } catch (erro) {
    console.error('Sessão corrompida no sessionStorage:', erro);
    return null;
  }
}

function obterUsuarioAtual() {
  const sessao = obterSessaoAtiva();
  if (!sessao) {
    return null;
  }

  const usuarios = obterUsuarios();

  return usuarios.find(function (usuario) {
    return usuario.username === sessao.username;
  }) || null;
}

function autenticarUsuario(username, password) {
  const usuarios = obterUsuarios();
  const usernameNormalizado = (username || '').trim();

  const usuarioEncontrado = usuarios.find(function (usuario) {
    return usuario.username.toLowerCase() === usernameNormalizado.toLowerCase()
      && usuario.password === password;
  });

  if (!usuarioEncontrado) {
    return { sucesso: false, erro: 'Usuário ou senha inválidos.' };
  }

  const sessao = {
    username: usuarioEncontrado.username,
    admin: usuarioEncontrado.admin,
  };

  sessionStorage.setItem(AUTH_STORAGE_KEYS.SESSION, JSON.stringify(sessao));

  return { sucesso: true, sessao: sessao };
}

function encerrarSessao() {
  sessionStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
}

/*═════════════════════════════════════════════════════
  ROUTE GUARD
═════════════════════════════════════════════════════*/

function protegerRota(opcoes) {
  const config = Object.assign(
    { exigirAdmin: false, caminhoLogin: 'login.html', caminhoHome: 'index.html' },
    opcoes || {}
  );

  const sessao = obterSessaoAtiva();

  if (!sessao) {
    alert('Acesso negado: faça o login primeiro.');
    window.location.href = config.caminhoLogin;
    return null;
  }

  if (config.exigirAdmin && sessao.admin !== true) {
    alert('Acesso negado: você não tem privilégios de administrador.');
    window.location.href = config.caminhoHome;
    return null;
  }

  return sessao;
}

/*═════════════════════════════════════════════════════
  NAVBAR REATIVA
═════════════════════════════════════════════════════*/

function renderizarNavbarAuth(elementoId, caminhos) {
  const container = document.getElementById(elementoId);

  if (!container) {
    return;
  }

  const config = Object.assign(
    {
      login: 'login.html',
      cadastro: 'cadastro.html',
      cardapio: 'modulos/cliente/cardapio/shop.html',
      dashboard: 'modulos/gerente/dashboard/dashboard.html',
      home: 'index.html',
    },
    caminhos || {}
  );

  const sessao = obterSessaoAtiva();

  container.innerHTML = '';

  // ─── Visitante ───────────────────────────────────────────────
  if (!sessao) {
    container.innerHTML = `
      <a href="${config.login}" class="btn-outline-cb header-login" style="padding:10px 18px;font-size:13px;">Entrar</a>
      <a href="${config.cadastro}" class="btn-primary-cb" style="padding:10px 18px;font-size:13px;">
        <i class="bi bi-arrow-right-circle-fill"></i> Começar
      </a>
    `;
    return;
  }

  // ─── Cliente Comum ───────────────────────────────────────────
  if (sessao.admin !== true) {
    container.innerHTML = `
      <span class="navbar-greeting" style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-right:4px;">
        Olá, ${sessao.username}
      </span>
      <a href="${config.cardapio}" class="btn-outline-cb" style="padding:10px 18px;font-size:13px;">
        <i class="bi bi-shop"></i> Cardápio
      </a>
      <button type="button" id="auth-logout-btn" class="btn-primary-cb" style="padding:10px 18px;font-size:13px;border:none;">
        <i class="bi bi-box-arrow-right"></i> Sair
      </button>
    `;
  } else {
    // ─── Gerente (Admin) ─────────────────────────────────────
    container.innerHTML = `
      <span class="navbar-greeting" style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-right:4px;">
        Olá, ${sessao.username}
      </span>
      <a href="${config.cardapio}" class="btn-outline-cb" style="padding:10px 18px;font-size:13px;">
        <i class="bi bi-shop"></i> Cardápio
      </a>
      <a href="${config.dashboard}" class="btn-outline-cb" style="padding:10px 18px;font-size:13px;">
        <i class="bi bi-speedometer2"></i> Dashboard
      </a>
      <button type="button" id="auth-logout-btn" class="btn-primary-cb" style="padding:10px 18px;font-size:13px;border:none;">
        <i class="bi bi-box-arrow-right"></i> Sair
      </button>
    `;
  }

  const botaoSair = document.getElementById('auth-logout-btn');
  if (botaoSair) {
    botaoSair.addEventListener('click', function () {
      encerrarSessao();
      window.location.href = config.home;
    });
  }
}

/*═════════════════════════════════════════════════════
  OCULTAR/MOSTRAR A SIDEBAR (PAINEL DO GERENTE)
═════════════════════════════════════════════════════*/

const SIDEBAR_OCULTA_KEY = 'sidebarGerenteOculta';

function inicializarSidebarToggle() {
  const layout = document.querySelector('.manager-layout');
  const botao = document.getElementById('sidebar-toggle-btn');
  const backdrop = document.getElementById('sidebar-backdrop');

  if (!layout || !botao) {
    return;
  }

  function aplicarEstado(oculta) {
    layout.classList.toggle('sidebar-collapsed', oculta);
    const rotulo = oculta ? 'Mostrar menu lateral' : 'Ocultar menu lateral';
    botao.setAttribute('aria-label', rotulo);
    botao.title = rotulo;
  }

  aplicarEstado(localStorage.getItem(SIDEBAR_OCULTA_KEY) === 'true');

  botao.addEventListener('click', function () {
    const ocultaAgora = !layout.classList.contains('sidebar-collapsed');
    localStorage.setItem(SIDEBAR_OCULTA_KEY, String(ocultaAgora));
    aplicarEstado(ocultaAgora);
  });

  // No mobile/tablet a sidebar vira um drawer sobre um fundo escurecido;
  // clicar nesse fundo fecha o drawer, como em qualquer menu lateral.
  if (backdrop) {
    backdrop.addEventListener('click', function () {
      localStorage.setItem(SIDEBAR_OCULTA_KEY, 'true');
      aplicarEstado(true);
    });
  }
}

/*═════════════════════════════════════════════════════
  OCULTAR/MOSTRAR O WIDGET FLUTUANTE DE TTS
═════════════════════════════════════════════════════*/

const TTS_OCULTO_KEY = 'ttsWidgetOculto';

function inicializarTTSToggle(seletorWidget) {
  const widget = document.querySelector(seletorWidget);
  if (!widget) {
    return;
  }

  const posicionadoADireita = widget.classList.contains('tts-widget-gestor');

  let botaoRestaurar = document.getElementById('tts-restore-btn');
  if (!botaoRestaurar) {
    botaoRestaurar = document.createElement('button');
    botaoRestaurar.id = 'tts-restore-btn';
    botaoRestaurar.type = 'button';
    botaoRestaurar.className = 'tts-restore-btn' + (posicionadoADireita ? ' tts-restore-btn-right' : '');
    botaoRestaurar.setAttribute('aria-label', 'Mostrar leitor de página');
    botaoRestaurar.innerHTML = '<i class="bi bi-universal-access-circle" aria-hidden="true"></i>';
    document.body.appendChild(botaoRestaurar);
  }

  function aplicarEstado(oculto) {
    widget.style.display = oculto ? 'none' : 'flex';
    botaoRestaurar.style.display = oculto ? 'flex' : 'none';
  }

  aplicarEstado(localStorage.getItem(TTS_OCULTO_KEY) === 'true');

  botaoRestaurar.addEventListener('click', function () {
    localStorage.setItem(TTS_OCULTO_KEY, 'false');
    aplicarEstado(false);
  });

  const botaoFechar = widget.querySelector('.tts-close-btn');
  if (botaoFechar) {
    botaoFechar.addEventListener('click', function () {
      localStorage.setItem(TTS_OCULTO_KEY, 'true');
      aplicarEstado(true);

      // Evita deixar uma narração tocando "escondida" depois de fechar o widget.
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    });
  }
}

/*═════════════════════════════════════════════════════
  TOAST DE FEEDBACK
═════════════════════════════════════════════════════*/

function exibirToastAuth(mensagem, tipo) {
  const tipoClasse = tipo === 'erro' ? 'text-bg-danger' : 'text-bg-success';

  let container = document.getElementById('auth-toast-container');

  if (!container) {
    container = document.createElement('div');
    container.id = 'auth-toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1080';
    document.body.appendChild(container);
  }

  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center ${tipoClasse} border-0`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body"></div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
    </div>
  `;
  toastEl.querySelector('.toast-body').textContent = mensagem;

  container.appendChild(toastEl);

  if (window.bootstrap && window.bootstrap.Toast) {
    const toast = new window.bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', function () {
      toastEl.remove();
    });
  } else {
    // Fallback caso o bundle do Bootstrap ainda não tenha sido carregado
    setTimeout(function () {
      toastEl.remove();
    }, 3000);
  }
}
