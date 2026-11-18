/* ===== 8. Rendszergazda-ügyelet: üzemeltetés, monitorozás, konténerek, mentés ===== */
App.add((() => {
  const S = {
    id: 'ugyelet', icon: '', title: 'Rendszergazda-ügyelet', color: '#fb7185',
    desc: 'Pirosan villognak a szerverek, közben jönnek az e-mailek, chatek és hívások! Bírod 90 másodpercig?',
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
  const DUR = 90;
  const G = { on: false, t: DUR, spawn: 3, fixes: 0, up: 0, tot: 0, tool: null, sel: null, hist: [], tk: [], tid: 0, open: null, tpts: 0, sat: 80, tok: 0, tkT: 4 };
  // Jegyek: [csatorna, kitől, tárgy, szöveg (hívásnál párbeszéd sorai |-lel), [[válasz, jó-e, magyarázat], ...]]
  const TK = [
    ['mail', 'Szabó tanárnő', 'Nem tudok belépni', 'Reggel háromszor elírtam a jelszavam, most azt írja: <b>a fiók zárolva</b>. Órám lesz 10 perc múlva!', [['Feloldom a fiókot a címtárban, és jelszócserét kérek tőle', 1, 'A zárolás védi a fiókot a jelszópróbálgatás ellen – feloldani a rendszergazda tudja.'], ['Újraindítom a fájlszervert', 0, 'A fájlszervernek ehhez semmi köze.'], ['Kikapcsolom a zárolást mindenkinél', 0, 'Így a támadók korlátlanul próbálgathatnának jelszavakat!']]],
    ['chat', 'Pisti, 9.b', 'Lassú a WiFi', 'tök lassú a wifi a tornateremben, a videó se megy be :(', [['Megnézem a hozzáférési pont terhelését, ha kell, új AP-t telepítünk', 1, 'Sok eszköz egy AP-n = lassú. Tervezett lefedettség kell!'], ['Kapcsolja ki-be a telefonját, és kész', 0, 'Ez csak az ő eszközén segíthet, a gond az AP terhelése.'], ['Lekapcsolom a tornatermi WiFit', 0, 'Akkor senkinek nem lesz netje.']]],
    ['call', 'Titkárság', 'Gyanús e-mail', 'Jó napot! Jött egy e-mail a banktól, hogy kattintsak egy linkre és adjam meg a jelszót, különben letiltják a számlát.|Most rákattintsak?', [['Ne kattintson! Adathalászat. Jelentjük, és töröljük', 1, 'Bank soha nem kér jelszót e-mailben. Ez adathalászat (phishing).'], ['Ha a bank kéri, adja meg nyugodtan', 0, 'Pont ezt akarja a csaló!'], ['Továbbítsa mindenkinek, hátha másnak is jött', 0, 'Így még többen kattinthatnak rá.']]],
    ['mail', 'Igazgató úr', 'Új kolléga', 'Hétfőn új informatikatanár érkezik. Kérem, legyen fiókja, e-mail-címe, és érje el a tanári mappát.', [['Létrehozom a felhasználót a címtárban, és a Tanárok csoportba teszem', 1, 'Csoportokkal egyszerre kap minden szükséges jogosultságot.'], ['Odaadom neki a saját rendszergazdai jelszavam', 0, 'Soha! Mindenki csak a saját fiókját használja.'], ['Majd ha megjön, kitaláljuk', 0, 'Az első napon már dolgoznia kell.']]],
    ['call', 'Könyvtár', 'Nem nyomtat', 'Szia! A nyomtató csak villog, és semmi nem jön ki belőle.|Már ötször elküldtem ugyanazt…', [['Törlöm a beragadt nyomtatási sort, és újraindítom a nyomtatót', 1, 'A beragadt nyomtatási feladat megakasztja a többit.'], ['Újratelepítem a szervert', 0, 'Ágyúval verébre!'], ['Vegyenek új nyomtatót', 0, 'Drága, és nem is hibás.']]],
    ['chat', 'Kati néni, gazdasági iroda', 'Töröltem egy fájlt', 'Jaj, véletlenül kitöröltem a tegnapi bérszámfejtési táblázatot!!! Mi lesz most?', [['Visszaállítom a tegnap esti mentésből', 1, 'Ezért kell rendszeres biztonsági mentés!'], ['Sajnos örökre elveszett', 0, 'Van mentés – a jó rendszergazda erre készül.'], ['Írja meg újra', 0, 'Órák munkája lenne.']]],
    ['call', 'Portás', 'Talált pendrive', 'Halló, találtam egy pendrive-ot a folyosón, rajta van, hogy „Fizetések 2026”.|Bedugjam a gépembe, hogy megnézzem, kié?', [['Ne dugja be! Hozza le, elszigetelt gépen ellenőrizzük', 1, 'Az elhagyott pendrive gyakori támadási trükk: kártevő lehet rajta.'], ['Dugja be nyugodtan', 0, 'Pont erre számít a támadó!'], ['Dobja ki a szemétbe', 0, 'Jobb, mint bedugni, de ki kell vizsgálni.']]],
    ['chat', '11.a osztályfőnök', 'Nincs kép a projektoron', 'a projektor kék képet mutat, a laptopot rádugtam, de nincs kép', [['Ellenőrizzük a kábelt és a projektor bemeneti forrását (HDMI)', 1, 'A leggyakoribb hiba: rossz bemenet van kiválasztva.'], ['Újratelepítjük a Windowst', 0, 'Szükségtelen.'], ['Rendelünk új projektort', 0, 'Valószínűleg nem hibás.']]],
    ['mail', 'Igazgatóhelyettes', 'Otthoni elérés', 'Szeretném otthonról is elérni az iskolai fájlszervert. Megoldható?', [['VPN-t állítok be neki, kétlépcsős azonosítással', 1, 'A VPN titkosított alagutat épít az iskolai hálózatba.'], ['Kiteszem a fájlszervert az internetre jelszó nélkül', 0, 'Bárki hozzáférne az adatokhoz!'], ['Küldje el magának e-mailben az összes fájlt', 0, 'Személyes adatok e-mailben: adatvédelmi kockázat.']]],
    ['call', 'Bence, 10.c', 'Elfelejtett jelszó', 'Szia, elfelejtettem a jelszavam, és holnap témazáró…|Meg tudnád mondani, mi volt?', [['Ellenőrzöm, hogy tényleg ő az, és ideiglenes jelszót adok, amit cserélnie kell', 1, 'A jelszót a rendszergazda sem látja – csak újat állíthat be.'], ['Megmondom a régit', 0, 'A jelszavak hash-elve vannak tárolva, senki nem látja őket.'], ['Csinálok neki új fiókot', 0, 'Elvesznének a fájljai.']]],
    ['chat', 'Nagy tanár úr', 'Frissítés', 'a gépem folyton frissíteni akar, nem lehetne ezt végleg kikapcsolni?', [['Mentsen, és engedje frissíteni: a biztonsági javítások fontosak', 1, 'A frissítések befoltozzák a támadók által ismert hibákat.'], ['Kikapcsolom végleg a frissítéseket', 0, 'A gép sebezhető marad.'], ['Húzza ki a hálózati kábelt', 0, 'Akkor nem tud dolgozni.']]],
    ['mail', 'Diákönkormányzat', 'Weboldal a bálnak', 'Szeretnénk egy kis weboldalt a szalagavatóra. Hol futhatna?', [['Indítok neki egy új konténert a webszerveren, saját aldomainnel', 1, 'Konténerrel percek alatt elszigetelt webhely indul.'], ['Fusson a titkárság gépén', 0, 'Az nem szerver, és ki van kapcsolva éjjel.'], ['Nem lehet, felejtsék el', 0, 'Megoldható, ez a rendszergazda dolga.']]]
  ];
  const CH = { mail: ['mail', 'E-mail', 40], chat: ['user', 'Chat', 30], call: ['phone', 'Hívás', 18] };
  function newTicket() {
    if (G.tk.filter(t => !t.done).length >= 4) return;
    const used = new Set(G.tk.map(t => t.d)), pool = TK.filter(t => !used.has(t)); const d = pick(pool.length ? pool : TK);
    const t = { id: ++G.tid, d, ch: d[0], sla: CH[d[0]][2], left: CH[d[0]][2], done: false };
    t.opts = [...d[4]].sort(() => Math.random() - .5); G.tk.unshift(t);
    if (t.ch === 'call') [0, .3, 1.1, 1.4].forEach(x => beep(950, .15, 'sine', .05, 0, x)); else beep(1300, .08, 'triangle', .05);
    log(`${CH[t.ch][1].toUpperCase().padEnd(7)} ${d[1]}: ${d[2]}`); renderInbox();
  }
  function renderInbox() {
    const el = $('#o-inbox'); if (!el) return; const op = G.tk.find(t => t.id === G.open && !t.done);
    if (op) {
      const d = op.d, body = op.ch === 'call' ? d[3].split('|').map(x => `<div class="o-bub">${x}</div>`).join('') : `<div class="o-mailb">${d[3]}</div>`;
      el.innerHTML = `<div class="o-th"><button class="btn o-bk">${icon('back', 14, 2)}</button><span class="o-chi ${op.ch}">${icon(CH[op.ch][0], 16)}</span><div><b>${d[1]}</b><div class="o-sub">${CH[op.ch][1]} • ${d[2]}</div></div></div>${body}
        <div class="o-q">Mit teszel?</div>${op.opts.map((o, i) => `<button class="btn o-opt" data-o="${i}">${o[0]}</button>`).join('')}`;
      $('.o-bk').onclick = () => { G.open = null; renderInbox() };
      $$('.o-opt').forEach(b => b.onclick = () => answer(op, op.opts[+b.dataset.o]));
      return;
    }
    const open = G.tk.filter(t => !t.done);
    el.innerHTML = `<div class="o-ih">Beérkező kérések <span>${open.length}</span></div>` + (open.map(t => `<div class="o-tk ${t.ch} ${t.left < 6 ? 'urg' : ''}" data-t="${t.id}"><span class="o-chi ${t.ch}">${icon(CH[t.ch][0], 16)}</span><div class="o-tx"><b>${t.d[1]}</b><span>${t.d[2]}</span><i><em style="width:${t.left / t.sla * 100}%"></em></i></div></div>`).join('') || '<div class="o-empty">Nincs nyitott kérés. Figyeld a szervereket!</div>');
    $$('.o-tk').forEach(e => e.onclick = () => { G.open = +e.dataset.t; sfx.click(); renderInbox() });
  }
  function answer(t, o) {
    t.done = true; G.open = null;
    if (o[1]) { G.tpts += 40 + Math.round(t.left); G.sat = Math.min(100, G.sat + 6); G.tok++; sfx.ok(); toast(`<b>Megoldva!</b> ${o[2]}`, '#4ade80', 3200); log(`OK      ${t.d[1]}: ${t.d[2]} – megoldva`, 'ok') }
    else { G.tpts -= 20; G.sat = Math.max(0, G.sat - 12); sfx.bad(); toast(`<b>Nem jó megoldás.</b> ${o[2]} A helyes: ${t.d[4].find(x => x[1])[0]}.`, '#f87171', 4200); log(`ROSSZ   ${t.d[1]}: ${t.d[2]}`, 'err') }
    renderInbox(); renderSat();
  }
  function renderSat() { const e = $('#o-sat'); if (e) { e.style.width = G.sat + '%'; e.style.background = G.sat > 70 ? 'var(--green)' : G.sat > 40 ? 'var(--yellow)' : 'var(--red)'; $('#o-satv').textContent = Math.round(G.sat) + '%' } }

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
      <p>Te felelsz az iskola 6 szerveréért! Ha valamelyik <b style="color:var(--red)">pirosan villog</b>, olvasd el a hibát, válaszd ki a <b>megfelelő eszközt</b> lent, majd kattints a szerverre (vagy fordítva).<br>Közben <b>e-mailek, chatek és telefonhívások</b> is jönnek a kollégáktól: nyisd meg őket jobbra, és válaszd a helyes megoldást, mielőtt lejár az idő!<br>Cél: magas <b>rendelkezésre állás</b> és <b>elégedett felhasználók</b> 90 másodpercen át.</p>
      <button class="btn go" id="o-start" style="font-size:28px">MŰSZAK KEZDÉSE ▶</button></div>`;
    $('#o-start').onclick = start;
  }
  function start() { reset(); Object.assign(G, { on: true, t: DUR, spawn: 2, fixes: 0, up: 0, tot: 0, tool: null, sel: null, hist: [], tk: [], tid: 0, open: null, tpts: 0, sat: 80, tok: 0, tkT: 4 }); renderInbox(); renderSat(); $('#o-log').innerHTML = ''; log('INFO    Műszak kezdete. Monitorozás aktív.', 'ok'); $('#o-over').style.display = 'none'; render() }
  function end() {
    G.on = false; const av = G.tot ? G.up / G.tot * 100 : 100; const score = Math.max(0, Math.round(av * 10 + G.fixes * 25 + G.tpts + G.sat * 3)); best = Math.max(best, score);
    if (Comp.racing) { Comp.finish(score, `Rendelkezésre állás: ${av.toFixed(1).replace('.', ',')}% · ${G.fixes} szerverhiba · ${G.tok} megoldott kérés · elégedettség ${Math.round(G.sat)}%`); intro(); return }
    if (av > 80) { sfx.win(); FX.confetti() } else sfx.bad();
    const o = $('#o-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card"><h2>${av > 90 ? 'Profi rendszergazda!' : av > 75 ? 'Szép munka!' : 'Kemény műszak volt…'}</h2>
      <div class="big">${av.toFixed(1).replace('.', ',')}%</div><p>rendelkezésre állás • ${G.fixes} szerverhiba • ${G.tok} megoldott kérés • elégedettség ${Math.round(G.sat)}% • <b>${score} pont</b></p>
      <div class="learn"><b>Ezt csinálja egy üzemeltető:</b> <b>monitorozó</b> rendszerrel (pl. Nagios) figyeli a szervereket, és ha nagy a terhelés, újabb <b>konténert vagy virtuális gépet</b> indít (pl. Docker, Kubernetes). Rendszeres <b>biztonsági mentést</b> készít, hogy egy zsarolóvírus után is vissza lehessen állítani az adatokat. Linux és Windows szervereket is üzemeltet, és közben a kollégák kéréseit is intézi: fiókok, jogosultságok, nyomtatók, adathalász levelek.</div>
      <div style="margin-top:14px"><button class="btn go" id="o-again">ÚJ MŰSZAK ▶</button></div></div>`;
    $('#o-again').onclick = start;
  }
  S.build = root => {
    root.innerHTML = `<style>
      #o-wrap{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1fr) 340px 280px;grid-template-rows:minmax(0,1fr) auto;gap:12px;padding:12px}
      #o-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-content:start;overflow:auto}
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
      #o-inbox{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:10px;overflow:auto;min-height:0;display:flex;flex-direction:column;gap:6px}
      .o-ih{font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;display:flex;justify-content:space-between}.o-ih span{background:var(--red);color:#fff;border-radius:999px;padding:0 8px}
      .o-tk{display:flex;gap:10px;align-items:center;background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:9px;cursor:pointer;animation:oIn .35s}
      .o-tk:hover{border-color:var(--line2)}.o-tk.urg{border-color:var(--red);animation:obad 1s infinite}
      @keyframes oIn{from{opacity:0;transform:translateX(20px)}}
      .o-chi{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;flex:none}.o-chi.mail{background:rgba(91,157,255,.15);color:#5b9dff}.o-chi.chat{background:rgba(74,222,128,.15);color:#4ade80}.o-chi.call{background:rgba(251,113,133,.18);color:#fb7185}
      .o-tx{flex:1;min-width:0}.o-tx b{display:block;font-size:14px}.o-tx span{display:block;font-size:13px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .o-tx i{display:block;height:4px;background:#262a33;border-radius:2px;margin-top:5px;overflow:hidden}.o-tx em{display:block;height:100%;background:var(--yellow);transition:width .3s}
      .o-empty{font-size:14px;color:var(--muted);padding:20px 6px;text-align:center}
      .o-th{display:flex;gap:10px;align-items:center}.o-th .o-bk{height:32px;padding:0 8px}.o-sub{font-size:12.5px;color:var(--muted)}
      .o-bub{background:#1c2433;border-radius:12px 12px 12px 4px;padding:8px 11px;font-size:14.5px;margin-top:6px;max-width:92%}
      .o-mailb{background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:10px;font-size:14.5px;margin-top:6px;line-height:1.45}
      .o-q{font-size:13px;font-weight:700;color:var(--yellow);margin-top:8px}.o-opt{text-align:left;height:auto!important;padding:9px 11px!important;font-size:14px!important;line-height:1.35;white-space:normal}
      .o-satw{height:8px;background:#1c1f26;border-radius:4px;overflow:hidden;margin-top:4px}#o-sat{height:100%;transition:width .4s}
      #o-tools{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
      .o-tool{font-size:16px;padding:10px 14px}.o-tool b{font-size:22px;margin-right:4px}
    </style>
    <div id="o-wrap"><div id="o-grid"></div>
      <div id="o-inbox"></div>
      <div id="o-side"><div class="panel" id="o-mon"><h3>Monitorozás</h3><div id="o-av">100%</div><div style="font-size:12px;color:var(--muted)">rendelkezésre állás • <b id="o-t">60</b> mp</div><canvas id="o-hc"></canvas><div style="font-size:12px;color:var(--muted);margin-top:6px;display:flex;justify-content:space-between"><span>felhasználói elégedettség</span><b id="o-satv">80%</b></div><div class="o-satw"><div id="o-sat"></div></div></div><div id="o-log"></div></div>
      <div id="o-tools">${TOOLS.map((t, i) => `<button class="btn o-tool" data-t="${t[0]}">${icon(t[1], 20)}${t[2]} <small style="color:var(--muted)">[${i + 1}]</small></button>`).join('')}</div></div>
    <div class="big-overlay" id="o-over"></div>`;
    hcv = $('#o-hc'); reset(); render(); renderInbox(); renderSat();
    $$('.o-tool', root).forEach(b => b.onclick = () => { G.tool = G.tool === b.dataset.t ? null : b.dataset.t; sfx.click(); tryFix() });
    addEventListener('keydown', e => { if (App.cur !== S || !G.on) return; const k = +e.key; if (k >= 1 && k <= 6) { G.tool = TOOLS[k - 1][0]; tryFix() } });
  };
  S.enter = intro;
  S.comp = { rules: '90 másodperces műszak: hárítsd el a szerverhibákat, és válaszolj helyesen az e-mailekre, chatekre és hívásokra, mielőtt lejár az idő! Pont jár a rendelkezésre állásért, a megoldott kérésekért és az elégedettségért.', start: () => start() };
  S.score = () => best;
  let acc = 0;
  S.tick = dt => {
    if (!G.on) return;
    G.t -= dt; G.spawn -= dt; acc += dt;
    const healthy = srv.filter(s => !s.p).length; G.up += healthy * dt; G.tot += srv.length * dt;
    if (G.spawn <= 0) { spawn(); G.spawn = Math.max(2.4, 4.6 - (DUR - G.t) * .03) }
    G.tkT -= dt; if (G.tkT <= 0) { newTicket(); G.tkT = rnd(6, 9) }
    G.tk.forEach(t => { if (t.done) return; t.left -= dt; if (t.left <= 0) { t.done = true; G.sat = Math.max(0, G.sat - 15); G.tpts -= 30; if (G.open === t.id) G.open = null; log(`LEJÁRT  ${t.d[1]}: nem kapott választ`, 'err'); toast(`${t.d[1]} nem kapott választ időben!`, '#f87171', 2000); renderInbox(); renderSat() } });
    if (acc > .5) {
      acc = 0;
      srv.forEach(s => { if (s.p !== 'cpu') s.cpu = clamp(s.cpu + rnd(-8, 8), 8, 80); s.ram = clamp(s.ram + rnd(-4, 4), 20, 85); if (s.p !== 'disk') s.disk = clamp(s.disk + rnd(0, 1), 20, 90); if (s.p === 'down' || s.p === 'cable') s.cpu = 0 });
      G.hist.push(healthy / srv.length * 100); if (G.hist.length > 60) G.hist.shift();
      render(); drawChart(); if (!G.open) renderInbox();
    }
    const av = G.tot ? G.up / G.tot * 100 : 100;
    $('#o-av').textContent = av.toFixed(1).replace('.', ',') + '%'; $('#o-av').style.color = av > 90 ? 'var(--green)' : av > 75 ? 'var(--yellow)' : 'var(--red)';
    $('#o-t').textContent = Math.ceil(G.t);
    if (G.t <= 0) end();
  };
  return S;
})());
