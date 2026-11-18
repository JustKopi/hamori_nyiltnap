/* ===== 9. Gépépítő műhely 3D – megrendelések, szabad építés, csavarhúzó, szimuláció ===== */
App.add((() => {
  const S = {
    id: 'pc', icon: '', title: 'Gépépítő műhely 3D', color: '#60a5fa',
    desc: 'Teljesíts megrendeléseket vagy építs szabadon: rendelj alkatrészt, szereld be csavarhúzóval, kapcsold be, és telepítsd a Windowst!',
    topic: 'Számítógép felépítése, kompatibilitás, összeszerelés, hibakeresés, operációs rendszer telepítése'
  };
  const DB = PCDB, find = (c, id) => DB[c].find(x => x.id === id);
  const huf = n => Math.round(n).toLocaleString('hu-HU') + ' Ft';
  const V = (x, y, z) => new THREE.Vector3(x, y, z), Q = (x = 0, y = 0, z = 0) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
  const DEG = Math.PI / 180, wait = ms => new Promise(r => setTimeout(r, ms));
  const BOARD = { ATX: [3.05, 2.44], mATX: [2.44, 2.44], ITX: [1.7, 1.7] };
  const RZ = { 4: [1.22, 1.32, 1.42, 1.52], 2: [1.2, 1.36] };
  const CNAME = { c24: '24 tűs alaplapi tápkábel', ceps: '8 tűs processzor-tápkábel', cgpu: 'Videokártya-tápkábel', csata: 'SATA adat- és tápkábel', cfp: 'Előlapi csatlakozók (bekapcsológomb)', cfan: 'Processzorhűtő ventilátorkábele (CPU_FAN)' };

  let root, renderer, scene, camera, ray, T = 0, built = false;
  const cam = { th: .62, ph: 1.08, r: 12.5, tgt: V(1.9, 1.7, -.3), goalTgt: V(1.9, 1.7, -.3), goalR: 12.5 };
  let rotors = [], rgbM = [], tweens = [], items = [], uidN = 1, slots = {}, conns = {}, cableMesh = {}, caseP = null, caseG = null, caseFans = [], panel = null, panelOpened = false;
  let paste = { state: 'none', p: null }, blob = null, os = new Set(), sel = null, ghosts = [], hover = null, tool = 'hand', auto = false, driver = null, busy = false;
  let powered = false, load = 0, monitorTex = null, monitorCtx = null, mode = 'orders', order = null, wallet = store.get('pc-wallet', 0), spent = 0, lastPost = null, sensors = null, shopCat = 'case', cart = [], filt = { col: 'all', rgb: false };
  const META = new WeakMap(), meta = o => META.get(o) || {};
  const G = () => { const [W, H, D] = caseP.dim; return { W, H, D, bx: -W / 2 + .17, ay: H - .8, az: -D / 2 + .32 } };

  /* ---------- anyag- és geometria-segédek ---------- */
  function mat(c, o = {}) { return new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? .55, metalness: o.m ?? .15, map: o.map || null, transparent: !!o.op, opacity: o.op ?? 1, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, depthWrite: !o.op }) }
  function box(w, h, d, m, x = 0, y = 0, z = 0, par) { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; if (par) par.add(me); return me }
  function cyl(r1, r2, h, m, x = 0, y = 0, z = 0, par, seg = 20) { const me = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; if (par) par.add(me); return me }
  function ctex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t }
  function decal(par, w, h, tex, x, y, z, ry = 0, rx = 0) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: .6, metalness: .1 })); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.receiveShadow = true; par.add(m); return m }
  const font = (wt, px) => `${wt} ${px}px Inter,"Segoe UI",Arial,sans-serif`;
  const light = c => /^#(e|f|d|c|b)/i.test(c || '');
  let brushedT = null; const brushed = () => brushedT || (brushedT = ctex(256, 256, (g, w, h) => { g.fillStyle = '#c9ced6'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '90,95,105'},${Math.random() * .18})`; g.fillRect(0, Math.random() * h, w, 1) } }));
  function textPanel(w, h, bg, lines, rot = 0) {
    return ctex(w, h, g => { g.fillStyle = bg; g.fillRect(0, 0, w, h); if (rot) { g.translate(w / 2, h / 2); g.rotate(rot); g.translate(-h / 2, -w / 2) } const W2 = rot ? h : w, H2 = rot ? w : h;
      for (const l of lines) { g.fillStyle = l.c || '#fff'; g.font = font(l.wt || 800, l.s); g.textAlign = l.a || 'center'; g.textBaseline = 'middle'; g.fillText(l.t, l.x != null ? l.x * W2 : W2 / 2, l.y * H2) } });
  }
  function meshTex(col) { return ctex(256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.45)'; for (let y = 6; y < h; y += 14) for (let x = (y / 14 % 2) * 7 + 4; x < w; x += 14) { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill() } }) }
  function woodTex() { return ctex(256, 512, (g, w, h) => { g.fillStyle = '#8a5a35'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(40,20,8,.55)'; g.fillRect(x, 0, 6, h); for (let i = 0; i < 20; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '60,30,10' : '170,120,80'},${Math.random() * .3})`; g.fillRect(x + 6 + Math.random() * 24, 0, 1, h) } } }) }
  function makeFan(size, depth = .25, o = {}) {
    const g = new THREE.Group(), fm = mat(o.col || '#16181d', { r: .65 });
    box(size, .08, depth, fm, 0, size / 2 - .04, 0, g); box(size, .08, depth, fm, 0, -size / 2 + .04, 0, g); box(.08, size, depth, fm, size / 2 - .04, 0, 0, g); box(.08, size, depth, fm, -size / 2 + .04, 0, 0, g);
    const rot = new THREE.Group(); g.add(rot); const bm = mat(o.blade || '#2a2e37', { r: .5, op: o.rgb ? .85 : 0 });
    cyl(size * .17, size * .17, depth * .7, mat(o.hub || o.col || '#1f2229'), 0, 0, 0, rot).rotation.x = Math.PI / 2;
    for (let i = 0; i < 7; i++) { const p = new THREE.Group(); p.rotation.z = i * Math.PI * 2 / 7; box(size * .32, size * .13, .015, bm, size * .27, 0, 0, p).rotation.x = .45; rot.add(p) }
    if (o.rgb) { const rm = mat('#000000', { e: 0xffffff, ei: 0 }); g.add(new THREE.Mesh(new THREE.TorusGeometry(size * .44, .02, 8, 40), rm)); rgbM.push(rm) }
    rotors.push(rot); g.rotorRef = rot; return g;
  }
  function screwMesh() { const g = new THREE.Group(); cyl(.045, .045, .03, mat('#c9ccd3', { m: .9, r: .3 }), 0, .015, 0, g, 12); cyl(.018, .018, .12, mat('#9aa0ab', { m: .9, r: .3 }), 0, -.06, 0, g, 8); box(.06, .012, .012, mat('#55595f'), 0, .031, 0, g); box(.012, .012, .06, mat('#55595f'), 0, .031, 0, g); return g }

  /* ---------- alkatrész-modellek ---------- */
  function addScrew(it, obj, x, y, z, n) {
    const m = screwMesh(), nv = new THREE.Vector3(...n).normalize(); m.quaternion.setFromUnitVectors(V(0, 1, 0), nv);
    const s = { m, obj, base: V(x, y, z), n: nv, in: false, item: it, mats: [] }; m.traverse(c => { if (c.isMesh) { c.material = c.material.clone(); s.mats.push(c.material) } }); META.set(m, { screw: s }); m.traverse(c => { if (c !== m) META.set(c, { screwOf: s }) }); obj.add(m); it.screws.push(s); placeScrew(s); return s;
  }
  function placeScrew(s, k = s.in ? 0 : 1) { s.m.position.copy(s.base).addScaledVector(s.n, .14 * k); s.m.visible = s.item.slot != null }
  function mbModel(p, it) {
    const [h, w] = BOARD[p.form], g = new THREE.Group(), hs = mat(p.white ? '#e9ebef' : '#2c3038', { m: p.white ? .2 : .55, r: .35, map: p.white ? null : brushed() }), blk = mat('#0e0f11'), acc = mat(p.acc, { m: .4 });
    box(.06, h, w, mat(p.col, { r: .6 }), 0, -h / 2, w / 2, g);
    const silk = ctex(512, Math.round(512 * h / w), (c, W2, H2) => { c.fillStyle = p.col; c.fillRect(0, 0, W2, H2); c.strokeStyle = light(p.col) ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.05)'; c.lineWidth = 2; for (let i = 0; i < 90; i++) { let x = Math.random() * W2, y = Math.random() * H2; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 3; k++) { k % 2 ? y += (Math.random() - .5) * 140 : x += (Math.random() - .5) * 140; c.lineTo(x, y) } c.stroke() }
      c.fillStyle = light(p.col) ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.7)'; c.font = font(800, 24); c.textAlign = 'center'; c.fillText(p.name.replace(/^(ASUS|MSI|Gigabyte|ASRock) /, '').replace(/ \(.*\)/, '').toUpperCase().slice(0, 30), W2 * .62, H2 * .9); c.font = font(700, 14); c.fillText(p.form + ' · ' + p.socket + ' · ' + p.mem, W2 * .62, H2 * .9 + 24);
      c.fillStyle = p.acc; c.fillRect(20, H2 * .55, 8, H2 * .35) });
    decal(g, w, h, silk, .031, -h / 2, w / 2, Math.PI / 2);
    box(.06, .54, .54, mat(p.socket === 'AM5' ? '#b8bcc6' : '#9aa0ab', { m: .7, r: .3 }), .05, -.78, .62, g); box(.03, .4, .4, mat('#d4af37', { m: .8, r: .3 }), .07, -.78, .62, g);
    const lever = new THREE.Group(); lever.position.set(.09, -1.05, .9); cyl(.015, .015, .55, mat('#c9ccd3', { m: .9 }), 0, .27, 0, lever, 8); g.add(lever); it.lever = lever;
    box(.26, .24, .95, hs, .13, -.28, .58, g); box(.26, .95, .24, hs, .13, -.78, .17, g); box(.02, .03, .9, acc, .27, -.28, .58, g);
    it.clips = [];
    RZ[p.slots].forEach((z, i) => { box(.1, 1.42, .05, i % 2 ? mat(p.white ? '#d5d8de' : '#3a3f48') : blk, .07, -.78, z, g); for (const e of [1, -1]) { const cg = new THREE.Group(); cg.position.set(.07, -.78 + e * .74, z); box(.12, .07, .055, mat('#d4d7de'), .03, e * .03, 0, cg); g.add(cg); it.clips.push({ g: cg, e, i }) } });
    const py = p.form === 'ITX' ? -1.5 : -1.62; box(.1, .07, 1.0, blk, .07, py, .55, g); box(.105, .02, 1.0, mat('#9aa0ab', { m: .8 }), .075, py + .04, .55, g);
    box(.07, .05, .1, blk, .06, -1.25, .12, g); if (p.m2 > 1) box(.07, .05, .1, blk, .06, -2.1, .12, g);
    box(.15, .52, .13, mat('#e5e7eb'), .1, -1.1, w - .08, g); box(.15, .1, .27, blk, .1, -.12, .3, g); box(.08, .06, .1, mat('#e5e7eb'), .06, -.25, 1.0, g); box(.08, .08, .22, blk, .06, -h + .12, w - .45, g);
    if (p.form !== 'ITX') { box(.13, .5, .5, hs, .09, -h + .75, w - .5, g); box(.1, .3, .1, blk, .07, -h + .45, w - .08, g) }
    box(.36, .95, .3, mat(p.white ? '#e9ebef' : '#26292f', { m: .4 }), .2, -.75, .15, g);
    for (let i = 0; i < 6; i++) cyl(.03, .03, .1, mat('#30343d', { m: .5 }), .08, -.45 - (i % 3) * .12, .38 + Math.floor(i / 3) * .12, g, 10).rotation.z = Math.PI / 2;
    const ys = p.form === 'ITX' ? [-.15, -h + .15] : [-.15, -1.45, -h + .15], zs = p.form === 'ATX' ? [.15, 1.4, w - .15] : [.15, w - .15];
    return { g, screws: ys.flatMap(y => zs.map(z => [.04, y, z, [1, 0, 0]])) };
  }
  function cpuModel(p) {
    const g = new THREE.Group(), intel = p.socket === 'LGA1700'; box(.02, .48, intel ? .4 : .48, mat('#1f6f43'), 0, 0, 0, g); box(.035, .36, .36, mat('#d8dbe2', { m: .85, r: .28 }), .025, 0, 0, g);
    const b = p.name.split(' ').slice(1); decal(g, .34, .34, textPanel(512, 512, '#d3d6dc', [{ t: intel ? 'intel' : 'AMD', s: 110, y: .3, c: '#3f4248', wt: 900 }, { t: b.join(' ').toUpperCase(), s: 44, y: .62, c: '#3f4248' }]), .044, 0, 0, Math.PI / 2);
    return { g, screws: [] };
  }
  function airModel(p) {
    const g = new THREE.Group(), h = p.h / 100, cu = mat('#c77b47', { m: .85, r: .3 }), fin = mat(light(p.col) && p.col !== '#c7ccd4' ? '#eef0f3' : '#c7ccd4', { m: .7, r: .35, map: light(p.col) && p.col !== '#c7ccd4' ? null : brushed() });
    box(.08, .45, .45, cu, .06, 0, 0, g);
    if (h < .6) { box(h - .25, .9, .9, fin, .1 + (h - .25) / 2, 0, 0, g); const f = makeFan(.85, .14, { col: p.fan, blade: p.blade }); f.rotation.y = Math.PI / 2; f.position.x = h - .07; g.add(f) }
    else {
      for (let i = 0; i < 4; i++) cyl(.03, .03, h - .1, cu, (h - .1) / 2 + .05, -.18 + i * .12, 0, g, 10).rotation.z = Math.PI / 2;
      const n = Math.floor((h - .4) / .045); for (let i = 0; i < n; i++) box(.018, 1.2, .55, fin, .38 + i * .045, 0, 0, g);
      const capC = light(p.col) && p.col !== '#c7ccd4' ? '#f4f5f7' : '#1b1d22';
      box(.03, 1.22, .57, mat(capC, { m: .5 }), h - .02, 0, 0, g);
      decal(g, .55, 1.0, textPanel(256, 512, capC, [{ t: p.name.split(' ').slice(0, 2).join(' ').toUpperCase(), s: 36, y: .5, c: light(capC) ? '#3f4248' : '#e5e7eb' }], -Math.PI / 2), h - .003, 0, 0, Math.PI / 2);
      const fs = Math.min(1.2, h * .75), f = makeFan(fs, .25, { col: p.fan, blade: p.blade, rgb: p.rgb }); f.position.set(.38 + (n * .045) / 2, 0, .42); g.add(f);
      if (p.id === 'd15') { const f2 = makeFan(fs, .25, { col: p.fan, blade: p.blade }); f2.position.set(.38 + (n * .045) / 2, 0, -.42); g.add(f2) }
    }
    return { g, screws: [[.11, .22, .22, [1, 0, 0]], [.11, -.22, .22, [1, 0, 0]], [.11, .22, -.22, [1, 0, 0]], [.11, -.22, -.22, [1, 0, 0]]] };
  }
  function aioModels(p) {
    const pump = new THREE.Group(), L = p.rad / 100, rad = new THREE.Group(), fc = mat(light(p.col) ? '#f4f5f7' : '#1b1d22', { m: .3, r: .4 });
    cyl(.34, .34, .26, fc, .14, 0, 0, pump, 32).rotation.z = Math.PI / 2;
    if (p.lcd) { const lt = ctex(256, 256, c => { const gr = c.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, '#7c3aed'); gr.addColorStop(1, '#0b0c0f'); c.fillStyle = gr; c.beginPath(); c.arc(128, 128, 128, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = font(800, 70); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('42°', 128, 128) }); const d = new THREE.Mesh(new THREE.CircleGeometry(.28, 32), new THREE.MeshBasicMaterial({ map: lt, toneMapped: false })); d.rotation.y = Math.PI / 2; d.position.x = .275; pump.add(d) }
    else decal(pump, .4, .14, textPanel(256, 96, light(p.col) ? '#f4f5f7' : '#1b1d22', [{ t: p.name.split(' ')[0].toUpperCase(), s: 40, y: .5, c: light(p.col) ? '#3f4248' : '#e5e7eb' }]), .272, 0, 0, Math.PI / 2);
    if (p.rgb) { const rm = mat('#000000', { e: 0xffffff, ei: 0 }); const tr = new THREE.Mesh(new THREE.TorusGeometry(.33, .02, 8, 40), rm); tr.rotation.y = Math.PI / 2; tr.position.x = .27; pump.add(tr); rgbM.push(rm) }
    box(.08, .5, .5, mat('#c77b47', { m: .85 }), .02, 0, 0, pump);
    box(1.2, .27, L, mat(light(p.col) ? '#e9ebef' : '#141518', { m: .4 }), 0, 0, 0, rad); box(1.0, .2, L - .3, mat('#2a2e37', { r: .9 }), 0, -.04, 0, rad);
    const nF = Math.round(L / 1.2); for (let i = 0; i < nF; i++) { const f = makeFan(1.18, .25, { col: p.fan, blade: p.blade, rgb: p.rgb }); f.rotation.x = Math.PI / 2; f.position.set(0, -.27, -L / 2 + .6 + i * 1.2); rad.add(f) }
    return { pump, rad, L, pumpScrews: [[.07, .2, .2, [1, 0, 0]], [.07, -.2, .2, [1, 0, 0]], [.07, .2, -.2, [1, 0, 0]], [.07, -.2, -.2, [1, 0, 0]]], radScrews: [[.4, .14, -L / 2 + .15, [0, 1, 0]], [-.4, .14, -L / 2 + .15, [0, 1, 0]], [.4, .14, L / 2 - .15, [0, 1, 0]], [-.4, .14, L / 2 - .15, [0, 1, 0]]] };
  }
  function ramModel(p) {
    const g = new THREE.Group(); box(.3, 1.33, .03, mat('#166534'), 0, 0, 0, g); const sp = mat(p.col, { m: .5, r: .35 });
    box(.27, 1.3, .02, sp, .02, 0, .028, g); box(.27, 1.3, .02, sp, .02, 0, -.028, g);
    const lm = mat(p.rgb ? '#f4f5f7' : p.acc, { e: p.rgb ? 0xffffff : 0, ei: 0, op: p.rgb ? .9 : 0 }); box(.04, 1.3, .07, lm, .17, 0, 0, g); if (p.rgb) rgbM.push(lm);
    const lab = textPanel(128, 512, p.col, [{ t: p.name.split(' ').slice(0, 2).join(' ').toUpperCase(), s: 30, y: .45, c: light(p.col) ? '#3f4248' : (p.acc === '#1c1d20' ? '#9aa0ab' : p.acc) }, { t: `${p.mem} · ${p.gb} GB`, s: 22, y: .8, c: '#9aa0ab' }], -Math.PI / 2);
    decal(g, .25, 1.26, lab, .02, 0, .039); decal(g, .25, 1.26, lab, .02, 0, -.039, Math.PI);
    box(.04, 1.2, .032, mat('#d4af37', { m: .9, r: .3 }), -.16, 0, 0, g); return { g, screws: [] };
  }
  function storageModel(p) {
    const g = new THREE.Group();
    if (p.kind === 'm2') { box(.025, .22, .8, mat('#0f172a'), 0, 0, .4, g); decal(g, .74, .2, textPanel(768, 200, p.col, [{ t: p.name.replace(/\(.*\)/, '').trim(), s: 54, y: .5, c: '#f2f3f5' }]), .014, 0, .42, Math.PI / 2); box(.03, .18, .05, mat('#d4af37', { m: .9 }), 0, 0, .02, g); return { g, screws: [[.03, 0, .8, [1, 0, 0]]] } }
    if (p.kind === 'ssd25') { box(.7, .07, 1.0, mat(p.col, { m: .4 }), 0, 0, 0, g); decal(g, .62, .9, textPanel(256, 360, p.col, [{ t: p.name.split(' ')[0].toUpperCase(), s: 40, y: .3 }, { t: p.name.split(' ').slice(1, 3).join(' '), s: 46, y: .5 }, { t: p.tb + ' TB SSD', s: 34, y: .7, c: '#9aa0ab' }]), 0, .036, 0, 0, -Math.PI / 2); return { g, screws: [[.28, .04, -.4, [0, 1, 0]], [-.28, .04, -.4, [0, 1, 0]]] } }
    box(1.02, .26, 1.47, mat('#9aa0ab', { m: .75, r: .35, map: brushed() }), 0, 0, 0, g); decal(g, .9, 1.0, textPanel(300, 330, '#e5e7eb', [{ t: p.name.split(' ').slice(0, 2).join(' '), s: 34, y: .25, c: '#1b1d22' }, { t: p.tb + ' TB', s: 70, y: .55, c: p.col }, { t: '7200 RPM · SATA', s: 22, y: .8, c: '#55595f' }]), 0, .131, -.1, 0, -Math.PI / 2);
    box(.9, .03, 1.2, mat('#14532d'), 0, -.14, 0, g); return { g, screws: [[.42, .14, -.6, [0, 1, 0]], [-.42, .14, -.6, [0, 1, 0]], [.42, .14, .6, [0, 1, 0]], [-.42, .14, .6, [0, 1, 0]]] };
  }
  function gpuModel(p) {
    const g = new THREE.Group(), L = p.len / 100, Hh = p.h / 100, t = p.slots * .2;
    box(Hh, t, L, mat(p.col, { m: .45, r: .38 }), Hh / 2, -t / 2, L / 2, g); box(Hh, .03, L, mat(light(p.col) ? '#f4f5f7' : '#2a2d33', { m: .6, r: .3, map: light(p.col) ? null : brushed() }), Hh / 2, .015, L / 2, g);
    const gl = mat(p.acc, { e: p.rgb ? 0xffffff : 0, ei: 0 }); box(.02, .05, L * .8, gl, Hh + .005, -t * .3, L / 2, g); if (p.rgb) rgbM.push(gl);
    const fs = Math.min(.95, (L - .2) / p.fans); for (let i = 0; i < p.fans; i++) { const f = makeFan(fs, .1, { col: p.col, blade: light(p.col) ? '#e9ebef' : '#1b1d22' }); f.rotation.x = Math.PI / 2; f.position.set(Hh / 2, -t - .01, .15 + fs / 2 + i * fs); g.add(f) }
    box(.06, .05, .9, mat('#d4af37', { m: .9 }), .03, -.03, .55, g);
    box(.3, t + .1, .03, mat('#9aa0ab', { m: .85, r: .3 }), .15, -t / 2, -.06, g);
    box(.12, .14, .3, mat('#111214'), Hh - .06, .07, L * .65, g);
    const m = p.name.match(/(GeForce RTX \d+( Ti)?( SUPER)?|Radeon RX \d+( XTX| XT)?|Arc B\d+)/i), short = m ? m[0].toUpperCase() : 'GPU';
    decal(g, Math.min(L * .8, 2.4), Math.min(t * .6, .3), textPanel(1024, 128, p.col, [{ t: short, s: 70, y: .52, c: light(p.col) ? '#3f4248' : p.acc === '#9aa0ab' ? '#e5e7eb' : p.acc }]), Hh + .002, -t / 2, L / 2, Math.PI / 2);
    return { g, screws: [[.3, -.06, -.06, [1, 0, 0]], [.3, -.26, -.06, [1, 0, 0]]] };
  }
  function psuModel(p) {
    const g = new THREE.Group(), [x, y, z] = p.form === 'SFX' ? [1.25, .63, 1.0] : [1.5, .86, 1.4]; box(x, y, z, mat(p.col, { m: .45, r: .45 }), 0, 0, 0, g);
    const gr = new THREE.Mesh(new THREE.CircleGeometry(y * .55, 40), mat('#0b0c0f', { r: .9 })); gr.rotation.x = Math.PI / 2; gr.position.y = -y / 2 - .002; g.add(gr);
    decal(g, x * .86, y * .84, textPanel(640, 360, p.col, [{ t: p.name.split(' ').slice(0, light(p.col) ? 1 : 2).join(' ').toUpperCase(), s: 58, y: .28, c: light(p.col) ? '#3f4248' : p.acc }, { t: p.w + ' W', s: 110, y: .6, c: light(p.col) ? '#1b1d22' : '#f2f3f5' }, { t: '80 PLUS ' + p.eff.toUpperCase(), s: 34, y: .87, c: '#9aa0ab', wt: 600 }]), x / 2 + .002, 0, 0, Math.PI / 2);
    for (let i = 0; i < 5; i++) box(.18, .12, .04, mat('#0b0c0f'), -x * .33 + i * x * .17, y * .17, z / 2 + .01, g);
    return { g, dims: [x, y, z], screws: [[-x / 2 + .1, y / 2 - .1, -z / 2 - .005, [0, 0, -1]], [x / 2 - .1, y / 2 - .1, -z / 2 - .005, [0, 0, -1]], [-x / 2 + .1, -y / 2 + .1, -z / 2 - .005, [0, 0, -1]], [x / 2 - .1, -y / 2 + .1, -z / 2 - .005, [0, 0, -1]]] };
  }
  function pasteModel(p) { const g = new THREE.Group(); cyl(.06, .06, .7, mat('#e5e7eb', { r: .3 }), 0, 0, 0, g).rotation.x = Math.PI / 2; cyl(.062, .062, .4, mat(p.col), 0, 0, -.05, g).rotation.x = Math.PI / 2; cyl(.02, .05, .12, mat('#9aa0ab'), 0, 0, .41, g).rotation.x = Math.PI / 2; return { g, screws: [] } }

  /* ---------- gépház ---------- */
  function buildCase(p) {
    if (caseG) { scene.remove(caseG); const old = caseFans.map(f => f.r); rotors = rotors.filter(r => !old.includes(r)) }
    caseP = p; caseFans = []; const { W, H, D, az, ay } = G(); caseG = new THREE.Group(); scene.add(caseG);
    const st = mat(p.col, { m: light(p.col) ? .15 : .35, r: .42 }), dark = mat(light(p.col) ? '#d0d3d9' : '#0f1013', { m: .3, r: .5 });
    box(.05, H, D, st, -W / 2, H / 2, 0, caseG); box(W, .05, D, st, 0, .03, 0, caseG);
    box(W, .05, D, mat(p.col, { r: .6, map: meshTex(p.col) }), 0, H, 0, caseG); box(W, H, .06, st, 0, H / 2, -D / 2, caseG);
    if (p.glassFront) box(W, H, .04, mat('#9ec5ff', { op: .16, r: .05, m: 0 }), 0, H / 2, D / 2, caseG);
    else if (p.wood) { box(W, H, .08, st, 0, H / 2, D / 2, caseG); box(W * .55, H * .92, .03, mat('#ffffff', { map: woodTex(), r: .7 }), -W * .1, H / 2, D / 2 + .05, caseG) }
    else box(W, H, .08, mat(p.col, { r: .7, map: meshTex(p.col) }), 0, H / 2, D / 2, caseG);
    for (const [x, y, z, w, h, d] of [[W / 2, H, 0, .06, .06, D], [W / 2, .04, 0, .06, .06, D], [W / 2, H / 2, D / 2, .06, H, .06], [W / 2, H / 2, -D / 2, .06, H, .06]]) box(w, h, d, st, x, y, z, caseG);
    box(W - .1, .85, D - 1.9, dark, 0, .45, D / 2 - (D - 1.9) / 2 - .05, caseG);
    decal(caseG, 1.1, .4, textPanel(512, 180, light(p.col) ? '#d0d3d9' : '#0f1013', [{ t: p.name.split(' (')[0].toUpperCase(), s: 40, y: .5, c: light(p.col) ? '#55595f' : '#6b7180' }]), W / 2 - .045, .5, D / 2 - .9, Math.PI / 2);
    box(.02, 1.0, .5, mat('#0b0c0f'), -W / 2 + .03, ay - .75, az - .15, caseG);
    for (let i = 0; i < 7; i++) box(.02, .1, .05, mat('#3a3f48', { m: .6 }), -W / 2 + .3, ay - 1.55 - i * .2, -D / 2 + .04, caseG);
    const fcol = p.fans.col || '#16181d';
    if (p.fans.n) {
      for (let i = 0; i < p.fans.n - 1; i++) { const f = makeFan(1.2, .25, { col: fcol, rgb: p.fans.rgb }); f.position.set(0, 1.6 + i * 1.3, D / 2 - .22); caseG.add(f); caseFans.push({ g: f, front: true, r: f.rotorRef }) }
      const rf = makeFan(1.1, .25, { col: fcol, rgb: p.fans.rgb }); rf.position.set(0, ay - .6, -D / 2 + .18); caseG.add(rf); caseFans.push({ g: rf, r: rf.rotorRef });
    }
    for (const [x, z] of [[-W / 2 + .2, -D / 2 + .3], [W / 2 - .2, -D / 2 + .3], [-W / 2 + .2, D / 2 - .3], [W / 2 - .2, D / 2 - .3]]) cyl(.12, .14, .06, mat('#111214'), x, .0, z, caseG);
    const btn = cyl(.08, .08, .04, mat('#9aa0ab', { m: .8 }), .5, H + .03, D / 2 - .3, caseG); btn.userData.power = true;
    const pg = new THREE.Group(); box(.03, H - .12, D - .12, mat(light(p.col) ? '#dbe7f5' : '#9ec5ff', { op: .14, r: .05, m: 0 }), 0, 0, 0, pg);
    const fr = mat(light(p.col) ? p.col : '#1b1d22', { m: .4 }); box(.04, .06, D - .1, fr, 0, (H - .1) / 2, 0, pg); box(.04, .06, D - .1, fr, 0, -(H - .1) / 2, 0, pg); box(.04, H - .1, .06, fr, 0, 0, (D - .1) / 2, pg); box(.04, H - .1, .06, fr, 0, 0, -(D - .1) / 2, pg);
    if (panel) { scene.remove(panel.objs[0].o); items = items.filter(i => i !== panel) }
    panel = { uid: 'panel', cat: 'panel', p: { name: 'Üveg oldalpanel', spec: 'Két recéscsavar rögzíti a ház hátulján' }, objs: [{ o: pg, inst: { p: V(W / 2 + .03, H / 2, 0), q: Q() }, bench: { p: V(.3, H / 2 - .05, -D / 2 - 1.2), q: Q(0, 90 * DEG, -7 * DEG) } }], screws: [], slot: 'panel' };
    scene.add(pg); pg.traverse(o => { if (o.isMesh && !META.get(o)) META.set(o, { item: panel }) });
    addScrew(panel, pg, -.01, H / 2 - .45, -D / 2 + .02, [0, 0, -1]); addScrew(panel, pg, -.01, -H / 2 + .45, -D / 2 + .02, [0, 0, -1]);
    panel.screws.forEach(s => s.m.scale.set(1.6, 1.4, 1.6)); panel.mats = [];
    items.push(panel); place(panel, 'inst'); panel.screws.forEach(s => { s.in = true; placeScrew(s) }); panelOpened = false;
  }

  /* ---------- tárgyak ---------- */
  const ANCH = { mb: [4.4, -1.6], gpu: [4.2, 1.95], psu: [6.6, .4], cooler: [2.6, -.6], rad: [6.4, -2.3], cpu: [2.6, 1.0], paste: [3.2, 1.0], ram: [5.0, .35], storage: [6.7, 2.4], fans: [2.9, 2.7] };
  const BQ = { mb: Q(0, 0, 90 * DEG), cpu: Q(0, 0, 90 * DEG), cooler: Q(0, 0, 90 * DEG), pump: Q(0, 0, 90 * DEG), rad: Q(), ram: Q(90 * DEG, 0, 0), m2: Q(0, 0, 90 * DEG), disk: Q(), gpu: Q(), psu: Q(0, .5, 0), fan: Q(90 * DEG, 0, 0), paste: Q() };
  function benchPose(o, q, sx, sz) { const t = o.clone(); t.position.set(0, 0, 0); t.quaternion.copy(q); t.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(t), c = b.getCenter(V(0, 0, 0)); return { p: V(sx - c.x, -b.min.y + .03, sz - c.z), q: q.clone() } }
  const countCat = cat => items.filter(i => i.cat === cat && i !== panel).length;
  function newItem(cat, p) {
    const it = { uid: uidN++, cat, p, objs: [], screws: [], slot: null }, k = countCat(cat), [ax, az] = ANCH[cat] || [3, 0], off = cat === 'ram' ? [k * .32, 0] : cat === 'storage' ? [0, -k * .6] : [k * .35, k * .35];
    const add = (o, bq, sx, sz) => { const bp = benchPose(o, bq, sx, sz); scene.add(o); o.traverse(m => { if (m.isMesh) META.set(m, { item: it }) }); const ob = { o, bench: bp, inst: null }; it.objs.push(ob); return ob };
    if (cat === 'cooler' && p.type === 'aio') { const a = aioModels(p); add(a.pump, BQ.pump, ax + off[0], az + off[1]); add(a.rad, BQ.rad, ANCH.rad[0] + off[0], ANCH.rad[1] + off[1]); it.L = a.L; a.pumpScrews.forEach(s => addScrew(it, a.pump, ...s)); a.radScrews.forEach(s => addScrew(it, a.rad, ...s)); return finish(it) }
    if (cat === 'fans') { for (let i = 0; i < p.n; i++) { const f = makeFan(1.2, .25, { col: p.col, blade: p.blade, rgb: p.rgb }); add(f, BQ.fan, ax + off[0] + i * 1.3 - 1.3, az + off[1]);[[.5, .5], [-.5, .5], [.5, -.5], [-.5, -.5]].forEach(([x, y]) => addScrew(it, f, x, y, -.13, [0, 0, -1])) } return finish(it) }
    const r = { mb: () => mbModel(p, it), cpu: () => cpuModel(p), ram: () => ramModel(p), storage: () => storageModel(p), gpu: () => gpuModel(p), psu: () => psuModel(p), paste: () => pasteModel(p), cooler: () => airModel(p) }[cat]();
    if (r.dims) it.dims = r.dims;
    add(r.g, cat === 'storage' ? (p.kind === 'm2' ? BQ.m2 : BQ.disk) : BQ[cat] || Q(), ax + off[0], az + off[1]); r.screws.forEach(s => addScrew(it, r.g, ...s));
    return finish(it);
  }
  function finish(it) { it.mats = []; it.objs.forEach(ob => ob.o.traverse(m => { if (m.isMesh && m.material && !it.mats.includes(m.material)) it.mats.push(m.material) })); items.push(it); place(it, 'bench'); return it }
  function place(it, which) { it.objs.forEach(ob => { const ps = ob[which]; if (ps) { ob.o.position.copy(ps.p); ob.o.quaternion.copy(ps.q) } }); it.screws.forEach(s => placeScrew(s)) }
  function removeItem(it) { it.objs.forEach(ob => scene.remove(ob.o)); if (it.tubes) it.tubes.forEach(t => scene.remove(t)); items = items.filter(x => x !== it) }

  /* ---------- foglalatok ---------- */
  const at = s => { const id = slots[s]; return id ? items.find(i => i.uid === id) : null };
  const mb = () => at('mb'), secured = it => !!it && it.screws.every(s => s.in);
  const freeRam = () => { const m = mb(); return m ? RZ[m.p.slots].map((_, i) => i).filter(i => !slots['ram' + i]) : [] };
  function targets(it) {
    const g = G(), m = mb(), out = [];
    if (it.cat === 'mb') out.push({ slot: 'mb', poses: [{ p: V(g.bx, g.ay, g.az), q: Q() }] });
    if (it.cat === 'psu') { const [x, y, z] = it.dims; out.push({ slot: 'psu', poses: [{ p: V(-g.W / 2 + .1 + x / 2, .06 + y / 2, -g.D / 2 + .08 + z / 2), q: Q() }] }) }
    if (it.cat === 'storage' && it.p.kind !== 'm2' && !slots.sata) out.push({ slot: 'sata', poses: [{ p: V(.15, .88 + (it.p.kind === 'hdd' ? .13 : .035), g.D / 2 - 1.0), q: Q() }] });
    if (it.cat === 'fans') { const ys = [1.6, 2.9, 4.2].filter(y => y < g.H - .5); out.push({ slot: 'fans', poses: it.objs.map((_, i) => ({ p: V(0, ys[Math.min(i, ys.length - 1)], g.D / 2 - .22 - (i >= ys.length ? .3 : 0)), q: Q() })) }) }
    if (!m) return out;
    const M = (x, y, z) => V(g.bx + x, g.ay + y, g.az + z), pf = m.p.form === 'ITX' ? -1.5 : -1.62;
    if (it.cat === 'cpu') out.push({ slot: 'cpu', poses: [{ p: M(.085, -.78, .62), q: Q() }] });
    if (it.cat === 'paste') out.push({ slot: 'paste', poses: [{ p: M(.6, -.78, .62), q: Q(0, 90 * DEG, 0) }] });
    if (it.cat === 'cooler') out.push({ slot: 'cooler', poses: it.p.type === 'air' ? [{ p: M(.12, -.78, .62), q: Q() }] : [{ p: M(.12, -.78, .62), q: Q() }, { p: V(.15, g.H - .32, g.az + .2 + it.L / 2), q: Q() }] });
    if (it.cat === 'ram') (m.p.slots === 4 ? [1, 3, 0, 2] : [0, 1]).filter(i => !slots['ram' + i]).forEach(i => out.push({ slot: 'ram' + i, poses: [{ p: M(.2, -.78, RZ[m.p.slots][i]), q: Q() }], pref: i === 1 || i === 3 || m.p.slots === 2 }));
    if (it.cat === 'storage' && it.p.kind === 'm2') { if (!slots.m2a) out.push({ slot: 'm2a', poses: [{ p: M(.07, -1.25, .12), q: Q() }] }); if (m.p.m2 > 1 && !slots.m2b) out.push({ slot: 'm2b', poses: [{ p: M(.07, -2.1, .12), q: Q() }] }) }
    if (it.cat === 'gpu') out.push({ slot: 'gpu', poses: [{ p: M(.06, pf, .05), q: Q() }] });
    return out;
  }

  /* ---------- szabályok ---------- */
  function installBlock(it) {
    if (!caseP) return 'Előbb rendelj egy gépházat!';
    if (panel.slot) return 'Előbb vedd le az üveg oldalpanelt: csavarozd ki a 2 recéscsavart a ház hátulján (csavarhúzó), majd kattints a panelre!';
    const m = mb();
    if (it.cat === 'mb') { if (slots.mb) return 'Már van alaplap a házban.'; if (!caseP.fits.includes(it.p.form)) return `Ez ${it.p.form} alaplap, de a házba (${caseP.name}) csak ${caseP.fits.join('/')} fér!`; return null }
    if (it.cat === 'psu') { if (slots.psu) return 'Már van tápegység.'; if (it.p.form !== caseP.psu) return `${it.p.form} tápegység nem illik a házba: ${caseP.psu} méret kell!`; return null }
    if (it.cat === 'fans') return slots.fans ? 'Az előlapon már vannak ventilátorok.' : null;
    if (it.cat === 'storage' && it.p.kind !== 'm2') return slots.sata ? 'A meghajtóhely foglalt.' : null;
    if (!m) return 'Előbb az alaplapot szereld be!';
    if (!secured(m)) return `Az alaplap még nincs rögzítve: csavarozd be mind a ${m.screws.length} csavart!`;
    if (it.cat === 'cpu') { if (slots.cpu) return 'Már van processzor a foglalatban.'; if (it.p.socket !== m.p.socket) return `A processzor (${it.p.socket}) nem illik az alaplap foglalatába (${m.p.socket})!`; return null }
    if (it.cat === 'paste') { if (!slots.cpu) return 'Előbb tedd be a processzort!'; if (slots.cooler) return 'A hűtő alatt nem fér hozzá – előbb szereld ki a hűtőt!'; if (paste.state === 'fresh') return 'Már van friss paszta a processzoron.'; if (paste.state === 'old') return 'Előbb töröld le a régi, kiszáradt pasztát (kattints a processzorra)!'; return null }
    if (it.cat === 'cooler') { if (slots.cooler) return 'Már van hűtő.'; if (!slots.cpu) return 'Előbb a processzort tedd be!'; if (!it.p.sockets.includes(m.p.socket)) return `Ez a hűtő nem támogatja a(z) ${m.p.socket} foglalatot!`; if (it.p.type === 'aio' && caseP.top < it.p.rad) return `A ház tetejére legfeljebb ${caseP.top || 0} mm-es radiátor fér, ez ${it.p.rad} mm-es!`; return null }
    if (it.cat === 'ram') { if (it.p.mem !== m.p.mem) return `Ez ${it.p.mem}-modul, az alaplap ${m.p.mem}-t vár – máshol van a bevágás, nem illik bele!`; if (!freeRam().length) return 'Nincs több szabad memóriahely.'; return null }
    if (it.cat === 'storage') { if (!slots.m2a) return null; if (m.p.m2 < 2 || slots.m2b) return 'Nincs szabad M.2 hely.'; if (slots.gpu) return 'A második M.2 hely a videokártya alatt van – előbb vedd ki a videokártyát!'; return null }
    if (it.cat === 'gpu') { if (slots.gpu) return 'Már van videokártya.'; if (it.p.len > caseP.gpuMax) return `A videokártya ${it.p.len} mm hosszú, de a házba csak ${caseP.gpuMax} mm fér!`; return null }
    return null;
  }
  const CONNREQ = { c24: ['mb', 'psu'], ceps: ['mb', 'psu'], cgpu: ['gpu', 'psu'], csata: ['sata', 'mb', 'psu'], cfp: ['mb'], cfan: ['mb', 'cooler'] };
  function connBlock(k) { if (!caseP) return 'Nincs gépház.'; if (panel.slot) return 'Előbb vedd le az oldalpanelt!'; const miss = CONNREQ[k].filter(s => !slots[s]); return miss.length ? 'Ehhez előbb be kell szerelni: ' + miss.map(s => ({ mb: 'alaplap', psu: 'tápegység', gpu: 'videokártya', sata: 'SATA-meghajtó', cooler: 'hűtő' }[s])).join(', ') + '.' : null }
  function removeBlock(it) {
    if (it.screws.some(s => s.in)) return `Előbb csavarozd ki: ${it.screws.filter(s => s.in).length} csavar (csavarhúzó!)`;
    const s = it.slot, dep = [];
    if (s === 'mb') { ['cpu', 'cooler', 'gpu', 'm2a', 'm2b', 'ram0', 'ram1', 'ram2', 'ram3'].forEach(k => slots[k] && dep.push(at(k).p.name)); ['c24', 'ceps', 'cfp', 'cfan', 'csata'].forEach(k => conns[k] && dep.push(CNAME[k])) }
    if (s === 'cpu' && slots.cooler) dep.push('a hűtőt'); if (s === 'gpu' && conns.cgpu) dep.push(CNAME.cgpu); if (s === 'psu') ['c24', 'ceps', 'cgpu', 'csata'].forEach(k => conns[k] && dep.push(CNAME[k]));
    if (s === 'cooler' && conns.cfan) dep.push(CNAME.cfan); if (s === 'sata' && conns.csata) dep.push(CNAME.csata); if (s === 'm2b' && slots.gpu) dep.push('a videokártyát');
    return dep.length ? 'Előbb ezt kell eltávolítani: ' + dep.join(', ') + '.' : null;
  }
  function panelBlock() { const c = at('cooler'); if (c && c.p.type === 'air' && c.p.h > caseP.coolMax) return `Az oldalpanel nem zárható: a hűtő ${c.p.h} mm magas, a házba csak ${caseP.coolMax} mm fér!`; return null }

  /* ---------- animáció ---------- */
  function tweenObj(o, to, dur, lift) { return new Promise(res => { const from = { p: o.position.clone(), q: o.quaternion.clone() }, mid = from.p.clone().lerp(to.p, .5); mid.y = Math.max(from.p.y, to.p.y) + lift; tweens.push({ o, from, to, mid, t: 0, dur, res }) }) }
  function stepTweens(dt) {
    for (const tw of [...tweens]) { tw.t = Math.min(1, tw.t + dt / tw.dur); const e = tw.t < .5 ? 2 * tw.t * tw.t : 1 - Math.pow(-2 * tw.t + 2, 2) / 2, a = (1 - e) * (1 - e), b = 2 * (1 - e) * e, c = e * e;
      tw.o.position.set(a * tw.from.p.x + b * tw.mid.x + c * tw.to.p.x, a * tw.from.p.y + b * tw.mid.y + c * tw.to.p.y, a * tw.from.p.z + b * tw.mid.z + c * tw.to.p.z); tw.o.quaternion.copy(tw.from.q).slerp(tw.to.q, e);
      if (tw.t >= 1) { tweens.splice(tweens.indexOf(tw), 1); tw.res() } }
  }
  const busyMsg = () => toast('Egy pillanat, még az előző lépésen dolgozom…', '#9aa0ab', 1100);

  /* ---------- csavarhúzó ---------- */
  function makeDriver() {
    const g = new THREE.Group(), h = new THREE.Group(); g.add(h);
    cyl(.07, .085, .5, mat('#f59e0b', { r: .5 }), 0, .55, 0, h, 16); for (let i = 0; i < 5; i++) cyl(.088, .088, .02, mat('#1b1d22'), 0, .38 + i * .08, 0, h, 16);
    cyl(.09, .07, .08, mat('#1b1d22'), 0, .26, 0, h, 16); cyl(.018, .018, .32, mat('#c9ccd3', { m: .95, r: .2 }), 0, .1, 0, h, 8); box(.05, .03, .012, mat('#9aa0ab', { m: .9 }), 0, -.06, 0, h);
    g.visible = false; scene.add(g); return { g, h };
  }
  const anyBusy = () => items.some(i => i.screws.some(x => x.busy));
  async function turnScrew(s, dirIn) {
    if (s.busy) return; s.busy = true; const w = new THREE.Vector3(), q = new THREE.Quaternion();
    s.obj.updateMatrixWorld(true); s.obj.getWorldQuaternion(q); const nW = s.n.clone().applyQuaternion(q);
    driver.g.visible = true; driver.g.quaternion.setFromUnitVectors(V(0, 1, 0), nW); const steps = auto ? 6 : 14;
    for (let k = 0; k <= steps; k++) {
      const f = dirIn ? 1 - k / steps : k / steps; s.m.position.copy(s.base).addScaledVector(s.n, .14 * f); s.m.rotateY(dirIn ? .5 : -.5);
      s.m.getWorldPosition(w); driver.g.position.copy(w).addScaledVector(nW, .05); driver.h.rotation.y += dirIn ? .5 : -.5;
      if (k % 3 === 0) beep(dirIn ? 1700 + k * 20 : 1300 - k * 20, .02, 'square', .025);
      await wait(auto ? 18 : 38);
    }
    s.in = dirIn; s.busy = false; beep(dirIn ? 900 : 500, .05, 'triangle', .05); placeScrew(s); if (!dirIn && s.item === panel) panelOpened = true;
    setTimeout(() => { if (!anyBusy() && tool !== 'driver') driver.g.visible = false }, 250);
    renderUI();
    const it = s.item; if (dirIn && secured(it)) toast(`Rögzítve: ${it.p.name}`, '#4ade80', 1300);
    if (!dirIn && it.screws.every(x => !x.in)) toast(it === panel ? 'Csavarok kint – kattints a panelre a levételhez!' : `Minden csavar kint: ${it.p.name} kiszerelhető.`, '#5b9dff', 1700);
  }
  async function screwAll(it, dirIn) { for (const s of it.screws) if (s.in !== dirIn) await turnScrew(s, dirIn); driver.g.visible = false }
  function focusScrews(it) {
    const s = it.screws.find(x => !x.in) || it.screws[0]; if (!s) return; const q = new THREE.Quaternion(); s.obj.updateMatrixWorld(true); s.obj.getWorldQuaternion(q); const n = s.n.clone().applyQuaternion(q), w = new THREE.Vector3(); s.m.getWorldPosition(w);
    cam.goalTgt = w.clone(); cam.goalR = 6.5; if (Math.abs(n.y) < .7) { cam.th = Math.atan2(n.z, n.x) + (n.x > .5 ? .35 : 0); cam.ph = 1.15 } else cam.ph = .55;
  }

  /* ---------- be- és kiszerelés ---------- */
  async function install(it, tgt) {
    if (busy) return busyMsg(); const b = it === panel ? panelBlock() : installBlock(it); if (b) { sfx.bad(); toast(b, '#f87171', 3400); return }
    if (it.cat === 'paste') return applyPaste(it, tgt);
    busy = true; clearGhosts(); sel = null; sfx.click();
    if (it === panel) { await tweenObj(panel.objs[0].o, panel.objs[0].inst, .8, .4); panel.slot = 'panel'; panel.screws.forEach(s => placeScrew(s)); busy = false; afterSeat(panel); return }
    const t = tgt || targets(it)[0]; if (!t) { busy = false; return }
    const m = mb();
    if (it.cat === 'cpu') m.lever.rotation.z = -1.2;
    if (it.cat === 'ram') m.clips.filter(c => 'ram' + c.i === t.slot).forEach(c => c.g.rotation.z = c.e * .6);
    it.objs.forEach((ob, i) => ob.inst = t.poses[i] || t.poses[0]);
    await Promise.all(it.objs.map((ob, i) => wait(i * 120).then(() => tweenObj(ob.o, ob.inst, 1.0, 1.4))));
    it.slot = t.slot; slots[t.slot] = it.uid; it.screws.forEach(s => placeScrew(s));
    if (it.cat === 'cpu') { await wait(200); m.lever.rotation.z = 0; beep(600, .08, 'square', .06) }
    if (it.cat === 'ram') { await wait(150); m.clips.filter(c => 'ram' + c.i === t.slot).forEach(c => c.g.rotation.z = 0); beep(1400, .04, 'square', .07); beep(1600, .04, 'square', .07, 0, .07) }
    if (it.cat === 'cooler' && it.p.type === 'aio') makeTubes(it);
    if (it.cat === 'cooler') updBlob();
    if (it.cat === 'fans') caseFans.filter(f => f.front).forEach(f => f.g.visible = false);
    busy = false; afterSeat(it);
    if (it.cat === 'cooler' && paste.state !== 'fresh') toast('Figyelem: friss hővezető paszta nélkül szerelted fel a hűtőt!', '#fbbf24', 3200);
  }
  async function afterSeat(it) {
    renderUI();
    if (!it.screws.length) { toast(`Beszerelve: ${it.p.name}`, '#4ade80', 1300); return }
    if (auto) { await screwAll(it, true); renderUI(); return }
    setTool('driver'); focusScrews(it); toast(`Most csavarozd be a ${it.screws.filter(s => !s.in).length} csavart a csavarhúzóval!`, '#fbbf24', 2600);
  }
  async function uninstall(it) {
    if (busy) return busyMsg(); const b = removeBlock(it);
    if (b && auto && it.screws.some(s => s.in) && !removeBlock({ ...it, screws: [] })) { await screwAll(it, false); return uninstall(it) }
    if (b) { sfx.bad(); toast(b, '#f87171', 3200); if (it.screws.some(s => s.in)) { setTool('driver'); focusScrews(it) } return }
    if (powered) powerOff('A gépet szerelés előtt mindig kapcsold ki!');
    busy = true; clearGhosts(); sel = null; sfx.click();
    if (it === panel) { panel.slot = null; await tweenObj(panel.objs[0].o, panel.objs[0].bench, .8, .4); panel.screws.forEach(s => placeScrew(s)); busy = false; setTool('hand'); renderUI(); toast('Oldalpanel levéve – hozzáférsz a gép belsejéhez.', '#5b9dff', 1500); return }
    const m = mb(), slot = it.slot;
    if (it.cat === 'cpu') m.lever.rotation.z = -1.2;
    if (it.cat === 'cooler') { if (paste.state === 'fresh') paste.state = 'old'; if (it.tubes) { it.tubes.forEach(t => scene.remove(t)); it.tubes = null } }
    if (it.cat === 'cpu') paste = { state: 'none', p: null };
    if (it.cat === 'fans') caseFans.filter(f => f.front).forEach(f => f.g.visible = true);
    delete slots[slot]; it.slot = null; it.screws.forEach(s => placeScrew(s)); updBlob();
    await Promise.all(it.objs.map(ob => tweenObj(ob.o, ob.bench, 1.0, 1.4)));
    if (it.cat === 'cpu') m.lever.rotation.z = 0;
    busy = false; setTool('hand'); renderUI(); toast(`Kiszerelve: ${it.p.name}` + (it.cat === 'cooler' && paste.state === 'old' ? ' – a régi paszta a processzoron maradt!' : ''), '#5b9dff', 1800);
  }
  async function applyPaste(it, tgt) {
    busy = true; clearGhosts(); sel = null; const ob = it.objs[0], t = (tgt || targets(it)[0]).poses[0];
    await tweenObj(ob.o, t, .9, 1.2); paste = { state: 'fresh', p: it.p }; updBlob(); for (let k = 1; k <= 8; k++) { blob.scale.set(.2 + k * .1, 1, .2 + k * .1); await wait(30) } beep(500, .2, 'sine', .04, 200);
    await tweenObj(ob.o, ob.bench, .8, 1.0); busy = false; renderUI(); toast(`Felkentél egy borsónyi pasztát (${it.p.name}).`, '#4ade80', 1600);
  }
  function updBlob() {
    if (!blob) { blob = cyl(.11, .11, .012, mat('#9aa0ab', { r: .9 }), 0, 0, 0, null, 20); blob.rotation.z = Math.PI / 2; scene.add(blob); blob.userData.blob = true }
    const c = at('cpu'); blob.visible = !!c && paste.state !== 'none' && !slots.cooler;
    if (c) { const g = G(); blob.position.set(g.bx + .133, g.ay - .78, g.az + .62) }
    blob.material.color.set(paste.state === 'old' ? '#6b6550' : '#a3a8b3'); blob.scale.set(paste.state === 'old' ? 1.5 : 1, 1, paste.state === 'old' ? 1.5 : 1);
  }
  function makeTubes(it) {
    const [pump, rad] = it.objs, a = pump.o.position, r = rad.o.position, L = it.L;
    it.tubes = [-.12, .12].map(o => { const c = new THREE.CatmullRomCurve3([V(a.x + .2, a.y + o, a.z + .25), V(a.x + .5, a.y + .3 + o, a.z + .6), V(r.x - .2 + o, r.y - .2, r.z - L / 2 + .3), V(r.x + o, r.y - .05, r.z - L / 2 + .1)]); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 40, .055, 10, false), mat('#121316', { r: .45 })); m.castShadow = true; scene.add(m); return m });
  }

  /* ---------- kábelek ---------- */
  function cablePath(k) {
    const g = G(), M = (x, y, z) => V(g.bx + x, g.ay + y, g.az + z), m = mb(), bw = m ? BOARD[m.p.form][1] : 2.44, bh = m ? BOARD[m.p.form][0] : 3.05, ps = at('psu'), pp = ps ? ps.objs[0].o.position : V(0, .5, -1.5), top = pp.y + (ps ? ps.dims[1] / 2 : .43);
    if (k === 'c24') return { r: .07, pts: [V(pp.x + .1, top, pp.z + .4), V(pp.x + .4, top + .5, pp.z + .9), M(.45, -bh + .3, bw + .3), M(.4, -1.1, bw + .35), M(.18, -1.1, bw - .08)] };
    if (k === 'ceps') return { r: .045, pts: [V(pp.x - .4, top, pp.z), V(g.bx + .35, top + .6, -g.D / 2 + .12), V(g.bx + .3, g.ay + .2, -g.D / 2 + .15), M(.3, .25, .25), M(.18, -.12, .3)] };
    if (k === 'cgpu') { const gp = at('gpu'), p = gp.objs[0].o.position, Hh = gp.p.h / 100, L = gp.p.len / 100; return { r: .045, pts: [V(pp.x + .4, top, pp.z + .2), V(pp.x + .7, top + .4, pp.z + 1.2), V(p.x + Hh + .3, p.y + .1, p.z + L * .75), V(p.x + Hh - .06, p.y + .5, p.z + L * .65), V(p.x + Hh - .06, p.y + .16, p.z + L * .65)] } }
    if (k === 'csata') { const d = at('sata').objs[0].o.position; return { r: .035, pts: [M(.15, -bh + .45, bw - .02), M(.4, -bh + .3, bw + .2), V(d.x - .3, d.y + .3, d.z - .6), V(d.x - .55, d.y + .02, d.z - .45)] } }
    if (k === 'cfp') return { r: .03, pts: [V(-.2, .35, g.D / 2 - .15), V(-.4, .6, g.D / 2 - .6), M(.3, -bh - .05, bw - .45), M(.12, -bh + .12, bw - .45)] };
    if (k === 'cfan') { const p = at('cooler').objs[0].o.position; return { r: .025, pts: [V(p.x + .5, p.y + .45, p.z + .5), V(p.x + .35, p.y + .55, p.z + .45), M(.2, -.15, 1.0), M(.1, -.25, 1.0)] } }
  }
  function cableObj(k) { const { r, pts } = cablePath(k), geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, r, 10, false), m = new THREE.Mesh(geo, mat(k === 'cfp' ? '#3a3f48' : '#121316', { r: .45 })); m.castShadow = true; m.userData.conn = k; const e = pts[pts.length - 1]; const plug = box(r * 3.4, r * 3.4, r * 3.4, mat('#0b0c0f'), e.x, e.y, e.z, m); plug.userData.conn = k; scene.add(m); return m }
  async function connect(k) {
    if (busy) return busyMsg(); if (conns[k]) return; const b = connBlock(k); if (b) { sfx.bad(); toast(b, '#f87171', 3000); return }
    const m = cableObj(k), geo = m.geometry; m.children.forEach(c => c.visible = false); cableMesh[k] = m; conns[k] = true; busy = true;
    for (let i = 0; i <= 80; i += 4) { geo.setDrawRange(0, i * 60); await wait(16) } m.children.forEach(c => c.visible = true); beep(1300, .05, 'square', .06); busy = false; renderUI();
    toast(`Bekötve: ${CNAME[k]} – kattanás!`, '#4ade80', 1500);
  }
  async function disconnect(k) {
    if (busy) return busyMsg(); if (!conns[k]) return; if (powered) powerOff('A gépet szerelés előtt kapcsold ki!'); busy = true; const m = cableMesh[k], geo = m.geometry; m.children.forEach(c => c.visible = false);
    for (let i = 80; i >= 0; i -= 5) { geo.setDrawRange(0, i * 60); await wait(14) } scene.remove(m); delete cableMesh[k]; conns[k] = false; busy = false; beep(500, .1, 'triangle', .05, -150); renderUI();
  }

  /* ---------- szellemképek és kijelölés ---------- */
  function clearGhosts() { ghosts.forEach(g => scene.remove(g)); ghosts = []; const m = mb(); if (m) { if (!slots.cpu) m.lever.rotation.z = 0; m.clips.forEach(c => { c.g.rotation.z = 0 }) } }
  function select(it) {
    clearGhosts(); sel = it ? it.uid : null; renderUI(); if (!it || it.slot || it === panel) return;
    const b = installBlock(it); if (b) { toast(b, '#fbbf24', 3000); return }
    const m = mb(); if (it.cat === 'cpu') m.lever.rotation.z = -1.2;
    targets(it).forEach(t => {
      if (it.cat === 'ram') m.clips.filter(c => 'ram' + c.i === t.slot).forEach(c => c.g.rotation.z = c.e * .6);
      it.objs.forEach((ob, i) => {
        const sv = it.screws.map(s => s.m.visible); it.screws.forEach(s => s.m.visible = false); const g = ob.o.clone(true); it.screws.forEach((s, k) => s.m.visible = sv[k]);
        const gm = new THREE.MeshBasicMaterial({ color: t.pref === false ? '#9aa0ab' : '#5b9dff', transparent: true, opacity: .35, depthWrite: false });
        g.traverse(o => { if (o.isMesh) { o.material = gm; o.castShadow = false; META.set(o, { ghost: { it, t } }) } });
        const ps = t.poses[i] || t.poses[0]; g.position.copy(ps.p); g.quaternion.copy(ps.q); g.scale.setScalar(1); g.userData.gm = gm; scene.add(g); ghosts.push(g);
      });
    });
    const t0 = targets(it)[0]; if (t0) { cam.goalTgt = t0.poses[0].p.clone().lerp(V(1.2, 1.8, -.3), .3); cam.goalR = 8.5 }
    if (it.cat === 'ram' && m.p.slots === 4) toast('Tipp: két modulnál a kék helyek (A2 és B2) adnak kétcsatornás, gyorsabb működést – a szürkék nem!', '#5b9dff', 3000);
  }
  function setTool(t) { tool = t; $$('[data-tool]').forEach(b => b.classList.toggle('sel', b.dataset.tool === t)); if (renderer) renderer.domElement.style.cursor = t === 'driver' ? 'crosshair' : 'grab'; if (driver && t !== 'driver' && !anyBusy()) driver.g.visible = false }

  /* ---------- szimuláció és bekapcsolás ---------- */
  function buildState() {
    const g = s => { const i = at(s); return i ? i.p : null }, ramI = [0, 1, 2, 3].filter(i => slots['ram' + i]), cl = at('cooler');
    return { case: caseP, mb: g('mb'), cpu: g('cpu'), cooler: g('cooler'), coolerSecure: secured(cl), paste: paste.state === 'fresh' ? paste.p : null, ram: ramI.map(i => at('ram' + i).p), ramSlots: ramI,
      storage: ['m2a', 'm2b', 'sata'].filter(s => slots[s]).map(s => ({ p: at(s).p, os: os.has(slots[s]), uid: slots[s] })), gpu: g('gpu'), psu: g('psu'), fans: g('fans'), conn: conns };
  }
  async function powerOn() {
    if (busy) return busyMsg(); if (powered) return powerOff(); if (!caseP) return toast('Nincs még gép, amit bekapcsolhatnál!', '#fbbf24');
    const B = buildState(), r = PCSim.post(B); lastPost = r; beep(400, .15, 'sine', .06); clearGhosts(); sel = null;
    if (r.lvl === 0) { sfx.bad(); showRes(r); return }
    powered = true; updPower(); PCSim.start(B); load = 0;
    if (r.beeps) { beep(880, .7, 'square', .06); await wait(900); beep(880, .18, 'square', .06); await wait(300); beep(880, .18, 'square', .06) }
    winCtx.bios = r.bios; winCtx.bootTime = r.boot; WinSim.power(r.scr === 'os' ? 'os' : r.scr === 'noos' ? 'noos' : 'off');
    paintScreen(r);
    if (r.lvl >= 4) setTimeout(() => { if (powered) openMonitor() }, 900);
    showRes(r); if (r.off) setTimeout(() => powerOff(r.d), r.off); renderUI();
  }
  function powerOff(msg) { powered = false; PCSim.stop(); sensors = null; WinSim.power('off'); paintScreen(); rgbM.forEach(m => m.emissiveIntensity = 0); updPower(); closeMonitor(); if (msg) toast(msg, '#fbbf24', 2600); renderUI() }
  function updPower() { const b = $('#b3-power'); if (!b) return; b.classList.toggle('on', powered); b.innerHTML = `${icon('bolt', 18, 2)} ${powered ? 'Kikapcsolás' : 'Bekapcsolás'}` }
  function showRes(r) { const o = $('#b3-res'); o.className = 'b3-res show ' + (r.lvl >= 5 ? 'good' : r.lvl === 4 ? 'warn' : 'bad'); o.innerHTML = `<b>${r.t}</b><span>${r.d}</span>`; clearTimeout(o._t); o._t = setTimeout(() => o.classList.remove('show'), 7000) }
  function paintScreen(r) {
    const c = monitorCtx, w = 1024, h = 576; if (!c) return; r = r || lastPost;
    if (!powered) { c.fillStyle = '#0d0e10'; c.fillRect(0, 0, w, h) }
    else if (r && r.scr === 'nosignal') { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.fillStyle = '#1e293b'; c.fillRect(w / 2 - 170, h / 2 - 40, 340, 80); c.fillStyle = '#cbd5e1'; c.font = font(700, 34); c.textAlign = 'center'; c.fillText('Nincs jel', w / 2, h / 2 + 12); c.textAlign = 'left' }
    else if (r && r.scr === 'bios') { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.font = '26px monospace'; r.bios.forEach((l, i) => { c.fillStyle = l.startsWith('!') ? '#f87171' : '#ddd'; c.fillText(l.replace(/^!/, ''), 30, 50 + i * 36) }) }
    else if (r && r.scr === 'off') { c.fillStyle = '#050505'; c.fillRect(0, 0, w, h) }
    else WinSim.paint(c, w, h);
    monitorTex.needsUpdate = true;
  }
  const winCtx = {
    el: null, bios: [], drives: () => ['m2a', 'm2b', 'sata'].filter(s => slots[s]).map(s => { const it = at(s); return { uid: it.uid, name: it.p.name, gb: Math.round(it.p.tb * 931.5), kind: it.p.kind, read: it.p.read, os: os.has(it.uid) } }),
    net: () => { const m = mb(); return m && m.p.wifi ? 'wifi' : 'eth' }, onPaint: () => paintScreen(),
    onInstalled: i => { const d = winCtx.drives()[i]; if (d) { os.clear(); os.add(d.uid) } lastPost = PCSim.post(buildState()); setTimeout(renderUI, 3500) },
    onCopy: on => { load = on ? .35 : 0 }, onLoad: l => { load = l }, onUsb: () => sfx.click(), onShutdown: () => powerOff(),
    sensors: () => sensors, fps: () => PCSim.fps(buildState()), score: () => PCSim.score(buildState()), onBench: () => renderUI(),
    specs: () => { const B = buildState(), P = PCSim.props(B); return [['Processzor', B.cpu ? B.cpu.name : '–'], ['Alaplap', B.mb ? B.mb.name : '–'], ['Memória', `${P.ramGB} GB ${B.ram[0] ? B.ram[0].mem : ''} (${PCSim.dual(B) ? 'kétcsatornás' : 'egycsatornás'})`], ['Videokártya', B.gpu ? B.gpu.name : 'Integrált grafika'], ['Tárhely', B.storage.map(s => s.p.name).join(', ')], ['Tápegység', B.psu ? B.psu.name : '–'], ['Hűtés', B.cooler ? B.cooler.name : '–'], ['Gépház', B.case ? B.case.name : '–']] },
  };
  function openMonitor() { if (!powered || !lastPost || lastPost.lvl < 4) { toast('A monitoron akkor van mit nézni, ha a gép működik.', '#9aa0ab'); return } $('#b3-mon').style.display = 'flex'; winCtx.el = $('#b3-scr'); WinSim.open(winCtx) }
  function closeMonitor() { const m = $('#b3-mon'); if (m) m.style.display = 'none' }

  /* ---------- megrendelések ---------- */
  const ORDERS = [
    { id: 'bence', who: 'Bence (14)', name: 'Az első gamer gépem', budget: 450000, fee: 25000, txt: 'Fortnite-ozni szeretnék 144 FPS felett, Full HD-ban. Legalább 16 GB RAM és SSD legyen benne!', req: [['Fortnite 1080p ≥ 144 FPS', P => P.fps[1] && P.fps[1].r['1080p'] >= 144], ['Legalább 16 GB RAM', P => P.ramGB >= 16], ['Windows SSD-n', P => P.ssd]] },
    { id: 'lili', who: 'Lili (16)', name: 'Hófehér RGB setup', budget: 700000, fee: 35000, txt: 'Minden legyen fehér: ház, alaplap, hűtés, memória, videokártya! És világítson: legalább 3 RGB-s alkatrész.', req: [['Csupa fehér alkatrész', P => P.white], ['Legalább 3 RGB-s alkatrész', P => P.rgb >= 3], ['Legalább 32 GB RAM', P => P.ramGB >= 32]] },
    { id: 'studio', who: 'Pixel Stúdió Kft.', name: 'Videóvágó munkaállomás', budget: 1000000, fee: 60000, txt: '4K videókat vágunk: sok mag, sok memória és nagy tárhely kell.', req: [['Legalább 12 processzormag', P => P.cores >= 12], ['Legalább 64 GB RAM', P => P.ramGB >= 64], ['Legalább 4 TB tárhely', P => P.tb >= 4], ['Legalább 12 GB VRAM', P => P.vram >= 12]] },
    { id: 'itx', who: 'Anna', name: 'Kicsi nappali gép', budget: 650000, fee: 45000, txt: 'Kicsi, Mini-ITX gépet szeretnék a tévé mellé, ami 1440p-ben is elviszi a Cyberpunkot 60 FPS-sel.', req: [['Mini-ITX ház', P => P.form === 'ITX'], ['Cyberpunk 1440p ≥ 60 FPS', P => P.fps[0] && P.fps[0].r['1440p'] >= 60]] },
    { id: 'beast', who: 'Streamer Max', name: '4K csúcsgép vízhűtéssel', budget: 1900000, fee: 90000, txt: 'Cyberpunk 4K-ban 60 FPS felett, vízhűtéssel (AIO), és legyen benne RGB!', req: [['Vízhűtés (AIO)', P => P.aio], ['Cyberpunk 4K ≥ 60 FPS', P => P.fps[0] && P.fps[0].r['4K'] >= 60], ['Legalább 2 RGB-s alkatrész', P => P.rgb >= 2]] },
    { id: 'r-nopic', who: 'Kovács úr', name: 'Szerviz: „Nincs kép!”', repair: 'nopic', budget: 0, fee: 15000, txt: '„Bekapcsolom, a ventilátorok pörögnek, de a monitor fekete.” Keresd meg a hibát!', req: [['Van kép a monitoron', () => !!conns.cgpu]] },
    { id: 'r-hot', who: 'Nagy Eszter', name: 'Szerviz: „Lassú és forró”', repair: 'hot', budget: 0, fee: 15000, txt: '„A gép forró és akadozik.” Kapcsold be, nézd meg a hőmérsékletet terheléses teszttel, és javítsd meg!', req: [['Friss hővezető paszta a processzoron', () => paste.state === 'fresh']] },
    { id: 'r-power', who: 'Tóth néni', name: 'Szerviz: „Nem kapcsol be”', repair: 'power', budget: 0, fee: 12000, txt: '„Hiába nyomom a gombot, semmi sem történik.” A tápegység jó. Mi lehet a baj?', req: [['A bekapcsológomb működik', () => !!conns.cfp]] },
    { id: 'r-ram', who: 'Szabó Dani', name: 'Szerviz: memóriabővítés', repair: 'ram', budget: 60000, fee: 10000, txt: 'Most 16 GB van a gépben. 32 GB-ot szeretnék, kétcsatornás módban. Rendelj illő memóriát!', req: [['Legalább 32 GB RAM', P => P.ramGB >= 32], ['Kétcsatornás mód', (P, B) => PCSim.dual(B)]] },
    { id: 'r-slow', who: 'Farkas Bt.', name: 'Szerviz: lassú indulás (HDD)', repair: 'slow', budget: 50000, fee: 20000, txt: 'A gép 1 percig indul, mert a Windows merevlemezen van. Tegyél bele NVMe SSD-t, és telepítsd rá a Windowst!', req: [['Windows NVMe SSD-n', (P, B) => B.storage.some(s => s.os && s.p.kind === 'm2')]] },
  ];
  const REPAIR = { case: 'h5b', mb: 'tuf650', cpu: 'r5', cooler: 'f36', paste: 'mx4', ram: 'fb32d5', storage: '990ep', gpu: '4060', psu: 'rm650e' };
  function resetWorld() {
    if (powered) powerOff(); tweens.length = 0; busy = false; clearGhosts(); sel = null; setTool('hand');
    items.slice().forEach(i => { if (i !== panel) removeItem(i) }); Object.values(cableMesh).forEach(m => scene.remove(m)); cableMesh = {}; conns = {}; slots = {}; os = new Set(); paste = { state: 'none', p: null };
    if (caseG) { scene.remove(caseG); caseG = null } if (panel) { scene.remove(panel.objs[0].o); items = items.filter(i => i !== panel); panel = null } caseP = null; rotors = []; rgbM = []; spent = 0; caseFans = []; cart = [];
    if (blob) blob.visible = false;
  }
  function quickBuild(cfg, skip = []) {
    buildCase(find('case', cfg.case)); panel.slot = null; place(panel, 'bench');
    const put = (cat, id) => { const it = newItem(cat, find(cat, id)), t = targets(it)[0]; it.objs.forEach((ob, i) => ob.inst = t.poses[i] || t.poses[0]); it.slot = t.slot; slots[t.slot] = it.uid; place(it, 'inst'); it.screws.forEach(s => { s.in = true; placeScrew(s) }); if (cat === 'cooler' && it.p.type === 'aio') makeTubes(it); return it };
    put('mb', cfg.mb); put('cpu', cfg.cpu); if (!skip.includes('paste')) paste = { state: 'fresh', p: find('paste', cfg.paste) }; put('cooler', cfg.cooler);
    const rp = find('ram', cfg.ram); for (let i = 0; i < rp.n; i++) put('ram', cfg.ram);
    put('storage', cfg.storage); put('gpu', cfg.gpu); put('psu', cfg.psu); if (skip.includes('paste')) newItem('paste', find('paste', 'mx4'));
    for (const k of ['c24', 'ceps', 'cgpu', 'cfp', 'cfan', 'csata']) if (!skip.includes(k) && !connBlock(k)) { cableMesh[k] = cableObj(k); conns[k] = true }
    const osIt = at('m2a') || at('sata'); if (osIt) os.add(osIt.uid);
    place(panel, 'inst'); panel.slot = 'panel'; panel.screws.forEach(s => { s.in = true; placeScrew(s) }); panelOpened = false; updBlob();
  }
  function startOrder(o) {
    resetWorld(); order = o; mode = 'orders'; $('#b3-orders').style.display = 'none'; cam.goalTgt = V(1.9, 1.7, -.3); cam.goalR = 12.5; cam.th = .62; cam.ph = 1.08;
    if (o.repair === 'nopic') quickBuild(REPAIR, ['cgpu']);
    if (o.repair === 'hot') quickBuild(REPAIR, ['paste']);
    if (o.repair === 'power') quickBuild(REPAIR, ['cfp']);
    if (o.repair === 'ram') quickBuild({ ...REPAIR, ram: 'fb16d5' });
    if (o.repair === 'slow') quickBuild({ ...REPAIR, storage: 'barra2' });
    o.t0 = performance.now(); o.done = false; renderUI(); if (!o.repair) openShop('case');
    toast(o.repair ? 'A hibás gép az asztalon. Kapcsold be, és nézd meg, mi a baj!' : 'Rendeld meg az alkatrészeket a webáruházból!', '#5b9dff', 2600);
  }
  function startFree() { resetWorld(); order = null; mode = 'free'; $('#b3-orders').style.display = 'none'; renderUI(); openShop('case') }
  function orderStatus() {
    if (!order) return null; const B = buildState(), P = PCSim.props(B), post = caseP ? PCSim.post(B) : null;
    const req = order.req.map(([n, f]) => [n, !!f(P, B)]), base = [['A gép elindul, a Windows telepítve van', !!post && post.lvl === 5], ['Minden alkatrész rögzítve (csavarok)', items.every(i => !i.slot || secured(i))], ['Az oldalpanel visszacsavarozva', !!panel && !!panel.slot && secured(panel)]];
    if (!order.repair) base.push(['Költség a kereten belül', spent <= order.budget]);
    return { list: [...req, ...base], ok: [...req, ...base].every(x => x[1]) };
  }
  function deliverOrder() {
    const s = orderStatus(); if (!s || !s.ok || order.done) return; const profit = order.repair ? order.fee : order.fee + Math.max(0, order.budget - spent) * .15;
    wallet += profit; store.set('pc-wallet', wallet); const secs = (performance.now() - order.t0) / 1000; sfx.win(); FX.confetti(); order.done = true; store.set('pc-done-' + order.id, true);
    const o = $('#b3-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card"><h2>Átadva: ${order.who} elégedett!</h2><div class="big">+${huf(profit)}</div><p>Munkadíj ${huf(order.fee)}${order.repair ? '' : ` · alkatrészek: ${huf(spent)} / ${huf(order.budget)}`} · idő: ${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, '0')}<br>Egyenleged: <b>${huf(wallet)}</b></p>
      <div class="learn"><b>Ezt csinálja egy technikus:</b> felméri az ügyfél igényeit, kompatibilis alkatrészeket választ a keretből, szakszerűen összeszereli és rögzíti, telepíti az operációs rendszert, és teszteléssel ellenőrzi a munkáját.</div>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:16px"><button class="btn go" id="b3-next">Következő megrendelés</button><button class="btn" id="b3-cl">Bezárás</button></div></div>`;
    $('#b3-next').onclick = () => { o.style.display = 'none'; showOrders() }; $('#b3-cl').onclick = () => o.style.display = 'none'; renderUI();
  }
  function showOrders() {
    const o = $('#b3-orders'); o.style.display = 'flex';
    o.innerHTML = `<div class="b3-shopc" style="width:min(1120px,100%)"><div class="b3-sh"><div><div class="b3-st1">${icon('mail', 22)} Megrendelések</div><div class="b3-st2">Egyenleg: <b>${huf(wallet)}</b> · Válassz egy munkát, vagy építs szabadon!</div></div><div style="display:flex;gap:8px"><button class="btn" id="b3-ofree">Szabad építés</button><button class="iconbtn" id="b3-ox">${icon('x', 18)}</button></div></div>
      <div class="b3-ogrid">${ORDERS.map(x => `<div class="b3-ord ${store.get('pc-done-' + x.id, false) ? 'done' : ''}"><div class="b3-ow">${x.repair ? 'Szerviz' : 'Új gép'} · ${x.who}</div><div class="b3-on">${x.name}</div><div class="b3-ot">${x.txt}</div>
        ${x.req.length && !x.repair ? `<ul>${x.req.map(r => `<li>${r[0]}</li>`).join('')}</ul>` : ''}<div class="b3-of"><span>${x.budget ? 'Keret: ' + huf(x.budget) + ' · ' : ''}Díj: <b>${huf(x.fee)}</b></span><button class="btn go" data-o="${x.id}">Elvállalom</button></div></div>`).join('')}</div></div>`;
    $$('[data-o]', o).forEach(b => b.onclick = () => startOrder(ORDERS.find(x => x.id === b.dataset.o))); $('#b3-ox').onclick = () => o.style.display = 'none'; $('#b3-ofree').onclick = startFree;
  }

  /* ---------- webáruház ---------- */
  function compat(cat, p) {
    const cartP = c => (cart.find(x => x.cat === c) || {}).p, M = mb() ? mb().p : cartP('mb'), CS = caseP || cartP('case');
    if (cat === 'cpu' && M && p.socket !== M.socket) return `Nem illik: ${M.socket} alaplap`;
    if (cat === 'ram' && M && p.mem !== M.mem) return `Nem illik: ${M.mem} alaplap`;
    if (cat === 'ram' && M && p.n > M.slots) return `Az alaplapon csak ${M.slots} memóriahely van`;
    if (cat === 'mb' && CS && !CS.fits.includes(p.form)) return `Nem fér a házba (${CS.form})`;
    if (cat === 'gpu' && CS && p.len > CS.gpuMax) return `Túl hosszú a házhoz (max ${CS.gpuMax} mm)`;
    if (cat === 'cooler' && CS && p.type === 'air' && p.h > CS.coolMax) return `Túl magas a házhoz (max ${CS.coolMax} mm)`;
    if (cat === 'cooler' && CS && p.type === 'aio' && CS.top < p.rad) return `A házba nem fér ${p.rad} mm-es radiátor`;
    if (cat === 'cooler' && M && !p.sockets.includes(M.socket)) return `Nem támogatja: ${M.socket}`;
    if (cat === 'psu' && CS && p.form !== CS.psu) return `${CS.psu} tápegység kell a házba`;
    if (cat === 'case' && caseP && items.some(i => i.slot && i !== panel)) return 'Előbb ürítsd ki a jelenlegi házat';
    return null;
  }
  const free_ = () => mode === 'free' && !order;
  function openShop(cat) {
    if (!order && mode !== 'free') { showOrders(); return }
    if (order && order.repair && !order.budget) { toast('Ehhez a javításhoz nem kell új alkatrész – keresd meg a hibát!', '#9aa0ab', 2400); return }
    shopCat = cat || shopCat; $('#b3-shop').style.display = 'flex'; renderShop();
  }
  function cartChecks() {
    const out = [], all = [...items.filter(i => i !== panel).map(i => ({ cat: i.cat, p: i.p })), ...cart], has = c => all.find(x => x.cat === c);
    if (!caseP && !cart.some(x => x.cat === 'case')) out.push(['bad', 'Gépház nélkül nem lehet építeni – válassz egyet!']);
    const cpu = has('cpu'), gpu = has('gpu'), psu = has('psu');
    if (cpu && psu) { const n = PCSim.need({ cpu: cpu.p, gpu: gpu && gpu.p }); out.push(psu.p.w >= n ? ['ok', `Táp: ${psu.p.w} W ≥ ajánlott ${n} W`] : ['warn', `Kevés lehet a táp! Ajánlott: ${n} W`]) }
    if (cpu && !gpu && !cpu.p.igpu) out.push(['warn', 'Videokártya nélkül ehhez a processzorhoz nem lesz kép (nincs integrált GPU)!']);
    if (order && !order.repair) { const miss = ['mb', 'cpu', 'cooler', 'paste', 'ram', 'storage', 'psu'].filter(c => !has(c)); if (miss.length) out.push(['warn', 'Még hiányzik: ' + miss.map(c => PCCATS.find(x => x[0] === c)[1].toLowerCase()).join(', ')]) }
    return out;
  }
  function renderShop() {
    const free = free_(), budget = order ? order.budget : Infinity, tot = cart.reduce((s, c) => s + c.p.price, 0);
    const list = DB[shopCat].filter(p => (filt.col === 'all' || (filt.col === 'white' ? light(p.col) : !light(p.col))) && (!filt.rgb || p.rgb || (p.fans && p.fans.rgb)));
    const chk = cartChecks(), dis = !cart.length || (!free && tot + spent > budget) || chk.some(c => c[0] === 'bad');
    $('#b3-shop').innerHTML = `<div class="b3-shopc"><div class="b3-sh"><div><div class="b3-st1">${icon('box', 22)} NYN Webáruház</div><div class="b3-st2">${free ? 'Szabad építés: minden ingyenes – kísérletezz!' : `Keret: ${huf(budget)} · eddig elköltve: ${huf(spent)}`} · Az árak tájékoztató jellegűek.</div></div><button class="iconbtn" id="b3-shx">${icon('x', 18)}</button></div>
      <div class="b3-sbody"><div class="b3-tabs">${PCCATS.map(([k, n, ic]) => `<button class="b3-tab ${k === shopCat ? 'on' : ''}" data-c="${k}">${icon(ic, 18)} ${n}${cart.some(c => c.cat === k) ? icon('check', 14, 2.6) : ''}</button>`).join('')}</div>
      <div style="display:flex;flex-direction:column;min-height:0"><div class="b3-filt"><button class="chip ${filt.col === 'all' ? 'on' : ''}" data-f="all">Mind</button><button class="chip ${filt.col === 'black' ? 'on' : ''}" data-f="black">Sötét</button><button class="chip ${filt.col === 'white' ? 'on' : ''}" data-f="white">Fehér</button><button class="chip ${filt.rgb ? 'on' : ''}" data-f="rgb">RGB</button></div>
      <div class="b3-prods">${list.map(p => { const c = compat(shopCat, p), inC = cart.filter(x => x.p === p).length; return `<div class="b3-prod ${inC ? 'on' : ''} ${c ? 'bad' : ''}" data-p="${p.id}"><div class="b3-sw" style="background:${p.col || '#333'}">${p.rgb || (p.fans && p.fans.rgb) ? '<i></i>' : ''}</div><div class="b3-pn">${p.name}</div><div class="b3-ps">${p.spec}</div>${c ? `<div class="b3-pc">${c}</div>` : ''}<div class="b3-pf"><b>${free ? 'ingyenes' : huf(p.price)}</b><span class="btn ${inC ? 'sel' : ''}">${inC ? 'Kosárban: ' + inC : 'Kosárba'}</span></div></div>` }).join('') || '<div class="b3-hint">Nincs ilyen termék ebben a kategóriában.</div>'}</div></div>
      <div class="b3-cart"><div class="b3-ct">Kosár</div>${cart.map((c, i) => `<div class="b3-cl"><span>${c.p.name}</span><b>${free ? '' : huf(c.p.price)}</b><button class="b3-rm" data-r="${i}">${icon('x', 12, 2.4)}</button></div>`).join('') || '<div class="b3-hint">A kosár üres.</div>'}
        ${free ? '' : `<div class="b3-tot"><span>Összesen</span><b>${huf(tot)}</b></div><div class="b3-bud"><i style="width:${Math.min(100, (tot + spent) / budget * 100)}%;background:${tot + spent > budget ? 'var(--red)' : 'var(--accent)'}"></i></div><div class="b3-hint">${tot + spent > budget ? 'Túllépnéd a keretet!' : 'Maradék keret: ' + huf(budget - spent - tot)}</div>`}
        ${chk.map(([t, m]) => `<div class="b3-chk ${t}">${icon(t === 'ok' ? 'check' : t === 'warn' ? 'bolt' : 'x', 15, 2.4)}<span>${m}</span></div>`).join('')}
        <button class="btn go" id="b3-order" ${dis ? 'disabled' : ''} style="width:100%;margin-top:10px">Megrendelés</button></div></div></div>`;
    $('#b3-shx').onclick = () => $('#b3-shop').style.display = 'none';
    $$('.b3-tab').forEach(b => b.onclick = () => { shopCat = b.dataset.c; renderShop() });
    $$('[data-f]').forEach(b => b.onclick = () => { const f = b.dataset.f; if (f === 'rgb') filt.rgb = !filt.rgb; else filt.col = f; renderShop() });
    $$('.b3-prod').forEach(b => b.onclick = () => { const p = DB[shopCat].find(x => x.id === b.dataset.p), c = compat(shopCat, p); if (c) { sfx.bad(); toast(c, '#f87171', 2000); return } if (shopCat === 'case') cart = cart.filter(x => x.cat !== 'case'); cart.push({ cat: shopCat, p }); beep(900, .04, 'triangle', .05); renderShop() });
    $$('.b3-rm').forEach(b => b.onclick = e => { e.stopPropagation(); cart.splice(+b.dataset.r, 1); renderShop() });
    $('#b3-order').onclick = placeOrder;
  }
  async function placeOrder() {
    const list = cart.slice(); cart = []; $('#b3-shop').style.display = 'none'; if (!free_()) spent += list.reduce((s, c) => s + c.p.price, 0); sfx.win();
    toast('Megrendelve! A futár már hozza a csomagokat…', '#4ade80', 2000);
    const cs = list.find(c => c.cat === 'case'); if (cs) { buildCase(cs.p); panel.slot = 'panel' }
    cam.goalTgt = V(4.4, .3, -.1); cam.goalR = 10; cam.th = .9; cam.ph = .8; renderUI(); await wait(500);
    for (const c of list.filter(c => c.cat !== 'case')) { const n = c.cat === 'ram' ? c.p.n : 1; for (let k = 0; k < n; k++) { const it = newItem(c.cat, c.p); it.objs.forEach(ob => ob.o.visible = false); deliver(it) } await wait(260) }
    setTimeout(renderUI, 2500);
  }
  function deliver(it) {
    const bp = it.objs[0].bench.p, bx = new THREE.Group(), s = it.cat === 'mb' ? [1.8, .3, 1.5] : it.cat === 'gpu' ? [1.6, .5, .9] : it.cat === 'psu' ? [1.1, .7, 1.0] : it.cat === 'cooler' ? [.9, .8, .9] : [.6, .25, .6];
    box(...s, mat('#b88a5a', { r: .85 }), 0, 0, 0, bx); box(s[0] + .01, .02, .12, mat('#d9c39a', { r: .6 }), 0, s[1] / 2, 0, bx); bx.position.set(bp.x, 9, bp.z); scene.add(bx);
    tweenObj(bx, { p: V(bp.x, s[1] / 2 + .02, bp.z), q: Q(0, Math.random() - .5, 0) }, .7, 0).then(async () => {
      noise(.12, .12); beep(120, .1, 'sine', .1); await wait(300); for (let k = 0; k < 6; k++) { bx.scale.setScalar(1 - k * .16); await wait(30) } scene.remove(bx);
      it.objs.forEach(o => { o.o.visible = true; o.o.scale.setScalar(.1) }); for (let k = 1; k <= 6; k++) { it.objs.forEach(o => o.o.scale.setScalar(k / 6)); await wait(25) } beep(1100, .06, 'triangle', .05);
    });
  }

  /* ---------- felület ---------- */
  function statusOf(it) { if (it === panel) return panel.slot ? (secured(panel) ? ['Felcsavarozva', 'in'] : [`Csavar: ${panel.screws.filter(x => x.in).length}/2`, 'half']) : ['Levéve', '']; if (!it.slot) return ['Asztalon', '']; const n = it.screws.length, k = it.screws.filter(s => s.in).length; return !n ? ['Beszerelve', 'in'] : k === n ? ['Rögzítve', 'in'] : [`Csavar: ${k}/${n}`, 'half'] }
  function renderUI() {
    if (!$('#b3-list')) return;
    const st = orderStatus();
    $('#b3-mode').innerHTML = `<div class="b3-ms"><button class="btn b3-m ${mode === 'orders' ? 'sel' : ''}" id="b3-mo">Megrendelések</button><button class="btn b3-m ${mode === 'free' && !order ? 'sel' : ''}" id="b3-mf">Szabad építés</button></div><div class="b3-wal">Egyenleg: <b>${huf(wallet)}</b></div>`;
    $('#b3-mo').onclick = showOrders; $('#b3-mf').onclick = startFree;
    $('#b3-ticket').innerHTML = order ? `<div class="b3-mn">${order.name}</div><div class="b3-who">${order.who}</div><div>${order.txt}</div>${order.budget ? `<div class="b3-hint">Keret: ${huf(order.budget)} · elköltve: ${huf(spent)}</div>` : ''}
      <div class="b3-req">${st.list.map(([n, ok]) => `<div class="${ok ? 'ok' : ''}">${icon(ok ? 'check' : 'circle', 14, 2.4)} ${n}</div>`).join('')}</div>
      <div style="display:flex;gap:6px;margin-top:8px">${order.budget ? `<button class="btn" id="b3-os">${icon('box', 16)} Webáruház</button>` : ''}<button class="btn go" id="b3-dl" ${st.ok && !order.done ? '' : 'disabled'}>${order.done ? 'Átadva' : 'Átadás'}</button></div>`
      : mode === 'free' ? `<div class="b3-mn">Szabad építés</div><div>Rendelj bármit ingyen, építs, szedj szét, és próbáld ki, mi történik!</div><button class="btn go" id="b3-os" style="margin-top:8px">${icon('box', 16)} Webáruház</button>` : `<div class="b3-mn">Válassz munkát!</div><button class="btn go" id="b3-ol" style="margin-top:8px">Megrendelések megnyitása</button>`;
    const os_ = $('#b3-os'); if (os_) os_.onclick = () => openShop(); const dl = $('#b3-dl'); if (dl) dl.onclick = deliverOrder; const ol = $('#b3-ol'); if (ol) ol.onclick = showOrders;
    const list = items.filter(i => i !== panel), row = it => { const [s, c] = statusOf(it); return `<button class="b3-item ${c} ${sel === it.uid ? 'sel' : ''}" data-u="${it.uid}"><span class="b3-ic">${icon(it === panel ? 'layers' : (PCCATS.find(x => x[0] === it.cat) || [0, 0, 'layers'])[2], 16)}</span><span class="b3-nm">${it.p.name}</span><span class="b3-st">${s}</span></button>` };
    $('#b3-list').innerHTML = (caseP ? `<div class="b3-grp">${caseP.name}</div>` + row(panel) : '<div class="b3-hint">Még nincs gépház – rendelj egyet a webáruházból!</div>') + list.filter(i => i.slot).map(row).join('') +
      (list.some(i => !i.slot) ? '<div class="b3-grp">Az asztalon</div>' + list.filter(i => !i.slot).map(row).join('') : '') +
      (caseP ? '<div class="b3-grp">Kábelek</div>' + Object.keys(CNAME).map(k => { const b = !conns[k] && connBlock(k); return `<button class="b3-item ${conns[k] ? 'in' : ''} ${b ? 'lock' : ''}" data-c="${k}"><span class="b3-ic">${icon('plug', 16)}</span><span class="b3-nm">${CNAME[k]}</span><span class="b3-st">${conns[k] ? 'Bekötve' : 'Nincs'}</span></button>` }).join('') : '');
    $$('.b3-item[data-u]').forEach(b => b.onclick = () => { const it = items.find(i => String(i.uid) === b.dataset.u); sfx.click(); if (sel === it.uid) select(null); else select(it) });
    $$('.b3-item[data-c]').forEach(b => b.onclick = () => conns[b.dataset.c] ? disconnect(b.dataset.c) : connect(b.dataset.c));
    const it = items.find(i => i.uid === sel), bx = $('#b3-sel');
    if (!it) bx.innerHTML = `<div class="b3-hint"><b>Kéz:</b> kattints egy alkatrészre, majd a kék szellemképre. <b>Csavarhúzó [S]:</b> kattints a csavarokra – be- vagy kicsavarja őket. Húzással forgathatsz, görgővel közelíthetsz.</div>`;
    else { const inst = !!it.slot, b = inst ? removeBlock(it) : it === panel ? panelBlock() : installBlock(it), p = it.p;
      const extra = it.cat === 'cpu' && inst && paste.state === 'old' && !slots.cooler ? `<button class="btn" id="b3-wipe">Régi paszta letörlése</button>` : '';
      bx.innerHTML = `<div class="b3-sn">${p.name}</div>${p.spec ? `<div class="b3-spec">${p.spec}</div>` : ''}${b ? `<div class="b3-warn">${b}</div>` : ''}${it.screws.length && inst ? `<div class="b3-hint">Csavarok: ${it.screws.filter(s => s.in).length} / ${it.screws.length} becsavarozva</div>` : ''}
        <div class="b3-sb">${inst ? `<button class="btn" id="b3-rm">${it === panel ? 'Levétel' : 'Kiszerelés'}</button>` : `<button class="btn go" id="b3-in" ${b ? 'disabled' : ''}>${it.cat === 'paste' ? 'Felkenés' : it === panel ? 'Felszerelés' : 'Beszerelés'}</button>`}${extra}</div>`;
      const bi = $('#b3-in'), br = $('#b3-rm'), bw = $('#b3-wipe'); if (bi) bi.onclick = () => install(it); if (br) br.onclick = () => uninstall(it); if (bw) bw.onclick = () => { paste = { state: 'none', p: null }; updBlob(); toast('Izopropil-alkohollal letörölted a régi pasztát.', '#4ade80'); renderUI() } }
    $('#b3-sens').style.display = powered && sensors ? '' : 'none';
    $('#b3-auto').classList.toggle('sel', auto);
  }
  function renderSensors() {
    const r = sensors, el = $('#b3-sens'); if (!r || !el) return;
    const bar = (v, max, warn) => `<div class="b3-bar"><i style="width:${clamp(v / max * 100, 2, 100)}%;background:${v >= warn ? 'var(--red)' : v >= warn * .85 ? 'var(--yellow)' : 'var(--green)'}"></i></div>`;
    el.innerHTML = `<div class="b3-sh2">${icon('activity', 16)} Szenzorok (élő) <span>${load > .5 ? 'TERHELÉS' : 'üresjárat'}</span></div>
      <div class="b3-sr"><span>CPU hőmérséklet</span><b>${Math.round(r.cpuT)} °C</b></div>${bar(r.cpuT, 105, 90)}
      <div class="b3-sr"><span>CPU fogyasztás · órajel</span><b>${Math.round(r.cpuW)} W · ${(r.cpuMHz / 1000).toFixed(2).replace('.', ',')} GHz</b></div>
      ${r.gpuT != null ? `<div class="b3-sr"><span>GPU hőmérséklet · fogyasztás</span><b>${Math.round(r.gpuT)} °C · ${Math.round(r.gpuW)} W</b></div>` : ''}
      <div class="b3-sr"><span>Tápegység terhelése</span><b>${Math.round(r.psuW)} W (${Math.round(r.psuPct)}%)</b></div>${bar(r.psuPct, 100, 92)}
      <div class="b3-sr"><span>Ventilátorok</span><b>CPU ${Math.round(r.fanC)} · ház ${Math.round(r.fanCase)} rpm</b></div>
      <div class="b3-sr"><span>Zajszint</span><b>${r.noise} dB</b></div>${r.throttle ? '<div class="b3-warn">Túlmelegedés: a processzor visszavette az órajelét!</div>' : ''}
      <button class="btn" id="b3-stress" style="width:100%;margin-top:6px">${load > .5 ? 'Terheléses teszt leállítása' : 'Terheléses teszt (100%)'}</button>`;
    $('#b3-stress').onclick = () => { load = load > .5 ? 0 : 1; renderSensors() };
  }
  function pickAt(e) {
    const r = renderer.domElement.getBoundingClientRect(), m = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(m, camera); const hits = ray.intersectObjects(scene.children, true);
    for (const h of hits) { const o = h.object; let vis = true, q = o; while (q) { if (!q.visible) { vis = false; break } q = q.parent } if (!vis) continue;
      const md = meta(o); if (md.screw || md.screwOf) return { screw: md.screw || md.screwOf };
      if (md.ghost) return { ghost: md.ghost }; if (o.userData.power) return { power: true }; if (o.userData.conn) return { conn: o.userData.conn };
      if (o.userData.blob) return { blob: true }; if (md.item) return { item: md.item } }
    return {};
  }
  function setHover(it) {
    if (hover === it) return; const set = (x, v) => { if (!x || !x.mats) return; x.mats.forEach(m => { if (rgbM.includes(m)) return; if (m.userData.e0 == null) m.userData.e0 = m.emissive.getHex(); m.emissive.setHex(v ? 0x1e3a8a : m.userData.e0) }) };
    set(hover, false); hover = it; set(hover, true);
  }

  S.build = r => {
    root = r;
    r.innerHTML = `<style>
      #b3-cv{position:absolute;inset:0}#b3-cv canvas{display:block;width:100%;height:100%;cursor:grab;touch-action:none}
      #b3-left{position:absolute;left:12px;top:12px;bottom:12px;width:320px;display:flex;flex-direction:column;gap:8px;z-index:3;pointer-events:none}#b3-left>*{pointer-events:auto}
      #b3-mode{display:flex;justify-content:space-between;align-items:center;gap:8px}.b3-ms{display:flex;gap:6px}.b3-m{font-size:13px;padding:6px 12px;min-height:34px;border-radius:999px}.b3-wal{font-size:12.5px;color:var(--muted);white-space:nowrap}.b3-wal b{color:var(--green)}
      #b3-ticket{font-size:13.5px;color:#c9ccd3;line-height:1.45}.b3-mn{font-weight:700;color:var(--text);font-size:15px}.b3-who{font-size:12px;color:var(--muted);margin-bottom:4px}
      #b3-ticket .btn{display:flex;gap:6px;align-items:center;justify-content:center;font-size:14px;flex:1}
      .b3-req{margin-top:8px;display:flex;flex-direction:column;gap:3px}.b3-req div{display:flex;gap:6px;align-items:center;font-size:12.5px;color:var(--muted)}.b3-req div.ok{color:var(--green)}
      #b3-list{display:flex;flex-direction:column;gap:2px;overflow:auto;min-height:0;flex:1;padding:8px}.b3-grp{font-size:11.5px;font-weight:700;color:var(--dim);margin:8px 4px 2px}
      .b3-item{all:unset;box-sizing:border-box;display:grid;grid-template-columns:26px 1fr auto;gap:8px;align-items:center;padding:5px 8px;border-radius:9px;cursor:pointer;font-size:12.5px;border:1px solid transparent;line-height:1.25}
      .b3-item:hover{background:var(--panel2)}.b3-item.sel{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 14%,var(--panel2))}
      .b3-ic{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;background:var(--panel2);color:var(--muted)}.b3-item.in .b3-ic{background:color-mix(in srgb,var(--green) 18%,transparent);color:var(--green)}.b3-item.half .b3-ic{background:#3a2a0a;color:var(--yellow)}
      .b3-st{font-size:11px;color:var(--dim);white-space:nowrap}.b3-item.in .b3-st{color:var(--green)}.b3-item.half .b3-st{color:var(--yellow)}.b3-item.lock{opacity:.55}
      #b3-right{position:absolute;right:12px;top:12px;width:320px;z-index:3;display:flex;flex-direction:column;gap:8px;max-height:calc(100% - 90px);overflow:auto}
      .b3-sn{font-weight:700;font-size:15.5px;color:var(--accent);line-height:1.3}.b3-spec{font-size:12.5px;color:var(--muted);margin:3px 0 8px}
      .b3-warn{font-size:13px;color:#fcd34d;background:#3a2a0a;border-radius:9px;padding:7px 10px;margin:6px 0}
      .b3-sb{display:flex;gap:8px;margin-top:6px}.b3-sb .btn{flex:1;font-size:14px}.b3-hint{font-size:12.5px;color:var(--muted);margin-top:6px;line-height:1.45}
      .b3-sh2{display:flex;gap:6px;align-items:center;font-weight:700;margin-bottom:6px}.b3-sh2 span{margin-left:auto;font-size:11px;color:var(--yellow)}
      .b3-sr{display:flex;justify-content:space-between;gap:8px;font-size:12.5px;margin-top:5px}.b3-sr span{color:var(--muted)}.b3-sr b{font-variant-numeric:tabular-nums;white-space:nowrap}
      .b3-bar{height:6px;border-radius:3px;background:var(--panel2);overflow:hidden;margin-top:3px}.b3-bar i{display:block;height:100%;transition:width .4s}
      #b3-bottom{position:absolute;left:344px;right:344px;bottom:12px;z-index:3;display:flex;justify-content:center}
      #b3-bottom .panel{display:flex;gap:6px;padding:7px;align-items:center;flex-wrap:wrap;justify-content:center}#b3-bottom .btn{font-size:13px;min-height:38px;padding:6px 10px;display:flex;gap:6px;align-items:center}
      .b3-sep{width:1px;height:26px;background:var(--line)}
      #b3-power.on{background:var(--red);color:#0b0c0f;border-color:var(--red)}
      .b3-res{position:absolute;left:50%;top:14px;transform:translate(-50%,-20px);opacity:0;z-index:4;max-width:620px;background:var(--panel);border:1px solid var(--line2);border-radius:14px;padding:12px 18px;transition:all .3s;pointer-events:none;display:flex;flex-direction:column;gap:2px;box-shadow:0 20px 40px -10px #000}
      .b3-res.show{opacity:1;transform:translate(-50%,0)}.b3-res b{font-size:16.5px}.b3-res span{font-size:14px;color:#c9ccd3}
      .b3-res.good{border-color:var(--green)}.b3-res.good b{color:var(--green)}.b3-res.warn{border-color:var(--yellow)}.b3-res.warn b{color:var(--yellow)}.b3-res.bad{border-color:var(--red)}.b3-res.bad b{color:var(--red)}
      .b3-modal{position:absolute;inset:0;z-index:8;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(8,9,11,.6);backdrop-filter:blur(8px)}
      .b3-shopc{width:min(1240px,100%);max-height:100%;display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line2);border-radius:20px;overflow:hidden;box-shadow:0 30px 80px -20px #000}
      .b3-sh{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid var(--line);gap:10px}
      .b3-st1{display:flex;gap:10px;align-items:center;font-weight:800;font-size:19px}.b3-st2{font-size:13px;color:var(--muted);margin-top:2px}
      .b3-sbody{display:grid;grid-template-columns:190px minmax(0,1fr) 330px;min-height:0;flex:1;overflow:hidden}
      .b3-tabs{display:flex;flex-direction:column;gap:3px;padding:10px;border-right:1px solid var(--line);overflow:auto}
      .b3-tab{all:unset;display:flex;gap:8px;align-items:center;padding:8px 11px;border-radius:9px;font-size:13.5px;font-weight:600;color:#c9ccd3;cursor:pointer}.b3-tab svg:nth-child(2){margin-left:auto;color:var(--green)}
      .b3-tab:hover{background:var(--panel2)}.b3-tab.on{background:var(--panel2);color:var(--text);box-shadow:inset 3px 0 0 var(--accent)}
      .b3-filt{display:flex;gap:6px;padding:10px 14px 0}.b3-filt .chip{height:30px;font-size:12.5px}
      .b3-prods{padding:12px 14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;overflow:auto;align-content:start;flex:1}
      .b3-prod{position:relative;border:1px solid var(--line);border-radius:14px;padding:12px;cursor:pointer;display:flex;flex-direction:column;gap:5px;background:var(--bg2)}
      .b3-prod:hover{border-color:var(--line2)}.b3-prod.on{border-color:var(--accent)}.b3-prod.bad{opacity:.55}
      .b3-sw{width:22px;height:22px;border-radius:6px;border:1px solid #ffffff33;position:relative}.b3-sw i{position:absolute;inset:-4px;border-radius:9px;border:2px solid #f472b6;box-shadow:0 0 8px #a78bfa}
      .b3-pn{font-weight:700;font-size:14px;line-height:1.3}.b3-ps{font-size:12px;color:var(--muted);flex:1}.b3-pc{font-size:12px;color:#fca5a5}
      .b3-pf{display:flex;justify-content:space-between;align-items:center;margin-top:4px}.b3-pf b{font-size:15px;font-variant-numeric:tabular-nums}.b3-pf .btn{font-size:12px;min-height:30px;padding:5px 10px}
      .b3-cart{border-left:1px solid var(--line);padding:12px;overflow:auto}.b3-ct{font-weight:700;margin-bottom:6px}
      .b3-cl{display:grid;grid-template-columns:1fr auto 22px;gap:8px;align-items:center;font-size:12.5px;padding:5px 0;border-bottom:1px dashed var(--line)}.b3-cl span{color:#c9ccd3}.b3-cl b{white-space:nowrap;font-variant-numeric:tabular-nums}
      .b3-rm{all:unset;cursor:pointer;color:var(--muted);display:grid;place-items:center;width:22px;height:22px;border-radius:6px}.b3-rm:hover{background:var(--panel2);color:var(--red)}
      .b3-tot{display:flex;justify-content:space-between;font-size:16px;margin-top:10px}.b3-bud{height:7px;border-radius:4px;background:var(--panel2);overflow:hidden;margin-top:6px}.b3-bud i{display:block;height:100%}
      .b3-chk{display:flex;gap:8px;font-size:12.5px;line-height:1.4;padding:3px 0}.b3-chk svg{flex:none;margin-top:2px}.b3-chk.ok{color:var(--green)}.b3-chk.warn{color:var(--yellow)}.b3-chk.bad{color:#fca5a5}
      .b3-ogrid{padding:14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;overflow:auto}
      .b3-ord{border:1px solid var(--line);border-radius:14px;padding:14px;background:var(--bg2);display:flex;flex-direction:column;gap:6px}.b3-ord.done{opacity:.6}.b3-ord.done .b3-on::after{content:" – teljesítve";color:var(--green);font-size:12px}
      .b3-ow{font-size:12px;color:var(--muted)}.b3-on{font-weight:700;font-size:16px}.b3-ot{font-size:13px;color:#c9ccd3;line-height:1.45}.b3-ord ul{margin:0;padding-left:18px;font-size:12.5px;color:var(--muted)}
      .b3-of{display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:6px;font-size:12.5px;color:var(--muted)}.b3-of .btn{font-size:13px;min-height:34px}
      #b3-mon .mon{width:min(1180px,96%);aspect-ratio:16/9;max-height:86%;background:#0b0c0f;border:14px solid #111214;border-bottom-width:22px;border-radius:14px;position:relative;box-shadow:0 30px 80px #000}
      #b3-scr{position:absolute;inset:0;overflow:hidden;background:#000}#b3-monx{position:absolute;top:14px;right:16px;z-index:2;display:flex;gap:6px;align-items:center}
      @media(max-width:1300px){#b3-left,#b3-right{width:270px}#b3-bottom{left:290px;right:290px}}
    </style>
    <div id="b3-cv"></div>
    <div id="b3-left"><div class="panel" id="b3-mode"></div><div class="panel" id="b3-ticket"></div><div class="panel" id="b3-list"></div></div>
    <div id="b3-right"><div class="panel" id="b3-sel"></div><div class="panel" id="b3-sens" style="display:none"></div></div>
    <div id="b3-res" class="b3-res"></div>
    <div id="b3-bottom"><div class="panel">
      <button class="btn sel" data-tool="hand">${icon('hand', 16)} Kéz</button><button class="btn" data-tool="driver">${icon('key', 16)} Csavarhúzó [S]</button><button class="btn" id="b3-auto" title="A csavarokat automatikusan be- és kicsavarja">${icon('refresh', 16)} Auto-csavar</button>
      <span class="b3-sep"></span><button class="btn" data-v="all">Teljes</button><button class="btn" data-v="in">Belül</button><button class="btn" data-v="back">Hátul</button><button class="btn" data-v="bench">Asztal</button>
      <span class="b3-sep"></span><button class="btn" id="b3-monb">${icon('monitor', 16)} Monitor</button><button class="btn" id="b3-power">${icon('bolt', 18, 2)} Bekapcsolás</button></div></div>
    <div class="b3-modal" id="b3-shop"></div><div class="b3-modal" id="b3-orders"></div>
    <div class="b3-modal" id="b3-mon"><button class="btn" id="b3-monx">${icon('x', 16)} Vissza a műhelybe</button><div class="mon"><div id="b3-scr"></div></div></div>
    <div class="big-overlay" id="b3-over" style="display:none"></div>`;
    try {
      if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
      renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
      renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; $('#b3-cv').appendChild(renderer.domElement);
    } catch (e) { $('#b3-cv').innerHTML = '<div style="padding:60px;text-align:center;color:var(--muted)">A 3D-s nézethez WebGL-támogatású böngésző kell.</div>'; return }
    scene = new THREE.Scene(); scene.background = new THREE.Color('#0b0c0f'); scene.fog = new THREE.Fog('#0b0c0f', 24, 44);
    camera = new THREE.PerspectiveCamera(38, 1, .1, 100); ray = new THREE.Raycaster();
    scene.add(new THREE.HemisphereLight('#c8d4ff', '#0c0a08', .55));
    const key = new THREE.DirectionalLight('#fff4e8', 2.2); key.position.set(7, 11, 6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 }); key.shadow.bias = -.0005; scene.add(key);
    const rim = new THREE.DirectionalLight('#7aa2ff', .9); rim.position.set(-6, 6, -6); scene.add(rim); const back = new THREE.DirectionalLight('#ffffff', .6); back.position.set(-2, 5, -9); scene.add(back);
    const fill = new THREE.PointLight('#ffffff', .8, 9); fill.position.set(1.6, 3.4, .5); scene.add(fill);
    const wood = ctex(512, 512, (g, w, h) => { g.fillStyle = '#4a3527'; g.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(${Math.random() < .5 ? '30,20,12' : '110,80,55'},${Math.random() * .35})`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.bezierCurveTo(w * .3, y + 8, w * .6, y - 8, w, y + 3); g.stroke() } }); wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(3, 2);
    box(14, .3, 11, mat('#ffffff', { r: .65, map: wood }), 2.4, -.15, .2, scene).castShadow = false;
    const matT = ctex(512, 512, (g, w, h) => { g.fillStyle = '#1b2a3a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 2; for (let i = 0; i <= w; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke() } g.fillStyle = 'rgba(255,255,255,.35)'; g.font = font(700, 26); g.fillText('ESD SAFE · ANTISZTATIKUS', 24, h - 24) });
    box(6.6, .02, 7, mat('#ffffff', { r: .95, map: matT }), 4.6, .01, -.1, scene);
    const mg = new THREE.Group(); mg.position.set(-.6, 0, 4.4); mg.rotation.y = -18 * DEG; scene.add(mg);
    box(.9, .05, .7, mat('#2a2e37', { m: .5 }), 0, .03, 0, mg); box(.12, 1.2, .2, mat('#2a2e37', { m: .5 }), -.15, .6, 0, mg); box(.1, 1.9, 3.2, mat('#111214', { r: .4 }), 0, 1.95, 0, mg);
    const sc = document.createElement('canvas'); sc.width = 1024; sc.height = 576; monitorCtx = sc.getContext('2d'); monitorTex = new THREE.CanvasTexture(sc); monitorTex.encoding = THREE.sRGBEncoding;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.05, 1.72), new THREE.MeshBasicMaterial({ map: monitorTex, toneMapped: false })); scr.rotation.y = Math.PI / 2; scr.position.set(.056, 1.97, 0); scr.userData.monitor = true; mg.add(scr);
    WinSim.open(winCtx); paintScreen(); driver = makeDriver(); built = true;
    const el = renderer.domElement; let down = null, moved = 0;
    el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, th: cam.th, ph: cam.ph }; moved = 0; el.setPointerCapture(e.pointerId) });
    el.addEventListener('pointermove', e => {
      if (down) { const dx = e.clientX - down.x, dy = e.clientY - down.y; moved = Math.max(moved, Math.hypot(dx, dy)); if (moved > 4) { cam.th = down.th - dx * .006; cam.ph = clamp(down.ph - dy * .005, .3, 1.5) } return }
      const h = pickAt(e); setHover(tool === 'hand' ? (h.item || null) : null);
      if (tool === 'driver') { el.style.cursor = h.screw ? 'pointer' : 'crosshair'; if (!anyBusy()) { if (h.screw && (h.screw.item.slot)) { const w = new THREE.Vector3(), q = new THREE.Quaternion(); h.screw.m.getWorldPosition(w); h.screw.obj.getWorldQuaternion(q); const n = h.screw.n.clone().applyQuaternion(q); driver.g.visible = true; driver.g.quaternion.setFromUnitVectors(V(0, 1, 0), n); driver.g.position.copy(w).addScaledVector(n, .22) } else driver.g.visible = false } }
      else el.style.cursor = h.item || h.ghost || h.power || h.conn ? 'pointer' : 'grab';
    });
    el.addEventListener('pointerup', e => {
      if (!down) return; const click = moved <= 4; down = null; if (!click) return; const h = pickAt(e);
      if (h.power) return powerOn();
      if (tool === 'driver') { if (h.screw) { if (!h.screw.item.slot) return; if (powered) return powerOff('Csavarozás előtt kapcsold ki a gépet!'); turnScrew(h.screw, !h.screw.in) } else if (h.item) toast('Csavarhúzóval a csavarokra kattints! Alkatrész mozgatásához válts Kéz módra.', '#9aa0ab', 2000); return }
      if (h.ghost) return install(h.ghost.it, h.ghost.t);
      if (h.conn) return disconnect(h.conn);
      if (h.blob && paste.state === 'old') { paste = { state: 'none', p: null }; updBlob(); toast('Letörölted a régi pasztát.', '#4ade80'); return renderUI() }
      if (h.item) { const it = h.item; sfx.click(); if (it === panel) return panel.slot ? uninstall(panel) : install(panel); if (sel === it.uid && !it.slot) return install(it); select(it) } else select(null);
    });
    el.addEventListener('wheel', e => { e.preventDefault(); cam.goalR = clamp(cam.goalR * (1 + Math.sign(e.deltaY) * .1), 3.5, 22) }, { passive: false });
    $$('[data-tool]', r).forEach(b => b.onclick = () => { sfx.click(); setTool(b.dataset.tool) });
    $('#b3-auto').onclick = () => { auto = !auto; renderUI(); toast(auto ? 'Automatikus csavarozás bekapcsolva.' : 'Kézi csavarozás: használd a csavarhúzót!', '#5b9dff', 1500) };
    $$('[data-v]', r).forEach(b => b.onclick = () => { const v = b.dataset.v, D = caseP ? caseP.dim[2] : 4.6; if (v === 'all') { cam.goalTgt = V(1.9, 1.7, -.3); cam.goalR = 12.5; cam.th = .62; cam.ph = 1.08 } if (v === 'in') { cam.goalTgt = V(-.4, 2.5, -.5); cam.goalR = 7; cam.th = .12; cam.ph = 1.2 } if (v === 'back') { cam.goalTgt = V(0, 1.8, -D / 2); cam.goalR = 7; cam.th = -1.45; cam.ph = 1.15 } if (v === 'bench') { cam.goalTgt = V(4.6, .3, -.1); cam.goalR = 9; cam.th = .9; cam.ph = .75 } });
    $('#b3-power').onclick = powerOn; $('#b3-monb').onclick = openMonitor; $('#b3-monx').onclick = closeMonitor;
    addEventListener('keydown', e => { if (App.cur !== S || e.target.tagName === 'INPUT') return; if (e.key === 's' || e.key === 'S') setTool(tool === 'driver' ? 'hand' : 'driver'); if (e.key === 'Escape') { select(null); closeMonitor() } });
    renderUI(); showOrders();
  };
  S.debug = () => ({ idle: !busy && !anyBusy() && !tweens.length, panel: panel && { slot: panel.slot, screws: panel.screws.map(s => [s.in, !!s.busy]) }, busy, tool, auto, sel, slots: { ...slots }, conns: { ...conns } });
  S.resize = () => { if (!built) return; const w = root.clientWidth, h = root.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix() };
  S.enter = () => S.resize();
  let acc = 0, accP = 0, accU = 0;
  S.tick = dt => {
    if (!built) return; T += dt; stepTweens(dt);
    cam.tgt.lerp(cam.goalTgt, Math.min(1, dt * 4)); cam.r += (cam.goalR - cam.r) * Math.min(1, dt * 4);
    camera.position.set(cam.tgt.x + cam.r * Math.sin(cam.ph) * Math.cos(cam.th), cam.tgt.y + cam.r * Math.cos(cam.ph), cam.tgt.z + cam.r * Math.sin(cam.ph) * Math.sin(cam.th)); camera.lookAt(cam.tgt);
    if (powered && lastPost && (lastPost.fans || lastPost.lvl >= 2)) { const sp = 6 + (sensors ? sensors.fanC / 120 : 0); rotors.forEach(r => r.rotation.z += sp * dt) }
    if (powered && lastPost && lastPost.lvl >= 4) rgbM.forEach((m, i) => { m.emissive.setHSL((T * .08 + i * .07) % 1, .9, .55); m.emissiveIntensity = 1.3 });
    ghosts.forEach(g => g.userData.gm && (g.userData.gm.opacity = .22 + Math.sin(T * 5) * .12));
    // Figyelemfelhívás: sárgán villog minden csavar, amivel teendő van
    const pulse = .5 + .5 * Math.sin(T * 6.5);
    items.forEach(it => it.screws.forEach(s => {
      if (!s.sc0) s.sc0 = s.m.scale.clone();
      const need = it.slot != null && !s.busy && (it === panel ? (panelOpened ? !s.in : s.in) : !s.in);
      if (need) { s.mats.forEach(m => { m.emissive.setRGB(1, .72, .08); m.emissiveIntensity = .35 + 1.4 * pulse }); s.m.scale.copy(s.sc0).multiplyScalar(1 + .3 * pulse); s.hl = 1 }
      else if (s.hl) { s.mats.forEach(m => { m.emissive.setHex(0); m.emissiveIntensity = 1 }); s.m.scale.copy(s.sc0); s.hl = 0 }
    }));
    if (powered && lastPost && lastPost.lvl >= 3) { acc += dt; if (acc > .5) { acc = 0; sensors = PCSim.tick(.5, load); renderSensors(); $('#b3-sens').style.display = ''; if (sensors && sensors.shutdown) { const m = sensors.shutdown; powerOff(); showRes({ lvl: 1, t: 'Vészleállás!', d: m }) } } }
    if (powered) { accP += dt; if (accP > .6) { accP = 0; if (lastPost && lastPost.lvl >= 4) paintScreen() } }
    renderer.render(scene, camera);
  };
  return S;
})());
