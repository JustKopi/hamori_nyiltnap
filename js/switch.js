/* ===== 3. Kapcsoló-labor: VLAN, szórási vihar, STP, DHCP ===== */
App.add((() => {
  const S = {
    id: 'kapcsolo', icon: '', title: 'Kapcsoló-labor', color: '#a78bfa',
    desc: 'VLAN-ok, szórási vihar és STP – vagy építs saját hálózatot a szabad laborban: kábelezz, adj IP-címet, állíts be átjárót, és pingelj!',
    topic: 'Kapcsolók, VLAN, 2. rétegbeli redundancia (STP), DHCP'
  };
  const VL = { 10: { c: '#5b9dff', n: 'Diákok' }, 20: { c: '#fb923c', n: 'Tanárok' }, 30: { c: '#4ade80', n: 'Vendég' } };
  let C, ctx, T = 0, mode = 'shout', paint = 10, stp = false, frames = [], storm = 0, stormShown = false, hover = null;
  let nodes, links, phoneN = 0;
  function reset() {
    nodes = [
      { id: 'R', x: .5, y: .13, t: 'router', icon: '', label: 'Router + DHCP' },
      { id: 'S1', x: .5, y: .40, t: 'sw', label: 'SW1' },
      { id: 'S2', x: .24, y: .66, t: 'sw', label: 'SW2' },
      { id: 'S3', x: .76, y: .66, t: 'sw', label: 'SW3' },
    ];
    const pcs = [['S1', .30, .40], ['S1', .70, .40], ['S2', .07, .90], ['S2', .17, .90], ['S2', .27, .90], ['S2', .37, .90], ['S3', .63, .90], ['S3', .73, .90], ['S3', .83, .90], ['S3', .93, .90]];
    pcs.forEach(([sw, x, y], i) => nodes.push({ id: 'P' + i, x, y, t: 'pc', sw, vlan: 10, host: 11 + i * 3, icon: i < 2 ? '' : '' }));
    links = [{ a: 'R', b: 'S1', alive: true, trunk: true }, { a: 'S1', b: 'S2', alive: true, trunk: true }, { a: 'S1', b: 'S3', alive: true, trunk: true }, { a: 'S2', b: 'S3', alive: false, trunk: true, spare: true }];
    nodes.filter(n => n.t === 'pc').forEach(n => links.push({ a: n.sw, b: n.id, alive: true }));
    frames = []; storm = 0; stormShown = false; phoneN = 0; updBtns();
  }
  const N = id => nodes.find(n => n.id === id);
  const px = n => n.x * C.W, py = n => n.y * C.H;
  const ip = n => `192.168.${n.vlan}.${n.host}`;
  function blocked(l) {
    if (!stp || !l.alive || !l.trunk || l.a === 'R') return false;
    // STP: SW1 a gyökér; feszítőfa szélességi bejárással, a fölösleges link blokkolva
    const seen = new Set(['S1']), tree = new Set(), q = ['S1'];
    while (q.length) {
      const u = q.shift();
      for (const k of links) if (k.alive && k.trunk && k.a !== 'R' && (k.a === u || k.b === u)) {
        const v = k.a === u ? k.b : k.a; if (!seen.has(v)) { seen.add(v); tree.add(k); q.push(v) }
      }
    }
    return !tree.has(l);
  }
  const active = l => l.alive && !blocked(l);
  const linksOf = id => links.filter(l => active(l) && (l.a === id || l.b === id));
  const other = (l, id) => l.a === id ? l.b : l.a;
  function send(from, to, vlan, kind, extra = {}) { frames.push({ from, to, t: 0, vlan, kind, ...extra }) }
  function shout(pc) {
    if (pc.dhcpWait) return;
    beep(600, .08, 'square', .05, 200); pc.flash = 1; send(pc.id, pc.sw, pc.vlan, 'bc', { src: pc.id });
    let loop = links.find(l => l.spare).alive && !stp && links.filter(l => l.trunk && l.a !== 'R' && l.alive).length >= 3;
    if (loop) { storm = 1; stormShown = false }
  }
  function arrive(f) {
    const n = N(f.to);
    if (f.kind === 'bc') {
      if (n.t === 'pc') { if (n.id !== f.src) { n.flash = 1; sfx.blip() } return }
      if (n.t === 'router') { if (f.dhcp) dhcpOffer(f); else n.flash = .6; return }
      for (const l of linksOf(n.id)) {
        const o = N(other(l, n.id)); if (o.id === f.from) continue;
        if (o.t === 'pc' && o.vlan !== f.vlan) continue;
        if (frames.length > 260 && o.t === 'sw') continue;
        send(n.id, o.id, f.vlan, 'bc', { src: f.src, dhcp: f.dhcp });
      }
      if (storm) storm++;
    } else if (f.kind === 'uni') {
      const i = f.path.indexOf(n.id);
      if (i < f.path.length - 1) send(n.id, f.path[i + 1], f.vlan, 'uni', { path: f.path, done: f.done });
      else f.done && f.done();
    }
  }
  function pathTo(a, b) {
    const prev = { [a]: null }, q = [a];
    while (q.length) { const u = q.shift(); if (u === b) break; for (const l of linksOf(u)) { const v = other(l, u); if (!(v in prev)) { prev[v] = u; q.push(v) } } }
    if (!(b in prev)) return null; const p = [b]; while (prev[p[0]] !== null) p.unshift(prev[p[0]]); return p;
  }
  function addPhone() {
    const sw = pick(['S2', 'S3']), base = N(sw), used = nodes.filter(n => n.t === 'pc');
    if (phoneN >= 4) { toast('Elfogytak a szabad portok! ', '#fbbf24'); return }
    const slots = [[.07, .63], [.93, .63], [.43, .8], [.57, .8]];
    const [x, y] = slots[phoneN++];
    const n = { id: 'F' + phoneN, x, y, t: 'pc', sw: x < .5 ? 'S2' : 'S3', vlan: 30, host: null, icon: '', dhcpWait: true, phone: true };
    nodes.push(n); links.push({ a: n.sw, b: n.id, alive: true });
    toast('Új telefon csatlakozott. <b>„Kaphatok IP-címet?”</b> (DHCP Discover)', '#4ade80');
    setTimeout(() => { send(n.id, n.sw, n.vlan, 'bc', { src: n.id, dhcp: n.id }); beep(500, .1, 'triangle', .06, 300) }, 700);
  }
  function dhcpOffer(f) {
    const ph = N(f.dhcp); if (!ph || !ph.dhcpWait || ph.offering) return; ph.offering = true;
    const p = pathTo('R', ph.id); if (!p) return;
    N('R').flash = 1; beep(900, .1, 'triangle', .06, 200);
    send('R', p[1], ph.vlan, 'uni', { path: p, done: () => { ph.host = rnd(100, 199); ph.dhcpWait = false; ph.flash = 1; sfx.ok(); toast(`DHCP: a telefon megkapta a címet: <b>${ip(ph)}</b>`, '#4ade80') } });
  }
  function step(dt) {
    for (const f of [...frames]) {
      const a = N(f.from), b = N(f.to), l = links.find(k => (k.a === f.from && k.b === f.to) || (k.b === f.from && k.a === f.to));
      if (!l || !active(l)) { frames.splice(frames.indexOf(f), 1); continue }
      const L = Math.hypot(px(a) - px(b), py(a) - py(b)); f.t += dt * (storm ? 900 : 420) / Math.max(L, 1);
      if (f.t >= 1) { frames.splice(frames.indexOf(f), 1); arrive(f) }
    }
    nodes.forEach(n => n.flash = Math.max(0, (n.flash || 0) - dt * 1.5));
    if (storm) {
      storm += dt * 60;
      if (storm > 220 && !stormShown) {
        stormShown = true; sfx.alarm(); noise(.6, .12);
        $('#k-storm').classList.add('show'); setTimeout(() => { $('#k-storm').classList.remove('show'); frames = []; storm = 0 }, 4200);
      }
    }
    $('#k-count').textContent = storm ? Math.round(Math.pow(1.09, Math.min(storm, 260))).toLocaleString('hu-HU') : frames.length;
  }
  const BOX = { sw: [78, 18], router: [58, 24], pc: [26, 28] };
  function edgeR(n, ux, uy) { const [hw, hh] = BOX[n.t] || [24, 24]; return Math.min(Math.abs(ux) > 1e-3 ? hw / Math.abs(ux) : 1e9, Math.abs(uy) > 1e-3 ? hh / Math.abs(uy) : 1e9) }
  const VCAB = { 10: 'cyan', 20: 'orange', 30: 'green' };
  function layoutLinks() { for (const l of links) { const a = N(l.a), b = N(l.b); l.P = Cable.pts(px(a), py(a), px(b), py(b), l.trunk ? .05 : .04) } }
  function onLink(from, to, t) { const l = links.find(k => (k.a === from && k.b === to) || (k.b === from && k.a === to)); if (!l.P) layoutLinks(); return Cable.at(l.P, l.a === from ? t : 1 - t) }
  function draw() {
    const W = C.W, H = C.H; ctx.clearRect(0, 0, W, H); layoutLinks();
    const shake = storm > 120 ? (Math.random() - .5) * Math.min(14, storm / 20) : 0; ctx.save(); ctx.translate(shake, shake);
    for (const l of links) {
      const a = N(l.a), b = N(l.b), x1 = px(a), y1 = py(a), x2 = px(b), y2 = py(b), L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
      const o = { w: l.trunk ? 6 : 4, sag: l.trunk ? .05 : .04, r1: edgeR(a, ux, uy), r2: edgeR(b, -ux, -uy) };
      if (!l.alive && l.spare) { ctx.save(); ctx.setLineDash([3, 9]); ctx.strokeStyle = '#ffffff26'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1 + ux * o.r1, y1 + uy * o.r1); ctx.lineTo(x2 - ux * o.r2, y2 - uy * o.r2); ctx.stroke(); ctx.restore();
        ctx.fillStyle = '#6b7180'; ctx.font = '500 12px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('szabad port – ide jön a tartalék kábel', (x1 + x2) / 2, (y1 + y2) / 2 - 12); continue }
      const bl = blocked(l);
      Cable.draw(ctx, x1, y1, x2, y2, { ...o, type: l.trunk ? (storm > 60 ? 'red' : 'violet') : VCAB[b.vlan] || 'gray', cut: !l.alive, alpha: bl ? .4 : 1, glow: l === hover && l.alive ? '#f87171' : null });
      if (l.trunk && l.alive && !bl && l.a !== 'R') { const [mx, my] = Cable.at(l.P, .5); ctx.fillStyle = 'rgba(11,12,15,.85)'; rrect(ctx, mx - 30, my - 22, 60, 18, 6); ctx.fill(); ctx.font = '700 10px Inter,sans-serif'; ctx.fillStyle = '#c4b5fd'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TRÖNK', mx, my - 13) }
      if (bl) { const [bx, by] = Cable.at(l.P, .78); ctx.fillStyle = '#fb923c'; rrect(ctx, bx - 50, by - 13, 100, 26, 8); ctx.fill(); ctx.fillStyle = '#1a0f05'; ctx.font = '700 12px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PORT BLOKKOLVA', bx, by + 1) }
      if (!l.alive && !l.spare) { const [mx, my] = Cable.at(l.P, .5); ctx.fillStyle = '#f87171'; ctx.font = '600 11px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('kattints a javításhoz', mx, my - 14) }
    }
    for (const f of frames) {
      const [x, y] = onLink(f.from, f.to, f.t);
      const col = f.kind === 'uni' ? '#ffffff' : VL[f.vlan].c; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10;
      rrect(ctx, x - 9, y - 6, 18, 12, 3); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 9, y - 6); ctx.lineTo(x, y + 1); ctx.lineTo(x + 9, y - 6); ctx.stroke();
      if (f.dhcp || f.kind === 'uni') { ctx.font = '700 10px Inter,sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(f.kind === 'uni' ? 'OFFER' : 'DHCP?', x, y - 14) }
    }
    for (const n of nodes) {
      const x = px(n), y = py(n), fl = n.flash || 0;
      if (n.t === 'sw') { Dev.draw(ctx, 'switch', x, y, 156, { t: T, label: '', bad: storm > 100, storm: storm > 30 }); ctx.fillStyle = 'rgba(11,12,15,.85)'; rrect(ctx, x - 44, y - 42, 88, 20, 6); ctx.fill(); ctx.fillStyle = '#e5e7eb'; ctx.font = '700 12px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Kapcsoló ' + n.label, x, y - 32) }
      else if (n.t === 'router') {
        Dev.draw(ctx, 'corerouter', x, y, 116, { t: T });
        ctx.font = '600 12px Inter,sans-serif'; ctx.fillStyle = '#e5e7eb'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(n.label, x, y - 36);
      } else {
        const col = VL[n.vlan].c;
        Dev.draw(ctx, n.phone ? 'phone' : 'desktop', x, y, n.phone ? 54 : 64, { t: T, screen: col, flash: fl });
        const lab = n.dhcpWait ? 'IP-cím kérése…' : ip(n); ctx.font = '600 11px "JetBrains Mono",Consolas,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const lw = ctx.measureText(lab).width + 12; ctx.fillStyle = 'rgba(11,12,15,.85)'; rrect(ctx, x - lw / 2, y + 30, lw, 32, 6); ctx.fill();
        ctx.fillStyle = col; ctx.fillText(lab, x, y + 39); ctx.font = '500 11px Inter,sans-serif'; ctx.fillStyle = '#c9ccd3'; ctx.fillText('VLAN ' + n.vlan + ' · ' + VL[n.vlan].n, x, y + 53);
        if (fl > .3) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.globalAlpha = fl; for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.arc(x, y - 6, 26 + k * 8 * (1.3 - fl), -Math.PI * .8, -Math.PI * .2); ctx.stroke() } ctx.restore() }
      }
    }
    ctx.restore();
  }
  function hitNode(mx, my) { return nodes.find(n => n.t === 'pc' && Math.hypot(mx - px(n), my - py(n)) < 30) }
  function hitLink(mx, my) {
    let best = null, bd = 14;
    for (const l of links) { if (!l.trunk || l.a === 'R' || !l.alive || !l.P) continue; const [d, t] = Cable.dist(l.P, mx, my); if (t > .15 && t < .85 && d < bd) { bd = d; best = l } }
    return best;
  }
  function updBtns() {
    if (!$('#k-spare')) return;
    const sp = links.find(l => l.spare);
    $('#k-spare').textContent = sp.alive ? 'Tartalék kábel: BEDUGVA' : 'Tartalék kábel bedugása';
    $('#k-spare').classList.toggle('sel', sp.alive);
    $('#k-stp').textContent = stp ? 'STP: BEKAPCSOLVA' : 'STP: KIKAPCSOLVA'; $('#k-stp').classList.toggle('sel', stp);
    $$('[data-m]').forEach(b => b.classList.toggle('sel', (b.dataset.m === 'shout' && mode === 'shout') || (mode === 'paint' && +b.dataset.m === paint)));
  }
  function buildDemo(root) {
    root.innerHTML = `<style>
      #k-side{position:absolute;top:12px;left:12px;width:300px;font-size:15px;line-height:1.45;z-index:2}
      #k-side h3{margin:0 0 6px;color:var(--yellow);font-size:17px}
      #k-tools{position:absolute;right:12px;top:12px;display:flex;flex-direction:column;gap:8px;z-index:2;width:270px}
      #k-tools .btn{font-size:16px;text-align:left}
      #k-tools .row{display:flex;gap:6px}#k-tools .row .btn{flex:1;text-align:center;padding:8px 4px}
      #k-storm{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%) scale(.5);opacity:0;pointer-events:none;z-index:5;background:#2a0710f2;border:4px solid var(--red);border-radius:24px;padding:20px 34px;text-align:center;transition:all .3s cubic-bezier(.2,1.6,.4,1);max-width:640px}
      #k-storm.show{opacity:1;transform:translate(-50%,-50%) scale(1)}
      #k-storm h2{margin:0;font-size:42px;color:#ff6b6b}#k-storm p{font-size:18px;margin:8px 0 0}
      #st-kapcsolo canvas{cursor:pointer}
    </style>
    <div class="panel" id="k-side"><h3>Kísérletek</h3>
      <b>1.</b> Kattints egy gépre: <b>szórásos üzenetet</b> küld („kiabál”). Mindenki megkapja.<br>
      <b>2.</b> Fogj egy festéket, és oszd <b>VLAN-okba</b> a gépeket! Most csak az azonos színűek hallják egymást.<br>
      <b>3.</b> Dugd be a tartalék kábelt, és kiabálj… <br>
      <b>4.</b> Kapcsold be az <b>STP-t</b>, és próbáld újra! Utána vágd el a SW1–SW3 kábelt!<br>
      <b>5.</b> Csatlakoztass új telefont: a <b>DHCP</b> automatikusan ad neki IP-címet.
      <div style="margin-top:8px;font-size:14px;color:var(--muted)">Keretek a hálózaton: <b id="k-count" style="color:var(--cyan)">0</b></div></div>
    <div id="k-tools">
      <button class="btn sel" data-m="shout">Kiabálás (broadcast)</button>
      <div class="row"><button class="btn" data-m="10" style="color:${VL[10].c}">Diák</button><button class="btn" data-m="20" style="color:${VL[20].c}">Tanár</button><button class="btn" data-m="30" style="color:${VL[30].c}">Vendég</button></div>
      <button class="btn" id="k-spare"></button><button class="btn" id="k-stp"></button>
      <button class="btn" id="k-phone">Új telefon (DHCP)</button><button class="btn" id="k-reset">↺ Alaphelyzet</button>
    </div>
    <div id="k-storm"><h2>SZÓRÁSI VIHAR!</h2><p>A keretek körbe-körbe száguldanak a hurokban, és minden körben megduplázódnak. Pár másodperc alatt <b>milliónyi</b> keret bénítja meg a hálózatot!<br><br>Megoldás: az <b>STP</b> (Spanning Tree Protocol) letilt egy portot, így megszűnik a hurok, de a tartalék út megmarad.</p></div>`;
    C = makeCanvas(root); ctx = C.ctx; reset();
    $$('[data-m]', root).forEach(b => b.onclick = () => { if (b.dataset.m === 'shout') mode = 'shout'; else { mode = 'paint'; paint = +b.dataset.m } sfx.click(); updBtns() });
    $('#k-spare').onclick = () => { const sp = links.find(l => l.spare); sp.alive = !sp.alive; beep(sp.alive ? 700 : 300, .12, 'triangle', .06); updBtns(); if (sp.alive && !stp) toast('Kialakult egy <b>hurok</b>! Most kiabálj egyet…', '#fb923c') };
    $('#k-stp').onclick = () => { stp = !stp; frames = []; storm = 0; beep(stp ? 900 : 300, .15, 'triangle', .06); updBtns(); if (stp) toast('Az STP kiszámolta a feszítőfát, és a fölösleges portot <b>blokkolta</b>.', '#4ade80') };
    $('#k-phone').onclick = addPhone;
    $('#k-reset').onclick = () => { stp = false; mode = 'shout'; reset(); updBtns() };
    C.cv.addEventListener('mousemove', e => { const r = C.cv.getBoundingClientRect(); hover = hitLink(e.clientX - r.left, e.clientY - r.top) });
    C.cv.addEventListener('pointerdown', e => {
      const r = C.cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, n = hitNode(mx, my);
      if (n) {
        if (mode === 'paint') { if (n.vlan !== paint) { n.vlan = paint; n.flash = 1; if (!n.phone) n.host = n.host; beep(500 + paint * 20, .08, 'triangle', .06) } }
        else shout(n);
        return;
      }
      const dead = links.find(l => !l.alive && !l.spare && l.P && Math.hypot(mx - Cable.at(l.P, .5)[0], my - Cable.at(l.P, .5)[1]) < 26);
      if (dead) { dead.alive = true; beep(700, .12, 'triangle', .06); return }
      const l = hitLink(mx, my);
      if (l && l.alive) {
        l.alive = false; noise(.2, .08); FX.burst(e.clientX, e.clientY, 25, ['#fbbf24', '#fb923c']);
        if (stp && links.find(k => k.spare).alive) toast('Az STP észlelte a kiesést, és <b>engedélyezte a tartalék utat</b>!', '#4ade80', 3000);
        updBtns();
      }
    });
    updBtns();
  };
  let tab = 'demo';
  function setTab(t) { tab = t; $('#k-demo').style.display = t === 'demo' ? '' : 'none'; $('#k-lab').style.display = t === 'lab' ? '' : 'none'; $$('[data-tab]').forEach(b => b.classList.toggle('sel', b.dataset.tab === t)); S.resize() }
  S.build = root => {
    root.innerHTML = `<style>.k-pane{position:absolute;inset:0}#k-tabs{position:absolute;left:50%;transform:translateX(-50%);top:10px;z-index:6;display:flex;gap:6px;background:var(--panel);border:1px solid var(--line2);border-radius:14px;padding:6px}#k-tabs .btn{height:40px;font-size:15px;padding:0 16px}</style>
      <div class="k-pane" id="k-demo"></div><div class="k-pane" id="k-lab" style="display:none"></div>
      <div id="k-tabs"><button class="btn sel" data-tab="demo">VLAN és STP bemutató</button><button class="btn" data-tab="lab">Szabad labor (kötögetés)</button></div>`;
    buildDemo($('#k-demo')); Lab.mount($('#k-lab'));
    $$('[data-tab]', root).forEach(b => b.onclick = () => { setTab(b.dataset.tab); sfx.click() });
  };
  S.resize = () => { C && C.resize(); Lab.resize() };
  S.tick = dt => { if (tab === 'demo') { T += dt; step(dt); draw() } else Lab.tick(dt) };
  S.leave = () => Lab.stopRace();
  S.comp = { rules: 'Szabad laborban kell megoldanod a 3 feladatot (két gép egy kapcsolón, két hálózat routerrel, DHCP). Feladatonként 400 pont, és ha mindhárom kész, időbónusz is jár.', start: () => { setTab('lab'); Lab.startRace() } };
  S.score = () => Lab.best;
  return S;
})());
