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
    hair: { n: 'Haj', types: [['Casual', 'Szőke, laza'], ['Suit', 'Szőke, egyenes'], ['Soldier', 'Sötét, hosszú'], ['SciFi', 'Fejpántos'], ['Punk', 'Punk taraj'], ['Adventurer', 'Kalandor'], ['Medieval', 'Ezüst csuklya'], ['Witch', 'Boszorkánykalap'], ['Worker', 'Védősisak'], ['Formal', 'Vörös']] },
    top: { n: 'Felső', types: [['Casual', 'Póló'], ['Punk', 'Crop top'], ['Formal', 'Nyári ruha'], ['Suit', 'Blézer'], ['SciFi', 'Sci-fi dzseki'], ['Witch', 'Varázslóruha'], ['Adventurer', 'Kalandor ing'], ['Soldier', 'Taktikai felső'], ['Worker', 'Láthatósági mellény'], ['Medieval', 'Bőrpáncél']] },
    bottom: { n: 'Alsó', types: [['Casual', 'Leggings'], ['Formal', 'Szoknya'], ['Witch', 'Varázsló szoknya'], ['Punk', 'Szaggatott nadrág'], ['Suit', 'Öltönynadrág'], ['SciFi', 'Sci-fi nadrág'], ['Adventurer', 'Rövidnadrág'], ['Soldier', 'Terepnadrág'], ['Worker', 'Munkanadrág'], ['Medieval', 'Bő nadrág']] },
    shoes: { n: 'Cipő', types: [['Casual', 'Félcipő'], ['Formal', 'Balerinacipő'], ['Suit', 'Elegáns cipő'], ['Punk', 'Platform bakancs'], ['SciFi', 'Sci-fi csizma'], ['Witch', 'Magas csizma'], ['Adventurer', 'Túracsizma'], ['Soldier', 'Bakancs'], ['Worker', 'Munkavédelmi cipő'], ['Medieval', 'Lovaglócsizma']] },
    acc: { n: 'Kiegészítők', multi: true, types: [['glasses', 'Napszemüveg'], ['phones', 'Fejhallgató'], ['bag', 'Táska'], ['tiara', 'Tiara'], ['wings', 'LED-szárnyak'], ['visor', 'VR-szemüveg']] }
  };
  const PATS = [['solid', 'Sima'], ['stripe', 'Csíkos'], ['dots', 'Pöttyös'], ['check', 'Kockás'], ['grad', 'Színátmenet'], ['glitter', 'Csillámos']];
  const SWATCH = ['#111827', '#f8fafc', '#ff4fa3', '#ff9ad5', '#c084fc', '#7c3aed', '#38bdf8', '#22d3ee', '#4ade80', '#a3e635', '#facc15', '#fb923c', '#ef4444', '#94a3b8', '#d4af37', '#8b5a2b'];
  const SKIN = ['#f6d5c0', '#e9b98f', '#c98d60', '#8d5a3b', '#5c3a24'];
  const THEMES = [
    { n: 'Y2K', d: 'Csillámló 2000-es évek: rózsaszín, lila, ezüst, kis napszemüveg és crop top.', hue: [[290, 345]], pat: ['glitter', 'grad'], top: ['Punk', 'Casual'], bottom: ['Formal', 'Witch', 'Punk'], shoes: ['Punk', 'Formal'], acc: ['glasses', 'bag'], light: 'any' },
    { n: 'Cyberpunk', d: 'Éjszakai neonváros: sötét alapszínek, türkiz és lila neon, techno kiegészítők.', hue: [[170, 200], [270, 320]], pat: ['solid', 'grad'], top: ['SciFi', 'Punk', 'Soldier'], bottom: ['SciFi', 'Punk', 'Soldier'], shoes: ['SciFi', 'Punk', 'Soldier'], acc: ['visor', 'phones', 'wings'], neon: true, light: 'dark' },
    { n: 'Pasztell álom', d: 'Puha, világos pasztellszínek, pöttyök és egy kis tiara.', hue: [[180, 360], [0, 60]], pat: ['dots', 'solid', 'grad'], top: ['Casual', 'Formal'], bottom: ['Formal', 'Casual'], shoes: ['Formal', 'Casual'], acc: ['tiara', 'bag'], light: 'light' },
    { n: 'Tech-gála', d: 'Elegáns díjátadó a technológia sztárjainak: sötét, arany vagy csillámló, látványos kiegészítő.', hue: [[40, 55], [260, 300]], pat: ['glitter', 'solid'], top: ['Suit', 'Formal', 'Witch'], bottom: ['Formal', 'Suit', 'Witch'], shoes: ['Suit', 'Formal'], acc: ['wings', 'tiara'], light: 'dark' },
    { n: 'Sportos stílus', d: 'Edzés utáni laza szett: csíkok, élénk színek, sportcipő és fejhallgató.', hue: [[0, 360]], pat: ['stripe', 'solid'], top: ['Casual', 'Adventurer', 'Soldier'], bottom: ['Casual', 'Adventurer', 'Soldier'], shoes: ['Adventurer', 'Casual', 'Soldier'], acc: ['phones'], light: 'any' },
    { n: 'Retró 80-as évek', d: 'Élénk neonszínek, csíkok és kockák, nagy napszemüveg.', hue: [[290, 340], [170, 200], [45, 70]], pat: ['stripe', 'check', 'grad'], top: ['Punk', 'Suit', 'Casual'], bottom: ['Punk', 'Casual'], shoes: ['Punk', 'Casual'], acc: ['glasses', 'phones'], neon: true, light: 'any' }
  ];
  const look = () => ({
    skin: SKIN[1], hair: { type: 'Casual', c: '#d4a55a', c2: '#ff4fa3', pat: 'solid', neon: false },
    top: { type: 'Casual', c: '#f8fafc', c2: '#ff9ad5', pat: 'solid', neon: false }, bottom: { type: 'Casual', c: '#fb923c', c2: '#7c3aed', pat: 'solid', neon: false },
    shoes: { type: 'Casual', c: '#475569', c2: '#111827', pat: 'solid', neon: false }, acc: { list: [], c: '#c084fc', c2: '#22d3ee', pat: 'solid', neon: false }
  });

  const F = { L: look(), part: 'top', theme: 0, t: 90, on: false, run: null, cv: null, ctx: null, round: 0, total: 0, racing: false, best: 0, custom: 0 };
  const hsl = hex => { const n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60 } return [h, s, l] };
  const rgbOf = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255] };
  // ---- 3D modell (Three.js + Quaternius „Ultimate Modular Women”, CC0) ----
  const col = h => new THREE.Color(h).convertSRGBToLinear();
  const M3 = { r: null, scene: null, cam: null, root: null, rotY: 0, vel: .25, drag: null, dirty: true, U: [], neon: [], stage: null, runway: null, flash: null, wings: [], gl: {}, base: null, mixer: null, acts: {}, cur: null, loading: false, anchors: null };
  const PM = { solid: 0, stripe: 1, dots: 2, check: 3, grad: 4, glitter: 0 };
  function patMat(p, o = {}) {
    const U = { uC1: { value: col(p.c) }, uC2: { value: col(p.c2) }, uMode: { value: PM[p.pat] }, uT: { value: 0 }, uGl: { value: p.pat === 'glitter' ? 1 : 0 } }; M3.U.push(U);
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: p.pat === 'glitter' ? .32 : (o.r ?? .72), metalness: p.pat === 'glitter' ? .45 : .04 });
    if (p.neon) { m.emissive = col(p.c); m.emissiveIntensity = .55; M3.neon.push(m) }
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = 'varying vec3 vP;\n' + sh.vertexShader.replace('#include <skinning_vertex>', '#include <skinning_vertex>\n  vP = transformed;');
      sh.fragmentShader = 'varying vec3 vP;\nuniform vec3 uC1;\nuniform vec3 uC2;\nuniform float uMode;\nuniform float uT;\nuniform float uGl;\n' + sh.fragmentShader
        .replace('vec4 diffuseColor = vec4( diffuse, opacity );', `float k = 0.0;
  if (uMode > 0.5 && uMode < 1.5) k = step(0.5, fract(vP.y * 12.0));
  else if (uMode > 1.5 && uMode < 2.5) { vec2 q = fract(vec2((vP.x + vP.z) * 13.0, vP.y * 13.0)) - 0.5; k = 1.0 - step(0.2, length(q)); }
  else if (uMode > 2.5 && uMode < 3.5) k = mod(floor(vP.y * 12.0) + floor((vP.x + vP.z) * 12.0), 2.0);
  else if (uMode > 3.5) k = clamp(0.5 - vP.y * 0.55, 0.0, 1.0);
  vec4 diffuseColor = vec4( mix(uC1, uC2, k), opacity );`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  if (uGl > 0.5) { vec3 g = floor(vP * 70.0); float h = fract(sin(dot(g, vec3(12.9898, 78.233, 37.719))) * 43758.5453); totalEmissiveRadiance += vec3(step(0.9, h) * (0.55 + 0.45 * sin(uT * 7.0 + h * 50.0))) * 1.6; }`);
    };
    m.customProgramCacheKey = () => 'pat3';
    return m;
  }
  function gltfOf(name) {
    if (M3.gl[name]) return M3.gl[name];
    const { GLTFLoader, MeshoptDecoder } = THREE_EXT, ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
    const bin = Uint8Array.from(atob(WOMEN_GLB[name]), c => c.charCodeAt(0)).buffer;
    return (M3.gl[name] = new Promise((res, rej) => ld.parse(bin, '', res, rej)));
  }
  const SLOT = { hair: 'Head', top: 'Body', bottom: 'Legs', shoes: 'Feet' };
  function addM(par, geo, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; par.add(m); return m }
  async function build() {
    if (M3.loading) { M3.again = true; return } M3.loading = true; M3.dirty = false;
    try {
      const L = F.L, base = await gltfOf('Casual');
      if (!M3.base) {
        const arm = THREE_EXT.SkeletonUtils.clone(base.scene); M3.base = arm; M3.root.add(arm);
        M3.arm = arm.getObjectByName('CharacterArmature') || arm; M3.bones = {}; M3.arm.traverse(o => { if (o.isBone) M3.bones[o.name] = o });
        [...M3.arm.children].forEach(c => { if (!c.isBone && c.name !== 'Root') M3.arm.remove(c) });
        M3.mixer = new THREE.AnimationMixer(arm); base.animations.forEach(a => M3.acts[a.name] = M3.mixer.clipAction(a));
        M3.acts.Idle.play(); M3.cur = 'Idle';
        M3.anchors = { head: new THREE.Group(), chest: new THREE.Group(), hips: new THREE.Group() };
        M3.bones.Head.add(M3.anchors.head); M3.bones.Chest.add(M3.anchors.chest); M3.bones.Hips.add(M3.anchors.hips);
      }
      // régi ruhadarabok és kiegészítők törlése
      (M3.parts || []).forEach(p => { p.parent && p.parent.remove(p); p.traverse(o => { if (o.material) o.material.dispose() }) });
      Object.values(M3.anchors).forEach(a => { [...a.children].forEach(c => { a.remove(c); c.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose() }) }) });
      M3.parts = []; M3.U = []; M3.neon = []; M3.wings = [];
      const skin = new THREE.MeshStandardMaterial({ color: col(L.skin), roughness: .6 });
      for (const [slot, suf] of Object.entries(SLOT)) {
        const p = L[slot], g = await gltfOf(p.type), full = THREE_EXT.SkeletonUtils.clone(g.scene), part = full.getObjectByName(`${p.type}_${suf}`); if (!part) continue;
        const mats = {};
        part.traverse(o => { if (o.isSkinnedMesh) { const n = o.material.name; mats[n] = (mats[n] || 0) + o.geometry.attributes.position.count } });
        const cloth = Object.entries(mats).filter(([n]) => n !== 'Skin' && !n.startsWith('Hair')).sort((a, b) => b[1] - a[1]).map(x => x[0]);
        const mainMat = patMat(p), cache = {};
        part.traverse(o => {
          if (!o.isSkinnedMesh) return; const n = o.material.name;
          const bones = o.skeleton.bones.map(b => M3.bones[b.name] || b); o.bind(new THREE.Skeleton(bones, o.skeleton.boneInverses), o.bindMatrix);
          if (n === 'Skin') o.material = skin;
          else if (slot === 'hair' ? n.startsWith('Hair') : n === cloth[0]) o.material = mainMat;
          else { o.material = cache[n] || (cache[n] = o.material.clone()); o.material.roughness = .7 }
          o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
        });
        M3.arm.add(part); M3.parts.push(part);
      }
      // kiegészítők a csontokhoz rögzítve
      const A = L.acc, ac = A.list, am = patMat({ ...A, pat: A.pat === 'glitter' ? 'glitter' : 'solid' }, { r: .3 }), H = M3.anchors.head;
      if (ac.includes('glasses')) { const g = new THREE.Group(); g.position.set(0, .085, .122); H.add(g); [-1, 1].forEach(d => { addM(g, new THREE.TorusGeometry(.026, .005, 8, 24), am, d * .038, 0, 0); addM(g, new THREE.CircleGeometry(.025, 24), new THREE.MeshStandardMaterial({ color: col(A.c), transparent: true, opacity: .6, roughness: .1, metalness: .5 }), d * .038, 0, -.002); const arm = addM(g, new THREE.BoxGeometry(.004, .004, .1), am, d * .064, 0, -.05) }); addM(g, new THREE.CylinderGeometry(.003, .003, .026, 6), am, 0, .004, 0).rotation.z = Math.PI / 2 }
      if (ac.includes('visor')) { const vm = new THREE.MeshStandardMaterial({ color: col(A.c), emissive: col(A.c2), emissiveIntensity: .8, transparent: true, opacity: .88, side: THREE.DoubleSide, metalness: .6, roughness: .15 }); const v = addM(H, new THREE.CylinderGeometry(.105, .105, .05, 40, 1, true, -Math.PI * .45, Math.PI * .9), vm, 0, .085, .0) }
      if (ac.includes('phones')) { addM(H, new THREE.TorusGeometry(.11, .012, 10, 32, Math.PI), am, 0, .1, -.01); [-1, 1].forEach(d => { addM(H, new THREE.CylinderGeometry(.04, .04, .035, 24), am, d * .105, .09, 0).rotation.z = Math.PI / 2 }) }
      if (ac.includes('tiara')) { const tm2 = new THREE.MeshStandardMaterial({ color: col(0xe5e7eb), metalness: .95, roughness: .15 }); const g = new THREE.Group(); g.position.set(0, .2, .02); g.rotation.x = -.3; H.add(g); addM(g, new THREE.TorusGeometry(.085, .006, 8, 32, Math.PI), tm2).rotation.x = -Math.PI / 2; for (let k = 0; k < 5; k++) { const a = Math.PI * (.15 + k * .175), h = k === 2 ? .055 : .035; addM(g, new THREE.ConeGeometry(.01, h, 8), tm2, Math.cos(a) * .085, h / 2, Math.sin(a) * .085) } addM(g, new THREE.OctahedronGeometry(.013), new THREE.MeshStandardMaterial({ color: col(A.c), emissive: col(A.c), emissiveIntensity: .7, metalness: .5, roughness: .1 }), 0, .06, .085) }
      if (ac.includes('bag')) { const bg = addM(M3.anchors.hips, new THREE.BoxGeometry(.15, .12, .06), am, .22, -.02, .02); bg.rotation.z = -.1; const strap = addM(M3.anchors.chest, new THREE.CylinderGeometry(.007, .007, .62, 6), am, .05, -.08, .1); strap.rotation.z = -.9 }
      if (ac.includes('wings')) { const shp = new THREE.Shape(); shp.moveTo(0, 0); shp.bezierCurveTo(.25, .5, .7, .45, .62, .05); shp.bezierCurveTo(.55, -.25, .2, -.35, 0, 0); const wm = new THREE.MeshStandardMaterial({ color: col(A.c2), emissive: col(A.c2), emissiveIntensity: 1.5, transparent: true, opacity: .72, side: THREE.DoubleSide }); [-1, 1].forEach(d => { const g = new THREE.Group(); g.position.set(d * .03, .0, -.12); M3.anchors.chest.add(g); const w = addM(g, new THREE.ShapeGeometry(shp, 24), wm); w.scale.x = d; M3.wings.push([g, d]) }) }
    } finally { M3.loading = false; if (M3.again) { M3.again = false; M3.dirty = true } }
  }
  function alignAnchors() {
    // a csontok saját tengelyei helyett a modell tengelyeihez igazítjuk a rögzítőpontokat
    const qr = new THREE.Quaternion(); M3.root.getWorldQuaternion(qr);
    Object.entries(M3.anchors).forEach(([k, a]) => { const b = a.parent, qb = new THREE.Quaternion(); b.getWorldQuaternion(qb); a.quaternion.copy(qb.invert().multiply(qr)); const s = new THREE.Vector3(); b.getWorldScale(s); a.scale.set(1 / s.x, 1 / s.y, 1 / s.z) });
  }
  function m3Init() {
    if (M3.r || M3.tried || typeof THREE === 'undefined' || typeof THREE_EXT === 'undefined') return; M3.tried = true;
    const r = new THREE.WebGLRenderer({ canvas: F.cv, antialias: true }); r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = .95; r.shadowMap.enabled = !window.LOWFX; r.shadowMap.type = THREE.PCFSoftShadowMap; r.setPixelRatio(Math.min(window.LOWFX ? 1 : 2, devicePixelRatio || 1)); M3.r = r;
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x150c1a); sc.fog = new THREE.Fog(0x150c1a, 7, 16); M3.scene = sc;
    M3.cam = new THREE.PerspectiveCamera(30, 1, .05, 50);
    sc.add(new THREE.HemisphereLight(0xffe4f2, 0x24102a, .6));
    const key = new THREE.DirectionalLight(0xfff4f0, 1.3); key.position.set(1.6, 3.4, 2.6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.camera.near = .5; key.shadow.camera.far = 10; ['left', 'bottom'].forEach(k => key.shadow.camera[k] = -2); ['right', 'top'].forEach(k => key.shadow.camera[k] = 2); key.shadow.bias = -.0005; sc.add(key);
    const rim = new THREE.SpotLight(0xff4fa3, 1.8, 10, .6, .5); rim.position.set(-1.6, 3, -2.4); rim.target.position.set(0, 1, 0); sc.add(rim, rim.target);
    const fill = new THREE.PointLight(0x60a5fa, .6, 8); fill.position.set(-2.2, 1.4, 1.6); sc.add(fill);
    const root = new THREE.Group(); sc.add(root); M3.root = root;
    const st = new THREE.Group(); sc.add(st); M3.stage = st;
    addM(st, new THREE.CylinderGeometry(.9, .95, .06, 64), new THREE.MeshStandardMaterial({ color: 0x241a2e, roughness: .35, metalness: .4 }), 0, -.03, 0).receiveShadow = true;
    const ring = addM(st, new THREE.TorusGeometry(.92, .014, 8, 96), new THREE.MeshStandardMaterial({ color: 0xff4fa3, emissive: 0xff4fa3, emissiveIntensity: 1.4 }), 0, .005, 0); ring.rotation.x = Math.PI / 2;
    const fl = addM(sc, new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x120a16, roughness: .9 }), 0, -.06, 0); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; fl.castShadow = false;
    const rw = new THREE.Group(); rw.visible = false; sc.add(rw); M3.runway = rw;
    addM(rw, new THREE.BoxGeometry(1.6, .1, 14), new THREE.MeshStandardMaterial({ color: 0x1d1424, roughness: .25, metalness: .5 }), 0, -.05, -5).receiveShadow = true;
    [-1, 1].forEach(d => { addM(rw, new THREE.BoxGeometry(.04, .03, 14), new THREE.MeshStandardMaterial({ color: 0xff4fa3, emissive: 0xff4fa3, emissiveIntensity: 1.6 }), d * .8, .01, -5); for (let k = 0; k < 10; k++) { const p = addM(rw, new THREE.CylinderGeometry(.06, .06, .02, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xc084fc, emissiveIntensity: 1.2 }), d * 1.2, .2 + Math.random() * .6, -k * 1.4 + 1); p.rotation.x = Math.PI / 2 } });
    M3.flash = new THREE.PointLight(0xffffff, 0, 6); sc.add(M3.flash);
    F.cv.style.touchAction = 'none';
    F.cv.addEventListener('pointerdown', e => { if (F.run) return; M3.drag = { x: e.clientX, r: M3.rotY }; M3.vel = 0; F.cv.setPointerCapture(e.pointerId) });
    F.cv.addEventListener('pointermove', e => { if (!M3.drag) return; const nr = M3.drag.r + (e.clientX - M3.drag.x) * .012; M3.vel = (nr - M3.rotY) * 30; M3.rotY = nr });
    F.cv.addEventListener('pointerup', () => { M3.drag = null; if (Math.abs(M3.vel) < .05) M3.vel = .25 });
  }
  function play(name) { if (M3.cur === name || !M3.acts[name]) return; const a = M3.acts[name], b = M3.acts[M3.cur]; a.reset().play(); if (b) a.crossFadeFrom(b, .35, false); if (name === 'Wave') { a.setLoop(THREE.LoopRepeat) } M3.cur = name }
  function m3Frame(T, dt) {
    if (!M3.r || !F.cv.clientWidth) return; if (M3.dirty && !M3.loading) build();
    const w = F.cv.clientWidth, h = F.cv.clientHeight, sz = M3.r.getSize(new THREE.Vector2()); if (sz.x !== w || sz.y !== h) { M3.r.setSize(w, h, false); M3.cam.aspect = w / h; M3.cam.updateProjectionMatrix() }
    const R = F.run, root = M3.root, cam = M3.cam; M3.runway.visible = !!R; M3.stage.visible = !R;
    if (R) {
      const p = Math.min(1, R.t / 3.2); play(p < 1 ? 'Walk' : 'Wave'); root.position.set(0, 0, -6.2 + p * 6.2); root.rotation.y = 0;
      cam.position.set(Math.sin(R.t * .4) * .3, 1.15, root.position.z + 4.3 + (1 - p) * .6); cam.lookAt(0, .9, root.position.z);
      M3.flash.intensity = Math.random() < .12 ? 3 + Math.random() * 3 : M3.flash.intensity * .7; M3.flash.position.set((Math.random() - .5) * 3, 1.2, root.position.z + 1.6);
    } else {
      play('Idle'); if (!M3.drag) { M3.rotY += M3.vel * dt; M3.vel += (.25 - M3.vel) * Math.min(1, dt * .8) }
      root.position.set(0, 0, 0); root.rotation.y = M3.rotY; cam.position.set(0, 1.0, 4.3); cam.lookAt(0, .98, 0); M3.flash.intensity = 0;
    }
    if (M3.mixer) { M3.mixer.update(dt); root.updateMatrixWorld(true); alignAnchors() }
    M3.wings.forEach(([g, d]) => { g.rotation.y = d * (.35 + Math.sin(T * 4) * .25) });
    M3.U.forEach(u => u.uT.value = T);
    M3.neon.forEach(m => m.emissiveIntensity = .45 + .2 * Math.sin(T * 4));
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
