/* ===== Felhő-üzemeltető: virtualizáció, konténerek, élő migráció ===== */
App.add((() => {
  const S = {
    id: 'felho', icon: '', title: 'Felhő-üzemeltető', color: '#38bdf8',
    desc: 'Ügyfelek virtuális gépeket kérnek. Pakold be őket a szerverekre, spórolj az árammal, és mentsd át őket, ha egy gép kiesik!',
    topic: 'Virtualizáció, konténerek, felhőszolgáltatások (IaaS/PaaS), magas rendelkezésre állás'
  };
  const CAP = { cpu: 16, ram: 64 };
  const REQ = [
    ['Webshop', 'globe', 4, 8, 'VM', '#5b9dff'], ['Adatbázis', 'layers', 6, 32, 'VM', '#a78bfa'], ['Minecraft-szerver', 'gamepad', 4, 16, 'VM', '#4ade80'],
    ['Iskolai e-napló', 'school', 2, 8, 'VM', '#fbbf24'], ['AI-modell', 'bulb', 8, 48, 'VM', '#f472b6'], ['API', 'code', 1, 2, 'konténer', '#38bdf8'],
    ['Levelezés', 'mail', 2, 12, 'VM', '#fb923c'], ['Videó-átkódolás', 'video', 10, 16, 'VM', '#f87171'], ['Weboldal', 'globe', 1, 2, 'konténer', '#22d3ee'],
    ['Chat-szerver', 'user', 2, 4, 'konténer', '#34d399']
  ];
  const DUR = 90;
  let root, G, best = 0, sel = null; const seen = new Set();
  function fresh() {
    return { on: false, t: DUR, money: 0, queue: [], hosts: [mkHost(0), mkHost(1), mkHost(2)], spawnT: 1, failT: 22, lost: 0, served: 0, migr: 0, kwh: 0, uid: 0, msg: [] };
  }
  function mkHost(i) { return { i, on: true, vms: [], fail: 0, dead: false } }
  const used = (h, k) => h.vms.reduce((a, v) => a + v[k], 0);
  function spawn() {
    if (G.queue.length >= 5) return; const r = pick(REQ), late = DUR - G.t;
    G.queue.push({ id: ++G.uid, n: r[0], ic: r[1], cpu: r[2], ram: r[3], kind: r[4], col: r[5], wait: 14, life: rnd(18, 34), pay: Math.round((r[2] * 3 + r[3] / 3) * (1 + late / 120)) });
    beep(1100, .05, 'triangle', .04); render();
  }
  function place(req, h) {
    if (!h.on || h.dead) { toast('Ez a szerver nem fut.', '#f87171'); return false }
    if (used(h, 'cpu') + req.cpu > CAP.cpu || used(h, 'ram') + req.ram > CAP.ram) { sfx.bad(); toast(`Nem fér el: ${CAP.cpu - used(h, 'cpu')} mag és ${CAP.ram - used(h, 'ram')} GB szabad.`, '#f87171', 1800); return false }
    h.vms.push(req); sfx.ok(); return true;
  }
  function click(kind, id) {
    if (!G.on) return;
    if (kind === 'q') { sel = sel && sel.id === id ? null : { from: 'q', id }; sfx.click(); render(); return }
    if (kind === 'vm') { const [hi, vid] = id; sel = { from: 'h', h: hi, id: vid }; sfx.click(); render(); return }
    if (kind === 'host') {
      const h = G.hosts[id]; if (!sel) return;
      if (sel.from === 'q') { const r = G.queue.find(x => x.id === sel.id); if (r && place(r, h)) { G.queue = G.queue.filter(x => x !== r); G.served++; FX.burstEl($(`[data-h="${id}"]`), 14, [r.col]) } }
      else if (sel.h !== id) { const src = G.hosts[sel.h], v = src.vms.find(x => x.id === sel.id); if (v && place(v, h)) { src.vms = src.vms.filter(x => x !== v); if (src.fail) { G.migr++; toast(`<b>Élő migráció</b>: ${v.n} átköltözött, az ügyfél észre sem vette!`, '#4ade80', 2200) } } }
      sel = null; render();
    }
  }
  function render() {
    if (!root) return;
    $('#c-q').innerHTML = G.queue.map(r => `<div class="c-req ${seen.has(r.id) ? "" : "new"} ${sel && sel.from === 'q' && sel.id === r.id ? 'sel' : ''} ${r.wait < 5 ? 'urg' : ''}" data-q="${r.id}" style="--c:${r.col}"><span class="c-ic">${icon(r.ic, 20)}</span><div><b>${r.n}</b><span>${r.kind} • ${r.cpu} mag • ${r.ram} GB</span><i><em style="width:${r.wait / 14 * 100}%"></em></i></div><strong>${r.pay} Ft/mp</strong></div>`).join('') || '<div class="c-empty">Nincs várakozó kérés.</div>';
    G.queue.forEach(r => setTimeout(() => seen.add(r.id), 400));
    $('#c-hosts').innerHTML = G.hosts.map((h, i) => {
      const uc = used(h, 'cpu'), ur = used(h, 'ram');
      return `<div class="c-host ${h.dead ? 'dead' : h.fail ? 'fail' : ''} ${!h.on ? 'off' : ''}" data-h="${i}">
        <div class="c-hh"><img alt="" src="${Dev.img('rack', 34)}" style="width:34px"><div><b>Szerver ${i + 1}</b><span>${h.dead ? 'MEGHIBÁSODOTT' : h.fail ? `HIBA! ${Math.ceil(h.fail)} mp a leállásig` : h.on ? '16 mag • 64 GB' : 'kikapcsolva (nem fogyaszt)'}</span></div>
          <button class="btn c-pw" data-pw="${i}" ${h.dead ? 'disabled' : ''}>${icon('bolt', 14)}${h.on ? 'Ki' : 'Be'}</button></div>
        <div class="c-bars"><div><span>CPU</span><div class="c-bar">${h.vms.map(v => `<i style="flex:${v.cpu};background:${v.col}"></i>`).join('')}<i style="flex:${CAP.cpu - uc};background:transparent"></i></div><b>${uc}/16</b></div>
          <div><span>RAM</span><div class="c-bar">${h.vms.map(v => `<i style="flex:${v.ram};background:${v.col}"></i>`).join('')}<i style="flex:${CAP.ram - ur};background:transparent"></i></div><b>${ur}/64</b></div></div>
        <div class="c-vms">${h.vms.map(v => `<div class="c-vm ${sel && sel.from === 'h' && sel.id === v.id ? 'sel' : ''}" data-vm="${i}:${v.id}" style="--c:${v.col}">${icon(v.ic, 14)} ${v.n}<em style="width:${v.life / v.life0 * 100}%"></em></div>`).join('')}</div></div>`;
    }).join('') + (G.hosts.length < 5 ? `<button class="c-buy" id="c-buy">${icon('plus', 22)}<b>Új szerver</b><span>1500 Ft</span></button>` : '');
    $('#c-money').textContent = Math.round(G.money).toLocaleString('hu-HU') + ' Ft'; $('#c-money').style.color = G.money < 0 ? 'var(--red)' : 'var(--green)';
    $('#c-time').textContent = Math.ceil(G.t) + ' mp'; $('#c-stat').textContent = `${G.served} kiszolgált • ${G.lost} elvesztett ügyfél • ${G.migr} migráció • ${G.kwh.toFixed(1).replace('.', ',')} kWh`;
    $$('[data-q]').forEach(e => e.onpointerdown = () => click('q', +e.dataset.q));
    $$('[data-vm]').forEach(e => e.onpointerdown = ev => { ev.stopPropagation(); const [a, b] = e.dataset.vm.split(':'); click('vm', [+a, +b]) });
    $$('[data-h]').forEach(e => e.onpointerdown = () => click('host', +e.dataset.h));
    $$('[data-pw]').forEach(e => e.onpointerdown = ev => { ev.stopPropagation(); const h = G.hosts[+e.dataset.pw]; if (h.on && h.vms.length) { toast('Előbb költöztesd el róla a gépeket!', '#fbbf24'); return } h.on = !h.on; sfx.click(); render() });
    const b = $('#c-buy'); if (b) b.onpointerdown = () => { if (G.money < 1500) { toast('Nincs elég pénzed (1500 Ft).', '#f87171'); return } G.money -= 1500; G.hosts.push(mkHost(G.hosts.length)); sfx.win(); render() };
  }
  let acc = 0;
  function tick(dt) {
    if (!G.on) return; G.t -= dt; acc += dt;
    G.spawnT -= dt; if (G.spawnT <= 0) { spawn(); G.spawnT = Math.max(1.8, 4.2 - (DUR - G.t) * .025) }
    G.failT -= dt; if (G.failT <= 0) { G.failT = rnd(16, 24); const c = G.hosts.filter(h => h.on && !h.dead && !h.fail && h.vms.length); if (c.length) { const h = pick(c); h.fail = 9; sfx.alarm(); toast(`<b>Szerver ${h.i + 1}</b>: hardverhiba előrejelzés! 9 mp múlva leáll – költöztesd át a gépeit!`, '#f87171', 3500) } }
    for (const r of G.queue) { r.wait -= dt; if (r.wait <= 0) { G.lost++; G.money -= 150; toast(`${r.n}: az ügyfél nem várt tovább, és elment a konkurenciához.`, '#f87171', 2000) } }
    G.queue = G.queue.filter(r => r.wait > 0);
    for (const h of G.hosts) {
      if (h.on && !h.dead) { G.money -= dt * 8; G.kwh += dt * .12 }
      if (h.fail) { h.fail -= dt; if (h.fail <= 0) { h.fail = 0; h.dead = true; h.on = false; G.lost += h.vms.length; G.money -= h.vms.length * 300; if (h.vms.length) toast(`Szerver ${h.i + 1} leállt, ${h.vms.length} ügyfél szolgáltatása kiesett!`, '#f87171', 2600); h.vms = []; setTimeout(() => { h.dead = false; h.on = false; render() }, 8000) } }
      for (const v of h.vms) { v.life0 = v.life0 || v.life; v.life -= dt; G.money += v.pay * dt; }
      const fin = h.vms.filter(v => v.life <= 0); if (fin.length) { h.vms = h.vms.filter(v => v.life > 0); beep(1400, .05, 'triangle', .03) }
    }
    if (acc > .25) { acc = 0; render() }
    if (G.t <= 0) end();
  }
  function intro() {
    const o = $('#c-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card"><h2>Felhő-üzemeltető</h2><p>Egy felhőszolgáltató adatközpontját üzemelteted. Az ügyfelek <b>virtuális gépeket</b> és <b>konténereket</b> bérelnek. Kattints egy kérésre, majd egy szerverre, ahol van még elég <b>processzormag (CPU)</b> és <b>memória (RAM)</b>.</p>
      <div class="c-rules"><div>${icon('coin', 22)}<b>Bevétel</b><span>minden futó gép fizet másodpercenként</span></div><div>${icon('bolt', 22)}<b>Áram</b><span>minden bekapcsolt szerver fogyaszt: az üreset kapcsold ki!</span></div><div>${icon('siren', 22)}<b>Hiba</b><span>ha egy szerver piros, költöztesd át a gépeit (élő migráció)</span></div></div>
      <button class="btn go" id="c-start" style="font-size:22px;height:54px;padding:0 30px">Műszak indítása</button></div>`;
    $('#c-start').onclick = start;
  }
  function start() { G = fresh(); G.on = true; sel = null; $('#c-over').style.display = 'none'; render() }
  function end() {
    G.on = false; const sc = Math.max(0, Math.round(G.money)); best = Math.max(best, sc);
    const det = `${G.served} kiszolgált ügyfél, ${G.lost} elvesztett, ${G.migr} élő migráció, ${G.kwh.toFixed(1).replace('.', ',')} kWh`;
    if (Comp.racing) { Comp.finish(sc, det); intro(); return }
    sfx.win(); if (sc > 3000) FX.confetti();
    const o = $('#c-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card"><h2>Műszak vége</h2><div class="big">${sc.toLocaleString('hu-HU')} Ft</div><p>${det}</p>
      <div class="learn"><b>Így működik a felhő:</b> egy fizikai szerveren sok <b>virtuális gép</b> fut egyszerre (pl. Hyper-V, VMware), a <b>konténerek</b> (Docker, Kubernetes) még kisebbek és gyorsabbak. Ha egy gépet karban kell tartani, a virtuális gépeket <b>élő migrációval</b> átköltöztetik, leállás nélkül. A jó üzemeltető okosan pakol, hogy kevesebb szerver kelljen, és kevesebb áram fogyjon.</div>
      <div style="margin-top:14px"><button class="btn go" id="c-again">Új műszak</button></div></div>`;
    $('#c-again').onclick = start;
  }
  S.build = r => {
    root = r; G = fresh();
    r.innerHTML = `<style>
      #c-wrap{position:absolute;inset:0;display:grid;grid-template-columns:330px minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);gap:12px;padding:12px}
      #c-top{grid-column:1/-1;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
      #c-top .pill{background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:7px 18px;font-size:20px;font-weight:800;font-variant-numeric:tabular-nums}
      #c-money{color:var(--green)}#c-stat{color:var(--muted);font-size:14px}
      #c-qw{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:10px;overflow:auto;display:flex;flex-direction:column;gap:8px}
      #c-qw h3{margin:0;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
      .c-req{display:flex;gap:10px;align-items:center;background:var(--bg2);border:2px solid var(--line);border-left:5px solid var(--c);border-radius:12px;padding:9px;cursor:pointer}.c-req.new{animation:cIn .3s}
      @keyframes cIn{from{opacity:0;transform:translateX(-16px)}}
      .c-req.sel{border-color:var(--yellow);box-shadow:0 0 18px rgba(250,204,21,.35)}.c-req.urg{animation:cU .6s infinite alternate}@keyframes cU{to{border-color:var(--red)}}
      .c-req>div{flex:1;min-width:0}.c-req b{display:block;font-size:15px}.c-req span{font-size:12.5px;color:var(--muted)}.c-req strong{font-size:12px;color:var(--green);white-space:nowrap}
      .c-req i{display:block;height:4px;background:#262a33;border-radius:2px;margin-top:5px;overflow:hidden}.c-req em{display:block;height:100%;background:var(--yellow)}
      .c-ic{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;color:var(--c);background:color-mix(in srgb,var(--c) 15%,transparent);flex:none}
      .c-empty{color:var(--muted);font-size:14px;text-align:center;padding:20px}
      #c-hosts{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;align-content:start;overflow:auto}
      .c-host{background:var(--panel);border:2px solid var(--line);border-radius:16px;padding:12px;cursor:pointer;transition:border-color .2s;min-height:220px}
      .c-host:hover{border-color:var(--accent)}.c-host.fail{border-color:var(--red);animation:obad2 .8s infinite}@keyframes obad2{50%{background:#2a0f1e}}
      .c-host.dead{opacity:.4}.c-host.off{opacity:.65}
      .c-hh{display:flex;gap:10px;align-items:center}.c-hh b{display:block}.c-hh span{font-size:12px;color:var(--muted)}.fail .c-hh span{color:#ff8080;font-weight:700}
      .c-pw{margin-left:auto;height:30px;padding:0 10px;font-size:12px;display:inline-flex;gap:4px;align-items:center}
      .c-bars{margin:10px 0 8px}.c-bars>div{display:grid;grid-template-columns:36px 1fr 48px;gap:6px;align-items:center;font-size:12px;margin:4px 0}.c-bars b{text-align:right;font-variant-numeric:tabular-nums}
      .c-bar{display:flex;height:14px;background:#1c1f26;border-radius:4px;overflow:hidden;gap:1px}.c-bar i{display:block;height:100%}
      .c-vms{display:flex;flex-direction:column;gap:5px}.c-vm{position:relative;overflow:hidden;font-size:13px;display:flex;gap:6px;align-items:center;padding:5px 8px;border-radius:8px;background:color-mix(in srgb,var(--c) 18%,#15171c);border:1px solid color-mix(in srgb,var(--c) 45%,transparent);color:#fff}
      .c-vm.sel{outline:2px solid var(--yellow)}.c-vm em{position:absolute;left:0;bottom:0;height:2px;background:var(--c)}
      .c-buy{all:unset;cursor:pointer;border:2px dashed var(--line2);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:var(--muted);min-height:220px}.c-buy:hover{border-color:var(--accent);color:var(--text)}.c-buy b{color:var(--text)}
      .c-rules{display:flex;gap:10px;margin:14px 0}.c-rules div{flex:1;background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:10px;font-size:13px;color:var(--muted)}.c-rules b{display:block;color:var(--text);font-size:15px;margin-top:4px}.c-rules svg{color:var(--accent)}
    </style>
    <div id="c-wrap"><div id="c-top"><span class="pill" id="c-money">0 Ft</span><span class="pill" id="c-time">90 mp</span><span id="c-stat"></span></div>
      <div id="c-qw"><h3>Ügyfélkérések</h3><div id="c-q" style="display:flex;flex-direction:column;gap:8px"></div><div class="learn" style="margin-top:auto;font-size:13px">Kattints egy kérésre, majd egy szerverre. Egy futó gépre kattintva <b>átköltöztetheted</b> egy másik szerverre.</div></div>
      <div id="c-hosts"></div></div><div class="big-overlay" id="c-over"></div>`;
    render();
  };
  S.enter = () => { if (!G.on) intro() };
  S.tick = tick;
  S.leave = () => { G.on = false };
  S.comp = { rules: '90 másodperc: szolgáld ki a lehető legtöbb ügyfelet, kapcsold ki az üres szervereket, és mentsd át a gépeket a hibás szerverről! Az eredmény a megkeresett pénz.', start: () => start() };
  S.score = () => best;
  return S;
})());
