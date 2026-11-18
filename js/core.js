/* ===== Közös keretrendszer: állomások, hang, effektek ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem('nyn-' + k); return v === null ? d : JSON.parse(v) } catch (e) { return d } },
  set(k, v) { try { localStorage.setItem('nyn-' + k, JSON.stringify(v)) } catch (e) { } }
};

/* ---- hang ---- */
let AC = null, muted = false;
function beep(freq = 600, dur = .08, type = 'sine', vol = .08, slide = 0, delay = 0) {
  if (muted) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + .02);
  } catch (e) { }
}
function noise(dur = .3, vol = .1) {
  if (muted) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const n = AC.sampleRate * dur, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = AC.createBufferSource(), g = AC.createGain(); g.gain.value = vol;
    s.buffer = b; s.connect(g).connect(AC.destination); s.start();
  } catch (e) { }
}
const sfx = {
  click: () => beep(700, .04, 'square', .03),
  ok: () => beep(880, .07, 'triangle', .07, 300),
  bad: () => beep(160, .2, 'square', .07, -60),
  win: () => [660, 880, 1100, 1320].forEach((f, i) => beep(f, .12, 'triangle', .07, 0, i * .09)),
  pop: () => { noise(.35, .2); beep(120, .3, 'sawtooth', .08, -80) },
  blip: () => beep(1000 + Math.random() * 400, .03, 'sine', .03),
  alarm: () => { beep(880, .15, 'square', .05); beep(660, .15, 'square', .05, 0, .16) },
};

/* ---- effekt-réteg (konfetti, szikrák) ---- */
const FX = {
  cv: null, ctx: null, parts: [],
  init() { this.cv = $('#fx'); this.ctx = this.cv.getContext('2d'); this.resize(); addEventListener('resize', () => this.resize()) },
  resize() { const d = devicePixelRatio || 1; this.cv.width = innerWidth * d; this.cv.height = innerHeight * d; this.ctx.setTransform(d, 0, 0, d, 0, 0) },
  burst(x, y, n = 20, cols = ['#5b9dff', '#f472b6', '#fbbf24', '#4ade80', '#a78bfa', '#2dd4bf'], spd = 6) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, s = Math.random() * spd + 1;
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, life: 1, col: pick(cols), r: Math.random() * Math.PI, w: 4 + Math.random() * 5 })
    }
  },
  confetti(x, y) { for (let k = 0; k < 4; k++) setTimeout(() => this.burst(x ?? innerWidth / 2, y ?? innerHeight / 2, 30, undefined, 9), k * 110) },
  burstEl(el, n, cols) { const r = el.getBoundingClientRect(); this.burst(r.left + r.width / 2, r.top + r.height / 2, n, cols) },
  step(dt) {
    const c = this.ctx; c.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of this.parts) {
      p.x += p.vx; p.y += p.vy; p.vx *= .97; p.vy = p.vy * .97 + .25; p.life -= dt * .8; p.r += .2;
      c.globalAlpha = Math.max(0, p.life); c.fillStyle = p.col;
      c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2); c.restore();
    }
    c.globalAlpha = 1; this.parts = this.parts.filter(p => p.life > 0 && p.y < innerHeight + 20);
  }
};

let toastT = null;
function toast(html, col = '#5b9dff', ms = 2200) {
  const t = $('#toast'); t.innerHTML = html; t.style.setProperty('--tc', col); t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms);
}

/* ---- canvas segéd ---- */
function makeCanvas(parent) {
  const cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  parent.appendChild(cv);
  const o = {
    cv, ctx: cv.getContext('2d'), W: 0, H: 0, resize() {
      const d = devicePixelRatio || 1; o.W = cv.clientWidth; o.H = cv.clientHeight;
      cv.width = Math.max(1, o.W * d); cv.height = Math.max(1, o.H * d); o.ctx.setTransform(d, 0, 0, d, 0, 0);
    }
  };
  return o;
}
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath() }

