/* ===== AI-labor: igazi gépi tanulás a böngészőben + önvezető autók ===== */
App.add((() => {
  const S = {
    id: 'ai', icon: '', title: 'AI-labor', color: '#22d3ee',
    desc: 'Taníts be egy neurális hálót, rajzolj, és a gép felismeri, nézd meg, hogyan jósol szót egy nyelvi modell, és figyeld, ahogy az önvezető autók megtanulnak vezetni!',
    topic: 'Mesterséges intelligencia, gépi tanulás, neurális hálók, nyelvi modellek'
  };
  let root, tab = 'learn', raf = 0;

  /* ============ 1. Tanítsd a gépet: 2D osztályozás (kNN vagy neurális háló) ============ */
  const L = { pts: [], cls: 0, model: 'nn', net: null, cv: null, ctx: null, ep: 0, acc: 0 };
  function initNet() { const r = () => (Math.random() * 2 - 1) * .8, mk = (a, b) => Array.from({ length: b }, () => Array.from({ length: a }, r)); L.net = { W1: mk(2, 12), b1: Array(12).fill(0), W2: mk(12, 12), b2: Array(12).fill(0), W3: mk(12, 1)[0], b3: 0 }; L.ep = 0 }
  function fwd(x, y) { const n = L.net, h1 = n.W1.map((w, i) => Math.tanh(w[0] * x + w[1] * y + n.b1[i])), h2 = n.W2.map((w, i) => Math.tanh(w.reduce((s, v, j) => s + v * h1[j], 0) + n.b2[i])), o = 1 / (1 + Math.exp(-(n.W3.reduce((s, v, j) => s + v * h2[j], 0) + n.b3))); return { h1, h2, o } }
  function trainStep(lr = .08) {
    const n = L.net; for (const p of L.pts) {
      const x = p.x * 2 - 1, y = p.y * 2 - 1, { h1, h2, o } = fwd(x, y), d3 = o - p.c;
      const d2 = h2.map((h, j) => d3 * n.W3[j] * (1 - h * h)); const d1 = h1.map((h, i) => d2.reduce((s, d, j) => s + d * n.W2[j][i], 0) * (1 - h * h));
      for (let j = 0; j < 12; j++) { n.W3[j] -= lr * d3 * h2[j]; for (let i = 0; i < 12; i++) n.W2[j][i] -= lr * d2[j] * h1[i]; n.b2[j] -= lr * d2[j] }
      n.b3 -= lr * d3; for (let i = 0; i < 12; i++) { n.W1[i][0] -= lr * d1[i] * x; n.W1[i][1] -= lr * d1[i] * y; n.b1[i] -= lr * d1[i] }
    } L.ep++;
  }
  function knn(x, y, k = 5) { const d = L.pts.map(p => [(p.x - x) ** 2 + (p.y - y) ** 2, p.c]).sort((a, b) => a[0] - b[0]).slice(0, k); return d.length ? d.reduce((s, v) => s + v[1], 0) / d.length : .5 }
  const pred = (x, y) => L.model === 'nn' ? fwd(x * 2 - 1, y * 2 - 1).o : knn(x, y);
  function learnDraw() {
    const c = L.ctx, W = L.cv.width, H = L.cv.height; c.fillStyle = '#0e1014'; c.fillRect(0, 0, W, H); if (L.model === 'nn' && L.pts.length > 1) for (let k = 0; k < 6; k++) trainStep();
    const G = 46; for (let gy = 0; gy < G * H / W; gy++) for (let gx = 0; gx < G; gx++) { const v = L.pts.length > 1 ? pred((gx + .5) / G, (gy + .5) / (G * H / W)) : .5; c.fillStyle = `rgba(${Math.round(56 + (251 - 56) * v)},${Math.round(189 + (146 - 189) * v)},${Math.round(248 + (60 - 248) * v)},.55)`; c.fillRect(gx * W / G, gy * W / G, W / G + 1, W / G + 1) }
    for (const p of L.pts) { c.beginPath(); c.arc(p.x * W, p.y * H, 9, 0, 7); c.fillStyle = p.c ? '#ea580c' : '#0284c7'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#ffffff'; c.stroke() }
    if (L.pts.length > 1) { L.acc = L.pts.filter(p => (pred(p.x, p.y) > .5 ? 1 : 0) === p.c).length / L.pts.length; $('#ai-l-st').innerHTML = `Pontosság: <b>${Math.round(L.acc * 100)}%</b> • ${L.pts.length} példa${L.model === 'nn' ? ` • ${L.ep} tanulókör` : ''}` }
    else $('#ai-l-st').textContent = 'Tegyél le legalább 2-2 pontot!';
  }
  function presetPts(k) {
    L.pts = []; const add = (x, y, c) => L.pts.push({ x, y, c });
    if (k === 'xor') for (let i = 0; i < 40; i++) { const x = Math.random(), y = Math.random(); add(x, y, (x > .5) !== (y > .5) ? 1 : 0) }
    if (k === 'ring') for (let i = 0; i < 60; i++) { const a = Math.random() * 6.28, r = i % 2 ? .1 + Math.random() * .12 : .3 + Math.random() * .1; add(.5 + Math.cos(a) * r, .5 + Math.sin(a) * r * 1.6, i % 2 ? 1 : 0) }
    if (k === 'line') for (let i = 0; i < 30; i++) { const x = Math.random(), y = Math.random(); add(x, y, y > x * .8 + .1 ? 1 : 0) }
    initNet();
  }

  /* ============ 2. Rajzfelismerő: kNN sok generált és saját példán ============ */
  const PI = Math.PI, TAU = PI * 2;
  const arc = (cx, cy, rx, ry, a0 = 0, a1 = TAU, n = 28) => { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]) } return p };
  const circ = (cx, cy, r) => arc(cx, cy, r, r);
  const PL = (...p) => p;
  const star = (n, r1, r2) => { const p = []; for (let i = 0; i <= n * 2; i++) { const a = -PI / 2 + i * PI / n, r = i % 2 ? r2 : r1; p.push([Math.cos(a) * r, Math.sin(a) * r]) } return p };
  // alakzatok: mindegyikhez egy vagy több rajzolási változat (vonások listája, -1..1 körüli koordinátákban)
  const SHAPES = [
    ['Kör', [() => [circ(0, 0, 1)]]],
    ['Négyzet', [() => [PL([-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1])]]],
    ['Háromszög', [() => [PL([0, -1], [1, .8], [-1, .8], [0, -1])]]],
    ['Villám', [() => [PL([.3, -1], [-.4, .1], [.3, .1], [-.3, 1])], () => [PL([.2, -1], [-.5, .15], [0, .15], [-.3, 1], [.5, -.2], [0, -.2], [.4, -1])]]],
    ['Szív', [() => { const p = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU; p.push([Math.sin(a) ** 3, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16]) } return [p] }]],
    ['Csillag', [() => { const p = []; for (let i = 0; i <= 5; i++) { const a = -PI / 2 + i * 4 * PI / 5; p.push([Math.cos(a), Math.sin(a)]) } return [p] }, () => [star(5, 1, .42)]]],
    ['Ház', [() => [PL([-.8, 1], [-.8, 0], [.8, 0], [.8, 1], [-.8, 1]), PL([-.95, .05], [0, -1], [.95, .05])], () => [PL([-.8, 1], [-.8, 0], [0, -1], [.8, 0], [.8, 1], [-.8, 1]), PL([-.2, 1], [-.2, .45], [.2, .45], [.2, 1])]]],
    ['Nap', [() => [circ(0, 0, .45), ...Array.from({ length: 8 }, (_, k) => { const a = k * TAU / 8; return PL([Math.cos(a) * .62, Math.sin(a) * .62], [Math.cos(a), Math.sin(a)]) })]]],
    ['Hold', [() => [arc(0, 0, 1, 1, PI / 2, PI * 1.5), arc(.55, 0, .95, 1, PI * 1.4, PI * .6)]]],
    ['Fa', [() => [PL([-.15, 1], [-.15, .3]), PL([.15, 1], [.15, .3]), arc(0, -.3, .75, .65)], () => [PL([0, -1], [.5, -.35], [-.5, -.35], [0, -1]), PL([0, -.6], [.75, .3], [-.75, .3], [0, -.6]), PL([0, .3], [0, 1])]]],
    ['Hal', [() => [arc(-.25, 0, .7, .45), PL([.4, 0], [1, -.45], [1, .45], [.4, 0]), circ(-.6, -.08, .06)], () => [arc(-.2, 0, .75, .5), PL([.5, -.1], [1, -.45], [1, .45], [.5, .1])]]],
    ['Mosolygó arc', [() => [circ(0, 0, 1), circ(-.35, -.3, .08), circ(.35, -.3, .08), arc(0, .05, .5, .45, PI * .15, PI * .85)]]],
    ['Felhő', [() => [arc(-.55, .05, .35, .32, PI * .5, PI * 1.5), arc(-.15, -.25, .42, .42, PI, TAU), arc(.38, -.2, .36, .36, PI * 1.05, TAU), arc(.65, .08, .3, .28, -PI / 2, PI / 2), PL([.65, .36], [-.55, .37])]]],
    ['Nyíl', [() => [PL([-1, 0], [1, 0]), PL([.5, -.5], [1, 0], [.5, .5])], () => [PL([0, 1], [0, -1]), PL([-.5, -.5], [0, -1], [.5, -.5])]]],
    ['Virág', [() => [circ(0, -.3, .22), ...Array.from({ length: 5 }, (_, k) => { const a = -PI / 2 + k * TAU / 5; return circ(Math.cos(a) * .5, -.3 + Math.sin(a) * .5, .28) }), PL([0, .5], [0, 1.3])], () => [circ(0, 0, .25), ...Array.from({ length: 6 }, (_, k) => { const a = k * TAU / 6; return circ(Math.cos(a) * .58, Math.sin(a) * .58, .33) })]]],
    ['Autó', [() => [PL([-1, .3], [-1, -.1], [-.5, -.15], [-.3, -.55], [.35, -.55], [.55, -.15], [1, -.1], [1, .3], [-1, .3]), circ(-.55, .35, .22), circ(.55, .35, .22)]]],
    ['Pálcikaember', [() => [circ(0, -.72, .26), PL([0, -.46], [0, .3]), PL([-.55, -.1], [.55, -.1]), PL([-.4, 1], [0, .3], [.4, 1])]]],
    ['Esernyő', [() => [arc(0, 0, 1, .8, PI, TAU), PL([-1, 0], [1, 0]), PL([0, 0], [0, .85]), arc(-.15, .85, .15, .15, 0, PI)]]],
    ['Gomba', [() => [arc(0, 0, 1, .85, PI, TAU), PL([-1, 0], [1, 0]), PL([-.3, 0], [-.3, .9], [.3, .9], [.3, 0]), circ(-.4, -.4, .12), circ(.3, -.5, .1)]]],
    ['Alma', [() => [arc(-.32, .1, .55, .75, PI * .4, PI * 1.6).concat(arc(.32, .1, .55, .75, -PI * .6, PI * .6)), PL([0, -.55], [.1, -1]), arc(.32, -.85, .22, .1)]]],
    ['Hóember', [() => [circ(0, .45, .55), circ(0, -.42, .35), circ(0, -.92, .2)], () => [circ(0, .4, .6), circ(0, -.55, .4)]]],
    ['Boríték', [() => [PL([-1, -.6], [1, -.6], [1, .6], [-1, .6], [-1, -.6]), PL([-1, -.6], [0, .1], [1, -.6])]]],
    ['Zászló', [() => [PL([-.6, 1], [-.6, -1]), PL([-.6, -1], [.7, -.65], [-.6, -.3])], () => [PL([-.7, 1], [-.7, -1]), PL([-.7, -1], [.8, -1], [.8, -.2], [-.7, -.2])]]],
    ['Spirál', [() => { const p = []; for (let i = 0; i <= 80; i++) { const t = i / 80, a = t * 3 * TAU; p.push([Math.cos(a) * t, Math.sin(a) * t]) } return [p] }]],
    ['Hullám', [() => { const p = []; for (let i = 0; i <= 50; i++) { const x = -1 + i / 25; p.push([x, Math.sin(x * 3 * PI) * .3]) } return [p] }]],
    ['Szemüveg', [() => [circ(-.55, 0, .38), circ(.55, 0, .38), arc(0, .02, .17, .14, PI, TAU, 8), PL([-.93, -.05], [-1.15, -.25]), PL([.93, -.05], [1.15, -.25])]]],
    ['Cica', [() => [circ(0, 0, .75), PL([-.62, -.4], [-.55, -1.05], [-.2, -.72]), PL([.2, -.72], [.55, -1.05], [.62, -.4]), circ(-.28, -.15, .07), circ(.28, -.15, .07), PL([-1, .12], [-.35, .18]), PL([-1, .35], [-.35, .3]), PL([1, .12], [.35, .18]), PL([1, .35], [.35, .3])]]],
    ['Hópehely', [() => [0, 1, 2].flatMap(k => { const a = k * PI / 3, c = Math.cos(a), s = Math.sin(a); return [PL([-c, -s], [c, s]), ...[1, -1].map(d => PL([d * c * .65 - s * .2 * d, d * s * .65 + c * .2 * d], [d * c * .85, d * s * .85], [d * c * .65 + s * .2 * d, d * s * .65 - c * .2 * d]))] })]],
    ['Plusz jel', [() => [PL([0, -1], [0, 1]), PL([-1, 0], [1, 0])]]],
    ['Hegyek', [() => [PL([-1, .8], [-.45, -.6], [-.05, .15], [.4, -1], [1, .8])]]],
    ['Madár', [() => [arc(-.5, .2, .5, .5, PI * 1.1, TAU - .05, 14).concat(arc(.5, .2, .5, .5, PI + .05, PI * 1.9, 14))]]],
    ['Fagyi', [() => [PL([-.55, -.1], [0, 1], [.55, -.1]), arc(0, -.35, .6, .5, PI * .85, PI * 2.15), PL([-.55, -.1], [.55, -.1])]]],
    ['Óra', [() => [circ(0, 0, 1), PL([0, 0], [0, -.65]), PL([0, 0], [.45, .15]), ...[0, 1, 2, 3].map(k => { const a = k * PI / 2; return PL([Math.cos(a) * .82, Math.sin(a) * .82], [Math.cos(a) * .95, Math.sin(a) * .95]) })]]],
    ['Kocka', [() => [PL([-1, -.5], [.5, -.5], [.5, 1], [-1, 1], [-1, -.5]), PL([-1, -.5], [-.5, -1], [1, -1], [1, .5], [.5, 1]), PL([.5, -.5], [1, -1])]]],
  ];
  const D = { cv: null, ctx: null, drawing: false, strokes: [], set: [], classes: SHAPES.map(s => s[0]), seeded: false, last: 0, task: null, streak: 0 };
  const N = 28, oc = document.createElement('canvas'); oc.width = oc.height = N; const ocx = oc.getContext('2d', { willReadFrequently: true });
  function blur(v) { const o = new Float32Array(N * N); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0, w = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= N || Y >= N) continue; const k = dx || dy ? (dx && dy ? .5 : 1) : 2; s += v[Y * N + X] * k; w += k } o[y * N + x] = s / w } return o }
  function vecFromStrokes(strokes) {
    const pts = strokes.flat(); if (pts.length < 2) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
    const s = Math.max(x1 - x0, y1 - y0) || 1; if (s < 1e-6) return null; const c = ocx;
    c.clearRect(0, 0, N, N); c.lineWidth = 1.7; c.lineCap = c.lineJoin = 'round'; c.strokeStyle = '#000';
    for (const st of strokes) { c.beginPath(); st.forEach(([x, y], i) => { const X = 2 + (x - x0 + (s - (x1 - x0)) / 2) / s * (N - 4), Y = 2 + (y - y0 + (s - (y1 - y0)) / 2) / s * (N - 4); i ? c.lineTo(X, Y) : c.moveTo(X, Y) }); if (st.length === 1) c.lineTo(2 + (st[0][0] - x0) / s * (N - 4) + .1, 2 + (st[0][1] - y0) / s * (N - 4)); c.stroke() }
    const d = c.getImageData(0, 0, N, N).data, v = new Float32Array(N * N); for (let i = 0; i < N * N; i++) v[i] = d[i * 4 + 3] / 255;
    const b = blur(blur(v)); let m = 0; for (let i = 0; i < b.length; i++) m += b[i] * b[i]; m = Math.sqrt(m) || 1; for (let i = 0; i < b.length; i++) b[i] /= m; return b;
  }
  // emberi rajzhoz hasonló torzítás: forgatás, nyújtás, remegés, elcsúszó vonások
  function synth(cl, k = 1) {
    const vars = SHAPES[cl][1], strokes = pick(vars)(), rot = (Math.random() - .5) * .45 * k, sx = 1 + (Math.random() - .5) * .35 * k, sy = 1 + (Math.random() - .5) * .35 * k;
    const f1 = rnd(1, 3), f2 = rnd(1, 3), ph1 = rnd(0, 6), ph2 = rnd(0, 6), amp = .05 * k;
    return strokes.map(st => { const ox = (Math.random() - .5) * .09 * k, oy = (Math.random() - .5) * .09 * k; return st.map(([x, y], i) => { const t = i / st.length * TAU; x = x * sx + Math.sin(t * f1 + ph1) * amp + ox + (Math.random() - .5) * .025 * k; y = y * sy + Math.sin(t * f2 + ph2) * amp + oy + (Math.random() - .5) * .025 * k; return [x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)] }) });
  }
  function seedSet() { if (D.seeded) return; D.seeded = true; const mine = D.set.filter(e => e.mine); D.set = []; D.classes.forEach((_, c) => { for (let i = 0; i < 26; i++) D.set.push({ c, v: vecFromStrokes(synth(c)), mine: 0 }) }); D.set.push(...mine) }
  function classify(v) {
    const sc = D.set.map(e => { let s = 0; const a = e.v; for (let i = 0; i < a.length; i++) s += a[i] * v[i]; return [s * (e.mine ? 1.03 : 1), e.c] }).sort((a, b) => b[0] - a[0]).slice(0, 9), votes = D.classes.map(() => 0);
    sc.forEach(([s, c]) => votes[c] += Math.max(0, s) ** 6); const tot = votes.reduce((a, b) => a + b, 0) || 1;
    return { best: sc[0][0], r: votes.map((x, i) => [i, x / tot]).sort((a, b) => b[1] - a[1]) };
  }
  function drawCanvas() {
    const c = D.ctx, W = D.cv.width, H = D.cv.height; c.fillStyle = '#f8fafc'; c.fillRect(0, 0, W, H); c.strokeStyle = '#0f172a'; c.lineWidth = 9; c.lineCap = c.lineJoin = 'round';
    for (const st of D.strokes) { c.beginPath(); st.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); if (st.length === 1) c.lineTo(st[0][0] + .1, st[0][1]); c.stroke() }
    if (!D.strokes.length) { c.fillStyle = '#94a3b8'; c.font = '600 20px Inter,sans-serif'; c.textAlign = 'center'; c.fillText(D.task !== null ? `Rajzolj egy: ${D.classes[D.task]}` : 'Rajzolj ide valamit!', W / 2, H / 2) }
  }
  function drawRender(force) {
    seedSet(); drawCanvas();
    const now = performance.now(); if (!force && D.drawing && now - D.last < 90) return; D.last = now;
    const v = vecFromStrokes(D.strokes), out = $('#ai-d-res');
    const taskHtml = `<div class="ai-task">${D.task !== null ? `Feladat: rajzolj egy <b>${D.classes[D.task]}</b>-t! <span>Sorozat: ${D.streak}</span>` : 'Kérj feladatot, és a gép kitalálja, mit rajzoltál!'} <button class="btn" id="ai-d-task">${D.task !== null ? 'Másik feladat' : 'Feladatot kérek'}</button></div>`;
    if (!v) { out.innerHTML = taskHtml + `<div class="ai-hint">${D.classes.length} dolgot ismerek fel:</div><div class="ai-known">${D.classes.map(n => `<span>${n}</span>`).join('')}</div>`; bindTask(); return }
    const { best, r } = classify(v), top = r[0], sure = top[1] > .55 && best > .55;
    out.innerHTML = taskHtml + `<div class="ai-guess">${sure ? 'Szerintem ez egy' : best > .45 ? 'Talán ez egy' : 'Hmm… ez talán'}: <b>${D.classes[top[0]]}</b></div>` + r.slice(0, 5).map(([i, p]) => `<div class="ai-bar"><span>${D.classes[i]}</span><i><em style="width:${p * 100}%"></em></i><b>${Math.round(p * 100)}%</b></div>`).join('') +
      `<div class="ai-teach"><span>Nem talált? Tanítsd meg, mi ez:</span><select id="ai-d-sel">${D.classes.map((n, i) => `<option value="${i}" ${i === top[0] ? 'selected' : ''}>${n}</option>`).join('')}</select><button class="btn" id="ai-d-teach">Megtanítom</button></div>`;
    $('#ai-d-teach').onclick = () => { const c = +$('#ai-d-sel').value; D.set.push({ c, v, mine: 1 }); toast(`Megtanulta! Ez egy <b>${D.classes[c]}</b>. Saját példák: ${D.set.filter(e => e.mine).length}`, '#22d3ee', 2200); D.strokes = []; drawRender(true) };
    bindTask();
    if (D.task !== null && !D.lock && !D.drawing && top[0] === D.task && top[1] > .4) { D.streak++; sfx.win(); FX.burstEl(D.cv, 40); toast(`<b>Kitaláltam: ${D.classes[D.task]}!</b> Jöhet a következő.`, '#4ade80', 2200); const prev = D.task; D.lock = true; setTimeout(() => { D.lock = false; D.strokes = []; D.task = pickTask(prev); drawRender(true) }, 1300) }
  }
  function pickTask(prev) { let t; do t = Math.floor(Math.random() * D.classes.length); while (t === prev); return t }
  function bindTask() { const b = $('#ai-d-task'); if (b) b.onclick = () => { D.task = pickTask(D.task); D.strokes = []; sfx.click(); drawRender(true) } }

  /* ============ 3. Szövegjósló: n-gram nyelvi modell ============ */
  const CORPUS = `A számítógép adatokat dolgoz fel. A számítógép programokat futtat. A számítógép az internetre csatlakozik. Az internet hálózatok hálózata. Az internet csomagokban küldi az adatokat. Az internet a routereken keresztül működik. A router továbbítja a csomagokat. A router megnézi a cél IP-címet. A router összeköti a hálózatokat. A robot követi a programot. A robot összeszedi a kristályokat. A robot eljut a töltőhöz. A mesterséges intelligencia adatokból tanul. A mesterséges intelligencia képeket ismer fel. A mesterséges intelligencia szöveget ír. A mesterséges intelligencia segít a tanulásban. A rendszergazda megjavítja a szervert. A rendszergazda telepíti a programokat. A rendszergazda védi a hálózatot. A hálózat összeköti a gépeket. A hálózat gyors és biztonságos. A jelszó legyen hosszú és erős. A jelszó védi a fiókot. A tűzfal megállítja a támadókat. A tűzfal védi a hálózatot. A programozó kódot ír. A programozó játékot fejleszt. A programozó weboldalt készít. A diák informatikát tanul. A diák hálózatot épít. A diák programot ír. A diák a nyílt napon játszik.`;
  const LM = (() => { const w = CORPUS.toLowerCase().replace(/\./g, ' .').split(/\s+/).filter(Boolean), b = {}, t = {}; for (let i = 0; i < w.length - 1; i++) { (b[w[i]] = b[w[i]] || {})[w[i + 1]] = (b[w[i]][w[i + 1]] || 0) + 1; if (i < w.length - 2) { const k = w[i] + ' ' + w[i + 1]; (t[k] = t[k] || {})[w[i + 2]] = (t[k][w[i + 2]] || 0) + 1 } } return { b, t } })();
  let words = ['a', 'számítógép'];
  function nextDist() { const k = words.slice(-2).join(' '), d = LM.t[k] || LM.b[words[words.length - 1]] || {}, tot = Object.values(d).reduce((a, b) => a + b, 0) || 1; return Object.entries(d).map(([w, c]) => [w, c / tot]).sort((a, b) => b[1] - a[1]).slice(0, 6) }
  function textRender() {
    const d = nextDist(), txt = words.join(' ').replace(/ \./g, '.').replace(/(^|\. )([a-záéíóöőúüű])/g, (m, a, b) => a + b.toUpperCase());
    $('#ai-t-out').innerHTML = `${esc(txt)}<span class="ai-cur">▌</span>`;
    $('#ai-t-next').innerHTML = d.length ? d.map(([w, p], i) => `<button class="ai-nw ${i ? '' : 'top'}" data-w="${esc(w)}"><span>${w === '.' ? '(mondat vége)' : esc(w)}</span><i><em style="width:${p * 100}%"></em></i><b>${Math.round(p * 100)}%</b></button>`).join('') : '<div class="ai-hint">Itt elfogyott a tudása – kezdj új mondatot!</div>';
    $$('[data-w]').forEach(b => b.onclick = () => { words.push(b.dataset.w); sfx.click(); textRender() });
  }
  function autoGen() { let n = 0; const st = () => { const d = nextDist(); if (!d.length || n++ > 14) return; let r = Math.random(), pick = d[0][0]; for (const [w, p] of d) { if ((r -= p) <= 0) { pick = w; break } } words.push(pick); textRender(); if (pick !== '.') setTimeout(st, 350) }; st() }

  /* ============ 4. Önvezető autók: neurális háló + evolúció (genetikus algoritmus) ============ */
  const V = { cv: null, ctx: null, nnc: null, chc: null, track: 1, gen: 1, cars: [], hist: [], speed: 1, mut: .5, t: 0, grid: null, cl: [], lead: null, bestEver: 0, msg: '', custom: null, mode: 'run', draw: null, cones: [], champ: null, race: null, keys: {} };
  const VW = 900, VH = 600, GS = 4, GW = VW / GS, GH = VH / GS, NH = 8, NO = 2, RAYL = 150;
  let POP = 40, RAYS = [-1.1, -.5, 0, .5, 1.1], NIN = 6, NW = 0;
  const RAYSETS = { 3: [-.8, 0, .8], 5: [-1.1, -.5, 0, .5, 1.1], 7: [-1.3, -.85, -.4, 0, .4, .85, 1.3] };
  function setRays(n) { RAYS = RAYSETS[n]; NIN = RAYS.length + 1; NW = NIN * NH + NH + NH * NO + NO }
  setRays(5);
  const TRK = [
    { n: 'Ovális', w: 70, f: t => 1 + .1 * Math.sin(2 * t) },
    { n: 'Kanyargós', w: 64, f: t => 1 + .17 * Math.sin(3 * t + .5) + .06 * Math.cos(5 * t) },
    { n: 'Profi pálya', w: 58, f: t => 1 + .2 * Math.sin(2 * t + 1) + .1 * Math.sin(5 * t) + .05 * Math.cos(7 * t) }
  ];
  // saját rajzolt pálya: simítás és egyenletes újramintavételezés
  function makeCustom(raw) {
    let p = raw.slice(); const n0 = p.length; if (n0 < 12) return null;
    for (let pass = 0; pass < 3; pass++) p = p.map((_, i) => { let x = 0, y = 0; for (let k = -4; k <= 4; k++) { const q = p[(i + k + n0) % n0]; x += q[0]; y += q[1] } return [x / 9, y / 9] });
    const len = []; let tot = 0; for (let i = 0; i < n0; i++) { const a = p[i], b = p[(i + 1) % n0]; len.push(tot); tot += Math.hypot(b[0] - a[0], b[1] - a[1]) }
    if (tot < 700) return null;
    const out = [], n = 360; let j = 0;
    for (let k = 0; k < n; k++) { const s = k / n * tot; while (j < n0 - 1 && len[j + 1] <= s) j++; const a = p[j], b = p[(j + 1) % n0], seg = (j + 1 < n0 ? len[j + 1] : tot) - len[j] || 1, f = (s - len[j]) / seg; out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]) }
    return out;
  }
  function buildTrack() {
    const T = V.track === 'custom' ? { w: 64 } : TRK[V.track], n = 360;
    if (V.track === 'custom') V.cl = V.custom; else { V.cl = []; for (let i = 0; i < n; i++) { const t = i / n * TAU, r = T.f(t); V.cl.push([450 + 345 * r * Math.cos(t), 300 + 222 * r * Math.sin(t)]) } }
    // rácstérkép: minden cellához a középvonaltól mért távolság és a pálya menti haladás
    const dist = new Float32Array(GW * GH), prog = new Uint16Array(GW * GH);
    for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
      const x = gx * GS + GS / 2, y = gy * GS + GS / 2; let bd = 1e9, bi = 0;
      for (let i = 0; i < n; i += 2) { const d = (V.cl[i][0] - x) ** 2 + (V.cl[i][1] - y) ** 2; if (d < bd) { bd = d; bi = i } }
      for (let i = bi - 2; i <= bi + 2; i++) { const j = (i + n) % n, d = (V.cl[j][0] - x) ** 2 + (V.cl[j][1] - y) ** 2; if (d < bd) { bd = d; bi = j } }
      dist[gy * GW + gx] = Math.sqrt(bd); prog[gy * GW + gx] = bi;
    }
    V.grid = { dist, prog, half: T.w / 2, block: new Uint8Array(GW * GH) }; V.cones = []; V.tw = T.w;
    const bg = document.createElement('canvas'); bg.width = VW; bg.height = VH; const c = bg.getContext('2d');
    c.fillStyle = '#0f2a1a'; c.fillRect(0, 0, VW, VH);
    for (let k = 0; k < 400; k++) { c.fillStyle = `rgba(74,222,128,${Math.random() * .06})`; c.fillRect(Math.random() * VW, Math.random() * VH, 3, 3) }
    const path = () => { c.beginPath(); V.cl.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath() };
    c.lineJoin = 'round'; path(); c.strokeStyle = '#f1f5f9'; c.lineWidth = T.w + 10; c.stroke();
    c.setLineDash([14, 14]); path(); c.strokeStyle = '#ef4444'; c.lineWidth = T.w + 10; c.stroke(); c.setLineDash([]);
    path(); c.strokeStyle = '#30343d'; c.lineWidth = T.w; c.stroke();
    c.setLineDash([16, 18]); path(); c.strokeStyle = '#ffffff40'; c.lineWidth = 2; c.stroke(); c.setLineDash([]);
    const [sx, sy] = V.cl[0], [nx, ny] = V.cl[3], a = Math.atan2(ny - sy, nx - sx); c.save(); c.translate(sx, sy); c.rotate(a + PI / 2);
    for (let k = -T.w / 2; k < T.w / 2; k += 8) for (let r = 0; r < 2; r++) { c.fillStyle = ((k / 8 + r) & 1) ? '#fff' : '#111'; c.fillRect(k, r * 8 - 8, 8, 8) } c.restore();
    V.bg = bg;
  }
  function rebuildCones() {
    const b = V.grid.block; b.fill(0);
    for (const k of V.cones) for (let gy = Math.max(0, (k.y - 16) / GS | 0); gy <= Math.min(GH - 1, (k.y + 16) / GS | 0); gy++) for (let gx = Math.max(0, (k.x - 16) / GS | 0); gx <= Math.min(GW - 1, (k.x + 16) / GS | 0); gx++) if (Math.hypot(gx * GS + 2 - k.x, gy * GS + 2 - k.y) < 13) b[gy * GW + gx] = 1;
  }
  const cellAt = (x, y) => { const gx = x / GS | 0, gy = y / GS | 0; return gx < 0 || gy < 0 || gx >= GW || gy >= GH ? -1 : gy * GW + gx };
  const onTrack = (x, y) => { const k = cellAt(x, y); return k >= 0 && V.grid.dist[k] < V.grid.half - 3 && !V.grid.block[k] };
  const randW = () => Float32Array.from({ length: NW }, () => (Math.random() * 2 - 1) * 1.2);
  function think(w, inp, keep) {
    let o = 0; const h = new Float32Array(NH), out = new Float32Array(NO);
    for (let j = 0; j < NH; j++) { let s = 0; for (let i = 0; i < NIN; i++) s += inp[i] * w[o + j * NIN + i]; h[j] = Math.tanh(s + w[NIN * NH + j]) } o = NIN * NH + NH;
    for (let k = 0; k < NO; k++) { let s = 0; for (let j = 0; j < NH; j++) s += h[j] * w[o + k * NH + j]; out[k] = Math.tanh(s + w[o + NH * NO + k]) }
    if (keep) keep.act = [inp, h, out]; return out;
  }
  function newCar(w) { const [x, y] = V.cl[0], [nx, ny] = V.cl[2]; return { w, x, y, a: Math.atan2(ny - y, nx - x), sp: 0, alive: true, p: 0, lastIdx: 0, best: 0, stall: 0, rays: RAYS.map(() => 1), hue: Math.random() * 360, act: null } }
  function mutate(src, amt) { const w = Float32Array.from(src); for (let i = 0; i < NW; i++) if (Math.random() < .12 + amt * .2) w[i] += (Math.random() * 2 - 1) * amt; return w }
  function newGen(fresh) {
    if (fresh) { V.gen = 1; V.hist = []; V.bestEver = 0; V.cars = Array.from({ length: POP }, () => newCar(randW())); V.t = 0; return }
    const sorted = [...V.cars].sort((a, b) => b.best - a.best), top = sorted.slice(0, Math.max(4, POP / 4 | 0)), best = sorted[0].best;
    V.hist.push(best); if (best >= V.bestEver) V.champ = Float32Array.from(sorted[0].w); V.bestEver = Math.max(V.bestEver, best);
    const next = sorted.slice(0, 4).map(c => { const n = newCar(Float32Array.from(c.w)); n.hue = c.hue; return n });
    while (next.length < POP) {
      const a = top[Math.floor(Math.random() ** 2 * top.length)], b = top[Math.floor(Math.random() ** 2 * top.length)], w = new Float32Array(NW);
      for (let i = 0; i < NW; i++) w[i] = Math.random() < .5 ? a.w[i] : b.w[i];
      const n = newCar(mutate(w, V.mut)); n.hue = (a.hue + (Math.random() - .5) * 40 + 360) % 360; next.push(n);
    }
    V.cars = next; V.gen++; V.t = 0;
    V.msg = best >= 3 ? 'Megtanult körbemenni a pályán! Tegyél le akadályokat, vagy versenyezz vele!' : best > .5 ? 'Egyre messzebb jutnak!' : 'Még tanulnak…';
  }
  function sense(c) { c.rays = RAYS.map(ra => { const a = c.a + ra, dx = Math.cos(a), dy = Math.sin(a); let d = 0; while (d < RAYL && onTrack(c.x + dx * d, c.y + dy * d)) d += 5; return Math.min(1, d / RAYL) }) }
  function progress(c) { const N = V.cl.length, k = cellAt(c.x, c.y); if (k < 0) return; const idx = V.grid.prog[k]; let d = idx - c.lastIdx; if (d > N / 2) d -= N; if (d < -N / 2) d += N; c.p += d / N; c.lastIdx = idx }
  function drive(c, steer, gas, dt) { c.sp += (gas * 220 - c.sp) * Math.min(1, dt * 2.5); c.sp = Math.max(25, c.sp); c.a += steer * 3 * dt; c.x += Math.cos(c.a) * c.sp * dt; c.y += Math.sin(c.a) * c.sp * dt }
  function step(dt) {
    if (V.race) return raceStep(dt);
    for (const c of V.cars) {
      if (!c.alive) continue;
      sense(c); const o = think(c.w, [...c.rays, c.sp / 220], null); drive(c, o[0], (o[1] + 1) / 2, dt);
      if (!onTrack(c.x, c.y)) { c.alive = false; continue }
      progress(c);
      if (c.p > c.best + .002) { c.best = c.p; c.stall = 0 } else if ((c.stall += dt) > 2) c.alive = false;
      if (c.best >= 3) c.alive = false;
    }
    V.t += dt;
    if (!V.cars.some(c => c.alive) || V.t > 40) newGen(false);
  }
  /* ---- verseny: te a bajnok ellen ---- */
  function raceStart() {
    const w = V.champ || [...V.cars].sort((a, b) => b.best - a.best)[0].w;
    const ai = newCar(Float32Array.from(w)), me = newCar(null); me.me = true;
    const off = (c, d) => { const [x, y] = V.cl[0], [nx, ny] = V.cl[2], a = Math.atan2(ny - y, nx - x); c.x += Math.cos(a + PI / 2) * d; c.y += Math.sin(a + PI / 2) * d };
    off(ai, -V.tw * .22); off(me, V.tw * .22);
    V.race = { ai, me, t: -3, done: null }; V.mode = 'race'; vehUi(); V.cv.focus && V.cv.focus();
  }
  function raceStep(dt) {
    const R = V.race; R.t += dt; if (R.t < 0 || R.done) return;
    const { ai, me } = R;
    sense(ai); const o = think(ai.w, [...ai.rays, ai.sp / 220], null); const ox = ai.x, oy = ai.y, oa = ai.a; drive(ai, o[0], (o[1] + 1) / 2, dt);
    if (!onTrack(ai.x, ai.y)) { ai.x = ox; ai.y = oy; ai.a = oa + .4; ai.sp = 30 } progress(ai);
    const K = V.keys, steer = (K.right ? 1 : 0) - (K.left ? 1 : 0), gas = K.up ? 1 : K.down ? .05 : .35;
    const px0 = me.x, py0 = me.y; drive(me, steer * .9, gas, dt); sense(me);
    if (!onTrack(me.x, me.y)) { me.x = px0; me.y = py0; me.sp = 30; if (!R.bump || R.t - R.bump > .4) { beep(160, .08, 'square', .04); R.bump = R.t } } progress(me);
    const LAPS = 2;
    if (!R.done && (me.p >= LAPS || ai.p >= LAPS)) {
      R.done = me.p >= LAPS ? 'me' : 'ai'; R.time = R.t;
      if (R.done === 'me') { sfx.win(); FX.confetti(); toast(`<b>Legyőzted az AI-t!</b> Idő: ${R.t.toFixed(1).replace('.', ',')} mp. Tanítsd tovább, és próbáld újra!`, '#4ade80', 4000) }
      else { sfx.bad(); toast('<b>Az AI nyert!</b> Gyakorolj még – vagy állítsd le a tanítást korábban, hogy könnyebb ellenfél legyen.', '#fbbf24', 4000) }
    }
  }
  function raceStop() { V.race = null; V.mode = 'run'; V.keys = {}; vehUi() }
  function carShape(c, x, y, a, col, glow) {
    c.save(); c.translate(x, y); c.rotate(a); if (glow) { c.shadowColor = col; c.shadowBlur = 18 }
    c.fillStyle = col; c.fillRect(-13, -7, 26, 14); c.shadowBlur = 0; c.fillStyle = '#0b0c10'; c.fillRect(2, -5, 7, 10); c.fillStyle = '#fef08a'; c.fillRect(11, -6, 2, 3); c.fillRect(11, 3, 2, 3); c.restore();
  }
  function rays(c, car) { RAYS.forEach((ra, i) => { const a = car.a + ra, d = car.rays[i] * RAYL; c.strokeStyle = car.rays[i] < .35 ? '#f87171' : '#fde047'; c.globalAlpha = .8; c.lineWidth = 2; c.beginPath(); c.moveTo(car.x, car.y); c.lineTo(car.x + Math.cos(a) * d, car.y + Math.sin(a) * d); c.stroke(); c.beginPath(); c.arc(car.x + Math.cos(a) * d, car.y + Math.sin(a) * d, 4, 0, TAU); c.fillStyle = c.strokeStyle; c.fill() }); c.globalAlpha = 1 }
  function hud(c, l1, l2) { c.globalAlpha = 1; c.fillStyle = '#0b0c10cc'; c.fillRect(12, 12, 330, 64); c.fillStyle = '#fff'; c.font = '800 24px Inter,sans-serif'; c.textAlign = 'left'; c.fillText(l1, 24, 42); c.font = '600 15px Inter,sans-serif'; c.fillStyle = '#cbd5e1'; c.fillText(l2, 24, 64) }
  function vehDraw() {
    if (!V.ctx) return; const c = V.ctx; c.drawImage(V.bg, 0, 0);
    for (const k of V.cones) { c.fillStyle = '#f97316'; c.beginPath(); c.moveTo(k.x, k.y - 13); c.lineTo(k.x + 10, k.y + 10); c.lineTo(k.x - 10, k.y + 10); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.fillRect(k.x - 6, k.y - 1, 12, 4) }
    if (V.mode === 'draw') {
      c.fillStyle = '#0b0c10b0'; c.fillRect(0, 0, VW, VH); const p = V.draw || [];
      if (p.length > 1) { c.strokeStyle = '#22d3ee'; c.lineWidth = 50; c.globalAlpha = .35; c.lineJoin = c.lineCap = 'round'; c.beginPath(); p.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.globalAlpha = 1; c.lineWidth = 3; c.stroke() }
      c.fillStyle = '#fff'; c.font = '800 26px Inter,sans-serif'; c.textAlign = 'center'; c.fillText('Rajzolj egy körpályát egy vonással!', VW / 2, 48); c.font = '600 16px Inter,sans-serif'; c.fillStyle = '#cbd5e1'; c.fillText('Nagy, kerek ív legyen; a végét a kezdőpontja közelében engedd fel.', VW / 2, 74);
      return;
    }
    if (V.race) {
      const R = V.race; rays(c, R.me); carShape(c, R.ai.x, R.ai.y, R.ai.a, '#22d3ee', true); carShape(c, R.me.x, R.me.y, R.me.a, '#f472b6', true);
      c.font = '800 13px Inter,sans-serif'; c.textAlign = 'center'; c.fillStyle = '#22d3ee'; c.fillText('AI', R.ai.x, R.ai.y - 16); c.fillStyle = '#f472b6'; c.fillText('TE', R.me.x, R.me.y - 16);
      hud(c, R.t < 0 ? `Rajt: ${Math.ceil(-R.t)}` : R.done ? (R.done === 'me' ? 'Nyertél!' : 'Az AI nyert!') : `${Math.max(0, R.t).toFixed(1).replace('.', ',')} mp`, `Te: ${Math.round(Math.max(0, R.me.p) / 2 * 100)}% • AI: ${Math.round(Math.max(0, R.ai.p) / 2 * 100)}% (2 kör)`);
      if (R.t < 0) { c.fillStyle = '#fff'; c.font = '900 110px Inter,sans-serif'; c.textAlign = 'center'; c.globalAlpha = .9; c.fillText(Math.ceil(-R.t), VW / 2, VH / 2 + 40); c.globalAlpha = 1 }
      V.lead = R.ai; think(R.ai.w, [...R.ai.rays, R.ai.sp / 220], R.ai); nnDraw(); return;
    }
    const alive = V.cars.filter(x => x.alive), lead = (alive.length ? alive : V.cars).reduce((a, b) => b.best > a.best ? b : a, V.cars[0]); V.lead = lead;
    for (const car of V.cars) {
      if (car === lead) continue;
      c.save(); c.translate(car.x, car.y); c.rotate(car.a); c.globalAlpha = car.alive ? .85 : .18;
      c.fillStyle = `hsl(${car.hue},80%,60%)`; c.fillRect(-10, -5, 20, 10); c.fillStyle = '#0b0c10aa'; c.fillRect(1, -4, 5, 8); c.restore();
    }
    c.globalAlpha = 1;
    if (lead) { if (lead.alive) rays(c, lead); carShape(c, lead.x, lead.y, lead.a, '#22d3ee', true); think(lead.w, [...lead.rays, lead.sp / 220], lead) }
    hud(c, `${V.gen}. generáció`, `Úton: ${alive.length}/${POP} autó • legjobb: ${Math.round((lead ? lead.best : 0) * 100)}% kör`);
    if (V.mode === 'cone') { c.fillStyle = '#f97316'; c.font = '800 16px Inter,sans-serif'; c.textAlign = 'right'; c.fillText('Akadály mód: kattints a pályára!', VW - 16, 32) }
    nnDraw(); chartDraw();
    const st = $('#ai-v-st'); if (st) { const h = `<b>${V.gen}.</b> generáció • rekord: <b>${Math.round(V.bestEver * 100)}%</b> kör${V.msg ? `<br><span>${V.msg}</span>` : ''}`; if (st._h !== h) st.innerHTML = st._h = h }
  }
  function nnDraw() {
    const cv = V.nnc, lead = V.lead; if (!cv || !lead || !lead.act) return; const c = cv.getContext('2d'), W = cv.width, H = cv.height; c.clearRect(0, 0, W, H);
    const L3 = [NIN, NH, NO], xs = [62, W / 2, W - 60], pos = L3.map((n, l) => Array.from({ length: n }, (_, i) => [xs[l], (i + 1) * H / (n + 1)])), w = lead.w, act = lead.act;
    const ln = (v, a, b) => { c.strokeStyle = v > 0 ? `rgba(74,222,128,${Math.min(.8, Math.abs(v) * .35)})` : `rgba(248,113,113,${Math.min(.8, Math.abs(v) * .35)})`; c.lineWidth = 1 + Math.min(3, Math.abs(v)); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke() };
    for (let j = 0; j < NH; j++) for (let i = 0; i < NIN; i++) ln(w[j * NIN + i], pos[0][i], pos[1][j]);
    const o = NIN * NH + NH; for (let k = 0; k < NO; k++) for (let j = 0; j < NH; j++) ln(w[o + k * NH + j], pos[1][j], pos[2][k]);
    const inl = RAYS.map(r => r < -.9 ? 'bal' : r < -.1 ? 'bal-elő' : r > .9 ? 'jobb' : r > .1 ? 'jobb-elő' : 'előre').concat(['sebesség']), lab = [inl, [], ['kormány', 'gáz']];
    pos.forEach((ly, l) => ly.forEach(([x, y], i) => { const a = act[l][i], v = l === 0 ? a : (a + 1) / 2; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fillStyle = `rgba(34,211,238,${.15 + .85 * Math.max(0, Math.min(1, v))})`; c.fill(); c.strokeStyle = '#22d3ee'; c.lineWidth = 1.5; c.stroke(); if (lab[l][i]) { c.fillStyle = '#cbd5e1'; c.font = '600 10px Inter,sans-serif'; c.textAlign = l === 0 ? 'right' : 'left'; c.fillText(lab[l][i], l === 0 ? x - 12 : x + 12, y + 4) } }));
  }
  function chartDraw() {
    const cv = V.chc; if (!cv) return; const c = cv.getContext('2d'), W = cv.width, H = cv.height; c.clearRect(0, 0, W, H);
    c.fillStyle = '#94a3b8'; c.font = '600 11px Inter,sans-serif'; c.textAlign = 'left'; c.fillText('Legjobb autó generációnként (kör)', 4, 12);
    const h = V.hist.slice(-30); if (!h.length) return; const mx = Math.max(1, ...h), bw = (W - 8) / 30;
    h.forEach((v, i) => { const bh = v / mx * (H - 24); c.fillStyle = v >= 1 ? '#4ade80' : '#22d3ee'; c.fillRect(4 + i * bw, H - bh, bw - 2, bh) });
  }
  function vehTick(dt) { if (V.mode !== 'draw') { const n = V.race ? 1 : V.speed; for (let k = 0; k < n; k++) step(1 / 60) } vehDraw() }
  function vehInit() { if (!V.grid) { buildTrack(); newGen(true) } }
  const vehPos = e => { const r = V.cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * VW, (e.clientY - r.top) / r.height * VH] };
  function vehUi() {
    $$('[data-vm]').forEach(b => b.classList.toggle('sel', b.dataset.vm === V.mode));
    $('#ai-v-race').style.display = V.race ? '' : 'none'; $('#ai-v-main').style.display = V.race ? 'none' : '';
    V.cv.style.cursor = V.mode === 'draw' ? 'crosshair' : V.mode === 'cone' ? 'copy' : 'default';
  }
  function vehHtml() {
    return `<div class="ai-pane" data-p="cars" style="display:none"><div class="ai-cvw"><canvas id="ai-v-cv" width="900" height="600" tabindex="0" style="cursor:default;outline:none"></canvas>
        <div id="ai-v-race" style="display:none"><div class="ai-vpad"><button class="btn" data-vk="left">${icon('back', 26, 2.4)}</button><button class="btn go" data-vk="up">GÁZ</button><button class="btn" data-vk="right" style="transform:scaleX(-1)">${icon('back', 26, 2.4)}</button></div>
          <div class="ai-vrh">Nyilak vagy W, A, D: vezetés • <button class="btn" id="ai-v-again">Új verseny</button> <button class="btn" id="ai-v-stop">Vissza a tanításhoz</button></div></div></div>
        <div class="ai-side"><h3>Önvezető autók</h3><div>Az autóknak senki nem mondja meg, hogyan kell vezetni! Mindegyikben egy kis <b>neurális háló</b> dönt a kormányról és a gázról. Aki a legmesszebb jut, annak az „agyát” továbbörökítjük – így generációról generációra ügyesebbek lesznek.</div>
          <div id="ai-v-st"></div>
          <div id="ai-v-main" style="display:flex;flex-direction:column;gap:10px">
          <button class="btn go" id="ai-v-racebtn" style="height:46px;font-size:16px">${icon('trophy', 18)} Versenyezz a bajnokkal!</button>
          <div class="ai-vh">Sebesség</div><div class="row">${[1, 4, 12].map(v => `<button class="btn ${v === 1 ? 'sel' : ''}" data-vs="${v}">${v}×</button>`).join('')}</div>
          <div class="ai-vh">Pálya</div><div class="row">${TRK.map((t, i) => `<button class="btn ${i === 1 ? 'sel' : ''}" data-vt="${i}">${t.n}</button>`).join('')}</div>
          <div class="row"><button class="btn" data-vm="draw">${icon('hand', 15)} Saját pálya rajzolása</button><button class="btn" data-vm="cone">Akadályok (bóják)</button></div>
          <div class="ai-vh">Az autók agya</div>
          <div class="row"><span class="ai-vl">Érzékelők:</span>${[3, 5, 7].map(n => `<button class="btn ${n === 5 ? 'sel' : ''}" data-vr="${n}">${n}</button>`).join('')}</div>
          <div class="row"><span class="ai-vl">Autók száma:</span>${[20, 40, 80].map(n => `<button class="btn ${n === 40 ? 'sel' : ''}" data-vp="${n}">${n}</button>`).join('')}</div>
          <div style="font-size:13px;color:var(--muted)">Mutáció (mennyit változzon az utódok agya): <b id="ai-v-mv">közepes</b></div><input type="range" id="ai-v-mut" min="1" max="10" value="5" style="width:100%">
          <div class="row"><button class="btn" id="ai-v-save">Bajnok mentése</button><button class="btn" id="ai-v-load">Bajnok betöltése</button></div>
          <div class="row"><button class="btn" id="ai-v-rs">Újrakezdés nulláról</button></div></div>
          <div style="font-size:13px;color:var(--muted)">A vezető autó (türkiz) agya élőben – zöld: erősítő, piros: gátló kapcsolat:</div>
          <canvas id="ai-v-nn" width="300" height="210" style="width:100%;background:var(--bg2);border-radius:12px"></canvas>
          <canvas id="ai-v-ch" width="300" height="90" style="width:100%"></canvas>
          <div class="learn" style="margin-top:0">Ez a <b>genetikus algoritmus</b>: a természetes kiválasztódást utánozza. Kíváncsi vagy, mennyire <b>általánosít</b>? Taníts be egy bajnokot, majd válts pályát, vagy tegyél le bóját – a jól betanult agy új helyzetben is boldogul! A valódi önvezető autók is neurális hálókkal „látnak”, csak sokkal több érzékelővel.</div></div></div>`;
  }
  function vehBind(r) {
    V.cv = $('#ai-v-cv'); V.ctx = V.cv.getContext('2d'); V.nnc = $('#ai-v-nn'); V.chc = $('#ai-v-ch');
    const restart = msg => { newGen(true); V.msg = msg || ''; V.champ = null };
    $$('[data-vs]', r).forEach(b => b.onclick = () => { V.speed = +b.dataset.vs; $$('[data-vs]').forEach(x => x.classList.toggle('sel', x === b)); sfx.click() });
    const keepBrains = msg => { const keep = V.cars; if (keep.length && keep[0].w.length === NW) { V.cars = keep.map(c => { const n = newCar(c.w); n.hue = c.hue; return n }); V.t = 0; V.msg = msg } else newGen(true) };
    $$('[data-vt]', r).forEach(b => b.onclick = () => { V.track = +b.dataset.vt; V.mode = 'run'; $$('[data-vt]').forEach(x => x.classList.toggle('sel', x === b)); buildTrack(); keepBrains('Új pálya: vajon az eddig tanult agy itt is működik?'); vehUi(); sfx.click() });
    $$('[data-vm]', r).forEach(b => b.onclick = () => { V.mode = V.mode === b.dataset.vm ? 'run' : b.dataset.vm; V.draw = null; vehUi(); sfx.click(); if (V.mode === 'cone') toast('Kattints a pályára: bója kerül oda. Bójára kattintva eltűnik.', '#f97316', 2600) });
    $$('[data-vr]', r).forEach(b => b.onclick = () => { setRays(+b.dataset.vr); $$('[data-vr]').forEach(x => x.classList.toggle('sel', x === b)); restart(`${b.dataset.vr} érzékelővel újratanul. Több érzékelő = több információ, de nagyobb agy.`); sfx.click() });
    $$('[data-vp]', r).forEach(b => b.onclick = () => { POP = +b.dataset.vp; $$('[data-vp]').forEach(x => x.classList.toggle('sel', x === b)); restart(`${POP} autó: több autó = több esély a jó ötletre, de lassabb.`); sfx.click() });
    $('#ai-v-mut').oninput = e => { V.mut = +e.target.value / 10; $('#ai-v-mv').textContent = V.mut < .35 ? 'kicsi' : V.mut < .7 ? 'közepes' : 'nagy' };
    $('#ai-v-rs').onclick = () => { restart(''); sfx.click() };
    $('#ai-v-save').onclick = () => { if (!V.champ) { toast('Még nincs bajnok: várj legalább egy generációt!', '#fbbf24'); return } store.set('aichamp', { r: RAYS.length, w: Array.from(V.champ) }); toast('Bajnok elmentve ezen a gépen.', '#4ade80') };
    $('#ai-v-load').onclick = () => { const s = store.get('aichamp', null); if (!s) { toast('Nincs még mentett bajnok.', '#fbbf24'); return } setRays(s.r); $$('[data-vr]').forEach(x => x.classList.toggle('sel', +x.dataset.vr === s.r)); const w = Float32Array.from(s.w); V.champ = w; V.cars = Array.from({ length: POP }, (_, i) => newCar(i < 4 ? Float32Array.from(w) : mutate(w, V.mut * .5))); V.t = 0; V.msg = 'A mentett bajnok és az utódai vezetnek.'; toast('Bajnok betöltve!', '#4ade80') };
    $('#ai-v-racebtn').onclick = () => { if (!V.champ && V.bestEver < .3) { toast('Előbb tanítsd egy kicsit: várd meg, amíg egy autó legalább a pálya harmadáig eljut!', '#fbbf24', 3200); return } raceStart() };
    $('#ai-v-again').onclick = raceStart; $('#ai-v-stop').onclick = raceStop;
    $$('[data-vk]', r).forEach(b => { const k = b.dataset.vk; b.onpointerdown = e => { e.preventDefault(); V.keys[k] = true; b.setPointerCapture(e.pointerId) }; b.onpointerup = b.onpointercancel = () => { V.keys[k] = false } });
    const km = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
    addEventListener('keydown', e => { if (!V.race || !km[e.key]) return; V.keys[km[e.key]] = true; e.preventDefault() });
    addEventListener('keyup', e => { if (km[e.key]) V.keys[km[e.key]] = false });
    V.cv.addEventListener('pointerdown', e => {
      const [x, y] = vehPos(e);
      if (V.mode === 'draw') { V.draw = [[x, y]]; V.cv.setPointerCapture(e.pointerId); return }
      if (V.mode === 'cone') { const i = V.cones.findIndex(k => Math.hypot(k.x - x, k.y - y) < 18); if (i >= 0) V.cones.splice(i, 1); else { const k = cellAt(x, y); if (k < 0 || V.grid.dist[k] > V.grid.half) { toast('A bóját a pályára tedd!', '#fbbf24', 1400); return } if (Math.hypot(x - V.cl[0][0], y - V.cl[0][1]) < 60) { toast('A rajtvonalra ne tegyél bóját!', '#fbbf24', 1400); return } V.cones.push({ x, y }); beep(700, .05, 'triangle', .04) } rebuildCones() }
    });
    V.cv.addEventListener('pointermove', e => { if (V.mode === 'draw' && V.draw) { const [x, y] = vehPos(e), l = V.draw[V.draw.length - 1]; if (Math.hypot(x - l[0], y - l[1]) > 6) V.draw.push([x, y]) } });
    V.cv.addEventListener('pointerup', () => {
      if (V.mode !== 'draw' || !V.draw) return; const p = V.draw; V.draw = null;
      const cl = makeCustom(p.map(([x, y]) => [clamp(x, 45, VW - 45), clamp(y, 45, VH - 45)]));
      if (!cl) { toast('Túl rövid pálya – rajzolj egy nagyobb kört!', '#fbbf24', 2200); return }
      V.custom = cl; V.track = 'custom'; V.mode = 'run'; $$('[data-vt]').forEach(x => x.classList.remove('sel')); buildTrack(); keepBrains('Saját pálya! Vajon boldogulnak rajta?'); vehUi(); sfx.ok();
    });
  }

  /* ============ felület ============ */
  function setTab(t) {
    tab = t; $$('[data-at]').forEach(b => b.classList.toggle('sel', b.dataset.at === t)); $$('.ai-pane').forEach(p => p.style.display = p.dataset.p === t ? '' : 'none');
    if (t === 'draw') drawRender(); if (t === 'text') textRender(); if (t === 'cars') vehInit();
  }
  S.build = r => {
    root = r;
    r.innerHTML = `<style>
      #ai{position:absolute;inset:0;overflow:auto;padding:16px 20px}
      #ai-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}#ai-tabs .btn{height:42px;font-size:15px;display:inline-flex;gap:7px;align-items:center}
      .ai-pane{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px}@media(max-width:900px){.ai-pane{grid-template-columns:1fr}}
      .ai-side{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:10px;font-size:14.5px;line-height:1.5}
      .ai-side h3{margin:0;font-size:19px}.ai-side .row{display:flex;gap:6px;flex-wrap:wrap}.ai-side .row .btn{flex:1;height:38px;font-size:14px}.ai-side .row.ai-st .btn{flex:0 1 auto;height:auto;min-height:36px;padding:6px 12px;white-space:normal;line-height:1.25;text-align:left}
      .ai-cvw{position:relative;border-radius:16px;overflow:hidden;border:1px solid var(--line);background:#0e1014}.ai-cvw canvas{display:block;width:100%;cursor:crosshair;touch-action:none}
      #ai-l-st{font-size:16px}.ai-hint{color:var(--muted);font-size:15px;line-height:1.5}
      .ai-guess{font-size:22px;margin-bottom:8px}.ai-guess b{color:var(--accent)}
      .ai-bar{display:grid;grid-template-columns:90px 1fr 46px;gap:8px;align-items:center;font-size:14px;margin:4px 0}.ai-bar i{height:10px;background:var(--panel2);border-radius:5px;overflow:hidden}.ai-bar em{display:block;height:100%;background:var(--accent)}.ai-bar b{text-align:right}
      .ai-teach{margin-top:10px;font-size:13px;color:var(--muted);display:flex;flex-wrap:wrap;gap:5px;align-items:center}.ai-teach .btn{height:32px;font-size:13px;padding:0 12px}.ai-teach select{height:32px;border-radius:8px;background:var(--bg2);color:var(--text);border:1px solid var(--line2);padding:0 8px;font:inherit}
      .ai-task{display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:color-mix(in srgb,var(--accent) 10%,transparent);border:1px solid color-mix(in srgb,var(--accent) 35%,transparent);border-radius:12px;padding:8px 10px;font-size:15px;margin-bottom:10px}.ai-task b{color:var(--accent)}.ai-task span{color:var(--muted);font-size:13px}.ai-task .btn{height:34px;font-size:13.5px;margin-left:auto}
      .ai-known{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}.ai-known span{font-size:13px;background:var(--panel2);border:1px solid var(--line);border-radius:999px;padding:3px 10px}
      #ai-v-st{font-size:16px}#ai-v-st span{color:var(--green);font-size:14px}
      .ai-vh{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:-4px}.ai-vl{font-size:13px;color:var(--muted);align-self:center;min-width:92px}
      #ai-v-race{position:absolute;right:10px;top:10px;padding:10px;display:flex;flex-direction:column;align-items:center;gap:8px;background:#0b0c10d0;border:1px solid var(--line2);border-radius:16px;max-width:330px}
      #ai-v-cv{max-height:calc(100vh - 170px);width:auto!important;max-width:100%;margin:0 auto}.ai-vpad{display:flex;gap:14px}.ai-vpad .btn{width:96px;height:64px;font-size:18px;touch-action:none;user-select:none}.ai-vrh{font-size:13px;color:#cbd5e1;display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center}.ai-vrh .btn{height:32px;font-size:13px}
      #ai-t-out{font-size:26px;line-height:1.45;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px;min-height:140px}.ai-cur{color:var(--accent);animation:aiB 1s steps(2) infinite}@keyframes aiB{50%{opacity:0}}
      #ai-t-next{display:flex;flex-direction:column;gap:6px;margin-top:12px}
      .ai-nw{all:unset;cursor:pointer;display:grid;grid-template-columns:200px 1fr 50px;gap:10px;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:9px 12px;font-size:16px}.ai-nw:hover{border-color:var(--accent)}.ai-nw.top{border-color:color-mix(in srgb,var(--accent) 50%,var(--line))}
      .ai-nw i{height:10px;background:var(--panel2);border-radius:5px;overflow:hidden}.ai-nw em{display:block;height:100%;background:var(--accent)}.ai-nw b{text-align:right}
      #ai-c-log{height:min(56vh,560px);overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:10px}
      .ai-m{display:flex;gap:8px;max-width:86%;font-size:16px;line-height:1.5}.ai-m div{padding:10px 14px;border-radius:14px;background:var(--panel2)}.ai-m.user{align-self:flex-end}.ai-m.user div{background:color-mix(in srgb,var(--accent) 22%,var(--panel2))}
      .ai-av{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--accent) 18%,transparent);color:var(--accent);flex:none}
      #ai-c-f{display:flex;gap:8px;margin-top:10px}#ai-c-in{flex:1;font-size:17px;padding:12px 14px;border-radius:12px;border:2px solid var(--line);background:#101216;color:var(--text)}#ai-c-go{height:50px;padding:0 22px}
      .ai-sug{display:flex;flex-wrap:wrap;gap:6px}.ai-sug .btn{height:auto;min-height:34px;font-size:13px;text-align:left;white-space:normal}
    </style>
    <div id="ai"><div id="ai-tabs"><button class="btn sel" data-at="learn">${icon('activity', 16)} Tanítsd a gépet</button><button class="btn" data-at="draw">${icon('eye', 16)} Rajzfelismerő</button><button class="btn" data-at="text">${icon('code', 16)} Szövegjósló</button><button class="btn" data-at="cars">${icon('rocket', 16)} Önvezető autók</button></div>
      <div class="ai-pane" data-p="learn"><div class="ai-cvw"><canvas id="ai-l-cv" width="900" height="560"></canvas></div>
        <div class="ai-side"><h3>Tanítsd a gépet!</h3><div>Kattints a táblára, és tegyél le <b style="color:#38bdf8">kék</b> és <b style="color:#fb923c">narancs</b> pontokat. A gép <b>élőben tanul</b>, és kiszínezi, szerinte hol melyik szín van.</div>
          <div class="row"><button class="btn sel" data-lc="0" style="color:#38bdf8">Kék pont</button><button class="btn" data-lc="1" style="color:#fb923c">Narancs pont</button></div>
          <div class="row"><button class="btn sel" data-lm="nn">Neurális háló</button><button class="btn" data-lm="knn">Legközelebbi szomszéd</button></div>
          <div class="row"><button class="btn" data-lp="line">Egyenes</button><button class="btn" data-lp="ring">Gyűrű</button><button class="btn" data-lp="xor">Sakktábla</button><button class="btn" data-lp="clr">Törlés</button></div>
          <div id="ai-l-st"></div>
          <div class="learn" style="margin-top:0">Ez <b>igazi gépi tanulás</b>: egy 2 rejtett rétegű, 24 neuronos <b>neurális háló</b> fut a böngésződben, és minden körben egy kicsit javít a súlyain (visszaterjesztés). A gyűrűt és a sakktáblát egy egyenes vonal nem tudná szétválasztani – a háló mégis megtanulja!</div></div></div>
      <div class="ai-pane" data-p="draw" style="display:none"><div class="ai-cvw" style="max-width:560px"><canvas id="ai-d-cv" width="560" height="560"></canvas></div>
        <div class="ai-side"><h3>Rajzfelismerő</h3><div id="ai-d-res"></div><button class="btn" id="ai-d-clr">${icon('trash', 16)} Törlés</button>
          <div class="learn" style="margin-top:0">A gép a rajzodat <b>28 × 28-as képpé</b> kicsinyíti (784 szám), és összeveti a példákkal, amiket már látott. Így működik a képfelismerés alapja – a nagy AI-k ugyanezt csinálják, csak millió képpel és sokkal nagyobb neurális hálóval. Minél több példát tanítasz neki, annál okosabb lesz!</div></div></div>
      <div class="ai-pane" data-p="text" style="display:none"><div><div id="ai-t-out"></div><div id="ai-t-next"></div></div>
        <div class="ai-side"><h3>Hogyan „ír” egy AI?</h3><div>Kattints a következő szóra – vagy hagyd, hogy a gép válasszon!</div>
          <div class="row"><button class="btn go" id="ai-t-auto">Írjon a gép!</button><button class="btn" id="ai-t-rs">Új mondat</button></div>
          <div class="row ai-st">${['A számítógép', 'Az internet', 'A robot', 'A mesterséges intelligencia', 'A diák'].map(s => `<button class="btn" data-ts="${s}">${s}…</button>`).join('')}</div>
          <div class="learn" style="margin-top:0">Egy <b>nyelvi modell</b> (mint a ChatGPT vagy a Claude) azt számolja ki, melyik szó jön a legvalószínűbben. Ez a kis modell 32 mondatból tanult, és csak az előző két szót nézi. A nagy modellek <b>milliárdnyi</b> szövegből tanulnak, és egész oldalakat vesznek figyelembe – ezért tudnak verset írni, programot javítani vagy fordítani.</div></div></div>
      ${vehHtml()}
    </div>`;
    $$('[data-at]', r).forEach(b => b.onclick = () => { setTab(b.dataset.at); sfx.click() });
    L.cv = $('#ai-l-cv'); L.ctx = L.cv.getContext('2d'); presetPts('ring');
    $$('[data-lc]', r).forEach(b => b.onclick = () => { L.cls = +b.dataset.lc; $$('[data-lc]').forEach(x => x.classList.toggle('sel', x === b)) });
    $$('[data-lm]', r).forEach(b => b.onclick = () => { L.model = b.dataset.lm; $$('[data-lm]').forEach(x => x.classList.toggle('sel', x === b)); initNet() });
    $$('[data-lp]', r).forEach(b => b.onclick = () => { if (b.dataset.lp === 'clr') { L.pts = []; initNet() } else presetPts(b.dataset.lp); sfx.click() });
    L.cv.addEventListener('pointerdown', e => { const rc = L.cv.getBoundingClientRect(); L.pts.push({ x: (e.clientX - rc.left) / rc.width, y: (e.clientY - rc.top) / rc.height, c: e.button === 2 ? 1 - L.cls : L.cls }); beep(L.cls ? 500 : 800, .04, 'triangle', .04) });
    L.cv.addEventListener('contextmenu', e => e.preventDefault());
    D.cv = $('#ai-d-cv'); D.ctx = D.cv.getContext('2d'); seedSet();
    const dp = e => { const rc = D.cv.getBoundingClientRect(); return [(e.clientX - rc.left) / rc.width * D.cv.width, (e.clientY - rc.top) / rc.height * D.cv.height] };
    D.cv.addEventListener('pointerdown', e => { D.drawing = true; D.strokes.push([dp(e)]); D.cv.setPointerCapture(e.pointerId) });
    D.cv.addEventListener('pointermove', e => { if (D.drawing) { D.strokes[D.strokes.length - 1].push(dp(e)); drawRender() } });
    D.cv.addEventListener('pointerup', () => { D.drawing = false; drawRender() });
    $('#ai-d-clr').onclick = () => { D.strokes = []; drawRender() };
    $('#ai-t-auto').onclick = autoGen; $('#ai-t-rs').onclick = () => { words = ['a', 'számítógép']; textRender() };
    $$('[data-ts]', r).forEach(b => b.onclick = () => { words = b.dataset.ts.toLowerCase().split(' '); textRender() });
    vehBind(r);
    setTab('learn');
  };
  S.tick = dt => { if (tab === 'learn' && L.ctx) learnDraw(); if (tab === 'cars' && V.grid) vehTick(dt) };
  S.leave = () => { };
  S._dbg = () => ({ D, synth, vecFromStrokes, classify, seedSet, V });
  return S;
})());
