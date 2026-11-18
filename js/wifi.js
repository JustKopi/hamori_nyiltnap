/* ===== 4. WiFi-tervező: pályák, lefedettség, sávok, mesh ===== */
App.add((() => {
  const S = {
    id: 'wifi', icon: '', title: 'WiFi-tervező', color: '#2dd4bf',
    desc: '5 egyre nehezebb pálya: helyezd el a routert és a mesh-pontokat úgy, hogy minden eszköz elég gyors netet kapjon!',
    topic: 'Vezeték nélküli hálózatok, 802.11 szabványok, frekvenciasávok, lefedettség'
  };
  const MPU = .2; // 1 egység = 20 cm
  // falcsillapítás dB-ben sávonként: o = külső fal, i = belső fal, b = fürdő (csempe, víz), c = beton/vasbeton, g = üvegfal
  const ATT = { '24': { o: 10, i: 5, b: 12, c: 15, g: 3, pl: 40 }, '5': { o: 15, i: 8, b: 18, c: 24, g: 5, pl: 46.4 } };
  const SPD = { '24': [0, 7, 36, 90, 144], '5': [0, 40, 200, 520, 866] }; // Mbit/s csíkonként (kb. 802.11n / ac)
  const NEED = { tv: [25, '4K film'], fridge: [2, 'okoshűtő'], speaker: [2, 'zene'], console: [100, 'online játék + letöltés'], phone: [20, 'videóhívás'], laptop: [50, 'tanulás, videó'], camera: [8, 'HD kamerakép'], desktop: [50, 'munka'] };
  const rect = (x0, y0, x1, y1, t = 'o') => [[x0, y0, x1, y0, t], [x1, y0, x1, y1, t], [x1, y1, x0, y1, t], [x0, y1, x0, y0, t]];
  const D = (dev, n, x, y, need) => ({ dev, n, x, y, need: need ?? NEED[dev][0], s: dev === 'tv' ? 56 : dev === 'fridge' ? 48 : 48 });
  const LV = [
    {
      n: 'Garzonlakás', W: 80, H: 45, yard: null,
      intro: 'Egy kis lakás, egy router. Húzd a routert olyan helyre, ahonnan minden eszköz elég gyors netet kap!',
      walls: [...rect(0, 0, 80, 45), [48, 0, 48, 28, 'i'], [0, 30, 14, 30, 'b'], [22, 30, 22, 45, 'b'], [20, 30, 22, 30, 'b']],
      rooms: [['Szoba', 24, 3], ['Háló', 64, 3], ['Fürdő', 9, 34]],
      devs: [D('tv', 'Okostévé', 30, 38), D('laptop', 'Laptop', 70, 10), D('phone', 'Telefon', 66, 38)],
      router: { x: 4, y: 40, fixed: false }, mesh: 0, ideal: 0, micro: 'none',
      tip: 'A router ideális helye a lakás <b>közepe</b>, magasan, nem a sarokban és nem szekrényben.'
    },
    {
      n: 'Családi ház', W: 118, H: 60, yard: [100, 118],
      intro: 'Nagyobb ház, kerttel. A kamera kint van, a konzolnak 100 Mbit/s kell. Egy mesh-pontot is használhatsz.',
      walls: [...rect(0, 0, 100, 60), [40, 0, 40, 25, 'i'], [40, 32, 40, 60, 'i'], [70, 0, 70, 40, 'i'], [70, 47, 70, 60, 'i'], [0, 30, 15, 30, 'i'], [22, 30, 40, 30, 'i'], [70, 25, 80, 25, 'i'], [87, 25, 100, 25, 'i'], [40, 42, 50, 42, 'b'], [56, 42, 70, 42, 'b']],
      rooms: [['Nappali', 20, 4], ['Konyha', 20, 34], ['Előszoba', 55, 4], ['Fürdő', 55, 45], ['Gyerekszoba', 85, 4], ['Hálószoba', 85, 29], ['Kert', 109, 4]],
      devs: [D('tv', 'Okostévé', 10, 14), D('fridge', 'Okoshűtő', 8, 50), D('speaker', 'Hangszóró', 62, 53), D('console', 'Konzol', 92, 10), D('phone', 'Telefon', 92, 51), D('laptop', 'Laptop', 30, 22), D('camera', 'Kamera', 111, 40)],
      router: { x: 6, y: 6, fixed: false }, mesh: 1, ideal: 0, micro: 'opt',
      tip: 'A mesh-pontnak is kell jó jel a routertől, különben nincs mit továbbadnia. Félúton a jó helye.'
    },
    {
      n: 'A router a bejáratnál', W: 140, H: 50, yard: null,
      intro: 'A szolgáltató a bejárati ajtónál vezette be az optikai kábelt, ezért a router <b>nem mozdítható</b>. Hosszú ház, a végén a konzol és a laptop gyors netet kér.',
      walls: [...rect(0, 0, 140, 50), [30, 0, 30, 20, 'i'], [30, 28, 30, 50, 'i'], [62, 0, 62, 30, 'i'], [62, 38, 62, 50, 'i'], [62, 30, 80, 30, 'b'], [80, 30, 80, 50, 'b'], [100, 0, 100, 22, 'i'], [100, 30, 100, 50, 'i'], [100, 26, 120, 26, 'i'], [128, 26, 140, 26, 'i']],
      rooms: [['Előszoba', 15, 3], ['Nappali', 46, 3], ['Konyha', 81, 3], ['Fürdő', 71, 40], ['Dolgozó', 120, 3], ['Gyerekszoba', 120, 30]],
      devs: [D('tv', 'Okostévé', 50, 44), D('speaker', 'Hangszóró', 90, 18), D('laptop', 'Laptop', 132, 12), D('console', 'Konzol', 126, 44), D('phone', 'Telefon', 108, 40)],
      router: { x: 4, y: 25, fixed: true }, mesh: 2, ideal: 1, micro: 'none',
      tip: 'Ha a router helye kötött, <b>mesh-pontokkal</b> vagy kábeles hozzáférési ponttal lehet a jelet továbbvinni.'
    },
    {
      n: 'Zavarok mindenhol', W: 130, H: 60, yard: [104, 130],
      intro: 'Társasházi lakás: a szomszédok WiFi-je és a mikró is zavarja a 2,4 GHz-et, a falak betonból vannak. A kertben levő kamerának is kell jel.',
      walls: [...rect(0, 0, 104, 60, 'c'), [36, 0, 36, 24, 'c'], [36, 32, 36, 60, 'c'], [70, 0, 70, 38, 'i'], [70, 46, 70, 60, 'i'], [0, 34, 22, 34, 'i'], [28, 34, 36, 34, 'i'], [70, 30, 82, 30, 'b'], [90, 30, 104, 30, 'b']],
      rooms: [['Konyha', 18, 3], ['Nappali', 53, 3], ['Háló', 87, 3], ['Fürdő', 87, 46], ['Szoba', 18, 46], ['Kert', 117, 3]],
      devs: [D('fridge', 'Okoshűtő', 8, 12), D('tv', 'Okostévé', 60, 52), D('console', 'Konzol', 46, 10), D('laptop', 'Laptop', 18, 52), D('phone', 'Telefon', 94, 14), D('camera', 'Kamera', 122, 50)],
      router: { x: 52, y: 30, fixed: false }, mesh: 2, ideal: 1, micro: 'on', noise24: 8,
      tip: 'Zsúfolt környezetben az <b>5 GHz</b> sokkal tisztább, de a beton nagyon elnyeli. Ilyenkor kell több hozzáférési pont.'
    },
    {
      n: 'Irodaház', W: 150, H: 70, yard: null,
      intro: 'Egy cég irodája: a router a szerverszobában, vasbeton falak, nyolc munkaállomás és tárgyaló. Minden gépnek 50 Mbit/s kell, és a lehető legkevesebb hozzáférési pontból kell megoldani.',
      walls: [...rect(0, 0, 150, 70, 'c'), [22, 0, 22, 22, 'c'], [0, 22, 22, 22, 'c'], [50, 0, 50, 26, 'g'], [50, 34, 50, 70, 'g'], [100, 0, 100, 26, 'c'], [100, 34, 100, 70, 'c'], [100, 40, 150, 40, 'g'], [22, 40, 50, 40, 'i']],
      rooms: [['Szerver', 11, 8], ['Nyitott iroda', 75, 3], ['Tárgyaló', 125, 3], ['Vezetői', 125, 50], ['Iroda', 36, 50]],
      devs: [D('desktop', 'Gép 1', 60, 12), D('desktop', 'Gép 2', 88, 12), D('desktop', 'Gép 3', 60, 58), D('desktop', 'Gép 4', 88, 58), D('laptop', 'Tárgyaló', 125, 20), D('laptop', 'Vezető', 135, 58), D('desktop', 'Gép 5', 30, 58), D('phone', 'Telefon', 114, 52)],
      router: { x: 8, y: 14, fixed: true }, mesh: 3, ideal: 2, micro: 'none',
      tip: 'Irodában a hozzáférési pontokat <b>kábellel</b> (PoE) kötik a hálózatra, és a mennyezetre szerelik. A jó terv kevés eszközzel fed le mindent.'
    }
  ];

  let C, ctx, lv = 0, L = LV[0], band = '24', aps = [], micro = false, drag = null, dirty = true, heat = null, T = 0;
  let ox = 0, oy = 0, sc = 1, lvT = 0, okT = 0, state = 'intro', results = [], racing = false, best = 0, totT = 0;
  function layout() { const aw = C.W - 340, ah = C.H - 40; sc = Math.min(aw / L.W, ah / L.H); ox = 20 + (aw - L.W * sc) / 2; oy = 20 + (ah - L.H * sc) / 2 }
  const X = u => ox + u * sc, Y = u => oy + u * sc;
  function inter(ax, ay, bx, by, cx, cy, dx, dy) {
    const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx); if (!d) return false;
    const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d, u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
    return t > 0 && t < 1 && u > 0 && u < 1;
  }
  function rssiFrom(ap, x, y) {
    const A = ATT[band], d = Math.max(.5, Math.hypot(ap.x - x, ap.y - y) * MPU);
    let r = 20 - A.pl - 30 * Math.log10(d);
    for (const w of L.walls) if (inter(ap.x, ap.y, x, y, w[0], w[1], w[2], w[3])) r -= A[w[4]];
    if (band === '24') { if (micro && Math.hypot(x - L.mw[0], y - L.mw[1]) < 45) r -= 9; r -= L.noise24 || 0 }
    return r;
  }
  const bars = r => r > -55 ? 4 : r > -65 ? 3 : r > -72 ? 2 : r > -80 ? 1 : 0;
  // Mesh: a pont a routertől (vagy egy már bekötött ponttól) kapja a jelet; ennek a fele marad a klienseknek
  function links() {
    const R = aps[0]; R.cap = 1000; R.up = null; R.ok = true;
    const rest = aps.slice(1); rest.forEach(a => { a.ok = false; a.cap = 0; a.up = null });
    let ch = true; while (ch) {
      ch = false; for (const a of rest) {
        if (a.ok) continue; let bestC = 0, bu = null;
        for (const u of aps) { if (!u.ok || u === a) continue; const sp = Math.min(u.cap, SPD[band][bars(rssiFrom(u, a.x, a.y))]); if (bars(rssiFrom(u, a.x, a.y)) >= 2 && sp > bestC) { bestC = sp; bu = u } }
        if (bu) { a.ok = true; a.up = bu; a.cap = bestC / 2; ch = true }
      }
    }
  }
  function speedAt(x, y) { let b = 0, s = 0; for (const a of aps) { if (!a.ok) continue; const bb = bars(rssiFrom(a, x, y)), sp = Math.min(SPD[band][bb], a.cap); if (sp > s) { s = sp; b = bb } } return [Math.round(s), b] }
  const rssi = (x, y) => Math.max(...aps.filter(a => a.ok).map(a => rssiFrom(a, x, y)));
  function buildHeat() { links(); const st = 2; heat = []; for (let y = 0; y < L.H; y += st) for (let x = 0; x < L.W; x += st) heat.push([x, y, rssi(x + 1, y + 1)]); dirty = false }
  function col(r) { const t = clamp((r + 85) / 40, 0, 1); return `hsla(${t * 130},95%,55%,${.16 + t * .32})` }

  function load(i) {
    lv = i; L = LV[i]; L.mw = L.mw || [L.W * .3, L.H * .85]; band = '24'; micro = L.micro === 'on';
    aps = [{ x: L.router.x, y: L.router.y, dev: 'router', n: 'Router', fixed: L.router.fixed }];
    dirty = true; lvT = 0; okT = 0; state = 'intro'; side(); showIntro();
  }
  function side() {
    $('#w-lv').innerHTML = LV.map((l, i) => `<span class="${i === lv ? 'on' : results[i] ? 'done' : ''}">${i + 1}</span>`).join('');
    $('#w-title').textContent = `${lv + 1}. pálya: ${L.n}`; $('#w-intro').innerHTML = L.intro;
    $$('[data-b]').forEach(x => x.classList.toggle('sel', x.dataset.b === band));
    $('#w-mesh').style.display = L.mesh ? '' : 'none'; $('#w-mesh').textContent = `Mesh-pont hozzáadása (${aps.length - 1}/${L.mesh})`; $('#w-mesh').disabled = aps.length - 1 >= L.mesh;
    $('#w-meshrm').style.display = aps.length > 1 ? '' : 'none';
    $('#w-micro').style.display = L.micro === 'opt' ? '' : 'none'; $('#w-micro').textContent = micro ? 'Mikrohullámú sütő KI' : 'Mikrohullámú sütő BE';
  }
  function overlay(html) { const o = $('#w-ov'); o.innerHTML = `<div class="w-card">${html}</div>`; o.classList.add('show'); return o }
  function hideOv() { $('#w-ov').classList.remove('show') }
  function showIntro() {
    overlay(`<div class="w-k">${lv + 1}. pálya / ${LV.length}</div><h2>${L.n}</h2><p>${L.intro}</p>
      <div class="w-rules">${L.router.fixed ? '<span>A router helye kötött</span>' : '<span>A router mozgatható</span>'}<span>Mesh-pont: max. ${L.mesh}</span>${L.micro === 'on' ? '<span>Mikró működik</span>' : ''}${L.noise24 ? '<span>Szomszéd WiFi-k zavarnak</span>' : ''}</div>
      <button class="btn go" id="w-go">Kezdés</button>`);
    $('#w-go').onclick = () => { hideOv(); state = 'play'; sfx.click() };
  }
  function stars() { const m = aps.length - 1; return m <= L.ideal ? 3 : m <= L.ideal + 1 ? 2 : 1 }
  function levelDone() {
    state = 'done'; const st = stars(), tb = Math.max(0, Math.round(90 - lvT)), pts = st * 100 + tb * 2;
    results[lv] = Math.max(results[lv] || 0, pts); sfx.win(); FX.confetti();
    const last = lv === LV.length - 1;
    overlay(`<div class="w-k">Pálya teljesítve</div><h2>${L.n}</h2><div class="w-stars">${[1, 2, 3].map(i => icon('star', 46, 2).replace('<svg', `<svg class="${i <= st ? 'on' : ''}"`)).join('')}</div>
      <div class="w-sc"><div><b>${st * 100}</b>csillag</div><div><b>+${tb * 2}</b>időbónusz (${Math.round(lvT)} mp)</div><div><b>${pts}</b>pont</div></div>
      <p>${st < 3 ? `Kevesebb mesh-ponttal (${L.ideal}) is megoldható, az 3 csillagot ér.` : 'Tökéletes, ennél kevesebb eszközből nem megy!'}</p>
      <div class="learn">${L.tip}</div>
      <div class="w-b"><button class="btn" id="w-re">Újra</button><button class="btn go" id="w-nx">${last ? 'Összesítés' : 'Következő pálya'}</button></div>`);
    $('#w-re').onclick = () => load(lv); $('#w-nx').onclick = () => last ? final() : load(lv + 1);
  }
  function final() {
    state = 'final'; const tot = results.reduce((a, b) => a + (b || 0), 0); best = Math.max(best, tot);
    if (racing) { racing = false; hideOv(); Comp.finish(tot, `${LV.length} pálya, összesen ${Math.round(totT)} másodperc`); load(0); return }
    overlay(`<div class="w-k">Minden pálya kész!</div><h2>${tot} pont</h2>
      <div class="w-tbl">${LV.map((l, i) => `<div><span>${i + 1}. ${l.n}</span><b>${results[i] || 0}</b></div>`).join('')}</div>
      <div class="learn">Ezt csinálja egy hálózattervező: <b>lefedettségi mérést</b> végez, kiválasztja a frekvenciasávot, és a lehető legkevesebb hozzáférési ponttal fedi le az épületet. A képzésben nagyvállalati WiFi-hálózatokat is terveznek és konfigurálnak.</div>
      <div class="w-b"><button class="btn go" id="w-again">Újrakezdés</button></div>`);
    $('#w-again').onclick = () => { results = []; load(0) };
  }

  function draw() {
    const W = C.W, H = C.H; ctx.clearRect(0, 0, W, H); layout(); if (dirty) buildHeat();
    if (L.yard) { ctx.fillStyle = '#0f2a1a'; ctx.fillRect(X(L.yard[0]), Y(0), (L.yard[1] - L.yard[0]) * sc, L.H * sc) }
    ctx.fillStyle = '#15171c'; ctx.fillRect(X(0), Y(0), (L.yard ? L.yard[0] : L.W) * sc, L.H * sc);
    for (const [x, y, r] of heat) { ctx.fillStyle = col(r); ctx.fillRect(X(x), Y(y), 2 * sc + .5, 2 * sc + .5) }
    for (const w of L.walls) {
      const t = w[4]; ctx.strokeStyle = t === 'o' ? '#f2f3f5' : t === 'c' ? '#d4d4d8' : t === 'b' ? '#9fd8ff' : t === 'g' ? '#67e8f9' : '#b9c1e8';
      ctx.lineWidth = t === 'o' ? 7 : t === 'c' ? 9 : t === 'b' ? 6 : t === 'g' ? 3 : 4; ctx.lineCap = 'round'; if (t === 'b' || t === 'g') ctx.setLineDash(t === 'g' ? [8, 4] : [3, 5]);
      ctx.beginPath(); ctx.moveTo(X(w[0]), Y(w[1])); ctx.lineTo(X(w[2]), Y(w[3])); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.font = '600 13px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffffff99';
    L.rooms.forEach(([n, x, y]) => ctx.fillText(n, X(x), Y(y)));
    // mesh-kapcsolatok
    aps.slice(1).forEach(a => {
      const u = a.up; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -T * 30; ctx.lineWidth = 2.5;
      if (u) { ctx.strokeStyle = 'rgba(91,157,255,.8)'; ctx.beginPath(); ctx.moveTo(X(u.x), Y(u.y)); ctx.lineTo(X(a.x), Y(a.y)); ctx.stroke() }
      ctx.setLineDash([]);
    });
    let allOk = true;
    if (L.micro !== 'none') Dev.draw(ctx, 'microwave', X(L.mw[0]), Y(L.mw[1]), 50, { on: micro, t: T });
    if (micro && band === '24') { ctx.save(); ctx.strokeStyle = 'rgba(251,146,60,.5)'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { const q = (T * 1.2 + k / 3) % 1; ctx.globalAlpha = 1 - q; ctx.beginPath(); ctx.arc(X(L.mw[0]), Y(L.mw[1]), 20 + q * 70, 0, 7); ctx.stroke() } ctx.restore() }
    L.devs.forEach(d => {
      const [sp, b] = speedAt(d.x, d.y), ok = sp >= d.need; if (!ok) allOk = false;
      const x = X(d.x), y = Y(d.y);
      Dev.draw(ctx, d.dev, x, y, d.s * sc / 6.5, { t: T });
      ctx.textBaseline = 'middle'; ctx.fillStyle = ok ? 'rgba(20,83,45,.92)' : 'rgba(127,29,29,.92)'; rrect(ctx, x - 50, y + 16, 100, 34, 8); ctx.fill();
      ctx.strokeStyle = ok ? '#4ade80' : '#f87171'; ctx.lineWidth = 1.5; ctx.stroke();
      for (let k = 0; k < 4; k++) { ctx.fillStyle = k < b ? (ok ? '#4ade80' : '#fbbf24') : '#ffffff26'; ctx.fillRect(x - 44 + k * 5, y + 30 - (k + 1) * 3, 3.5, (k + 1) * 3) }
      ctx.font = '700 12px Inter,sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(b ? `${sp} Mbit/s` : 'nincs jel', x - 20, y + 25);
      ctx.font = '500 10.5px Inter,sans-serif'; ctx.fillStyle = '#ffffffb0'; ctx.fillText(`kell: ${d.need} • ${d.n}`, x - 44, y + 41); ctx.textAlign = 'center';
    });
    aps.forEach((a, i) => {
      const x = X(a.x), y = Y(a.y), p = (T * 1.5) % 1;
      if (a.ok) for (let k = 0; k < 3; k++) { const q = (p + k / 3) % 1; ctx.beginPath(); ctx.arc(x, y, 10 + q * 80, 0, 7); ctx.strokeStyle = `rgba(91,157,255,${.45 * (1 - q)})`; ctx.lineWidth = 2; ctx.stroke() }
      Dev.draw(ctx, a.dev, x, y, a.dev === 'router' ? 66 : 50, { t: T });
      const lab = i === 0 ? (a.fixed ? 'Router (rögzítve)' : 'Router – húzd!') : a.ok ? `Mesh – ${Math.round(a.cap)} Mbit/s` : 'Mesh – NINCS KAPCSOLAT';
      ctx.font = '600 12px Inter,sans-serif'; const lw = ctx.measureText(lab).width + 14; ctx.fillStyle = a.ok ? 'rgba(11,12,15,.88)' : 'rgba(127,29,29,.95)'; rrect(ctx, x - lw / 2, y + 26, lw, 20, 6); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(lab, x, y + 36);
    });
    const n = L.devs.filter(d => speedAt(d.x, d.y)[0] >= d.need).length;
    $('#w-goal').innerHTML = allOk ? 'Minden eszköz rendben! Tartsd így egy pillanatig…' : `Rendben: <b>${n} / ${L.devs.length}</b> eszköz`;
    $('#w-goal').style.color = allOk ? 'var(--green)' : 'var(--yellow)';
    $('#w-time').textContent = racing ? `Verseny: ${Math.round(totT)} mp` : `${Math.round(lvT)} mp`;
    return allOk;
  }
  function hit(mx, my) { return [...aps].reverse().find(a => !a.fixed && Math.hypot(mx - X(a.x), my - Y(a.y)) < 32) }
  function setBand(b) { band = b; dirty = true; side(); sfx.click() }
  S.build = root => {
    root.innerHTML = `<style>
      #w-side{position:absolute;top:12px;right:12px;width:310px;bottom:12px;overflow:auto;font-size:15px;line-height:1.45;z-index:2;display:flex;flex-direction:column;gap:10px}
      #w-side .btn{font-size:15px;width:100%}#w-side .row{display:flex;gap:6px}#w-side .row .btn{flex:1;padding:8px 4px}
      #w-lv{display:flex;gap:6px}#w-lv span{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-weight:700;border:1px solid var(--line2);color:var(--muted);font-size:14px}
      #w-lv span.on{background:var(--accent);color:#0b0c0f;border-color:var(--accent)}#w-lv span.done{border-color:var(--green);color:var(--green)}
      #w-title{font-size:19px;font-weight:800;letter-spacing:-.01em}#w-intro{font-size:14px;color:#b5bac4}
      #w-goal{font-size:16px;font-weight:700}#w-time{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
      .w-leg{height:12px;border-radius:6px;background:linear-gradient(90deg,hsla(0,95%,55%,.6),hsla(65,95%,55%,.6),hsla(130,95%,55%,.7))}
      #st-wifi canvas{cursor:grab}
      #w-ov{position:absolute;inset:0;z-index:5;display:none;place-items:center;background:rgba(6,7,9,.6);backdrop-filter:blur(4px)}#w-ov.show{display:grid}
      .w-card{width:min(560px,92%);background:var(--panel);border:1px solid var(--line2);border-radius:22px;padding:26px 28px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.5);animation:wIn .4s cubic-bezier(.2,.8,.2,1)}
      @keyframes wIn{from{opacity:0;transform:translateY(20px) scale(.97)}}
      .w-card h2{margin:4px 0 10px;font-size:32px;letter-spacing:-.03em}.w-card p{color:#c9ccd3;font-size:16px}
      .w-k{font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
      .w-rules{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:12px 0 18px}.w-rules span{font-size:13px;border:1px solid var(--line2);border-radius:999px;padding:4px 10px;color:#c9ccd3}
      .w-stars{display:flex;justify-content:center;gap:10px;margin:8px 0}.w-stars svg{color:#3a3f4a}.w-stars svg.on{color:var(--yellow);fill:var(--yellow);filter:drop-shadow(0 0 12px rgba(250,204,21,.5))}
      .w-sc{display:flex;justify-content:center;gap:12px;margin:10px 0}.w-sc div{background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:8px 14px;font-size:12px;color:var(--muted)}.w-sc b{display:block;font-size:22px;color:var(--text)}
      .w-b{display:flex;gap:10px;justify-content:center;margin-top:16px}.w-b .btn{height:46px;padding:0 20px}
      .w-tbl{margin:12px 0;text-align:left}.w-tbl div{display:flex;justify-content:space-between;padding:7px 4px;border-bottom:1px solid var(--line);font-size:16px}
      .w-card .btn.go{min-width:160px}
    </style>
    <div class="panel" id="w-side">
      <div id="w-lv"></div>
      <div id="w-title"></div><div id="w-intro"></div>
      <div id="w-goal"></div><div id="w-time"></div>
      <div><div class="w-leg"></div><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)"><span>gyenge jel</span><span>erős jel</span></div></div>
      <div class="row"><button class="btn sel" data-b="24">2,4 GHz</button><button class="btn" data-b="5">5 GHz</button></div>
      <div style="font-size:13.5px;color:#c9ccd3"><b style="color:var(--cyan)">2,4 GHz:</b> messzebbre ér, jobban átmegy a falon, de lassabb, és sok minden zavarja.<br><b style="color:var(--cyan)">5 GHz:</b> sokkal gyorsabb, de a falak jobban elnyelik.</div>
      <button class="btn" id="w-mesh"></button><button class="btn" id="w-meshrm">Utolsó mesh-pont eltávolítása</button>
      <button class="btn" id="w-micro"></button>
      <div class="learn" style="margin-top:0;font-size:13.5px">Minden eszköz alatt látod, mennyi sebesség <b>kell</b> neki, és mennyit <b>kap</b>. A mesh-pont a routertől kapja a jelet, és annak csak a felét tudja továbbadni, ezért nem mindegy, hová teszed.</div>
    </div><div id="w-ov"></div>`;
    C = makeCanvas(root); ctx = C.ctx;
    $$('[data-b]', root).forEach(b => b.onclick = () => setBand(b.dataset.b));
    $('#w-mesh').onclick = () => { if (aps.length - 1 >= L.mesh) return; aps.push({ x: L.W * (.4 + .15 * aps.length), y: L.H * (aps.length % 2 ? .45 : .6), dev: 'ap', n: 'Mesh' }); dirty = true; side(); sfx.click(); toast('Új mesh-pont! Húzd a helyére.', '#5b9dff') };
    $('#w-meshrm').onclick = () => { if (aps.length > 1) aps.pop(); dirty = true; side(); sfx.click() };
    $('#w-micro').onclick = () => { micro = !micro; dirty = true; side(); if (micro && band === '24') toast('A mikró 2,4 GHz-en zavarja a WiFit!', '#fbbf24') };
    C.cv.addEventListener('pointerdown', e => { if (state !== 'play') return; const r = C.cv.getBoundingClientRect(); drag = hit(e.clientX - r.left, e.clientY - r.top); if (drag) C.cv.setPointerCapture(e.pointerId) });
    C.cv.addEventListener('pointermove', e => { if (!drag) return; const r = C.cv.getBoundingClientRect(); drag.x = clamp((e.clientX - r.left - ox) / sc, 1, L.W - 1); drag.y = clamp((e.clientY - r.top - oy) / sc, 1, L.H - 1); dirty = true });
    C.cv.addEventListener('pointerup', () => { if (drag) beep(800, .05, 'triangle', .04); drag = null });
    results = []; load(0);
  };
  S.enter = () => { racing = false; S.resize() };
  S.resize = () => { if (C) { C.resize(); dirty = true } };
  S.tick = dt => {
    T += dt; const ok = draw();
    if (state === 'play') { lvT += dt; if (racing) totT += dt; if (ok && !drag) { okT += dt; if (okT > 1) levelDone() } else okT = 0 }
  };
  S.leave = () => { racing = false };
  S.comp = { rules: 'Mind az 5 pályát egymás után kell megoldanod. Minden pálya csillagot (kevés mesh-pont) és időbónuszt ér. A végén az összpontszám kerül a ranglistára.', start: () => { racing = true; totT = 0; results = []; load(0) } };
  S.score = () => results.reduce((a, b) => a + (b || 0), 0) || best;
  S._dbg = { LV, load: i => load(i), aps: () => aps, speedAt, links, setBand: b => { band = b; dirty = true }, get L() { return L } };
  return S;
})());
