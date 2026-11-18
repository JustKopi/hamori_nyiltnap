/* ===== 1. Az internet útja: csomagok, terhelés, kábelezés, hálózatmentés ===== */
App.add((() => {
  const S = {
    id: 'internet', icon: '', title: 'Az internet útja', color: '#5b9dff',
    desc: 'Küldj üzenetet, fotót, nézz videót, játssz online, és figyeld, melyik kábel telik be! Vágj el, húzz új kábelt, ments meg a hálózatot!',
    topic: 'Hálózatok felépítése, IP, TCP/UDP, sávszélesség, késleltetés, redundancia'
  };
  let C, ctx, hoverEdge = null, packets = [], particles = [], messages = [], T = 0, idleSend = 0, tool = 'cut', newType = 'utp', dragFrom = null, dragPt = null;
  const stats = { sent: 0, ok: 0, lost: 0, cut: 0, best: Infinity };
  const PAL = ['#5b9dff', '#f472b6', '#fbbf24', '#4ade80', '#a78bfa', '#fb923c', '#60a5fa'];
  const NODES = [
    { id: 'me', x: .06, y: .52, label: 'A te laptopod', dev: 'laptop', s: 84, end: 1 },
    { id: 'r1', x: .19, y: .52, label: 'Otthoni router', dev: 'router', s: 78 },
    { id: 'r2', x: .33, y: .30, label: 'Szolgáltató', dev: 'corerouter', s: 84 },
    { id: 'r3', x: .33, y: .70, label: 'Városi csomópont', dev: 'corerouter', s: 84 },
    { id: 'r4', x: .49, y: .18, label: 'Budapest', dev: 'corerouter', s: 84 },
    { id: 'r5', x: .49, y: .50, label: 'Bécs', dev: 'corerouter', s: 84 },
    { id: 'r6', x: .49, y: .80, label: 'Tengeri kábelállomás', dev: 'corerouter', s: 84 },
    { id: 'r7', x: .65, y: .30, label: 'Frankfurt', dev: 'corerouter', s: 84 },
    { id: 'r8', x: .65, y: .72, label: 'Amszterdam', dev: 'corerouter', s: 84 },
    { id: 'r9', x: .78, y: .52, label: 'Adatközpont', dev: 'rack', s: 74 },
    { id: 'yt', x: .93, y: .20, label: 'Videó-szerver', dev: 'rack', s: 74, end: 1 },
    { id: 'nagyi', x: .93, y: .52, label: 'Nagyi tabletje', dev: 'tablet', s: 64, end: 1 },
    { id: 'game', x: .93, y: .80, label: 'Játékszerver', dev: 'rack', s: 74, end: 1 },
  ];
  const N = {}; NODES.forEach(n => N[n.id] = n);
  // kapacitás: csomagegység, ami egyszerre a kábelen lehet terhelés nélkül
  const CT = { patch: [14, '1 Gbit/s UTP'], gray: [8, '500 Mbit/s előfizetés'], yellow: [8, '500 Mbit/s'], fiber: [40, '10 Gbit/s optika'], utp: [14, '1 Gbit/s UTP'], opt: [120, '100 Gbit/s optika'] };
  const BASE = [['me', 'r1'], ['r1', 'r2'], ['r1', 'r3'], ['r2', 'r4'], ['r2', 'r5'], ['r3', 'r5'], ['r3', 'r6'], ['r4', 'r7'], ['r5', 'r7'], ['r5', 'r8'], ['r6', 'r8'], ['r7', 'r9'], ['r8', 'r9'], ['r4', 'yt'], ['r7', 'yt'], ['r9', 'nagyi'], ['r9', 'yt'], ['r9', 'game'], ['r8', 'game'], ['r6', 'game'], ['r2', 'r3'], ['r7', 'r8']];
  let EDGES = [];
  function resetEdges() { EDGES = BASE.map(([a, b]) => mkEdge(a, b, a === 'me' ? 'patch' : a === 'r1' ? 'gray' : b === 'nagyi' ? 'yellow' : 'fiber')) }
  function mkEdge(a, b, k, user) { return { a, b, k, user: !!user, alive: true, util: 0, rate: 0, cnt: 0, fix: 0, type: k === 'utp' ? 'gray' : k === 'opt' ? 'fiber' : k, cap: CT[k][0] } }
  resetEdges();
  const px = n => n.x * C.W, py = n => n.y * C.H;
  const edgeBetween = (a, b) => EDGES.find(e => (e.a === a && e.b === b) || (e.a === b && e.b === a));
  const dist = (a, b) => Math.hypot(px(N[a]) - px(N[b]), py(N[a]) - py(N[b]));
  function route(from, to, jitter) {
    const d = {}, prev = {}, Q = new Set(NODES.map(n => n.id));
    NODES.forEach(n => d[n.id] = Infinity); d[from] = 0;
    while (Q.size) {
      let u = null; for (const q of Q) if (u === null || d[q] < d[u]) u = q;
      if (d[u] === Infinity) break; Q.delete(u); if (u === to) break;
      for (const e of EDGES) {
        if (!e.alive || (e.a !== u && e.b !== u)) continue;
        const v = e.a === u ? e.b : e.a; if (N[v].end && v !== to) continue;
        const w = dist(u, v) * (1 + (jitter ? Math.random() * jitter : 0)) * (1 + e.util * 1.6) * (e.cap >= 40 ? .8 : 1);
        if (d[u] + w < d[v]) { d[v] = d[u] + w; prev[v] = u }
      }
    }
    if (d[to] === Infinity) return null;
    const p = [to]; while (p[0] !== from) p.unshift(prev[p[0]]); return p;
  }
  const rad = n => n.s * .36;
  function layoutCables() { for (const e of EDGES) { const A = N[e.a], B = N[e.b]; e.P = Cable.pts(px(A), py(A), px(B), py(B), .06) } }
  function onCable(a, b, t) { const e = edgeBetween(a, b); if (!e.P) layoutCables(); return Cable.at(e.P, e.a === a ? t : 1 - t) }

  /* ---- forgalomtípusok ---- */
  function sendMessage(text, dest) {
    text = (text || '').toUpperCase().trim() || 'SZIA';
    const m = { kind: 'text', text, src: 'me', dest, n: text.length, slots: Array(text.length).fill(null), t0: performance.now(), done: false, lostCount: 0, color: PAL[messages.length % PAL.length], sz: .6 };
    messages.push(m); [...text].forEach((ch, i) => setTimeout(() => launch(m, i, false), i * 170));
    beep(520, .06, 'square', .05, 300);
  }
  function sendFile(dest) {
    const n = 24, m = { kind: 'file', text: 'FOTÓ', src: 'me', dest, n, slots: Array(n).fill(null), t0: performance.now(), done: false, lostCount: 0, color: PAL[messages.length % PAL.length], sz: 1 };
    messages.push(m); for (let i = 0; i < n; i++) setTimeout(() => launch(m, i, false), i * 70);
    beep(420, .1, 'square', .05, 200); toast('Fotó küldése: <b>5 MB</b> = 24 csomag (a valóságban kb. 3500!)', '#5b9dff', 2600);
  }
  const live = { video: null, game: null };
  function toggleLive(k) {
    if (live[k]) { messages = messages.filter(m => m !== live[k]); live[k] = null }
    else {
      live[k] = k === 'video' ? { kind: 'stream', src: 'yt', dest: 'me', rate: 6, need: 5, buf: 5, play: true, stall: 0, color: '#f472b6', sz: 1, acc: 0, slots: [], lostCount: 0 }
        : { kind: 'game', src: 'me', dest: 'game', rate: 5, sz: .25, acc: 0, pings: [], color: '#4ade80', slots: [], lostCount: 0 };
      messages.push(live[k]);
    }
    liveBtns();
  }
  function liveBtns() { $('#n-video').classList.toggle('sel', !!live.video); $('#n-game').classList.toggle('sel', !!live.game); $('#n-video').innerHTML = `${icon('video', 16)} Videó ${live.video ? 'KI' : 'BE'}`; $('#n-game').innerHTML = `${icon('gamepad', 16)} Játék ${live.game ? 'KI' : 'BE'}` }
  function launch(m, i, retry) {
    const path = route(m.src, m.dest, .7);
    stats.sent++; if (retry) { stats.lost++; m.lostCount++ }
    const p = { m, i, ch: m.kind === 'text' ? m.text[i] : '', sz: m.sz, path: path || [m.src], seg: 0, t: 0, at: m.src, retry, wait: path ? 0 : .001, trail: [], speed: .55 + Math.random() * .2, born: T };
    packets.push(p);
  }
  function burst(x, y, col, n = 18, spd = 4) { for (let k = 0; k < n; k++) { const a = Math.random() * 7, s = Math.random() * spd + 1; particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, col }) } }
  function lose(p, x, y) {
    burst(x, y, '#f87171', 16, 4); beep(300, .12, 'sawtooth', .04, -200); packets.splice(packets.indexOf(p), 1);
    if (race.on) race.lost++;
    if (p.m.kind === 'text' || p.m.kind === 'file') setTimeout(() => { if (messages.includes(p.m)) launch(p.m, p.i, true) }, 900); else { stats.lost++; p.m.lostCount++ }
  }
  function step(dt) {
    for (const p of packets) if (!p.wait && p.entSeg !== p.seg + ':' + p.path[p.seg]) { p.entSeg = p.seg + ':' + p.path[p.seg]; const e = edgeBetween(p.path[p.seg], p.path[p.seg + 1]); if (e) e.cnt += p.sz }
    for (const e of EDGES) { e.rate += (e.cnt / Math.max(dt, .001) - e.rate) * Math.min(1, dt * 1.2); e.cnt = 0; e.util = e.rate / e.cap; if (!e.alive && e.fix > 0) { e.fix += dt / 2; if (e.fix >= 1) { e.alive = true; e.fix = 0; stats.cut = Math.max(0, stats.cut - 1); beep(700, .15, 'triangle', .07, 500); upd() } } }
    for (const m of messages) {
      if (m.kind === 'stream' || m.kind === 'game') { m.acc += dt * m.rate; while (m.acc >= 1) { m.acc--; launch(m, 0, false) } }
      if (m.kind === 'stream') { if (m.play) { m.buf -= dt; if (m.buf <= 0) { m.buf = 0; m.play = false } } else { m.stall += dt; if (race.on) race.stall += dt; if (m.buf > 1) m.play = true } }
    }
    for (const p of [...packets]) {
      if (p.wait > 0) {
        p.wait += dt; const np = route(p.at, p.m.dest, 0);
        if (np) { p.path = np; p.seg = 0; p.t = 0; p.wait = 0 } else if (p.wait > 2.5) lose(p, px(N[p.at]), py(N[p.at]));
        continue;
      }
      const a = p.path[p.seg], b = p.path[p.seg + 1], e = edgeBetween(a, b);
      if (!e || !e.alive) { const [lx, ly] = onCable(a, b, p.t); lose(p, lx, ly); continue }
      const slow = 1 + Math.max(0, e.util - .9) * 2.5;
      if (e.util > 1.4 && Math.random() < dt * .8 * (e.util - 1.4)) { const [lx, ly] = onCable(a, b, p.t); lose(p, lx, ly); continue }
      p.t += dt * p.speed * C.W * .42 / dist(a, b) / slow;
      if (p.t >= 1) {
        p.seg++; p.t = 0; p.at = b;
        if (b === p.m.dest) { arrive(p); continue }
        const nx = p.path[p.seg + 1], ne = edgeBetween(b, nx);
        if (!ne || !ne.alive || ne.util > 1.1) { const np = route(b, p.m.dest, 0); if (np) { p.path = np; p.seg = 0 } else { p.wait = .001; p.path = [b]; p.seg = 0 } }
      }
    }
    for (const q of particles) { q.x += q.vx; q.y += q.vy; q.vx *= .94; q.vy = q.vy * .94 + .05; q.life -= dt * 1.4 }
    particles = particles.filter(q => q.life > 0);
  }
  function arrive(p) {
    packets.splice(packets.indexOf(p), 1); const m = p.m; stats.ok++; if (race.on) race.ok++;
    if (m.kind === 'stream') { m.buf = Math.min(6, m.buf + 1 / m.need); return }
    if (m.kind === 'game') { m.pings.push((T - p.born) * 28 + 4); if (m.pings.length > 12) m.pings.shift(); return }
    if (m.slots[p.i] !== null) return;
    m.slots[p.i] = p.ch || 1; beep(1200, .05, 'triangle', .04, 400);
    burst(px(N[m.dest]), py(N[m.dest]), m.color, 6, 3);
    if (m.slots.every(s => s !== null) && !m.done) {
      m.done = true; const ms = Math.round(performance.now() - m.t0); stats.best = Math.min(stats.best, ms); sfx.win();
      const r = C.cv.getBoundingClientRect(); FX.confetti(r.left + px(N[m.dest]), r.top + py(N[m.dest]));
      banner(m.kind === 'file' ? 'A fotó megérkezett!' : `Megérkezett: „${esc(m.text)}”`, `${m.n} csomag • ${(ms / 1000).toFixed(1)} mp • ${m.lostCount ? m.lostCount + ' újraküldve (TCP)' : 'hibátlan átvitel'}`);
      setTimeout(() => messages = messages.filter(x => x !== m), 4500);
    }
    upd();
  }
  let bT; function banner(t, s, col = '#4ade80') { const b = $('#n-banner'); b.innerHTML = `${t}<small>${s}</small>`; b.style.borderColor = col; b.classList.add('show'); clearTimeout(bT); bT = setTimeout(() => b.classList.remove('show'), 2600) }
  function upd() {
    $('#n-sent').textContent = stats.sent; $('#n-ok').textContent = stats.ok; $('#n-lost').textContent = stats.lost;
    $('#n-cut').textContent = stats.cut; $('#n-ms').textContent = stats.best < Infinity ? (stats.best / 1000).toFixed(2) + ' mp' : '–';
    const hot = EDGES.filter(e => e.alive).sort((a, b) => b.util - a.util)[0];
    $('#n-hot').innerHTML = hot && hot.util > .3 ? `<b style="color:${hot.util > .85 ? 'var(--red)' : 'var(--yellow)'}">${N[hot.a].label} – ${N[hot.b].label}</b>: ${Math.round(hot.util * 100)}% (${CT[hot.k][1]})` : 'Minden kábel bírja a forgalmat.';
  }
  const ucol = u => u > .85 ? '#f87171' : u > .5 ? '#fbbf24' : '#5b9dff';
  function draw() {
    const W = C.W, H = C.H; ctx.clearRect(0, 0, W, H); layoutCables();
    ctx.fillStyle = '#ffffff06';
    for (let x = 20; x < W; x += 32) for (let y = 20; y < H; y += 32) ctx.fillRect(x, y, 1.5, 1.5);
    for (const e of EDGES) {
      const A = N[e.a], B = N[e.b], u = e.util;
      Cable.draw(ctx, px(A), py(A), px(B), py(B), { type: e.type, w: e.cap >= 40 ? 4 + (e.cap >= 120 ? 2 : 0) : 5, sag: .06, r1: rad(A), r2: rad(B), cut: !e.alive,
        glow: !e.alive ? null : e === hoverEdge && tool === 'cut' ? '#f87171' : u > .1 ? (u > .85 ? `rgba(248,113,113,${.5 + .4 * Math.sin(T * 8)})` : u > .5 ? 'rgba(251,191,36,.8)' : `rgba(91,157,255,${Math.min(.8, u + .2)})`) : null });
      const [mx, my] = Cable.at(e.P, .5);
      if (!e.alive) {
        if (Math.random() < .04) burst(mx, my, '#fbbf24', 2, 2);
        ctx.font = '600 11px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (e.fix > 0) { ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(mx, my, 14, -1.57, -1.57 + e.fix * 6.283); ctx.stroke(); ctx.fillStyle = '#4ade80'; ctx.fillText('javítás…', mx, my - 24) }
        else { ctx.fillStyle = '#f87171'; ctx.fillText(race.on ? 'HIBA! kattints a javításhoz' : 'kattints a javításhoz', mx, my - 16) }
      } else if (u > .15 || e === hoverEdge) {
        const t = `${Math.round(u * 100)}%`; ctx.font = '700 11px Inter,sans-serif'; const tw = ctx.measureText(t).width + 12;
        ctx.fillStyle = 'rgba(11,12,15,.9)'; rrect(ctx, mx - tw / 2, my - 9, tw, 18, 9); ctx.fill(); ctx.strokeStyle = ucol(u); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = ucol(u); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, mx, my + .5);
        if (e === hoverEdge) { ctx.fillStyle = '#c9ccd3'; ctx.font = '500 11px Inter,sans-serif'; ctx.fillText(CT[e.k][1], mx, my + 18) }
      }
    }
    if (dragFrom && dragPt) { ctx.setLineDash([8, 6]); ctx.strokeStyle = newType === 'opt' ? '#fbbf24' : '#9fb4ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px(N[dragFrom]), py(N[dragFrom])); ctx.lineTo(dragPt[0], dragPt[1]); ctx.stroke(); ctx.setLineDash([]) }
    NODES.forEach((n, idx) => {
      const x = px(n), y = py(n);
      if (n.end) { ctx.save(); ctx.globalAlpha = .18 + Math.sin(T * 3 + n.x * 9) * .06; ctx.fillStyle = '#5b9dff'; ctx.beginPath(); ctx.ellipse(x, y + n.s * .42, n.s * .62, n.s * .14, 0, 0, 7); ctx.fill(); ctx.restore() }
      if (tool === 'wire' && !n.end || tool === 'wire' && n.id === 'me') { ctx.strokeStyle = 'rgba(159,180,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, n.s * .55, 0, 7); ctx.stroke() }
      Dev.draw(ctx, n.dev, x, y, n.s, { t: T + idx });
      ctx.font = '600 13px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const lw = ctx.measureText(n.label).width + 14, ly = y + n.s * .5 + 10; ctx.fillStyle = 'rgba(11,12,15,.85)'; rrect(ctx, x - lw / 2, ly - 10, lw, n.end ? 20 : 36, 7); ctx.fill(); ctx.fillStyle = '#e5e7eb'; ctx.fillText(n.label, x, ly);
      if (!n.end) { ctx.font = '11px "JetBrains Mono",Consolas,monospace'; ctx.fillStyle = '#6b7180'; ctx.fillText('10.0.' + idx + '.1', x, y + n.s * .5 + 25) }
    });
    // élő szolgáltatások kijelzői
    if (live.video) { const m = live.video, x = px(N.me) + 6, y = py(N.me) + 76; box(x - 40, y, 120, 46, m.play ? '#f472b6' : '#f87171'); ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = '700 12px Inter,sans-serif'; ctx.fillText(m.play ? 'Videó: lejátszás' : 'AKADOZIK!', x - 32, y + 13); ctx.fillStyle = '#262a33'; ctx.fillRect(x - 32, y + 24, 104, 8); ctx.fillStyle = m.buf > 1 ? '#4ade80' : '#f87171'; ctx.fillRect(x - 32, y + 24, 104 * Math.min(1, m.buf / 6), 8); ctx.font = '500 10px Inter,sans-serif'; ctx.fillStyle = '#c9ccd3'; ctx.fillText(`puffer: ${m.buf.toFixed(1)} mp`, x - 32, y + 39) }
    if (live.game) { const m = live.game, pg = m.pings.length ? m.pings.reduce((a, b) => a + b) / m.pings.length : 0, x = px(N.game), y = py(N.game) - 82, c = pg > 80 ? '#f87171' : pg > 45 ? '#fbbf24' : '#4ade80'; box(x - 50, y, 100, 34, c); ctx.textAlign = 'center'; ctx.fillStyle = c; ctx.font = '800 15px Inter,sans-serif'; ctx.fillText(pg ? `ping: ${Math.round(pg)} ms` : 'ping: –', x, y + 12); ctx.font = '500 10px Inter,sans-serif'; ctx.fillStyle = '#c9ccd3'; ctx.fillText(pg > 80 ? 'laggol!' : 'online játék', x, y + 26) }
    const stack = {};
    for (const m of messages) {
      if (m.kind !== 'text' && m.kind !== 'file') continue;
      const k0 = stack[m.dest] = (stack[m.dest] || 0) + 1, n = N[m.dest];
      if (m.kind === 'file') { const got = m.slots.filter(s => s !== null).length, x = px(n) - 70, y = py(n) - 84 - (k0 - 1) * 32; box(x, y, 110, 26, m.color); ctx.fillStyle = m.color; ctx.globalAlpha = .35; ctx.fillRect(x + 2, y + 2, 106 * got / m.n, 22); ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.font = '700 12px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`Fotó ${Math.round(got / m.n * 100)}%`, x + 55, y + 13); continue }
      const x = px(n) + 40 - m.slots.length * 26, y = py(n) - 84 - (k0 - 1) * 32;
      m.slots.forEach((s, k) => {
        const bx = x + k * 26; ctx.fillStyle = s ? m.color : '#ffffff14'; ctx.strokeStyle = m.color; ctx.lineWidth = 2; rrect(ctx, bx, y, 22, 26, 5); ctx.fill(); ctx.stroke();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (s) { ctx.fillStyle = '#0b0c0f'; ctx.font = 'bold 16px Consolas,monospace'; ctx.fillText(s, bx + 11, y + 14) } else { ctx.fillStyle = '#ffffff55'; ctx.font = '11px Consolas'; ctx.fillText(k + 1, bx + 11, y + 14) }
      });
    }
    for (const p of packets) {
      let x, y;
      if (p.wait > 0) { x = px(N[p.at]); y = py(N[p.at]) - 34; if (Math.floor(T * 6) % 2) continue }
      else[x, y] = onCable(p.path[p.seg], p.path[p.seg + 1], p.t);
      const big = p.m.kind === 'text', s = big ? 13 : p.m.kind === 'game' ? 4 : 7;
      if (big) { p.trail.push([x, y]); if (p.trail.length > 12) p.trail.shift(); p.trail.forEach(([tx, ty], k) => { ctx.globalAlpha = k / p.trail.length * .5; ctx.fillStyle = p.m.color; ctx.beginPath(); ctx.arc(tx, ty, k / 2, 0, 7); ctx.fill() }) }
      ctx.globalAlpha = 1; ctx.shadowColor = p.m.color; ctx.shadowBlur = big ? 10 : 6; ctx.fillStyle = p.retry ? '#ff8a8a' : p.m.color; rrect(ctx, x - s, y - s, s * 2, s * 2, big ? 6 : 2); ctx.fill(); ctx.shadowBlur = 0;
      if (big) { ctx.fillStyle = '#0b0c0f'; ctx.font = 'bold 17px Consolas,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.ch === ' ' ? '␣' : p.ch, x, y + 1) }
    }
    for (const q of particles) { ctx.globalAlpha = Math.max(0, q.life); ctx.fillStyle = q.col; ctx.fillRect(q.x - 2, q.y - 2, 4, 4) }
    ctx.globalAlpha = 1;
  }
  function box(x, y, w, h, c) { ctx.fillStyle = 'rgba(11,12,15,.92)'; rrect(ctx, x, y, w, h, 8); ctx.fill(); ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.stroke(); ctx.textBaseline = 'middle' }
  function edgeAt(mx, my) {
    let best = null, bd = 16;
    for (const e of EDGES) { if (!e.alive || !e.P) continue; const [d, t] = Cable.dist(e.P, mx, my); if (t > .1 && t < .9 && d < bd) { bd = d; best = e } }
    return best;
  }
  const nodeAt = (mx, my) => NODES.find(n => Math.hypot(mx - px(n), my - py(n)) < n.s * .55);

  /* ---- Verseny: Hálózatmentő ---- */
  const race = { on: false, t: 0, ok: 0, lost: 0, stall: 0, nextCut: 0, msgT: 0 };
  function score() { return Math.max(0, race.ok * 2 - race.lost * 4 - Math.round(race.stall * 8)) }
  function raceStart() {
    resetAll(); Object.assign(race, { on: true, t: 60, ok: 0, lost: 0, stall: 0, nextCut: 4, msgT: 1 });
    if (!live.video) toggleLive('video'); if (!live.game) toggleLive('game');
    $('#n-race').style.display = ''; $('#n-fact').style.display = 'none'; banner('Hálózatmentő!', 'Kábelhibák jönnek – javítsd őket, mielőtt akadozni kezd a videó!', '#fbbf24');
  }
  function raceTick(dt) {
    race.t -= dt; race.nextCut -= dt; race.msgT -= dt;
    if (race.msgT <= 0) { race.msgT = 3; Math.random() < .5 ? sendFile('nagyi') : sendMessage(pick(['HAHO', 'SZIA', 'PING', 'NYILT NAP']), 'nagyi') }
    if (race.nextCut <= 0) {
      race.nextCut = Math.max(2.2, 5 - (60 - race.t) / 20);
      const cand = EDGES.filter(e => e.alive && e.a !== 'me' && !N[e.b].end).sort((a, b) => b.util - a.util).slice(0, 4);
      const e = pick(cand); if (e) { e.alive = false; stats.cut++; const [mx, my] = Cable.at(e.P, .5); burst(mx, my, '#fbbf24', 40, 7); beep(180, .25, 'sawtooth', .08, -120); noise(.2, .06) }
    }
    $('#n-race').innerHTML = `<b>${Math.ceil(race.t)} mp</b><span>${score()} pont</span><i>${race.ok} csomag célba ért • ${race.lost} elveszett • akadás: ${race.stall.toFixed(1)} mp</i>`;
    if (race.t <= 0) {
      race.on = false; $('#n-race').style.display = 'none'; $('#n-fact').style.display = ''; const sc = score(); best = Math.max(best, sc);
      Comp.finish(sc, `${race.ok} csomag célba ért, ${race.lost} elveszett, ${race.stall.toFixed(1)} mp videóakadás`); resetAll();
    }
  }
  let best = 0;
  function resetAll() { packets = []; messages = []; live.video = live.game = null; resetEdges(); stats.cut = 0; liveBtns(); upd() }

  const FACTS = [
    'Az üzeneted nem egyben utazik: kis <b>csomagokra</b> darabolják, és mindegyik megkeresi a saját útját.',
    'Ha egy csomag elveszik, a <b>TCP</b> észreveszi és újraküldi. Élő videónál és játéknál gyakran nincs idő erre.',
    'A <b>szűk keresztmetszet</b> legtöbbször az otthoni előfizetés, nem a gerinchálózat. Kapcsold be a videót, és nézd a százalékokat!',
    'A <b>ping</b> azt mutatja, mennyi idő alatt ér oda és vissza egy csomag. Online játékhoz 40 ms alatti az ideális.',
    'Az optikai kábel fényt használ: egyetlen szál akár <b>több száz Gbit/s</b>-ot is elvisz.',
    'A hálózatokat <b>redundánsan</b> építik: ha egy kábel kiesik, van másik út. Vágj el pár kábelt, és nézd!',
    'Egy 5 MB-os fotó a valóságban <b>kb. 3500 csomagban</b> utazik, egyenként legfeljebb 1500 bájt.',
  ];
  let fi = 0, factI;
  function setTool(t) { tool = t; $$('[data-tool]').forEach(b => b.classList.toggle('sel', b.dataset.tool === t)); C.cv.style.cursor = t === 'wire' ? 'copy' : 'crosshair' }
  S.build = root => {
    root.innerHTML = `
    <style>
      #n-stats{position:absolute;top:12px;left:12px;font-size:14px;line-height:1.6;width:250px;z-index:2}
      #n-stats .v{float:right;font-weight:800;color:var(--cyan);margin-left:12px}#n-stats .r{color:var(--red)}#n-stats .g{color:var(--green)}
      #n-hot{font-size:12.5px;color:#c9ccd3;line-height:1.4;margin-top:6px;border-top:1px solid var(--line);padding-top:6px}
      #n-fact{position:absolute;top:226px;left:12px;width:250px;font-size:14px;line-height:1.45;transition:opacity .6s;z-index:2}
      #n-fact .t{color:var(--yellow);font-weight:800;margin-bottom:4px}
      #n-bar{position:absolute;left:50%;transform:translateX(-50%);bottom:12px;display:flex;flex-direction:column;gap:6px;z-index:3;width:max-content;max-width:96%;padding:10px 12px}
      #n-bar .row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center}#n-bar .btn{height:38px;padding:0 12px;font-size:14px;display:inline-flex;gap:6px;align-items:center}
      #n-bar .sep{width:1px;height:26px;background:var(--line2);margin:0 4px}
      #n-bar .lbl{font-size:12px;color:var(--muted);font-weight:600}
      #n-msg{font-size:18px;padding:6px 10px;width:190px;border-radius:10px;border:2px solid var(--line);background:#101216;color:var(--text);text-transform:uppercase;font-weight:700;letter-spacing:2px}
      #n-banner{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%) scale(.6);opacity:0;pointer-events:none;z-index:4;
        font-size:36px;font-weight:900;text-align:center;padding:18px 34px;border-radius:24px;background:#15171cee;border:3px solid var(--green);transition:all .35s cubic-bezier(.2,1.6,.4,1)}
      #n-banner.show{opacity:1;transform:translate(-50%,-50%) scale(1)} #n-banner small{display:block;font-size:18px;font-weight:600;color:var(--muted);margin-top:6px}
      #n-race{position:absolute;top:226px;left:12px;width:250px;z-index:4;background:var(--panel);border:2px solid var(--yellow);border-radius:16px;padding:10px 14px;display:flex;gap:12px;align-items:baseline;flex-wrap:wrap}
      #n-race b{font-size:26px;color:var(--yellow)}#n-race span{font-size:22px;font-weight:800}#n-race i{font-style:normal;font-size:13px;color:var(--muted);width:100%}
    </style>
    <div class="panel" id="n-stats">Elküldött csomagok <span class="v" id="n-sent">0</span><br>Megérkezett <span class="v g" id="n-ok">0</span><br>
      Elveszett <span class="v r" id="n-lost">0</span><br>Elvágott kábelek <span class="v r" id="n-cut">0</span><br>Leggyorsabb üzenet <span class="v" id="n-ms">–</span>
      <div id="n-hot"></div></div>
    <div class="panel" id="n-fact"><div class="t">Tudtad?</div><div id="n-fact-txt"></div></div>
    <div id="n-banner"></div><div id="n-race" style="display:none"></div>
    <div class="panel" id="n-bar">
      <div class="row"><input id="n-msg" maxlength="12" value="SZIA NAGYI" spellcheck="false">
        <button class="btn" data-d="yt">Videó-szerver</button><button class="btn sel" data-d="nagyi">Nagyi</button><button class="btn" data-d="game">Játékszerver</button>
        <button class="btn go" id="n-send">${icon('mail', 16)} Üzenet</button><button class="btn" id="n-file">${icon('camera', 16)} Fotó (5 MB)</button></div>
      <div class="row"><span class="lbl">Élő forgalom:</span><button class="btn" id="n-video"></button><button class="btn" id="n-game"></button><button class="btn" id="n-storm">${icon('activity', 16)} Csúcsidő!</button>
        <span class="sep"></span><span class="lbl">Eszköz:</span><button class="btn sel" data-tool="cut">Olló</button><button class="btn" data-tool="wire" data-t="utp">+ UTP kábel</button><button class="btn" data-tool="wire" data-t="opt">+ Optika</button><button class="btn" id="n-fix">${icon('refresh', 16)} Alaphelyzet</button></div>
    </div>`;
    C = makeCanvas(root); ctx = C.ctx;
    let dest = 'nagyi'; const def = { nagyi: 'SZIA NAGYI', yt: 'CICAS VIDEO', game: 'GG WP' };
    $$('[data-d]', root).forEach(b => b.onclick = () => {
      dest = b.dataset.d; $$('[data-d]', root).forEach(x => x.classList.toggle('sel', x === b));
      const m = $('#n-msg'); if (Object.values(def).includes(m.value)) m.value = def[dest];
    });
    $('#n-send').onclick = () => sendMessage($('#n-msg').value, dest);
    $('#n-file').onclick = () => sendFile(dest);
    $('#n-msg').onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') $('#n-send').click() };
    $('#n-video').onclick = () => { toggleLive('video'); if (live.video) toast('Videó indul a Videó-szerverről. Figyeld az otthoni előfizetés kábelét!', '#f472b6', 3000) };
    $('#n-game').onclick = () => { toggleLive('game'); if (live.game) toast('Online játék: kicsi, de sűrű csomagok. A ping a lényeg!', '#4ade80', 3000) };
    $('#n-fix').onclick = () => { resetAll(); beep(500, .3, 'triangle', .07, 700) };
    $('#n-storm').onclick = () => { [['NYILT NAP', 'nagyi'], ['HAHO', 'yt'], ['PING', 'game'], ['LOL', 'nagyi']].forEach(([w, d], k) => setTimeout(() => sendMessage(w, d), k * 300)); setTimeout(() => sendFile('nagyi'), 400); setTimeout(() => sendFile('yt'), 900); if (!live.video) toggleLive('video'); banner('Csúcsidő!', 'Este 8-kor mindenki netezik – hol lesz a dugó?', '#fbbf24') };
    $$('[data-tool]', root).forEach(b => b.onclick = () => { setTool(b.dataset.tool); if (b.dataset.t) { newType = b.dataset.t; $$('[data-tool=wire]').forEach(x => x.classList.toggle('sel', x === b)); toast('Húzz egy vonalat két hálózati eszköz között az új kábelhez!', '#9fb4ff', 2600) } });
    const pos = ev => { const r = C.cv.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top] };
    C.cv.addEventListener('pointermove', ev => { const [mx, my] = pos(ev); hoverEdge = edgeAt(mx, my); if (dragFrom) dragPt = [mx, my] });
    C.cv.addEventListener('pointerleave', () => hoverEdge = null);
    C.cv.addEventListener('pointerdown', ev => {
      const [mx, my] = pos(ev);
      const dead = EDGES.find(e => !e.alive && e.P && Math.hypot(mx - Cable.at(e.P, .5)[0], my - Cable.at(e.P, .5)[1]) < 28);
      if (dead) { if (race.on) { if (!dead.fix) { dead.fix = .01; beep(500, .1, 'triangle', .05) } } else { dead.alive = true; stats.cut = Math.max(0, stats.cut - 1); beep(700, .15, 'triangle', .07, 500); upd() } return }
      if (tool === 'wire') { const n = nodeAt(mx, my); if (n && (!n.end || n.id === 'me')) { dragFrom = n.id; dragPt = [mx, my]; C.cv.setPointerCapture(ev.pointerId) } return }
      const e = edgeAt(mx, my); if (!e) return;
      if (e.user && !race.on) { EDGES.splice(EDGES.indexOf(e), 1); beep(250, .15, 'sawtooth', .06); burst(mx, my, '#fbbf24', 20, 5); return }
      e.alive = false; stats.cut++; beep(180, .25, 'sawtooth', .09, -120); noise(.2, .08); burst(mx, my, '#fbbf24', 35, 7); upd();
      if (!route('me', 'nagyi', 0) && !route('me', 'yt', 0) && !route('me', 'game', 0)) banner('Nincs internet!', 'Minden út megszakadt – kattints a kábelekre a javításhoz!', '#f87171');
    });
    C.cv.addEventListener('pointerup', ev => {
      if (!dragFrom) return; const [mx, my] = pos(ev), n = nodeAt(mx, my), a = dragFrom; dragFrom = dragPt = null;
      if (!n || n.id === a || (n.end && n.id !== 'me')) return;
      if (edgeBetween(a, n.id)) { toast('Itt már van kábel.', '#fbbf24'); return }
      EDGES.push(mkEdge(a, n.id, newType, true)); layoutCables(); beep(900, .12, 'triangle', .06, 300);
      toast(`Új ${CT[newType][1]} kábel: ${N[a].label} – ${n.label}`, '#4ade80', 2400);
    });
    liveBtns(); upd(); setTool('cut');
  };
  function nextFact() { const el = $('#n-fact'); el.style.opacity = 0; setTimeout(() => { $('#n-fact-txt').innerHTML = FACTS[fi++ % FACTS.length]; el.style.opacity = 1 }, 500) }
  S.enter = () => { nextFact(); clearInterval(factI); factI = setInterval(nextFact, 9000) };
  S.leave = () => { clearInterval(factI); race.on = false; const r = $('#n-race'); if (r) { r.style.display = 'none'; $('#n-fact').style.display = '' } };
  S.resize = () => C && C.resize();
  let uT = 0;
  S.tick = dt => {
    T += dt; step(dt); draw(); uT += dt; if (uT > .4) { uT = 0; upd() }
    if (race.on) raceTick(dt);
    idleSend += dt;
    if (!race.on && App.idle > 25 && idleSend > 5 && packets.length < 4) { idleSend = 0; const d = pick(['nagyi', 'yt', 'game']); sendMessage({ nagyi: 'SZIA NAGYI', yt: 'CICAS VIDEO', game: 'GG WP' }[d], d) }
  };
  S.comp = { rules: 'Hálózatmentő: 60 másodpercig fut a videó, az online játék és az üzenetek, közben kábelhibák jönnek. Kattints a hibás kábelre a javításhoz (2 mp). Pont jár minden célba ért csomagért; levonás jár az elveszett csomagért és a videó akadásáért.', start: raceStart };
  S.score = () => best;
  return S;
})());
