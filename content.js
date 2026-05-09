(function () {
  if (document.getElementById('__calc-root__')) return;

  const root = document.createElement('div');
  root.id = '__calc-root__';
  document.body.appendChild(root);

  const shadow = root.attachShadow({ mode: 'closed' });

  shadow.innerHTML = `
    <style>
      *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

      #fab {
        position: fixed;
        bottom: 28px;
        right: 28px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #ff9f0a;
        color: #fff;
        font-size: 26px;
        line-height: 56px;
        text-align: center;
        cursor: pointer;
        border: none;
        box-shadow: 0 4px 20px rgba(255,159,10,0.5);
        z-index: 2147483646;
        transition: transform 0.15s, box-shadow 0.15s;
        user-select: none;
      }
      #fab:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(255,159,10,0.65); }
      #fab:active { transform: scale(0.95); }

      #panel {
        position: fixed;
        bottom: 96px;
        right: 28px;
        z-index: 2147483647;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 24px 60px rgba(0,0,0,0.5);
        transform-origin: bottom right;
        transform: scale(0);
        opacity: 0;
        transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), opacity 0.15s ease;
        pointer-events: none;
      }
      #panel.open {
        transform: scale(1);
        opacity: 1;
        pointer-events: all;
      }

      .display {
        background: #1c1c1e;
        padding: 16px 20px 8px;
        text-align: right;
        min-height: 90px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        width: 280px;
      }
      .expression { color: #888; font-size: 15px; min-height: 20px; margin-bottom: 4px; word-break: break-all; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
      .result { color: #fff; font-size: 48px; font-weight: 300; line-height: 1; word-break: break-all; font-family: -apple-system, BlinkMacSystemFont, sans-serif; transition: font-size 0.1s; }

      .buttons {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1px;
        background: #3a3a3c;
        width: 280px;
      }
      .btn {
        background: #505050;
        color: #fff;
        border: none;
        height: 65px;
        font-size: 22px;
        font-weight: 400;
        cursor: pointer;
        transition: filter 0.1s;
        user-select: none;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      }
      .btn:hover  { filter: brightness(1.3); }
      .btn:active { filter: brightness(0.75); }
      .btn.light  { background: #a5a5a5; color: #000; }
      .btn.orange { background: #ff9f0a; color: #fff; }
      .btn.zero   { grid-column: span 2; text-align: left; padding-left: 24px; }
      .btn.orange.active { background: #fff; color: #ff9f0a; }
    </style>

    <button id="fab" title="Калькулятор">🧮</button>

    <div id="panel">
      <div class="display">
        <div class="expression" id="expr"></div>
        <div class="result" id="res">0</div>
      </div>
      <div class="buttons">
        <button class="btn light" data-action="clear">C</button>
        <button class="btn light" data-action="sign">+/−</button>
        <button class="btn light" data-action="percent">%</button>
        <button class="btn orange" data-op="/">÷</button>

        <button class="btn" data-num="7">7</button>
        <button class="btn" data-num="8">8</button>
        <button class="btn" data-num="9">9</button>
        <button class="btn orange" data-op="*">×</button>

        <button class="btn" data-num="4">4</button>
        <button class="btn" data-num="5">5</button>
        <button class="btn" data-num="6">6</button>
        <button class="btn orange" data-op="-">−</button>

        <button class="btn" data-num="1">1</button>
        <button class="btn" data-num="2">2</button>
        <button class="btn" data-num="3">3</button>
        <button class="btn orange" data-op="+">+</button>

        <button class="btn zero" data-num="0">0</button>
        <button class="btn" data-action="dot">.</button>
        <button class="btn orange" data-action="calc">=</button>
      </div>
    </div>
  `;

  const fab    = shadow.getElementById('fab');
  const panel  = shadow.getElementById('panel');
  const resEl  = shadow.getElementById('res');
  const exprEl = shadow.getElementById('expr');

  let cur = '', prev = '', op = null, reset = false;
  const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };

  function display(v) {
    const s = String(v);
    resEl.style.fontSize = s.length > 9 ? '26px' : s.length > 6 ? '36px' : '48px';
    resEl.textContent = s;
  }

  function clearOrangeActive() {
    shadow.querySelectorAll('.btn.orange').forEach(b => b.classList.remove('active'));
  }

  function compute(intermediate) {
    if (!op || prev === '') return;
    const a = parseFloat(prev), b = parseFloat(cur === '' ? prev : cur);
    let r;
    switch (op) {
      case '+': r = a + b; break;
      case '-': r = a - b; break;
      case '*': r = a * b; break;
      case '/':
        if (b === 0) { display('Ошибка'); exprEl.textContent = ''; clearAll(); return; }
        r = a / b; break;
    }
    r = parseFloat(r.toPrecision(12));
    if (!intermediate) {
      exprEl.textContent = `${prev} ${SYM[op]} ${b} =`;
      op = null; prev = '';
      clearOrangeActive();
    } else {
      prev = String(r);
    }
    cur = String(r);
    display(cur);
    reset = true;
  }

  function clearAll() {
    cur = ''; prev = ''; op = null; reset = false;
    exprEl.textContent = '';
    display('0');
    clearOrangeActive();
  }

  shadow.querySelector('.buttons').addEventListener('click', e => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    if (btn.dataset.num !== undefined) {
      if (reset) { cur = ''; reset = false; }
      if (cur.length >= 12) return;
      cur += btn.dataset.num;
      display(cur);
      return;
    }

    if (btn.dataset.op) {
      const newOp = btn.dataset.op;
      if (cur === '' && prev === '') return;
      if (cur !== '' && prev !== '' && op) compute(true);
      op = newOp;
      prev = cur || prev;
      cur = '';
      exprEl.textContent = `${prev} ${SYM[op]}`;
      clearOrangeActive();
      btn.classList.add('active');
      return;
    }

    switch (btn.dataset.action) {
      case 'clear':   clearAll(); break;
      case 'calc':    compute(false); break;
      case 'dot':
        if (reset) { cur = '0'; reset = false; }
        if (!cur.includes('.')) { cur = (cur || '0') + '.'; display(cur); }
        break;
      case 'sign':
        if (!cur || cur === '0') break;
        cur = String(parseFloat(cur) * -1); display(cur); break;
      case 'percent':
        if (!cur) break;
        cur = String(parseFloat(cur) / 100); display(cur); break;
    }
  });

  fab.addEventListener('click', () => panel.classList.toggle('open'));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') panel.classList.remove('open');
  });
})();
