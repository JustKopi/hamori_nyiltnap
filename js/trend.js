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
  // ---- 3D modell (Three.js) ----
  const col = h => new THREE.Color(h).convertSRGBToLinear();
  const M3 = { r: null, scene: null, cam: null, root: null, pv: {}, rotY: 0, vel: .25, drag: null, dirty: true, glit: [], neon: [], tx: {}, stage: null, runway: null, flash: null, wings: [], tail: [] };
  function m3tex(p) {
    const key = p.pat + p.c + p.c2; if (M3.tx[key]) return M3.tx[key];
    const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const q = cv.getContext('2d');
    q.fillStyle = p.c; q.fillRect(0, 0, S, S); q.fillStyle = p.c2;
    if (p.pat === 'stripe') for (let y = 0; y < S; y += 64) q.fillRect(0, y, S, 24);
    if (p.pat === 'dots') for (let y = 0; y < S; y += 64) for (let x = 0; x < S; x += 64) { q.beginPath(); q.arc(x + 32 + (y / 64 % 2) * 16, y + 32, 13, 0, 7); q.fill() }
    if (p.pat === 'check') { q.globalAlpha = .55; for (let k = 0; k < S; k += 64) { q.fillRect(k, 0, 28, S); q.fillRect(0, k, S, 28) } q.globalAlpha = 1; for (let y = 0; y < S; y += 64) for (let x = 0; x < S; x += 64) q.fillRect(x, y, 28, 28) }
    if (p.pat === 'grad') { const g = q.createLinearGradient(0, 0, 0, S); g.addColorStop(0, p.c); g.addColorStop(1, p.c2); q.fillStyle = g; q.fillRect(0, 0, S, S) }
    const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(p.pat === 'grad' ? 1 : 3, p.pat === 'grad' ? 1 : 3); t.anisotropy = 4;
    return (M3.tx[key] = t);
  }
  let sparkTex = null;
  function sparkle() {
    if (sparkTex) return sparkTex; const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const q = cv.getContext('2d'); q.fillStyle = '#000'; q.fillRect(0, 0, S, S);
    for (let k = 0; k < 160; k++) { const x = Math.random() * S, y = Math.random() * S, r = 1 + Math.random() * 2.5; q.fillStyle = '#fff'; q.beginPath(); q.arc(x, y, r, 0, 7); q.fill() }
    sparkTex = new THREE.CanvasTexture(cv); sparkTex.wrapS = sparkTex.wrapT = THREE.RepeatWrapping; sparkTex.repeat.set(3, 3); return sparkTex;
  }
  function m3mat(p, o = {}) {
    const m = new THREE.MeshStandardMaterial({ map: p.pat === 'solid' || p.pat === 'glitter' ? null : m3tex(p), color: p.pat === 'solid' || p.pat === 'glitter' ? col(p.c) : 0xffffff, roughness: o.r ?? .62, metalness: p.pat === 'glitter' ? .45 : (o.m ?? .05), side: o.side || THREE.FrontSide, flatShading: !!o.flat });
    if (p.pat === 'glitter') { m.emissiveMap = sparkle(); m.emissive = col('#ffffff'); m.emissiveIntensity = .8; M3.glit.push(m) }
    if (p.neon) { m.emissive = col(p.c); m.emissiveIntensity = .55; M3.neon.push(m) }
    return m;
  }
  const V2 = (r, y) => new THREE.Vector2(r, y);
  const lathe = (pts, seg = 40) => new THREE.LatheGeometry(pts.map(([r, y]) => V2(r, y)), seg);
  const torsoR = y => { const P = [[.9, .15], [.98, .168], [1.1, .138], [1.22, .146], [1.32, .168], [1.4, .178], [1.46, .13]]; if (y <= P[0][0]) return P[0][1]; for (let i = 1; i < P.length; i++) if (y <= P[i][0]) { const [y0, r0] = P[i - 1], [y1, r1] = P[i], f = (y - y0) / (y1 - y0); return r0 + (r1 - r0) * f } return .13 };
  const shell = (y0, y1, off, top) => { const pts = []; for (let y = y0; y <= y1 + 1e-6; y += .02) pts.push([torsoR(y) + off, y]); if (top) { pts.push([.11 + off, 1.48], [.06 + off * .5, 1.505]) } return lathe(pts) };
  function add(par, geo, mat, x = 0, y = 0, z = 0, cast = true) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; par.add(m); return m }
  function build() {
    const L = F.L, sc = M3.scene; if (M3.root) { M3.root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose() }); sc.remove(M3.root) }
    M3.glit = []; M3.neon = []; M3.wings = []; M3.tail = [];
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body); M3.root = root; M3.body = body; sc.add(root);
    const skin = new THREE.MeshStandardMaterial({ color: col(L.skin), roughness: .55, metalness: 0 }), dark = new THREE.MeshStandardMaterial({ color: col(0x1b1220), roughness: .3 });
    // törzs, nyak, fej
    const torso = add(body, shell(.88, 1.46, 0, true), skin); torso.scale.z = .74;
    add(body, new THREE.CylinderGeometry(.045, .05, .12, 16), skin, 0, 1.53, 0);
    const head = new THREE.Group(); head.position.set(0, 1.69, 0); body.add(head); M3.head = head;
    add(head, new THREE.SphereGeometry(.14, 40, 32), skin).scale.set(1, 1.1, 1.02);
    [-1, 1].forEach(d => {
      const e = add(head, new THREE.SphereGeometry(.024, 20, 16), dark, d * .05, 0, .128, false); e.scale.set(1, 1.35, .6);
      add(head, new THREE.SphereGeometry(.007, 8, 8), new THREE.MeshBasicMaterial({ color: col(0xffffff) }), d * .05 + .008, .012, .142, false);
      const lash = add(head, new THREE.TorusGeometry(.027, .004, 6, 16, Math.PI * .8), dark, d * .05, .006, .132, false); lash.rotation.z = Math.PI * .1;
      const ch = add(head, new THREE.SphereGeometry(.026, 16, 12), new THREE.MeshStandardMaterial({ color: col(0xf472b6), transparent: true, opacity: .45, roughness: .9 }), d * .085, -.045, .11, false); ch.scale.set(1, .6, .4);
      const br = add(head, new THREE.CapsuleGeometry(.005, .03, 4, 8), dark, d * .052, .055, .128, false); br.rotation.z = Math.PI / 2 + d * .15;
    });
    add(head, new THREE.SphereGeometry(.012, 12, 10), skin, 0, -.025, .145, false);
    const mouth = add(head, new THREE.TorusGeometry(.026, .006, 8, 20, Math.PI), new THREE.MeshStandardMaterial({ color: col(0xbe185d), roughness: .4 }), 0, -.062, .128, false); mouth.rotation.z = Math.PI;
    // haj
    const H = L.hair, hm = m3mat(H, { r: .45, side: THREE.DoubleSide });
    const cap = add(head, new THREE.SphereGeometry(.152, 40, 24, 0, Math.PI * 2, 0, Math.PI * .52), hm); cap.scale.set(1.02, 1.12, 1.06); cap.rotation.x = -.32;
    const back = add(head, new THREE.SphereGeometry(.155, 32, 24, Math.PI, Math.PI, 0, Math.PI * .75), hm); back.scale.set(1.03, 1.12, 1.07);
    if (H.type === 'long') { const lb = add(head, new THREE.CylinderGeometry(.15, .19, .5, 32, 1, true, Math.PI * .58, Math.PI * .84), hm, 0, -.27, -.01); lb.scale.z = .8 }
    if (H.type === 'bob') { const bb = add(head, new THREE.CylinderGeometry(.158, .17, .17, 32, 1, true, Math.PI * .3, Math.PI * 1.4), hm, 0, -.1, 0); bb.scale.z = 1.05 }
    if (H.type === 'pony') { add(head, new THREE.SphereGeometry(.03, 12, 10), hm, 0, .06, -.165); for (let k = 0; k < 6; k++) M3.tail.push(add(head, new THREE.SphereGeometry(.05 - k * .005, 16, 12), hm, 0, .03 - k * .07, -.2 - k * .01)) }
    if (H.type === 'bun') add(head, new THREE.SphereGeometry(.075, 24, 16), hm, 0, .17, -.04);
    if (H.type === 'buns') [-1, 1].forEach(d => add(head, new THREE.SphereGeometry(.06, 20, 14), hm, d * .1, .13, -.02));
    // végtagok csuklókkal
    const limb = (x, y, upLen, loLen, r1, r2) => { const a = new THREE.Group(); a.position.set(x, y, 0); body.add(a); const b = new THREE.Group(); b.position.y = -upLen - .02; a.add(b); add(a, new THREE.CapsuleGeometry(r1, upLen - r1, 6, 16), skin, 0, -upLen / 2, 0); add(b, new THREE.CapsuleGeometry(r2, loLen - r2, 6, 16), skin, 0, -loLen / 2, 0); return [a, b] };
    const [aL, eL] = limb(-.2, 1.42, .27, .25, .042, .036), [aR, eR] = limb(.2, 1.42, .27, .25, .042, .036);
    aL.rotation.z = -.12; aR.rotation.z = .12;
    [eL, eR].forEach(e => { add(e, new THREE.SphereGeometry(.043, 16, 12), skin, 0, -.27, 0); add(e, new THREE.SphereGeometry(.039, 14, 10), skin, 0, .01, 0) });
    const [hL, kL] = limb(-.085, .93, .43, .42, .068, .052), [hR, kR] = limb(.085, .93, .43, .42, .068, .052);
    [kL, kR].forEach(k => add(k, new THREE.SphereGeometry(.058, 16, 12), skin, 0, .01, 0)); [aL, aR].forEach(a => add(a, new THREE.SphereGeometry(.05, 16, 12), skin, 0, 0, 0));
    M3.pv = { aL, aR, eL, eR, hL, hR, kL, kR };
    add(body, lathe([[.02, .86], [.14, .87], [.16, .93], [.15, .98]]), skin).scale.z = .8;
    // felső
    const Tp = L.top, tm = m3mat(Tp);
    const sleeve = (len, long) => [[aL, eL], [aR, eR]].forEach(([a, e]) => { add(a, new THREE.CylinderGeometry(.052, .048, long ? .28 : .13, 20), tm, 0, long ? -.14 : -.065, 0); if (long) add(e, new THREE.CylinderGeometry(.046, .044, .24, 20), tm, 0, -.12, 0) });
    if (Tp.type === 'tee') { add(body, shell(.98, 1.46, .02, true), tm).scale.z = .76; sleeve(.13, false) }
    if (Tp.type === 'crop') { add(body, shell(1.24, 1.46, .012, true), tm).scale.z = .76 }
    if (Tp.type === 'corset') { add(body, shell(.98, 1.36, .014, false), tm).scale.z = .76; for (let k = 0; k < 6; k++) add(body, new THREE.TorusGeometry(.012, .003, 6, 12), new THREE.MeshStandardMaterial({ color: col(0xffffff) }), 0, 1.04 + k * .055, .132, false); [-1, 1].forEach(d => { const st = add(body, new THREE.CapsuleGeometry(.012, .1, 4, 8), tm, d * .09, 1.42, .02); st.rotation.z = d * .15 }) }
    if (Tp.type === 'hoodie' || Tp.type === 'blazer') {
      add(body, shell(.9, 1.46, .02, true), tm).scale.z = .78; sleeve(.28, true);
      if (Tp.type === 'hoodie') { const hood = add(body, new THREE.TorusGeometry(.11, .04, 12, 24, Math.PI * 1.1), tm, 0, 1.5, -.06); hood.rotation.x = Math.PI / 2 + .3; hood.rotation.z = -Math.PI * .05; add(body, new THREE.BoxGeometry(.18, .09, .03), tm, 0, 1.04, .14) }
      else { const lp = new THREE.MeshStandardMaterial({ color: col(Tp.c).multiplyScalar(.7), roughness: .5 }); [-1, 1].forEach(d => { const l = add(body, new THREE.BoxGeometry(.06, .2, .01), lp, d * .05, 1.34, .145); l.rotation.z = d * .35 }); [1.18, 1.08].forEach(y => add(body, new THREE.SphereGeometry(.012, 10, 8), new THREE.MeshStandardMaterial({ color: col(0xd4af37), metalness: .9, roughness: .2 }), .02, y, .15)) }
    }
    // alsó
    const B = L.bottom, bm = m3mat(B, { side: THREE.DoubleSide, flat: B.type === 'pleat' });
    if (B.type === 'skirt') add(body, lathe([[.155, 1.06], [.19, .96], [.27, .82], [.33, .7]]), bm).scale.z = .82;
    if (B.type === 'gown') add(body, lathe([[.15, 1.06], [.2, .9], [.34, .5], [.5, .15], [.56, .02]], 56), bm).scale.z = .86;
    if (B.type === 'pleat') { const g = new THREE.CylinderGeometry(.16, .32, .34, 28, 1, true); const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); if (y < 0) { const s = (i % 2 ? 1.08 : .94); pa.setX(i, pa.getX(i) * s); pa.setZ(i, pa.getZ(i) * s) } } g.computeVertexNormals(); add(body, g, bm, 0, .9, 0).scale.z = .82 }
    if (B.type === 'pants' || B.type === 'cargo') {
      const w = B.type === 'cargo' ? .016 : 0; const hp = [[.02, .845], [.15 + w, .86], [.166 + w, .93]]; for (let y = .96; y <= 1.1; y += .02) hp.push([torsoR(y) + .014, y]); add(body, lathe(hp), bm).scale.z = .78;
      [[hL, kL], [hR, kR]].forEach(([h, k]) => { add(h, new THREE.CylinderGeometry(.085 + w, .07 + w, .45, 20, 1, true), bm, 0, -.22, 0); add(k, new THREE.CylinderGeometry(.068 + w, .062 + w * 1.6, .42, 20, 1, true), bm, 0, -.21, 0); if (B.type === 'cargo') add(h, new THREE.BoxGeometry(.04, .09, .07), bm, h === hL ? -.095 : .095, -.25, 0) });
    }
    // cipő
    const Sh = L.shoes, sm = m3mat(Sh, { r: .4 }), sole = new THREE.MeshStandardMaterial({ color: Sh.type === 'sneaker' ? 0xffffff : 0x111111, roughness: .7 });
    [kL, kR].forEach(k => {
      const f = new THREE.Group(); f.position.y = -.43; k.add(f);
      const hh = Sh.type === 'platform' ? .07 : Sh.type === 'heel' ? .02 : 0;
      add(f, new THREE.BoxGeometry(.09, .06, .2), sm, 0, -.02 + hh, .04).geometry.translate(0, 0, 0);
      add(f, new THREE.SphereGeometry(.046, 16, 12), sm, 0, -.02 + hh, .13).scale.set(1, .7, 1);
      add(f, new THREE.BoxGeometry(.1, .025 + hh, .22), sole, 0, -.05 + hh / 2, .045);
      if (Sh.type === 'heel') add(f, new THREE.CylinderGeometry(.012, .008, .08, 10), sole, 0, -.04, -.05);
      if (Sh.type === 'boot') add(k, new THREE.CylinderGeometry(.064, .06, .3, 20), sm, 0, -.3, 0);
    });
    // kiegészítők
    const A = L.acc, am = m3mat(A, { r: .35, m: .3 }), ac = A.list;
    if (ac.includes('glasses')) { const g = new THREE.Group(); g.position.set(0, 0, .14); head.add(g); [-1, 1].forEach(d => { add(g, new THREE.TorusGeometry(.034, .006, 8, 24), am, d * .052, 0, 0, false); const ln = add(g, new THREE.CircleGeometry(.032, 24), new THREE.MeshStandardMaterial({ color: col(A.c), transparent: true, opacity: .55, roughness: .1, metalness: .5 }), d * .052, 0, 0, false) }); add(g, new THREE.CylinderGeometry(.004, .004, .04, 6), am, 0, .005, 0, false).rotation.z = Math.PI / 2 }
    if (ac.includes('visor')) { const vm = new THREE.MeshStandardMaterial({ map: m3tex({ ...A, pat: 'grad' }), emissive: col(A.c2), emissiveIntensity: .7, transparent: true, opacity: .9, side: THREE.DoubleSide, metalness: .6, roughness: .15 }); M3.neon.push(vm); add(head, new THREE.CylinderGeometry(.165, .165, .065, 40, 1, true, -Math.PI * .42, Math.PI * .84), vm, 0, 0, .01, false) }
    if (ac.includes('phones')) { const band = add(head, new THREE.TorusGeometry(.17, .014, 10, 32, Math.PI), am, 0, 0, 0); band.rotation.y = 0; [-1, 1].forEach(d => { const cup = add(head, new THREE.CylinderGeometry(.05, .05, .045, 24), am, d * .165, -.01, 0); cup.rotation.z = Math.PI / 2 }) }
    if (ac.includes('tiara')) { const tm2 = new THREE.MeshStandardMaterial({ color: col(0xe5e7eb), metalness: .95, roughness: .15 }); const g = new THREE.Group(); g.position.set(0, .11, .02); g.rotation.x = -.35; head.add(g); add(g, new THREE.TorusGeometry(.13, .007, 8, 32, Math.PI), tm2).rotation.x = -Math.PI / 2; for (let k = 0; k < 5; k++) { const a = Math.PI * (.15 + k * .175), h = k === 2 ? .07 : .045; const s = add(g, new THREE.ConeGeometry(.012, h, 8), tm2, Math.cos(a) * .13, h / 2, Math.sin(a) * .13); } add(g, new THREE.OctahedronGeometry(.016), new THREE.MeshStandardMaterial({ color: col(A.c), emissive: col(A.c), emissiveIntensity: .6, metalness: .5, roughness: .1 }), 0, .075, .13) }
    if (ac.includes('bag')) { const bg = add(body, new THREE.BoxGeometry(.16, .13, .06), am, .27, .98, .02); bg.rotation.z = -.1; const strap = add(body, new THREE.CylinderGeometry(.008, .008, .62, 6), am, .05, 1.22, .13); strap.rotation.z = -.95 }
    if (ac.includes('wings')) { const shp = new THREE.Shape(); shp.moveTo(0, 0); shp.bezierCurveTo(.25, .5, .7, .45, .62, .05); shp.bezierCurveTo(.55, -.25, .2, -.35, 0, 0); const wm = new THREE.MeshStandardMaterial({ color: col(A.c2), emissive: col(A.c2), emissiveIntensity: .9, transparent: true, opacity: .55, side: THREE.DoubleSide }); M3.neon.push(wm); [-1, 1].forEach(d => { const g = new THREE.Group(); g.position.set(d * .04, 1.3, -.12); body.add(g); const w = add(g, new THREE.ShapeGeometry(shp, 24), wm, 0, 0, 0, false); w.scale.x = d; M3.wings.push([g, d]) }) }
    root.traverse(o => { if (o.isMesh && o.material && o.material.emissiveIntensity === undefined) { } });
    M3.dirty = false;
  }
  function m3Init() {
    if (M3.r || M3.tried || typeof THREE === 'undefined') return; M3.tried = true;
    const r = new THREE.WebGLRenderer({ canvas: F.cv, antialias: true }); r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = .82; r.shadowMap.enabled = !window.LOWFX; r.shadowMap.type = THREE.PCFSoftShadowMap; r.setPixelRatio(Math.min(window.LOWFX ? 1 : 2, devicePixelRatio || 1)); M3.r = r;
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x150c1a); sc.fog = new THREE.Fog(0x150c1a, 7, 16); M3.scene = sc;
    M3.cam = new THREE.PerspectiveCamera(32, 1, .05, 50); M3.cam.position.set(0, 1.12, 3.6);
    sc.add(new THREE.HemisphereLight(0xffe4f2, 0x24102a, .5));
    const key = new THREE.DirectionalLight(0xfff4f0, 1.15); key.position.set(1.6, 3.4, 2.6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.camera.near = .5; key.shadow.camera.far = 10; ['left', 'bottom'].forEach(k => key.shadow.camera[k] = -2); ['right', 'top'].forEach(k => key.shadow.camera[k] = 2); sc.add(key);
    const rim = new THREE.SpotLight(0xff4fa3, 1.6, 10, .6, .5); rim.position.set(-1.6, 3, -2.4); rim.target.position.set(0, 1, 0); sc.add(rim, rim.target);
    const fill = new THREE.PointLight(0x60a5fa, .7, 8); fill.position.set(-2.2, 1.4, 1.6); sc.add(fill);
    // forgó színpad
    const st = new THREE.Group(); sc.add(st); M3.stage = st;
    add(st, new THREE.CylinderGeometry(1.1, 1.15, .06, 64), new THREE.MeshStandardMaterial({ color: col(0x241a2e), roughness: .35, metalness: .4 }), 0, -.03, 0, false).receiveShadow = true;
    const ring = add(st, new THREE.TorusGeometry(1.12, .015, 8, 96), new THREE.MeshStandardMaterial({ color: col(0xff4fa3), emissive: col(0xff4fa3), emissiveIntensity: 1.4 }), 0, .005, 0, false); ring.rotation.x = Math.PI / 2;
    const fl = add(sc, new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: col(0x120a16), roughness: .9 }), 0, -.06, 0, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
    // kifutó
    const rw = new THREE.Group(); rw.visible = false; sc.add(rw); M3.runway = rw;
    const rp = add(rw, new THREE.BoxGeometry(1.8, .1, 14), new THREE.MeshStandardMaterial({ color: col(0x1d1424), roughness: .25, metalness: .5 }), 0, -.05, -5, false); rp.receiveShadow = true;
    [-1, 1].forEach(d => { add(rw, new THREE.BoxGeometry(.04, .03, 14), new THREE.MeshStandardMaterial({ color: col(0xff4fa3), emissive: col(0xff4fa3), emissiveIntensity: 1.6 }), d * .9, .01, -5, false); for (let k = 0; k < 10; k++) { const p = add(rw, new THREE.CylinderGeometry(.06, .06, .02, 12), new THREE.MeshStandardMaterial({ color: col(0xffffff), emissive: col(0xc084fc), emissiveIntensity: 1.2 }), d * 1.3, .2 + Math.random() * .6, -k * 1.4 + 1, false); p.rotation.x = Math.PI / 2 } });
    M3.flash = new THREE.PointLight(0xffffff, 0, 6); sc.add(M3.flash);
    // forgatás egérrel / ujjal
    F.cv.style.touchAction = 'none';
    F.cv.addEventListener('pointerdown', e => { if (F.run) return; M3.drag = { x: e.clientX, r: M3.rotY }; M3.vel = 0; F.cv.setPointerCapture(e.pointerId) });
    F.cv.addEventListener('pointermove', e => { if (!M3.drag) return; const nr = M3.drag.r + (e.clientX - M3.drag.x) * .012; M3.vel = (nr - M3.rotY) * 30; M3.rotY = nr });
    F.cv.addEventListener('pointerup', () => { M3.drag = null; if (Math.abs(M3.vel) < .05) M3.vel = .25 });
  }
  function m3Frame(T, dt) {
    if (!M3.r || !F.cv.clientWidth) return; if (M3.dirty) build();
    const w = F.cv.clientWidth, h = F.cv.clientHeight, sz = M3.r.getSize(new THREE.Vector2()); if (sz.x !== w || sz.y !== h) { M3.r.setSize(w, h, false); M3.cam.aspect = w / h; M3.cam.updateProjectionMatrix() }
    const R = F.run, P = M3.pv, root = M3.root, cam = M3.cam; M3.runway.visible = !!R; M3.stage.visible = !R;
    let walk = 0;
    if (R) {
      const p = Math.min(1, R.t / 3.2); walk = p < 1 ? R.t : 0; root.position.set(0, 0, -7 + p * 6.9); root.rotation.y = 0;
      cam.position.set(Math.sin(R.t * .4) * .3, 1.25, root.position.z + 3.4 + (1 - p) * .6); cam.lookAt(0, 1.0, root.position.z);
      M3.flash.intensity = Math.random() < .12 ? 3 + Math.random() * 3 : M3.flash.intensity * .7; M3.flash.position.set((Math.random() - .5) * 3, 1.2, root.position.z + 1.6);
    } else {
      if (!M3.drag) { M3.rotY += M3.vel * dt; M3.vel += (.25 - M3.vel) * Math.min(1, dt * .8) }
      root.position.set(0, 0, 0); root.rotation.y = M3.rotY; cam.position.set(0, 1.0, 4.3); cam.lookAt(0, 1.08, 0); M3.flash.intensity = 0;
    }
    // járás / pózok
    const s = Math.sin(walk * 7.5), posing = R && R.t >= 3.2;
    P.hL.rotation.x = walk ? s * .45 : 0; P.hR.rotation.x = walk ? -s * .45 : 0; P.kL.rotation.x = walk ? Math.max(0, -s) * .6 : 0; P.kR.rotation.x = walk ? Math.max(0, s) * .6 : 0;
    P.aL.rotation.x = walk ? -s * .35 : Math.sin(T * 1.2) * .04; P.aR.rotation.x = walk ? s * .35 : -Math.sin(T * 1.2) * .04;
    P.aR.rotation.z = posing ? .75 : .12; P.eR.rotation.z = posing ? -1.9 : 0; P.eR.rotation.x = 0; P.aL.rotation.z = -.12;
    M3.body.position.y = walk ? Math.abs(Math.cos(walk * 7.5)) * .025 : Math.sin(T * 2) * .004; M3.body.rotation.y = walk ? s * .08 : posing ? -.25 : 0; M3.head.rotation.y = posing ? .3 : Math.sin(T * .7) * .08;
    M3.tail.forEach((b, k) => { b.position.x = Math.sin(T * 3 + k * .5 + walk * 7.5) * .012 * k });
    M3.wings.forEach(([g, d]) => { g.rotation.y = d * (.35 + Math.sin(T * 4) * .25) });
    M3.glit.forEach(m => m.emissiveIntensity = .5 + .5 * Math.sin(T * 6));
    M3.neon.forEach(m => { if (m.emissiveIntensity !== undefined && !m.transparent) m.emissiveIntensity = .45 + .2 * Math.sin(T * 4) });
    M3.r.render(M3.scene, cam);
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
  function dsDraw(T, dt) { m3Init(); if (M3.r) m3Frame(T, dt || .016) }
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
  function renderCode() { $('#ds-code').innerHTML = hl(cssOf()); M3.dirty = true }
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
      #ds-th{position:absolute;top:12px;left:12px;max-width:min(330px,60%);background:#0b0c10cc;border:1px solid #ec489966;border-radius:16px;padding:10px 14px;display:flex;flex-direction:column;gap:2px;backdrop-filter:blur(6px)}#ds-th small{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#f9a8d4}#ds-th b{font-size:21px;color:#fff}#ds-th span{font-size:12.5px;color:#e5e7eb;line-height:1.35}
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
    F.cv = $('#ds-cv');
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
      dsDraw(T, dt);
    } else if (Y.cur && (performance.now() - Y.t0) / 1000 > 5) nextVideo('watched');
  };
  S.enter = () => { M3.dirty = true };
  S.leave = () => { F.racing = false };
  S.comp = { rules: 'Divatkód verseny: 3 téma egymás után, mindegyikre 90 másodperc. A három AI-zsűritag pontjai összeadódnak (téma, színek, CSS-minták).', start: () => { setTab('ds'); F.racing = true; F.round = 0; F.total = 0; F.run = null; $('#ds-over').style.display = 'none'; F.L = look(); M3.dirty = true; renderEd(); renderCode(); newTheme() } };
  S.score = () => F.best;
  S._dbg = () => ({ F, Y, M3, judge, runway, nextVideo });
  return S;
})());
