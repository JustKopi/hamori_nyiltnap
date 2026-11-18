/* ===== 12. Programozd a robotot! – algoritmus, ciklus, Python ===== */
App.add((() => {
  const S = {
    id: 'robot', icon: '', title: 'Programozd a robotot!', color: '#c084fc',
    desc: 'Rakd össze a programot, és vezesd el a robotot a töltőig! A kódot Pythonban is látod.',
    topic: 'Programozás Pythonban, algoritmusok, ciklusok, függvények'
  };
  // pálya = megoldás lépései (E=előre, J=jobbra, B=balra); a robot jobbra néz induláskor
  const LEVELS = [
    { sol: 'EEEE', max: 1, tip: 'Egy parancs elég: az „előre” lépésszámát a ×-gombbal növelheted!' },
    { sol: 'EEEJEEE', max: 3, tip: 'Előre, fordulj, megint előre!' },
    { sol: 'EEJEEBEEE', max: 5, tip: 'Két fordulóra lesz szükség.' },
    { sol: 'EBEJEBEJEBEJ', max: 4, rep: true, tip: 'Lépcső! Ugyanaz ismétlődik… használd a ismétlést!' },
    { sol: 'EEJEEBEEJEEBEEJEEB', max: 5, rep: true, tip: 'Cikk-cakk. Keresd meg az ismétlődő mintát!' },
    { sol: 'EEEEEJEEEEJEEEJEEJE', max: 9, tip: 'Csiga-spirál – a nagy finálé! ' },
  ];
  let lv = 0, prog = [], repeat = 1, run = null, robot, grid, goal, cells, bounds, C, ctx, T = 0, trail = [], done = store.get('robot-done', []);
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1]; // 0 jobb, 1 le, 2 bal, 3 fel
  function build() {
    const L = LEVELS[lv]; let x = 0, y = 0, d = 0; cells = new Set(['0,0']);
    for (const c of L.sol) { if (c === 'E') { x += DX[d]; y += DY[d]; cells.add(x + ',' + y) } else if (c === 'J') d = (d + 1) % 4; else d = (d + 3) % 4 }
    goal = { x, y }; const xs = [...cells].map(s => +s.split(',')[0]), ys = [...cells].map(s => +s.split(',')[1]);
    bounds = { x0: Math.min(...xs) - 1, y0: Math.min(...ys) - 1, x1: Math.max(...xs) + 1, y1: Math.max(...ys) + 1 };
    robot = { x: 0, y: 0, d: 0, ax: 0, ay: 0, ad: 0, crash: 0, win: 0 }; trail = [];
  }
  function code() {
    const lines = ['from robot import *', ''];
    const ind = repeat > 1 ? '    ' : '';
    if (repeat > 1) lines.push(`<k>for</k> i <k>in</k> <f>range</f>(<n>${repeat}</n>):`);
    if (!prog.length) lines.push(ind + '<c># ide kerülnek a parancsok</c>');
    prog.forEach(p => lines.push(ind + (p.c === 'E' ? `<f>elore</f>(<n>${p.n}</n>)` : p.c === 'J' ? '<f>jobbra</f>()' : '<f>balra</f>()')));
    $('#ro-code').innerHTML = lines.join('\n');
    const L = LEVELS[lv]; $('#ro-cnt').innerHTML = `Sorok: <b style="color:${prog.length > L.max ? 'var(--red)' : 'var(--green)'}">${prog.length}</b> / ${L.max} `;
    $('#ro-prog').innerHTML = prog.map((p, i) => `<div class="ro-blk ${p.c}" data-i="${i}"><span>${icon(p.c === 'E' ? 'up' : p.c === 'J' ? 'turnR' : 'turnL', 18, 2.2)} ${p.c === 'E' ? 'előre' : p.c === 'J' ? 'jobbra' : 'balra'}</span>${p.c === 'E' ? `<button class="ro-n" data-i="${i}">×${p.n}</button>` : ''}<button class="ro-x" data-i="${i}" aria-label="törlés">${icon('x', 14, 2.4)}</button></div>`).join('') || '<div style="color:var(--muted);padding:8px">Kattints a parancsokra lent! </div>';
    $$('.ro-n').forEach(b => b.onclick = () => { const p = prog[+b.dataset.i]; p.n = p.n % 9 + 1; sfx.click(); code() });
    $$('.ro-x').forEach(b => b.onclick = () => { prog.splice(+b.dataset.i, 1); sfx.click(); code() });
    $('#ro-rep').innerHTML = `${icon('repeat', 18, 2)} Ismételd az egészet: ${repeat}×`; $('#ro-rep').classList.toggle('sel', repeat > 1);
  }
  function add(c) { if (run) return; const last = prog[prog.length - 1]; if (c === 'E' && last && last.c === 'E' && false) last.n++; else prog.push({ c, n: 1 }); sfx.click(); code() }
  function start() {
    if (run || !prog.length) return; build(); const steps = [];
    for (let r = 0; r < repeat; r++) for (const p of prog) { if (p.c === 'E') for (let k = 0; k < p.n; k++) steps.push('E'); else steps.push(p.c) }
    run = { steps, i: 0, t: 0 }; beep(500, .1, 'triangle', .06, 300);
  }
  function stepRun(dt) {
    if (!run) return; run.t += dt; if (run.t < .32) return; run.t = 0;
    if (robot.x === goal.x && robot.y === goal.y && run.i > 0) return win();
    if (run.i >= run.steps.length) { run = null; sfx.bad(); toast('Elfogytak a parancsok, de a robot nem ért oda. Próbáld újra!', '#fbbf24'); return }
    const s = run.steps[run.i++];
    if (s === 'E') {
      const nx = robot.x + DX[robot.d], ny = robot.y + DY[robot.d];
      if (!cells.has(nx + ',' + ny)) { robot.crash = 1; run = null; sfx.pop(); toast('Bumm! A robot falnak ütközött.', '#f87171'); return }
      trail.push([robot.x, robot.y]); robot.x = nx; robot.y = ny; beep(600, .04, 'square', .03);
    } else { robot.d = s === 'J' ? (robot.d + 1) % 4 : (robot.d + 3) % 4; beep(400, .04, 'square', .03) }
    if (robot.x === goal.x && robot.y === goal.y) win();
  }
  function win() {
    run = null; robot.win = 1; sfx.win(); FX.confetti();
    const L = LEVELS[lv], star = prog.length <= L.max; if (!done.includes(lv)) { done.push(lv); store.set('robot-done', done) }
    setTimeout(() => {
      const o = $('#ro-over'); o.style.display = 'flex';
      o.innerHTML = `<div class="card"><h2>Feltöltve!</h2><div class="big" style="display:flex;gap:6px;justify-content:center;color:var(--yellow)">${icon('star', 52, 1.6).repeat(star ? 3 : 1)}</div>
      <p>${star ? `Szuper! ${prog.length} sorból megoldottad.` : `Sikerült! De meg tudod oldani ${L.max} sorból is? Használd az ismétlést!`}</p>
      <div style="display:flex;gap:10px;justify-content:center">${lv < LEVELS.length - 1 ? '<button class="btn go" id="ro-next">KÖVETKEZŐ PÁLYA ▶</button>' : '<p><b>Az összes pályát teljesítetted! Igazi programozó vagy!</b></p>'}<button class="btn" id="ro-retry">Újra ezt</button></div>
      <div class="learn">Amit most csináltál, az egy <b>algoritmus</b>: lépések pontos sorrendje. A <b>for</b> ciklus ismétel, az <b>elore(3)</b> pedig egy <b>függvény</b>, aminek paramétert adunk. Pythonban a technikusok így automatizálják a munkájukat, például a hálózati eszközök beállítását.</div></div>`;
      $('#ro-retry').onclick = () => { o.style.display = 'none'; build() };
      const n = $('#ro-next'); if (n) n.onclick = () => { o.style.display = 'none'; setLevel(lv + 1) };
    }, 700);
  }
  function setLevel(i) { lv = i; prog = []; repeat = 1; run = null; build(); code(); levels(); $('#ro-tip').textContent = '' + LEVELS[lv].tip; $('#ro-rep').style.display = LEVELS[lv].rep || lv >= 3 ? '' : 'none' }
  function levels() { $('#ro-lv').innerHTML = LEVELS.map((_, i) => `<button class="btn ${i === lv ? 'sel' : ''}" data-l="${i}">${done.includes(i) ? '' : ''}${i + 1}</button>`).join(''); $$('[data-l]').forEach(b => b.onclick = () => setLevel(+b.dataset.l)) }
  function drawBattery(x, y, cs) {
    const w = cs * .32, h = cs * .56; ctx.save(); ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 16 + Math.sin(T * 4) * 8;
    ctx.fillStyle = '#d4d7de'; rrect(ctx, x - w * .2, y - h / 2 - 5, w * .4, 6, 2); ctx.fill(); ctx.fillStyle = '#1c1f26'; rrect(ctx, x - w / 2, y - h / 2, w, h, 6); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = '#d4d7de'; ctx.lineWidth = 2.5; ctx.stroke(); const lv = .55 + Math.sin(T * 3) * .25; ctx.fillStyle = '#4ade80'; rrect(ctx, x - w / 2 + 4, y + h / 2 - 4 - (h - 8) * lv, w - 8, (h - 8) * lv, 3); ctx.fill(); ctx.restore();
  }
  function drawBot(cs, win) {
    const s = cs * .62; ctx.fillStyle = '#9aa0ab'; ctx.fillRect(-1.5, -s * .62, 3, s * .16); ctx.fillStyle = '#f87171'; ctx.beginPath(); ctx.arc(0, -s * .64, s * .06, 0, 7); ctx.fill();
    const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2); g.addColorStop(0, '#e5e7eb'); g.addColorStop(1, '#9aa0ab'); ctx.fillStyle = g; rrect(ctx, -s / 2, -s * .46, s, s * .86, s * .2); ctx.fill();
    ctx.fillStyle = '#1c1f26'; rrect(ctx, -s * .38, -s * .32, s * .76, s * .4, s * .12); ctx.fill();
    ctx.fillStyle = win ? '#4ade80' : '#5b9dff'; for (const ex of [-s * .16, s * .16]) { ctx.beginPath(); if (win) ctx.arc(ex, -s * .1, s * .08, Math.PI, 0); else ctx.arc(ex, -s * .12, s * .07, 0, 7); ctx.fill() }
    ctx.fillStyle = '#6b7180'; rrect(ctx, -s * .22, s * .16, s * .44, s * .08, 3); ctx.fill();
  }
  function draw(dt) {
    const W = C.W, H = C.H; ctx.clearRect(0, 0, W, H);
    const gw = bounds.x1 - bounds.x0 + 1, gh = bounds.y1 - bounds.y0 + 1, cs = Math.min((W - 20) / gw, (H - 20) / gh, 90);
    const ox = (W - gw * cs) / 2 - bounds.x0 * cs, oy = (H - gh * cs) / 2 - bounds.y0 * cs;
    for (let y = bounds.y0; y <= bounds.y1; y++) for (let x = bounds.x0; x <= bounds.x1; x++) {
      const on = cells.has(x + ',' + y); ctx.fillStyle = on ? '#262a33' : '#101216';
      rrect(ctx, ox + x * cs + 2, oy + y * cs + 2, cs - 4, cs - 4, 8); ctx.fill();
      if (!on) { ctx.fillStyle = '#ffffff08'; ctx.fillRect(ox + x * cs + cs * .2, oy + y * cs + cs * .45, cs * .6, cs * .1) }
    }
    ctx.fillStyle = '#a78bfa55'; trail.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(ox + x * cs + cs / 2, oy + y * cs + cs / 2, cs * .1, 0, 7); ctx.fill() });
    ctx.font = `${cs * .6}px "Segoe UI Emoji","Noto Color Emoji",serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    drawBattery(ox + goal.x * cs + cs / 2, oy + goal.y * cs + cs / 2, cs);
    const k = Math.min(1, dt * 12); robot.ax += (robot.x - robot.ax) * k; robot.ay += (robot.y - robot.ay) * k;
    let td = robot.d * 90; while (td - robot.ad > 180) td -= 360; while (td - robot.ad < -180) td += 360; robot.ad += (td - robot.ad) * k;
    const rx = ox + robot.ax * cs + cs / 2, ry = oy + robot.ay * cs + cs / 2;
    ctx.save(); ctx.translate(rx, ry); if (robot.crash) { ctx.rotate(Math.sin(T * 30) * .2); robot.crash = Math.max(0, robot.crash - dt) }
    drawBot(cs, robot.win);
    ctx.rotate(robot.ad * Math.PI / 180); ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.moveTo(cs * .48, 0); ctx.lineTo(cs * .34, -cs * .1); ctx.lineTo(cs * .34, cs * .1); ctx.fill();
    ctx.restore();
  }
  S.build = root => {
    root.innerHTML = `<style>
      #ro-wrap{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:12px;padding:12px}
      #ro-map{position:relative;border-radius:18px;background:#0b0c0f;border:1px solid var(--line);min-height:0}
      #ro-side{display:flex;flex-direction:column;gap:10px;min-height:0;overflow:auto}
      #ro-lv{display:flex;gap:6px;flex-wrap:wrap}#ro-lv .btn{padding:6px 12px;font-size:16px}
      #ro-prog{display:flex;flex-direction:column;gap:5px;max-height:240px;overflow:auto}
      .ro-blk{display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:10px;font-weight:800;font-size:17px;border:2px solid}
      .ro-blk.E{border-color:var(--cyan);background:#12304a}.ro-blk.J{border-color:var(--orange);background:#3a2312}.ro-blk.B{border-color:var(--pink);background:#3a1230}
      .ro-blk span{flex:1;display:flex;gap:6px;align-items:center}.ro-n,.ro-x{font:inherit;font-size:15px;border-radius:8px;border:1px solid var(--line);background:#101216;color:var(--text);cursor:pointer;padding:4px 10px}
      .ro-n{color:var(--yellow)}
      #ro-btns{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}#ro-btns .btn{font-size:17px;padding:12px 4px;display:flex;gap:6px;align-items:center;justify-content:center}
      #ro-code{font-family:var(--mono);font-size:16px;background:#08090b;border-radius:12px;padding:12px;white-space:pre;color:#c9ccd3;margin:0;overflow:auto;min-height:90px}
      #ro-code k{color:#ff79c6}#ro-code f{color:#50fa7b}#ro-code n{color:#fbbf24}#ro-code c{color:#6272a4}
    </style>
    <div id="ro-wrap"><div id="ro-map"></div>
      <div id="ro-side">
        <div class="panel"><div style="display:flex;justify-content:space-between;align-items:center"><b>Pálya:</b><span id="ro-cnt"></span></div><div id="ro-lv" style="margin-top:6px"></div><div id="ro-tip" style="margin-top:6px;color:var(--yellow)"></div></div>
        <div class="panel"><b>A programod</b><div id="ro-prog" style="margin-top:6px"></div></div>
        <div id="ro-btns"><button class="btn" data-c="E">${icon('up', 18, 2.2)} előre</button><button class="btn" data-c="B">${icon('turnL', 18, 2.2)} balra</button><button class="btn" data-c="J">${icon('turnR', 18, 2.2)} jobbra</button></div>
        <button class="btn" id="ro-rep"></button>
        <div style="display:flex;gap:6px"><button class="btn go" id="ro-run" style="flex:2">▶ FUTTATÁS</button><button class="btn" id="ro-clr" style="flex:1">Törlés</button></div>
        <div><b style="font-size:14px;color:var(--muted)">Ugyanez Pythonban:</b><pre id="ro-code"></pre></div>
      </div></div><div class="big-overlay" id="ro-over" style="display:none"></div>`;
    C = makeCanvas($('#ro-map')); ctx = C.ctx;
    $$('[data-c]', root).forEach(b => b.onclick = () => add(b.dataset.c));
    $('#ro-rep').onclick = () => { if (run) return; repeat = repeat % 5 + 1; sfx.click(); code() };
    $('#ro-run').onclick = start; $('#ro-clr').onclick = () => { if (run) return; prog = []; repeat = 1; build(); code() };
    setLevel(0);
  };
  S.resize = () => C && C.resize();
  S.tick = dt => { T += dt; stepRun(dt); draw(dt) };
  return S;
})());
