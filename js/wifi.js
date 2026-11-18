/* ===== 4. WiFi-tervező: könnyű / nehéz pályák, kábelek, valós idejű zavarok ===== */
App.add((() => {
  const S = {
    id: 'wifi', icon: '', title: 'WiFi-tervező', color: '#2dd4bf',
    desc: 'Könnyű és nehéz pályák: router, mesh, jelismétlő, kábeles AP, powerline – és közben zavar a mikró, a szomszéd WiFi-je és a mozgó emberek!',
    topic: 'Vezeték nélküli hálózatok, 802.11, csatornák, interferencia, strukturált kábelezés'
  };
  const MPU = .2; // 1 egység = 20 cm
  // falcsillapítás dB-ben: o külső fal, i belső fal, b fürdő, c beton, g üveg, w akvárium (víz), m fém (hűtő, polc), k vastag kőfal
  const ATT = { '24': { o: 10, i: 5, b: 12, c: 15, g: 3, w: 9, m: 15, k: 22, pl: 40 }, '5': { o: 15, i: 8, b: 18, c: 24, g: 5, w: 16, m: 20, k: 32, pl: 46.4 } };
  const SPD = { '24': [0, 7, 36, 90, 144], '5': [0, 40, 200, 520, 866] };
  const CH = { '24': [1, 6, 11], '5': [36, 44, 149] };
  const NEED = { tv: [25, '4K film'], tv8: [80, '8K film'], fridge: [2, 'okoshűtő'], speaker: [2, 'zene'], console: [100, 'online játék'], phone: [20, 'videóhívás'], laptop: [50, 'munka, videó'], camera: [8, 'HD kamera'], desktop: [50, 'munka'], tablet: [20, 'videó'] };
  const ITEMS = {
    mesh: { n: 'Mesh-pont', cost: 12000, d: 'vezeték nélkül kapcsolódik, a sávszélesség felét továbbadja' },
    ext: { n: 'Jelismétlő', cost: 6000, d: 'olcsó, de csak a harmadát adja tovább' },
    wap: { n: 'Kábeles AP', cost: 15000, d: 'teljes sebesség, de kábelt kell húzni hozzá a routertől' },
    plc: { n: 'Powerline', cost: 9000, d: 'a villanyvezetéken viszi a netet, a mosógép zavarja' }
  };
  const CABLE_M = 250, DRILL = 2000; // Ft/méter, falfúrás
  const rect = (x0, y0, x1, y1, t = 'o') => [[x0, y0, x1, y0, t], [x1, y0, x1, y1, t], [x1, y1, x0, y1, t], [x0, y1, x0, y0, t]];
  const D = (dev, n, x, y, need) => ({ dev: dev === 'tv8' ? 'tv' : dev, n, x, y, need: need ?? NEED[dev][0], what: NEED[dev][1] });
  const EASY = [
    { n: 'Garzonlakás', W: 80, H: 45, budget: 5000, isp: 1000, test: 15, pass: .85,
      intro: 'Egy kis lakás, egy router. Húzd a routert jó helyre! Ha kell, egy kábellel közvetlenül is beköthetsz egy eszközt.',
      walls: [...rect(0, 0, 80, 45), [48, 0, 48, 28, 'i'], [0, 30, 14, 30, 'b'], [22, 30, 22, 45, 'b'], [20, 30, 22, 30, 'b']],
      rooms: [['Szoba', 24, 3], ['Háló', 64, 3], ['Fürdő', 9, 34]],
      devs: [D('tv', 'Okostévé', 30, 38), D('laptop', 'Laptop', 70, 10), D('phone', 'Telefon', 66, 38)],
      router: { x: 4, y: 40 }, people: 1, tip: 'A router ideális helye a lakás <b>közepe</b>, magasan, nem a sarokban és nem szekrényben.' },
    { n: 'Családi ház', W: 118, H: 60, yard: [100, 118], budget: 25000, isp: 1000, test: 15, pass: .85, mw: [30, 52], mwP: [6, 14],
      intro: 'Nagyobb ház kerttel. A kamera kint van, a konzolnak 100 Mbit/s kell. Délben valaki melegít a mikróban…',
      walls: [...rect(0, 0, 100, 60), [40, 0, 40, 25, 'i'], [40, 32, 40, 60, 'i'], [70, 0, 70, 40, 'i'], [70, 47, 70, 60, 'i'], [0, 30, 15, 30, 'i'], [22, 30, 40, 30, 'i'], [70, 25, 80, 25, 'i'], [87, 25, 100, 25, 'i'], [40, 42, 50, 42, 'b'], [56, 42, 70, 42, 'b']],
      rooms: [['Nappali', 20, 4], ['Konyha', 20, 34], ['Előszoba', 55, 4], ['Fürdő', 55, 45], ['Gyerekszoba', 85, 4], ['Hálószoba', 85, 29], ['Kert', 109, 4]],
      devs: [D('tv', 'Okostévé', 10, 14), D('fridge', 'Okoshűtő', 8, 50), D('speaker', 'Hangszóró', 62, 53), D('console', 'Konzol', 92, 10), D('phone', 'Telefon', 92, 51), D('laptop', 'Laptop', 30, 22), D('camera', 'Kamera', 111, 40)],
      router: { x: 6, y: 6 }, people: 2, tip: 'A mikrohullámú sütő a <b>2,4 GHz</b>-es sávban sugároz, a közelében erősen zavarja a WiFit.' },
    { n: 'A router a bejáratnál', W: 140, H: 50, budget: 30000, isp: 1000, test: 15, pass: .85,
      intro: 'A szolgáltató a bejáratnál vezette be az optikai kábelt, ezért a router <b>nem mozdítható</b>. A ház végében gyors net kell.',
      walls: [...rect(0, 0, 140, 50), [30, 0, 30, 20, 'i'], [30, 28, 30, 50, 'i'], [62, 0, 62, 30, 'i'], [62, 38, 62, 50, 'i'], [62, 30, 80, 30, 'b'], [80, 30, 80, 50, 'b'], [100, 0, 100, 22, 'i'], [100, 30, 100, 50, 'i'], [100, 26, 120, 26, 'i'], [128, 26, 140, 26, 'i']],
      rooms: [['Előszoba', 15, 3], ['Nappali', 46, 3], ['Konyha', 81, 3], ['Fürdő', 71, 40], ['Dolgozó', 120, 3], ['Gyerekszoba', 120, 30]],
      devs: [D('tv', 'Okostévé', 50, 44), D('speaker', 'Hangszóró', 90, 18), D('laptop', 'Laptop', 132, 12), D('console', 'Konzol', 126, 44), D('phone', 'Telefon', 108, 40)],
      router: { x: 4, y: 25, fixed: 1 }, people: 2, tip: 'Ha a router helye kötött, <b>mesh-pont</b>, <b>kábeles AP</b> vagy <b>powerline</b> viszi tovább a netet.' },
    { n: 'Zavarok mindenhol', W: 130, H: 60, yard: [104, 130], budget: 35000, isp: 1000, test: 20, pass: .85, mw: [26, 10], mwP: [8, 12],
      intro: 'Társasház: a szomszédok WiFi-je is szól, a falak betonból vannak. Válassz jó csatornát!',
      walls: [...rect(0, 0, 104, 60, 'c'), [36, 0, 36, 24, 'c'], [36, 32, 36, 60, 'c'], [70, 0, 70, 38, 'i'], [70, 46, 70, 60, 'i'], [0, 34, 22, 34, 'i'], [28, 34, 36, 34, 'i'], [70, 30, 82, 30, 'b'], [90, 30, 104, 30, 'b']],
      rooms: [['Konyha', 18, 3], ['Nappali', 53, 3], ['Háló', 87, 3], ['Fürdő', 87, 46], ['Szoba', 18, 46], ['Kert', 117, 3]],
      devs: [D('fridge', 'Okoshűtő', 8, 12), D('tv', 'Okostévé', 60, 52), D('console', 'Konzol', 46, 10), D('laptop', 'Laptop', 18, 52), D('phone', 'Telefon', 94, 14), D('camera', 'Kamera', 122, 50)],
      router: { x: 52, y: 30 }, people: 2, nb: [[-6, 10, '24', 6], [-6, 50, '24', 1], [60, -6, '24', 6], [50, 66, '5', 36]], nbBusy: .5,
      tip: 'A <b>2,4 GHz</b>-en csak 3 csatorna nem fedi át egymást (1, 6, 11). Ha a szomszéd is a 6-oson van, osztozni kell a rádióidőn.' },
    { n: 'Irodaház', W: 150, H: 70, budget: 60000, isp: 1000, test: 20, pass: .85,
      intro: 'A router a szerverszobában, vasbeton falak, nyolc munkaállomás. A lehető legolcsóbban oldd meg!',
      walls: [...rect(0, 0, 150, 70, 'c'), [22, 0, 22, 22, 'c'], [0, 22, 22, 22, 'c'], [50, 0, 50, 26, 'g'], [50, 34, 50, 70, 'g'], [100, 0, 100, 26, 'c'], [100, 34, 100, 70, 'c'], [100, 40, 150, 40, 'g'], [22, 40, 50, 40, 'i']],
      rooms: [['Szerver', 11, 8], ['Nyitott iroda', 75, 3], ['Tárgyaló', 125, 3], ['Vezetői', 125, 50], ['Iroda', 36, 50]],
      devs: [D('desktop', 'Gép 1', 60, 12), D('desktop', 'Gép 2', 88, 12), D('desktop', 'Gép 3', 60, 58), D('desktop', 'Gép 4', 88, 58), D('laptop', 'Tárgyaló', 125, 20), D('laptop', 'Vezető', 135, 58), D('desktop', 'Gép 5', 30, 58), D('phone', 'Telefon', 114, 52)],
      router: { x: 8, y: 14, fixed: 1 }, people: 3, tip: 'Irodában a hozzáférési pontokat <b>kábellel</b> kötik a hálózatra, és a mennyezetre szerelik.' }
  ];
  const HARD = [
    { n: 'Panelház, 7. emelet', W: 110, H: 60, budget: 34000, isp: 300, test: 30, pass: .95, mw: [16, 48], mwP: [5, 9], bt: [[95, 12]],
      intro: 'Vasbeton panel, és körülötted <b>hét szomszéd WiFi-je</b>, amelyek időnként csatornát váltanak. Az előfizetés csak 300 Mbit/s. A router a bejárati ajtónál van.',
      walls: [...rect(0, 0, 110, 60, 'c'), [38, 0, 38, 34, 'c'], [38, 42, 38, 60, 'c'], [74, 0, 74, 22, 'c'], [74, 30, 74, 60, 'c'], [0, 36, 30, 36, 'i'], [74, 30, 110, 30, 'i'], [38, 42, 56, 42, 'b'], [56, 42, 56, 60, 'b'], [86, 10, 92, 10, 'm']],
      rooms: [['Konyha', 15, 42], ['Előszoba', 15, 3], ['Nappali', 56, 3], ['Fürdő', 47, 50], ['Háló', 92, 3], ['Gyerekszoba', 92, 34]],
      devs: [D('tv', 'Okostévé', 64, 54), D('console', 'Konzol', 100, 52), D('laptop', 'Home office', 102, 20), D('phone', 'Telefon', 22, 50), D('speaker', 'Hangszóró', 56, 14), D('tablet', 'Tablet', 84, 44)],
      router: { x: 4, y: 18, fixed: 1 }, people: 3,
      nb: [[-6, 10, '24', 6], [-6, 45, '24', 1], [30, -6, '24', 11], [70, -6, '24', 6], [116, 15, '24', 1], [116, 45, '5', 36], [60, 66, '5', 44]], nbBusy: .75, hop: 1,
      tip: 'Zsúfolt társasházban az <b>5 GHz</b> szabadabb, de a beton elnyeli. A legmegbízhatóbb a <b>kábel</b> – a konzolnak és a home office gépnek érdemes behúzni.' },
    { n: 'Kertes ház akváriummal', W: 140, H: 70, yard: [112, 140], budget: 35000, isp: 500, test: 30, pass: .95, mw: [20, 56], mwP: [6, 10], washer: [90, 62],
      intro: 'A router a garázsban van. A nappaliban egy nagy <b>akvárium</b> (a víz elnyeli a jelet), a konyhában <b>fém hűtő</b>, a kert végében kamera. A mosógép a powerline-t zavarja.',
      walls: [...rect(0, 0, 112, 70), [24, 0, 24, 30, 'i'], [0, 30, 24, 30, 'i'], [24, 38, 24, 70, 'i'], [60, 0, 60, 26, 'i'], [60, 34, 60, 70, 'i'], [84, 40, 84, 70, 'b'], [84, 40, 112, 40, 'b'], [84, 0, 84, 32, 'i'], [40, 18, 52, 18, 'w'], [40, 20, 52, 20, 'w'], [8, 52, 16, 52, 'm']],
      rooms: [['Garázs', 12, 3], ['Konyha', 12, 40], ['Nappali', 42, 3], ['Étkező', 72, 50], ['Dolgozó', 72, 3], ['Háló', 98, 3], ['Fürdő', 98, 50], ['Kert', 126, 3]],
      devs: [D('tv8', '8K tévé', 46, 10), D('laptop', 'Home office', 76, 14), D('console', 'Konzol', 104, 18), D('tablet', 'Tablet', 40, 60), D('fridge', 'Okoshűtő', 12, 58), D('camera', 'Kertkamera', 134, 60), D('phone', 'Telefon', 70, 62)],
      router: { x: 4, y: 6, fixed: 1 }, people: 3, nb: [[-6, 40, '24', 6], [70, 76, '24', 11], [146, 30, '5', 149]], nbBusy: .5, hop: 1,
      tip: 'A víz és a fém sokat elnyel. A <b>kertbe</b> sokszor kültéri AP kell, a <b>powerline</b> pedig olcsó, de a háztartási gépek zavarják.' },
    { n: 'Nyitott iroda', W: 150, H: 70, budget: 60000, isp: 1000, test: 30, pass: .95,
      intro: '10 munkaállomás, mindegyik <b>80 Mbit/s</b>-ot kér (videókonferencia + felhő). Egy hozzáférési pont nem bírja el mindet: osztozni kell a sávszélességen! Fém polcok és sok szomszéd iroda hálózata.',
      walls: [...rect(0, 0, 150, 70, 'c'), [20, 0, 20, 20, 'c'], [0, 20, 20, 20, 'c'], [60, 14, 60, 56, 'm'], [100, 14, 100, 56, 'm'], [130, 0, 130, 30, 'g'], [130, 40, 130, 70, 'g']],
      rooms: [['Szerver', 10, 8], ['Fejlesztők', 40, 3], ['Értékesítés', 80, 3], ['Ügyfélszolgálat', 115, 3], ['Tárgyaló', 140, 50]],
      devs: [D('desktop', 'Gép 1', 34, 30, 80), D('desktop', 'Gép 2', 46, 50, 80), D('desktop', 'Gép 3', 30, 60, 80), D('desktop', 'Gép 4', 72, 24, 80), D('desktop', 'Gép 5', 86, 46, 80), D('desktop', 'Gép 6', 76, 62, 80), D('desktop', 'Gép 7', 110, 20, 80), D('desktop', 'Gép 8', 120, 50, 80), D('laptop', 'Tárgyaló 1', 140, 22, 80), D('laptop', 'Tárgyaló 2', 142, 60, 80)],
      router: { x: 8, y: 10, fixed: 1 }, people: 4, nb: [[-6, 50, '5', 36], [75, -6, '5', 44], [156, 35, '5', 149], [75, 76, '24', 6]], nbBusy: .7, hop: 1,
      tip: 'Egy hozzáférési pont sávszélességén az összes kliens <b>osztozik</b>. Sok felhasználóhoz több, kábellel bekötött AP kell, okosan elosztva.' },
    { n: 'Régi kastély', W: 160, H: 70, budget: 45000, isp: 500, test: 30, pass: .95, washer: [150, 62], mw: [100, 60], mwP: [6, 10],
      intro: 'Egy kastélyból lett szálloda: <b>méteres kőfalak</b>, amelyeken a WiFi alig jut át. A recepció a ház végében van, a vendégszobák a másikban. Kábel vagy powerline nélkül esélytelen!',
      walls: [...rect(0, 0, 160, 70, 'k'), [40, 0, 40, 30, 'k'], [40, 40, 40, 70, 'k'], [80, 0, 80, 30, 'k'], [80, 40, 80, 70, 'k'], [120, 0, 120, 30, 'k'], [120, 40, 120, 70, 'k'], [0, 35, 18, 35, 'i'], [140, 35, 160, 35, 'i']],
      rooms: [['Recepció', 20, 3], ['Étterem', 60, 3], ['Könyvtár', 100, 3], ['1. szoba', 150, 3], ['2. szoba', 150, 50], ['Lobbi', 20, 50]],
      devs: [D('laptop', 'Recepció', 22, 18), D('tv', 'Étterem TV', 60, 56), D('tablet', 'Könyvtár', 100, 20), D('laptop', 'Vendég 1', 146, 14), D('tv', 'Vendég 2 TV', 150, 58), D('phone', 'Vendég 2', 136, 50), D('desktop', 'Lobbi gép', 10, 58)],
      router: { x: 6, y: 6, fixed: 1 }, people: 3, nb: [], hop: 0,
      tip: 'Vastag falaknál a WiFi helyett a <b>kábel</b> (strukturált hálózat) vagy a <b>powerline</b> viszi a jelet a helyiségekig, és ott egy-egy AP sugároz.' }
  ];

  /* ---- állapot ---- */
  let C, ctx, T = 0, mode = null, lvs = EASY, lv = 0, L, band = '24', ch = 6, aps = [], cables = [], drag = null, tool = 'move', selA = null, wireFrom = null, wirePt = null;
  let ox = 0, oy = 0, sc = 1, state = 'menu', results = [], racing = false, best = 0, totT = 0, test = null, heat = null, dirty = true, rng = Math.random;
  let people = [], nbs = [], mwOn = false, mwT = 0, washOn = false, washT = 0, uid = 0, lastRes = null;
  function seedRng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
  function layout() { const aw = C.W - 350, ah = C.H - 40; sc = Math.min(aw / L.W, ah / L.H); ox = 20 + (aw - L.W * sc) / 2; oy = 20 + (ah - L.H * sc) / 2 }
  const X = u => ox + u * sc, Y = u => oy + u * sc;
  function inter(ax, ay, bx, by, cx, cy, dx, dy) {
    const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx); if (!d) return false;
    const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d, u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
    return t > 0 && t < 1 && u > 0 && u < 1;
  }
  const wallsOn = (ax, ay, bx, by) => L.walls.filter(w => inter(ax, ay, bx, by, w[0], w[1], w[2], w[3]));
  function segDist(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1; let t = ((px - ax) * dx + (py - ay) * dy) / l; t = clamp(t, 0, 1); return Math.hypot(px - ax - t * dx, py - ay - t * dy) }
  const spent = () => aps.reduce((a, x) => a + (ITEMS[x.t] ? ITEMS[x.t].cost : 0), 0) + cables.reduce((a, c) => a + c.cost, 0);
  /* ---- rádió ---- */
  function rx(ap, x, y, withPeople) {
    const A = ATT[band], d = Math.max(.5, Math.hypot(ap.x - x, ap.y - y) * MPU);
    let r = 20 - A.pl - 30 * Math.log10(d) - (ap.t === 'ext' ? 2 : 0);
    for (const w of wallsOn(ap.x, ap.y, x, y)) r -= A[w[4]];
    if (band === '24') {
      if (mwOn && L.mw) { const md = Math.hypot(x - L.mw[0], y - L.mw[1]); if (md < 40) r -= 16 * (1 - md / 40) }
      for (const b of L.bt || []) { const bd = Math.hypot(x - b[0], y - b[1]); if (bd < 28) r -= 6 * (1 - bd / 28) }
    }
    if (withPeople) for (const p of people) if (segDist(p.x, p.y, ap.x, ap.y, x, y) < 3.5) r -= 4;
    return r;
  }
  const bars = r => r > -55 ? 4 : r > -65 ? 3 : r > -72 ? 2 : r > -80 ? 1 : 0;
  // szomszéd hálózatok: ha ugyanazon / átfedő csatornán és forgalmaznak, osztozni kell a rádióidőn
  function chanFactor(ap) {
    let f = 1;
    for (const n of nbs) {
      if (n.band !== band || !n.busy) continue;
      const ov = band === '24' ? Math.abs(n.ch - ch) < 5 : n.ch === ch; if (!ov) continue;
      if (rx({ x: n.x, y: n.y, t: 'nb' }, ap.x, ap.y) < -82) continue;
      f *= n.ch === ch ? .55 : .7;
    }
    return f;
  }
  function links() {
    const R = aps[0]; R.cap = L.isp; R.ok = true; R.up = null;
    aps.slice(1).forEach(a => { a.ok = false; a.cap = 0; a.up = null; a.why = '' });
    for (const a of aps) {
      if (a.t === 'wap') { const c = cables.find(k => k.to === a.id); if (c) { a.ok = true; a.cap = L.isp } else a.why = 'nincs bekötve kábellel' }
      if (a.t === 'plc') { if (L.yard && a.x > L.yard[0]) { a.why = 'kint nincs konnektor'; continue } const dm = Math.hypot(a.x - R.x, a.y - R.y) * MPU * 1.6; a.ok = true; a.cap = Math.round(clamp(170 * (1 - dm / 70), 25, 170) * (washOn ? .3 : 1)) }
    }
    let chg = true; while (chg) {
      chg = false; for (const a of aps) {
        if (a.ok || (a.t !== 'mesh' && a.t !== 'ext')) continue; let bc = 0, bu = null;
        for (const u of aps) { if (!u.ok || u === a) continue; const b = bars(rx(u, a.x, a.y)); if (b < 2) continue; const sp = Math.min(u.cap, SPD[band][b] * chanFactor(u)); if (sp > bc) { bc = sp; bu = u } }
        if (bu) { a.ok = true; a.up = bu; a.cap = bc / (a.t === 'mesh' ? 2 : 3); chg = true } else a.why = 'túl gyenge a jel a routertől';
      }
    }
  }
  // eszközök sebessége: kábel → 940 Mbit/s; WiFi → a legerősebb AP, osztozva a többi klienssel, végül az előfizetésen
  function evalAll(withPeople) {
    links(); const res = L.devs.map((d, i) => ({ i, d, wired: cables.some(c => c.to === 'd' + i) }));
    for (const r of res) {
      if (r.wired) { r.link = 940; r.ap = aps[0]; r.b = 4; continue }
      let best = null, bs = -999; for (const a of aps) { if (!a.ok) continue; const s = rx(a, r.d.x, r.d.y, withPeople); if (s > bs) { bs = s; best = a } }
      r.ap = best; r.b = best ? bars(bs) : 0; r.link = best ? SPD[band][r.b] * chanFactor(best) : 0;
    }
    for (const a of aps) { const cl = res.filter(r => r.ap === a && !r.wired); if (!cl.length) continue; const cap = a.cap * (a === aps[0] ? 1 : 1), dem = cl.reduce((s, r) => s + Math.min(r.d.need * 1.3, r.link), 0); const k = dem > cap ? cap / dem : 1; cl.forEach(r => r.got = Math.min(r.link, r.d.need * 1.3) * k) }
    res.filter(r => r.wired).forEach(r => r.got = r.d.need * 1.3);
    const tot = res.reduce((s, r) => s + (r.got || 0), 0); if (tot > L.isp) res.forEach(r => r.got = (r.got || 0) * L.isp / tot);
    res.forEach(r => { r.got = Math.round(r.got || 0); r.ok = r.got >= r.d.need });
    return res;
  }
  function buildHeat() { links(); const st = 2.5; heat = []; for (let y = 0; y < L.H; y += st) for (let x = 0; x < L.W; x += st) { let m = -999; for (const a of aps) if (a.ok) m = Math.max(m, rx(a, x + st / 2, y + st / 2)); heat.push([x, y, m]) } heat.st = st; dirty = false }
  const col = r => { const t = clamp((r + 85) / 40, 0, 1); return `hsla(${t * 130},95%,55%,${.14 + t * .3})` };
  /* ---- kábel: L alakú útvonal, a kevesebb falfúrással ---- */
  function cablePath(a, b) {
    const opts = [[[a.x, a.y], [b.x, a.y], [b.x, b.y]], [[a.x, a.y], [a.x, b.y], [b.x, b.y]]].map(p => { const w = wallsOn(...p[0], ...p[1]).length + wallsOn(...p[1], ...p[2]).length, len = (Math.abs(b.x - a.x) + Math.abs(b.y - a.y)) * MPU; return { p, w, len, cost: Math.round(len * CABLE_M + w * DRILL) } });
    return opts.sort((x, y) => x.cost - y.cost)[0];
  }
  /* ---- pálya ---- */
  function load(i) {
    lv = i; L = lvs[i]; band = '24'; ch = 6; rng = seedRng(1000 + i * 77 + (mode === 'hard' ? 5 : 0));
    aps = [{ id: 'R', t: 'router', x: L.router.x, y: L.router.y, fixed: !!L.router.fixed }]; cables = []; selA = null; tool = 'move'; test = null; mwOn = false; washOn = false; mwT = 3; washT = 6;
    nbs = (L.nb || []).map(n => ({ x: n[0], y: n[1], band: n[2], ch: n[3], busy: true, t: rng() * 5 }));
    people = Array.from({ length: L.people || 0 }, () => ({ x: 10 + rng() * (L.W - 20) * .8, y: 10 + rng() * (L.H - 20), tx: 0, ty: 0, w: 0 }));
    people.forEach(p => { p.tx = p.x; p.ty = p.y });
    dirty = true; state = 'intro'; side(); showIntro();
  }
  function side() {
    if (!$('#w-lv')) return;
    $('#w-lv').innerHTML = `<span class="w-mode ${mode}">${mode === 'hard' ? 'NEHÉZ' : 'KÖNNYŰ'}</span>` + lvs.map((l, i) => `<span class="${i === lv ? 'on' : results[i] ? 'done' : ''}">${i + 1}</span>`).join('');
    $('#w-title').textContent = `${lv + 1}. pálya: ${L.n}`;
    const left = L.budget - spent();
    $('#w-budget').innerHTML = `<span>Keret</span><b style="color:${left < 0 ? 'var(--red)' : 'var(--green)'}">${left.toLocaleString('hu-HU')} Ft</b><small>/ ${L.budget.toLocaleString('hu-HU')} Ft • előfizetés: ${L.isp} Mbit/s</small>`;
    $$('[data-b]').forEach(x => x.classList.toggle('sel', x.dataset.b === band));
    $('#w-ch').innerHTML = CH[band].map(c => `<button class="btn ${c === ch ? 'sel' : ''}" data-c="${c}">${c}</button>`).join('');
    $$('[data-c]').forEach(b => b.onclick = () => { if (test) return; ch = +b.dataset.c; dirty = true; side(); sfx.click() });
    $('#w-pal').innerHTML = Object.entries(ITEMS).map(([k, v]) => `<button class="w-it" data-it="${k}" ${v.cost > left || test ? 'disabled' : ''}><b>${v.n}</b><span>${v.cost.toLocaleString('hu-HU')} Ft</span><i>${v.d}</i></button>`).join('');
    $$('[data-it]').forEach(b => b.onclick = () => addItem(b.dataset.it));
    $$('[data-tool]').forEach(b => b.classList.toggle('sel', b.dataset.tool === tool));
    const a = selA && aps.find(x => x.id === selA);
    $('#w-sel').innerHTML = a ? `<b>${a.t === 'router' ? 'Router' : ITEMS[a.t].n}</b> ${a.ok === false ? `<span style="color:var(--red)">– ${a.why}</span>` : a.cap ? `– ${Math.round(a.cap)} Mbit/s` : ''}${a.t !== 'router' ? '<button class="btn" id="w-del">Eltávolítás</button>' : ''}` : '<span>Kattints egy eszközre a részletekhez.</span>';
    const del = $('#w-del'); if (del) del.onclick = () => { aps = aps.filter(x => x !== a); cables = cables.filter(c => c.to !== a.id); selA = null; dirty = true; side() };
    $('#w-test').disabled = !!test; $('#w-test').innerHTML = test ? `Teszt folyamatban… ${Math.ceil(L.test - test.t)} mp` : `${icon('play', 16)} Teszt indítása (${L.test} mp)`;
  }
  function addItem(k) {
    if (test) return; if (spent() + ITEMS[k].cost > L.budget) { toast('Nincs rá keret.', '#f87171'); return }
    const a = { id: 'a' + (++uid), t: k, x: L.W * (.35 + .1 * (aps.length % 4)), y: L.H * .5 }; aps.push(a); selA = a.id; dirty = true; sfx.click();
    toast(k === 'wap' ? 'Kábeles AP: húzd a helyére, majd a <b>Kábel</b> eszközzel kösd be a routerbe!' : `${ITEMS[k].n}: húzd a helyére!`, '#5b9dff', 2600); side();
  }
  function overlay(html) { const o = $('#w-ov'); o.innerHTML = `<div class="w-card">${html}</div>`; o.classList.add('show') }
  function hideOv() { $('#w-ov').classList.remove('show') }
  function menu() {
    state = 'menu';
    overlay(`<div class="w-k">WiFi-tervező</div><h2>Válassz nehézséget!</h2>
      <div class="w-diff"><button data-md="easy"><b>Könnyű</b><span>5 pálya • bőséges keret • kevés zavar • 85% megfelelés kell</span></button>
      <button data-md="hard" class="hard"><b>Nehéz</b><span>4 pálya • szűkös keret • szomszéd WiFi-k, mikró, emberek, akvárium, kőfalak • 95% megfelelés kell</span></button></div>`);
    $$('[data-md]').forEach(b => b.onclick = () => { mode = b.dataset.md; lvs = mode === 'hard' ? HARD : EASY; results = []; load(0); if (racing) totT = 0 });
  }
  function showIntro() {
    const z = [L.mw && 'Mikrohullámú sütő', (L.nb || []).length && `${L.nb.length} szomszéd WiFi${L.hop ? ' (csatornát váltanak)' : ''}`, L.people && `${L.people} mozgó ember`, L.bt && 'Babaőrző', L.washer && 'Mosógép (powerline)', L.walls.some(w => w[4] === 'w') && 'Akvárium', L.walls.some(w => w[4] === 'm') && 'Fém tárgyak', L.walls.some(w => w[4] === 'k') && 'Kőfalak'].filter(Boolean);
    overlay(`<div class="w-k">${mode === 'hard' ? 'Nehéz' : 'Könnyű'} • ${lv + 1}. pálya / ${lvs.length}</div><h2>${L.n}</h2><p>${L.intro}</p>
      <div class="w-rules"><span>Keret: ${L.budget.toLocaleString('hu-HU')} Ft</span><span>Előfizetés: ${L.isp} Mbit/s</span><span>${L.router.fixed ? 'A router helye kötött' : 'A router mozgatható'}</span><span>Teszt: ${L.test} mp, ${Math.round(L.pass * 100)}% kell</span></div>
      ${z.length ? `<div class="w-z"><b>Zavaró tényezők:</b> ${z.join(' • ')}</div>` : ''}
      <button class="btn go" id="w-go">Tervezés indítása</button>`);
    $('#w-go').onclick = () => { hideOv(); state = 'play'; sfx.click() };
  }
  function startTest() { if (test || state !== 'play') return; test = { t: 0, ok: 0, tot: 0, worst: {} }; rng = seedRng(2000 + lv * 31 + (mode === 'hard' ? 9 : 0)); selA = null; side(); beep(700, .1, 'triangle', .05) }
  function endTest() {
    const up = test.tot ? test.ok / test.tot : 0, cost = spent(), pass = up >= L.pass, t = test; test = null;
    const st = !pass ? 0 : up >= .99 && cost <= L.budget * .7 ? 3 : up >= .97 || cost <= L.budget * .85 ? 2 : 1;
    const pts = pass ? Math.round(st * 150 + up * 200 + (L.budget - cost) / 100) : 0;
    if (pass) { results[lv] = Math.max(results[lv] || 0, pts); sfx.win(); FX.confetti() } else sfx.bad();
    const worst = Object.entries(t.worst).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([i, v]) => `${L.devs[i].n} (${Math.round(v / t.n * 100)}% ideig lassú)`);
    const last = lv === lvs.length - 1;
    overlay(`<div class="w-k">${pass ? 'Teszt sikeres' : 'Nem sikerült'}</div><h2>${L.n}</h2>
      ${pass ? `<div class="w-stars">${[1, 2, 3].map(i => icon('star', 46, 2).replace('<svg', `<svg class="${i <= st ? 'on' : ''}"`)).join('')}</div>` : ''}
      <div class="w-sc"><div><b>${(up * 100).toFixed(1).replace('.', ',')}%</b>megfelelés (${Math.round(L.pass * 100)}% kell)</div><div><b>${cost.toLocaleString('hu-HU')} Ft</b>költség</div>${pass ? `<div><b>${pts}</b>pont</div>` : ''}</div>
      ${worst.length ? `<p>Leggyengébb pontok: ${worst.join(', ')}</p>` : '<p>Minden eszköz végig elég gyors volt!</p>'}
      ${pass && st < 3 ? '<p style="font-size:14px;color:var(--muted)">3 csillaghoz: 99% fölötti megfelelés, és a keret legfeljebb 70%-ának elköltése.</p>' : ''}
      <div class="learn">${L.tip}</div>
      <div class="w-b"><button class="btn" id="w-re">${pass ? 'Újratervezés' : 'Vissza a tervhez'}</button>${pass ? `<button class="btn go" id="w-nx">${last ? 'Összesítés' : 'Következő pálya'}</button>` : ''}</div>`);
    $('#w-re').onclick = () => { hideOv(); state = 'play'; side() }; const nx = $('#w-nx'); if (nx) nx.onclick = () => last ? final() : load(lv + 1);
    side();
  }
  function final() {
    state = 'final'; const tot = results.reduce((a, b) => a + (b || 0), 0); best = Math.max(best, tot);
    if (racing) { racing = false; hideOv(); Comp.finish(tot, `${mode === 'hard' ? 'Nehéz' : 'Könnyű'} mód, ${lvs.length} pálya, ${Math.round(totT)} mp`); menu(); return }
    overlay(`<div class="w-k">${mode === 'hard' ? 'Nehéz' : 'Könnyű'} mód teljesítve!</div><h2>${tot} pont</h2>
      <div class="w-tbl">${lvs.map((l, i) => `<div><span>${i + 1}. ${l.n}</span><b>${results[i] || 0}</b></div>`).join('')}</div>
      <div class="learn">Ezt csinálja egy hálózattervező: <b>helyszíni felmérés</b>, frekvenciasáv- és <b>csatornatervezés</b>, a zavaró források felderítése, és döntés arról, hol kell <b>kábel</b>, hol elég vezeték nélküli kapcsolat – mindezt a költségkereten belül.</div>
      <div class="w-b"><button class="btn" id="w-mn">Másik nehézség</button><button class="btn go" id="w-again">Újrakezdés</button></div>`);
    $('#w-again').onclick = () => { results = []; load(0) }; $('#w-mn').onclick = menu;
  }
  /* ---- valós idejű környezet ---- */
  function env(dt) {
    if (L.mw) { mwT -= dt; if (mwT <= 0) { mwOn = !mwOn; mwT = mwOn ? L.mwP[0] + rng() * 2 : L.mwP[1] + rng() * 6; dirty = true } }
    if (L.washer) { washT -= dt; if (washT <= 0) { washOn = !washOn; washT = washOn ? 7 + rng() * 4 : 8 + rng() * 6 } }
    for (const n of nbs) { n.t -= dt; if (n.t <= 0) { n.busy = rng() < (L.nbBusy || .5); n.t = 2 + rng() * 4; if (L.hop && rng() < .25) { n.ch = pick(CH[n.band].concat(n.band === '24' ? [3, 9] : [])) } } }
    for (const p of people) { const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy); if (d < 1) { p.w -= dt; if (p.w <= 0) { p.tx = 4 + rng() * ((L.yard ? L.yard[0] : L.W) - 8); p.ty = 4 + rng() * (L.H - 8); p.w = 1 + rng() * 3 } } else { const v = 6 * dt; p.x += dx / d * Math.min(v, d); p.y += dy / d * Math.min(v, d) } }
  }
  /* ---- rajz ---- */
  function draw() {
    const W = C.W, H = C.H; ctx.clearRect(0, 0, W, H); if (!L) return; layout(); if (dirty || !heat) buildHeat();
    if (L.yard) { ctx.fillStyle = '#0f2a1a'; ctx.fillRect(X(L.yard[0]), Y(0), (L.yard[1] - L.yard[0]) * sc, L.H * sc) }
    ctx.fillStyle = '#15171c'; ctx.fillRect(X(0), Y(0), (L.yard ? L.yard[0] : L.W) * sc, L.H * sc);
    const st = heat.st; for (const [x, y, r] of heat) { ctx.fillStyle = col(r); ctx.fillRect(X(x), Y(y), st * sc + .5, st * sc + .5) }
    for (const w of L.walls) {
      const t = w[4], cl = { o: '#f2f3f5', c: '#d4d4d8', b: '#9fd8ff', g: '#67e8f9', w: '#38bdf8', m: '#94a3b8', k: '#a8a29e', i: '#b9c1e8' }[t];
      ctx.strokeStyle = cl; ctx.lineWidth = { o: 7, c: 9, k: 13, m: 6, w: 8, g: 3 }[t] || 4; ctx.lineCap = 'round'; ctx.setLineDash(t === 'b' ? [3, 5] : t === 'g' ? [8, 4] : []);
      ctx.beginPath(); ctx.moveTo(X(w[0]), Y(w[1])); ctx.lineTo(X(w[2]), Y(w[3])); ctx.stroke(); ctx.setLineDash([]);
      if (t === 'w' || t === 'm') { ctx.fillStyle = '#fff'; ctx.font = '600 10px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t === 'w' ? 'akvárium' : 'fém', X((w[0] + w[2]) / 2), Y(w[1]) - 8) }
    }
    ctx.font = '600 13px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffffff88'; L.rooms.forEach(([n, x, y]) => ctx.fillText(n, X(x), Y(y)));
    // kábelek
    for (const c of cables) { ctx.strokeStyle = '#facc15'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath(); c.p.forEach(([x, y], i) => i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))); ctx.stroke(); const m = c.p[1]; tag(`${Math.round(c.len)} m${c.w ? ` • ${c.w} fúrás` : ''}`, X(m[0]), Y(m[1]) - 12, '#facc15') }
    if (wireFrom && wirePt) { ctx.setLineDash([6, 6]); ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(aps[0].x), Y(aps[0].y)); ctx.lineTo(wirePt[0], wirePt[1]); ctx.stroke(); ctx.setLineDash([]) }
    // zavarók
    if (L.mw) { const x = X(L.mw[0]), y = Y(L.mw[1]); Dev.draw(ctx, 'microwave', x, y, 44, { on: mwOn, t: T }); if (mwOn) { ctx.save(); ctx.strokeStyle = band === '24' ? 'rgba(251,146,60,.6)' : 'rgba(251,146,60,.2)'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { const q = (T * 1.2 + k / 3) % 1; ctx.globalAlpha = 1 - q; ctx.beginPath(); ctx.arc(x, y, (8 + q * 32) * sc, 0, 7); ctx.stroke() } ctx.restore(); tag('MIKRÓ BE', x, y - 30, '#fb923c') } }
    for (const b of L.bt || []) { const x = X(b[0]), y = Y(b[1]); ctx.fillStyle = '#c084fc'; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(192,132,252,.4)'; ctx.beginPath(); ctx.arc(x, y, 10 + (T * 20) % 20, 0, 7); ctx.stroke(); tag('babaőrző', x, y - 18, '#c084fc') }
    if (L.washer) { const x = X(L.washer[0]), y = Y(L.washer[1]); ctx.fillStyle = '#e5e7eb'; rrect(ctx, x - 12, y - 12, 24, 24, 5); ctx.fill(); ctx.fillStyle = washOn ? '#38bdf8' : '#475569'; ctx.beginPath(); ctx.arc(x + (washOn ? Math.sin(T * 20) : 0), y + 2, 7, 0, 7); ctx.fill(); if (washOn) tag('mosógép BE', x, y - 22, '#38bdf8') }
    for (const n of nbs) { const x = X(clamp(n.x, 16, L.W - 16)), y = Y(clamp(n.y, -3, L.H + 3)); ctx.globalAlpha = n.busy ? 1 : .45; tag(`szomszéd • ${n.band === '24' ? '2,4' : '5'} GHz • ${n.ch}. cs.`, x, y, n.band === band && (band === '24' ? Math.abs(n.ch - ch) < 5 : n.ch === ch) && n.busy ? '#f87171' : '#94a3b8'); ctx.globalAlpha = 1 }
    for (const p of people) { const x = X(p.x), y = Y(p.y); ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(x, y - 7, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#f59e0b'; rrect(ctx, x - 6, y - 2, 12, 14, 5); ctx.fill() }
    // eszközök
    const res = lastRes || [];
    res.forEach(r => {
      const d = r.d, x = X(d.x), y = Y(d.y), ok = r.ok;
      Dev.draw(ctx, d.dev, x, y, (d.dev === 'tv' ? 54 : 46) * sc / 6.5, { t: T });
      ctx.textBaseline = 'middle'; ctx.fillStyle = ok ? 'rgba(20,83,45,.92)' : 'rgba(127,29,29,.92)'; rrect(ctx, x - 52, y + 15, 104, 34, 8); ctx.fill(); ctx.strokeStyle = ok ? '#4ade80' : '#f87171'; ctx.lineWidth = 1.5; ctx.stroke();
      if (r.wired) { ctx.fillStyle = '#facc15'; ctx.font = '800 10px Inter,sans-serif'; ctx.textAlign = 'left'; ctx.fillText('KÁBEL', x - 46, y + 25) } else for (let k = 0; k < 4; k++) { ctx.fillStyle = k < r.b ? (ok ? '#4ade80' : '#fbbf24') : '#ffffff26'; ctx.fillRect(x - 46 + k * 5, y + 29 - (k + 1) * 3, 3.5, (k + 1) * 3) }
      ctx.font = '700 12px Inter,sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(r.got ? `${r.got} Mbit/s` : 'nincs net', x - 14, y + 25);
      ctx.font = '500 10px Inter,sans-serif'; ctx.fillStyle = '#ffffffb0'; ctx.fillText(`kell: ${d.need} • ${d.n}`, x - 46, y + 41); ctx.textAlign = 'center';
    });
    aps.forEach(a => {
      const x = X(a.x), y = Y(a.y);
      if (a.ok) { const p = (T * 1.4) % 1; for (let k = 0; k < 2; k++) { const q = (p + k / 2) % 1; ctx.beginPath(); ctx.arc(x, y, 8 + q * 60, 0, 7); ctx.strokeStyle = `rgba(91,157,255,${.4 * (1 - q)})`; ctx.lineWidth = 2; ctx.stroke() } }
      if (a.up) { ctx.setLineDash([5, 6]); ctx.lineDashOffset = -T * 30; ctx.strokeStyle = 'rgba(91,157,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(a.up.x), Y(a.up.y)); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]) }
      if (a.t === 'router') Dev.draw(ctx, 'router', x, y, 60, { t: T });
      else if (a.t === 'plc') { ctx.fillStyle = '#f1f5f9'; rrect(ctx, x - 11, y - 15, 22, 30, 5); ctx.fill(); ctx.fillStyle = a.ok ? '#22c55e' : '#ef4444'; ctx.beginPath(); ctx.arc(x, y - 7, 3, 0, 7); ctx.fill(); ctx.fillStyle = '#94a3b8'; ctx.fillRect(x - 5, y + 3, 3, 7); ctx.fillRect(x + 2, y + 3, 3, 7) }
      else Dev.draw(ctx, 'ap', x, y, a.t === 'ext' ? 36 : 46, { t: T });
      if (selA === a.id) { ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(x, y, 30, 0, 7); ctx.stroke(); ctx.setLineDash([]) }
      const lab = a.t === 'router' ? (a.fixed ? 'Router (rögzítve)' : 'Router – húzd!') : `${ITEMS[a.t].n}${a.ok ? ` • ${Math.round(a.cap)} Mbit/s` : ' • NEM MŰKÖDIK'}`;
      tag(lab, x, y + 32, a.ok === false ? '#f87171' : '#e5e7eb');
    });
    if (test) { const p = test.t / L.test, up = test.tot ? test.ok / test.tot : 1; ctx.fillStyle = 'rgba(11,12,15,.9)'; rrect(ctx, X(0), Y(0) - 0, 260, 44, 10); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = '700 13px Inter,sans-serif'; ctx.fillText(`Teszt: ${Math.ceil(L.test - test.t)} mp • megfelelés ${(up * 100).toFixed(1)}%`, X(0) + 12, Y(0) + 15); ctx.fillStyle = '#262a33'; ctx.fillRect(X(0) + 12, Y(0) + 28, 236, 6); ctx.fillStyle = up >= L.pass ? '#4ade80' : '#f87171'; ctx.fillRect(X(0) + 12, Y(0) + 28, 236 * p, 6) }
  }
  function tag(t, x, y, c) { ctx.font = '600 11px Inter,sans-serif'; const w = ctx.measureText(t).width + 12; ctx.fillStyle = 'rgba(11,12,15,.9)'; rrect(ctx, x - w / 2, y - 9, w, 18, 6); ctx.fill(); ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = c; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y) }
  const hitAp = (mx, my) => [...aps].reverse().find(a => Math.hypot(mx - X(a.x), my - Y(a.y)) < 28);
  const hitDev = (mx, my) => L.devs.findIndex(d => Math.hypot(mx - X(d.x), my - Y(d.y)) < 26);
  S.build = root => {
    root.innerHTML = `<style>
      #w-side{position:absolute;top:12px;right:12px;width:320px;bottom:12px;overflow:auto;font-size:14px;line-height:1.4;z-index:2;display:flex;flex-direction:column;gap:9px}
      #w-side h4{margin:4px 0 0;font-size:11.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
      #w-side .row{display:flex;gap:5px}#w-side .row .btn{flex:1;padding:7px 4px;font-size:14px;height:36px}
      #w-lv{display:flex;gap:5px;align-items:center}#w-lv span{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-weight:700;border:1px solid var(--line2);color:var(--muted);font-size:12px}
      #w-lv span.on{background:var(--accent);color:#0b0c0f;border-color:var(--accent)}#w-lv span.done{border-color:var(--green);color:var(--green)}
      #w-lv .w-mode{width:auto;border-radius:999px;padding:0 9px;font-size:11px;letter-spacing:.06em;border-color:var(--green);color:var(--green)}#w-lv .w-mode.hard{border-color:var(--red);color:var(--red)}
      #w-title{font-size:17px;font-weight:800}
      #w-budget{background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:8px 12px}#w-budget span{display:block;font-size:11px;color:var(--muted);text-transform:uppercase}#w-budget b{font-size:22px}#w-budget small{display:block;color:var(--muted);font-size:12px}
      #w-pal{display:grid;grid-template-columns:1fr 1fr;gap:6px}
      .w-it{all:unset;cursor:pointer;background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:7px 9px;display:flex;flex-direction:column;gap:2px}.w-it:hover{border-color:var(--accent)}.w-it[disabled]{opacity:.4;cursor:not-allowed}
      .w-it b{font-size:13.5px}.w-it span{font-size:12px;color:var(--green);font-weight:700}.w-it i{font-style:normal;font-size:11px;color:var(--muted);line-height:1.3}
      #w-sel{font-size:13px;color:#c9ccd3;background:var(--bg2);border-radius:10px;padding:7px 10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}#w-sel .btn{height:28px;font-size:12px;padding:0 10px;margin-left:auto}
      #w-test{height:46px!important;font-size:16px!important}
      .w-leg{height:10px;border-radius:5px;background:linear-gradient(90deg,hsla(0,95%,55%,.6),hsla(65,95%,55%,.6),hsla(130,95%,55%,.7))}
      #w-ov{position:absolute;inset:0;z-index:5;display:none;place-items:center;background:rgba(6,7,9,.6);backdrop-filter:blur(4px)}#w-ov.show{display:grid}
      .w-card{width:min(600px,92%);background:var(--panel);border:1px solid var(--line2);border-radius:22px;padding:26px 28px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.5)}
      .w-card h2{margin:4px 0 10px;font-size:30px;letter-spacing:-.03em}.w-card p{color:#c9ccd3;font-size:15.5px}
      .w-k{font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
      .w-rules{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:12px 0}.w-rules span{font-size:13px;border:1px solid var(--line2);border-radius:999px;padding:4px 10px;color:#c9ccd3}
      .w-z{font-size:14px;color:#fca5a5;background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.3);border-radius:10px;padding:8px 12px;margin-bottom:14px}
      .w-diff{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.w-diff button{all:unset;cursor:pointer;border:2px solid var(--green);border-radius:16px;padding:18px;text-align:left;background:rgba(74,222,128,.06)}
      .w-diff button.hard{border-color:var(--red);background:rgba(248,113,113,.06)}.w-diff b{display:block;font-size:22px;margin-bottom:6px}.w-diff span{font-size:13.5px;color:#c9ccd3;line-height:1.4}.w-diff button:hover{transform:translateY(-2px)}
      .w-stars{display:flex;justify-content:center;gap:10px;margin:8px 0}.w-stars svg{color:#3a3f4a}.w-stars svg.on{color:var(--yellow);fill:var(--yellow)}
      .w-sc{display:flex;justify-content:center;gap:10px;margin:10px 0;flex-wrap:wrap}.w-sc div{background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:8px 14px;font-size:12px;color:var(--muted)}.w-sc b{display:block;font-size:21px;color:var(--text)}
      .w-b{display:flex;gap:10px;justify-content:center;margin-top:14px}.w-b .btn{height:46px;padding:0 20px}
      .w-tbl{margin:12px 0;text-align:left}.w-tbl div{display:flex;justify-content:space-between;padding:6px 4px;border-bottom:1px solid var(--line)}
      #st-wifi canvas{cursor:grab}
    </style>
    <div class="panel" id="w-side">
      <div id="w-lv"></div><div id="w-title"></div><div id="w-budget"></div>
      <h4>Frekvenciasáv és csatorna</h4><div class="row"><button class="btn sel" data-b="24">2,4 GHz</button><button class="btn" data-b="5">5 GHz</button></div><div class="row" id="w-ch"></div>
      <h4>Eszközök vásárlása</h4><div id="w-pal"></div>
      <h4>Szerszám</h4><div class="row"><button class="btn sel" data-tool="move">Mozgatás</button><button class="btn" data-tool="wire">Kábel húzása</button></div>
      <div id="w-sel"></div>
      <button class="btn go" id="w-test"></button>
      <div><div class="w-leg"></div><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted)"><span>gyenge jel</span><span>erős jel</span></div></div>
      <div class="learn" style="margin-top:0;font-size:12.5px"><b>Kábel</b> a routertől: közvetlenül egy eszközhöz (biztos 940 Mbit/s) vagy egy kábeles AP-hoz. Ára: ${CABLE_M} Ft/m + ${DRILL} Ft falfúrásonként. A teszt alatt a zavarok <b>élőben</b> hatnak!</div>
    </div><div id="w-ov"></div>`;
    C = makeCanvas(root); ctx = C.ctx;
    $$('[data-b]', root).forEach(b => b.onclick = () => { if (test) return; band = b.dataset.b; ch = CH[band][band === '24' ? 1 : 0]; dirty = true; side(); sfx.click() });
    $$('[data-tool]', root).forEach(b => b.onclick = () => { tool = b.dataset.tool; side(); if (tool === 'wire') toast('Kattints egy eszközre vagy kábeles AP-ra: kábelt húzok hozzá a routertől. Újra kattintva eltávolítod.', '#facc15', 3200) });
    $('#w-test').onclick = startTest;
    const pos = e => { const r = C.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] };
    C.cv.addEventListener('pointerdown', e => {
      if (state !== 'play' || test) return; const [mx, my] = pos(e);
      if (tool === 'wire') {
        const a = hitAp(mx, my), di = hitDev(mx, my); const target = a && a.t === 'wap' ? { id: a.id, x: a.x, y: a.y } : di >= 0 ? { id: 'd' + di, x: L.devs[di].x, y: L.devs[di].y } : null;
        if (!target) { if (a && a.t !== 'router') toast('Kábelt kábeles AP-hoz vagy közvetlenül eszközhöz lehet húzni.', '#fbbf24'); return }
        const ex = cables.find(c => c.to === target.id); if (ex) { cables = cables.filter(c => c !== ex); dirty = true; side(); sfx.click(); return }
        const p = cablePath(aps[0], target); if (p.len > 100) { toast('Az Ethernet-kábel legfeljebb 100 m lehet!', '#f87171'); return }
        if (spent() + p.cost > L.budget) { toast(`Erre a kábelre nincs keret (${p.cost.toLocaleString('hu-HU')} Ft).`, '#f87171'); return }
        cables.push({ to: target.id, p: p.p, len: p.len, w: p.w, cost: p.cost }); dirty = true; beep(900, .08, 'triangle', .05); toast(`Kábel: ${Math.round(p.len)} m, ${p.w} falfúrás • ${p.cost.toLocaleString('hu-HU')} Ft`, '#facc15', 2200); side(); return;
      }
      const a = hitAp(mx, my); if (a) { selA = a.id; side(); if (!a.fixed) { drag = a; C.cv.setPointerCapture(e.pointerId) } }
    });
    C.cv.addEventListener('pointermove', e => { if (!drag) return; const [mx, my] = pos(e); drag.x = clamp((mx - ox) / sc, 1, L.W - 1); drag.y = clamp((my - oy) / sc, 1, L.H - 1); if (drag.t === 'router') cables.forEach(c => { const t = c.to[0] === 'd' ? L.devs[+c.to.slice(1)] : aps.find(x => x.id === c.to); if (t) Object.assign(c, cablePath(drag, t)) }); else cables.filter(c => c.to === drag.id).forEach(c => Object.assign(c, cablePath(aps[0], drag))); dirty = true });
    C.cv.addEventListener('pointerup', () => { if (drag) { beep(800, .05, 'triangle', .04); side() } drag = null });
    L = EASY[0]; menu();
  };
  S.enter = () => { racing = false; S.resize() };
  S.resize = () => { if (C) { C.resize(); dirty = true } };
  let acc = 0;
  S.tick = dt => {
    T += dt; if (!L || !aps.length) { if (C) ctx.clearRect(0, 0, C.W, C.H); return }
    if (state === 'play' || state === 'intro') env(dt);
    acc += dt; if (acc > .1) { acc = 0; lastRes = evalAll(true) }
    if (dirty) heat = null;
    if (test) {
      test.t += dt; test.n = (test.n || 0) + 1; for (const r of lastRes) { test.tot++; if (r.ok) test.ok++; else test.worst[r.i] = (test.worst[r.i] || 0) + 1 }
      if (test.t >= L.test) endTest(); else if (Math.random() < .1) side();
    }
    if (racing && state === 'play') totT += dt;
    draw();
  };
  S.leave = () => { racing = false; test = null };
  S.comp = { rules: 'Válassz nehézséget, és tervezd meg az összes pálya hálózatát! Pont jár a megfelelésért, a csillagokért és a megspórolt keretért. Az összpontszám kerül a ranglistára.', start: () => { racing = true; totT = 0; results = []; menu() } };
  S.score = () => results.reduce((a, b) => a + (b || 0), 0) || best;
  // teszteléshez: gyors szimuláció
  S._dbg = {
    EASY, HARD, setMode: m => { mode = m; lvs = m === 'hard' ? HARD : EASY }, load: i => { load(i); hideOv(); state = 'play' }, get L() { return L },
    setup: o => { band = o.band || band; ch = o.ch || ch; (o.items || []).forEach(([t, x, y]) => aps.push({ id: 'a' + (++uid), t, x, y })); if (o.router) Object.assign(aps[0], o.router); (o.cables || []).forEach(k => { const tg = typeof k === 'number' ? { id: 'd' + k, ...L.devs[k] } : aps.find(a => a.t === 'wap' && Math.abs(a.x - k[0]) < .1 && Math.abs(a.y - k[1]) < .1); const p = cablePath(aps[0], tg); cables.push({ to: tg.id, p: p.p, len: p.len, w: p.w, cost: p.cost }) }); dirty = true },
    sim: secs => { startTest(); const dt = 1 / 30; let k = 0; while (test && k < secs * 30 + 5) { env(dt); lastRes = evalAll(true); test.t += dt; test.n = (test.n || 0) + 1; for (const r of lastRes) { test.tot++; if (r.ok) test.ok++; else test.worst[r.i] = (test.worst[r.i] || 0) + 1 } if (test.t >= L.test) { const up = test.ok / test.tot, w = { ...test.worst }, n = test.n; test = null; hideOv(); return { up, cost: spent(), budget: L.budget, worst: Object.entries(w).map(([i, v]) => L.devs[i].n + ':' + Math.round(v / n * 100) + '%').join(' ') } } k++ } },
    clear: () => { aps = aps.slice(0, 1); cables = []; dirty = true }
  };
  return S;
})());
