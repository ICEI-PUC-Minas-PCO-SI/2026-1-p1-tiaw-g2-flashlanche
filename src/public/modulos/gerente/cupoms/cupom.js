// Variável para guardar temporariamente qual ID será apagado
let cupomIdParaExcluir = null;

// Requisito: Evento na carga de objetos
document.addEventListener('DOMContentLoaded', () => {
  renderizarTabela();
});

function logout() {
  window.location.href = '../../../index.html';
}

/**
 * ═════════════════════════════════════════════════════════
 * OPERAÇÃO READ (Ler e Listar)
 * ═════════════════════════════════════════════════════════
 */
function obterCupons() {
  const dados = localStorage.getItem('cupons');
  return dados ? JSON.parse(dados) : [];
}

function renderizarTabela() {
  const cupons = obterCupons();
  const tbody = document.getElementById('tabela-cupons');
  
  tbody.innerHTML = '';

  if (cupons.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 32px;">
          <i class="bi bi-ticket" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
          Nenhum cupom cadastrado no sistema.
        </td>
      </tr>`;
    return;
  }

  cupons.forEach(cupom => {
    // Formata a data para padrão brasileiro
    let dataFormatada = '--';
    if(cupom.validade) {
      const dataParts = cupom.validade.split('-'); // O input type="date" devolve yyyy-mm-dd
      dataFormatada = `${dataParts[2]}/${dataParts[1]}/${dataParts[0]}`;
    }

    const badgeClass = cupom.status === 'Ativo' ? 'badge-ativo' : 'badge-inativo';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="codigo-cupom">${cupom.codigo}</span></td>
      <td style="font-weight: 600;">${cupom.desconto}%</td>
      <td style="color: var(--text-secondary);">${dataFormatada}</td>
      <td><span class="badge ${badgeClass}">${cupom.status}</span></td>
      <td>
        <div style="display: flex; gap: 8px;">
          <button class="btn-action" onclick="abrirModalCupom('${cupom.id}')" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn-action btn-action-danger" onclick="abrirModalExcluir('${cupom.id}')" title="Excluir">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * ═════════════════════════════════════════════════════════
 * OPERAÇÕES CREATE E UPDATE (Inclusão e Alteração)
 * ═════════════════════════════════════════════════════════
 */
function abrirModalCupom(id = null) {
  const form = document.getElementById('form-cupom');
  form.reset(); // Limpa o formulário

  if (id) {
    // UPDATE: O usuário clicou no botão de editar, então preenchemos os dados
    const cupom = obterCupons().find(c => c.id === id);
    if (cupom) {
      document.getElementById('cupom-id').value = cupom.id;
      document.getElementById('cupom-codigo').value = cupom.codigo;
      document.getElementById('cupom-desconto').value = cupom.desconto;
      document.getElementById('cupom-validade').value = cupom.validade;
      document.getElementById('cupom-status').value = cupom.status;
      
      document.getElementById('modal-titulo').innerText = 'Editar Cupom';
    }
  } else {
    // CREATE: É um cupom novo, ID fica vazio
    document.getElementById('cupom-id').value = '';
    document.getElementById('modal-titulo').innerText = 'Novo Cupom';
  }

  document.getElementById('modal-cupom').classList.add('show');
}

// Requisito: Evento de submissão de formulário (onsubmit)
function salvarCupom(event) {
  event.preventDefault(); // Impede a página de recarregar

  const id = document.getElementById('cupom-id').value;
  const codigo = document.getElementById('cupom-codigo').value.toUpperCase().trim();
  const desconto = parseInt(document.getElementById('cupom-desconto').value);
  const validade = document.getElementById('cupom-validade').value;
  const status = document.getElementById('cupom-status').value;

  let cupons = obterCupons();

  if (id) {
    // ALTERAÇÃO (UPDATE)
    const index = cupons.findIndex(c => c.id === id);
    if (index !== -1) {
      cupons[index] = { id, codigo, desconto, validade, status };
    }
  } else {
    // INCLUSÃO (CREATE)
    const novoCupom = {
      id: 'CUP-' + Date.now(), // Gera um ID único baseado na data
      codigo,
      desconto,
      validade,
      status
    };
    cupons.push(novoCupom);
  }

  // Salva no Repositório
  localStorage.setItem('cupons', JSON.stringify(cupons));
  
  fecharModal('modal-cupom');
  
  // Atualização dinâmica sem recarregar (F5)
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
  if (!cupomIdParaExcluir) return;

  let cupons = obterCupons();
  
  // Filtra removendo o cupom com o ID selecionado
  cupons = cupons.filter(c => c.id !== cupomIdParaExcluir);

  // Salva a nova lista no localStorage
  localStorage.setItem('cupons', JSON.stringify(cupons));
  
  fecharModal('modal-excluir');
  cupomIdParaExcluir = null;
  
  // Atualiza a tela instantaneamente
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

/**
 * Prepara o texto da página para ser lido, focando no conteúdo principal
 */
function prepararTextoLeitura() {
  // Dá preferência ao conteúdo dentro da tag <main> para não ler menus repetitivos,
  // caso a tag não exista, lê todo o <body>.
  const mainContent = document.querySelector('main') || document.body;
  
  // Extrai apenas o texto limpo sem as tags de código HTML
  let textoParaLer = mainContent.innerText || mainContent.textContent;
  
  // Limpa quebras de linha em excesso para não gerar pausas longas na voz
  textoParaLer = textoParaLer.replace(/\n+/g, '. ').trim();
  
  return textoParaLer;
}

/**
 * Controla os Cenários 1, 2 e 3 (Iniciar, Pausar e Continuar)
 */
function toggleLeitura() {
  const btnPlayPause = document.getElementById('tts-play-pause');
  const btnStop = document.getElementById('tts-stop');
  const iconePlayPause = btnPlayPause.querySelector('i');

  // Cenário 3: Continuar (A leitura estava pausada)
  if (isPaused) {
    window.speechSynthesis.resume();
    isPaused = false;
    iconePlayPause.className = 'bi bi-pause-circle-fill';
    btnPlayPause.setAttribute('aria-label', 'Pausar narração');
    return;
  }

  // Cenário 2: Pausar (A leitura está em andamento)
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    isPaused = true;
    iconePlayPause.className = 'bi bi-play-circle-fill';
    btnPlayPause.setAttribute('aria-label', 'Continuar narração');
    return;
  }

  // Cenário 1: Iniciar (A leitura do zero)
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