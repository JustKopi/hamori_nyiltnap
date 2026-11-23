/* ===== 1. Az internet útja: Netfaló – terheld túl a suli internetét! (sávszélesség, szűk keresztmetszet, gyorsítótár, QoS, tartalék vonal) ===== */
App.add((() => {
  const S = {
    id: 'internet', icon: '', title: 'Az internet útja', color: '#5b9dff',
    desc: 'Netfaló: rakj videókat, letöltéseket és frissítéseket az osztálytermekbe, és terheld túl az iskola internetét – ha leáll, elmarad az online dolgozat! De a rendszergazda sem tétlen…',
    topic: 'Sávszélesség, szűk keresztmetszet, gyorsítótár (cache), QoS, tartalék vonal, terheléselosztás'
  };
  // eszközök: név, ikon, szín, Mbit/s, ár, gyorsítótárazható-e, késleltetés (mp), magyarázat
  const DEV = {
    tiktok: ['Rövidvideók (mobil)', 'video', '#f472b6', 6, 1, 1, 0, 'Egy mobil rövidvideó kevés adatot használ.'],
    game: ['Online játék', 'gamepad', '#a78bfa', 3, 2, 0, 0, 'Meglepő, de az online játék alig használ sávszélességet – csak a mozdulatokat küldi!'],
    yt4k: ['4K videó (laptop)', 'eye', '#fbbf24', 25, 3, 1, 0, 'A 4K videó folyamatosan sok adatot igényel.'],
    cloud: ['Felhőmentés (fotók)', 'felho', '#38bdf8', 30, 3, 0, 0, 'A saját fotók feltöltése egyedi adat: nem lehet gyorsítótárazni.'],
    upd: ['Rendszerfrissítés', 'refresh', '#4ade80', 40, 3, 1, 3, 'A frissítés néhány másodperc múlva indul, aztán nagyon sok adatot tölt le.'],
    dl: ['Játék letöltése', 'save', '#fb923c', 60, 5, 0, 0, 'Egy nagy játék letöltése szinte az egész vonalat elfoglalja.']
  };
  const LEVELS = [
    { n: 'Első nap', goal: 'Az iskola internete 100 Mbit/s. Tegyél annyi forgalmat a termekbe, hogy átlépje!', up: 100, budget: 10, cards: ['tiktok', 'game', 'yt4k', 'cloud', 'dl'],
      rooms: [['9.a terem', 'R', 1000], ['Informatika terem', 'R', 1000]], sw: [], learn: 'A forgalom <b>összeadódik</b>: ha több eszköz együtt több adatot kér, mint a vonal sávszélessége, a hálózat <b>túlterhelődik</b>, és minden lelassul.' },
    { n: 'Szűk folyosó', goal: 'Vigyázz: a kapcsolók kábelei és a WiFi is betelhetnek! Csak az számít, ami eljut az internetig (150 Mbit/s).', up: 150, budget: 16, cards: ['tiktok', 'game', 'yt4k', 'cloud', 'dl'],
      rooms: [['9.a', 'S1', 1000], ['9.b', 'S1', 1000], ['Könyvtár (WiFi)', 'R', 40], ['Tornaterem', 'S2', 1000]], sw: [['S1', '1. emelet', 50], ['S2', 'földszint', 100]], learn: 'A leglassabb kábel a <b>szűk keresztmetszet</b>: hiába gyors az internet, ha előtte egy vékony kábel megfogja a forgalmat. A hálózatot mindig a leggyengébb pontja határozza meg.' },
    { n: 'Gyorsítótár', goal: 'A rendszergazda gyorsítótárat (cache) kapcsolt be: ha többen nézik ugyanazt, csak egyszer jön le az internetről! 120 Mbit/s.', up: 120, budget: 14, cards: ['tiktok', 'yt4k', 'upd', 'cloud', 'dl'], cache: true,
      rooms: [['10.a', 'R', 1000], ['10.b', 'R', 1000], ['Tanári', 'R', 1000]], sw: [], learn: 'A <b>gyorsítótár (cache)</b> megjegyzi a már letöltött tartalmat, és helyben adja oda a következő kérőnek. Így a népszerű videók és a frissítések csak egyszer terhelik az internetet.' },
    { n: 'QoS-szabály', goal: 'A rendszergazda figyel: 3 másodperc után minden letöltést lekorlátoz 15 Mbit/s-ra (QoS). 120 Mbit/s.', up: 120, budget: 15, cards: ['tiktok', 'game', 'yt4k', 'cloud', 'dl'], qos: true,
      rooms: [['11.a', 'R', 1000], ['11.b', 'R', 1000], ['Aula (WiFi)', 'R', 60]], sw: [], learn: 'A <b>QoS (szolgáltatásminőség)</b> szabályokkal a rendszergazda eldönti, ki mennyi sávszélességet kaphat. Az online dolgozat így elsőbbséget kap a letöltésekkel szemben.' },
    { n: 'Tartalék vonal', goal: 'Ha a fő vonal 1 mp-ig 90% fölött van, bekapcsol egy második, 100 Mbit/s-os tartalék vonal. Terheld túl mindkettőt!', up: 100, backup: 100, budget: 22, cards: ['tiktok', 'yt4k', 'cloud', 'dl'],
      rooms: [['12.a', 'S1', 1000], ['12.b', 'S1', 1000], ['Labor', 'S2', 1000], ['Udvar (WiFi)', 'R', 50]], sw: [['S1', '2. emelet', 100], ['S2', '1. emelet', 100]], learn: 'A <b>tartalék vonal</b> és a <b>terheléselosztás</b> miatt a nagy hálózatok szinte sosem állnak le: ha az egyik vonal betelik vagy elromlik, a másik átveszi a forgalmat.' }
  ];
  const SEATS = 3, DUR = 18;
  let C, ctx, L, li = 0, placed = [], money = 0, sim = null, T = 0, parts = [], sel = null, fails = 0, total = 0, best = 0, racing = false, hoverRoom = -1, drag = null, done = [];
  const VW = 1200, VH = 640; let sc = 1, ox = 0, oy = 0;
  // ---- elrendezés ----
  function layout() {
    const n = L.rooms.length, h = Math.min(130, (VH - 90) / n - 14);
    L.rooms.forEach((r, i) => { r.x = 40; r.y = 60 + i * (h + 14); r.w = 420; r.h = h });
    const swY = id => { const rs = L.rooms.filter(r => r[1] === id); return rs.reduce((s, r) => s + r.y + r.h / 2, 0) / rs.length };
    L.sw.forEach(s => { s.x = 640; s.y = swY(s[0]) });
    L.R = { x: 830, y: VH / 2 - 20 }; L.NET = { x: 1100, y: VH / 2 - 20 };
  }
  const nodeOf = id => id === 'R' ? L.R : L.sw.find(s => s[0] === id);
  function linksOf() {
    const ls = [];
    L.rooms.forEach((r, i) => { const to = nodeOf(r[1]); ls.push({ k: 'r' + i, a: [r.x + r.w, r.y + r.h / 2], b: [to.x - 38, to.y], cap: r[2], room: i }) });
    L.sw.forEach(s => ls.push({ k: s[0], a: [s.x + 34, s.y], b: [L.R.x - 40, L.R.y], cap: s[2], sw: s[0] }));
    ls.push({ k: 'up', a: [L.R.x + 44, L.R.y - (L.backup ? 14 : 0)], b: [L.NET.x - 70, L.NET.y - (L.backup ? 14 : 0)], cap: L.up, up: 1 });
    if (L.backup) ls.push({ k: 'bk', a: [L.R.x + 44, L.R.y + 30], b: [L.NET.x - 70, L.NET.y + 30], cap: L.backup, up: 2 });
    return ls;
  }
  // ---- forgalomszámítás: igény → terem kábele → kapcsoló → internet (arányos korlátozással) ----
  function demand(p, t) {
    const d = DEV[p.t]; if (t < d[6]) return 0; let v = d[3];
    if (p.t === 'yt4k') v *= .9 + .25 * Math.max(0, Math.sin(t * 2.3 + p.ph)); if (p.t === 'tiktok') v *= .9 + .4 * Math.abs(Math.sin(t * 1.7 + p.ph)); if (p.t === 'game') v *= .8 + .4 * Math.sin(t * 5 + p.ph);
    if (L.qos && sim && sim.qos && p.t === 'dl') v = Math.min(v, 15);
    return v;
  }
  function flows(t) {
    const F = {}, items = placed.map(p => ({ p, v: demand(p, t), cached: false }));
    if (L.cache) { const seen = {}; items.forEach(it => { if (DEV[it.p.t][5] && it.v > 0) { if (seen[it.p.t]) it.cached = true; seen[it.p.t] = 1 } }) }
    const lim = (arr, cap) => { const s = arr.reduce((a, it) => a + it.v, 0); if (s > cap) arr.forEach(it => it.v *= cap / s); return s };
    L.rooms.forEach((r, i) => { const arr = items.filter(it => it.p.room === i); F['r' + i] = { off: lim(arr, r[2]), cap: r[2] } });
    const up = items.filter(it => !it.cached);
    L.sw.forEach(s => { const arr = up.filter(it => L.rooms[it.p.room][1] === s[0]); F[s[0]] = { off: lim(arr, s[2]), cap: s[2] } });
    const upOff = up.reduce((a, it) => a + it.v, 0), bk = sim && sim.bk, capUp = L.up + (bk ? L.backup : 0);
    F.up = { off: bk ? upOff * L.up / capUp : upOff, cap: L.up }; if (L.backup) F.bk = { off: bk ? upOff * L.backup / capUp : 0, cap: L.backup };
    F.total = upOff; F.capUp = capUp; F.cachedN = items.filter(it => it.cached).length; F.items = items; return F;
  }
  // ---- rajzolás ----
  function pipe(a, b, load, label, glow) {
    const c = ctx, col = load > 1 ? '#ef4444' : load > .8 ? '#f59e0b' : load > .01 ? '#4ade80' : '#475569';
    c.lineCap = 'round'; c.strokeStyle = '#1f2430'; c.lineWidth = 22; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke();
    if (glow && load > 1) { c.shadowColor = '#ef4444'; c.shadowBlur = 20 + Math.sin(T * 12) * 10 }
    c.strokeStyle = col; c.globalAlpha = .28 + Math.min(1, load) * .5; c.lineWidth = 14; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); c.globalAlpha = 1; c.shadowBlur = 0;
    if (label) { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - 22; c.font = '800 13px Inter,sans-serif'; const w = c.measureText(label).width + 16; c.fillStyle = '#0b0c10e8'; c.beginPath(); c.roundRect(mx - w / 2, my - 12, w, 24, 12); c.fill(); c.strokeStyle = col; c.lineWidth = 1.5; c.stroke(); c.fillStyle = col === '#475569' ? '#94a3b8' : col; c.textAlign = 'center'; c.fillText(label, mx, my + 5) }
  }
  function box(x, y, w, h, r, fill, stroke) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke() } }
  function draw() {
    const c = ctx, W = C.W, H = C.H, d = devicePixelRatio || 1; c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, W, H);
    sc = Math.min(W / VW, (H - 220) / VH); ox = (W - VW * sc) / 2; oy = 82; c.translate(ox, oy); c.scale(sc, sc);
    const F = flows(sim ? sim.t : 0), dark = sim && sim.win ? Math.min(1, sim.winT / 1.5) : 0;
    box(20, 30, 470, VH - 50, 22, '#141821', '#2a3140'); c.fillStyle = '#94a3b8'; c.font = '800 15px Inter,sans-serif'; c.textAlign = 'left'; c.fillText('ISKOLA', 40, 52);
    box(760, L.R.y - 110, 150, 230, 18, '#141821', '#2a3140'); c.fillStyle = '#94a3b8'; c.font = '700 12px Inter,sans-serif'; c.textAlign = 'center'; c.fillText('SZERVERTEREM', 835, L.R.y - 88);
    const ls = linksOf();
    for (const l of ls) {
      const f = l.up === 1 ? F.up : l.up === 2 ? F.bk : F[l.k], on = l.up !== 2 || (sim && sim.bk), lo = f && on ? f.off / f.cap : 0;
      pipe(l.a, l.b, sim ? lo : 0, `${sim && on ? Math.round(f.off) : 0}/${l.cap} Mbit/s`, !!l.up);
      if (l.up === 2 && !(sim && sim.bk)) { c.fillStyle = '#94a3b8'; c.font = '700 12px Inter,sans-serif'; c.textAlign = 'center'; c.fillText('tartalék vonal (kikapcsolva)', (l.a[0] + l.b[0]) / 2, l.a[1] + 30) }
    }
    for (const p of parts) { const l = ls.find(x => x.k === p.k); if (!l) continue; const x = l.a[0] + (l.b[0] - l.a[0]) * p.t, y = l.a[1] + (l.b[1] - l.a[1]) * p.t + p.o; c.fillStyle = p.c; c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill() }
    L.rooms.forEach((r, i) => {
      const hov = hoverRoom === i && (sel || drag); box(r.x, r.y, r.w, r.h, 16, hov ? '#1e293b' : '#181d27', hov ? '#5b9dff' : '#2f3746');
      c.fillStyle = '#e2e8f0'; c.font = '800 15px Inter,sans-serif'; c.textAlign = 'left'; c.fillText(r[0], r.x + 14, r.y + 24);
      c.fillStyle = '#64748b'; c.font = '600 12px Inter,sans-serif'; c.fillText(r[2] >= 1000 ? 'kábel: 1000 Mbit/s' : `WiFi: ${r[2]} Mbit/s`, r.x + 14, r.y + 42);
      const its = placed.filter(p => p.room === i);
      for (let k = 0; k < SEATS; k++) {
        const sx = r.x + 190 + k * 80, sy = r.y + r.h / 2, p = its[k];
        box(sx - 34, sy - 30, 68, 60, 12, p ? DEV[p.t][2] + '22' : '#0f131b', p ? DEV[p.t][2] : '#2a3140');
        if (p) { c.globalAlpha = sim ? .6 + .4 * Math.sin(T * 6 + k) : 1; drawIcon(c, DEV[p.t][1], sx, sy - 6, 26, DEV[p.t][2], 2.2); c.globalAlpha = 1; c.fillStyle = '#e2e8f0'; c.font = '800 11px Inter,sans-serif'; c.textAlign = 'center'; c.fillText(`${DEV[p.t][3]} Mbit/s`, sx, sy + 22); const it = F.items.find(x => x.p === p); if (it && it.cached && sim) { c.fillStyle = '#22d3ee'; c.font = '800 10px Inter,sans-serif'; c.fillText('CACHE', sx, sy - 36) } }
        else { c.fillStyle = '#334155'; c.font = '700 22px Inter,sans-serif'; c.textAlign = 'center'; c.fillText('+', sx, sy + 8) }
      }
      if (dark) { c.fillStyle = `rgba(0,0,0,${dark * .55})`; c.fillRect(r.x, r.y, r.w, r.h) }
    });
    L.sw.forEach(s => { box(s.x - 34, s.y - 22, 68, 44, 10, '#1f2937', '#64748b'); drawIcon(c, 'kapcsolo', s.x, s.y - 2, 24, '#cbd5e1', 2); c.fillStyle = '#94a3b8'; c.font = '700 11px Inter,sans-serif'; c.textAlign = 'center'; c.fillText(`kapcsoló • ${s[1]}`, s.x, s.y + 40) });
    box(L.R.x - 40, L.R.y - 30, 80, 60, 12, '#1f2937', '#94a3b8'); drawIcon(c, 'router', L.R.x, L.R.y - 4, 30, '#e2e8f0', 2); c.fillStyle = '#cbd5e1'; c.font = '700 11px Inter,sans-serif'; c.textAlign = 'center'; c.fillText('router', L.R.x, L.R.y + 46);
    if (L.cache) { box(L.R.x - 44, L.R.y + 62, 88, 34, 10, sim && F.cachedN ? '#0e3a44' : '#1f2937', '#22d3ee'); c.fillStyle = '#22d3ee'; c.font = '800 12px Inter,sans-serif'; c.fillText(`gyorsítótár${sim ? ` (${F.cachedN})` : ''}`, L.R.x, L.R.y + 84) }
    if (L.qos) { c.fillStyle = sim && sim.qos ? '#fbbf24' : '#64748b'; c.font = '800 12px Inter,sans-serif'; c.fillText(sim && sim.qos ? 'QoS: letöltés max 15' : 'QoS figyel…', L.R.x, L.R.y - 52) }
    const bad = sim && F.total / F.capUp >= 1, nx = L.NET.x, ny = L.NET.y;
    c.save(); if (bad) c.translate(Math.sin(T * 40) * 3, 0); c.fillStyle = bad ? '#7f1d1d' : '#1e3a8a'; [[-40, 0, 42], [0, -24, 50], [44, 0, 40], [0, 18, 48]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(nx + dx, ny + dy, r, 0, 7); c.fill() });
    c.fillStyle = '#fff'; c.font = '900 20px Inter,sans-serif'; c.textAlign = 'center'; c.fillText('INTERNET', nx, ny + 6); c.restore();
    const bx = 1010, by = 460; box(bx, by, 170, 120, 14, '#0f172a', sim && sim.win ? '#ef4444' : '#334155'); c.fillStyle = '#94a3b8'; c.font = '700 12px Inter,sans-serif'; c.textAlign = 'center'; c.fillText('ONLINE DOLGOZAT', bx + 85, by + 24);
    c.fillStyle = sim && sim.win ? '#f87171' : sim && sim.meter > .3 ? '#fbbf24' : '#4ade80'; c.font = '900 20px Inter,sans-serif'; c.fillText(sim && sim.win ? 'ELMARADT!' : sim && sim.meter > .3 ? 'akadozik…' : 'fut', bx + 85, by + 62);
    if (sim && !sim.win && sim.meter > .3) { c.strokeStyle = '#fbbf24'; c.lineWidth = 4; c.beginPath(); c.arc(bx + 85, by + 92, 12, T * 6, T * 6 + 4.5); c.stroke() }
    if (dark > 0) { c.globalAlpha = dark; c.fillStyle = '#ef4444'; c.font = '900 64px Inter,sans-serif'; c.textAlign = 'center'; c.save(); c.translate(VW / 2, VH / 2 - 10); c.rotate(-.06); const z = 1 + (1 - dark) * .6; c.scale(z, z); c.strokeStyle = '#0b0c10'; c.lineWidth = 10; c.strokeText('ELMARAD AZ ÓRA!', 0, 0); c.fillText('ELMARAD AZ ÓRA!', 0, 0); c.restore(); c.globalAlpha = 1 }
    if (drag && drag.moved) { c.setTransform(d, 0, 0, d, 0, 0); const t = DEV[drag.t]; c.beginPath(); c.arc(drag.x, drag.y, 30, 0, 7); c.fillStyle = t[2]; c.fill(); drawIcon(c, t[1], drag.x, drag.y, 30, '#0b0c10', 2.4) }
  }
  // ---- szimuláció ----
  function step(dt) {
    T += dt; if (!sim || sim.over) return; const s = sim;
    if (s.win) { s.winT += dt; return }
    s.t += dt; const F = flows(s.t), lo = F.total / F.capUp;
    if (L.qos && !s.qos && s.t > 3 && placed.some(p => p.t === 'dl')) { s.qos = true; toast('Rendszergazda: „Valaki letölt! Bekapcsolom a QoS-korlátot.”', '#fbbf24', 3200) }
    if (L.backup && !s.bk) { s.hi = F.total / L.up > .9 ? (s.hi || 0) + dt : 0; if (s.hi > 1) { s.bk = true; s.meter = Math.min(s.meter, .2); toast('Rendszergazda: „Betelt a fővonal! Bekapcsolom a tartalék vonalat.”', '#38bdf8', 3200) } }
    if (L.cache && !s.cs && F.cachedN) { s.cs = true; toast('A gyorsítótár közbelépett: az ismétlődő tartalom helyből jön!', '#22d3ee', 3000) }
    s.meter = Math.max(0, Math.min(1, s.meter + (lo >= 1 ? dt * Math.min(.32, .2 + (lo - 1) * .5) : -dt * .35))); s.peak = Math.max(s.peak, lo);
    const ls = linksOf();
    for (const l of ls) { const f = l.up === 1 ? F.up : l.up === 2 ? F.bk : F[l.k]; if (!f || f.off <= 0) continue; if (Math.random() < dt * f.off / 5 && parts.length < 600) { const it = F.items.filter(x => x.v > 0 && (l.room === undefined || x.p.room === l.room) && (l.room !== undefined ? true : !x.cached)); const col = it.length ? DEV[pick(it).p.t][2] : '#fff'; parts.push({ k: l.k, t: 0, o: (Math.random() - .5) * 8, c: col, sp: .5 + Math.random() * .3, over: f.off / f.cap }) } }
    for (const p of parts) p.t += dt * p.sp * (p.over > 1 ? .4 : 1); parts = parts.filter(p => p.t < 1);
    hud(F, lo);
    if (s.meter >= 1) win(); else if (s.t >= DUR) lose(F);
  }
  function hud(F, lo) {
    const m = $('#nf-meter'); if (!m) return; m.style.width = (sim ? sim.meter * 100 : 0) + '%';
    $('#nf-load').textContent = sim && F ? `${Math.round(F.total)} / ${F.capUp} Mbit/s (${Math.round(lo * 100)}%)` : '–';
    $('#nf-time').textContent = sim ? `• ${Math.max(0, Math.ceil(DUR - sim.t))} mp` : '';
  }
  function win() {
    sim.win = true; sim.winT = 0; sfx.pop(); setTimeout(() => { sfx.win(); FX.confetti() }, 500);
    const pts = Math.max(100, 1000 + money * 40 - fails * 150); total += pts; done[li] = true;
    setTimeout(() => overlay(true, pts), 2200);
  }
  function lose(F) {
    sim.over = true; fails++; sfx.bad();
    const tight = linksOf().filter(l => !l.up).map(l => ({ l, f: F[l.k] })).filter(x => x.f && x.f.off > x.f.cap);
    const why = sim.peak < .8 ? 'Kevés volt a forgalom – tegyél be több, nagyobb adatforgalmú eszközt!' : tight.length ? `A(z) <b>${tight[0].l.room !== undefined ? L.rooms[tight[0].l.room][0] + ' vonala' : 'kapcsoló kábele'}</b> telt be – a forgalom el sem jutott az internetig. Oszd el jobban az eszközöket!` : L.cache && F.cachedN ? 'A gyorsítótár elnyelte az ismétlődő tartalmat. Válassz különböző dolgokat!' : 'Majdnem! Egy kicsivel több forgalom kellett volna.';
    overlay(false, 0, why);
  }
  function overlay(ok, pts, why) {
    const o = $('#nf-over'); o.style.display = 'flex'; const last = li === LEVELS.length - 1;
    if (ok && last) { best = Math.max(best, total); if (racing) { racing = false; Comp.finish(total, `${LEVELS.length} pálya, ${fails} sikertelen próba`) } }
    o.innerHTML = ok ? `<div class="card"><h2>Leállt a suli internete!</h2><div class="nf-board">${icon('internet', 54, 1.6)}<b>Az online dolgozat elmarad</b></div><p>${L.n} teljesítve • <b>+${pts} pont</b></p>
      <div class="learn"><b>Mit tanultál?</b> ${L.learn}<br><br><b>A valóságban</b> a rendszergazda dolga, hogy ez ne történjen meg: figyeli a forgalmat, és gyorsítótárral, QoS-szabályokkal, tartalék vonallal védi a hálózatot.</div>
      <div style="margin-top:14px"><button class="btn go" id="nf-next">${last ? 'Újra az elejéről' : 'Következő pálya ▶'}</button></div></div>`
      : `<div class="card"><h2>Bírta a hálózat…</h2><p style="font-size:17px">${why}</p><div class="learn">Tipp: nézd meg, melyik kábel lett piros. ${L.goal}</div><div style="margin-top:14px"><button class="btn go" id="nf-retry">Átrendezem ▶</button></div></div>`;
    if (ok) $('#nf-next').onclick = () => { o.style.display = 'none'; load(last ? 0 : li + 1) };
    else $('#nf-retry').onclick = () => { o.style.display = 'none'; sim = null; parts = []; renderUI() };
  }
  // ---- pálya, kártyák, elhelyezés ----
  function load(i) { li = i; L = LEVELS[i]; layout(); placed = []; money = L.budget; sim = null; parts = []; sel = null; if (i === 0) { fails = 0; total = 0 } renderUI(); intro() }
  function intro() {
    const o = $('#nf-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card"><div class="nf-lv">${LEVELS.map((x, k) => `<span class="${k === li ? 'on' : done[k] ? 'ok' : ''}">${k + 1}</span>`).join('')}</div><h2>${li + 1}. pálya: ${L.n}</h2><p style="font-size:18px">${L.goal}</p>
      ${li === 0 ? `<div class="learn" style="text-align:left">Ma <b>online dolgozat</b> lenne… de ha az iskola internete <b>túlterhelődik</b>, elmarad az óra! Húzd az eszközöket a termekbe (vagy kattints a kártyára, majd a teremre), figyelj a pénzedre, aztán nyomd meg a <b>Rajt!</b> gombot. Ha a „Leállás” sáv betelik, nyertél.</div>` : ''}
      <button class="btn go" id="nf-go" style="font-size:22px;margin-top:12px">Lássuk! ▶</button></div>`;
    $('#nf-go').onclick = () => { o.style.display = 'none' };
  }
  function renderUI() {
    $('#nf-lvl').innerHTML = `<b>${li + 1}/${LEVELS.length}. ${L.n}</b><span>${L.goal}</span>`;
    $('#nf-money').innerHTML = `${icon('coin', 18)} <b>${money}</b>`;
    $('#nf-cards').innerHTML = L.cards.map(k => { const d = DEV[k]; return `<button class="nf-card ${sel === k ? 'sel' : ''} ${d[4] > money ? 'no' : ''}" data-k="${k}" style="--c:${d[2]}"><span class="nf-ci">${icon(d[1], 24, 2)}</span><b>${d[0]}</b><span class="nf-cm">${d[3]} Mbit/s${d[6] ? ` • ${d[6]} mp múlva` : ''}</span><span class="nf-cp">${icon('coin', 13)} ${d[4]}</span></button>` }).join('');
    $$('.nf-card').forEach(b => b.onpointerdown = e => cardDown(e, b.dataset.k));
    $('#nf-start').disabled = !placed.length || !!sim; $('#nf-clear').disabled = !!sim;
    hud();
  }
  function place(k, room) {
    if (sim) return; const d = DEV[k]; if (d[4] > money) { toast('Nincs elég pénzed erre.', '#f87171', 1400); return }
    if (placed.filter(p => p.room === room).length >= SEATS) { toast('Ez a terem tele van (3 hely).', '#fbbf24', 1400); return }
    placed.push({ t: k, room, ph: Math.random() * 6 }); money -= d[4]; beep(700 + placed.length * 30, .06, 'triangle', .05); toast(d[7], d[2], 2000); renderUI();
  }
  const toV = (cx, cy) => { const r = C.cv.getBoundingClientRect(); return [(cx - r.left - ox) / sc, (cy - r.top - oy) / sc] };
  const roomAt = (x, y) => L.rooms.findIndex(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  function cardDown(e, k) {
    if (sim) return; e.preventDefault(); const x0 = e.clientX, y0 = e.clientY, r = C.cv.getBoundingClientRect();
    drag = { t: k, x: x0 - r.left, y: y0 - r.top, moved: false };
    const mv = ev => { drag.x = ev.clientX - r.left; drag.y = ev.clientY - r.top; if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 8) drag.moved = true; const [vx, vy] = toV(ev.clientX, ev.clientY); hoverRoom = roomAt(vx, vy) };
    const up = ev => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); const d0 = drag; drag = null; hoverRoom = -1; if (d0.moved) { const [vx, vy] = toV(ev.clientX, ev.clientY), i = roomAt(vx, vy); if (i >= 0) place(k, i) } else { sel = sel === k ? null : k; sfx.click(); renderUI() } };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  }
  function canvasDown(e) {
    if (sim) return; const [x, y] = toV(e.clientX, e.clientY), i = roomAt(x, y); if (i < 0) return; const r = L.rooms[i];
    const its = placed.filter(p => p.room === i), k = Math.round((x - (r.x + 190)) / 80);
    if (k >= 0 && k < SEATS && its[k] && Math.abs(y - (r.y + r.h / 2)) < 32 && Math.abs(x - (r.x + 190 + k * 80)) < 36) { placed = placed.filter(p => p !== its[k]); money += DEV[its[k].t][4]; beep(400, .05, 'triangle', .04); renderUI(); return }
    if (sel) place(sel, i);
  }
  function start() { if (!placed.length) return; sim = { t: 0, meter: 0, peak: 0, win: false }; parts = []; sel = null; renderUI(); beep(500, .1, 'triangle', .05); beep(800, .12, 'triangle', .05, 0, .12) }
  S.build = r => {
    r.innerHTML = `<style>
      #nf{position:absolute;inset:0}
      #nf-top{position:absolute;top:10px;left:14px;right:14px;display:flex;gap:12px;align-items:stretch;z-index:2;pointer-events:none}
      #nf-lvl{flex:1;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:8px 14px;display:flex;flex-direction:column;justify-content:center}#nf-lvl b{font-size:17px}#nf-lvl span{font-size:13px;color:var(--muted);line-height:1.35}
      .nf-box{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:6px 14px;min-width:190px;display:flex;flex-direction:column;justify-content:center;gap:4px}.nf-box small{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
      .nf-mw{height:12px;background:#1c1f26;border-radius:6px;overflow:hidden}#nf-meter{height:100%;width:0;background:linear-gradient(90deg,#f59e0b,#ef4444);transition:width .15s linear;box-shadow:0 0 14px #ef4444}
      #nf-load{font-size:13px;font-weight:700}#nf-money{font-size:22px;display:flex;gap:6px;align-items:center;color:var(--yellow)}
      #nf-bot{position:absolute;left:0;right:0;bottom:0;display:flex;gap:12px;align-items:center;justify-content:center;padding:10px;flex-wrap:wrap;z-index:2}
      #nf-cards{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
      .nf-card{all:unset;cursor:grab;touch-action:none;user-select:none;position:relative;width:140px;padding:10px;border-radius:16px;background:color-mix(in srgb,var(--c) 12%,#14161b);border:2px solid color-mix(in srgb,var(--c) 45%,transparent);display:flex;flex-direction:column;gap:3px;transition:transform .2s cubic-bezier(.2,.8,.2,1),box-shadow .2s}
      .nf-card:hover{transform:translateY(-5px);box-shadow:0 12px 26px -10px var(--c)}.nf-card.sel{transform:translateY(-8px);border-color:var(--c);box-shadow:0 0 24px var(--c)}.nf-card.no{opacity:.4}
      .nf-ci{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:var(--c);color:#0b0c10}.nf-card b{font-size:13.5px;line-height:1.2}.nf-cm{font-size:12px;color:#cbd5e1}.nf-cp{position:absolute;top:8px;right:10px;font-size:14px;font-weight:800;color:var(--yellow);display:flex;gap:3px;align-items:center}
      #nf-act{display:flex;flex-direction:column;gap:6px}#nf-start{height:58px;font-size:22px;padding:0 26px}#nf-clear{height:34px;font-size:13px}
      .nf-lv{display:flex;gap:6px;justify-content:center;margin-bottom:8px}.nf-lv span{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--panel2);font-weight:800;font-size:13px}.nf-lv .on{background:var(--accent);color:#0b0c10}.nf-lv .ok{background:#16a34a;color:#fff}
      .nf-board{display:flex;flex-direction:column;align-items:center;gap:6px;color:#f87171;margin:6px 0 10px;animation:nfB 1s ease-in-out infinite}.nf-board b{font-size:20px}@keyframes nfB{50%{transform:scale(1.06)}}
    </style>
    <div id="nf"><div id="nf-top"><div id="nf-lvl"></div><div class="nf-box"><small>Internet terhelése</small><span id="nf-load">–</span><small>Leállás <span id="nf-time"></span></small><div class="nf-mw"><div id="nf-meter"></div></div></div><div class="nf-box" style="min-width:110px"><small>Pénzed</small><span id="nf-money"></span></div></div>
      <div id="nf-bot"><div id="nf-cards"></div><div id="nf-act"><button class="btn go" id="nf-start">Rajt! ▶</button><button class="btn" id="nf-clear">Mindent kiveszek</button></div></div>
      <div class="big-overlay" id="nf-over" style="display:none"></div></div>`;
    C = makeCanvas($('#nf')); ctx = C.ctx; C.resize();
    C.cv.addEventListener('pointerdown', canvasDown);
    C.cv.addEventListener('pointermove', e => { if (drag) return; const [x, y] = toV(e.clientX, e.clientY); hoverRoom = roomAt(x, y); C.cv.style.cursor = hoverRoom >= 0 && sel ? 'copy' : '' });
    $('#nf-start').onclick = start; $('#nf-clear').onclick = () => { if (sim) return; placed.forEach(p => money += DEV[p.t][4]); placed = []; renderUI() };
    load(0);
  };
  S.enter = () => { if (C) C.resize() };
  S.resize = () => C && C.resize();
  S.tick = dt => { if (!C || !L) return; step(Math.min(dt, .05)); draw() };
  S.leave = () => { if (sim && !sim.win) sim = null; racing = false };
  S.comp = { rules: 'Netfaló: teljesítsd mind az 5 pályát! Pont jár minden pályáért és a megmaradt pénzért, levonás a sikertelen próbákért.', start: () => { racing = true; done = []; load(0) } };
  S.score = () => best || total;
  S._dbg = () => ({ get L() { return L }, place, start, flows, get sim() { return sim }, get money() { return money }, load });
  return S;
})());
