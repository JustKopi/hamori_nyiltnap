/* ===== 5. Te vagy a tűzfal! – hálózatbiztonság, támadástípusok, portok ===== */
App.add((() => {
  const S = {
    id: 'tuzfal', icon: '', title: 'Te vagy a tűzfal!', color: '#f87171',
    desc: 'Támadják a cég szervereit! Lézerrel lődd le a veszélyes csomagokat – de a hasznos forgalmat engedd át!',
    topic: 'Hálózatbiztonság, támadástípusok, portok és protokollok, tűzfalszabályok, DDoS'
  };
  // [ikon, felirat, port/protokoll, rossz?, támadás neve, magyarázat, cél (0 web, 1 levél, 2 adatbázis), szint]
  const PK = [
    ['mail', 'E-mail egy ügyféltől', 'TCP 25 · SMTP', 0, '', '', 1, 1], ['globe', 'Weboldal betöltése', 'TCP 443 · HTTPS', 0, '', '', 0, 1],
    ['video', 'Videóhívás', 'UDP 3478 · STUN', 0, '', '', 0, 1], ['book', 'Webshop-rendelés', 'TCP 443 · HTTPS', 0, '', '', 0, 1],
    ['refresh', 'Biztonsági frissítés', 'TCP 443 · HTTPS', 0, '', '', 2, 1], ['search', 'DNS-lekérdezés', 'UDP 53 · DNS', 0, '', '', 0, 2],
    ['layers', 'Biztonsági mentés a központba', 'TCP 22 · SSH (belső IP)', 0, '', '', 2, 2],
    ['bug', 'ingyen_jatek.exe letöltése', 'TCP 443 · HTTPS', 1, 'Kártevő (trójai)', 'A „túl szép, hogy igaz legyen” programokban gyakran kártevő lapul. Ellene: vírusirtó, tűzfal, óvatosság.', 0, 1],
    ['hook', '„Nyertél egy telefont! Add meg a jelszavad!”', 'TCP 25 · SMTP', 1, 'Adathalászat (phishing)', 'Hamis üzenet, amely jelszót vagy bankkártyaadatot akar kicsalni. Soha ne add meg az adataidat!', 1, 1],
    ['coin', '„Fizess bitcoinban, különben…”', 'TCP 445 · SMB', 1, 'Zsarolóvírus (ransomware)', 'Titkosítja a fájlokat és váltságdíjat kér. A legjobb védelem a rendszeres biztonsági mentés.', 2, 1],
    ['unlock', 'Kapcsolódás a 23-as portra', 'TCP 23 · Telnet', 1, 'Titkosítatlan távoli elérés', 'A Telnet jelszót és adatot titkosítás nélkül küld. Helyette SSH-t használunk, a 23-as portot a tűzfal tiltja.', 2, 2],
    ['monitor', 'Távoli asztal a világból', 'TCP 3389 · RDP (külső IP)', 1, 'Nyitott távoli asztal', 'Az interneten nyitva hagyott RDP-t a támadók folyamatosan próbálgatják. Csak VPN-en keresztül szabad elérni.', 2, 2],
    ['eye', 'Sorban próbálgatja a portokat', 'TCP 1–65535 · port scan', 1, 'Portpásztázás', 'A támadó nyitott, sebezhető szolgáltatásokat keres. A tűzfal minden nem használt portot zárva tart.', 0, 2],
    ['key', '1000 belépési próba másodpercenként', 'TCP 22 · SSH (külső IP)', 1, 'Jelszótörés (brute force)', 'A támadó gépe végigpróbálja a jelszavakat. Védelem: erős jelszó, kétlépcsős azonosítás, próbálkozás-korlát.', 2, 2],
    ['code', "Űrlapba írt kód: ' OR 1=1 --", 'TCP 443 · HTTPS', 1, 'SQL-befecskendezés', 'A támadó adatbázis-parancsot csempész egy beviteli mezőbe. Ellene a webalkalmazás-tűzfal (WAF) és a biztonságos kód véd.', 2, 3],
  ];
  const DDOS = ['waves', 'Elárasztás', 'UDP · DDoS', 1, 'DDoS-támadás', 'Rengeteg fertőzött gép egyszerre árasztja el a szervert, hogy leálljon. Ellene szolgáltatói szűrés és terheléselosztás véd.', 0, 3];
  const SRV = ['Webszerver', 'Levelezés', 'Adatbázis'];
  let C, ctx, T = 0, G = null, best = 0, mouse = null, sweeping = false, trail = [], lasers = [], parts = [], pops = [];
  const lanes = 5, laneY = i => C.H * (.18 + i * .16), wallX = () => C.W * .7;
  function reset() { G = { on: false, t: 60, hp: [100, 100, 100], score: 0, spawn: 1, list: [], caught: {}, missed: {}, wrong: 0, combo: 0, lvl: 1, burst: 0, hitT: [0, 0, 0], flash: 0 } }
  function spawn(d) {
    const ln = rnd(0, lanes - 1); if (G.list.some(p => !p.dead && p.ln === ln && p.x < 130)) return;
    const small = d === DDOS; G.list.push({ d, ln, x: -300, y: laneY(ln), sp: (small ? 150 : 90) + (60 - G.t) * 2.2 + Math.random() * 30, small, w: small ? 70 : 290, tgt: small ? rnd(0, 2) : d[6] });
  }
  const burst = (x, y, cols, n) => { for (let k = 0; k < n; k++) { const a = Math.random() * 7, s = Math.random() * 6 + 1; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, c: pick(cols) }) } };
  const pop = (x, y, t, c) => pops.push({ x, y, t, c, life: 1.2 });
  function hit(p) {
    if (p.dead) return; p.dead = true; const bad = p.d[3];
    lasers.push({ x1: wallX(), y1: p.y, x2: p.x + p.w / 2, y2: p.y, life: 1 }); burst(p.x + p.w / 2, p.y, bad ? ['#f87171', '#fbbf24', '#fff'] : ['#9aa0ab'], bad ? 26 : 10);
    if (bad) { G.combo++; const pts = 10 + Math.min(G.combo, 10) * 2; G.score += pts; G.caught[p.d[4]] = p.d; pop(p.x + p.w / 2, p.y - 10, '+' + pts, '#4ade80'); beep(1400, .06, 'square', .04, -700) }
    else { G.combo = 0; G.score = Math.max(0, G.score - 15); G.wrong++; pop(p.x + p.w / 2, p.y - 10, 'Ez hasznos volt! −15', '#fbbf24'); sfx.bad() }
  }
  function intro() {
    if (G && G.on) return; const o = $('#f-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card"><h2>Te vagy a tűzfal!</h2>
      <p>A cég három szerverét támadják az internet felől. A csomagok balról érkeznek – <b style="color:var(--red)">kattints a veszélyesekre</b>, vagy <b>húzd végig rajtuk az egeret lenyomva</b>, mielőtt elérnék a tűzfalat!</p>
      <p><b>1. szint:</b> nyilvánvaló csalások · <b>2. szint:</b> figyeld a <b>portszámot</b> is! · <b>3. szint:</b> DDoS-áradat</p>
      <div class="learn" style="margin-top:6px">Engedélyezett: <b>443</b> (HTTPS), <b>25</b> (e-mail), <b>53</b> (DNS), belső SSH. Kívülről tiltott: <b>23</b> (Telnet), <b>3389</b> (RDP), külső SSH-próbálkozás, portpásztázás.</div>
      <button class="btn go" id="f-start" style="font-size:22px;margin-top:14px">Védelem indul</button></div>`;
    $('#f-start').onclick = start;
  }
  function start() { reset(); G.on = true; $('#f-over').style.display = 'none'; sfx.click() }
  function end(lost) {
    G.on = false; best = Math.max(best, G.score);
    const hpAvg = Math.round(G.hp.reduce((a, b) => a + b) / 3);
    if (Comp.racing) { Comp.finish(G.score, lost ? 'Egy szerver elesett!' : `Szerverek átlagos állapota: ${hpAvg}%`); intro(); return }
    if (!lost) { sfx.win(); FX.confetti() } else sfx.pop();
    const types = [...PK.filter(x => x[3]), DDOS].map(b => { const c = G.caught[b[4]], m = G.missed[b[4]]; if (!c && !m) return ''; return `<div style="margin:6px 0"><b>${b[4]}</b> <span style="color:var(--muted)">(${b[2]})</span> ${c ? '<span style="color:var(--green)">– kivédted</span>' : ''}${m ? ' <span style="color:var(--red)">– átjutott</span>' : ''}<br><span style="color:var(--muted)">${b[5]}</span></div>` }).join('');
    const o = $('#f-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card"><h2>${lost ? 'Egy szerver elesett!' : 'Kivédted a támadást!'}</h2><div class="big">${G.score} pont</div><p>${G.hp.map((h, i) => `${SRV[i]}: ${h}%`).join(' · ')} · tévesen blokkolt: ${G.wrong}</p>
      <div class="learn"><b>Ezekkel a támadásokkal találkoztál:</b>${types || ' –'}</div>
      <div style="margin-top:14px"><button class="btn go" id="f-again">Újra</button></div></div>`;
    $('#f-again').onclick = start;
  }
  function draw(dt) {
    const W = C.W, H = C.H, wx = wallX(); ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#1a0b10'); g.addColorStop(.65, '#0e1016'); g.addColorStop(1, '#0b1320'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff08'; for (let x = (T * 40) % 40; x < wx; x += 40) ctx.fillRect(x, 0, 1, H);
    ctx.font = '700 13px Inter,sans-serif'; ctx.fillStyle = '#f8717199'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('INTERNET – ismeretlen források', 14, 22);
    ctx.fillStyle = '#5b9dff99'; ctx.textAlign = 'right'; ctx.fillText('A CÉG BELSŐ HÁLÓZATA', W - 14, 22);
    for (let i = 0; i < lanes; i++) { const y = laneY(i); ctx.strokeStyle = '#ffffff0b'; ctx.lineWidth = 48; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(wx, y); ctx.stroke(); ctx.strokeStyle = '#5b9dff26'; ctx.lineWidth = 1; ctx.setLineDash([4, 10]); ctx.lineDashOffset = -T * 60; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(wx, y); ctx.stroke(); ctx.setLineDash([]) }
    const pul = .6 + Math.sin(T * 4) * .2; ctx.fillStyle = `rgba(251,146,60,${.16 * pul})`; ctx.fillRect(wx - 34, 0, 48, H);
    for (let y = 0; y < H; y += 26) { ctx.fillStyle = (Math.floor(y / 26) % 2) ? '#c2410c' : '#fb923c'; ctx.fillRect(wx - 8, y, 16, 22) }
    ctx.fillStyle = '#0b0c0f'; rrect(ctx, wx - 54, H * .08 - 16, 108, 32, 10); ctx.fill(); ctx.fillStyle = '#fb923c'; ctx.font = '800 14px Inter'; ctx.textAlign = 'center'; ctx.fillText('TŰZFAL', wx, H * .08 + 1);
    for (let i = 0; i < 3; i++) {
      const x = W * .86, y = H * (.2 + i * .3), hp = G.hp[i], sh = G.hitT[i] > 0 ? (Math.random() - .5) * 10 : 0;
      ctx.strokeStyle = '#5b9dff33'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx + 8, y); ctx.lineTo(x - 40, y); ctx.stroke();
      Dev.draw(ctx, 'rack', x + sh, y, 90, { t: T + i, bad: hp < 40 });
      ctx.fillStyle = '#0b0c0fdd'; rrect(ctx, x - 70, y + 50, 140, 40, 8); ctx.fill(); ctx.fillStyle = '#e5e7eb'; ctx.font = '700 12px Inter'; ctx.textAlign = 'center'; ctx.fillText(SRV[i], x, y + 62);
      ctx.fillStyle = '#ffffff1a'; ctx.fillRect(x - 58, y + 74, 116, 7); ctx.fillStyle = hp > 60 ? '#4ade80' : hp > 30 ? '#fbbf24' : '#f87171'; ctx.fillRect(x - 58, y + 74, 116 * hp / 100, 7);
      G.hitT[i] = Math.max(0, G.hitT[i] - dt);
    }
    for (const p of G.list) {
      if (p.dead) continue; const sm = p.small, y = p.y, hov = mouse && Math.abs(mouse.y - y) < 24 && mouse.x > p.x && mouse.x < p.x + p.w;
      ctx.save(); ctx.translate(p.x, y);
      ctx.fillStyle = sm ? '#3b1018' : '#1c1f26'; ctx.strokeStyle = hov ? '#fbbf24' : '#3a3f4b'; ctx.lineWidth = 2; rrect(ctx, 0, -21, p.w, 42, 12); ctx.fill(); ctx.stroke();
      drawIcon(ctx, p.d[0], 22, 0, 22, sm ? '#f87171' : '#e5e7eb', 2);
      if (!sm) { ctx.fillStyle = '#f2f3f5'; ctx.font = '700 13px Inter'; ctx.textAlign = 'left'; const t = p.d[1].length > 35 ? p.d[1].slice(0, 34) + '…' : p.d[1]; ctx.fillText(t, 42, -7); ctx.fillStyle = G.lvl >= 2 ? '#fbbf24' : '#9aa0ab'; ctx.font = '600 11px "JetBrains Mono",monospace'; ctx.fillText(p.d[2], 42, 10) }
      ctx.restore();
    }
    for (const l of lasers) { ctx.strokeStyle = `rgba(251,191,36,${l.life})`; ctx.lineWidth = 4 * l.life; ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke(); ctx.shadowBlur = 0; l.life -= dt * 3 }
    lasers = lasers.filter(l => l.life > 0);
    if (trail.length > 1) { ctx.strokeStyle = '#fbbf24aa'; ctx.lineWidth = 3; ctx.beginPath(); trail.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke() }
    for (const q of parts) { q.x += q.vx; q.y += q.vy; q.vx *= .95; q.vy *= .95; q.life -= dt * 1.6; ctx.globalAlpha = Math.max(0, q.life); ctx.fillStyle = q.c; ctx.fillRect(q.x - 2, q.y - 2, 4, 4) } ctx.globalAlpha = 1; parts = parts.filter(q => q.life > 0);
    for (const q of pops) { q.y -= dt * 40; q.life -= dt; ctx.globalAlpha = clamp(q.life, 0, 1); ctx.fillStyle = q.c; ctx.font = '800 18px Inter'; ctx.textAlign = 'center'; ctx.fillText(q.t, q.x, q.y) } ctx.globalAlpha = 1; pops = pops.filter(q => q.life > 0);
    if (G.on) {
      ctx.fillStyle = '#0b0c0fdd'; rrect(ctx, W * .35 - 230, H - 52, 460, 40, 12); ctx.fill(); ctx.font = '800 16px Inter'; ctx.textAlign = 'center';
      ctx.fillStyle = '#f2f3f5'; ctx.fillText(`${G.score} pont · ${Math.ceil(G.t)} mp · ${G.lvl}. szint${G.combo >= 3 ? ` · kombó ${G.combo}×` : ''}`, W * .35, H - 31);
      if (G.flash > 0) { ctx.fillStyle = `rgba(248,113,113,${G.flash * .2})`; ctx.fillRect(0, 0, W, H); G.flash -= dt * 2 }
    }
  }
  function step(dt) {
    if (!G.on) return; G.t -= dt; G.spawn -= dt;
    const lv = G.t > 40 ? 1 : G.t > 20 ? 2 : 3; if (lv !== G.lvl) { G.lvl = lv; toast(lv === 2 ? '2. szint: figyeld a portszámokat is!' : '3. szint: DDoS-támadás érkezik!', '#fbbf24', 2000) }
    if (G.spawn <= 0) { const pool = PK.filter(x => x[7] <= G.lvl); spawn(Math.random() < .55 ? pick(pool.filter(x => x[3])) : pick(pool.filter(x => !x[3]))); G.spawn = Math.max(.45, 1.25 - (60 - G.t) * .012) }
    if (G.lvl === 3) { G.burst -= dt; if (G.burst <= 0) { for (let k = 0; k < 7; k++) setTimeout(() => G.on && spawn(DDOS), k * 110); G.burst = 5.5 } }
    const wx = wallX();
    for (const p of G.list) {
      if (p.dead) continue; p.x += p.sp * dt;
      if (p.x + p.w > wx - 10) {
        p.dead = true;
        if (p.d[3]) { const i = p.tgt; G.hp[i] = Math.max(0, G.hp[i] - (p.small ? 5 : 14)); G.missed[p.d[4]] = p.d; G.combo = 0; G.flash = 1; G.hitT[i] = .4; sfx.alarm(); pop(wx - 120, p.y - 10, p.d[4] + '!', '#f87171'); burst(wx, p.y, ['#f87171'], 20) }
        else { G.score += 3; burst(wx, p.y, ['#4ade80'], 8) }
      }
    }
    G.list = G.list.filter(p => !p.dead);
    if (G.hp.some(h => h <= 0)) end(true); else if (G.t <= 0) end(false);
  }
  const at = (x, y) => G.list.find(p => !p.dead && Math.abs(p.y - y) < 24 && x > p.x && x < p.x + p.w);
  S.build = root => {
    root.innerHTML = `<div id="f-cv" style="position:absolute;inset:0"></div><div class="big-overlay" id="f-over"></div>`;
    C = makeCanvas($('#f-cv')); ctx = C.ctx; C.cv.style.cursor = 'crosshair'; reset();
    const pos = e => { const r = C.cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } };
    C.cv.addEventListener('pointerdown', e => { const m = pos(e); sweeping = true; trail = [[m.x, m.y]]; const p = at(m.x, m.y); if (p && G.on) hit(p) });
    C.cv.addEventListener('pointermove', e => { mouse = pos(e); if (sweeping) { trail.push([mouse.x, mouse.y]); if (trail.length > 14) trail.shift(); const p = at(mouse.x, mouse.y); if (p && G.on) hit(p) } });
    addEventListener('pointerup', () => { sweeping = false; trail = [] });
  };
  S.enter = intro;
  S.resize = () => C && C.resize();
  S.tick = dt => { T += dt; step(dt); draw(dt) };
  S.leave = () => { if (G) G.on = false };
  S.comp = { rules: '60 másodpercig védd a három szervert! Blokkold a támadásokat, a hasznos forgalmat engedd át. Három egyre nehezebb szint.', start: () => start() };
  S.score = () => best;
  return S;
})());
