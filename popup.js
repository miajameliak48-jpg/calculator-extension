let currentInput = '';
let previousInput = '';
let operator = null;
let shouldReset = false;

const resultEl = document.getElementById('result');
const expressionEl = document.getElementById('expression');

function updateDisplay(value) {
  const str = String(value);
  resultEl.style.fontSize = str.length > 9 ? '28px' : str.length > 6 ? '36px' : '48px';
  resultEl.textContent = str;
}

function appendNumber(num) {
  if (shouldReset) {
    currentInput = '';
    shouldReset = false;
  }
  if (currentInput.length >= 12) return;
  currentInput += num;
  updateDisplay(currentInput);
}

function appendDot() {
  if (shouldReset) {
    currentInput = '0';
    shouldReset = false;
  }
  if (!currentInput.includes('.')) {
    currentInput = (currentInput || '0') + '.';
    updateDisplay(currentInput);
  }
}

function setOperator(op) {
  if (currentInput === '' && previousInput === '') return;

  if (currentInput !== '' && previousInput !== '' && operator) {
    calculate(true);
  }

  operator = op;
  previousInput = currentInput || previousInput;
  currentInput = '';

  const opSymbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
  expressionEl.textContent = previousInput + ' ' + opSymbols[op];

  document.querySelectorAll('.btn.operator').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.btn.operator').forEach(btn => {
    if (btn.textContent === opSymbols[op]) btn.classList.add('active');
  });
}

function calculate(intermediate = false) {
  if (!operator || previousInput === '') return;

  const a = parseFloat(previousInput);
  const b = parseFloat(currentInput === '' ? previousInput : currentInput);
  let result;

  switch (operator) {
    case '+': result = a + b; break;
    case '-': result = a - b; break;
    case '*': result = a * b; break;
    case '/':
      if (b === 0) {
        updateDisplay('Ошибка');
        expressionEl.textContent = '';
        clearAll();
        return;
      }
      result = a / b;
      break;
  }

  result = parseFloat(result.toPrecision(12));

  if (!intermediate) {
    const opSymbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
    expressionEl.textContent = previousInput + ' ' + opSymbols[operator] + ' ' + b + ' =';
    operator = null;
    previousInput = '';
    document.querySelectorAll('.btn.operator').forEach(btn => btn.classList.remove('active'));
  } else {
    previousInput = String(result);
  }

  currentInput = String(result);
  updateDisplay(currentInput);
  shouldReset = true;
}

function clearAll() {
  currentInput = '';
  previousInput = '';
  operator = null;
  shouldReset = false;
  expressionEl.textContent = '';
  updateDisplay('0');
  document.querySelectorAll('.btn.operator').forEach(btn => btn.classList.remove('active'));
}

function toggleSign() {
  if (!currentInput || currentInput === '0') return;
  currentInput = String(parseFloat(currentInput) * -1);
  updateDisplay(currentInput);
}

function percent() {
  if (!currentInput) return;
  currentInput = String(parseFloat(currentInput) / 100);
  updateDisplay(currentInput);
}
