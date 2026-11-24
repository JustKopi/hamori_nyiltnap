/* ===== 2. Légy te a router! – útvonaltábla, CIDR, leghosszabb egyezés, TTL, terhelés ===== */
App.add((() => {
  const S = {
    id: 'router', icon: '', title: 'Légy te a router!', color: '#fbbf24',
    desc: '60 másodperc, három egyre nehezebb útvonaltábla. Nézd meg a cél IP-címet, és küldd a csomagot a jó kimenetre!',
    topic: 'IPv4-címzés, alhálózati maszk (CIDR), útvonaltábla, alapértelmezett átjáró, TTL'
  };
  const EX = {
    up: { ic: 'home', nm: 'Otthoni hálózat', col: '#5b9dff', key: '↑' },
    left: { ic: 'school', nm: 'Iskola', col: '#fbbf24', key: '←' },
    right: { ic: 'gamepad', nm: 'Játékszerver', col: '#4ade80', key: '→' },
    down: { ic: 'globe', nm: 'Internet', col: '#f472b6', key: '↓' }
  };
  // [hálózat, prefixhossz, kimenet]
  const PH = [
    { n: '1. szint: /24-es hálózatok', t: 0, d: 'Az első három szám a hálózat címe.', rt: [['192.168.1.0', 24, 'up'], ['10.0.0.0', 24, 'left'], ['172.16.5.0', 24, 'right'], ['0.0.0.0', 0, 'down']] },
    { n: '2. szint: nagyobb hálózatok (/16, /8)', t: 20, d: 'A /16 az első két számot, a /8 csak az elsőt nézi!', rt: [['192.168.0.0', 16, 'up'], ['10.0.0.0', 8, 'left'], ['172.16.0.0', 16, 'right'], ['0.0.0.0', 0, 'down']] },
    { n: '3. szint: leghosszabb egyezés + TTL', t: 40, d: 'Ha több sor is illik, a leghosszabb prefix nyer. TTL=1 csomagot el kell dobni (szóköz)!', rt: [['192.168.1.0', 24, 'up'], ['10.0.0.0', 8, 'left'], ['10.20.0.0', 16, 'right'], ['172.16.0.0', 12, 'right'], ['0.0.0.0', 0, 'down']] }
  ];
  const KIND = [['globe', 'Weboldal', 2], ['video', 'Videó', 12], ['gamepad', 'Játékadat', .2], ['mail', 'E-mail', .5], ['music', 'Zene', 5], ['code', 'Frissítés', 25]];
  const DUR = 60;
  const ipN = s => s.split('.').reduce((a, b) => a * 256 + +b, 0);
  const match = (ip, net, len) => len === 0 || Math.floor(ipN(ip) / 2 ** (32 - len)) === Math.floor(ipN(net) / 2 ** (32 - len));
  function route(ip, rt) { let best = null; for (const r of rt) if (match(ip, r[0], r[1]) && (!best || r[1] > best[1])) best = r; return best }
  const R = (a, b) => rnd(a, b);
  let best = 0, root;
  const G = { el: 0, on: false, time: DUR, score: 0, count: 0, wrong: 0, combo: 0, pk: null, lock: 0, ph: 0, load: {}, tot: {} };

  function genIP(ph) {
    const p = PH[ph], k = Math.random();
    if (ph === 0) return pick([`192.168.1.${R(1, 254)}`, `10.0.0.${R(1, 254)}`, `172.16.5.${R(1, 254)}`, pick([`8.8.8.8`, `142.250.${R(1, 254)}.${R(1, 254)}`, `192.168.2.${R(1, 254)}`, `10.0.1.${R(1, 254)}`, `172.16.6.${R(1, 254)}`, `1.1.1.1`])]);
    if (ph === 1) return pick([`192.168.${R(0, 255)}.${R(1, 254)}`, `10.${R(0, 255)}.${R(0, 255)}.${R(1, 254)}`, `172.16.${R(0, 255)}.${R(1, 254)}`, pick([`172.17.${R(0, 255)}.${R(1, 254)}`, `192.169.${R(0, 255)}.${R(1, 254)}`, `11.${R(0, 255)}.${R(0, 255)}.${R(1, 254)}`, `93.184.216.34`])]);
    return pick([`192.168.1.${R(1, 254)}`, `192.168.${R(2, 9)}.${R(1, 254)}`, `10.${R(0, 19)}.${R(0, 255)}.${R(1, 254)}`, `10.20.${R(0, 255)}.${R(1, 254)}`, `10.${R(21, 99)}.${R(0, 255)}.${R(1, 254)}`, `172.${R(16, 31)}.${R(0, 255)}.${R(1, 254)}`, `172.${R(32, 40)}.${R(0, 255)}.${R(1, 254)}`]);
  }
  function newPacket() {
    const ph = G.ph, ip = genIP(ph), kd = pick(KIND), ttl = ph === 2 && Math.random() < .15 ? 1 : R(3, 64);
    const r = route(ip, PH[ph].rt), dir = ttl <= 1 ? 'drop' : r[2];
    G.pk = { ip, dir, r, kd, ttl, mb: +(kd[2] * (.6 + Math.random() * .8)).toFixed(1) };
    $('#r-ip').textContent = ip; $('#r-kind').innerHTML = `${icon(kd[0], 16, 2)} ${kd[1]} • ${String(G.pk.mb).replace('.', ',')} MB`;
    $('#r-ttl').textContent = 'TTL: ' + ttl; $('#r-ttl').classList.toggle('low', ttl <= 1);
    const pe = $('#r-packet'); pe.classList.remove('wrong', 'pop'); void pe.offsetWidth; pe.classList.add('pop');
  }
  function rtHtml(hl) {
    return `<div class="r-rth">Útvonaltábla</div>` + PH[G.ph].rt.map(r => `<div class="r-rr ${hl === r ? 'hl' : ''}" style="--c:${EX[r[2]].col}"><span>${r[1] === 0 ? '0.0.0.0/0' : r[0] + '/' + r[1]}</span><b>${r[1] === 0 ? 'alapért. átjáró' : EX[r[2]].nm}</b></div>`).join('');
  }
  function exitLabels() {
    Object.keys(EX).forEach(d => {
      const nets = PH[G.ph].rt.filter(r => r[2] === d).map(r => r[1] === 0 ? 'minden más' : r[0] + '/' + r[1]);
      $(`#r-${d} .ip`).innerHTML = nets.join('<br>');
    });
  }
  function setPhase(i) {
    G.ph = i; $('#r-rt').innerHTML = rtHtml(); exitLabels(); $('#r-drop').style.display = i === 2 ? '' : 'none';
    $('#r-phase').textContent = PH[i].n;
    if (i > 0) { G.lock = 1.6; const b = $('#r-banner'); b.innerHTML = `<b>${PH[i].n}</b><span>${PH[i].d}</span>`; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); sfx.win() }
  }
  function answer(d) {
    if (!G.on || G.lock > 0) return;
    const pk = G.pk;
    if (d === pk.dir) {
      G.combo++; const pts = Math.round((10 + Math.min(G.combo, 10) * 2) * [1, 1.5, 2][G.ph]); G.score += pts; G.count++; sfx.ok();
      if (d !== 'drop') { G.load[d] = (G.load[d] || 0) + pk.mb * 8; G.tot[d] = (G.tot[d] || 0) + pk.mb; const ex = $('#r-' + d); ex.classList.add('flash-ok'); setTimeout(() => ex.classList.remove('flash-ok'), 250) }
      fly(`+${pts}`, d === 'drop' ? 'center' : d, d === 'drop' ? '#f87171' : EX[d].col); $('#r-combo').textContent = G.combo >= 3 ? `${G.combo}× KOMBÓ!` : '';
      if (G.combo % 10 === 0) FX.burstEl($('#r-router'), 40);
      $('#r-why').innerHTML = d === 'drop' ? `<b>${pk.ip}</b>: TTL=1, eldobva – így nem kering örökké a hálózatban.` : `<b>${pk.ip}</b> → ${pk.r[1] === 0 ? 'nincs rá külön sor, megy az alapértelmezett átjárón' : `illik erre: <b>${pk.r[0]}/${pk.r[1]}</b>`}`;
      $('#r-rt').innerHTML = rtHtml(pk.r); newPacket();
    } else {
      G.combo = 0; G.wrong++; $('#r-combo').textContent = ''; if (!window.EASY) G.time = Math.max(0, G.time - 3); sfx.bad();
      const pe = $('#r-packet'); pe.classList.remove('wrong'); void pe.offsetWidth; pe.classList.add('wrong');
      if (pk.dir !== 'drop') { const ex = $('#r-' + pk.dir); ex.classList.add('flash-hint'); setTimeout(() => ex.classList.remove('flash-hint'), 900) }
      $('#r-why').innerHTML = pk.dir === 'drop' ? `Rossz! A TTL=1, ezt <b>el kell dobni</b> (szóköz).` : `Rossz! <b>${pk.ip}</b> a(z) <b>${pk.r[1] === 0 ? '0.0.0.0/0' : pk.r[0] + '/' + pk.r[1]}</b> sorra illik → <b>${EX[pk.dir].nm}</b>`;
      $('#r-rt').innerHTML = rtHtml(pk.r);
      fly('−3 mp', 'center', '#f87171'); G.lock = .6;
    }
    hud();
  }
  function fly(t, d, col) {
    const f = document.createElement('div'); f.className = 'r-fly'; f.textContent = t; f.style.color = col;
    const r = $('#r-router').getBoundingClientRect(), b = root.getBoundingClientRect();
    f.style.left = (r.left - b.left + r.width / 2 - 20) + 'px'; f.style.top = (r.top - b.top) + 'px'; root.appendChild(f);
    const o = { up: [0, -120], down: [0, 140], left: [-200, 0], right: [200, 0], center: [0, -80] }[d];
    requestAnimationFrame(() => { f.style.transform = `translate(${o[0]}px,${o[1]}px)`; f.style.opacity = 0 }); setTimeout(() => f.remove(), 500);
  }
  function hud() {
    $('#r-score').textContent = G.score; $('#r-time').textContent = Math.ceil(G.time); $('#r-count').textContent = G.count;
    $('#r-fill').style.width = (G.time / DUR * 100) + '%';
  }
  function intro() {
    if (G.on) return; const o = $('#r-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card"><h2>Légy te a router!</h2>
     <p>Csomagok érkeznek, mindegyiken egy <b>cél IP-cím</b>. A bal felső <b>útvonaltábla</b> megmondja, melyik hálózat merre van. Küldd a csomagot a jó kimenetre!</p>
     <div class="r-lv">${PH.map((p, i) => `<div><b>${i + 1}</b><span>${p.n.split(': ')[1]}</span></div>`).join('')}</div>
     <p style="font-size:15px;color:var(--muted)">Nyilakkal vagy kattintással • Rossz válasz: −3 mp • A nehezebb szinteken több pont jár</p>
     <button class="btn go" id="r-start" style="font-size:24px;margin-top:6px;height:56px;padding:0 30px">Indulás</button></div>`;
    $('#r-start').onclick = start;
  }
  function start() {
    Object.assign(G, { el: 0, on: true, time: DUR, score: 0, count: 0, wrong: 0, combo: 0, lock: 0, load: {}, tot: {} });
    $('#r-over').style.display = 'none'; $('#r-combo').textContent = ''; $('#r-why').textContent = ''; setPhase(0); newPacket(); hud(); beep(440, .1, 'triangle', .07); beep(880, .15, 'triangle', .07, 0, .12);
  }
  function end() {
    G.on = false; best = Math.max(best, G.score);
    const sum = Object.keys(EX).map(d => [d, G.tot[d] || 0]).sort((a, b) => b[1] - a[1]);
    const detail = `${G.count} csomag, ${G.wrong} hiba`;
    if (Comp.racing) { sfx.win(); Comp.finish(G.score, detail); intro(); return }
    sfx.win(); if (G.score > 300) FX.confetti();
    const o = $('#r-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card"><h2>Lejárt az idő!</h2><div class="big">${G.score} pont</div><p>${detail}. Elért szint: <b>${G.ph + 1}.</b></p>
      <div class="r-sum">${sum.map(([d, v]) => `<div><span style="color:${EX[d].col}">${icon(EX[d].ic, 18)} ${EX[d].nm}</span><i><em style="width:${sum[0][1] ? v / sum[0][1] * 100 : 0}%;background:${EX[d].col}"></em></i><b>${v.toFixed(1).replace('.', ',')} MB</b></div>`).join('')}</div>
      <div style="margin-top:14px"><button class="btn go" id="r-again">Újra</button></div>
      <div class="learn"><b>Ezt csinálja egy igazi router:</b> minden csomagnál megnézi a cél IP-címet, és az <b>útvonaltáblában</b> megkeresi a leghosszabb illeszkedő sort (a /24 pontosabb, mint a /8). Ha semmi sem illik, az <b>alapértelmezett átjárón</b> küldi tovább. A <b>TTL</b> minden routeren eggyel csökken, nullánál a csomagot eldobják, így a hibás útvonalon nem kering örökké.</div></div>`;
    $('#r-again').onclick = start;
  }
  S.build = r => {
    root = r;
    r.innerHTML = `<style>
      #st-router .kpi{position:absolute;top:12px;left:0;right:0}
      #r-bar{position:absolute;top:62px;left:50%;transform:translateX(-50%);width:min(700px,60%);height:10px;background:#1c1f26;border-radius:8px;overflow:hidden}
      #r-fill{height:100%;width:100%;background:linear-gradient(90deg,var(--green),var(--yellow),var(--red))}
      #r-phase{position:absolute;top:78px;left:50%;transform:translateX(-50%);font-size:14px;font-weight:700;color:var(--yellow)}
      .r-exit{position:absolute;width:250px;padding:10px;border-radius:18px;border:2px solid;background:#15171c;text-align:center;cursor:pointer;font-weight:800;transition:box-shadow .2s}
      .r-exit .nm{font-size:19px;margin-top:2px}.r-exit .ip{font-family:var(--mono);font-size:15px;margin-top:4px;color:#e5e7eb;line-height:1.35}.r-exit .key{font-size:12px;color:var(--muted);margin-top:4px}
      .r-ld{height:6px;border-radius:3px;background:#262a33;margin-top:6px;overflow:hidden}.r-ld i{display:block;height:100%;width:0;transition:width .3s}
      .r-lt{font-size:11px;color:var(--muted);font-weight:600;margin-top:2px}
      .r-exit.flash-ok{box-shadow:0 0 40px var(--green)} .r-exit.flash-hint{box-shadow:0 0 50px var(--yellow)}
      #r-up{top:104px;left:50%;transform:translateX(-50%)} #r-down{bottom:14px;left:50%;transform:translateX(-50%)}
      #r-left{left:30px;top:56%;transform:translateY(-50%)} #r-right{right:30px;top:56%;transform:translateY(-50%)}
      #r-router{position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);width:190px;height:130px;display:flex;align-items:center;justify-content:center}
      #r-packet{position:absolute;left:50%;top:58%;transform:translate(-50%,-175%);background:#fff;color:#111;border-radius:16px;padding:8px 18px;font-family:var(--mono);font-weight:900;font-size:30px;box-shadow:0 6px 30px #0009;white-space:nowrap;border:4px solid var(--yellow);text-align:center}
      #r-packet .lbl{display:flex;justify-content:space-between;gap:14px;font-family:Inter,sans-serif;font-size:12.5px;color:#555;font-weight:700}
      #r-kind{display:inline-flex;gap:4px;align-items:center}#r-ttl.low{color:#dc2626;font-weight:900}
      #r-packet.pop{animation:rpop .25s}@keyframes rpop{from{transform:translate(-50%,-175%) scale(.8);opacity:.3}}
      #r-packet.wrong{border-color:var(--red);animation:rsh .35s}
      @keyframes rsh{0%,100%{transform:translate(-50%,-175%)}25%{transform:translate(-58%,-175%)}75%{transform:translate(-42%,-175%)}}
      #r-combo{position:absolute;left:50%;bottom:214px;transform:translateX(-50%);font-size:24px;font-weight:900;color:var(--yellow);text-shadow:0 0 20px #fbbf2488}
      #r-why{position:absolute;left:50%;bottom:188px;transform:translateX(-50%);font-size:15px;color:#c9ccd3;white-space:nowrap}
      #r-rt{position:absolute;top:12px;left:12px;width:270px;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:10px 12px;font-size:14px;z-index:2}
      .r-rth{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
      .r-rr{display:flex;justify-content:space-between;gap:8px;padding:5px 8px;border-radius:8px;border-left:3px solid var(--c);margin-top:4px;background:#15171c;transition:background .2s}
      .r-rr span{font-family:var(--mono)}.r-rr b{color:var(--c);font-size:13px}.r-rr.hl{background:color-mix(in srgb,var(--c) 25%,#15171c)}
      #r-drop{position:absolute;right:30px;bottom:20px;border-color:#f87171;color:#f87171;width:180px}
      #r-banner{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%) scale(.9);background:var(--panel);border:2px solid var(--yellow);border-radius:18px;padding:16px 24px;text-align:center;z-index:6;opacity:0;pointer-events:none;max-width:560px}
      #r-banner b{display:block;font-size:24px;color:var(--yellow)}#r-banner span{font-size:16px;color:#e5e7eb}
      #r-banner.show{animation:rban 2.2s ease forwards}@keyframes rban{0%{opacity:0;transform:translate(-50%,-50%) scale(.8)}12%,80%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0}}
      .r-fly{position:absolute;pointer-events:none;font-size:28px;font-weight:900;transition:all .45s ease-out;z-index:5}
      .r-lv{display:flex;gap:10px;justify-content:center;margin:10px 0}.r-lv div{background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:8px 12px;width:150px;font-size:13px}.r-lv b{display:block;font-size:22px;color:var(--yellow)}
      .r-sum{margin:10px auto;max-width:420px;text-align:left}.r-sum div{display:grid;grid-template-columns:170px 1fr 70px;gap:10px;align-items:center;padding:4px 0;font-size:15px}
      .r-sum span{display:inline-flex;gap:6px;align-items:center;font-weight:700}.r-sum i{height:8px;background:#262a33;border-radius:4px;overflow:hidden}.r-sum em{display:block;height:100%}.r-sum b{text-align:right}
    </style>
    <div class="kpi"><div class="pill"><span id="r-score">0</span> pont</div><div class="pill"><span id="r-time">${DUR}</span> mp</div><div class="pill"><span id="r-count">0</span> csomag</div></div>
    <div id="r-bar"><div id="r-fill"></div></div><div id="r-phase"></div><div id="r-rt"></div>
    ${Object.entries(EX).map(([d, n]) => `<div class="r-exit" id="r-${d}" data-dir="${d}" style="border-color:${n.col};color:${n.col}"><div>${icon(n.ic, 30, 1.6)}</div><div class="nm">${n.nm}</div><div class="ip"></div><div class="r-ld"><i style="background:${n.col}"></i></div><div class="r-lt">0 Mbit/s</div><div class="key">${n.key}</div></div>`).join('')}
    <div class="r-exit" id="r-drop" data-dir="drop" style="display:none"><div>${icon('trash', 26, 1.8)}</div><div class="nm">Eldobás</div><div class="key">szóköz</div></div>
    <div id="r-router"><img alt="router" src="${Dev.img('router', 120)}" style="width:150px"></div>
    <div id="r-packet"><span class="lbl"><span id="r-kind"></span><span id="r-ttl"></span></span><span id="r-ip">–</span></div><div id="r-combo"></div><div id="r-why"></div>
    <div id="r-banner"></div><div class="big-overlay" id="r-over"></div>`;
    $$('.r-exit', r).forEach(e => e.addEventListener('pointerdown', () => answer(e.dataset.dir)));
    addEventListener('keydown', e => {
      if (App.cur !== S || e.target.tagName === 'INPUT') return;
      const k = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', ' ': 'drop' }[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (k) { e.preventDefault(); answer(k) }
    });
    G.ph = 0; $('#r-rt').innerHTML = rtHtml(); exitLabels();
  };
  S.enter = intro;
  S.comp = { rules: '60 másodperc, három szint egyre bonyolultabb útvonaltáblával. Rossz válasz: −3 másodperc. Kombóért és a nehezebb szinteken több pont jár.', start: () => start() };
  S.comp.live = () => G.on ? G.score : 0; // verseny közbeni részeredmény (élő ranglista-mentés)
  S.score = () => best;
  S.tick = dt => {
    if (G.lock > 0) G.lock -= dt;
    Object.keys(EX).forEach(d => { G.load[d] = (G.load[d] || 0) * Math.pow(.55, dt); const l = $(`#r-${d} .r-ld i`); if (l) { l.style.width = clamp(G.load[d] / 2, 0, 100) + '%'; $(`#r-${d} .r-lt`).textContent = Math.round(G.load[d]) + ' Mbit/s' } });
    if (!G.on) return; G.time -= dt; G.el += dt;
    const el = G.el; const ph = window.EASY ? 0 : el >= PH[2].t ? 2 : el >= PH[1].t ? 1 : 0; if (ph !== G.ph) { setPhase(ph); newPacket() }
    if (G.time <= 0) { G.time = 0; hud(); end() } else hud();
  };
  S._route = (ip, ph) => route(ip, PH[ph].rt);
  return S;
})());
