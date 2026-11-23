/* ===== Evolúció-labor: neurális hálós lények, természetes kiválasztódás, víz és szárazföld =====
   Saját megvalósítás. Az ötletet Laczkó Örs (lors.hu) evolúciós szimulációs videói ihlették. */
Object.assign(ICON_PATHS, { evo: '<path d="M7 3c0 6 10 6 10 12s-10 6-10 6"/><path d="M17 3c0 6-10 6-10 12"/><path d="M8.5 7h7M8.5 17h7M10 12h4"/>' });
App.add((() => {
  const S = {
    id: 'evo', icon: '', title: 'Evolúció-labor', color: '#22c55e',
    desc: 'Neurális hálós lények élnek egy vízzel és erdőkkel teli világban: ételt gyűjtenek, versengenek, szaporodnak és mutálódnak. Nézd, ahogy nemzedékről nemzedékre alkalmazkodnak!',
    topic: 'Mesterséges intelligencia, neurális hálók, genetikus algoritmus, szimuláció, adatvizualizáció'
  };
  /* ---------- beállítások ---------- */
  const W = 2600, H = 1460, WATER_X = W / 3, DAY = 1500, NIGHT = 90, CELL = 120, GC = Math.ceil(W / CELL), GR = Math.ceil(H / CELL);
  const TRAITS = [['meret', 'Méret és erő', '#ef4444', 'Nagyobb test: erősebb a versengésben, de lassabb és nehezebben fordul.'], ['latas', 'Látótávolság', '#facc15', 'Messzebbre lát, így előbb észreveszi az ételt és a veszélyt.'], ['fokusz', 'Fókusz', '#a78bfa', 'Magas fókusz: keskeny, „távcsöves” látómező. Alacsony: széles körkép.'], ['sprint', 'Sprint', '#fb923c', 'Rövid ideig nagyon gyors, utána lassabban pihen.'], ['gyujto', 'Gyűjtögetés', '#2dd4bf', 'Messzebbről fel tudja venni az ételt, és gyorsabban tér magához.'], ['viz', 'Vízkedvelés', '#38bdf8', 'Magas érték: gyors úszó, de a szárazon lassú. Alacsony: fordítva.']];
  const TN = TRAITS.map(t => t[0]);
  const NI = 19, NH = 10, NO = 5; // 4 típus × 3 sugár + fal + víz + éhség + sprint + pozíció x,y + 1 memória; ki: előre, fordul, sprint, 2 memória
  const CFG = { pop: 120, mutF: .3, mutA: .3, cross: .75, night: true, waterStart: false, speed: 1 };
  const rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  /* ---------- agy és genom ---------- */
  function newBrain() { const w1 = new Float32Array(NI * NH), b1 = new Float32Array(NH), w2 = new Float32Array(NH * NO), b2 = new Float32Array(NO); const s1 = Math.sqrt(1 / NI), s2 = Math.sqrt(1 / NH); for (let i = 0; i < w1.length; i++) w1[i] = rnd(-1, 1) * s1 * 1.6; for (let i = 0; i < w2.length; i++) w2[i] = rnd(-1, 1) * s2 * 1.6; for (let i = 0; i < NH; i++) b1[i] = rnd(-.3, .3); for (let i = 0; i < NO; i++) b2[i] = rnd(-.3, .3); b2[0] += .5; return [w1, b1, w2, b2] }
  const HB = new Float32Array(NH), OB = new Float32Array(NO);
  function think(br, inp) { const [w1, b1, w2, b2] = br; for (let j = 0; j < NH; j++) { let s = b1[j]; const o = j * NI; for (let i = 0; i < NI; i++) s += inp[i] * w1[o + i]; HB[j] = Math.tanh(s) } for (let k = 0; k < NO; k++) { let s = b2[k]; const o = k * NH; for (let j = 0; j < NH; j++) s += HB[j] * w2[o + j]; OB[k] = Math.tanh(s) } return OB }
  function randGenome() { const g = { brain: newBrain() }; TN.forEach(t => g[t] = rnd(.05, .9)); if (CFG.waterStart) g.viz = rnd(.75, 1); return g }
  function cloneG(g) { const c = { brain: g.brain.map(a => Float32Array.from(a)) }; TN.forEach(t => c[t] = g[t]); return c }
  function mutate(g, f = CFG.mutF, a = CFG.mutA) { g.brain.forEach(arr => { for (let i = 0; i < arr.length; i++) if (Math.random() < f * .5) arr[i] = clamp(arr[i] + rnd(-1, 1) * a * 1.5, -4, 4) }); TN.forEach(t => { if (Math.random() < f) g[t] = clamp(g[t] + rnd(-1, 1) * a * .5, .02, .98) }); return g }
  function cross(a, b) { const c = cloneG(a); c.brain.forEach((arr, l) => { const o = b.brain[l]; for (let i = 0; i < arr.length; i++) if (Math.random() < .5) arr[i] = o[i] }); TN.forEach(t => { if (Math.random() < .5) c[t] = b[t] }); return c }
  /* ---------- világ ---------- */
  const E = { cr: [], food: [], trees: [], day: 1, tick: 0, phase: 'day', foodSpawned: 0, hist: [], id: 1, best: null, sel: null, stats: { born: 0, died: 0 }, grid: null };
  function newCreature(g, x, y, gen = 1) {
    const sp = .55 + (1 - g.meret) * .75;
    return { id: E.id++, g, x, y, a: rnd(0, 6.283), food: 2, age: 0, gen, kids: 0, alive: true, stun: 0, cd: 0, burst: 0, rec: 0, mem: 0, blocked: false,
      r: 6 + g.meret * 9, str: .45 + g.meret, speed: sp, turn: .13 * (1 - g.meret * .5), vis: 90 + g.latas * 300, cone: .3 + (1 - g.fokusz) * 1.25, reach: 3 + g.gyujto * 9, eaten: 0, trail: [] };
  }
  const inWater = (x, y) => x < WATER_X;
  function hot() { return [[W * .16, H * .3, 1], [WATER_X - W * .06, H * .65, 1], [WATER_X + W * .07, H * .62, 0], [W * .6, H * .22, 0], [W * .84, H * .76, 0]] }
  function makeTrees() {
    E.trees = []; const hs = hot();
    for (let i = 0; i < 170; i++) { let x, y; if (Math.random() < .7) { const h = hs[i % hs.length]; x = h[0] + rnd(-1, 1) * 330 * Math.random(); y = h[1] + rnd(-1, 1) * 330 * Math.random() } else { x = rnd(60, W - 60); y = rnd(60, H - 60) } x = clamp(x, 40, W - 40); y = clamp(y, 40, H - 40); E.trees.push({ x, y, r: rnd(16, 30), w: inWater(x, y) }) }
  }
  function spawnFood() {
    const t = E.trees[Math.floor(Math.random() * E.trees.length)], a = rnd(0, 6.283), d = t.r + rnd(8, 70);
    const x = clamp(t.x + Math.cos(a) * d, 20, W - 20), y = clamp(t.y + Math.sin(a) * d, 20, H - 20); E.food.push({ x, y, w: inWater(x, y) });
  }
  function reset(keep) {
    E.cr = []; E.food = []; E.day = 1; E.tick = 0; E.phase = 'day'; E.foodSpawned = 0; E.hist = []; E.sel = null; E.stats = { born: 0, died: 0 };
    if (!keep) makeTrees();
    const n = CFG.waterStart ? Math.floor(CFG.pop / 2) : CFG.pop;
    for (let i = 0; i < n; i++) { const g = keep ? mutate(cloneG(keep), .5, .3) : randGenome(); const x = CFG.waterStart ? rnd(30, WATER_X - 30) : rnd(30, W - 30); E.cr.push(newCreature(g, x, rnd(30, H - 30))) }
    record();
  }
  // térbeli rács a gyors szomszédkereséshez
  function buildGrid() { const gr = Array.from({ length: GC * GR }, () => ({ c: [], f: [], t: [] })); const put = (k, o) => { const gx = clamp(o.x / CELL | 0, 0, GC - 1), gy = clamp(o.y / CELL | 0, 0, GR - 1); gr[gy * GC + gx][k].push(o) }; E.cr.forEach(c => c.alive && put('c', c)); E.food.forEach(f => put('f', f)); E.trees.forEach(t => put('t', t)); E.grid = gr }
  function near(x, y, R, fn) { const g = E.grid, x0 = clamp((x - R) / CELL | 0, 0, GC - 1), x1 = clamp((x + R) / CELL | 0, 0, GC - 1), y0 = clamp((y - R) / CELL | 0, 0, GR - 1), y1 = clamp((y + R) / CELL | 0, 0, GR - 1); for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) fn(g[gy * GC + gx]) }
  /* ---------- érzékelés: 3 látósugár × 4 tárgytípus ---------- */
  const INP = new Float32Array(NI);
  function sense(c) {
    INP.fill(0); const rays = [c.a, c.a - c.cone, c.a + c.cone], R = c.vis * (inWater(c.x, c.y) ? .6 + c.g.viz * .6 : 1.2 - c.g.viz * .6);
    const see = (o, rad, type) => { const dx = o.x - c.x, dy = o.y - c.y, d = Math.hypot(dx, dy); if (d > R || d < 1) return; const ang = Math.atan2(dy, dx), w = Math.atan((rad + 14) / d), cl = 1 - d / R; for (let k = 0; k < 3; k++) { let df = ang - rays[k]; df = Math.atan2(Math.sin(df), Math.cos(df)); if (Math.abs(df) < w) { const ix = type * 3 + k; if (cl > INP[ix]) INP[ix] = cl } } };
    near(c.x, c.y, R, cell => { for (const t of cell.t) see(t, t.r, 0); for (const f of cell.f) see(f, 4, 1); for (const o of cell.c) { if (o === c || !o.alive) continue; see(o, o.r, o.str < c.str * .9 ? 2 : o.str > c.str * 1.1 ? 3 : 2) } });
    const wall = Math.min(c.x, c.y, W - c.x, H - c.y); INP[12] = 1 - clamp(wall / 120, 0, 1);
    const cx = c.x + Math.cos(c.a) * 60; INP[13] = inWater(cx, c.y) ? 1 : -1; INP[14] = c.food / 5; INP[15] = c.burst || c.rec ? -1 : 1; INP[16] = c.x / W * 2 - 1; INP[17] = c.y / H * 2 - 1; INP[18] = c.mem;
    return INP;
  }
  /* ---------- egy lépés ---------- */
  function step() {
    E.tick++;
    if (E.phase === 'night') { if (E.tick >= NIGHT || !CFG.night) { E.phase = 'day'; E.tick = 0; E.foodSpawned = 0; E.food = []; E.cr.forEach(c => c.a = rnd(0, 6.283)) } return }
    const target = Math.floor(CFG.pop * .85), want = Math.floor(Math.min(1, E.tick / (DAY * .7)) * target); while (E.foodSpawned < want) { spawnFood(); E.foodSpawned++ }
    buildGrid();
    for (const c of E.cr) {
      if (!c.alive) continue; if (c.cd > 0) c.cd--;
      if (c.stun > 0) { c.stun--; continue }
      const o = think(c.g.brain, sense(c)); c.mem = o[3];
      if (!c.burst && !c.rec && o[2] > .4) c.burst = 80; if (c.burst) { c.burst--; if (!c.burst) c.rec = 80 } else if (c.rec) c.rec--;
      const bm = c.burst ? 1 + c.g.sprint * 1.2 : c.rec ? 1 - c.g.sprint * .5 : 1, wm = inWater(c.x, c.y) ? .15 + c.g.viz * .95 : 1.1 - c.g.viz * .95;
      c.a += o[1] * c.turn; const v = Math.max(0, o[0]) * c.speed * bm * wm * 2.1;
      let nx = c.x + Math.cos(c.a) * v, ny = c.y + Math.sin(c.a) * v;
      near(nx, ny, c.r + 30, cell => { for (const t of cell.t) { const dx = nx - t.x, dy = ny - t.y, d = Math.hypot(dx, dy), m = t.r + c.r * .7; if (d < m && d > 0) { nx = t.x + dx / d * m; ny = t.y + dy / d * m } } });
      c.x = clamp(nx, c.r, W - c.r); c.y = clamp(ny, c.r, H - c.r);
      if (E.tick % 5 === 0) { c.trail.push(c.x, c.y); if (c.trail.length > 30) c.trail.splice(0, 2) }
      // evés
      if (c.food < 5) near(c.x, c.y, c.r + c.reach + 8, cell => { for (let i = 0; i < cell.f.length; i++) { const f = cell.f[i]; if (f.eaten) continue; if (Math.hypot(f.x - c.x, f.y - c.y) < c.r + c.reach + 4) { f.eaten = true; c.food++; c.eaten++; break } } });
    }
    E.food = E.food.filter(f => !f.eaten);
    // versengés: a nagyobb erejű elvesz egy ételt, a gyengébb elkábul
    for (const a of E.cr) {
      if (!a.alive || a.stun || a.cd) continue;
      near(a.x, a.y, a.r + 30, cell => { for (const b of cell.c) { if (b === a || b.id < a.id || b.stun || b.cd || !b.alive) continue; if (Math.hypot(a.x - b.x, a.y - b.y) > a.r + b.r + 2) continue; const q = a.str / b.str; if (q > .9 && q < 1.1) continue; const st = q >= 1.1 ? a : b, wk = st === a ? b : a; st.cd = wk.cd = 40; wk.stun = Math.round((60 + (Math.max(q, 1 / q) - 1.1) * 900) / (1 + wk.g.gyujto)); wk.blocked = true; if (wk.food > 2 && st.food < 5) { wk.food--; st.food++ } } });
    }
    if (E.tick >= DAY) nightfall();
  }
  function nightfall() {
    const surv = [], kids = [], rep = E.cr.filter(c => c.food - 2 >= 1 && !c.blocked); let died = 0;
    for (const c of E.cr) {
      const kidsN = clamp(Math.floor(c.food - 2), 0, 3); c.food = Math.min(c.food, 2) - 1;
      if (c.food <= 0) { died++; continue } c.age++; surv.push(c);
      if (!kidsN || c.blocked) continue;
      let mate = null, md = 1e9; for (const o of rep) { if (o === c) continue; const d = (o.x - c.x) ** 2 + (o.y - c.y) ** 2; if (d < md) { md = d; mate = o } }
      for (let k = 0; k < kidsN; k++) { const g = mate && Math.random() < CFG.cross ? mutate(cross(c.g, mate.g)) : mutate(cloneG(c.g)); kids.push(newCreature(g, clamp(c.x + rnd(-25, 25), 20, W - 20), clamp(c.y + rnd(-25, 25), 20, H - 20), c.gen + 1)); c.kids++ }
    }
    E.stats = { born: kids.length, died, surv: surv.length };
    E.cr = surv.concat(kids); E.cr.forEach(c => { c.stun = 0; c.cd = 0; c.blocked = false; c.burst = 0; c.rec = 0; c.trail = [] });
    let best = null; for (const c of E.cr) if (!best || c.eaten + c.age * 3 > best.eaten + best.age * 3) best = c; if (best) E.best = cloneG(best.g);
    E.cr.forEach(c => c.eaten = 0);
    E.day++; E.phase = 'night'; E.tick = 0;
    if (E.sel && !E.cr.includes(E.sel)) E.sel = null;
    if (!E.cr.length) { const b = E.best; reset(b || null); if (!b) makeTrees(); toast('Kihalt a populáció! Újrakezdjük a legjobb lény utódaival.', '#f87171', 3000) }
    else record();
  }
  function record() { const n = E.cr.length || 1, h = { day: E.day, pop: E.cr.length }; TN.forEach(t => h[t] = E.cr.reduce((s, c) => s + c.g[t], 0) / n); h.water = E.cr.filter(c => inWater(c.x, c.y)).length; E.hist.push(h); if (E.hist.length > 80) E.hist.shift() }
  /* ---------- rajzolás ---------- */
  let C, ctx, cam = { x: W / 2, y: H / 2, z: .4, follow: false }, drag = null, T = 0, statCv;
  function draw() {
    const c = ctx, Wd = C.W, Hd = C.H, d = devicePixelRatio || 1; c.setTransform(d, 0, 0, d, 0, 0); c.fillStyle = '#0b0d12'; c.fillRect(0, 0, Wd, Hd);
    if (cam.follow && E.sel) { cam.x += (E.sel.x - cam.x) * .1; cam.y += (E.sel.y - cam.y) * .1 }
    const z = cam.z; c.save(); c.translate(Wd / 2, Hd / 2); c.scale(z, z); c.translate(-cam.x, -cam.y);
    // talaj és víz
    let g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#1d5b7a'); g.addColorStop(.3, '#2f7f9e'); g.addColorStop(.334, '#c9b77a'); g.addColorStop(.345, '#6f9a52'); g.addColorStop(1, '#5d8a44'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 3; for (let k = 0; k < 8; k++) { c.beginPath(); for (let y = 0; y <= H; y += 40) { const x = WATER_X - 30 - k * 60 + Math.sin(y * .02 + T * 1.5 + k) * 8; y ? c.lineTo(x, y) : c.moveTo(x, y) } c.stroke() }
    // fák / hínár
    for (const t of E.trees) { c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.arc(t.x + 5, t.y + 6, t.r, 0, 7); c.fill(); c.fillStyle = t.w ? '#1f6e5a' : '#3f6b2a'; c.beginPath(); c.arc(t.x, t.y, t.r, 0, 7); c.fill(); c.fillStyle = t.w ? '#3fa184' : '#6a9a45'; c.beginPath(); c.arc(t.x - t.r * .25, t.y - t.r * .25, t.r * .55, 0, 7); c.fill() }
    // étel
    for (const f of E.food) { c.fillStyle = f.w ? '#fde047' : '#ef4444'; c.beginPath(); c.arc(f.x, f.y, 5, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(f.x - 1.5, f.y - 1.5, 1.6, 0, 7); c.fill() }
    // lények
    const sel = E.sel;
    if (sel && sel.alive) { c.fillStyle = 'rgba(253,224,71,.08)'; c.beginPath(); c.moveTo(sel.x, sel.y); c.arc(sel.x, sel.y, sel.vis, sel.a - sel.cone - .2, sel.a + sel.cone + .2); c.closePath(); c.fill(); [sel.a, sel.a - sel.cone, sel.a + sel.cone].forEach(a => { c.strokeStyle = 'rgba(253,224,71,.6)'; c.lineWidth = 2 / z; c.beginPath(); c.moveTo(sel.x, sel.y); c.lineTo(sel.x + Math.cos(a) * sel.vis, sel.y + Math.sin(a) * sel.vis); c.stroke() }) }
    for (const k of E.cr) {
      const hue = k.g.viz > .5 ? 200 : 22, col = `hsl(${hue},${35 + Math.abs(k.g.viz - .5) * 120}%,${58 - k.g.meret * 15}%)`;
      if (k.trail.length > 2) { c.strokeStyle = `hsla(${hue},70%,70%,.25)`; c.lineWidth = 2; c.beginPath(); for (let i = 0; i < k.trail.length; i += 2) i ? c.lineTo(k.trail[i], k.trail[i + 1]) : c.moveTo(k.trail[i], k.trail[i + 1]); c.stroke() }
      c.save(); c.translate(k.x, k.y); c.rotate(k.a); if (E.phase === 'night') c.globalAlpha = .7; const vs = Math.max(1, 11 / (k.r * z)); c.scale(vs, vs);
      if (k.burst) { c.fillStyle = 'rgba(251,146,60,.35)'; c.beginPath(); c.arc(-k.r * .6, 0, k.r * 1.2, 0, 7); c.fill() }
      c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, k.r * 1.15, k.r, 0, 0, 7); c.fill(); c.strokeStyle = k === sel ? '#fde047' : 'rgba(0,0,0,.45)'; c.lineWidth = k === sel ? 3 : 1.5; c.stroke();
      c.fillStyle = '#fff'; [-1, 1].forEach(s => { c.beginPath(); c.arc(k.r * .5, s * k.r * .38, k.r * .28, 0, 7); c.fill() }); c.fillStyle = '#111'; [-1, 1].forEach(s => { c.beginPath(); c.arc(k.r * .6, s * k.r * .38, k.r * .14, 0, 7); c.fill() });
      c.restore();
      if (k.stun) { c.fillStyle = '#fde047'; c.font = 'bold 14px Inter,sans-serif'; c.textAlign = 'center'; c.fillText('*', k.x, k.y - k.r - 4) }
      if (z > .55 || k === sel) for (let i = 0; i < k.food; i++) { c.fillStyle = '#ef4444'; c.beginPath(); c.arc(k.x - (k.food - 1) * 3.5 + i * 7, k.y + k.r + 7, 2.6, 0, 7); c.fill() }
    }
    c.restore();
    // éjszaka
    if (E.phase === 'night') { const a = Math.sin(Math.PI * E.tick / NIGHT); c.fillStyle = `rgba(10,16,40,${.55 * a + .1})`; c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#fff'; c.font = '800 24px Inter,sans-serif'; c.textAlign = 'center'; c.globalAlpha = a; c.fillText(`Éjszaka – ${E.stats.born} új lény született, ${E.stats.died} nem élte túl`, Wd / 2, 60); c.globalAlpha = 1 }
    else if (E.tick > DAY * .85) { c.fillStyle = `rgba(220,130,60,${(E.tick / DAY - .85) * 1.2})`; c.fillRect(0, 0, Wd, Hd) }
  }
  function drawStats() {
    const cv = statCv; if (!cv) return; const c = cv.getContext('2d'), w = cv.width, h = cv.height; c.clearRect(0, 0, w, h);
    const hs = E.hist; if (hs.length < 2) { c.fillStyle = '#64748b'; c.font = '12px Inter,sans-serif'; c.fillText('Az adatok az első éjszaka után jelennek meg…', 8, h / 2); return }
    c.strokeStyle = '#ffffff12'; for (let k = 0; k <= 4; k++) { c.beginPath(); c.moveTo(0, h * k / 4); c.lineTo(w, h * k / 4); c.stroke() }
    TRAITS.forEach(([t, , col]) => { c.strokeStyle = col; c.lineWidth = 2.5; c.beginPath(); hs.forEach((p, i) => { const x = i / (hs.length - 1) * w, y = h - p[t] * h; i ? c.lineTo(x, y) : c.moveTo(x, y) }); c.stroke() });
  }
  function panel() {
    const n = E.cr.length, inW = E.cr.filter(c => inWater(c.x, c.y)).length;
    const night = E.phase === 'night', pr = night ? E.tick / NIGHT : E.tick / DAY;
    $('#ev-hud').innerHTML = `<div id="ev-phase" class="${night ? 'night' : ''}"><small>${E.day}. nap</small><span>${night ? 'Éjszaka: esznek, szaporodnak' : pr > .85 ? 'Alkonyat: mindjárt éjszaka' : 'Nappal: ételt gyűjtenek'}</span><em><u style="width:${Math.round(pr * 100)}%"></u></em></div><div><small>Élőlény</small><b>${n}</b></div><div><small>Étel a pályán</small><b>${E.food.length}</b></div><div><small>Vízben / szárazon</small><b>${inW} / ${n - inW}</b></div>`;
    const last = E.hist[E.hist.length - 1] || {};
    $('#ev-tr').innerHTML = TRAITS.map(([t, nm, col]) => `<div class="ev-t" title="${TRAITS.find(x => x[0] === t)[3]}"><i style="background:${col}"></i><span>${nm}</span><em><u style="width:${Math.round((last[t] || 0) * 100)}%;background:${col}"></u></em><b>${(last[t] || 0).toFixed(2)}${(() => { const f = E.hist[0]; if (!f || E.hist.length < 2) return ''; const d = (last[t] || 0) - f[t]; return Math.abs(d) < .02 ? '' : `<span class="ev-d ${d > 0 ? 'up' : 'dn'}">${d > 0 ? '+' : ''}${d.toFixed(2)}</span>` })()}</b></div>`).join('');
    const s = E.sel, key = s ? s.id + (cam.follow ? 'f' : '') : 0;
    const dyn = s ? `<div class="ev-sh"><b>#${s.id} lény</b><span>${s.gen}. nemzedék • ${s.age} napos • ${s.kids} utód</span></div><div class="ev-sf">Étel: ${'<i></i>'.repeat(Math.max(0, s.food))} <small>(${inWater(s.x, s.y) ? 'vízben' : 'szárazon'}${s.stun ? ', kábult' : s.burst ? ', sprintel' : ''})</small></div>` : '';
    if (key === panel.k) { const d = $('#ev-sdyn'); if (d) d.innerHTML = dyn; return } panel.k = key;
    $('#ev-sel').innerHTML = s ? `<div id="ev-sdyn">${dyn}</div>${TRAITS.map(([t, nm, col]) => `<div class="ev-t"><i style="background:${col}"></i><span>${nm}</span><em><u style="width:${Math.round(s.g[t] * 100)}%;background:${col}"></u></em><b>${s.g[t].toFixed(2)}</b></div>`).join('')}<canvas id="ev-brain" width="300" height="170"></canvas><div class="ev-row"><button class="btn" id="ev-follow">${cam.follow ? 'Követés ki' : 'Kamera követi'}</button><button class="btn" id="ev-unsel">Bezár</button></div>` : '<div class="ev-hint">Kattints egy lényre, hogy lásd a tulajdonságait és az agyát!</div>';
    if (s) { $('#ev-follow').onclick = () => { cam.follow = !cam.follow; panel() }; $('#ev-unsel').onclick = () => { E.sel = null; cam.follow = false; panel() } }
  }
  function drawBrain() {
    const cv = $('#ev-brain'), s = E.sel; if (!cv || !s) return; const c = cv.getContext('2d'), w = cv.width, h = cv.height; c.clearRect(0, 0, w, h);
    const inp = Float32Array.from(sense(s)), out = Float32Array.from(think(s.g.brain, inp)), hid = Float32Array.from(HB);
    const lay = [inp, hid, out], xs = [70, w / 2 + 10, w - 46], P = lay.map((l, li) => Array.from(l, (_, i) => [xs[li], 8 + (i + .5) * (h - 16) / l.length]));
    const [w1, , w2] = s.g.brain; c.lineWidth = 1;
    for (let j = 0; j < NH; j++) for (let i = 0; i < NI; i++) { const v = w1[j * NI + i] * inp[i]; if (Math.abs(v) < .15) continue; c.strokeStyle = v > 0 ? `rgba(74,222,128,${Math.min(.8, Math.abs(v) * .5)})` : `rgba(248,113,113,${Math.min(.8, Math.abs(v) * .5)})`; c.beginPath(); c.moveTo(...P[0][i]); c.lineTo(...P[1][j]); c.stroke() }
    for (let k = 0; k < NO; k++) for (let j = 0; j < NH; j++) { const v = w2[k * NH + j] * hid[j]; if (Math.abs(v) < .1) continue; c.strokeStyle = v > 0 ? `rgba(74,222,128,${Math.min(.8, Math.abs(v) * .6)})` : `rgba(248,113,113,${Math.min(.8, Math.abs(v) * .6)})`; c.beginPath(); c.moveTo(...P[1][j]); c.lineTo(...P[2][k]); c.stroke() }
    const IL = ['fa közép', 'fa bal', 'fa jobb', 'étel közép', 'étel bal', 'étel jobb', 'gyengébb köz.', 'gyengébb bal', 'gyengébb jobb', 'erősebb köz.', 'erősebb bal', 'erősebb jobb', 'fal', 'víz előtte', 'éhség', 'sprint kész', 'pozíció x', 'pozíció y', 'memória'], OL = ['előre', 'fordul', 'sprint', 'memória', '–'];
    c.font = '9px Inter,sans-serif';
    lay.forEach((l, li) => l.forEach((v, i) => { const [x, y] = P[li][i]; c.beginPath(); c.arc(x, y, li === 0 ? 3 : 5, 0, 7); c.fillStyle = v > 0 ? `rgba(74,222,128,${.25 + Math.abs(v) * .75})` : `rgba(248,113,113,${.25 + Math.abs(v) * .75})`; c.fill(); if (li === 0) { c.fillStyle = '#94a3b8'; c.textAlign = 'right'; c.fillText(IL[i], x - 6, y + 3) } if (li === 2) { c.fillStyle = '#cbd5e1'; c.textAlign = 'left'; c.fillText(OL[i], x + 8, y + 3) } }));
  }
  const toWorld = (sx, sy) => [(sx - C.W / 2) / cam.z + cam.x, (sy - C.H / 2) / cam.z + cam.y];
  function fit() { cam.z = Math.min(C.W / W, C.H / H) * .98; cam.x = W / 2; cam.y = H / 2; cam.follow = false }
  /* ---------- felület ---------- */
  let acc = 0, uiT = 0, built = false, tab = 'sim';
  S.build = r => {
    r.innerHTML = `<style>
      #ev{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1fr) 340px}#ev-st{position:relative;min-width:0}
      #ev-hud{position:absolute;top:10px;left:10px;display:flex;gap:8px;z-index:2;pointer-events:none}#ev-hud div{background:#0b0c10d0;border:1px solid var(--line2);border-radius:12px;padding:5px 12px;display:flex;flex-direction:column}#ev-hud small{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}#ev-hud b{font-size:22px;font-variant-numeric:tabular-nums}
      #ev-ctl{position:absolute;bottom:10px;left:10px;display:flex;gap:6px;z-index:2;flex-wrap:wrap}#ev-ctl .btn{height:38px;font-size:14px;padding:0 12px}#ev-ctl .btn.sel{background:var(--accent);color:#0b0c10;border-color:var(--accent)}
      #ev-side{border-left:1px solid var(--line);background:var(--panel);overflow:auto;padding:12px;display:flex;flex-direction:column;gap:10px;font-size:14px}
      #ev-orig{position:absolute;top:10px;right:10px;z-index:3;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#0b0c10c8;border:1px solid var(--line2);color:#cbd5e1;cursor:pointer;transition:all .2s}#ev-orig:hover{color:#fff;border-color:var(--accent);transform:scale(1.08)}
      #ev-leg{position:absolute;bottom:58px;left:10px;z-index:2;display:flex;flex-wrap:wrap;gap:6px 14px;background:#0b0c10c8;border:1px solid var(--line2);border-radius:12px;padding:6px 12px;font-size:13px;pointer-events:none}#ev-leg span{display:inline-flex;gap:6px;align-items:center}#ev-leg i{width:12px;height:12px;border-radius:50%;display:inline-block}#ev-leg b{color:#fde047}
      #ev-phase{min-width:280px}#ev-phase em{display:block;height:6px;background:#ffffff1a;border-radius:3px;overflow:hidden;margin-top:5px}#ev-phase em u{display:block;height:100%;background:linear-gradient(90deg,#fde047,#fb923c)}#ev-phase.night em u{background:#818cf8}#ev-phase span{font-size:14px;font-weight:700}
      .ev-what{background:color-mix(in srgb,var(--accent) 12%,transparent);border:1px solid color-mix(in srgb,var(--accent) 35%,transparent);border-radius:12px;padding:9px 11px;font-size:13.5px;line-height:1.45}
      .ev-ax{display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-top:-6px}.ev-d{font-size:11px;margin-left:4px}.ev-d.up{color:#4ade80}.ev-d.dn{color:#f87171}
      .ev-adv{background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:8px 10px;display:flex;flex-direction:column;gap:8px}.ev-adv summary{cursor:pointer;font-weight:700;font-size:13.5px;color:#cbd5e1}.ev-adv[open]{display:flex}.ev-adv[open] summary{margin-bottom:6px}
      .ev-t{grid-template-columns:10px 100px 1fr 86px!important}.ev-t b{white-space:nowrap}
      #ev-side h4{margin:0;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
      .ev-t{display:grid;grid-template-columns:10px 104px 1fr 38px;gap:6px;align-items:center;font-size:13px}.ev-t i{width:10px;height:10px;border-radius:3px}.ev-t em{height:8px;background:var(--panel2);border-radius:4px;overflow:hidden}.ev-t u{display:block;height:100%}.ev-t b{text-align:right;font-variant-numeric:tabular-nums}
      #ev-chart{width:100%;height:110px;background:var(--bg2);border-radius:10px}
      .ev-sh b{font-size:16px;display:block}.ev-sh span{font-size:12.5px;color:var(--muted)}.ev-sf{font-size:13px}.ev-sf i{display:inline-block;width:9px;height:9px;border-radius:50%;background:#ef4444;margin-right:2px}.ev-sf small{color:var(--muted)}
      #ev-brain{width:100%;background:var(--bg2);border-radius:10px;margin-top:4px}.ev-row{display:flex;gap:6px}.ev-row .btn{flex:1;height:34px;font-size:13px}.ev-hint{color:var(--muted);font-size:13px;background:var(--bg2);border-radius:10px;padding:10px}
      .ev-sl{display:grid;grid-template-columns:1fr 46px;gap:2px 8px;font-size:13px;align-items:center}.ev-sl input{grid-column:1/-1;width:100%}.ev-sl b{text-align:right}
      .ev-ck{display:flex;gap:8px;align-items:center;font-size:13.5px;cursor:pointer}
      #ev-info{position:absolute;inset:0;z-index:5;display:none;overflow:auto;background:#0b0c10f2;padding:24px}#ev-info .card{max-width:860px;margin:0 auto;background:var(--panel);border:1px solid var(--line2);border-radius:20px;padding:22px 26px;font-size:15.5px;line-height:1.6}#ev-info h3{margin:14px 0 4px;font-size:18px;color:var(--accent)}#ev-info h2{margin:0}
    </style>
    <div id="ev"><div id="ev-st"><div id="ev-hud"></div>
      <div id="ev-ctl">${[1, 3, 10, 30].map(v => `<button class="btn ${v === 1 ? 'sel' : ''}" data-es="${v}">${v}×</button>`).join('')}<button class="btn" id="ev-pause">Szünet</button><button class="btn" id="ev-fit">Teljes nézet</button><button class="btn" id="ev-new">Új világ</button><button class="btn go" id="ev-inf">Hogyan működik?</button></div>
      <button id="ev-orig" title="Az eredeti, részletesebb szimuláció: Vizes evolúció – Laczkó Örs (lors.hu)" aria-label="Eredeti szimuláció">${icon('globe', 18)}</button>
      <div id="ev-leg"><span><i style="background:hsl(200,70%,55%)"></i>vízi lény</span><span><i style="background:hsl(20,70%,55%)"></i>szárazföldi lény</span><span><i style="background:#ef4444;width:8px;height:8px"></i>étel</span><span><i style="background:#3f6b2a"></i>fa / hínár</span><span><b>*</b> elkábult</span></div>
      <div id="ev-info"></div></div>
      <div id="ev-side"><div class="ev-what"><b>Mit figyelj?</b> Minden lény más génekkel születik. Amelyik tulajdonság segít ételt szerezni, az napról napra <b>elterjed</b> – a sávok és a grafikon ezt mutatják.</div><h4>Hogyan változnak a lények?</h4><div id="ev-tr"></div><canvas id="ev-chart" width="300" height="110"></canvas><div class="ev-ax"><span>1. nap</span><span>ma</span></div>
        <h4>Kiválasztott lény</h4><div id="ev-sel"></div>
        <details class="ev-adv"><summary>Haladó beállítások</summary>
        <label class="ev-sl">Népesség-cél <b id="ev-pv"></b><input type="range" id="ev-pop" min="40" max="220" step="10"></label>
        <label class="ev-sl">Mutáció gyakorisága <b id="ev-mfv"></b><input type="range" id="ev-mf" min="0" max="80"></label>
        <label class="ev-sl">Mutáció mértéke <b id="ev-mav"></b><input type="range" id="ev-ma" min="0" max="80"></label>
        <label class="ev-sl">Keresztezés esélye <b id="ev-cv"></b><input type="range" id="ev-cr" min="0" max="100"></label>
        <label class="ev-ck"><input type="checkbox" id="ev-night" checked> Éjszaka (pihenés, szaporodás)</label>
        <label class="ev-ck"><input type="checkbox" id="ev-ws"> Vízi indulás (új világnál)</label>
        <div class="ev-row"><button class="btn" id="ev-save">Mentés</button><button class="btn" id="ev-load">Betöltés</button></div></details></div></div></div>`;
    C = makeCanvas($('#ev-st')); ctx = C.ctx; C.cv.style.zIndex = 1; statCv = $('#ev-chart');
    const sl = (id, k, f, show) => { const e = $('#' + id); e.value = f(CFG[k]); e.oninput = () => { CFG[k] = show(+e.value); lbl() } };
    const lbl = () => { $('#ev-pv').textContent = CFG.pop; $('#ev-mfv').textContent = Math.round(CFG.mutF * 100) + '%'; $('#ev-mav').textContent = Math.round(CFG.mutA * 100) + '%'; $('#ev-cv').textContent = Math.round(CFG.cross * 100) + '%' };
    sl('ev-pop', 'pop', v => v, v => v); sl('ev-mf', 'mutF', v => v * 100, v => v / 100); sl('ev-ma', 'mutA', v => v * 100, v => v / 100); sl('ev-cr', 'cross', v => v * 100, v => v / 100); lbl();
    $('#ev-night').onchange = e => CFG.night = e.target.checked; $('#ev-ws').onchange = e => CFG.waterStart = e.target.checked;
    $$('[data-es]', r).forEach(b => b.onclick = () => { CFG.speed = +b.dataset.es; $$('[data-es]').forEach(x => x.classList.toggle('sel', x === b)); sfx.click() });
    $('#ev-pause').onclick = () => { CFG.paused = !CFG.paused; $('#ev-pause').textContent = CFG.paused ? 'Folytatás' : 'Szünet' };
    $('#ev-fit').onclick = () => { fit(); sfx.click() };
    $('#ev-orig').onclick = () => { const rel = 'apps/evolucio-vizes/play.html', onPages = /^https?:/.test(location.protocol) && !/claude\.ai|claudeusercontent/.test(location.host); if (onPages) location.href = rel; else window.open((typeof SITE_URL !== 'undefined' ? SITE_URL : 'https://justkopi.github.io/hamori_nyiltnap/') + rel, '_blank') };
    $('#ev-new').onclick = () => { reset(null); fit(); panel(); sfx.click() };
    $('#ev-save').onclick = () => { const data = E.cr.slice(0, 250).map(c => ({ b: c.g.brain.map(a => Array.from(a, v => +v.toFixed(3))), t: TN.map(t => +c.g[t].toFixed(3)), x: Math.round(c.x), y: Math.round(c.y), gen: c.gen })); store.set('evo-save', { day: E.day, cr: data }); toast(`Elmentve: ${data.length} lény (${E.day}. nap).`, '#4ade80') };
    $('#ev-load').onclick = () => { const s = store.get('evo-save', null); if (!s) { toast('Még nincs mentés.', '#fbbf24'); return } E.cr = s.cr.map(o => { const g = { brain: o.b.map(a => Float32Array.from(a)) }; TN.forEach((t, i) => g[t] = o.t[i]); return newCreature(g, o.x, o.y, o.gen) }); E.day = s.day; E.tick = 0; E.phase = 'day'; E.food = []; E.foodSpawned = 0; E.hist = []; record(); panel(); toast('Betöltve!', '#4ade80') };
    $('#ev-inf').onclick = () => { const o = $('#ev-info'); o.style.display = 'block'; o.innerHTML = `<div class="card"><h2>Hogyan működik az Evolúció-labor?</h2>
      <h3>A lények agya</h3>Minden lénynek saját kis <b>neurális hálója</b> van: 19 bemenet, 10 rejtett neuron, 5 kimenet. Három látósugárral néz előre, balra és jobbra, és mindegyiken érzékeli, milyen közel van fa, étel, nála gyengébb vagy erősebb lény. Tudja, hogy víz van-e előtte, mennyi étele van, és van egy kis „memóriája” is. A kimenetek: előre megy, fordul, sprintel.
      <h3>Egy nap</h3>Napközben ételek teremnek a fák körül. A lények gyűjtögetnek (legfeljebb 5 ételt tarthatnak). Ha két különböző erejű lény összeütközik, az erősebb <b>elvesz</b> egy ételt, a gyengébb elkábul, és aznap nem szaporodhat.
      <h3>Éjszaka</h3>Mindenki megeszik 1 ételt – akinek nem jut, elpusztul. Ami 2 fölött marad, abból utód lesz (legfeljebb 3). Az utód a szülő génjeit kapja, gyakran egy közeli másik lénnyel <b>keresztezve</b>, és egy kis <b>mutációval</b>.
      <h3>Víz és szárazföld</h3>A térkép bal harmada víz. A <b>Vízkedvelés</b> gén dönti el, hol gyors a lény: aki jó úszó, az a szárazon lassú, és fordítva. Figyeld meg, ahogy idővel két „faj” alakul ki!
      <h3>Mit tanulunk belőle?</h3>Senki nem programozta be, hogyan keressen ételt egy lény – a <b>természetes kiválasztódás</b> „tanítja”: aki jobban boldogul, annak több utóda lesz. Ugyanezt az elvet használják a <b>genetikus algoritmusok</b> a mesterséges intelligenciában.
      <div style="margin-top:16px;text-align:center"><button class="btn go" id="ev-ic">Értem, vissza a szimulációhoz</button></div></div>`; $('#ev-ic').onclick = () => o.style.display = 'none' };
    C.cv.addEventListener('pointerdown', e => { const r = C.cv.getBoundingClientRect(); drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false }; C.cv.setPointerCapture(e.pointerId) });
    C.cv.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 5) { drag.moved = true; cam.follow = false } if (drag.moved) { cam.x = drag.cx - dx / cam.z; cam.y = drag.cy - dy / cam.z } });
    C.cv.addEventListener('pointerup', e => { if (drag && !drag.moved) { const r = C.cv.getBoundingClientRect(), [wx, wy] = toWorld(e.clientX - r.left, e.clientY - r.top); let best = null, bd = 30 / cam.z + 10; for (const c of E.cr) { const d = Math.hypot(c.x - wx, c.y - wy); if (d < bd) { bd = d; best = c } } E.sel = best; if (best) { sfx.click(); if (cam.z < .8) { cam.z = 1.1; cam.follow = true } } panel() } drag = null });
    C.cv.addEventListener('wheel', e => { e.preventDefault(); const r = C.cv.getBoundingClientRect(), [wx, wy] = toWorld(e.clientX - r.left, e.clientY - r.top), nz = clamp(cam.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), .15, 3); cam.x = wx - (e.clientX - r.left - C.W / 2) / nz; cam.y = wy - (e.clientY - r.top - C.H / 2) / nz; cam.z = nz }, { passive: false });
    reset(null); built = true; C.resize(); fit(); panel();
  };
  S.enter = () => { if (C) { C.resize(); if (cam.z < .05) fit() } };
  S.resize = () => { if (C) C.resize() };
  S.tick = dt => {
    if (!built) return; T += dt;
    if (!CFG.paused) { acc += dt * 60 * CFG.speed; let n = 0; const t0 = performance.now(); while (acc >= 1 && n < 600) { step(); acc--; n++; if (performance.now() - t0 > 22) { acc = 0; break } } }
    draw(); uiT += dt; if (uiT > .25) { uiT = 0; panel(); drawStats(); drawBrain() }
  };
  S._dbg = () => ({ E, CFG, step });
  return S;
})());
