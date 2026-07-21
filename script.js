const calcState = {
  expressao: '',
  resultado: '0',
  redefinirNoProximoDigito: false
};

const dom = {
  expressao: document.getElementById('expressao'),
  resultado: document.getElementById('resultado'),
  teclado: document.querySelector('.teclado')
};


function safeEvaluate(expression) {

  const sanitized = expression.replace(/[^0-9+\-*/.]/g, '');
  
  try {
    // Cria uma função isolada estritamente matemática sem acesso ao escopo window ou variáveis globais
    const fn = new Function(`"use strict"; return (${sanitized});`);
    const val = fn();
    
    if (val === undefined || isNaN(val)) return 'ERRO';
    if (!isFinite(val)) return 'Não div. por 0'; // Tratamento limpo para divisão por zero
    
    // Arredonda dízimas longas para evitar bugs de ponto flutuante (ex: 0.1 + 0.2 = 0.3000000004)
    return Number(val.toFixed(8)).toString();
  } catch {
    return 'ERRO';
  }
}

// --- CONTROLE DE ESTADO ---
function atualizarVisor() {
  dom.expressao.textContent = calcState.expressao;
  dom.resultado.textContent = calcState.resultado;
}

function processarEntrada(token) {
  const operacoes = ['+', '-', '*', '/'];

  // Se houve um erro anteriormente ou se terminamos uma conta e digitamos um número novo
  if (calcState.redefinirNoProximoDigito) {
    if (!operacoes.includes(token)) {
      calcState.resultado = '';
    }
    calcState.redefinirNoProximoDigito = false;
  }

  // Tratando ponto decimal duplo no mesmo bloco numérico
  if (token === '.') {
    const partes = calcState.resultado.split(/[+\-*/]/);
    const ultimoNumero = partes[partes.length - 1];
    if (ultimoNumero.includes('.')) return; // Ignora ponto repetido
  }

  // Evitando duplicidade de operadores seguidos
  if (operacoes.includes(token)) {
    const ultimoCaractere = calcState.resultado.slice(-1);
    if (operacoes.includes(ultimoCaractere)) {
      // Substitui o operador anterior pelo novo
      calcState.resultado = calcState.resultado.slice(0, -1) + token;
      atualizarVisor();
      return;
    }
  }

  // Evita iniciar com operadores (exceto menos para números negativos)
  if (calcState.resultado === '0' && token !== '.') {
    if (operacoes.includes(token)) {
      if (token === '-') calcState.resultado = '-';
      return;
    }
    calcState.resultado = token;
  } else {
    calcState.resultado += token;
  }

  atualizarVisor();
}

function limparTudo() {
  calcState.expressao = '';
  calcState.resultado = '0';
  calcState.redefinirNoProximoDigito = false;
  atualizarVisor();
}

function apagarUltimo() {
  if (calcState.resultado === 'ERRO' || calcState.resultado === 'Não div. por 0') {
    limparTudo();
    return;
  }
  
  if (calcState.resultado.length > 1) {
    calcState.resultado = calcState.resultado.slice(0, -1);
  } else {
    calcState.resultado = '0';
  }
  atualizarVisor();
}

function calcular() {
  if (calcState.resultado === '0' || calcState.resultado === '') return;

  const expressaoParaCalcular = calcState.resultado;
  const resFinal = safeEvaluate(expressaoParaCalcular);

  calcState.expressao = expressaoParaCalcular + ' =';
  calcState.resultado = resFinal;
  calcState.redefinirNoProximoDigito = true;
  atualizarVisor();
}

// --- OUVINTES DE EVENTOS (EVENT DELEGATION) ---
dom.teclado.addEventListener('click', (e) => {
  const target = e.target.closest('.btn'); // Encontra o botão clicado de forma resiliente
  if (!target) return;

  const { val, action } = target.dataset;

  if (val !== undefined) {
    processarEntrada(val);
  } else if (action === 'clear') {
    limparTudo();
  } else if (action === 'backspace') {
    apagarUltimo();
  } else if (action === 'calculate') {
    calcular();
  }
});

// --- SUPORTE COMPLETO AO TECLADO FÍSICO ---
document.addEventListener('keydown', (e) => {
  const key = e.key;

  if (/[0-9]/.test(key) || ['+', '-', '*', '/', '.'].includes(key)) {
    e.preventDefault();
    processarEntrada(key);
  } else if (key === 'Enter' || key === '=') {
    e.preventDefault();
    calcular();
  } else if (key === 'Backspace') {
    e.preventDefault();
    apagarUltimo();
  } else if (key === 'Escape' || key === 'c' || key === 'C') {
    e.preventDefault();
    limparTudo();
  }
});
