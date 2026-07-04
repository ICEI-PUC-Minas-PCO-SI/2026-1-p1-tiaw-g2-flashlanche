let cupomIdParaExcluir = null;

const STORAGE_KEYS = {
  CUPONS: 'cupons',
};

document.addEventListener('DOMContentLoaded', () => {
  renderizarTabela();
});

function logout() {
  encerrarSessao();
  window.location.href = '../../../index.html';
}

/**
 * ═════════════════════════════════════════════════════════
 * STORAGE: HELPERS GENÉRICOS
 * ═════════════════════════════════════════════════════════
 */
function obterDoStorage(chave, padrao) {
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

function salvarNoStorage(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (erro) {
    console.error(`Não foi possível salvar "${chave}" no localStorage:`, erro);
  }
}

/**
 * ═════════════════════════════════════════════════════════
 * OPERAÇÃO READ (Ler e Listar)
 * ═════════════════════════════════════════════════════════
 */
function obterCupons() {
  return obterDoStorage(STORAGE_KEYS.CUPONS, []);
}

function salvarCupons(cupons) {
  salvarNoStorage(STORAGE_KEYS.CUPONS, cupons);
}

function formatarDataBr(dataIso) {
  if (!dataIso) {
    return '--';
  }

  const [ano, mes, dia] = dataIso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function renderizarTabela() {
  const cupons = obterCupons();
  const tbody = document.getElementById('tabela-cupons');

  tbody.innerHTML = '';

  if (cupons.length === 0) {
    tbody.appendChild(criarLinhaVazia());
    return;
  }

  cupons.forEach((cupom) => {
    tbody.appendChild(criarLinhaCupom(cupom));
  });
}

function criarLinhaVazia() {
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td colspan="5" class="table-message table-empty">
      <i class="bi bi-ticket table-empty-icon"></i>
      Nenhum cupom cadastrado no sistema.
    </td>`;

  return tr;
}

function criarLinhaCupom(cupom) {
  const badgeClass = cupom.status === 'Ativo' ? 'badge-ativo' : 'badge-inativo';

  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td><span class="codigo-cupom"></span></td>
    <td class="cupom-desconto"></td>
    <td class="cupom-validade"></td>
    <td><span class="badge ${badgeClass}"></span></td>
    <td>
      <div class="row-actions">
        <button class="btn-action" title="Editar">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn-action btn-action-danger" title="Excluir">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </td>
  `;

  /*═════════════════════════════════════════════════════TEXTOS DO CUPOM═════════════════════════════════════════*/

  tr.querySelector('.codigo-cupom').textContent = cupom.codigo;
  tr.querySelector('.cupom-desconto').textContent = `${cupom.desconto}%`;
  tr.querySelector('.cupom-validade').textContent = formatarDataBr(cupom.validade);
  tr.querySelector('.badge').textContent = cupom.status;

  /*═════════════════════════════════════════════════════EVENTOS═════════════════════════════════════════*/

  tr.querySelector('.btn-action').addEventListener('click', () => abrirModalCupom(cupom.id));
  tr.querySelector('.btn-action-danger').addEventListener('click', () => abrirModalExcluir(cupom.id));

  return tr;
}

/**
 * ═════════════════════════════════════════════════════════
 * OPERAÇÕES CREATE E UPDATE (Inclusão e Alteração)
 * ═════════════════════════════════════════════════════════
 */

function obterCamposFormulario() {
  return {
    id: document.getElementById('cupom-id'),
    codigo: document.getElementById('cupom-codigo'),
    desconto: document.getElementById('cupom-desconto'),
    validade: document.getElementById('cupom-validade'),
    status: document.getElementById('cupom-status'),
  };
}

function abrirModalCupom(id = null) {
  const form = document.getElementById('form-cupom');
  const campos = obterCamposFormulario();

  form.reset(); 

  if (id) {
    const cupom = obterCupons().find((c) => c.id === id);

    if (cupom) {
      campos.id.value = cupom.id;
      campos.codigo.value = cupom.codigo;
      campos.desconto.value = cupom.desconto;
      campos.validade.value = cupom.validade;
      campos.status.value = cupom.status;

      document.getElementById('modal-titulo').innerText = 'Editar Cupom';
    }
  } else {
    campos.id.value = '';
    document.getElementById('modal-titulo').innerText = 'Novo Cupom';
  }

  document.getElementById('modal-cupom').classList.add('show');
}

function salvarCupom(event) {
  event.preventDefault(); 

  const campos = obterCamposFormulario();

  const id = campos.id.value;
  const codigo = campos.codigo.value.toUpperCase().trim();
  const desconto = parseInt(campos.desconto.value, 10);
  const validade = campos.validade.value;
  const status = campos.status.value;

  const cupons = obterCupons();

  if (id) {
    const index = cupons.findIndex((c) => c.id === id);

    if (index !== -1) {
      cupons[index] = { id, codigo, desconto, validade, status };
    }
  } else {
    cupons.push({
      id: 'CUP-' + Date.now(), 
      codigo,
      desconto,
      validade,
      status,
    });
  }

  salvarCupons(cupons);

  fecharModal('modal-cupom');

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
  if (!cupomIdParaExcluir) {
    return;
  }

  const cupons = obterCupons().filter((c) => c.id !== cupomIdParaExcluir);

  salvarCupons(cupons);

  fecharModal('modal-excluir');
  cupomIdParaExcluir = null;

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

/* ════════════════════════════════ ACESSIBILIDADE: TEXT-TO-SPEECH (TTS) ════════════════════════════════ */

let ttsUtterance = null;
let isPaused = false;

function prepararTextoLeitura() {

  const mainContent = document.querySelector('main') || document.body;

  let textoParaLer = mainContent.innerText || mainContent.textContent;

  textoParaLer = textoParaLer.replace(/\n+/g, '. ').trim();

  return textoParaLer;
}

function toggleLeitura() {
  const btnPlayPause = document.getElementById('tts-play-pause');
  const btnStop = document.getElementById('tts-stop');
  const iconePlayPause = btnPlayPause.querySelector('i');

  if (isPaused) {
    window.speechSynthesis.resume();
    isPaused = false;
    iconePlayPause.className = 'bi bi-pause-circle-fill';
    btnPlayPause.setAttribute('aria-label', 'Pausar narração');
    return;
  }

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    isPaused = true;
    iconePlayPause.className = 'bi bi-play-circle-fill';
    btnPlayPause.setAttribute('aria-label', 'Continuar narração');
    return;
  }

  const texto = prepararTextoLeitura();
  if (!texto) {
    alert("Não foi possível encontrar conteúdo legível na página.");
    return;
  }

  ttsUtterance = new SpeechSynthesisUtterance(texto);
  ttsUtterance.lang = 'pt-BR'; // Idioma suportado pela voz do navegador (Pode usar 'pt-PT' também)
  ttsUtterance.rate = 1.5; // Velocidade da leitura

  // Quando a leitura termina naturalmente, reseta a UI
  ttsUtterance.onend = () => {
    resetarUI();
  };

  ttsUtterance.onerror = (e) => {
    console.error('Ocorreu um erro no Text-To-Speech:', e);
    resetarUI();
  };

  // Envia o comando para o navegador começar a falar
  window.speechSynthesis.speak(ttsUtterance);

  // Atualiza a Interface (UI)
  iconePlayPause.className = 'bi bi-pause-circle-fill';
  btnPlayPause.setAttribute('aria-label', 'Pausar narração');
  btnStop.disabled = false;
  isPaused = false;
}

/**
 * Cenário 4: Parar a narração definitivamente
 */
function pararLeitura() {
  if (window.speechSynthesis.speaking || isPaused) {
    window.speechSynthesis.cancel();
    resetarUI();
  }
}

/**
 * Função auxiliar para voltar os botões ao estado original
 */
function resetarUI() {
  const btnPlayPause = document.getElementById('tts-play-pause');
  const btnStop = document.getElementById('tts-stop');
  const iconePlayPause = btnPlayPause.querySelector('i');

  iconePlayPause.className = 'bi bi-play-circle-fill';
  btnPlayPause.setAttribute('aria-label', 'Iniciar narração da página');
  btnStop.disabled = true;
  isPaused = false;
}

// Prevenção de Bug: Garante que a síntese de voz para caso o utilizador mude de página ou feche o separador
window.addEventListener('beforeunload', () => {
  window.speechSynthesis.cancel();
});