/* ---- ikonok (vonalas SVG) ---- */
const ICON_PATHS = {
  internet: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  router: '<rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 16.5h.01M11 16.5h.01M8.5 9.5a5 5 0 0 1 7 0M6 7a9 9 0 0 1 12 0"/>',
  kapcsolo: '<path d="M4 7h14l-3-3M20 17H6l3 3"/>',
  wifi: '<path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r=".8"/>',
  tuzfal: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  jelszo: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/>',
  ugyelet: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01M11 7.5h6M11 16.5h6"/>',
  pc: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx=".5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  led: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
  iot: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9.5 15a3.5 3.5 0 0 1 5 0M12 18h.01"/>',
  robot: '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4.5V8M9 13h.01M15 13h.01M9.5 16h5"/><circle cx="12" cy="3.5" r="1"/>',
  weblap: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 8.5h18M10 12.5l-2 2 2 2M14 12.5l2 2-2 2"/>',
  kviz: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  info: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5.5"/>',
  back: '<path d="M15 6l-6 6 6 6"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>',
  full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  logo: '<circle cx="5" cy="12" r="2.2"/><circle cx="19" cy="5" r="2.2"/><circle cx="19" cy="19" r="2.2"/><circle cx="12" cy="12" r="2.2"/><path d="M7.2 12h2.6M13.8 10.8l3.4-4.4M13.8 13.2l3.4 4.4"/>',
};
const icon = (k, sz = 24, sw = 1.8) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[k] || ''}</svg>`;
const CATS = [
  ['net', 'Hálózatok', ['internet', 'router', 'kapcsolo', 'wifi']],
  ['sec', 'Biztonság', ['tuzfal', 'jelszo']],
  ['ops', 'Rendszerüzemeltetés', ['terminal', 'ugyelet']],
  ['hw', 'Hardver és elektronika', ['pc', 'iot']],
  ['dev', 'Programozás és web', ['robot', 'weblap']],
  ['quiz', 'Kvíz', ['kviz']],
];
const MINS = { internet: 2, router: 1, kapcsolo: 4, wifi: 3, tuzfal: 1, jelszo: 2, terminal: 4, ugyelet: 1, pc: 2, led: 2, iot: 3, robot: 5, weblap: 3, kviz: 3 };

/* ---- nyitólap: élő hálózat-illusztráció ---- */
const Hero = {
  c: null, ctx: null, W: 0, H: 0, nodes: [], pk: [], t: 0, cols: [],
  init(cv) {
    this.c = cv; this.ctx = cv.getContext('2d'); this.resize();
    const cols = App.stations.filter(s => s.id !== 'info').map(s => s.color); this.cols = cols;
    this.nodes = Array.from({ length: 26 }, (_, i) => ({ x: .05 + Math.random() * .9, y: .06 + Math.random() * .88, vx: (Math.random() - .5) * .014, vy: (Math.random() - .5) * .014, r: i < 6 ? 7 : 3 + Math.random() * 2.5, c: i < 6 ? cols[i * 2 % cols.length] : null }));
  },
  resize() { if (!this.c) return; const d = devicePixelRatio || 1; this.W = this.c.clientWidth; this.H = this.c.clientHeight; this.c.width = Math.max(1, this.W * d); this.c.height = Math.max(1, this.H * d); this.ctx.setTransform(d, 0, 0, d, 0, 0) },
  step(dt) {
    if (!this.c || !this.W) return; const c = this.ctx, W = this.W, H = this.H, N = this.nodes; this.t += dt;
    c.clearRect(0, 0, W, H);
    for (const n of N) { n.x += n.vx * dt; n.y += n.vy * dt; if (n.x < .04 || n.x > .96) n.vx *= -1; if (n.y < .06 || n.y > .94) n.vy *= -1 }
    const lim = Math.min(W, H) * .36, edges = [];
    for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
      const a = N[i], b = N[j], d = Math.hypot((a.x - b.x) * W, (a.y - b.y) * H);
      if (d < lim) { edges.push([a, b]); c.strokeStyle = `rgba(255,255,255,${.14 * (1 - d / lim)})`; c.lineWidth = 1; c.beginPath(); c.moveTo(a.x * W, a.y * H); c.lineTo(b.x * W, b.y * H); c.stroke() }
    }
    if (edges.length && Math.random() < dt * 6 && this.pk.length < 14) { const e = pick(edges); this.pk.push({ a: e[0], b: e[1], t: 0, c: pick(this.cols) }) }
    for (const p of this.pk) { p.t += dt * .9; const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t; c.fillStyle = p.c; c.beginPath(); c.arc(x * W, y * H, 3, 0, 7); c.fill() }
    this.pk = this.pk.filter(p => p.t < 1);
    for (const n of N) {
      c.beginPath(); c.arc(n.x * W, n.y * H, n.r, 0, 7);
      if (n.c) { c.fillStyle = n.c; c.fill(); c.beginPath(); c.arc(n.x * W, n.y * H, n.r + 6 + Math.sin(this.t * 2 + n.x * 9) * 2, 0, 7); c.strokeStyle = n.c + '55'; c.lineWidth = 1.5; c.stroke() }
      else { c.fillStyle = '#2b2f38'; c.fill(); c.strokeStyle = '#4a4f5c'; c.lineWidth = 1; c.stroke() }
    }
  }
};

/* ---- állomás-kezelő ---- */
const App = {
  stations: [], cur: null, idle: 0, filter: 'all',
  add(s) { this.stations.push(s) },
  byId(id) { return this.stations.find(s => s.id === id) },
  card(s) {
    return `<button class="tile" style="--accent:${s.color}" data-id="${s.id}">
      <span class="tile-ic">${icon(s.id, 26)}</span>
      <span class="tile-tt">${s.title}</span><span class="tile-ds">${s.desc}</span>
      ${s.comp ? `<span class="tile-race">${icon('trophy', 13, 2.2)} Verseny</span>` : ''}
      <span class="tile-ft"><span>kb. ${MINS[s.id] || 2} perc</span><span class="tile-go">${icon('arrow', 18, 2)}</span></span></button>`;
  },
  feat() {
    const pc = this.byId('pc'), comp = this.stations.filter(s => s.comp && s.id !== 'pc');
    const img = (typeof Dev !== 'undefined' && Dev.img) ? Dev.img('desktop', 260) : '';
    return `<button class="feat-pc tile" style="--accent:${pc.color}" data-id="pc">
        <span class="feat-txt"><span class="feat-badge">${icon('star', 14, 2)} Kiemelt</span>
        <span class="feat-tt">${pc.title}</span>
        <span class="feat-ds">Rendelj alkatrészeket a boltból, csavarozd össze a gépet, kösd be a kábeleket, majd kapcsold be és telepíts rá rendszert. Teljesíts megrendeléseket, javíts elromlott gépeket, vagy építs szabadon.</span>
        <span class="feat-pills"><span>Valódi alkatrészek</span><span>Csavarhúzó</span><span>Vízhűtés, RGB</span><span>Windows-telepítés</span><span>Megrendelések</span></span>
        <span class="btn go feat-go">Irány a műhely ${icon('arrow', 18, 2)}</span></span>
        ${img ? `<img class="feat-img" src="${img}" alt="">` : ''}</button>
      ${comp.length ? `<div class="feat-h"><h3>${icon('trophy', 18, 2)} Versenyezz!</h3><span>Ezekben időre lehet játszani, és az eredmény felkerül a ranglistára.</span><button class="btn" id="hub-lb">${icon('star', 16, 2)} Ranglista</button></div>
      <div class="grid feat-grid">${comp.map(s => this.card(s)).join('')}</div>` : ''}`;
  },
  renderHub() {
    const f = this.filter;
    const fe = $('#feat'); if (fe) { fe.innerHTML = this.feat(); const lb = $('#hub-lb'); if (lb) lb.onclick = e => { e.stopPropagation(); Comp.board() } }
    $('#cats').innerHTML = [['all', 'Összes'], ...CATS.map(c => [c[0], c[1]])].map(([k, n]) => `<button class="chip ${k === f ? 'on' : ''}" data-cat="${k}">${n}</button>`).join('');
    $('#tiles').innerHTML = CATS.filter(c => f === 'all' || c[0] === f).map(c => `<section class="cat"><h3>${c[1]}</h3><div class="grid">${c[2].map(id => this.card(this.byId(id))).join('')}</div></section>`).join('');
    $$('.chip').forEach(b => b.onclick = () => { this.filter = b.dataset.cat; sfx.click(); this.renderHub() });
    $$('.tile').forEach(t => t.onclick = () => { sfx.click(); location.hash = t.dataset.id });
  },
  init() {
    FX.init();
    $('#logo-ic').innerHTML = icon('logo', 22, 1.8); $('#back-ic').innerHTML = icon('back', 18, 2.2);
    $('#mute').innerHTML = icon('sound', 20); $('#fs').innerHTML = icon('full', 20);
    $('#parents-ic').innerHTML = icon('info', 28); $('#parents-go').innerHTML = icon('arrow', 20, 2);
    this.renderHub();
    Hero.init($('#hero-cv'));
    $('#start-btn').onclick = () => { sfx.click(); location.hash = 'internet' };
    $('#parents-btn').onclick = $('#parents-card').onclick = () => { sfx.click(); location.hash = 'info' };
    $('#homebtn').onclick = $('#logo').onclick = () => { location.hash = '' };
    $('#racebtn').innerHTML = icon('trophy', 16, 2.2) + ' Verseny'; $('#lbbtn').innerHTML = icon('star', 16, 2) + ' Ranglista';
    $('#racebtn').onclick = () => Comp.race(); $('#lbbtn').onclick = () => Comp.board(); $('#plbtn').onclick = () => App.cur && Comp.onEnter(App.cur);
    $('#mute').onclick = e => { muted = !muted; e.currentTarget.innerHTML = icon(muted ? 'mute' : 'sound', 20) };
    $('#fs').onclick = () => { try { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { }); else document.exitFullscreen() } catch (e) { } };
    addEventListener('hashchange', () => this.route());
    addEventListener('resize', () => { Hero.resize(); this.cur && this.cur.resize && this.cur.resize() });
    ['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => this.idle = 0));
    this.route();
    let last = performance.now();
    const loop = now => {
      const dt = Math.min(.05, (now - last) / 1000); last = now; this.idle += dt;
      if (this.cur && this.cur.tick) { try { this.cur.tick(dt) } catch (e) { console.error(e) } }
      if (!this.cur) Hero.step(dt);
      FX.step(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },
  route() {
    const id = location.hash.slice(1);
    const s = this.byId(id);
    if (this.cur && this.cur.leave) this.cur.leave();
    if (this.cur) Comp.onLeave(this.cur);
    $('#toast').classList.remove('show');
    $$('.station').forEach(x => x.classList.remove('active'));
    if (!s) {
      this.cur = null; $('#hub').classList.add('active'); document.body.classList.add('on-hub');
      $('#crumb').innerHTML = ''; $('#topic').textContent = ''; setTimeout(() => Hero.resize(), 0); return;
    }
    document.body.classList.remove('on-hub');
    document.documentElement.style.setProperty('--accent', s.color);
    let el = $('#st-' + s.id);
    if (!el) {
      el = document.createElement('section'); el.className = 'station'; el.id = 'st-' + s.id;
      $('#stage').appendChild(el); s.root = el; s.build(el);
    }
    el.classList.add('active'); this.cur = s;
    $('#crumb').innerHTML = `<span class="crumb-ic">${icon(s.id, 18, 2)}</span><span>${s.title}</span>`; $('#topic').textContent = s.topic;
    if (s.resize) s.resize();
    if (s.enter) s.enter();
    Comp.onEnter(s);
  }
};
