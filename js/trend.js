/* ===== Trend-stúdió: Divatkód (stílus CSS-sel, kifutó, AI-zsűri) + For You algoritmus (ajánlórendszer, szűrőbuborék) ===== */
Object.assign(ICON_PATHS, {
  trend: '<path d="M12 7.5a2 2 0 1 1 2-2c0 1.2-2 1.4-2 3v.8"/><path d="M12 9.3L3.3 15.6c-.9.7-.4 1.9.7 1.9h16c1.1 0 1.6-1.2.7-1.9z"/>',
  bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'
});
App.add((() => {
  const S = {
    id: 'trend', icon: '', title: 'Trend-stúdió', color: '#ec4899',
    desc: 'Divatkód: öltöztesd fel a modellt a témára színkódokkal és CSS-sel, majd vonulj a kifutóra az AI-zsűri elé! Plusz: nézd meg, hogyan tanulja meg egy rövidvideós app, mit szeretsz.',
    topic: 'CSS, színkódok (HEX, RGB), UX-dizájn, ajánlóalgoritmusok, adatvédelem'
  };
  /* ================= 1. Divatkód ================= */
  const PARTS = {
    hair: { n: 'Haj', types: [['long', 'Hosszú'], ['pony', 'Copf'], ['bob', 'Rövid'], ['bun', 'Konty'], ['buns', 'Két konty']] },
    top: { n: 'Felső', types: [['tee', 'Póló'], ['crop', 'Crop top'], ['hoodie', 'Kapucnis pulcsi'], ['blazer', 'Blézer'], ['corset', 'Fűzős felső']] },
    bottom: { n: 'Alsó', types: [['skirt', 'Szoknya'], ['pleat', 'Rakott szoknya'], ['pants', 'Nadrág'], ['cargo', 'Cargo nadrág'], ['gown', 'Gálaruha']] },
    shoes: { n: 'Cipő', types: [['sneaker', 'Sportcipő'], ['boot', 'Csizma'], ['platform', 'Platform'], ['heel', 'Magassarkú']] },
    acc: { n: 'Kiegészítők', multi: true, types: [['glasses', 'Napszemüveg'], ['phones', 'Fejhallgató'], ['bag', 'Táska'], ['tiara', 'Tiara'], ['wings', 'LED-szárnyak'], ['visor', 'VR-szemüveg']] }
  };
  const PATS = [['solid', 'Sima'], ['stripe', 'Csíkos'], ['dots', 'Pöttyös'], ['check', 'Kockás'], ['grad', 'Színátmenet'], ['glitter', 'Csillámos']];
  const SWATCH = ['#111827', '#f8fafc', '#ff4fa3', '#ff9ad5', '#c084fc', '#7c3aed', '#38bdf8', '#22d3ee', '#4ade80', '#a3e635', '#facc15', '#fb923c', '#ef4444', '#94a3b8', '#d4af37', '#8b5a2b'];
  const SKIN = ['#f9d7c4', '#e8b48f', '#c68b5e', '#8d5a3b', '#5c3a24'];
  const THEMES = [
    { n: 'Y2K', d: 'Csillámló 2000-es évek: rózsaszín, lila, ezüst, kis napszemüveg és crop top.', hue: [[290, 345]], pat: ['glitter', 'grad'], top: ['crop', 'corset'], bottom: ['pleat', 'skirt', 'cargo'], shoes: ['platform'], acc: ['glasses', 'bag'], light: 'any' },
    { n: 'Cyberpunk', d: 'Éjszakai neonváros: sötét alapszínek, türkiz és lila neon, techno kiegészítők.', hue: [[170, 200], [270, 320]], pat: ['solid', 'grad'], top: ['hoodie', 'crop'], bottom: ['cargo', 'pants'], shoes: ['boot', 'platform'], acc: ['visor', 'phones', 'wings'], neon: true, light: 'dark' },
    { n: 'Pasztell álom', d: 'Puha, világos pasztellszínek, pöttyök és egy kis tiara.', hue: [[180, 360], [0, 60]], pat: ['dots', 'solid', 'grad'], top: ['tee', 'corset', 'crop'], bottom: ['skirt', 'pleat', 'gown'], shoes: ['sneaker', 'heel'], acc: ['tiara', 'bag'], light: 'light' },
    { n: 'Tech-gála', d: 'Elegáns díjátadó a technológia sztárjainak: sötét, arany vagy csillámló, látványos kiegészítő.', hue: [[40, 55], [260, 300]], pat: ['glitter', 'solid'], top: ['blazer', 'corset'], bottom: ['gown', 'pants'], shoes: ['heel', 'boot'], acc: ['wings', 'tiara'], light: 'dark' },
    { n: 'Sportos stílus', d: 'Edzés utáni laza szett: csíkok, élénk színek, sportcipő és fejhallgató.', hue: [[0, 360]], pat: ['stripe', 'solid'], top: ['tee', 'hoodie', 'crop'], bottom: ['pants', 'cargo'], shoes: ['sneaker'], acc: ['phones'], light: 'any' },
    { n: 'Retró 80-as évek', d: 'Élénk neonszínek, csíkok és kockák, nagy napszemüveg.', hue: [[290, 340], [170, 200], [45, 70]], pat: ['stripe', 'check', 'grad'], top: ['blazer', 'tee', 'crop'], bottom: ['pants', 'skirt'], shoes: ['sneaker', 'platform'], acc: ['glasses', 'phones'], neon: true, light: 'any' }
  ];
  const look = () => ({
    skin: SKIN[1], hair: { type: 'long', c: '#3b2414', c2: '#ff4fa3', pat: 'solid', neon: false },
    top: { type: 'tee', c: '#f8fafc', c2: '#ff9ad5', pat: 'solid', neon: false }, bottom: { type: 'pants', c: '#38bdf8', c2: '#7c3aed', pat: 'solid', neon: false },
    shoes: { type: 'sneaker', c: '#f8fafc', c2: '#111827', pat: 'solid', neon: false }, acc: { list: [], c: '#c084fc', c2: '#22d3ee', pat: 'solid', neon: false }
  });
  const F = { L: look(), part: 'top', theme: 0, t: 90, on: false, run: null, cv: null, ctx: null, round: 0, total: 0, racing: false, best: 0, custom: 0 };
  const hsl = hex => { const n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60 } return [h, s, l] };
  const rgbOf = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255] };
  // ---- minták (canvas) ----
  const pc = {};
  function patFill(c, p, x0, y0, x1, y1) {
    if (p.pat === 'grad') { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, p.c); g.addColorStop(1, p.c2); return g }
    if (p.pat === 'solid' || p.pat === 'glitter') return p.c;
    const key = p.pat + p.c + p.c2; if (pc[key]) return pc[key];
    const o = document.createElement('canvas'); o.width = o.height = 16; const q = o.getContext('2d'); q.fillStyle = p.c; q.fillRect(0, 0, 16, 16); q.fillStyle = p.c2;
    if (p.pat === 'stripe') { q.fillRect(0, 0, 16, 6) } else if (p.pat === 'dots') { q.beginPath(); q.arc(8, 8, 3.4, 0, 7); q.fill() } else if (p.pat === 'check') { q.globalAlpha = .6; q.fillRect(0, 0, 8, 16); q.fillRect(0, 0, 16, 8); q.globalAlpha = 1; q.fillRect(0, 0, 8, 8) }
    return (pc[key] = c.createPattern(o, 'repeat'));
  }
  function paint(c, path, p, box, T) {
    c.save(); if (p.neon) { c.shadowColor = p.c; c.shadowBlur = 22 + Math.sin(T * 4) * 6 }
    c.fillStyle = patFill(c, p, ...box); c.fill(path); c.shadowBlur = 0; c.lineWidth = 2; c.strokeStyle = 'rgba(0,0,0,.35)'; c.stroke(path);
    if (p.pat === 'glitter') { c.clip(path); for (let k = 0; k < 26; k++) { const sx = box[0] + ((k * 73.1) % (box[2] - box[0] || 1)), sy = box[1] + ((k * 41.7 + 13) % (box[3] - box[1] || 1)), a = .5 + .5 * Math.sin(T * 5 + k * 1.7); c.fillStyle = `rgba(255,255,255,${a})`; c.beginPath(); c.moveTo(sx, sy - 4); c.lineTo(sx + 1.2, sy - 1.2); c.lineTo(sx + 4, sy); c.lineTo(sx + 1.2, sy + 1.2); c.lineTo(sx, sy + 4); c.lineTo(sx - 1.2, sy + 1.2); c.lineTo(sx - 4, sy); c.lineTo(sx - 1.2, sy - 1.2); c.fill() } }
    c.restore();
  }
  const PP = (...pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p };
  // ---- modell rajzolása (400×640-es koordinátákban) ----
  function drawModel(c, L, T, walk = 0) {
    const sw = Math.sin(walk * 6) * (walk ? 1 : 0), skin = L.skin, A = L.acc;
    if (A.list.includes('wings')) { c.save(); c.globalAlpha = .75 + .25 * Math.sin(T * 3); c.shadowColor = A.c2; c.shadowBlur = 26; [-1, 1].forEach(d => { const w = new Path2D(); w.moveTo(200 + d * 20, 220); w.bezierCurveTo(200 + d * 170, 90, 200 + d * 190, 260, 200 + d * 60, 330); w.closePath(); c.fillStyle = A.c2 + '66'; c.fill(w); c.strokeStyle = A.c2; c.lineWidth = 3; c.stroke(w) }); c.restore() }
    // haj hátsó része
    const H = L.hair, hairBox = [140, 40, 260, 300];
    if (H.type === 'long') paint(c, PP([150, 100], [250, 100], [262, 290], [138, 290]), H, hairBox, T);
    if (H.type === 'pony') { paint(c, PP([238, 88], [262, 96], [268 + sw * 6, 250], [246 + sw * 6, 250]), H, hairBox, T) }
    // lábak, karok (bőr)
    c.fillStyle = skin; c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2;
    const legL = PP([172, 370], [196, 370], [194 + sw * 4, 560], [176 + sw * 4, 560]), legR = PP([204, 370], [228, 370], [224 - sw * 4, 560], [206 - sw * 4, 560]);
    c.fill(legL); c.fill(legR); c.stroke(legL); c.stroke(legR);
    const armL = PP([138, 182], [154, 178], [148 - sw * 8, 330], [130 - sw * 8, 330]), armR = PP([246, 178], [262, 182], [270 + sw * 8, 330], [252 + sw * 8, 330]);
    c.fill(armL); c.fill(armR); c.stroke(armL); c.stroke(armR);
    c.fillRect(190, 140, 20, 30); const torso = PP([150, 175], [250, 175], [236, 300], [164, 300]); c.fill(torso); const hip = PP([164, 296], [236, 296], [232, 375], [168, 375]); c.fill(hip);
    // alsó
    const B = L.bottom, bb = [150, 290, 250, 560];
    if (B.type === 'skirt') paint(c, PP([164, 292], [236, 292], [262, 410], [138, 410]), B, bb, T);
    if (B.type === 'pleat') { const p = PP([164, 292], [236, 292], [258, 395], [142, 395]); paint(c, p, B, bb, T); c.strokeStyle = 'rgba(0,0,0,.25)'; for (let k = 1; k < 7; k++) { c.beginPath(); c.moveTo(164 + k * 10.3, 296); c.lineTo(142 + k * 16.6, 393); c.stroke() } }
    if (B.type === 'pants' || B.type === 'cargo') { const w = B.type === 'cargo' ? 6 : 0; paint(c, PP([162, 292], [238, 292], [232 + w - sw * 4, 545], [204 - w - sw * 4, 545], [200, 380], [196 + w + sw * 4, 545], [168 - w + sw * 4, 545]), B, bb, T); if (B.type === 'cargo') { c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(160 + sw * 2, 420, 22, 26); c.fillRect(218 - sw * 2, 420, 22, 26) } }
    if (B.type === 'gown') paint(c, PP([164, 292], [236, 292], [290, 560], [110, 560]), B, bb, T);
    // cipő
    const Sh = L.shoes, sb = [160, 520, 240, 590], hh = Sh.type === 'platform' ? 18 : Sh.type === 'heel' ? 8 : 0, bootH = Sh.type === 'boot' ? 70 : 0;
    [[185 + sw * 4, -1], [215 - sw * 4, 1]].forEach(([x, d]) => { if (B.type === 'gown') return; paint(c, PP([x - 13, 545 - bootH], [x + 13, 545 - bootH], [x + 14 + d * 8, 568 + hh], [x - 14 + d * 8, 568 + hh]), Sh, sb, T); if (Sh.type === 'sneaker') { c.fillStyle = '#fff'; c.fillRect(x - 15 + d * 8, 562, 30, 6) } });
    // felső
    const Tp = L.top, tb = [130, 170, 270, 360];
    if (Tp.type === 'tee') { paint(c, PP([150, 172], [250, 172], [272, 215], [254, 228], [242, 205], [238, 305], [162, 305], [158, 205], [146, 228], [128, 215]), Tp, tb, T) }
    if (Tp.type === 'crop') { paint(c, PP([158, 174], [242, 174], [244, 255], [156, 255]), Tp, tb, T) }
    if (Tp.type === 'corset') { paint(c, PP([156, 186], [244, 186], [238, 305], [162, 305]), Tp, tb, T); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.5; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(192, 200 + k * 17); c.lineTo(208, 208 + k * 17); c.moveTo(208, 200 + k * 17); c.lineTo(192, 208 + k * 17); c.stroke() } }
    if (Tp.type === 'hoodie' || Tp.type === 'blazer') {
      paint(c, PP([150, 170], [250, 170], [266 + sw * 8, 330], [248 + sw * 8, 334], [240, 230], [240, 345], [160, 345], [160, 230], [152 - sw * 8, 334], [134 - sw * 8, 330]), Tp, tb, T);
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2;
      if (Tp.type === 'blazer') { c.beginPath(); c.moveTo(178, 172); c.lineTo(200, 240); c.lineTo(222, 172); c.stroke(); c.beginPath(); c.moveTo(200, 240); c.lineTo(200, 345); c.stroke(); c.fillStyle = 'rgba(0,0,0,.4)'; [270, 300].forEach(y => { c.beginPath(); c.arc(206, y, 3, 0, 7); c.fill() }) }
      else { c.beginPath(); c.roundRect(176, 280, 48, 30, 8); c.stroke(); c.beginPath(); c.moveTo(192, 176); c.lineTo(192, 220); c.moveTo(208, 176); c.lineTo(208, 220); c.stroke() }
    }
    // fej
    c.fillStyle = skin; c.beginPath(); c.ellipse(200, 108, 40, 48, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = '#1f2937'; [184, 216].forEach(x => { c.beginPath(); c.ellipse(x, 110, 4, 5 * (((T * .7) % 4) < .12 ? .2 : 1), 0, 0, 7); c.fill() });
    c.strokeStyle = '#be185d'; c.lineWidth = 3; c.beginPath(); c.arc(200, 126, 10, .2, Math.PI - .2); c.stroke(); c.fillStyle = 'rgba(244,114,182,.35)'; [176, 224].forEach(x => { c.beginPath(); c.arc(x, 124, 7, 0, 7); c.fill() });
    // haj elöl
    const front = new Path2D(); front.moveTo(158, 112); front.bezierCurveTo(150, 52, 250, 48, 242, 112); front.bezierCurveTo(232, 82, 200, 70, 176, 86); front.closePath();
    paint(c, front, H, hairBox, T);
    if (H.type === 'bun') { const b = new Path2D(); b.arc(200, 52, 24, 0, 7); paint(c, b, H, hairBox, T) }
    if (H.type === 'buns') [160, 240].forEach(x => { const b = new Path2D(); b.arc(x, 66, 20, 0, 7); paint(c, b, H, hairBox, T) });
    if (H.type === 'bob') { paint(c, PP([156, 100], [166, 150], [150, 152]), H, hairBox, T); paint(c, PP([244, 100], [234, 150], [250, 152]), H, hairBox, T) }
    // kiegészítők
    const ac = A.list, ap = { ...A, pat: A.pat === 'glitter' ? 'glitter' : 'solid' };
    if (ac.includes('glasses')) { c.save(); c.fillStyle = A.c; c.globalAlpha = .9; if (A.neon) { c.shadowColor = A.c; c.shadowBlur = 16 } [182, 218].forEach(x => { c.beginPath(); c.roundRect(x - 17, 98, 34, 22, 9); c.fill() }); c.fillRect(196, 104, 8, 4); c.restore() }
    if (ac.includes('visor')) { c.save(); const g = c.createLinearGradient(160, 96, 240, 124); g.addColorStop(0, A.c); g.addColorStop(1, A.c2); c.fillStyle = g; c.shadowColor = A.c2; c.shadowBlur = 18; c.beginPath(); c.roundRect(156, 94, 88, 30, 12); c.fill(); c.restore() }
    if (ac.includes('phones')) { c.save(); c.strokeStyle = A.c; c.lineWidth = 7; if (A.neon) { c.shadowColor = A.c; c.shadowBlur = 16 } c.beginPath(); c.arc(200, 108, 50, Math.PI * 1.08, Math.PI * 1.92); c.stroke(); c.fillStyle = A.c; [150, 250].forEach(x => { c.beginPath(); c.roundRect(x - 9, 96, 18, 30, 8); c.fill() }); c.restore() }
    if (ac.includes('tiara')) { c.save(); c.fillStyle = '#e5e7eb'; c.shadowColor = A.c; c.shadowBlur = 14; c.beginPath(); c.moveTo(172, 68); c.lineTo(180, 50); c.lineTo(190, 62); c.lineTo(200, 40); c.lineTo(210, 62); c.lineTo(220, 50); c.lineTo(228, 68); c.closePath(); c.fill(); c.fillStyle = A.c; c.beginPath(); c.arc(200, 54, 4, 0, 7); c.fill(); c.restore() }
    if (ac.includes('bag')) { const b = PP([258 + sw * 8, 300], [300 + sw * 8, 300], [304 + sw * 8, 344], [254 + sw * 8, 344]); paint(c, b, ap, [254, 300, 304, 344], T); c.strokeStyle = A.c; c.lineWidth = 3; c.beginPath(); c.arc(279 + sw * 8, 300, 14, Math.PI, 0); c.stroke() }
  }
  // ---- kód (CSS) ----
  function cssOf() {
    const L = F.L, out = [];
    const bg = p => p.pat === 'solid' || p.pat === 'glitter' ? p.c : p.pat === 'grad' ? `linear-gradient(135deg, ${p.c}, ${p.c2})` : p.pat === 'stripe' ? `repeating-linear-gradient(0deg, ${p.c2} 0 6px, ${p.c} 6px 16px)` : p.pat === 'dots' ? `radial-gradient(${p.c2} 30%, transparent 32%) 0 0 / 16px 16px, ${p.c}` : `conic-gradient(${p.c2} 25%, ${p.c} 0 50%, ${p.c2} 0 75%, ${p.c} 0) 0 0 / 16px 16px`;
    const blk = (sel, p, extra = []) => { const l = [`  background: ${bg(p)};`, ...extra]; if (p.neon) l.push(`  box-shadow: 0 0 24px ${p.c}; /* neon */`); if (p.pat === 'glitter') l.push('  animation: csillam 1s infinite;'); out.push(`.${sel} {\n${l.join('\n')}\n}`) };
    blk('haj', L.hair, [`  /* fazon: ${PARTS.hair.types.find(t => t[0] === L.hair.type)[1]} */`]);
    blk('felso', L.top, [`  /* típus: ${PARTS.top.types.find(t => t[0] === L.top.type)[1]} */`]);
    blk('also', L.bottom, [`  /* típus: ${PARTS.bottom.types.find(t => t[0] === L.bottom.type)[1]} */`]);
    blk('cipo', L.shoes);
    if (L.acc.list.length) blk('kiegeszitok', L.acc, [`  /* ${L.acc.list.map(k => PARTS.acc.types.find(t => t[0] === k)[1]).join(', ')} */`]);
    return out.join('\n');
  }
  function hl(s) { return esc(s).replace(/(\/\*.*?\*\/)/g, '<i>$1</i>').replace(/(#[0-9a-fA-F]{6})/g, m => `<b style="color:${m};text-shadow:0 0 1px #000">${m}</b>`).replace(/^(\.[a-z]+)/gm, '<u>$1</u>').replace(/(  [a-z-]+):/g, '<em>$1</em>:') }
  // ---- pontozás ----
  function judge() {
    const L = F.L, th = THEMES[F.theme], parts = [L.top, L.bottom, L.shoes, L.hair];
    const hueOk = hex => { const [h, s, l] = hsl(hex); if (s < .12) return th.light === 'dark' ? l < .3 : th.n === 'Y2K' || th.n === 'Tech-gála' ? l > .6 : false; return th.hue.some(([a, b]) => h >= a && h <= b) };
    let col = 0; [L.top.c, L.bottom.c, L.shoes.c, L.acc.c].forEach(c => { if (hueOk(c)) col++ });
    const avgL = parts.reduce((s, p) => s + hsl(p.c)[2], 0) / 4;
    if (th.light === 'light' && avgL > .7) col += 1.5; if (th.light === 'dark' && avgL < .4) col += 1.5;
    if (th.neon && parts.concat([L.acc]).some(p => p.neon)) col += 1;
    let style = 0; if (th.top.includes(L.top.type)) style += 2; if (th.bottom.includes(L.bottom.type)) style += 2; if (th.shoes.includes(L.shoes.type)) style += 1;
    const accHit = L.acc.list.filter(a => th.acc.includes(a)).length; style += Math.min(2, accHit * 1.2);
    let code = 0; const pats = parts.concat(L.acc.list.length ? [L.acc] : []).map(p => p.pat); code += Math.min(2.5, pats.filter(p => th.pat.includes(p)).length * .9); code += Math.min(1.5, F.custom * .5); if (new Set(pats).size >= 3) code += 1;
    const st = v => Math.max(1, Math.min(5, Math.round(v)));
    const J = [
      ['Pixel', 'színekért felel', st(1 + col * .8), col >= 4 ? 'Ezek a színek tökéletesen illenek a témához!' : col >= 2 ? 'Jó színek, de lehetne még bátrabb.' : `A ${th.n} témához más színek kellenének.`],
      ['Trendi', 'a téma szakértője', st(1 + style * .6), style >= 5 ? 'Pont ilyen szettet képzeltem el!' : style >= 3 ? 'Majdnem tökéletes stílus.' : 'Ez a fazon nem igazán passzol a témához.'],
      ['Kódi', 'a CSS-mester', st(1 + code * .9), code >= 3.5 ? 'Szuper minták és saját színkódok – profi CSS!' : code >= 2 ? 'Ügyes, de próbálj ki több mintát!' : 'Tipp: használj mintát, és írj be saját HEX színkódot!']
    ];
    return J;
  }
  // ---- kifutó animáció ----
  function runway() {
    if (F.run) return; F.on = false; F.run = { t: 0, J: judge() }; beep(520, .1, 'triangle', .05); beep(780, .12, 'triangle', .05, 0, .12);
  }
  function showScores() {
    const J = F.run.J, sum = J.reduce((s, j) => s + j[2], 0), pts = sum * 100; F.total += pts; F.round++;
    const o = $('#ds-over'); o.style.display = 'flex';
    const last = F.racing && F.round >= 3;
    o.innerHTML = `<div class="card" style="max-width:760px"><h2>${sum >= 13 ? 'Ikonikus szett!' : sum >= 10 ? 'Gyönyörű!' : sum >= 7 ? 'Szép próbálkozás!' : 'Legközelebb jobban megy!'}</h2><p>Téma: <b>${THEMES[F.theme].n}</b> • <b>${pts} pont</b>${F.racing ? ` • verseny: ${F.round}/3. kör, összesen ${F.total}` : ''}</p>
      <div class="ds-j">${J.map((j, k) => `<div style="animation-delay:${k * .25}s"><span class="ds-av">${icon('ai', 28)}</span><b>${j[0]}</b><small>${j[1]}</small><div class="ds-st">${[1, 2, 3, 4, 5].map(i => `<span class="${i <= j[2] ? 'on' : ''}">${icon('star', 22, 2)}</span>`).join('')}</div><p>${j[3]}</p></div>`).join('')}</div>
      <div class="learn">A színeket a weboldalakon <b>HEX kóddal</b> adjuk meg: a <b>#RRGGBB</b> három része a vörös, zöld és kék fény erőssége (00–FF). A webdizájnerek és UX-tervezők ugyanígy, CSS-sel „öltöztetik fel” az oldalakat – a mintákat is kód rajzolja!</div>
      <div style="margin-top:14px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">${last ? '<button class="btn go" id="ds-fin">Eredmény beküldése</button>' : `<button class="btn go" id="ds-next">Új téma ▶</button><button class="btn" id="ds-same">Ugyanez a téma még egyszer</button>`}</div></div>`;
    if (sum >= 12) { sfx.win(); FX.confetti() } else sfx.ok();
    if (last) $('#ds-fin').onclick = () => { F.racing = false; F.best = Math.max(F.best, F.total); o.style.display = 'none'; Comp.finish(F.total, `3 téma, ${F.total} pont`); F.run = null; newTheme() };
    else { $('#ds-next').onclick = () => { o.style.display = 'none'; F.run = null; newTheme() }; $('#ds-same').onclick = () => { o.style.display = 'none'; F.run = null; F.t = 90; F.on = true; F.round--; F.total -= pts } }
    F.best = Math.max(F.best, pts);
  }
  function newTheme(i) { let n; do n = Math.floor(Math.random() * THEMES.length); while (n === F.theme && i === undefined); F.theme = i ?? n; F.t = 90; F.on = true; F.custom = 0; renderEd(); $('#ds-th').innerHTML = `<small>A téma</small><b>${THEMES[F.theme].n}</b><span>${THEMES[F.theme].d}</span>`; toast(`Új téma: <b>${THEMES[F.theme].n}</b>`, '#ec4899', 2200) }
  function dsDraw(T) {
    const cv = F.cv; if (!cv || !cv.clientWidth) return; const c = F.ctx, d = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.round(W * d)) { cv.width = Math.round(W * d); cv.height = Math.round(H * d) }
    c.setTransform(d, 0, 0, d, 0, 0); const R = F.run;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, R ? '#1a0b1f' : '#1b1424'); g.addColorStop(1, '#0b0c10'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (R) { // kifutó: fényszórók, vakuk
      c.fillStyle = '#2a1830'; c.beginPath(); c.moveTo(W * .42, H * .25); c.lineTo(W * .58, H * .25); c.lineTo(W * .9, H); c.lineTo(W * .1, H); c.closePath(); c.fill();
      for (let k = 0; k < 6; k++) { const x = W * (.12 + k * .152), a = .12 + .1 * Math.sin(T * 3 + k); c.fillStyle = `rgba(236,72,153,${a})`; c.beginPath(); c.moveTo(x, 0); c.lineTo(x - 60, H); c.lineTo(x + 60, H); c.closePath(); c.fill() }
      if (Math.random() < .25) { c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(Math.random() < .5 ? Math.random() * W * .25 : W - Math.random() * W * .25, H * (.5 + Math.random() * .4), 6 + Math.random() * 10, 0, 7); c.fill() }
    } else { c.fillStyle = '#ffffff08'; for (let k = 0; k < 14; k++) c.fillRect(0, H - 40 - k * 30, W, 1) }
    const p = R ? Math.min(1, R.t / 3.2) : 1, scl = (R ? .35 + .65 * p : 1) * Math.min(W / 420, H / 660), cx = W / 2, by = R ? H * (.3 + .68 * p) : H - 16;
    c.save(); c.translate(cx, by); c.scale(scl, scl); c.translate(-200, -590 + (R ? Math.abs(Math.sin(R.t * 6)) * -6 : 0));
    c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(200, 580, 70, 12, 0, 0, 7); c.fill();
    drawModel(c, F.L, T, R && p < 1 ? R.t : 0); c.restore();
    if (R && p >= 1) { c.font = '900 34px Inter,sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.shadowColor = '#ec4899'; c.shadowBlur = 20; c.fillText('PÓZ!', W / 2, 60); c.shadowBlur = 0 }
  }
  function renderEd() {
    const P = PARTS[F.part] || null, isSkin = F.part === 'skin', p = isSkin ? null : F.L[F.part];
    $$('[data-dp]').forEach(b => b.classList.toggle('sel', b.dataset.dp === F.part));
    let h = '';
    if (isSkin) h = `<h4>Bőrszín</h4><div class="ds-sw">${SKIN.map(c => `<button data-skin="${c}" style="background:${c}" class="${F.L.skin === c ? 'sel' : ''}"></button>`).join('')}</div>`;
    else {
      h += `<h4>${P.multi ? 'Válassz (többet is)' : 'Fazon'}</h4><div class="ds-ty">${P.types.map(([k, n]) => `<button class="btn ${P.multi ? (p.list.includes(k) ? 'sel' : '') : p.type === k ? 'sel' : ''}" data-ty="${k}">${n}</button>`).join('')}</div>`;
      h += `<h4>Szín <span class="ds-rgb">${(() => { const [r, g, b] = rgbOf(p.c); return `RGB(${r}, ${g}, ${b})` })()}</span></h4><div class="ds-sw">${SWATCH.map(c => `<button data-c="${c}" style="background:${c}" class="${p.c === c ? 'sel' : ''}"></button>`).join('')}</div>
        <div class="ds-hex"><label>HEX kód: <input id="ds-hex" value="${p.c}" maxlength="7" spellcheck="false"></label><input type="color" id="ds-pick" value="${p.c}"></div>`;
      h += `<h4>Minta (CSS)</h4><div class="ds-ty">${PATS.map(([k, n]) => `<button class="btn ${p.pat === k ? 'sel' : ''}" data-pat="${k}">${n}</button>`).join('')}</div>`;
      if (['stripe', 'dots', 'check', 'grad'].includes(p.pat)) h += `<h4>Második szín</h4><div class="ds-sw">${SWATCH.map(c => `<button data-c2="${c}" style="background:${c}" class="${p.c2 === c ? 'sel' : ''}"></button>`).join('')}</div>`;
      h += `<label class="ds-neon"><input type="checkbox" id="ds-neon" ${p.neon ? 'checked' : ''}> Neon ragyogás (box-shadow)</label>`;
    }
    $('#ds-ed').innerHTML = h;
    const up = () => { renderEd(); renderCode() };
    $$('[data-skin]').forEach(b => b.onclick = () => { F.L.skin = b.dataset.skin; sfx.click(); up() });
    $$('[data-ty]').forEach(b => b.onclick = () => { const k = b.dataset.ty; if (P.multi) { p.list = p.list.includes(k) ? p.list.filter(x => x !== k) : [...p.list, k] } else p.type = k; sfx.click(); up() });
    $$('[data-c]').forEach(b => b.onclick = () => { p.c = b.dataset.c; sfx.click(); up() }); $$('[data-c2]').forEach(b => b.onclick = () => { p.c2 = b.dataset.c2; sfx.click(); up() });
    $$('[data-pat]').forEach(b => b.onclick = () => { p.pat = b.dataset.pat; sfx.click(); up() });
    const nb = $('#ds-neon'); if (nb) nb.onchange = e => { p.neon = e.target.checked; up() };
    const hx = $('#ds-hex'); if (hx) { hx.addEventListener('keydown', e => e.stopPropagation()); hx.oninput = e => { let v = e.target.value.trim(); if (!v.startsWith('#')) v = '#' + v; if (/^#[0-9a-fA-F]{6}$/.test(v)) { p.c = v.toLowerCase(); F.custom++; $('#ds-pick').value = p.c; renderCode(); const r = $('.ds-rgb'); if (r) { const [a, b2, c2] = rgbOf(p.c); r.textContent = `RGB(${a}, ${b2}, ${c2})` } } } }
    const pk = $('#ds-pick'); if (pk) pk.oninput = e => { p.c = e.target.value; F.custom++; $('#ds-hex').value = p.c; renderCode() };
  }
  function renderCode() { $('#ds-code').innerHTML = hl(cssOf()) }
  /* ================= 2. For You algoritmus ================= */
  const TOP = [['tanc', 'Tánc', 'music', '#f472b6'], ['allat', 'Cuki állatok', 'heart', '#fbbf24'], ['suti', 'Sütés-főzés', 'drop', '#fb923c'], ['gaming', 'Gaming', 'gamepad', '#a78bfa'], ['divat', 'Divat és smink', 'star', '#ec4899'], ['zene', 'Zene', 'sound', '#60a5fa'], ['tudomany', 'Tudomány', 'bulb', '#4ade80'], ['sport', 'Sport', 'activity', '#22d3ee'], ['diy', 'Kreatív DIY', 'hand', '#facc15'], ['tech', 'Tech és kódolás', 'code', '#38bdf8']];
  const CAP = {
    tanc: ['Új koreográfia 15 másodpercben', 'Megtanultam az új trendtáncot!', 'Tánccsata a suli udvarán'], allat: ['A cicám reggeli rutinja', 'Ez a kutya tud számolni?!', 'Kiskacsák első úszása'],
    suti: ['3 hozzávalós bögrés süti', 'Szivárványos palacsinta', 'Mennyi cukor van egy üdítőben?'], gaming: ['Hihetetlen győzelem az utolsó másodpercben', 'Kezdő tippek az új pályához', 'Megépítettem a sulit a játékban'],
    divat: ['Egy ruha – 5 szett', 'Y2K stílus olcsón', 'Így párosítsd a színeket'], zene: ['Gitáron játszom a slágert', 'Beatbox kezdőknek', 'Ki énekli jobban?'],
    tudomany: ['Miért kék az ég? 30 mp-ben', 'Elefántfogkrém kísérlet', 'Így néz ki egy sejt közelről'], sport: ['Napi 5 perces edzés', 'Trükkös kosárlabda dobás', 'Futás közben ezt figyeld'],
    diy: ['Karkötő gyöngyből', 'Szobadekor 1000 forintból', 'Festett tornacipő'], tech: ['Írtam egy játékot 10 sor kóddal', 'Így működik a WiFi', 'Mi van egy telefon belsejében?']
  };
  const HANDLES = ['@pixelpanna', '@kodolo_kata', '@napfeny.dori', '@rozsaszin.byte', '@lili_kreativ', '@techtundér', '@bori.bakes', '@zenes.zoe', '@sporty.sara', '@cicamami'];
  const Y = { w: TOP.map(() => 1), hist: [], cur: null, shown: 0, t0: 0, likes: 0, n: 0, auto: 0, bub: false };
  function pickVideo() {
    const explore = Math.random() < .15, w = Y.w.map(x => x * x), sum = w.reduce((a, b) => a + b, 0);
    let k = 0; if (explore) k = Math.floor(Math.random() * TOP.length); else { let r = Math.random() * sum; for (k = 0; k < w.length; k++) { r -= w[k]; if (r <= 0) break } k = Math.min(k, TOP.length - 1) }
    return { k, cap: pick(CAP[TOP[k][0]]), h: pick(HANDLES), likes: Math.floor(200 + Math.random() * 90000), explore };
  }
  function nextVideo(reaction) {
    if (Y.cur) {
      const dt = (performance.now() - Y.t0) / 1000, k = Y.cur.k;
      if (reaction === 'like') { Y.w[k] += 3; Y.likes++ } else if (reaction === 'no') Y.w[k] = Math.max(.15, Y.w[k] * .35); else if (dt < 1.5) Y.w[k] = Math.max(.2, Y.w[k] * .75); else if (dt > 3.5) Y.w[k] += 1.2;
      Y.hist.push(k); if (Y.hist.length > 10) Y.hist.shift();
    }
    Y.cur = pickVideo(); Y.t0 = performance.now(); Y.n++; renderFeed(reaction); renderBrain();
  }
  function renderFeed(dir) {
    const v = Y.cur, T = TOP[v.k], fd = $('#fy-feed'); if (!fd) return;
    const old = fd.querySelector('.fy-v'); if (old) { old.classList.add(dir === 'no' ? 'out-l' : dir === 'like' ? 'out-r' : 'out'); setTimeout(() => old.remove(), 450) }
    const el = document.createElement('div'); el.className = 'fy-v in'; el.style.setProperty('--c', T[3]);
    el.innerHTML = `<div class="fy-bg"></div><div class="fy-ic">${icon(T[2], 96, 1.4)}</div><div class="fy-cap"><b>${v.h}</b><span>${v.cap}</span><small>#${T[1].toLowerCase().replace(/\s+/g, '')} ${v.explore ? '• <em>felfedezés: valami új</em>' : ''}</small></div>
      <div class="fy-side"><span>${icon('heart', 26, 2)}<small>${v.likes > 999 ? (v.likes / 1000).toFixed(1).replace('.', ',') + 'E' : v.likes}</small></span><span>${icon('mail', 24, 2)}<small>${Math.floor(v.likes / 40)}</small></span><span>${icon('repeat', 24, 2)}<small>Megoszt</small></span></div><div class="fy-prog"><i></i></div>`;
    fd.appendChild(el); requestAnimationFrame(() => el.classList.remove('in'));
  }
  function renderBrain() {
    const sum = Y.w.reduce((a, b) => a + b, 0), order = TOP.map((t, i) => [i, Y.w[i] / sum]).sort((a, b) => b[1] - a[1]);
    $('#fy-bars').innerHTML = order.map(([i, p]) => `<div class="fy-bar" style="--c:${TOP[i][3]}"><span>${TOP[i][1]}</span><i><em style="width:${Math.round(p * 100)}%"></em></i><b>${Math.round(p * 100)}%</b></div>`).join('');
    const cnt = {}; Y.hist.forEach(k => cnt[k] = (cnt[k] || 0) + 1); const topShare = Y.hist.length >= 6 ? Math.max(...Object.values(cnt)) / Y.hist.length : 0;
    $('#fy-bub').style.width = Math.round(topShare * 100) + '%'; $('#fy-bubv').textContent = Y.hist.length >= 6 ? Math.round(topShare * 100) + '%' : 'még gyűjti az adatokat…';
    $('#fy-st').innerHTML = `Megnézett videók: <b>${Y.n - 1}</b> • lájk: <b>${Y.likes}</b>`;
    if (!Y.bub && topShare >= .6 && Y.n > 8) { Y.bub = true; toast('<b>Szűrőbuborékba kerültél!</b> Az algoritmus már szinte csak egyféle videót mutat neked.', '#ec4899', 4200) }
  }
  /* ================= felület ================= */
  let tab = 'ds', T = 0;
  function setTab(t) { tab = t; $$('[data-tt]').forEach(b => b.classList.toggle('sel', b.dataset.tt === t)); $('#ds').style.display = t === 'ds' ? '' : 'none'; $('#fy').style.display = t === 'fy' ? '' : 'none'; if (t === 'fy' && !Y.cur) nextVideo() }
  S.build = r => {
    r.innerHTML = `<style>
      #tr-tabs{position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:3;display:flex;gap:4px;background:var(--panel);border:1px solid var(--line2);border-radius:14px;padding:5px}#tr-tabs .btn{height:40px;font-size:14.5px;padding:0 16px;white-space:nowrap}
      #ds,#fy{position:absolute;inset:64px 12px 12px}
      #ds{display:grid;grid-template-columns:minmax(0,1fr) 380px 340px;gap:12px}
      #ds-stage{position:relative;border-radius:20px;overflow:hidden;border:1px solid #ec489955;min-height:0}#ds-cv{position:absolute;inset:0;width:100%;height:100%}
      #ds-th{position:absolute;top:12px;left:12px;right:12px;background:#0b0c10cc;border:1px solid #ec489966;border-radius:16px;padding:10px 14px;display:flex;flex-direction:column;gap:2px;backdrop-filter:blur(6px)}#ds-th small{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#f9a8d4}#ds-th b{font-size:24px;color:#fff}#ds-th span{font-size:13.5px;color:#e5e7eb}
      #ds-time{position:absolute;bottom:14px;left:14px;font-size:30px;font-weight:900;color:#fff;text-shadow:0 0 12px #ec4899}
      #ds-go{position:absolute;bottom:14px;right:14px;height:56px;font-size:20px;padding:0 22px;background:linear-gradient(135deg,#ec4899,#a855f7);color:#fff;border:0;box-shadow:0 10px 30px -8px #ec4899}
      #ds-side{display:flex;flex-direction:column;gap:10px;min-height:0}
      #ds-parts{display:flex;flex-wrap:wrap;gap:5px}#ds-parts .btn{height:38px;font-size:14px;padding:0 12px}#ds-parts .btn.sel{background:#ec4899;color:#fff;border-color:#ec4899}
      #ds-ed{flex:1;overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:12px 14px;font-size:14px}#ds-ed h4{margin:10px 0 6px;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;display:flex;justify-content:space-between}#ds-ed h4:first-child{margin-top:0}
      .ds-ty{display:flex;flex-wrap:wrap;gap:5px}.ds-ty .btn{height:34px;font-size:13.5px;padding:0 10px}.ds-ty .btn.sel{background:#ec4899;border-color:#ec4899;color:#fff}
      .ds-sw{display:grid;grid-template-columns:repeat(8,1fr);gap:6px}.ds-sw button{aspect-ratio:1;border-radius:50%;border:2px solid #ffffff22;cursor:pointer;transition:transform .15s}.ds-sw button:hover{transform:scale(1.15)}.ds-sw button.sel{border:3px solid #fff;box-shadow:0 0 12px #fff}
      .ds-hex{display:flex;gap:8px;align-items:center;margin-top:8px}.ds-hex input#ds-hex{width:100px;font-family:var(--mono);font-size:15px;padding:6px 8px;border-radius:8px;border:1px solid var(--line2);background:#101216;color:var(--text)}.ds-hex input[type=color]{width:44px;height:34px;border:0;background:none;padding:0;cursor:pointer}
      .ds-rgb{font-family:var(--mono);text-transform:none;letter-spacing:0;color:#f9a8d4}.ds-neon{display:flex;gap:8px;align-items:center;margin-top:12px;font-weight:600;cursor:pointer}
      #ds-codew{display:flex;flex-direction:column;gap:8px;min-height:0}#ds-code{flex:1;margin:0;overflow:auto;background:#08090b;border-radius:16px;padding:12px;font-family:var(--mono);font-size:12.5px;line-height:1.55;white-space:pre-wrap;color:#e5e7eb;border:1px solid var(--line)}
      #ds-code i{color:#6b7280;font-style:normal}#ds-code u{text-decoration:none;color:#f472b6;font-weight:700}#ds-code em{font-style:normal;color:#93c5fd}
      .ds-j{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:8px 0 12px}.ds-j>div{background:var(--bg2);border:1px solid var(--line2);border-radius:16px;padding:12px;display:flex;flex-direction:column;align-items:center;gap:3px;animation:dsJ .5s cubic-bezier(.2,1.4,.4,1) both}@keyframes dsJ{from{opacity:0;transform:translateY(20px) scale(.9)}}
      .ds-av{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#ec4899,#a855f7);color:#fff}.ds-j small{color:var(--muted);font-size:12px}.ds-j p{font-size:13px;margin:4px 0 0;line-height:1.35}
      .ds-st{display:flex;gap:2px}.ds-st span{color:#3b4150}.ds-st span.on{color:#facc15;filter:drop-shadow(0 0 6px #facc15)}
      #fy{display:grid;grid-template-columns:minmax(0,1fr) 400px minmax(0,1fr);gap:16px;align-items:start}
      #fy-phone{position:relative;height:min(calc(100vh - 230px),680px);aspect-ratio:9/17;max-width:100%;margin:0 auto;border-radius:40px;border:10px solid #1f2937;background:#000;overflow:hidden;box-shadow:0 30px 60px -20px #ec489966}
      #fy-feed{position:absolute;inset:0}.fy-v{position:absolute;inset:0;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .45s}.fy-v.in{transform:translateY(100%)}.fy-v.out{transform:translateY(-100%)}.fy-v.out-l{transform:translateX(-110%) rotate(-8deg);opacity:0}.fy-v.out-r{transform:translateX(110%) rotate(8deg);opacity:0}
      .fy-bg{position:absolute;inset:0;background:linear-gradient(160deg,var(--c),#0b0c10 70%,color-mix(in srgb,var(--c) 50%,#000));background-size:200% 200%;animation:fyBg 6s ease-in-out infinite alternate}@keyframes fyBg{to{background-position:100% 100%}}
      .fy-ic{position:absolute;top:28%;left:50%;transform:translateX(-50%);color:#fff;animation:fyIc 1.6s ease-in-out infinite;filter:drop-shadow(0 10px 30px #0008)}@keyframes fyIc{50%{transform:translateX(-50%) scale(1.12) rotate(-4deg)}}
      .fy-cap{position:absolute;left:14px;right:70px;bottom:26px;color:#fff;display:flex;flex-direction:column;gap:4px;text-shadow:0 1px 4px #000}.fy-cap b{font-size:15px}.fy-cap span{font-size:15px}.fy-cap small{font-size:12.5px;opacity:.85}.fy-cap em{color:#fde68a;font-style:normal}
      .fy-side{position:absolute;right:10px;bottom:30px;display:flex;flex-direction:column;gap:14px;color:#fff;align-items:center}.fy-side span{display:flex;flex-direction:column;align-items:center;font-size:11px}
      .fy-prog{position:absolute;left:0;right:0;bottom:0;height:3px;background:#ffffff33}.fy-prog i{display:block;height:100%;width:0;background:#fff;animation:fyP 5s linear forwards}@keyframes fyP{to{width:100%}}
      .fy-btns{display:flex;gap:10px;justify-content:center;margin-top:12px}.fy-btns .btn{height:54px;font-size:16px;padding:0 16px;display:inline-flex;gap:6px;align-items:center}.fy-like{background:linear-gradient(135deg,#ec4899,#f43f5e)!important;color:#fff!important;border:0!important}
      .fy-panel{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:10px;font-size:14.5px;line-height:1.5}.fy-panel h3{margin:0;font-size:19px}
      .fy-bar{display:grid;grid-template-columns:120px 1fr 44px;gap:8px;align-items:center;font-size:13.5px}.fy-bar i{height:12px;background:var(--panel2);border-radius:6px;overflow:hidden}.fy-bar em{display:block;height:100%;background:var(--c);transition:width .6s cubic-bezier(.2,.8,.2,1)}.fy-bar b{text-align:right}
      .fy-bw{height:14px;background:var(--panel2);border-radius:7px;overflow:hidden}#fy-bub{height:100%;width:0;background:linear-gradient(90deg,#4ade80,#facc15,#ec4899);transition:width .6s}
      @media(max-width:1100px){#ds{grid-template-columns:1fr 1fr;overflow:auto}#ds-codew{grid-column:1/-1;min-height:200px}#fy{grid-template-columns:1fr;overflow:auto}}
    </style>
    <div id="tr-tabs"><button class="btn sel" data-tt="ds">${icon('trend', 16)} Divatkód – kifutó</button><button class="btn" data-tt="fy">${icon('video', 16)} For You algoritmus</button></div>
    <div id="ds"><div id="ds-stage"><canvas id="ds-cv"></canvas><div id="ds-th"></div><div id="ds-time"></div><button class="btn" id="ds-go">Kifutóra! ▶</button></div>
      <div id="ds-side"><div id="ds-parts">${[['skin', 'Bőr'], ...Object.entries(PARTS).map(([k, v]) => [k, v.n])].map(([k, n]) => `<button class="btn ${k === 'top' ? 'sel' : ''}" data-dp="${k}">${n}</button>`).join('')}</div><div id="ds-ed"></div></div>
      <div id="ds-codew"><div style="font-size:13px;color:var(--muted)">Így néz ki a szetted <b style="color:#f9a8d4">CSS-kódban</b> – ahogy egy weboldalt is „felöltöztetünk”:</div><pre id="ds-code"></pre><div class="learn" style="margin-top:0;font-size:13px">Írj be saját <b>HEX színkódot</b> (pl. #ff4fa3), próbálj ki mintákat – a zsűriben a CSS-mester ezt is pontozza!</div></div>
      <div class="big-overlay" id="ds-over" style="display:none"></div></div>
    <div id="fy" style="display:none">
      <div class="fy-panel"><h3>Hogyan dönti el az app, mit mutasson?</h3><div>Ez egy <b>ajánlóalgoritmus</b>: figyeli, mit lájkolsz, mit nézel végig és mit pörgetsz tovább gyorsan. Ebből „profilt” épít rólad, és egyre inkább azt mutatja, amit szerinte szeretsz.</div>
        <div class="learn" style="margin-top:0"><b>Kísérlet:</b> lájkolj csak egyféle videót 10-szer, és figyeld a jobb oldali sávokat! Hamar <b>szűrőbuborékba</b> kerülsz: más témájú videót alig látsz.</div>
        <div class="learn" style="margin-top:0"><b>Tippek:</b> nézz tudatosan változatos tartalmat, ne adj meg személyes adatot, és időnként töröld az előzményeidet. Az ilyen rendszereket <b>programozók és adatelemzők</b> építik – akár te is lehetsz egyikük!</div></div>
      <div><div id="fy-phone"><div id="fy-feed"></div></div><div class="fy-btns"><button class="btn" id="fy-no">${icon('back', 18, 2)} Nem érdekel</button><button class="btn fy-like" id="fy-like">${icon('heart', 20, 2.2)} Lájk</button><button class="btn" id="fy-next">Tovább ${icon('arrow', 18, 2)}</button></div></div>
      <div class="fy-panel"><h3>Mit „tud” rólad az algoritmus?</h3><div id="fy-st"></div><div id="fy-bars"></div><div><b>Szűrőbuborék-mérő</b> <span style="color:var(--muted);font-size:13px">(az utolsó 10 videóból mennyi egyféle)</span></div><div class="fy-bw"><div id="fy-bub"></div></div><div id="fy-bubv" style="font-size:13px;color:var(--muted)"></div><button class="btn" id="fy-rs">Előzmények törlése</button></div></div>`;
    F.cv = $('#ds-cv'); F.ctx = F.cv.getContext('2d');
    $$('[data-tt]', r).forEach(b => b.onclick = () => { setTab(b.dataset.tt); sfx.click() });
    $$('[data-dp]', r).forEach(b => b.onclick = () => { F.part = b.dataset.dp; sfx.click(); renderEd() });
    $('#ds-go').onclick = runway;
    $('#fy-like').onclick = () => { beep(900, .05, 'triangle', .04); nextVideo('like') }; $('#fy-no').onclick = () => nextVideo('no'); $('#fy-next').onclick = () => nextVideo('next');
    $('#fy-rs').onclick = () => { Y.w = TOP.map(() => 1); Y.hist = []; Y.bub = false; Y.likes = 0; Y.n = 1; renderBrain(); toast('Előzmények törölve – az algoritmus újra kezdi a tanulást.', '#4ade80') };
    renderEd(); renderCode(); newTheme(0);
  };
  S.tick = dt => {
    T += dt;
    if (tab === 'ds') {
      if (F.on && !window.EASY) { F.t -= dt; if (F.t <= 0) { F.t = 0; runway() } }
      const tm = $('#ds-time'); if (tm) tm.textContent = F.run ? '' : window.EASY ? '' : `${Math.ceil(F.t)} mp`;
      if (F.run) { const prev = F.run.t; F.run.t += dt; if (prev < 3.2 && F.run.t >= 3.2) beep(1200, .08, 'triangle', .05); if (prev < 4.2 && F.run.t >= 4.2) showScores() }
      dsDraw(T);
    } else if (Y.cur && (performance.now() - Y.t0) / 1000 > 5) nextVideo('watched');
  };
  S.enter = () => { if (F.cv) { F.cv.width = 0 } };
  S.leave = () => { F.racing = false };
  S.comp = { rules: 'Divatkód verseny: 3 téma egymás után, mindegyikre 90 másodperc. A három AI-zsűritag pontjai összeadódnak (téma, színek, CSS-minták).', start: () => { setTab('ds'); F.racing = true; F.round = 0; F.total = 0; F.run = null; $('#ds-over').style.display = 'none'; F.L = look(); newTheme() } };
  S.score = () => F.best;
  S._dbg = () => ({ F, Y, judge, runway, nextVideo });
  return S;
})());
