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
  const DUR = 90, ECOST = 8, PAYX = 1.6;
  let root, G, best = 0, sel = null, endless = false, bestEnd = store.get('felho-end', 0);
  const LIMIT = -3000; const seen = new Set();
  function fresh() {
    return { on: false, t: DUR, money: 1000, queue: [], hosts: [mkHost(0), mkHost(1), mkHost(2), mkHost(3)], spawnT: 1, failT: 22, lost: 0, served: 0, migr: 0, kwh: 0, uid: 0, msg: [] };
  }
  function mkHost(i) { return { i, on: true, vms: [], fail: 0, dead: false } }
  const used = (h, k) => h.vms.reduce((a, v) => a + v[k], 0);
  function spawn() {
    if (G.queue.length >= 5) return; const r = pick(REQ), late = DUR - G.t;
    G.queue.push({ id: ++G.uid, n: r[0], ic: r[1], cpu: r[2], ram: r[3], kind: r[4], col: r[5], wait: 14, life: rnd(18, 34), pay: Math.round((r[2] * 3 + r[3] / 3) * (1 + late / 120) * PAYX) });
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
  const fits = (r, h) => h.on && !h.dead && used(h, 'cpu') + r.cpu <= CAP.cpu && used(h, 'ram') + r.ram <= CAP.ram;
  let lastKey = '';
  function selReq() { if (!sel) return null; if (sel.from === 'q') return G.queue.find(x => x.id === sel.id); const h = G.hosts[sel.h]; return h && h.vms.find(x => x.id === sel.id) }
  // Teljes újraépítés csak szerkezeti változáskor (nincs villogás); a számok/csíkok update()-tel frissülnek
  function render(force) {
    if (!root) return;
    const key = JSON.stringify([G.queue.map(r => r.id), G.hosts.map(h => [h.on, h.dead, !!h.fail, h.vms.map(v => v.id)]), sel, G.on]);
    if (!force && key === lastKey) return update(); lastKey = key;
    const sr = selReq();
    $('#c-q').innerHTML = G.queue.map(r => `<div class="c-req ${seen.has(r.id) ? '' : 'new'} ${sel && sel.from === 'q' && sel.id === r.id ? 'sel' : ''}" data-q="${r.id}" style="--c:${r.col}"><span class="c-ic">${icon(r.ic, 20)}</span><div class="c-rt"><b>${r.n}</b><span class="c-tags"><em>${r.kind}</em><em>${r.cpu} mag</em><em>${r.ram} GB</em></span><i><u data-w="${r.id}"></u></i></div><strong>+${r.pay}<small>Ft/mp</small></strong></div>`).join('') || '<div class="c-empty">Nincs várakozó kérés – mindjárt jön a következő.</div>';
    G.queue.forEach(r => seen.add(r.id));
    $('#c-hosts').innerHTML = G.hosts.map((h, i) => {
      const fit = sr && sel.from === 'q' ? fits(sr, h) : sr && sel.h !== i ? fits(sr, h) : null;
      return `<div class="c-host ${h.dead ? 'dead' : h.fail ? 'fail' : ''} ${!h.on ? 'off' : ''} ${fit === true ? 'fit' : fit === false ? 'nofit' : ''}" data-h="${i}">
        <div class="c-hh"><span class="c-srv">${icon('layers', 20)}</span><div><b>Szerver ${i + 1}</b><span data-hs="${i}"></span></div>
          <button class="btn c-pw" data-pw="${i}" ${h.dead ? 'disabled' : ''}>${icon('bolt', 14)} ${h.on ? 'Kikapcsol' : 'Bekapcsol'}</button></div>
        ${fit === true ? '<div class="c-hint ok">Ide befér – kattints!</div>' : fit === false ? '<div class="c-hint no">Nem fér el</div>' : ''}
        <div class="c-bars"><div><span>CPU</span><div class="c-bar">${h.vms.map(v => `<i style="flex:${v.cpu};background:${v.col}"></i>`).join('')}<i style="flex:${CAP.cpu - used(h, 'cpu')};background:transparent"></i></div><b>${CAP.cpu - used(h, 'cpu')} szabad</b></div>
          <div><span>RAM</span><div class="c-bar">${h.vms.map(v => `<i style="flex:${v.ram};background:${v.col}"></i>`).join('')}<i style="flex:${CAP.ram - used(h, 'ram')};background:transparent"></i></div><b>${CAP.ram - used(h, 'ram')} GB</b></div></div>
        <div class="c-vms">${h.vms.map(v => `<div class="c-vm ${sel && sel.from === 'h' && sel.id === v.id ? 'sel' : ''}" data-vm="${i}:${v.id}" style="--c:${v.col}">${icon(v.ic, 14)} <span>${v.n}</span><small>${v.cpu}m · ${v.ram}G</small><em data-l="${v.id}"></em></div>`).join('') || (h.on && !h.dead ? '<div class="c-free">Üres szerver – ha nem kell, kapcsold ki!</div>' : '')}</div></div>`;
    }).join('') + (G.hosts.length < 6 ? `<button class="c-buy" id="c-buy">${icon('plus', 22)}<b>Új szerver</b><span>1500 Ft</span></button>` : '');
    $$('[data-q]').forEach(e => e.onpointerdown = ev => startDrag(ev, e, { from: 'q', id: +e.dataset.q }));
    $$('[data-vm]').forEach(e => e.onpointerdown = ev => { ev.stopPropagation(); const [a, b] = e.dataset.vm.split(':'); startDrag(ev, e, { from: 'h', h: +a, id: +b }) });
    $$('[data-h]').forEach(e => e.onpointerdown = ev => { if (!drag) click('host', +e.dataset.h) });
    $$('[data-pw]').forEach(e => e.onpointerdown = ev => { ev.stopPropagation(); const h = G.hosts[+e.dataset.pw]; if (h.on && h.vms.length) { toast('Előbb költöztesd el róla a gépeket!', '#fbbf24'); return } h.on = !h.on; sfx.click(); render() });
    const b = $('#c-buy'); if (b) b.onpointerdown = () => { if (G.money < 1500) { toast('Nincs elég pénzed (1500 Ft).', '#f87171'); return } G.money -= 1500; G.hosts.push(mkHost(G.hosts.length)); sfx.win(); render() };
    update();
  }
  let drag = null;
  function startDrag(ev, el, s0) {
    ev.preventDefault(); drag = { s0, x: ev.clientX, y: ev.clientY, moved: false, ghost: null, el };
    const mv = e => {
      if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; const w0 = el.offsetWidth, g = el.cloneNode(true); sel = s0; render(); g.className += ' c-ghost'; g.style.width = w0 + 'px'; document.body.appendChild(g); drag.ghost = g }
      if (drag.ghost) { drag.ghost.style.left = e.clientX - 30 + 'px'; drag.ghost.style.top = e.clientY - 20 + 'px'; const h = document.elementFromPoint(e.clientX, e.clientY); $$('.c-host').forEach(x => x.classList.toggle('over', !!h && x.contains(h))) }
    };
    const up = e => {
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up); const d = drag; drag = null; if (!d) return;
      if (d.ghost) { d.ghost.remove(); $$('.c-host').forEach(x => x.classList.remove('over')); const h = document.elementFromPoint(e.clientX, e.clientY), he = h && h.closest('[data-h]'); if (he) click('host', +he.dataset.h); else { sel = null; render() } }
      else if (s0.from === 'q') click('q', s0.id); else click('vm', [s0.h, s0.id]);
    };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  }
  function update() {
    const inc = G.hosts.reduce((a, h) => a + h.vms.reduce((b, v) => b + v.pay, 0), 0), cost = G.hosts.filter(h => h.on && !h.dead).length * ECOST;
    $('#c-money').textContent = Math.round(G.money).toLocaleString('hu-HU') + ' Ft'; $('#c-money').style.color = G.money < 0 ? 'var(--red)' : 'var(--green)';
    $('#c-time').textContent = endless ? `${Math.floor(G.el / 60)}:${String(Math.floor(G.el % 60)).padStart(2, '0')}` : Math.ceil(G.t) + ' mp'; $('#c-tl').textContent = endless ? `Túlélt idő • csőd: ${LIMIT} Ft` : 'Hátralévő idő';
    $('#c-inc').textContent = '+' + inc + ' Ft/mp'; $('#c-cost').textContent = '−' + cost + ' Ft/mp';
    $('#c-stat').textContent = `${G.served} kiszolgált • ${G.lost} elvesztett • ${G.migr} migráció`;
    const sr = selReq();
    $('#c-step').innerHTML = !sel ? `${icon('arrow', 16, 2)} <b>1. lépés:</b> fogj meg (vagy válassz) egy ügyfélkérést balról${G.hosts.some(h => h.fail) ? ' – vagy mentsd a <b style="color:var(--red)">piros</b> szerver gépeit!' : ''}` : `${icon('arrow', 16, 2)} <b>2. lépés:</b> húzd rá vagy kattints egy <b style="color:var(--green)">zöld keretes</b> szerverre${sel.from === 'h' ? ` (${sr ? sr.n : ''} költöztetése)` : ''} • újra kattintva a kérésre megszakítod`;
    for (const r of G.queue) { const e = $(`[data-w="${r.id}"]`); if (e) { e.style.width = r.wait / 14 * 100 + '%'; e.style.background = r.wait < 5 ? 'var(--red)' : 'var(--yellow)' } }
    G.hosts.forEach((h, i) => { const e = $(`[data-hs="${i}"]`); if (e) e.textContent = h.dead ? 'MEGHIBÁSODOTT – javítás alatt' : h.fail ? `HIBA! ${Math.ceil(h.fail)} mp a leállásig – költöztesd a gépeket!` : h.on ? `${h.vms.length} gép fut` : 'kikapcsolva, nem fogyaszt'; for (const v of h.vms) { const l = $(`[data-l="${v.id}"]`); if (l) l.style.width = v.life / v.life0 * 100 + '%' } });
  }
  let acc = 0;
  function tick(dt) {
    if (!G.on) return; G.t -= dt; G.el = (G.el || 0) + dt; acc += dt;
    G.spawnT -= dt; if (G.spawnT <= 0) { spawn(); G.spawnT = Math.max(endless ? 1.1 : 1.8, 4.2 - G.el * (endless ? .012 : .025)) }
    G.failT -= dt; if (G.failT <= 0) { G.failT = rnd(16, 24); const c = G.hosts.filter(h => h.on && !h.dead && !h.fail && h.vms.length); if (c.length) { const h = pick(c); h.fail = 9; sfx.alarm(); toast(`<b>Szerver ${h.i + 1}</b>: hardverhiba előrejelzés! 9 mp múlva leáll – költöztesd át a gépeit!`, '#f87171', 3500) } }
    for (const r of G.queue) { r.wait -= dt; if (r.wait <= 0) { G.lost++; G.money -= 150; toast(`${r.n}: az ügyfél nem várt tovább, és elment a konkurenciához.`, '#f87171', 2000) } }
    G.queue = G.queue.filter(r => r.wait > 0);
    for (const h of G.hosts) {
      if (h.on && !h.dead) { G.money -= dt * ECOST; G.kwh += dt * .12 }
      if (h.fail) { h.fail -= dt; if (h.fail <= 0) { h.fail = 0; h.dead = true; h.on = false; G.lost += h.vms.length; G.money -= h.vms.length * 300; if (h.vms.length) toast(`Szerver ${h.i + 1} leállt, ${h.vms.length} ügyfél szolgáltatása kiesett!`, '#f87171', 2600); h.vms = []; setTimeout(() => { h.dead = false; h.on = false; render(true) }, 8000) } }
      for (const v of h.vms) { v.life0 = v.life0 || v.life; v.life -= dt; G.money += v.pay * dt; }
      const fin = h.vms.filter(v => v.life <= 0); if (fin.length) { h.vms = h.vms.filter(v => v.life > 0); beep(1400, .05, 'triangle', .03) }
    }
    if (acc > .2) { acc = 0; render() }
    if (endless ? G.money <= LIMIT : G.t <= 0) end();
  }
  function intro() {
    const o = $('#c-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card"><h2>Felhő-üzemeltető</h2><p>Egy felhőszolgáltató adatközpontját üzemelteted. Az ügyfelek <b>virtuális gépeket</b> és <b>konténereket</b> bérelnek. Kattints egy kérésre, majd egy szerverre, ahol van még elég <b>processzormag (CPU)</b> és <b>memória (RAM)</b>.</p>
      <div class="c-rules"><div>${icon('coin', 22)}<b>Bevétel</b><span>minden futó gép fizet másodpercenként</span></div><div>${icon('bolt', 22)}<b>Áram</b><span>minden bekapcsolt szerver fogyaszt: az üreset kapcsold ki!</span></div><div>${icon('siren', 22)}<b>Hiba</b><span>ha egy szerver piros, költöztesd át a gépeit (élő migráció)</span></div></div>
      <div class="c-modes"><button class="btn go" id="c-start">${icon('clock', 20)} 90 mp-es műszak</button><button class="btn" id="c-end">${icon('repeat', 20)} Végtelen mód<small>amíg nem csúszol ${LIMIT} Ft alá${bestEnd ? ` • rekord: ${Math.floor(bestEnd / 60)} p ${bestEnd % 60} mp` : ''}</small></button></div></div>`;
    $('#c-start').onclick = () => { endless = false; start() }; $('#c-end').onclick = () => { endless = true; start() };
  }
  function start() { G = fresh(); G.on = true; sel = null; $('#c-over').style.display = 'none'; render(true) }
  function end() {
    G.on = false; const sc = endless ? Math.round(G.el * 10 + G.served * 20) : Math.max(0, Math.round(G.money)); best = Math.max(best, sc);
    if (endless) { const secs = Math.round(G.el); if (secs > bestEnd) { bestEnd = secs; store.set('felho-end', secs) } }
    const det = `${G.served} kiszolgált ügyfél, ${G.lost} elvesztett, ${G.migr} élő migráció, ${G.kwh.toFixed(1).replace('.', ',')} kWh`;
    if (Comp.racing) { Comp.finish(sc, det); intro(); return }
    sfx.win(); if (sc > 3000) FX.confetti();
    const o = $('#c-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card"><h2>${endless ? 'Csődbe ment a felhőcég!' : 'Műszak vége'}</h2><div class="big">${endless ? `${Math.floor(G.el / 60)} perc ${Math.round(G.el % 60)} mp` : sc.toLocaleString('hu-HU') + ' Ft'}</div><p>${endless ? `Ennyi ideig bírtad • ${sc} pont • rekord: ${Math.floor(bestEnd / 60)} p ${bestEnd % 60} mp<br>` : ''}${det}</p>
      <div class="learn"><b>Így működik a felhő:</b> egy fizikai szerveren sok <b>virtuális gép</b> fut egyszerre (pl. Hyper-V, VMware), a <b>konténerek</b> (Docker, Kubernetes) még kisebbek és gyorsabbak. Ha egy gépet karban kell tartani, a virtuális gépeket <b>élő migrációval</b> átköltöztetik, leállás nélkül. A jó üzemeltető okosan pakol, hogy kevesebb szerver kelljen, és kevesebb áram fogyjon.</div>
      <div style="margin-top:14px;display:flex;gap:10px;justify-content:center"><button class="btn" id="c-menu">Módválasztás</button><button class="btn go" id="c-again">Újra</button></div></div>`;
    $('#c-again').onclick = start; $('#c-menu').onclick = intro;
  }
  S.build = r => {
    root = r; G = fresh();
    r.innerHTML = `<style>
      #c-wrap{position:absolute;inset:0;display:grid;grid-template-columns:380px minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);gap:12px;padding:12px}
      #c-top{grid-column:1/-1;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
      .c-kpi{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:6px 16px;min-width:130px}.c-kpi span{display:block;font-size:11.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}.c-kpi b{font-size:22px;font-variant-numeric:tabular-nums}
      #c-step{width:100%;background:color-mix(in srgb,var(--accent) 10%,var(--panel));border:1px solid color-mix(in srgb,var(--accent) 35%,var(--line));border-radius:12px;padding:8px 14px;font-size:15px;display:flex;gap:8px;align-items:center}#c-step svg{color:var(--accent)}
      .c-host.fit{border-color:var(--green);box-shadow:0 0 22px rgba(74,222,128,.25)}.c-host.nofit{opacity:.45}
      .c-hint{font-size:13px;font-weight:700;border-radius:8px;padding:4px 8px;margin-top:8px}.c-hint.ok{background:rgba(74,222,128,.15);color:var(--green)}.c-hint.no{background:rgba(248,113,113,.12);color:#fca5a5}
      .c-srv{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:#1c2230;color:var(--accent);flex:none}.fail .c-srv{background:rgba(248,113,113,.2);color:var(--red)}
      .c-tags{display:flex;gap:4px;margin-top:3px}.c-tags em{font-style:normal;font-size:11.5px;background:#232733;border-radius:6px;padding:1px 6px;color:#c9ccd3}
      .c-req strong small{display:block;font-size:10px;color:var(--muted);font-weight:500}.c-req strong{text-align:right;font-size:15px}
      .c-vm span{flex:1}.c-vm small{font-size:11px;color:#c9ccd3;opacity:.8}.c-free{font-size:12.5px;color:var(--muted);border:1px dashed var(--line2);border-radius:8px;padding:8px;text-align:center}
      #c-money{color:var(--green)}#c-stat{color:var(--muted);font-size:14px}
      #c-qw{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:10px;overflow:auto;display:flex;flex-direction:column;gap:8px}
      #c-qw h3{margin:0;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
      .c-req{display:flex;gap:10px;align-items:center;background:var(--bg2);border:2px solid var(--line);border-left:5px solid var(--c);border-radius:12px;padding:9px;cursor:pointer}.c-req.new{animation:cIn .3s}
      @keyframes cIn{from{opacity:0;transform:translateX(-16px)}}
      .c-req.sel{border-color:var(--yellow);box-shadow:0 0 18px rgba(250,204,21,.35);background:#221f12}
      .c-req{padding:13px!important;touch-action:none;user-select:none}.c-req>div{flex:1;min-width:0}.c-req b{display:block;font-size:17px}.c-req span{font-size:12.5px;color:var(--muted)}.c-req strong{font-size:12px;color:var(--green);white-space:nowrap}
      .c-req i{display:block;height:4px;background:#262a33;border-radius:2px;margin-top:6px;overflow:hidden}.c-req u{display:block;height:100%;background:var(--yellow);transition:width .2s linear}.c-rt{flex:1;min-width:0}
      .c-ic{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;color:var(--c);background:color-mix(in srgb,var(--c) 15%,transparent);flex:none}
      .c-empty{color:var(--muted);font-size:14px;text-align:center;padding:20px}
      #c-hosts{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;align-content:start;overflow:auto}
      .c-host{background:var(--panel);border:2px solid var(--line);border-radius:18px;padding:16px;cursor:pointer;transition:border-color .2s,transform .15s;min-height:280px}.c-host.over{border-color:var(--yellow)!important;transform:scale(1.02);box-shadow:0 0 30px rgba(250,204,21,.35)}
      .c-host:hover{border-color:var(--accent)}.c-host.fail{border-color:var(--red);background:#22121a}
      .c-host.dead{opacity:.4}.c-host.off{opacity:.65}
      .c-hh{display:flex;gap:10px;align-items:center}.c-hh b{display:block}.c-hh span{font-size:12px;color:var(--muted)}.fail .c-hh span{color:#ff8080;font-weight:700}
      .c-pw{margin-left:auto;height:30px;padding:0 10px;font-size:12px;display:inline-flex;gap:4px;align-items:center}
      .c-bars{margin:10px 0 8px}.c-bars>div{display:grid;grid-template-columns:36px 1fr 78px;white-space:nowrap;gap:6px;align-items:center;font-size:12px;margin:4px 0}.c-bars b{text-align:right;font-variant-numeric:tabular-nums}
      .c-bar{display:flex;height:18px;background:#1c1f26;border-radius:4px;overflow:hidden;gap:1px}.c-bar i{display:block;height:100%}
      .c-vms{display:flex;flex-direction:column;gap:5px}.c-vm{touch-action:none;user-select:none;cursor:grab;position:relative;overflow:hidden;font-size:15px;min-height:34px;display:flex;gap:6px;align-items:center;padding:5px 8px;border-radius:8px;background:color-mix(in srgb,var(--c) 18%,#15171c);border:1px solid color-mix(in srgb,var(--c) 45%,transparent);color:#fff}
      .c-vm.sel{outline:2px solid var(--yellow)}.c-vm em{position:absolute;left:0;bottom:0;height:2px;background:var(--c)}
      .c-buy{all:unset;cursor:pointer;border:2px dashed var(--line2);border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:var(--muted);min-height:280px}.c-ghost{position:fixed;z-index:100;pointer-events:none;opacity:.92;transform:rotate(-2deg);box-shadow:0 18px 40px #000a}.c-modes{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}.c-modes .btn{height:auto;min-height:56px;padding:10px 22px;font-size:18px;display:inline-flex;flex-direction:column;align-items:center;gap:2px}.c-modes small{font-size:12px;font-weight:500;color:var(--muted)}.c-buy:hover{border-color:var(--accent);color:var(--text)}.c-buy b{color:var(--text)}
      .c-rules{display:flex;gap:10px;margin:14px 0}.c-rules div{flex:1;background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:10px;font-size:13px;color:var(--muted)}.c-rules b{display:block;color:var(--text);font-size:15px;margin-top:4px}.c-rules svg{color:var(--accent)}
    </style>
    <div id="c-wrap"><div id="c-top"><div class="c-kpi"><span>Egyenleg</span><b id="c-money">0 Ft</b></div><div class="c-kpi"><span>Bevétel</span><b id="c-inc" style="color:var(--green)">0</b></div><div class="c-kpi"><span>Áram</span><b id="c-cost" style="color:var(--orange)">0</b></div><div class="c-kpi"><span id="c-tl">Hátralévő idő</span><b id="c-time">90 mp</b></div><span id="c-stat"></span><div id="c-step"></div></div>
      <div id="c-qw"><h3>Ügyfélkérések</h3><div id="c-q" style="display:flex;flex-direction:column;gap:8px"></div><div class="learn" style="margin-top:auto;font-size:13px"><b>Húzd</b> a kérést egy szerverre (vagy kattints a kérésre, majd a szerverre). Futó gépet is áthúzhatsz egy másik szerverre: ez az <b>élő migráció</b>.</div></div>
      <div id="c-hosts"></div></div><div class="big-overlay" id="c-over"></div>`;
    render();
  };
  S.enter = () => { if (!G.on) intro() };
  S.tick = tick;
  S.leave = () => { G.on = false };
  S.comp = { rules: 'A 90 másodperces műszakban: szolgáld ki a lehető legtöbb ügyfelet, kapcsold ki az üres szervereket, és mentsd át a gépeket a hibás szerverről! Az eredmény a megkeresett pénz.', start: () => { endless = false; start() } };
  S.score = () => best;
  return S;
})());
