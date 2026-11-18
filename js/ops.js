/* ===== 8. Rendszergazda-ügyelet: üzemeltetés, monitorozás, konténerek, mentés ===== */
App.add((() => {
  const S = {
    id: 'ugyelet', icon: '', title: 'Rendszergazda-ügyelet', color: '#fb7185',
    desc: 'Pirosan villognak a szerverek! Válaszd ki a jó eszközt, és tartsd életben a rendszert 60 másodpercig.',
    topic: 'Alkalmazás-üzemeltetés, szerverek, monitorozás, virtualizáció, konténerek, biztonsági mentés'
  };
  const SRV = [
    { n: 'Webszerver', ic: 'globe', os: 'Linux · nginx' }, { n: 'Levelezés', ic: 'mail', os: 'Linux · Postfix' }, { n: 'Adatbázis', ic: 'layers', os: 'Linux · MySQL' },
    { n: 'Fájlszerver', ic: 'box', os: 'Windows Server' }, { n: 'Címtár (AD)', ic: 'user', os: 'Windows Server' }, { n: 'DNS + DHCP', ic: 'internet', os: 'Windows Server' },
  ];
  const PROB = {
    cpu: { t: 'Túlterhelés! CPU 100% ', fix: 'scale' }, down: { t: 'A szolgáltatás leállt ', fix: 'restart' }, disk: { t: 'Megtelt a lemez ', fix: 'clean' },
    virus: { t: 'Kártevőt észleltünk ', fix: 'av' }, ransom: { t: 'Zsarolóvírus! Fájlok titkosítva ', fix: 'backup' }, cable: { t: 'Nincs hálózati kapcsolat ', fix: 'cable' },
  };
  const TOOLS = [['scale', 'plus', 'Új konténer indítása', 'Több példány = elosztott terhelés'], ['restart', 'refresh', 'Szolgáltatás újraindítása', ''], ['clean', 'trash', 'Naplófájlok törlése', ''],
  ['av', 'shield', 'Vírusirtó futtatása', ''], ['backup', 'save', 'Visszaállítás mentésből', ''], ['cable', 'plug', 'Kábel ellenőrzése', '']];
  let best = 0;
  const G = { on: false, t: 60, spawn: 3, fixes: 0, up: 0, tot: 0, tool: null, sel: null, hist: [] };
  let srv = [], hcv;
  function reset() { srv = SRV.map(s => ({ ...s, cpu: rnd(15, 40), ram: rnd(30, 60), disk: rnd(30, 60), cont: 1, p: null, pt: 0 })) }
  function render() {
    $('#o-grid').innerHTML = srv.map((s, i) => `<div class="o-srv ${s.p ? 'bad' : ''} ${G.sel === i ? 'sel' : ''}" data-i="${i}">
      <div class="o-h"><span class="o-ic"><img alt="" src="${Dev.img('rack', 44)}" style="width:44px"></span><div><b>${s.n}</b><div class="o-os">${s.os}</div></div><span class="o-led"></span></div>
      ${[['CPU', s.cpu], ['RAM', s.ram], ['Lemez', s.disk]].map(([k, v]) => `<div class="o-m"><span>${k}</span><div class="o-b"><i style="width:${v}%;background:${v > 85 ? 'var(--red)' : v > 65 ? 'var(--yellow)' : 'var(--green)'}"></i></div><span>${Math.round(v)}%</span></div>`).join('')}
      <div class="o-c">${'▣'.repeat(s.cont)} <span>${s.cont} konténer</span></div>
      <div class="o-p">${s.p ? PROB[s.p].t : 'Minden rendben'}</div></div>`).join('');
    $$('.o-srv').forEach(e => e.onclick = () => { G.sel = +e.dataset.i; sfx.click(); tryFix() });
  }
  function log(t, cls = '') { const l = $('#o-log'); const d = document.createElement('div'); d.className = cls; d.textContent = `${new Date().toLocaleTimeString('hu-HU')}  ${t}`; l.prepend(d); while (l.children.length > 30) l.lastChild.remove() }
  function tryFix() {
    $$('.o-tool').forEach(b => b.classList.toggle('sel', b.dataset.t === G.tool));
    if (G.sel === null || !G.tool) { render(); return }
    const s = srv[G.sel], tool = G.tool;
    if (!s.p) { toast(`${s.ic} ${s.n}: itt nincs hiba `, '#9aa0ab', 1200) }
    else if (PROB[s.p].fix === tool) {
      if (tool === 'scale') { s.cont = Math.min(4, s.cont + 1); s.cpu = 35 } if (tool === 'clean') s.disk = 40;
      log(`OK      ${s.n}: hiba elhárítva (${TOOLS.find(x => x[0] === tool)[2]})`, 'ok');
      s.p = null; G.fixes++; sfx.ok(); const el = $(`.o-srv[data-i="${G.sel}"]`); el && FX.burstEl(el, 26, ['#4ade80', '#5b9dff']);
    } else { sfx.bad(); toast('Ez nem segített! Olvasd el, mi a hiba.', '#f87171', 1400); const el = $(`.o-srv[data-i="${G.sel}"]`); el && (el.classList.remove('shake'), void el.offsetWidth, el.classList.add('shake')) }
    G.sel = null; G.tool = null; $$('.o-tool').forEach(b => b.classList.remove('sel')); render();
  }
  function spawn() {
    const ok = srv.map((s, i) => i).filter(i => !srv[i].p); if (!ok.length) return;
    const i = pick(ok), k = pick(Object.keys(PROB)), s = srv[i]; s.p = k; s.pt = 0;
    if (k === 'cpu') s.cpu = 100; if (k === 'disk') s.disk = 100;
    log(`HIBA    ${s.n}: ${PROB[k].t}`, 'err'); sfx.alarm(); render();
  }
  function drawChart() {
    const c = hcv.getContext('2d'), w = hcv.width = hcv.clientWidth, h = hcv.height = hcv.clientHeight; c.clearRect(0, 0, w, h);
    c.strokeStyle = '#ffffff14'; for (let y = 0; y < h; y += h / 4) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke() }
    if (G.hist.length < 2) return; c.beginPath();
    G.hist.forEach((v, i) => { const x = i / (G.hist.length - 1) * w, y = h - v / 100 * h * .9 - 2; i ? c.lineTo(x, y) : c.moveTo(x, y) });
    c.strokeStyle = '#5b9dff'; c.lineWidth = 2.5; c.shadowColor = '#5b9dff'; c.shadowBlur = 10; c.stroke(); c.shadowBlur = 0;
    c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fillStyle = '#5b9dff22'; c.fill();
  }
  function intro() {
    if (G.on) return; const o = $('#o-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card"><h2>Rendszergazda-ügyelet</h2>
      <p>Te felelsz az iskola 6 szerveréért! Ha valamelyik <b style="color:var(--red)">pirosan villog</b>, olvasd el a hibát, válaszd ki a <b>megfelelő eszközt</b> lent, majd kattints a szerverre (vagy fordítva).<br>Cél: a lehető legmagasabb <b>rendelkezésre állás</b> 60 másodpercen át!</p>
      <button class="btn go" id="o-start" style="font-size:28px">MŰSZAK KEZDÉSE ▶</button></div>`;
    $('#o-start').onclick = start;
  }
  function start() { reset(); Object.assign(G, { on: true, t: 60, spawn: 2, fixes: 0, up: 0, tot: 0, tool: null, sel: null, hist: [] }); $('#o-log').innerHTML = ''; log('INFO    Műszak kezdete. Monitorozás aktív.', 'ok'); $('#o-over').style.display = 'none'; render() }
  function end() {
    G.on = false; const av = G.tot ? G.up / G.tot * 100 : 100; const score = Math.round(av * 10 + G.fixes * 25); best = Math.max(best, score);
    if (Comp.racing) { Comp.finish(score, `Rendelkezésre állás: ${av.toFixed(1).replace('.', ',')}% · ${G.fixes} elhárított hiba`); intro(); return }
    if (av > 80) { sfx.win(); FX.confetti() } else sfx.bad();
    const o = $('#o-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card"><h2>${av > 90 ? 'Profi rendszergazda!' : av > 75 ? 'Szép munka!' : 'Kemény műszak volt…'}</h2>
      <div class="big">${av.toFixed(1).replace('.', ',')}%</div><p>rendelkezésre állás • ${G.fixes} elhárított hiba • ${score} pont</p>
      <div class="learn"><b>Ezt csinálja egy üzemeltető:</b> <b>monitorozó</b> rendszerrel (pl. Nagios) figyeli a szervereket, és ha nagy a terhelés, újabb <b>konténert vagy virtuális gépet</b> indít (pl. Docker, Kubernetes). Rendszeres <b>biztonsági mentést</b> készít, hogy egy zsarolóvírus után is vissza lehessen állítani az adatokat. Linux és Windows szervereket is üzemeltet.</div>
      <div style="margin-top:14px"><button class="btn go" id="o-again">ÚJ MŰSZAK ▶</button></div></div>`;
    $('#o-again').onclick = start;
  }
  S.build = root => {
    root.innerHTML = `<style>
      #o-wrap{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1fr) 330px;grid-template-rows:minmax(0,1fr) auto;gap:12px;padding:12px}
      #o-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-content:start;overflow:auto}
      .o-srv{background:#15171c;border:2px solid var(--line);border-radius:16px;padding:12px;cursor:pointer;transition:border-color .2s,box-shadow .2s}
      .o-srv:hover{border-color:var(--cyan)}.o-srv.sel{border-color:var(--yellow);box-shadow:0 0 20px #fbbf2466}
      .o-srv.bad{border-color:var(--red);animation:obad 1s infinite}
      @keyframes obad{50%{box-shadow:0 0 30px #f87171aa;background:#2a0f1e}}
      .o-h{display:flex;gap:10px;align-items:center;margin-bottom:8px}.o-ic{display:grid;place-items:center}.o-os{font-size:12px;color:var(--muted)}
      .o-led{margin-left:auto;width:14px;height:14px;border-radius:50%;background:var(--green);box-shadow:0 0 10px var(--green)}.bad .o-led{background:var(--red);box-shadow:0 0 12px var(--red)}
      .o-m{display:grid;grid-template-columns:48px 1fr 40px;gap:6px;align-items:center;font-size:12px;margin:3px 0}.o-b{height:9px;background:#1c1f26;border-radius:5px;overflow:hidden}.o-b i{display:block;height:100%;transition:width .4s}
      .o-c{font-size:13px;color:var(--cyan);margin-top:4px}.o-c span{color:var(--muted)}
      .o-p{margin-top:8px;font-weight:800;font-size:15px;color:var(--green)}.bad .o-p{color:#ff8080}
      #o-side{display:flex;flex-direction:column;gap:10px;min-height:0}
      #o-mon{flex:none}#o-mon h3{margin:0;font-size:16px;color:var(--cyan)}#o-av{font-size:38px;font-weight:900}#o-hc{width:100%;height:90px;display:block}
      #o-log{flex:1;overflow:auto;font-family:var(--mono);font-size:12px;line-height:1.5;background:#08090b;border-radius:12px;padding:8px;color:#a3a8b3;min-height:80px}
      #o-log .err{color:#ff8080}#o-log .ok{color:#4ade80}
      #o-tools{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
      .o-tool{font-size:16px;padding:10px 14px}.o-tool b{font-size:22px;margin-right:4px}
    </style>
    <div id="o-wrap"><div id="o-grid"></div>
      <div id="o-side"><div class="panel" id="o-mon"><h3>Monitorozás</h3><div id="o-av">100%</div><div style="font-size:12px;color:var(--muted)">rendelkezésre állás • <b id="o-t">60</b> mp</div><canvas id="o-hc"></canvas></div><div id="o-log"></div></div>
      <div id="o-tools">${TOOLS.map((t, i) => `<button class="btn o-tool" data-t="${t[0]}">${icon(t[1], 20)}${t[2]} <small style="color:var(--muted)">[${i + 1}]</small></button>`).join('')}</div></div>
    <div class="big-overlay" id="o-over"></div>`;
    hcv = $('#o-hc'); reset(); render();
    $$('.o-tool', root).forEach(b => b.onclick = () => { G.tool = G.tool === b.dataset.t ? null : b.dataset.t; sfx.click(); tryFix() });
    addEventListener('keydown', e => { if (App.cur !== S || !G.on) return; const k = +e.key; if (k >= 1 && k <= 6) { G.tool = TOOLS[k - 1][0]; tryFix() } });
  };
  S.enter = intro;
  S.comp = { rules: '60 másodperces műszak: hárítsd el a hibákat a lehető leggyorsabban, tartsd magasan a rendelkezésre állást!', start: () => start() };
  S.score = () => best;
  let acc = 0;
  S.tick = dt => {
    if (!G.on) return;
    G.t -= dt; G.spawn -= dt; acc += dt;
    const healthy = srv.filter(s => !s.p).length; G.up += healthy * dt; G.tot += srv.length * dt;
    if (G.spawn <= 0) { spawn(); G.spawn = Math.max(1.6, 3.6 - (60 - G.t) * .035) }
    if (acc > .5) {
      acc = 0;
      srv.forEach(s => { if (s.p !== 'cpu') s.cpu = clamp(s.cpu + rnd(-8, 8), 8, 80); s.ram = clamp(s.ram + rnd(-4, 4), 20, 85); if (s.p !== 'disk') s.disk = clamp(s.disk + rnd(0, 1), 20, 90); if (s.p === 'down' || s.p === 'cable') s.cpu = 0 });
      G.hist.push(healthy / srv.length * 100); if (G.hist.length > 60) G.hist.shift();
      render(); drawChart();
    }
    const av = G.tot ? G.up / G.tot * 100 : 100;
    $('#o-av').textContent = av.toFixed(1).replace('.', ',') + '%'; $('#o-av').style.color = av > 90 ? 'var(--green)' : av > 75 ? 'var(--yellow)' : 'var(--red)';
    $('#o-t').textContent = Math.ceil(G.t);
    if (G.t <= 0) end();
  };
  return S;
})());
