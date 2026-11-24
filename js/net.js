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
  // Pályák. terem: [név, hová kötött (R = router, S1… = kapcsoló), sávszélesség Mbit/s]; kapcsoló: [azonosító, hely, felfelé menő kábel Mbit/s]
  const MODES = {
    easy: {
      n: 'Könnyű', dur: 22, preview: true, levels: [
        { n: 'Első nap', goal: 'Az iskola internete 60 Mbit/s. Tegyél annyi forgalmat a termekbe, hogy átlépje!', up: 60, budget: 12, cards: ['tiktok', 'game', 'yt4k', 'dl'],
          rooms: [['9.a terem', 'R', 1000], ['Informatika terem', 'R', 1000]], sw: [], learn: 'A forgalom <b>összeadódik</b>: ha az eszközök együtt több adatot kérnek, mint a vonal sávszélessége, a hálózat <b>túlterhelődik</b>, és minden lelassul.' },
        { n: 'Sok kicsi sokra megy', goal: 'Nincs nagy letöltés – csak videók és játékok. Összejön a 80 Mbit/s?', up: 80, budget: 12, cards: ['tiktok', 'game', 'yt4k'],
          rooms: [['9.b', 'R', 1000], ['10.a', 'R', 1000], ['10.b', 'R', 1000]], sw: [], learn: 'Sok kis forgalom is <b>összeadódik</b>. Az online játék meglepően keveset használ (csak a mozdulatokat küldi), a videó sokat.' },
        { n: 'WiFi-s termek', goal: 'A WiFi lassabb a kábelnél: ami nem fér át a WiFin, el sem jut az internetig. Cél: 120 Mbit/s.', up: 120, budget: 16, cards: ['tiktok', 'yt4k', 'cloud'],
          rooms: [['Informatika (kábel)', 'R', 1000], ['Könyvtár (WiFi)', 'R', 30], ['Aula (WiFi)', 'R', 30]], sw: [], learn: 'A <b>WiFi</b> sávszélessége kisebb, és a terem összes eszköze osztozik rajta. Ezért kötnek a gépterembe <b>kábelt</b>.' },
        { n: 'Szűk folyosó', goal: 'Az 1. emeleti kapcsoló kábele csak 50 Mbit/s! Oszd el okosan a forgalmat. Cél: 80 Mbit/s.', up: 80, budget: 12, cards: ['tiktok', 'yt4k', 'cloud', 'dl'],
          rooms: [['9.a', 'S1', 1000], ['9.b', 'S1', 1000], ['Tornaterem (WiFi)', 'R', 40]], sw: [['S1', '1. emelet', 50]], learn: 'A leglassabb kábel a <b>szűk keresztmetszet</b>: hiába gyors az internet, ha előtte egy vékony kábel megfogja a forgalmat.' },
        { n: 'Gyorsítótár', goal: 'Bekapcsolt a gyorsítótár (cache): ha többen nézik ugyanazt, csak egyszer jön le az internetről! Cél: 120 Mbit/s.', up: 120, budget: 16, cards: ['tiktok', 'yt4k', 'upd', 'cloud', 'dl'], cache: true,
          rooms: [['10.a', 'R', 1000], ['10.b', 'R', 1000], ['Tanári', 'R', 1000]], sw: [], learn: 'A <b>gyorsítótár (cache)</b> megjegyzi a már letöltött tartalmat, és helyben adja oda a következő kérőnek. A saját fotók feltöltése és a letöltések viszont egyediek.' },
        { n: 'QoS-szabály', goal: 'A rendszergazda figyel: 3 másodperc után minden letöltést 15 Mbit/s-ra korlátoz (QoS). Cél: 120 Mbit/s.', up: 120, budget: 16, cards: ['tiktok', 'game', 'yt4k', 'cloud', 'dl'], qos: true,
          rooms: [['11.a', 'R', 1000], ['11.b', 'R', 1000], ['Aula (WiFi)', 'R', 60]], sw: [], learn: 'A <b>QoS (szolgáltatásminőség)</b> szabályokkal a rendszergazda eldönti, ki mennyi sávszélességet kaphat. Az online dolgozat így elsőbbséget kap.' },
        { n: 'Tartalék vonal', goal: 'Ha a fővonal 1 mp-ig 90% fölött van, bekapcsol egy 100 Mbit/s-os tartalék vonal. Terheld túl mindkettőt!', up: 100, backup: 100, budget: 24, cards: ['tiktok', 'yt4k', 'cloud', 'dl'],
          rooms: [['12.a', 'S1', 1000], ['12.b', 'S1', 1000], ['Labor', 'S2', 1000], ['Udvar (WiFi)', 'R', 50]], sw: [['S1', '2. emelet', 100], ['S2', '1. emelet', 100]], learn: 'A <b>tartalék vonal</b> és a <b>terheléselosztás</b> miatt a nagy hálózatok szinte sosem állnak le: ha az egyik vonal betelik, a másik átveszi a forgalmat.' }
      ]
    },
    hard: {
      n: 'Nehéz', dur: 18, preview: false, levels: [
        { n: 'Szűkös keret', goal: 'Csak 9 érméd van a 90 Mbit/s-hoz, és QoS is figyel. Melyik eszköz adja a legtöbb forgalmat egy érméért?', up: 90, budget: 9, cards: ['tiktok', 'game', 'yt4k', 'cloud', 'dl'], qos: true,
          rooms: [['9.a', 'R', 1000], ['9.b', 'R', 1000], ['Könyvtár (WiFi)', 'R', 40]], sw: [], learn: 'Tervezéskor azt kell nézni, <b>mennyi adatot</b> mozgat egy eszköz, és meddig: a QoS a letöltést visszafogta, a folyamatos feltöltést nem.' },
        { n: 'Két szűk folyosó', goal: 'Két kapcsoló, egy WiFi-s könyvtár – és csak az számít, ami eljut az internetig. Cél: 150 Mbit/s.', up: 150, budget: 16, cards: ['tiktok', 'game', 'yt4k', 'cloud', 'dl'],
          rooms: [['9.a', 'S1', 1000], ['9.b', 'S1', 1000], ['Könyvtár (WiFi)', 'R', 40], ['Tornaterem', 'S2', 1000]], sw: [['S1', '1. emelet', 50], ['S2', 'földszint', 100]], learn: 'A hálózatot mindig a <b>leggyengébb pontja</b> határozza meg. A jó hálózattervező a sok forgalmú termeket vastagabb kábellel köti be.' },
        { n: 'Cache a kapcsolók mögött', goal: 'Gyorsítótár és két 60 Mbit/s-os kapcsoló, nagy letöltés nincs. Mit nem tud tárolni a cache? Cél: 110 Mbit/s.', up: 110, budget: 13, cards: ['tiktok', 'yt4k', 'upd', 'cloud'], cache: true,
          rooms: [['10.a', 'S1', 1000], ['10.b', 'S1', 1000], ['10.c', 'S2', 1000], ['Tanári (WiFi)', 'R', 50]], sw: [['S1', '2. emelet', 60], ['S2', '1. emelet', 60]], learn: 'A gyorsítótár csak az <b>ismétlődő</b> tartalmat spórolja meg. Az egyedi adat (pl. saját fotók feltöltése) mindig végigmegy a vonalon.' },
        { n: 'QoS és WiFi', goal: 'A QoS figyeli a letöltéseket, és két terem csak WiFi-s. Cél: 110 Mbit/s.', up: 110, budget: 13, cards: ['tiktok', 'game', 'yt4k', 'cloud', 'dl'], qos: true,
          rooms: [['11.a', 'R', 1000], ['11.b', 'R', 1000], ['Aula (WiFi)', 'R', 40], ['Udvar (WiFi)', 'R', 30]], sw: [], learn: 'A <b>QoS</b> és a <b>WiFi korlátai</b> együtt is érvényesek: a jó terv minden szűk pontot figyelembe vesz.' },
        { n: 'Tartalék és szűk kábelek', goal: 'Tartalék vonal (100 + 100 Mbit/s), de a kapcsolók kábelei csak 100 Mbit/s-osak!', up: 100, backup: 100, budget: 22, cards: ['tiktok', 'yt4k', 'cloud', 'dl'],
          rooms: [['12.a', 'S1', 1000], ['12.b', 'S1', 1000], ['Labor', 'S2', 1000], ['Udvar (WiFi)', 'R', 50]], sw: [['S1', '2. emelet', 100], ['S2', '1. emelet', 100]], learn: 'A <b>terheléselosztás</b> csak akkor segít, ha a forgalom eljut a vonalakig: a belső hálózatnak is elég gyorsnak kell lennie.' },
        { n: 'Mindent bele', goal: 'Cache, QoS, tartalék vonal (120 + 60) és két 80 Mbit/s-os kapcsoló. A végső próba: 180 Mbit/s!', up: 120, backup: 60, budget: 22, cards: ['tiktok', 'yt4k', 'upd', 'cloud', 'dl'], cache: true, qos: true,
          rooms: [['A épület', 'S1', 1000], ['B épület', 'S1', 1000], ['C épület', 'S2', 1000], ['Könyvtár (WiFi)', 'R', 40]], sw: [['S1', 'főépület', 80], ['S2', 'új szárny', 80]], learn: 'Egy igazi iskolai hálózatban <b>mindez együtt</b> működik: gyorsítótár, QoS, tartalék vonal és jól méretezett kapcsolók. Ezért ritka, hogy leálljon.' }
      ]
    }
  };
  const SEATS = 3;
  let C, ctx, L, li = 0, mk = window.EASY ? 'easy' : 'hard', placed = [], money = 0, sim = null, T = 0, parts = [], sel = null, fails = 0, total = 0, best = 0, racing = false, hoverRoom = -1, drag = null;
  const done = { easy: store.get('nf-done-easy', []), hard: store.get('nf-done-hard', []) };
  const LV = () => MODES[mk].levels, DUR = () => MODES[mk].dur, PREV = () => MODES[mk].preview;
  const VW = 1200, VH = 640; let sc = 1, ox = 0, oy = 0;

  // ---- elrendezés: derékszögben vezetett kábelek, a feliratok mindig a terem mellett, egy oszlopban ----
  const SWX = 660, RX = 880, NX = 1110, LABX = 528;
  function poly(pts) { const seg = []; let len = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); len += d } return { pts, seg, len } }
  function along(l, t) { let d = t * l.len; for (let i = 0; i < l.seg.length; i++) { if (d <= l.seg[i] || i === l.seg.length - 1) { const f = l.seg[i] ? Math.min(1, d / l.seg[i]) : 0, a = l.pts[i], b = l.pts[i + 1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f] } d -= l.seg[i] } return l.pts[0] }
  function layout() {
    const n = L.rooms.length, h = Math.min(130, (VH - 90) / n - 14);
    L.rooms.forEach((r, i) => { r.x = 40; r.y = 60 + i * (h + 14); r.w = 420; r.h = h; r.cy = r.y + h / 2 });
    L.sw.forEach(s => { const rs = L.rooms.filter(r => r[1] === s[0]); s.x = SWX; s.y = rs.reduce((a, r) => a + r.cy, 0) / rs.length });
    L.R = { x: RX, y: VH / 2 - 20 }; L.NET = { x: NX, y: VH / 2 - 20 };
    // több bemenet egy eszközbe: széthúzzuk a becsatlakozási pontokat, és a függőleges szakaszokat, hogy ne fedjék egymást
    const fan = (srcs, ty, vx0, spread) => { srcs.sort((a, b) => a.y - b.y); const m = srcs.length; srcs.forEach((s, j) => { const c = j - (m - 1) / 2; s.ey = ty + c * spread; s.vx = vx0 + Math.abs(c) * 12 }) };
    const links = [];
    L.sw.forEach(s => {
      const srcs = L.rooms.map((r, i) => ({ r, i, y: r.cy })).filter(o => o.r[1] === s[0]); fan(srcs, s.y, 590, 12);
      srcs.forEach(o => links.push({ k: 'r' + o.i, room: o.i, cap: o.r[2], lab: [LABX, o.y], ...poly([[o.r.x + o.r.w, o.y], [o.vx, o.y], [o.vx, o.ey], [s.x - 34, o.ey]]) }));
    });
    const inR = L.rooms.map((r, i) => ({ r, i, y: r.cy })).filter(o => o.r[1] === 'R').concat(L.sw.map(s => ({ s, y: s.y })));
    fan(inR, L.R.y, 766, Math.min(12, 48 / Math.max(1, inR.length)));
    inR.forEach(o => {
      if (o.r) links.push({ k: 'r' + o.i, room: o.i, cap: o.r[2], lab: [LABX, o.y], ...poly([[o.r.x + o.r.w, o.y], [o.vx, o.y], [o.vx, o.ey], [RX - 40, o.ey]]) });
      else links.push({ k: o.s[0], sw: o.s[0], cap: o.s[2], lab: [o.s.x, o.s.y + 44], ...poly([[o.s.x + 34, o.y], [o.vx, o.y], [o.vx, o.ey], [RX - 40, o.ey]]) });
    });
    const dy = L.backup ? -14 : 0, mx = (RX + 40 + NX - 72) / 2;
    links.push({ k: 'up', up: 1, cap: L.up, lab: [mx - 6, L.R.y + dy - 30], ...poly([[RX + 40, L.R.y + dy], [NX - 72, L.R.y + dy]]) });
    if (L.backup) links.push({ k: 'bk', up: 2, cap: L.backup, lab: [mx, L.R.y + 52], ...poly([[RX + 40, L.R.y + 14], [RX + 58, L.R.y + 52], [NX - 90, L.R.y + 52], [NX - 72, L.R.y + 14]]) });
    L.links = links;
  }
  // ---- forgalomszámítás: igény → terem kábele → kapcsoló → internet (arányos korlátozással) ----
  function demand(p, t) {
    const d = DEV[p.t]; if (t < d[6]) return 0; let v = d[3];
    if (p.t === 'yt4k') v *= .9 + .25 * Math.max(0, Math.sin(t * 2.3 + p.ph)); if (p.t === 'tiktok') v *= .9 + .4 * Math.abs(Math.sin(t * 1.7 + p.ph)); if (p.t === 'game') v *= .8 + .4 * Math.sin(t * 5 + p.ph);
    if (L.qos && sim && sim.qos && p.t === 'dl') v = Math.min(v, 15);
    return v;
  }
  // tervezési becslés (könnyű mód): átlagos igény, a QoS-t és a frissítés késését is figyelembe véve
  function demandPlan(p) { const v = { tiktok: 6.9, game: 3, yt4k: 25.8, cloud: 30, upd: 40, dl: 60 }[p.t]; return L.qos && p.t === 'dl' ? 15 : v }
  function flows(t, plan) {
    const F = {}, items = placed.map(p => ({ p, v: plan ? demandPlan(p) : demand(p, t), cached: false }));
    if (L.cache) { const seen = {}; items.forEach(it => { if (DEV[it.p.t][5] && it.v > 0) { if (seen[it.p.t]) it.cached = true; seen[it.p.t] = 1 } }) }
    const lim = (arr, cap) => { const s = arr.reduce((a, it) => a + it.v, 0); if (s > cap) arr.forEach(it => it.v *= cap / s); return s };
    L.rooms.forEach((r, i) => { const arr = items.filter(it => it.p.room === i); F['r' + i] = { off: lim(arr, r[2]), cap: r[2] } });
    const up = items.filter(it => !it.cached);
    L.sw.forEach(s => { const arr = up.filter(it => L.rooms[it.p.room][1] === s[0]); F[s[0]] = { off: lim(arr, s[2]), cap: s[2] } });
    const upOff = up.reduce((a, it) => a + it.v, 0), bk = plan ? !!L.backup : sim && sim.bk, capUp = L.up + (bk ? L.backup : 0);
    F.up = { off: bk ? upOff * L.up / capUp : upOff, cap: L.up }; if (L.backup) F.bk = { off: bk ? upOff * L.backup / capUp : 0, cap: L.backup };
    F.total = upOff; F.capUp = capUp; F.cachedN = items.filter(it => it.cached).length; F.items = items; return F;
  }
  // ---- rajzolás ----
  const loadCol = lo => lo > 1 ? '#ef4444' : lo > .8 ? '#f59e0b' : lo > .01 ? '#4ade80' : '#475569';
  function strokePoly(pts) { const c = ctx; c.beginPath(); c.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) c.lineTo(...pts[i]); c.stroke() }
  function pipe(l, load, glow, active) {
    const c = ctx, col = loadCol(load); c.lineCap = 'round'; c.lineJoin = 'round';
    const thick = l.up ? 20 : l.cap >= 1000 ? 14 : 10; // a kábel vastagsága is jelzi a sávszélességet
    c.strokeStyle = '#1f2430'; c.lineWidth = thick + 6; strokePoly(l.pts);
    if (glow && load > 1) { c.shadowColor = '#ef4444'; c.shadowBlur = 20 + Math.sin(T * 12) * 10 }
    c.strokeStyle = col; c.globalAlpha = active ? .35 + Math.min(1, load) * .55 : .25; c.lineWidth = thick; strokePoly(l.pts); c.globalAlpha = 1; c.shadowBlur = 0;
    if (!l.up && l.cap < 1000) { c.setLineDash([6, 6]); c.strokeStyle = '#0b0c10aa'; c.lineWidth = 2; strokePoly(l.pts); c.setLineDash([]) } // WiFi: szaggatott
  }
  function pill(x, y, txt, col, sub) {
    const c = ctx; c.font = '800 13px Inter,sans-serif'; const w = Math.max(c.measureText(txt).width, sub ? (c.font = '700 10px Inter,sans-serif', c.measureText(sub).width) : 0) + 18, h = sub ? 34 : 24;
    c.fillStyle = '#0b0c10f0'; c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, 10); c.fill(); c.strokeStyle = col; c.lineWidth = 1.5; c.stroke();
    c.textAlign = 'center'; c.fillStyle = col === '#475569' ? '#cbd5e1' : col; c.font = '800 13px Inter,sans-serif'; c.fillText(txt, x, y + (sub ? -1 : 5));
    if (sub) { c.fillStyle = '#94a3b8'; c.font = '700 10px Inter,sans-serif'; c.fillText(sub, x, y + 12) }
  }
  function box(x, y, w, h, r, fill, stroke) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke() } }
  const fmt = v => Math.round(v);
  function draw() {
    const c = ctx, W = C.W, H = C.H, d = devicePixelRatio || 1; c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, W, H);
    sc = Math.min(W / VW, (H - 220) / VH); ox = (W - VW * sc) / 2; oy = 82; c.translate(ox, oy); c.scale(sc, sc);
    const plan = !sim && PREV() && placed.length > 0, F = plan ? flows(0, true) : flows(sim ? sim.t : 0), dark = sim && sim.win ? Math.min(1, sim.winT / 1.5) : 0;
    box(20, 30, 470, VH - 50, 22, '#141821', '#2a3140'); c.fillStyle = '#94a3b8'; c.font = '800 15px Inter,sans-serif'; c.textAlign = 'left'; c.fillText('ISKOLA – TERMEK', 40, 52);
    box(RX - 75, L.R.y - 110, 150, 240, 18, '#141821', '#2a3140'); c.fillStyle = '#94a3b8'; c.font = '700 12px Inter,sans-serif'; c.textAlign = 'center'; c.fillText('SZERVERTEREM', RX, L.R.y - 88);
    const ls = L.links;
    for (const l of ls) { const f = l.up === 1 ? F.up : l.up === 2 ? F.bk : F[l.k], on = l.up !== 2 || (sim && sim.bk) || plan, lo = f && on && (sim || plan) ? f.off / f.cap : 0; pipe(l, lo, !!l.up, on) }
    for (const p of parts) { const l = ls.find(x => x.k === p.k); if (!l) continue; const [x, y] = along(l, p.t); c.fillStyle = p.c; c.beginPath(); c.arc(x, y + p.o, 4, 0, 7); c.fill() }
    L.rooms.forEach((r, i) => {
      const hov = hoverRoom === i && (sel || drag); box(r.x, r.y, r.w, r.h, 16, hov ? '#1e293b' : '#181d27', hov ? '#5b9dff' : '#2f3746');
      c.fillStyle = '#e2e8f0'; c.font = '800 15px Inter,sans-serif'; c.textAlign = 'left'; c.fillText(r[0], r.x + 14, r.y + 24);
      const to = r[1] === 'R' ? 'router' : `kapcsoló (${L.sw.find(s => s[0] === r[1])[1]})`;
      c.fillStyle = r[2] < 1000 ? '#fbbf24' : '#64748b'; c.font = '600 12px Inter,sans-serif'; c.fillText(r[2] >= 1000 ? 'kábel: 1000 Mbit/s' : `WiFi: csak ${r[2]} Mbit/s`, r.x + 14, r.y + 42);
      c.fillStyle = '#64748b'; c.fillText('→ ' + to, r.x + 14, r.y + 58);
      const its = placed.filter(p => p.room === i);
      if (its.length && (plan || sim)) { const want = its.reduce((a, p) => a + (plan ? demandPlan(p) : demand(p, sim.t)), 0); c.fillStyle = want > r[2] ? '#f87171' : '#cbd5e1'; c.font = '800 12px Inter,sans-serif'; c.fillText(`igény: ${fmt(want)} Mbit/s`, r.x + 14, r.y + r.h - 12) }
      for (let k = 0; k < SEATS; k++) {
        const sx = r.x + 200 + k * 76, sy = r.y + r.h / 2, p = its[k];
        box(sx - 33, sy - 30, 66, 60, 12, p ? DEV[p.t][2] + '22' : '#0f131b', p ? DEV[p.t][2] : '#2a3140');
        if (p) { c.globalAlpha = sim ? .6 + .4 * Math.sin(T * 6 + k) : 1; drawIcon(c, DEV[p.t][1], sx, sy - 6, 26, DEV[p.t][2], 2.2); c.globalAlpha = 1; c.fillStyle = '#e2e8f0'; c.font = '800 11px Inter,sans-serif'; c.textAlign = 'center'; c.fillText(`${DEV[p.t][3]} Mbit/s`, sx, sy + 22); const it = F.items.find(x => x.p === p); if (it && it.cached && (sim || plan)) { box(sx - 26, sy - 44, 52, 16, 8, '#0e3a44', '#22d3ee'); c.fillStyle = '#22d3ee'; c.font = '800 10px Inter,sans-serif'; c.fillText('CACHE', sx, sy - 32) } }
        else { c.fillStyle = '#334155'; c.font = '700 22px Inter,sans-serif'; c.textAlign = 'center'; c.fillText('+', sx, sy + 8) }
      }
      if (dark) { c.fillStyle = `rgba(0,0,0,${dark * .55})`; c.fillRect(r.x, r.y, r.w, r.h) }
    });
    L.sw.forEach(s => { c.fillStyle = '#cbd5e1'; c.font = '800 12px Inter,sans-serif'; c.textAlign = 'center'; c.fillText(`kapcsoló • ${s[1]}`, s.x, s.y - 30); box(s.x - 34, s.y - 22, 68, 44, 10, '#1f2937', '#64748b'); drawIcon(c, 'kapcsolo', s.x, s.y, 24, '#cbd5e1', 2) });
    box(RX - 40, L.R.y - 30, 80, 60, 12, '#1f2937', '#94a3b8'); drawIcon(c, 'router', RX, L.R.y - 4, 30, '#e2e8f0', 2); c.fillStyle = '#cbd5e1'; c.font = '700 11px Inter,sans-serif'; c.textAlign = 'center'; c.fillText('router', RX, L.R.y + 22);
    if (L.cache) { box(RX - 46, L.R.y + 76, 92, 34, 10, (sim || plan) && F.cachedN ? '#0e3a44' : '#1f2937', '#22d3ee'); c.fillStyle = '#22d3ee'; c.font = '800 12px Inter,sans-serif'; c.fillText(`gyorsítótár${sim || plan ? ` (${F.cachedN})` : ''}`, RX, L.R.y + 98) }
    if (L.qos) { box(RX - 60, L.R.y - 74, 120, 26, 10, sim && sim.qos ? '#3a2a0a' : '#1f2937', sim && sim.qos ? '#fbbf24' : '#475569'); c.fillStyle = sim && sim.qos ? '#fbbf24' : '#94a3b8'; c.font = '800 11.5px Inter,sans-serif'; c.fillText(sim && sim.qos ? 'QoS: letöltés ≤ 15' : 'QoS figyel…', RX, L.R.y - 57) }
    const bad = sim && F.total / F.capUp >= 1, nx = L.NET.x, ny = L.NET.y;
    c.save(); if (bad) c.translate(Math.sin(T * 40) * 3, 0); c.fillStyle = bad ? '#7f1d1d' : '#1e3a8a'; [[-40, 0, 42], [0, -24, 50], [44, 0, 40], [0, 18, 48]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(nx + dx, ny + dy, r, 0, 7); c.fill() });
    c.fillStyle = '#fff'; c.font = '900 20px Inter,sans-serif'; c.textAlign = 'center'; c.fillText('INTERNET', nx, ny + 6); c.restore();
    const bx = 1010, by = 470; box(bx, by, 170, 120, 14, '#0f172a', sim && sim.win ? '#ef4444' : '#334155'); c.fillStyle = '#94a3b8'; c.font = '700 12px Inter,sans-serif'; c.textAlign = 'center'; c.fillText('ONLINE DOLGOZAT', bx + 85, by + 24);
    c.fillStyle = sim && sim.win ? '#f87171' : sim && sim.meter > .3 ? '#fbbf24' : '#4ade80'; c.font = '900 20px Inter,sans-serif'; c.fillText(sim && sim.win ? 'ELMARADT!' : sim && sim.meter > .3 ? 'akadozik…' : 'fut', bx + 85, by + 62);
    if (sim && !sim.win && sim.meter > .3) { c.strokeStyle = '#fbbf24'; c.lineWidth = 4; c.beginPath(); c.arc(bx + 85, by + 92, 12, T * 6, T * 6 + 4.5); c.stroke() }
    // feliratok a kábelek fölé (utoljára rajzolva, hogy semmi ne takarja őket)
    for (const l of ls) {
      const f = l.up === 1 ? F.up : l.up === 2 ? F.bk : F[l.k], on = l.up !== 2 || (sim && sim.bk) || plan, lo = f && on && (sim || plan) ? f.off / f.cap : 0;
      const val = sim && on ? `${fmt(f.off)}` : plan && on ? `≈${fmt(f.off)}` : '–', txt = `${val} / ${l.cap} Mbit/s`;
      const sub = l.up === 1 ? 'internet – fővonal' : l.up === 2 ? (sim && sim.bk ? 'tartalék vonal – BEKAPCSOLVA' : 'tartalék vonal (kikapcsolva)') : l.sw ? 'kapcsoló → router' : l.cap < 1000 ? 'WiFi' : 'kábel';
      pill(l.lab[0], l.lab[1], txt, loadCol(lo), sub);
    }
    // jelmagyarázat
    c.textAlign = 'left'; c.font = '700 11px Inter,sans-serif'; [['#4ade80', 'szabad'], ['#f59e0b', 'majdnem tele'], ['#ef4444', 'túlterhelt']].forEach(([col, t], k) => { c.fillStyle = col; c.fillRect(1010, 30 + k * 18, 22, 8); c.fillStyle = '#94a3b8'; c.fillText(t, 1038, 38 + k * 18) });
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
    const rate = mk === 'easy' ? 1.25 : 1;
    s.meter = Math.max(0, Math.min(1, s.meter + (lo >= 1 ? dt * rate * Math.min(.32, .2 + (lo - 1) * .5) : -dt * .35))); s.peak = Math.max(s.peak, lo);
    for (const l of L.links) { const f = l.up === 1 ? F.up : l.up === 2 ? F.bk : F[l.k]; if (!f || f.off <= 0) continue; if (Math.random() < dt * f.off / 5 && parts.length < 600) { const it = F.items.filter(x => x.v > 0 && (l.room === undefined || x.p.room === l.room) && (l.room !== undefined ? true : !x.cached) && (!l.sw || L.rooms[x.p.room][1] === l.sw)); const col = it.length ? DEV[pick(it).p.t][2] : '#fff'; parts.push({ k: l.k, t: 0, o: (Math.random() - .5) * 6, c: col, sp: (.5 + Math.random() * .3) * 300 / l.len, over: f.off / f.cap }) } }
    for (const p of parts) p.t += dt * p.sp * (p.over > 1 ? .4 : 1); parts = parts.filter(p => p.t < 1);
    hud(F, lo);
    if (s.meter >= 1) win(); else if (s.t >= DUR()) lose(F);
  }
  function hud(F, lo) {
    const m = $('#nf-meter'); if (!m) return; m.style.width = (sim ? sim.meter * 100 : 0) + '%';
    if (!sim && PREV() && placed.length) { const P = flows(0, true), pl = P.total / P.capUp; $('#nf-load').innerHTML = `várható: ≈${fmt(P.total)} / ${P.capUp} Mbit/s <span style="color:${pl >= 1.05 ? 'var(--green)' : 'var(--yellow)'}">${pl >= 1.05 ? '– elég lesz!' : `– még ≈${fmt(P.capUp * 1.05 - P.total)} kell`}</span>` }
    else $('#nf-load').textContent = sim && F ? `${fmt(F.total)} / ${F.capUp} Mbit/s (${Math.round(lo * 100)}%)` : `cél: több mint ${L.up}${L.backup ? ' (+' + L.backup + ' tartalék)' : ''} Mbit/s`;
    $('#nf-time').textContent = sim ? `• ${Math.max(0, Math.ceil(DUR() - sim.t))} mp` : '';
  }
  function win() {
    sim.win = true; sim.winT = 0; sfx.pop(); setTimeout(() => { sfx.win(); FX.confetti() }, 500);
    const pts = Math.max(100, (mk === 'hard' ? 1300 : 1000) + money * 40 - fails * 150); total += pts; done[mk][li] = true; store.set('nf-done-' + mk, done[mk]);
    setTimeout(() => overlay(true, pts), 2200);
  }
  function lose(F) {
    sim.over = true; fails++; sfx.bad();
    const tight = L.links.filter(l => !l.up).map(l => ({ l, f: F[l.k] })).filter(x => x.f && x.f.off > x.f.cap);
    const why = sim.peak < .8 ? 'Kevés volt a forgalom – tegyél be több, nagyobb adatforgalmú eszközt!' : tight.length ? `A(z) <b>${tight[0].l.room !== undefined ? L.rooms[tight[0].l.room][0] + ' vonala' : 'kapcsoló kábele (' + L.sw.find(s => s[0] === tight[0].l.sw)[1] + ')'}</b> telt be – a forgalom el sem jutott az internetig. Oszd el jobban az eszközöket!` : L.cache && F.cachedN ? 'A gyorsítótár elnyelte az ismétlődő tartalmat. Válassz különböző dolgokat!' : L.qos && sim.qos ? 'A QoS visszafogta a letöltéseket. Olyan forgalom kell, amit nem korlátoz!' : 'Majdnem! Egy kicsivel több forgalom kellett volna.';
    overlay(false, 0, why);
  }
  function overlay(ok, pts, why) {
    const o = $('#nf-over'); o.style.display = 'flex'; const last = li === LV().length - 1;
    if (ok && last) { best = Math.max(best, total); if (racing) { racing = false; Comp.finish(total, `${MODES[mk].n} mód: ${LV().length} pálya, ${fails} sikertelen próba`) } }
    o.innerHTML = ok ? `<div class="card"><h2>Leállt a suli internete!</h2><div class="nf-board">${icon('internet', 54, 1.6)}<b>Az online dolgozat elmarad</b></div><p>${MODES[mk].n} • ${li + 1}. pálya: ${L.n} teljesítve • <b>+${pts} pont</b></p>
      <div class="learn"><b>Mit tanultál?</b> ${L.learn}<br><br><b>A valóságban</b> a rendszergazda dolga, hogy ez ne történjen meg: figyeli a forgalmat, és gyorsítótárral, QoS-szabályokkal, tartalék vonallal védi a hálózatot.</div>
      <div style="margin-top:14px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">${last ? `<button class="btn go" id="nf-menu2">${mk === 'easy' ? 'Jöhet a nehéz mód! ▶' : 'Pályaválasztó'}</button>` : `<button class="btn go" id="nf-next">Következő pálya ▶</button>`}${racing ? '' : '<button class="btn" id="nf-menu3">Pályaválasztó</button>'}</div></div>`
      : `<div class="card"><h2>Bírta a hálózat…</h2><p style="font-size:17px">${why}</p><div class="learn">Tipp: nézd meg, melyik kábel lett piros. ${L.goal}</div><div style="margin-top:14px"><button class="btn go" id="nf-retry">Átrendezem ▶</button></div></div>`;
    if (ok) {
      if (last) $('#nf-menu2').onclick = () => { if (mk === 'easy' && !racing) { mk = 'hard'; o.style.display = 'none'; load(0) } else menu() };
      else $('#nf-next').onclick = () => { o.style.display = 'none'; load(li + 1) };
      const m3 = $('#nf-menu3'); if (m3) m3.onclick = menu;
    } else $('#nf-retry').onclick = () => { o.style.display = 'none'; sim = null; parts = []; renderUI() };
  }
  // ---- módválasztó és pályaválasztó ----
  function menu() {
    if (sim && !sim.over && !sim.win) return; sim = null; parts = [];
    const o = $('#nf-over'); o.style.display = 'flex';
    const col = k => `<div class="nf-mcol ${mk === k ? 'on' : ''}" style="--c:${k === 'easy' ? '#4ade80' : '#f87171'}"><b>${MODES[k].n} mód</b><small>${k === 'easy' ? 'Több pénz és idő, és a kábeleken már a Rajt előtt látod a várható forgalmat.' : 'Szűkös keret, kevesebb idő, és csak a Rajt után derül ki, mire elég a terved.'}</small>
      <div class="nf-lvs">${MODES[k].levels.map((x, i) => `<button class="nf-lb ${done[k][i] ? 'ok' : ''}" data-m="${k}" data-l="${i}"><span>${done[k][i] ? icon('check', 16, 2.6) : i + 1}</span>${x.n}</button>`).join('')}</div></div>`;
    o.innerHTML = `<div class="card" style="max-width:900px"><h2>Az internet útja – Netfaló</h2><p style="font-size:16px">Válassz módot és pályát! Mindkét módban ${MODES.easy.levels.length}, illetve ${MODES.hard.levels.length} pálya vár.</p><div class="nf-modes">${col('easy')}${col('hard')}</div></div>`;
    $$('.nf-lb', o).forEach(b => b.onclick = () => { sfx.click(); mk = b.dataset.m; o.style.display = 'none'; load(+b.dataset.l) });
  }
  // ---- pálya, kártyák, elhelyezés ----
  function load(i) { li = i; L = LV()[i]; layout(); placed = []; money = L.budget; sim = null; parts = []; sel = null; if (i === 0) { fails = 0; total = 0 } renderUI(); intro() }
  function intro() {
    const o = $('#nf-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card"><div class="nf-lv"><em class="${mk}">${MODES[mk].n}</em>${LV().map((x, k) => `<span class="${k === li ? 'on' : done[mk][k] ? 'ok' : ''}">${k + 1}</span>`).join('')}</div><h2>${li + 1}. pálya: ${L.n}</h2><p style="font-size:18px">${L.goal}</p>
      ${li === 0 ? `<div class="learn" style="text-align:left">Ma <b>online dolgozat</b> lenne… de ha az iskola internete <b>túlterhelődik</b>, elmarad az óra! Húzd az eszközöket a termekbe (vagy kattints a kártyára, majd a teremre), figyelj a pénzedre, aztán nyomd meg a <b>Rajt!</b> gombot. Ha a „Leállás” sáv betelik, nyertél.<br>A kábelek felirata mutatja: <b>mennyi forgalom megy át / mennyi férne át</b>. A szaggatott vonal WiFi.</div>` : ''}
      <button class="btn go" id="nf-go" style="font-size:22px;margin-top:12px">Lássuk! ▶</button></div>`;
    $('#nf-go').onclick = () => { o.style.display = 'none' };
  }
  function renderUI() {
    $('#nf-lvl').innerHTML = `<b><em class="nf-mt ${mk}">${MODES[mk].n}</em> ${li + 1}/${LV().length}. ${L.n}</b><span>${L.goal}</span>`;
    $('#nf-money').innerHTML = `${icon('coin', 18)} <b>${money}</b>`;
    $('#nf-cards').innerHTML = L.cards.map(k => { const d = DEV[k]; return `<button class="nf-card ${sel === k ? 'sel' : ''} ${d[4] > money ? 'no' : ''}" data-k="${k}" style="--c:${d[2]}"><span class="nf-ci">${icon(d[1], 24, 2)}</span><b>${d[0]}</b><span class="nf-cm">${d[3]} Mbit/s${d[6] ? ` • ${d[6]} mp múlva` : ''}${L.cache && d[5] ? ' • cache-elhető' : ''}</span><span class="nf-cp">${icon('coin', 13)} ${d[4]}</span></button>` }).join('');
    $$('.nf-card').forEach(b => b.onpointerdown = e => cardDown(e, b.dataset.k));
    $('#nf-start').disabled = !placed.length || !!sim; $('#nf-clear').disabled = !!sim; $('#nf-menu').disabled = !!sim && !sim.over && !sim.win;
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
    const its = placed.filter(p => p.room === i), k = Math.round((x - (r.x + 200)) / 76);
    if (k >= 0 && k < SEATS && its[k] && Math.abs(y - (r.y + r.h / 2)) < 32 && Math.abs(x - (r.x + 200 + k * 76)) < 35) { placed = placed.filter(p => p !== its[k]); money += DEV[its[k].t][4]; beep(400, .05, 'triangle', .04); renderUI(); return }
    if (sel) place(sel, i);
  }
  function start() { if (!placed.length) return; sim = { t: 0, meter: 0, peak: 0, win: false }; parts = []; sel = null; renderUI(); beep(500, .1, 'triangle', .05); beep(800, .12, 'triangle', .05, 0, .12) }
  S.build = r => {
    r.innerHTML = `<style>
      #nf{position:absolute;inset:0}
      #nf-top{position:absolute;top:10px;left:14px;right:14px;display:flex;gap:12px;align-items:stretch;z-index:2;pointer-events:none}
      #nf-lvl{flex:1;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:8px 14px;display:flex;flex-direction:column;justify-content:center}#nf-lvl b{font-size:17px}#nf-lvl span{font-size:13px;color:var(--muted);line-height:1.35}
      .nf-mt{font-style:normal;font-size:11px;font-weight:800;padding:2px 8px;border-radius:999px;vertical-align:2px;margin-right:4px}.nf-mt.easy,.nf-lv em.easy{background:#14532d;color:#86efac}.nf-mt.hard,.nf-lv em.hard{background:#7f1d1d;color:#fecaca}
      .nf-box{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:6px 14px;min-width:230px;display:flex;flex-direction:column;justify-content:center;gap:4px}.nf-box small{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
      .nf-mw{height:12px;background:#1c1f26;border-radius:6px;overflow:hidden}#nf-meter{height:100%;width:0;background:linear-gradient(90deg,#f59e0b,#ef4444);transition:width .15s linear;box-shadow:0 0 14px #ef4444}
      #nf-load{font-size:13px;font-weight:700}#nf-money{font-size:22px;display:flex;gap:6px;align-items:center;color:var(--yellow)}
      #nf-bot{position:absolute;left:0;right:0;bottom:0;display:flex;gap:12px;align-items:center;justify-content:center;padding:10px;flex-wrap:wrap;z-index:2}
      #nf-cards{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
      .nf-card{all:unset;cursor:grab;touch-action:none;user-select:none;position:relative;width:140px;padding:10px;border-radius:16px;background:color-mix(in srgb,var(--c) 12%,#14161b);border:2px solid color-mix(in srgb,var(--c) 45%,transparent);display:flex;flex-direction:column;gap:3px;transition:transform .2s cubic-bezier(.2,.8,.2,1),box-shadow .2s}
      .nf-card:hover{transform:translateY(-5px);box-shadow:0 12px 26px -10px var(--c)}.nf-card.sel{transform:translateY(-8px);border-color:var(--c);box-shadow:0 0 24px var(--c)}.nf-card.no{opacity:.4}
      .nf-ci{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:var(--c);color:#0b0c10}.nf-card b{font-size:13.5px;line-height:1.2}.nf-cm{font-size:12px;color:#cbd5e1}.nf-cp{position:absolute;top:8px;right:10px;font-size:14px;font-weight:800;color:var(--yellow);display:flex;gap:3px;align-items:center}
      #nf-act{display:flex;flex-direction:column;gap:6px}#nf-start{height:58px;font-size:22px;padding:0 26px}#nf-clear,#nf-menu{height:32px;font-size:13px}
      .nf-lv{display:flex;gap:6px;justify-content:center;align-items:center;margin-bottom:8px}.nf-lv em{font-style:normal;font-size:12px;font-weight:800;padding:3px 10px;border-radius:999px;margin-right:4px}.nf-lv span{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--panel2);font-weight:800;font-size:13px}.nf-lv .on{background:var(--accent);color:#0b0c10}.nf-lv .ok{background:#16a34a;color:#fff}
      .nf-board{display:flex;flex-direction:column;align-items:center;gap:6px;color:#f87171;margin:6px 0 10px;animation:nfB 1s ease-in-out infinite}.nf-board b{font-size:20px}@keyframes nfB{50%{transform:scale(1.06)}}
      .nf-modes{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:10px;text-align:left}@media(max-width:760px){.nf-modes{grid-template-columns:1fr}}
      .nf-mcol{border:2px solid var(--line2);border-radius:18px;padding:14px;background:var(--bg2)}.nf-mcol.on{border-color:var(--c);box-shadow:0 0 22px color-mix(in srgb,var(--c) 30%,transparent)}.nf-mcol>b{font-size:21px;color:var(--c)}.nf-mcol small{display:block;font-size:13.5px;color:var(--muted);margin:4px 0 10px;line-height:1.4}
      .nf-lvs{display:flex;flex-direction:column;gap:6px}.nf-lb{all:unset;cursor:pointer;display:flex;gap:10px;align-items:center;padding:7px 10px;border-radius:12px;background:var(--panel);border:1px solid var(--line);font-size:14.5px;font-weight:600}.nf-lb:hover{border-color:var(--c)}.nf-lb span{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--panel2);font-weight:800;font-size:13px;flex:none}.nf-lb.ok span{background:#16a34a;color:#fff}
    </style>
    <div id="nf"><div id="nf-top"><div id="nf-lvl"></div><div class="nf-box"><small>Internet terhelése</small><span id="nf-load">–</span><small>Leállás <span id="nf-time"></span></small><div class="nf-mw"><div id="nf-meter"></div></div></div><div class="nf-box" style="min-width:110px"><small>Pénzed</small><span id="nf-money"></span></div></div>
      <div id="nf-bot"><div id="nf-cards"></div><div id="nf-act"><button class="btn go" id="nf-start">Rajt! ▶</button><button class="btn" id="nf-clear">Mindent kiveszek</button><button class="btn" id="nf-menu">Pályák / mód</button></div></div>
      <div class="big-overlay" id="nf-over" style="display:none"></div></div>`;
    C = makeCanvas($('#nf')); ctx = C.ctx; C.resize();
    C.cv.addEventListener('pointerdown', canvasDown);
    C.cv.addEventListener('pointermove', e => { if (drag) return; const [x, y] = toV(e.clientX, e.clientY); hoverRoom = roomAt(x, y); C.cv.style.cursor = hoverRoom >= 0 && sel ? 'copy' : '' });
    $('#nf-start').onclick = start; $('#nf-clear').onclick = () => { if (sim) return; placed.forEach(p => money += DEV[p.t][4]); placed = []; renderUI() };
    $('#nf-menu').onclick = () => { if (racing) { toast('Verseny közben nem válthatsz pályát.', '#fbbf24', 1600); return } sfx.click(); menu() };
    mk = window.EASY ? 'easy' : 'hard'; li = 0; L = LV()[0]; layout(); money = L.budget; renderUI(); menu();
  };
  S.enter = () => { if (C) C.resize() };
  S.resize = () => C && C.resize();
  S.tick = dt => { if (!C || !L) return; step(Math.min(dt, .05)); draw() };
  S.leave = () => { if (sim && !sim.win) sim = null; racing = false };
  S.comp = { rules: 'Netfaló: teljesítsd az összes pályát (könnyű módban a könnyű, egyébként a nehéz pályákat)! Pont jár minden pályáért és a megmaradt pénzért, levonás a sikertelen próbákért.', start: () => { racing = true; mk = window.EASY ? 'easy' : 'hard'; load(0) } };
  S.comp.live = () => racing ? total : 0; // verseny közbeni részeredmény (élő ranglista-mentés)
  S.score = () => best || total;
  S._dbg = () => ({ get L() { return L }, place, start, flows, get sim() { return sim }, get money() { return money }, load, MODES, setMode: m => { mk = m } });
  return S;
})());
