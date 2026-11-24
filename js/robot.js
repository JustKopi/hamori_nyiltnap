/* ===== Programozd a robotot! – blokkos programozás, ciklus, feltétel, Python ===== */
App.add((() => {
  const S = {
    id: 'robot', icon: '', title: 'Programozd a robotot!', color: '#c084fc',
    desc: '8 pálya: rakd össze a programot blokkokból, gyűjtsd össze a kristályokat, és vezesd a robotot a töltőre! A kódot Pythonban is látod.',
    topic: 'Programozás Pythonban, algoritmusok, ciklusok, feltételek'
  };
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // K, D, Ny, É
  const LV = [
    { n: 'Első lépések', d: 0, par: 4, blocks: ['fwd', 'left', 'right'], txt: 'A robot jobbra néz. Tegyél be annyi <b>Előre</b> blokkot, hogy elérje a töltőt!', map: ['#######', '#S...G#', '#######'] },
    { n: 'Kanyar', d: 0, par: 5, blocks: ['fwd', 'left', 'right', 'rep'], txt: 'Új blokk: <b>Ismételd</b>. Ami benne van, annyiszor fut le, ahányat beállítasz. Így rövidebb lesz a program!', map: ['#######', '#S...##', '####.##', '####.##', '####G##', '#######'] },
    { n: 'Kristályok', d: 0, par: 2, blocks: ['fwd', 'left', 'right', 'rep'], txt: 'A töltő csak akkor kapcsol be, ha <b>minden kristályt</b> összeszedtél!', map: ['#########', '#S.*.*.G#', '#########'] },
    { n: 'Lépcső', d: 0, par: 6, blocks: ['fwd', 'left', 'right', 'rep'], txt: 'Keresd a <b>mintát</b>! Ami ismétlődik, azt tedd egy Ismételd blokkba.', map: ['########', '#S.#####', '##..####', '###..###', '####..##', '#####.G#', '########'] },
    { n: 'Okos robot', d: 0, par: 4, blocks: ['fwd', 'left', 'right', 'rep', 'while', 'if'], txt: 'Új blokkok: <b>Amíg nem ér célba</b> és <b>Ha fal van előtte</b>. Így a robot maga dönt! Próbáld: amíg nincs cél → ha fal van, fordulj jobbra → előre.', map: ['#######', '#S....#', '#####.#', '#G....#', '#######'] },
    { n: 'Körbe-körbe', d: 1, par: 4, blocks: ['fwd', 'left', 'right', 'rep', 'while', 'if'], txt: 'A robot most <b>lefelé</b> néz. Melyik irányba kell fordulnia a falnál?', map: ['#######', '#SG*..#', '#.###.#', '#*###*#', '#.###.#', '#.....#', '#######'] },
    { n: 'Kígyó', d: 0, par: 14, blocks: ['fwd', 'left', 'right', 'rep', 'while', 'if'], txt: 'Itt a falnál hol jobbra, hol balra kell fordulni. Használj több <b>Ismételd</b> blokkot!', map: ['#########', '#S......#', '#######.#', '#.......#', '#.#######', '#......G#', '#########'] },
    { n: 'Csigaház', d: 0, par: 4, blocks: ['fwd', 'left', 'right', 'rep', 'while', 'if'], txt: 'A nagy finálé: egy csigaház sok kristállyal. Elég 4 blokk, ha okosan programozol!', map: ['#########', '#S..*...#', '#######.#', '#..*..#.#', '#.###.#*#', '#*#G..#.#', '#.#####.#', '#..*....#', '#########'] }
  ];
  const BL = {
    fwd: { n: 'Előre', py: 'robot.elore()', c: '#5b9dff' }, left: { n: 'Fordulj balra', py: 'robot.balra()', c: '#a78bfa' }, right: { n: 'Fordulj jobbra', py: 'robot.jobbra()', c: '#a78bfa' },
    rep: { n: 'Ismételd', c: '#fbbf24', box: 1 }, while: { n: 'Amíg nem ér célba', py: 'while not robot.celnal():', c: '#fb923c', box: 1 }, if: { n: 'Ha fal van előtte', py: 'if robot.fal_elotte():', c: '#4ade80', box: 1 }
  };
  let C, ctx, lv = 0, L, grid, rb, gems, prog = [], target = null, run = null, T = 0, uid = 0, results = [], racing = false, best = 0, lvT = 0, totT = 0, msg = null;
  const mk = k => ({ id: ++uid, k, n: k === 'rep' ? 3 : 0, body: BL[k].box ? [] : null });
  function load(i) {
    lv = i; L = LV[i]; grid = L.map.map(r => r.split('')); gems = 0;
    grid.forEach((r, y) => r.forEach((c, x) => { if (c === 'S') rb = { x, y, d: L.d, ax: x, ay: y, ad: L.d * 90 }; if (c === '*') gems++ }));
    prog = []; target = null; run = null; lvT = 0; msg = null; render(); $('#rb-ov').classList.remove('show');
  }
  function resetRobot() { grid = L.map.map(r => r.split('')); gems = 0; grid.forEach((r, y) => r.forEach((c, x) => { if (c === 'S') rb = { x, y, d: L.d, ax: x, ay: y, ad: L.d * 90 }; if (c === '*') gems++ })) }
  const cell = (x, y) => (grid[y] || [])[x] || '#';
  const wallAhead = () => cell(rb.x + DIRS[rb.d][0], rb.y + DIRS[rb.d][1]) === '#';
  const atGoal = () => cell(rb.x, rb.y) === 'G' && gems === 0;
  const count = list => list.reduce((a, b) => a + 1 + (b.body ? count(b.body) : 0), 0);
  function* exec(list) {
    for (const b of list) {
      if (b.k === 'fwd' || b.k === 'left' || b.k === 'right') yield b.k;
      else if (b.k === 'rep') for (let i = 0; i < b.n; i++) yield* exec(b.body);
      else if (b.k === 'while') { let g = 0; while (!atGoal()) { if (++g > 120 || !b.body.length) { yield 'loop'; return } yield* exec(b.body); yield 'tick' } }
      else if (b.k === 'if') { if (wallAhead()) yield* exec(b.body) }
    }
  }
  function start() {
    if (run || !prog.length) { if (!prog.length) toast('Előbb rakj össze egy programot!', '#fbbf24'); return }
    resetRobot(); msg = null; run = { g: exec(prog), steps: 0, anim: 0, act: null }; sfx.click(); render();
  }
  function step() {
    const r = run.g.next(); run.steps++;
    if (r.done) return finish(atGoal());
    const a = r.value;
    if (a === 'tick') return step();
    if (a === 'loop') return finish(false, 'A ciklus nem ér véget – a robot nem jut el a célba (végtelen ciklus).');
    if (run.steps > 400) return finish(false, 'Túl sok lépés – lehet, hogy végtelen ciklus van a programban?');
    if (a === 'left') { rb.d = (rb.d + 3) % 4; beep(500, .05, 'triangle', .04) }
    if (a === 'right') { rb.d = (rb.d + 1) % 4; beep(560, .05, 'triangle', .04) }
    if (a === 'fwd') {
      const nx = rb.x + DIRS[rb.d][0], ny = rb.y + DIRS[rb.d][1];
      if (cell(nx, ny) === '#') { run.bonk = 1; beep(150, .2, 'sawtooth', .07); return finish(false, 'Bumm! A robot falnak ütközött.') }
      rb.x = nx; rb.y = ny; beep(700, .03, 'square', .03);
      if (grid[ny][nx] === '*') { grid[ny][nx] = '.'; gems--; sfx.ok(); FX.burst && 0 }
      if (cell(nx, ny) === 'G' && gems === 0) { run.anim = .25; return finish(true) }
    }
    run.anim = .28;
  }
  function finish(ok, why) {
    const r = run; run = null;
    if (ok) {
      const n = count(prog), st = n <= L.par ? 3 : n <= L.par + 3 ? 2 : 1, tb = Math.max(0, Math.round(90 - lvT)), pts = st * 100 + tb * 2;
      results[lv] = Math.max(results[lv] || 0, pts); sfx.win(); FX.confetti();
      const last = lv === LV.length - 1;
      ov(`<div class="w-k">Pálya teljesítve</div><h2>${L.n}</h2><div class="w-stars">${[1, 2, 3].map(i => icon('star', 46, 2).replace('<svg', `<svg class="${i <= st ? 'on' : ''}"`)).join('')}</div>
        <p>${n} blokkból állt a programod. ${st < 3 ? `${L.par} blokkból is megoldható – az 3 csillagot ér!` : 'Tökéletes, rövidebb nem is lehetne!'}</p><p style="font-size:14px;color:var(--muted)">${st * 100} pont + ${tb * 2} időbónusz = <b style="color:var(--text)">${pts} pont</b></p>
        <div class="w-b"><button class="btn" id="rb-re">Újra</button><button class="btn go" id="rb-nx">${last ? 'Összesítés' : 'Következő pálya'}</button></div>`);
      $('#rb-re').onclick = () => { $('#rb-ov').classList.remove('show'); resetRobot() }; $('#rb-nx').onclick = () => last ? final() : load(lv + 1);
    } else {
      msg = why || (cell(rb.x, rb.y) === 'G' ? `Még ${gems} kristály hiányzik!` : 'A program véget ért, de a robot nem ért a töltőre.'); sfx.bad();
    }
    render();
  }
  function final() {
    const tot = results.reduce((a, b) => a + (b || 0), 0); best = Math.max(best, tot);
    if (racing) { racing = false; $('#rb-ov').classList.remove('show'); Comp.finish(tot, `${LV.length} pálya, ${Math.round(totT)} másodperc`); results = []; load(0); return }
    ov(`<div class="w-k">Minden pálya kész!</div><h2>${tot} pont</h2><div class="w-tbl">${LV.map((l, i) => `<div><span>${i + 1}. ${l.n}</span><b>${results[i] || 0}</b></div>`).join('')}</div>
      <div class="learn">Ezt tanultad: <b>utasítások sorrendje</b> (algoritmus), <b>ciklus</b> (for, while) és <b>feltétel</b> (if). Ugyanezek az alapjai minden programnak, a játékoktól a hálózatautomatizálásig. A képzésben <b>Pythonban</b> programoznak.</div>
      <div class="w-b"><button class="btn go" id="rb-ag">Újrakezdés</button></div>`);
    $('#rb-ag').onclick = () => { results = []; load(0) };
  }
  function ov(h) { const o = $('#rb-ov'); o.innerHTML = `<div class="w-card">${h}</div>`; o.classList.add('show') }

  /* ---- program-szerkesztő ---- */
  function find(list, id) { for (const b of list) { if (b.id === id) return [list, b]; if (b.body) { const r = find(b.body, id); if (r) return r } } return null }
  function add(k) { if (run) return; const list = target ? (find(prog, target) || [, { body: prog }])[1].body : prog; if (count(prog) >= 40) return; list.push(mk(k)); beep(800, .04, 'triangle', .04); if (BL[k].box) target = list[list.length - 1].id; render() }
  function blockHtml(b, depth) {
    const B = BL[b.k], tgt = target === b.id;
    const head = `<div class="rb-b" style="--c:${B.c}" data-bid="${b.id}"><span class="rb-bn">${B.n}${b.k === 'rep' ? ` <button class="rb-m" data-dec="${b.id}">−</button><b>${b.n}×</b><button class="rb-m" data-inc="${b.id}">+</button>` : ''}</span><button class="rb-x" data-del="${b.id}">×</button></div>`;
    if (!b.body) return head;
    return `<div class="rb-box ${tgt ? 'tgt' : ''}" style="--c:${B.c}">${head}<div class="rb-in" data-tg="${b.id}">${b.body.map(x => blockHtml(x, depth + 1)).join('') || '<div class="rb-ph">kattints ide, majd egy blokkra</div>'}</div></div>`;
  }
  function py(list, ind = '') {
    return list.map(b => {
      if (b.k === 'rep') return `${ind}<span class="k">for</span> i <span class="k">in</span> range(${b.n}):\n${py(b.body, ind + '    ') || ind + '    pass'}`;
      if (b.body) return `${ind}${BL[b.k].py.replace(/^(while not|if)/, '<span class="k">$1</span>')}\n${py(b.body, ind + '    ') || ind + '    pass'}`;
      return `${ind}${BL[b.k].py}`;
    }).join('\n');
  }
  function render() {
    if (!$('#rb-prog')) return;
    $('#rb-lv').innerHTML = LV.map((l, i) => `<span class="${i === lv ? 'on' : results[i] ? 'done' : ''}">${i + 1}</span>`).join('');
    $('#rb-t').textContent = `${lv + 1}. pálya: ${L.n}`; $('#rb-txt').innerHTML = L.txt;
    $('#rb-pal').innerHTML = L.blocks.map(k => `<button class="rb-pb" data-add="${k}" style="--c:${BL[k].c}">${BL[k].n}</button>`).join('');
    $('#rb-prog').innerHTML = `<div class="rb-main ${!target ? 'tgt' : ''}" data-tg="0">${prog.map(b => blockHtml(b, 0)).join('') || '<div class="rb-ph">Kattints a fenti blokkokra a program összerakásához!</div>'}</div>`;
    $('#rb-py').innerHTML = `<span class="c"># ${L.n}</span>\n` + (py(prog) || '<span class="c"># (üres program)</span>');
    $('#rb-cnt').innerHTML = `${count(prog)} blokk • 3 csillaghoz: ${L.par}`;
    $('#rb-msg').innerHTML = msg ? `<div class="rb-err">${msg}</div>` : '';
    $('#rb-run').disabled = !!run;
    $$('[data-add]').forEach(e => e.onclick = () => add(e.dataset.add));
    $$('[data-tg]').forEach(e => e.onclick = ev => { if (ev.target !== e) return; target = +e.dataset.tg || null; render() });
    $$('.rb-b').forEach(e => e.onclick = ev => { if (ev.target.tagName === 'BUTTON') return; const f = find(prog, +e.dataset.bid); if (f && f[1].body) { target = f[1].id; render() } });
    $$('[data-del]').forEach(e => e.onclick = () => { if (run) return; const f = find(prog, +e.dataset.del); if (f) { f[0].splice(f[0].indexOf(f[1]), 1); if (target && !find(prog, target)) target = null; render() } });
    $$('[data-inc]').forEach(e => e.onclick = () => { const f = find(prog, +e.dataset.inc); f[1].n = Math.min(9, f[1].n + 1); render() });
    $$('[data-dec]').forEach(e => e.onclick = () => { const f = find(prog, +e.dataset.dec); f[1].n = Math.max(1, f[1].n - 1); render() });
    $('#rb-time').textContent = racing ? `Verseny: ${Math.round(totT)} mp` : '';
  }
  /* ---- rajz ---- */
  function draw() {
    const W = C.W, H = C.H; ctx.clearRect(0, 0, W, H);
    const gw = grid[0].length, gh = grid.length, s = Math.min((W - 40) / gw, (H - 40) / gh, 86), ox = (W - gw * s) / 2, oy = (H - gh * s) / 2;
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const c = grid[y][x], px = ox + x * s, py = oy + y * s;
      if (c === '#') { ctx.fillStyle = '#262a35'; rrect(ctx, px + 2, py + 2, s - 4, s - 4, 8); ctx.fill(); ctx.fillStyle = '#323745'; rrect(ctx, px + 2, py + 2, s - 4, s * .55, 8); ctx.fill(); continue }
      ctx.fillStyle = (x + y) % 2 ? '#15171d' : '#181b22'; ctx.fillRect(px, py, s, s);
      if (c === 'G') { const on = gems === 0; ctx.fillStyle = on ? 'rgba(74,222,128,.25)' : 'rgba(255,255,255,.06)'; rrect(ctx, px + 6, py + 6, s - 12, s - 12, 12); ctx.fill(); ctx.strokeStyle = on ? '#4ade80' : '#555b68'; ctx.lineWidth = 3; ctx.stroke(); drawIcon(ctx, 'bolt', px + s / 2, py + s / 2, s * .45, on ? '#4ade80' : '#6b7180', 2) }
      if (c === '*') { const b = Math.sin(T * 3 + x) * 3; ctx.save(); ctx.translate(px + s / 2, py + s / 2 + b); ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 18; ctx.fillStyle = '#67e8f9'; ctx.beginPath(); ctx.moveTo(0, -s * .26); ctx.lineTo(s * .18, 0); ctx.lineTo(0, s * .26); ctx.lineTo(-s * .18, 0); ctx.closePath(); ctx.fill(); ctx.restore() }
    }
    // robot (simított mozgás)
    const k = Math.min(1, 12 * (1 / 60)); rb.ax += (rb.x - rb.ax) * .25; rb.ay += (rb.y - rb.ay) * .25;
    let td = rb.d * 90; while (td - rb.ad > 180) td -= 360; while (td - rb.ad < -180) td += 360; rb.ad += (td - rb.ad) * .25;
    const cx = ox + rb.ax * s + s / 2, cy = oy + rb.ay * s + s / 2, r = s * .34;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rb.ad * Math.PI / 180);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, r * .9, r, r * .3, 0, 0, 7); ctx.fill();
    const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#d8b4fe'); g.addColorStop(1, '#7c3aed'); ctx.fillStyle = g; rrect(ctx, -r, -r, r * 2, r * 2, r * .45); ctx.fill();
    ctx.fillStyle = '#1e1b2e'; rrect(ctx, r * .05, -r * .62, r * .8, r * 1.24, r * .3); ctx.fill();
    ctx.fillStyle = msg ? '#f87171' : '#67e8f9'; ctx.beginPath(); ctx.arc(r * .45, -r * .3, r * .15, 0, 7); ctx.arc(r * .45, r * .3, r * .15, 0, 7); ctx.fill();
    ctx.restore();
  }
  S.build = root => {
    root.innerHTML = `<style>
      #rb-wrap{position:absolute;inset:0;display:grid;grid-template-columns:360px minmax(0,1fr) 300px;gap:12px;padding:12px}
      .rb-p{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:10px;min-height:0}
      #rb-cv{position:relative;border-radius:16px;overflow:hidden;background:#0e1014;border:1px solid var(--line)}
      #rb-lv{display:flex;gap:5px}#rb-lv span{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-weight:700;border:1px solid var(--line2);color:var(--muted);font-size:13px}
      #rb-lv span.on{background:var(--accent);color:#0b0c0f;border-color:var(--accent)}#rb-lv span.done{border-color:var(--green);color:var(--green)}
      #rb-t{font-size:18px;font-weight:800}#rb-txt{font-size:14px;color:#c9ccd3;line-height:1.45}
      #rb-pal{display:flex;flex-wrap:wrap;gap:6px}.rb-pb{border:none;cursor:pointer;font:600 14px Inter,sans-serif;color:#0b0c0f;background:var(--c);border-radius:10px;padding:8px 12px}.rb-pb:hover{filter:brightness(1.12)}
      #rb-prog{flex:1;overflow:auto;min-height:0}
      .rb-main{min-height:100%;border:2px dashed transparent;border-radius:12px;padding:6px;display:flex;flex-direction:column;gap:5px}.rb-main.tgt{border-color:#3b3f4c}
      .rb-b{display:flex;align-items:center;justify-content:space-between;background:var(--c);color:#0b0c0f;border-radius:9px;padding:6px 8px 6px 12px;font-weight:700;font-size:14px;cursor:default}
      .rb-bn{display:flex;gap:6px;align-items:center}.rb-m{border:none;background:rgba(0,0,0,.2);color:#0b0c0f;border-radius:6px;width:22px;height:22px;font-weight:800;cursor:pointer}
      .rb-x{border:none;background:rgba(0,0,0,.18);color:#0b0c0f;border-radius:6px;width:24px;height:24px;font-size:16px;font-weight:800;cursor:pointer}
      .rb-box{border-left:6px solid var(--c);border-radius:10px;background:color-mix(in srgb,var(--c) 8%,transparent)}.rb-box>.rb-b{border-radius:9px 9px 9px 0;cursor:pointer}
      .rb-box.tgt{box-shadow:0 0 0 2px var(--c)}
      .rb-in{padding:6px 0 6px 12px;display:flex;flex-direction:column;gap:5px;min-height:30px}
      .rb-ph{font-size:12.5px;color:var(--muted);padding:6px}
      #rb-py{flex:1;margin:0;font:14px/1.5 var(--mono);background:#08090b;border-radius:12px;padding:12px;overflow:auto;color:#e5e7eb;white-space:pre}#rb-py .k{color:#c084fc}#rb-py .c{color:#6b7180}
      #rb-ctl{display:flex;gap:6px}#rb-ctl .btn{flex:1;height:46px;font-size:16px}
      .rb-err{background:#2a0f14;border:1px solid #7f1d1d;color:#fca5a5;border-radius:10px;padding:8px 10px;font-size:14px}
      #rb-cnt{font-size:13px;color:var(--muted)}#rb-time{font-size:15px;font-weight:800;color:var(--yellow)}
      #rb-ov{position:absolute;inset:0;z-index:5;display:none;place-items:center;background:rgba(6,7,9,.6);backdrop-filter:blur(4px)}#rb-ov.show{display:grid}
      #st-robot .w-card{width:min(540px,92%);background:var(--panel);border:1px solid var(--line2);border-radius:22px;padding:26px 28px;text-align:center}
      #st-robot .w-card h2{margin:4px 0 10px;font-size:30px}#st-robot .w-k{font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
      #st-robot .w-stars{display:flex;justify-content:center;gap:10px;margin:8px 0}#st-robot .w-stars svg{color:#3a3f4a}#st-robot .w-stars svg.on{color:var(--yellow);fill:var(--yellow)}
      #st-robot .w-b{display:flex;gap:10px;justify-content:center;margin-top:14px}#st-robot .w-b .btn{height:46px;padding:0 20px}
      #st-robot .w-tbl{margin:12px 0;text-align:left}#st-robot .w-tbl div{display:flex;justify-content:space-between;padding:6px 4px;border-bottom:1px solid var(--line)}
    </style>
    <div id="rb-wrap">
      <div class="rb-p"><div id="rb-lv"></div><div id="rb-t"></div><div id="rb-txt"></div><div id="rb-pal"></div><div id="rb-prog"></div><div id="rb-cnt"></div></div>
      <div style="display:flex;flex-direction:column;gap:10px;min-height:0"><div id="rb-cv" style="flex:1"></div><div id="rb-msg"></div>
        <div id="rb-ctl"><button class="btn go" id="rb-run">${icon('play', 18)} Futtatás</button><button class="btn" id="rb-rs">${icon('refresh', 18)} Robot vissza</button><button class="btn" id="rb-cl">${icon('trash', 18)} Program törlése</button></div></div>
      <div class="rb-p"><b style="font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Python-kód</b><pre id="rb-py"></pre><div id="rb-time"></div>
        <div class="learn" style="margin-top:0;font-size:13px">A blokkok mögött igazi <b>Python</b>-kód van. A <b>for</b> ciklus megadott számszor ismétel, a <b>while</b> addig, amíg a feltétel igaz, az <b>if</b> pedig csak akkor fut, ha a feltétel teljesül.</div></div>
    </div><div id="rb-ov"></div>`;
    C = makeCanvas($('#rb-cv')); ctx = C.ctx;
    $('#rb-run').onclick = start; $('#rb-rs').onclick = () => { run = null; msg = null; resetRobot(); render() };
    $('#rb-cl').onclick = () => { if (run) return; prog = []; target = null; msg = null; resetRobot(); render() };
    load(0);
  };
  S.resize = () => C && C.resize();
  S.enter = () => { setTimeout(() => C && C.resize(), 30) };
  S.tick = dt => {
    T += dt; if (!C || !grid) return;
    if (!$('#rb-ov').classList.contains('show')) { lvT += dt; if (racing) totT += dt }
    if (run) { run.anim -= dt; if (run.anim <= 0) step() }
    draw(); if (racing && Math.random() < .1) $('#rb-time').textContent = `Verseny: ${Math.round(totT)} mp`;
  };
  S.comp = { rules: 'Oldd meg mind a 8 pályát egymás után! Pályánként csillag jár a rövid programért, és időbónusz a gyorsaságért. Az összpontszám kerül a ranglistára.', start: () => { racing = true; totT = 0; results = []; load(0) } };
  S.comp.live = () => racing ? results.reduce((a, b) => a + (b || 0), 0) : 0; // verseny közbeni részeredmény (élő ranglista-mentés)
  S.score = () => results.reduce((a, b) => a + (b || 0), 0) || best;
  S._dbg = { set: p => { prog = p; render() }, mk, load: i => load(i), start, get run() { return run }, get msg() { return msg } };
  return S;
})());
