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
  // szerszám: azonosító, ikon, név, mire jó, szín
  const TOOLS = [['scale', 'plus', 'Új konténer indítása', 'több példány osztja el a terhelést', '#5b9dff'], ['restart', 'refresh', 'Szolgáltatás újraindítása', 'leállt program újra elindul', '#a78bfa'], ['clean', 'trash', 'Naplófájlok törlése', 'hely szabadul fel a lemezen', '#facc15'],
  ['av', 'shield', 'Vírusirtó futtatása', 'kártevő eltávolítása', '#4ade80'], ['backup', 'save', 'Visszaállítás mentésből', 'az adatok visszaállítása', '#22d3ee'], ['cable', 'plug', 'Kábel ellenőrzése', 'fizikai kapcsolat ellenőrzése', '#fb923c']];
  const PIC = { cpu: 'flame', down: 'siren', disk: 'layers', virus: 'bug', ransom: 'lock', cable: 'plug' };
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
  const CH = { mail: ['mail', 'E-mail', 55], chat: ['user', 'Chat', 45], call: ['phone', 'Hívás', 30] };
  function newTicket() {
    if (G.tk.filter(t => !t.done).length >= (window.EASY ? 2 : 3)) return;
    const used = new Set(G.tk.map(t => t.d)), pool = TK.filter(t => !used.has(t)); const d = pick(pool.length ? pool : TK);
    const sl = CH[d[0]][2] * (window.EASY ? 1.5 : 1), t = { id: ++G.tid, d, ch: d[0], sla: sl, left: sl, done: false };
    t.opts = [...d[4]].sort(() => Math.random() - .5); if (window.EASY) t.opts = [t.opts.find(o => o[1]), t.opts.find(o => !o[1])].sort(() => Math.random() - .5); G.tk.unshift(t);
    if (t.ch === 'call') [0, .3, 1.1, 1.4].forEach(x => beep(950, .15, 'sine', .05, 0, x)); else beep(1300, .08, 'triangle', .05);
    log(`${CH[t.ch][1].toUpperCase().padEnd(7)} ${d[1]}: ${d[2]}`); renderInbox();
  }
  function renderInbox() {
    const el = $('#o-inbox'); if (!el) return; const op = G.tk.find(t => t.id === G.open && !t.done);
    if (op) {
      const d = op.d, body = op.ch === 'call' ? d[3].split('|').map(x => `<div class="o-bub">${x}</div>`).join('') : `<div class="o-mailb">${d[3]}</div>`;
      el.innerHTML = `<div class="o-th"><button class="btn o-bk">${icon('back', 14, 2)}</button><span class="o-chi ${op.ch}">${icon(CH[op.ch][0], 16)}</span><div><b>${d[1]}</b><div class="o-sub">${CH[op.ch][1]} • ${d[2]}</div></div></div>${body}
        <div class="o-q">Mit teszel?</div>${op.opts.map((o, i) => `<button class="btn o-opt" data-o="${i}">${o[0]}</button>`).join('')}`;
      el.dataset.k = ''; $('.o-bk').onclick = () => { G.open = null; renderInbox() };
      $$('.o-opt').forEach(b => b.onclick = () => answer(op, op.opts[+b.dataset.o]));
      return;
    }
    const open = G.tk.filter(t => !t.done), ik = open.map(t => t.id + (t.left < 6 ? 'u' : '')).join(',');
    if (el.dataset.k === ik && el.querySelector('.o-ih')) { open.forEach(t => { const em = el.querySelector(`.o-tk[data-t="${t.id}"] em`); if (em) em.style.width = t.left / t.sla * 100 + '%' }); return }
    el.dataset.k = ik;
    el.innerHTML = `<div class="o-ih">Beérkező kérések <span>${open.length}</span></div>` + (open.map(t => `<div class="o-tk ${t.ch} ${t.left < 6 ? 'urg' : ''}" data-t="${t.id}"><span class="o-chi ${t.ch}">${icon(CH[t.ch][0], 16)}</span><div class="o-tx"><b>${t.d[1]}</b><span>${t.d[2]}</span><i><em style="width:${t.left / t.sla * 100}%"></em></i></div></div>`).join('') || '<div class="o-empty">Nincs nyitott kérés. Figyeld a szervereket!</div>');
    $$('.o-tk').forEach(e => e.onpointerdown = () => { G.open = +e.dataset.t; sfx.click(); renderInbox() });
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
  let rKey = '';
  function render() {
    const key = srv.map(s => s.p + ':' + s.cont).join('|') + '#' + G.sel + '#' + !!window.EASY, grid = $('#o-grid');
    if (key === rKey && grid.children.length) {
      [...grid.children].forEach((e, i) => { const s = srv[i], v3 = [s.cpu, s.ram, s.disk]; e.querySelectorAll('.o-b i').forEach((b, k) => { const v = v3[k]; b.style.width = v + '%'; b.style.background = v > 85 ? 'var(--red)' : v > 65 ? 'var(--yellow)' : 'var(--green)' }); e.querySelectorAll('.o-m > span:last-child').forEach((sp, k) => sp.textContent = Math.round(v3[k]) + '%') });
      return;
    }
    rKey = key;
    grid.innerHTML = srv.map((s, i) => `<div class="o-srv ${s.p ? 'bad' : ''} ${G.sel === i ? 'sel' : ''}" data-i="${i}">
      <div class="o-h"><span class="o-ic"><img alt="" src="${Dev.img('rack', 36)}" style="width:36px"></span><div><b>${s.n}</b><div class="o-os">${s.os} • <span class="o-c">${'▣'.repeat(s.cont)} ${s.cont} konténer</span></div></div><span class="o-led"></span></div>
      <div class="o-ms">${[['CPU', s.cpu], ['RAM', s.ram], ['Lemez', s.disk]].map(([k, v]) => `<div class="o-m"><span>${k}</span><div class="o-b"><i style="width:${v}%;background:${v > 85 ? 'var(--red)' : v > 65 ? 'var(--yellow)' : 'var(--green)'}"></i></div><span>${Math.round(v)}%</span></div>`).join('')}</div>
      ${s.p ? `<div class="o-p">${icon(PIC[s.p], 22, 2.2)}<span>${PROB[s.p].t}</span></div><div class="o-drop">${window.EASY ? `Ide húzd: <b>${TOOLS.find(x => x[0] === PROB[s.p].fix)[2]}</b>` : `${icon('hand', 16, 2)} Húzd ide a megfelelő szerszámot!`}</div>` : `<div class="o-ok">${icon('check', 18, 2.6)} Minden rendben</div>`}</div>`).join('');
    $$('.o-srv').forEach(e => e.onpointerdown = () => { G.sel = +e.dataset.i; sfx.click(); tryFix() });
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
    const ok = srv.map((s, i) => i).filter(i => !srv[i].p); if (!ok.length || srv.filter(s => s.p).length >= (window.EASY ? 1 : 2)) return;
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
  function proIntro() {
    if (G.on) return; const o = $('#o-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card"><h2>Rendszergazda-ügyelet</h2>
      <p>Te felelsz az iskola 6 szerveréért! Ha valamelyik <b style="color:var(--red)">pirosan villog</b>, olvasd el a hibát, és <b>húzd rá a megfelelő szerszámot</b> a lenti szerszámosládából (vagy kattints a szerszámra, majd a szerverre).<br>Közben <b>e-mailek, chatek és telefonhívások</b> is jönnek a kollégáktól: nyisd meg őket jobbra, és válaszd a helyes megoldást, mielőtt lejár az idő!<br>Cél: magas <b>rendelkezésre állás</b> és <b>elégedett felhasználók</b> 90 másodpercen át.</p>
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
      <div style="margin-top:14px"><button class="btn go" id="o-again">ÚJ MŰSZAK ▶</button> <button class="btn" id="o-mode">Másik mód</button></div></div>`;
    $('#o-again').onclick = start; $('#o-mode').onclick = () => intro();
  }
  /* ---------- Szervermentő: egyszerű, színpárosítós mód kisiskolásoknak ---------- */
  const KP = {
    hot: { n: 'Túl meleg!', ic: 'thermo', c: '#fb923c', tool: 'fan' },
    virus: { n: 'Vírus!', ic: 'bug', c: '#4ade80', tool: 'shield' },
    cable: { n: 'Kihúzták a kábelt!', ic: 'plug', c: '#60a5fa', tool: 'plug' },
    full: { n: 'Megtelt!', ic: 'layers', c: '#facc15', tool: 'trash' },
    sleep: { n: 'Lefagyott!', ic: 'moon', c: '#c084fc', tool: 'refresh' }
  };
  const KT = [['fan', 'Hűtés', '#fb923c', 'hot'], ['shield', 'Vírusirtó', '#4ade80', 'virus'], ['plug', 'Kábel be', '#60a5fa', 'cable'], ['trash', 'Takarítás', '#facc15', 'full'], ['refresh', 'Újraindítás', '#c084fc', 'sleep']];
  const KNAMES = ['Weboldal', 'E-mail', 'Játékok', 'Fájlok'];
  const KDUR = 60;
  const K = { on: false, t: KDUR, sv: [], fly: [], pop: [], tool: null, sel: null, drag: null, hover: -1, fixes: 0, miss: 0, pts: 0, spawn: 1.5, time: 0, lastK: null, shownT: -1 };
  let kcv, kc, kW = 0, kH = 0, mode = null, kBest = 0;
  const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2, back = t => { const c = 1.7; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2 };
  function kReset() { K.sv = KNAMES.map((n, i) => ({ i, n, p: null, left: 0, max: 1, bounce: 0, crash: 0, fx: null, fxT: 0, shake: 0, appear: 0, x: 0, y: 0, w: 0, h: 0 })) }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath() }
  function kSpawn() {
    const el = KDUR - K.t, busy = K.sv.filter(s => s.p).length, maxP = el < 18 ? 1 : (el < 40 || window.EASY) ? 2 : 3;
    const free = K.sv.filter(s => !s.p && s.crash <= 0 && s.fxT <= 0 && !K.fly.some(f => f.s === s));
    if (!free.length || busy >= maxP) return;
    const keys = Object.keys(KP); let k = pick(keys); if (k === K.lastK) k = pick(keys.filter(x => x !== k)); K.lastK = k;
    const s = pick(free), tm = (window.EASY ? 20 : 16) - Math.min(5, el * .08);
    Object.assign(s, { p: k, left: tm, max: tm, appear: 0 }); beep(520, .1, 'triangle', .05); beep(780, .12, 'triangle', .05, 0, .1);
  }
  function kToolEl(tool) { return $(`.k-tool[data-k="${tool}"]`) }
  function kToolPos(tool) { const b = kToolEl(tool).getBoundingClientRect(), r = kcv.getBoundingClientRect(); return [b.left + b.width / 2 - r.left, b.top + b.height / 2 - r.top] }
  function kTools() {
    $$('.k-tool').forEach(b => b.classList.toggle('sel', b.dataset.k === K.tool));
    $('#k-msg').innerHTML = K.tool ? `Most kattints arra a szerverre, amelyiknek a <b>${KT.find(t => t[0] === K.tool)[1].toLowerCase()}</b> kell!` : K.sel !== null && K.sv[K.sel].p ? `Melyik szerszám segít? Keresd az <b style="color:${KP[K.sv[K.sel].p].c}">ugyanilyen színűt</b>!` : 'Húzd a <b>buborékkal egyező színű</b> szerszámot a bajban lévő szerverre!';
  }
  function kApply(tool, s, x0, y0, t0 = 0) {
    K.tool = null; K.sel = null; kTools();
    if (!s.p) { K.pop.push({ x: s.x + s.w / 2, y: s.y - 10, t: 0, txt: 'Itt nincs baj', c: '#94a3b8' }); return }
    K.fly.push({ tool, x0, y0, s, t: t0, ok: KP[s.p].tool === tool }); beep(600, .08, 'sine', .04, 400);
  }
  function kBurst(s, cols) { const r = kcv.getBoundingClientRect(); if (!window.LOWFX) FX.burst(r.left + s.x + s.w / 2, r.top + s.y + s.h * .3, 26, cols, 7) }
  function kLand(f) {
    const s = f.s; if (!s.p) return;
    if (f.ok) {
      const bonus = Math.round(s.left / s.max * 50); K.pts += 100 + bonus; K.fixes++;
      s.fx = f.tool; s.fxT = 1; s.p = null; s.bounce = 1; sfx.ok(); beep(1320, .1, 'triangle', .05, 0, .08);
      K.pop.push({ x: s.x + s.w / 2, y: s.y - 20, t: 0, txt: `+${100 + bonus}`, c: '#4ade80' }); kBurst(s, ['#4ade80', '#a7f3d0', '#fde047', '#60a5fa']);
      if (K.spawn > 1.4) K.spawn = 1.4;
    } else {
      s.shake = .6; sfx.bad(); K.pts = Math.max(0, K.pts - 10);
      K.pop.push({ x: s.x + s.w / 2, y: s.y - 20, t: 0, txt: 'Nem ez kell!', c: '#f87171' });
      const b = kToolEl(KP[s.p].tool); b.classList.remove('k-hl'); void b.offsetWidth; b.classList.add('k-hl');
    }
  }
  function kHit(x, y) { return K.sv.findIndex(s => x >= s.x - 10 && x <= s.x + s.w + 10 && y >= s.y - s.w * .75 && y <= s.y + s.h + 10) }
  function kIntro() {
    const o = $('#o-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card" style="max-width:780px"><h2>Szervermentő</h2>
      <p style="font-size:18px">Az iskola szerverei néha bajba kerülnek! Ha egy szerver fölött <b>buborék</b> jelenik meg, húzd rá az <b>ugyanolyan színű szerszámot</b>, mielőtt a kör bezárul.</p>
      <div class="k-leg">${KT.map(t => `<div style="--c:${t[2]}"><span>${icon(KP[t[3]].ic, 30)}</span><b>${KP[t[3]].n}</b><i>${icon('play', 16)}</i><span class="tl">${icon(t[0], 30)}</span><b>${t[1]}</b></div>`).join('')}</div>
      <button class="btn go" id="k-start" style="font-size:26px;margin-top:16px">INDULÁS ▶</button>
      <div style="margin-top:12px"><button class="btn" id="k-back">Vissza a módválasztáshoz</button></div></div>`;
    $('#k-start').onclick = kStart; $('#k-back').onclick = () => { mode = null; intro() };
  }
  function kStart() {
    setMode('kid'); kReset(); Object.assign(K, { on: true, t: KDUR, fly: [], pop: [], tool: null, sel: null, drag: null, fixes: 0, miss: 0, pts: 0, spawn: 1.2, shownT: -1 });
    $('#o-over').style.display = 'none'; kTools(); kHud();
  }
  function kHud() { $('#k-time').textContent = Math.max(0, Math.ceil(K.t)); $('#k-pts').textContent = K.pts; $('#k-fix').textContent = K.fixes; $('#k-tbar').style.transform = `scaleX(${Math.max(0, K.t / KDUR)})` }
  function kEnd() {
    K.on = false; K.sv.forEach(s => s.p = null); kBest = Math.max(kBest, K.pts); best = Math.max(best, K.pts);
    const stars = K.fixes >= 14 ? 3 : K.fixes >= 8 ? 2 : K.fixes >= 3 ? 1 : 0;
    if (Comp.racing) { Comp.finish(K.pts, `${K.fixes} megjavított szerver · ${K.miss} leállás`); intro(); return }
    if (stars >= 2) { sfx.win(); FX.confetti() } else sfx.ok();
    const o = $('#o-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card"><h2>${['Próbáld újra!', 'Ügyes vagy!', 'Szuper szervermentő!', 'Igazi rendszergazda!'][stars]}</h2>
      <div class="k-stars">${[0, 1, 2].map(k => `<span class="${k < stars ? 'on' : ''}" style="animation-delay:${k * .2}s">${icon('star', 54, 2)}</span>`).join('')}</div>
      <p style="font-size:18px"><b>${K.fixes}</b> szervert mentettél meg • <b>${K.pts} pont</b>${K.miss ? ` • ${K.miss} leállás` : ''}</p>
      <div class="learn"><b>Ezt csinálja egy rendszergazda:</b> figyeli a szervereket, és ha baj van, gyorsan segít: <b>hűti</b> a gépeket, <b>vírusirtót</b> futtat, <b>bedugja</b> a kábeleket, <b>helyet csinál</b> a tárhelyen, és ha kell, <b>újraindítja</b> a szolgáltatást. Így működik a weboldal, az e-mail és a játékszerver is!</div>
      <div style="margin-top:14px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn go" id="k-again">ÚJRA ▶</button><button class="btn" id="k-pro">Kipróbálom a profi ügyeletet</button></div></div>`;
    $('#k-again').onclick = kStart; $('#k-pro').onclick = () => { setMode('pro'); proIntro() };
  }
  function kTick(dt) {
    dt = Math.min(dt, .05); K.time += dt;
    if (K.on) {
      K.t -= dt; K.spawn -= dt;
      if (K.spawn <= 0) { kSpawn(); K.spawn = window.EASY ? rnd(3.5, 5) : rnd(2.4, 3.8) }
      K.sv.forEach(s => {
        if (!s.p) return; s.left -= dt;
        if (s.left <= 0) { s.p = null; s.crash = 2.2; K.miss++; sfx.bad(); K.pop.push({ x: s.x + s.w / 2, y: s.y - 20, t: 0, txt: 'Leállt!', c: '#f87171' }); if (K.sel === s.i) { K.sel = null; kTools() } }
      });
      if (Math.ceil(K.t) !== K.shownT) { K.shownT = Math.ceil(K.t); if (K.t <= 5 && K.t > 0) beep(990, .05, 'sine', .04) }
      kHud(); if (K.t <= 0) kEnd();
    }
    K.sv.forEach(s => { s.appear = Math.min(1, s.appear + dt * 2.6); s.bounce = Math.max(0, s.bounce - dt * 1.5); s.fxT = Math.max(0, s.fxT - dt * .9); s.crash = Math.max(0, s.crash - dt); s.shake = Math.max(0, s.shake - dt) });
    K.fly.forEach(f => f.t += dt / .42); K.fly.filter(f => f.t >= 1).forEach(kLand); K.fly = K.fly.filter(f => f.t < 1);
    K.pop.forEach(p => p.t += dt); K.pop = K.pop.filter(p => p.t < 1.3);
    kDraw();
  }
  function badge(c, tool, x, y, r) {
    const T = KT.find(t => t[0] === tool); c.save(); c.shadowColor = T[2]; c.shadowBlur = 20;
    c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = T[2]; c.fill(); c.shadowBlur = 0; c.lineWidth = 3; c.strokeStyle = '#fff'; c.stroke();
    drawIcon(c, tool, x, y, r * 1.15, '#111827', 2.4); c.restore();
  }
  function face(c, cx, cy, sz, mood, col, t, i) {
    c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = Math.max(3, sz * .07); c.lineCap = 'round';
    const ex = sz * .26, ey = cy - sz * .1, er = sz * .09;
    if (mood === 'dizzy') { [-1, 1].forEach(d => { const x = cx + d * ex; c.beginPath(); c.moveTo(x - er, ey - er); c.lineTo(x + er, ey + er); c.moveTo(x + er, ey - er); c.lineTo(x - er, ey + er); c.stroke() }); c.beginPath(); c.moveTo(cx - sz * .2, cy + sz * .22); for (let k = 0; k <= 8; k++) c.lineTo(cx - sz * .2 + k * sz * .05, cy + sz * .22 + (k % 2 ? -1 : 1) * sz * .04); c.stroke() }
    else if (mood === 'sleep') { [-1, 1].forEach(d => { c.beginPath(); c.arc(cx + d * ex, ey, er, .15 * Math.PI, .85 * Math.PI); c.stroke() }); c.beginPath(); c.arc(cx, cy + sz * .24, sz * .06, 0, 7); c.stroke() }
    else if (mood === 'worry') { [-1, 1].forEach(d => { c.beginPath(); c.arc(cx + d * ex, ey, er * 1.15, 0, 7); c.fill(); c.beginPath(); c.moveTo(cx + d * ex - er * 1.3 * d, ey - er * 2.4); c.lineTo(cx + d * ex + er * 1.1 * d, ey - er * 1.7); c.stroke() }); c.beginPath(); c.ellipse(cx, cy + sz * .25, sz * .1, sz * .08 + Math.sin(t * 9) * sz * .015, 0, 0, 7); c.stroke() }
    else if (mood === 'joy') { [-1, 1].forEach(d => { c.beginPath(); c.arc(cx + d * ex, ey + er * .5, er * 1.2, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke() }); c.beginPath(); c.arc(cx, cy + sz * .08, sz * .2, .1 * Math.PI, .9 * Math.PI); c.closePath(); c.fill() }
    else { const bl = ((t + i * .9) % 3.6) < .13 ? .15 : 1; [-1, 1].forEach(d => { c.beginPath(); c.ellipse(cx + d * ex, ey, er, er * bl, 0, 0, 7); c.fill() }); c.beginPath(); c.arc(cx, cy + sz * .06, sz * .18, .2 * Math.PI, .8 * Math.PI); c.stroke() }
    c.restore();
  }
  function drawServer(c, s) {
    const t = K.time, P = s.p && KP[s.p];
    const dy = s.bounce > 0 ? -Math.sin((1 - s.bounce) * Math.PI) * 26 * s.bounce : 0, sx = s.shake > 0 ? Math.sin(t * 55) * 7 * s.shake : 0;
    const x = s.x + sx, y = s.y + dy, w = s.w, h = s.h, hov = K.hover === s.i || K.sel === s.i;
    c.save();
    c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(s.x + w / 2, s.y + h + 4, w * .62 * (1 + dy / 200), 10, 0, 0, 7); c.fill();
    if (P) { c.shadowColor = P.c; c.shadowBlur = 22 + 14 * Math.sin(t * 5) } else if (hov) { c.shadowColor = '#fff'; c.shadowBlur = 20 }
    const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#2a303d'); g.addColorStop(.5, '#3b4354'); g.addColorStop(1, '#222733');
    rr(c, x, y, w, h, 14); c.fillStyle = g; c.fill(); c.shadowBlur = 0;
    c.lineWidth = P || hov ? 3 : 2; c.strokeStyle = P ? P.c : hov ? '#fde047' : '#4b5563'; c.stroke();
    if (s.p === 'hot') { c.fillStyle = `rgba(249,115,22,${.14 + .08 * Math.sin(t * 6)})`; rr(c, x, y, w, h, 14); c.fill() }
    if (s.p === 'sleep') { c.fillStyle = 'rgba(147,197,253,.16)'; rr(c, x, y, w, h, 14); c.fill() }
    // kijelző arccal
    const fx = x + w * .12, fy = y + h * .08, fw = w * .76, fh = h * .34;
    rr(c, fx, fy, fw, fh, 10); c.fillStyle = s.crash > 0 ? '#0b0c10' : P ? '#1c1117' : '#062a1b'; c.fill(); c.strokeStyle = '#11151c'; c.lineWidth = 3; c.stroke();
    const mood = s.crash > 0 ? 'dizzy' : s.p === 'sleep' ? 'sleep' : P ? 'worry' : s.fxT > 0 ? 'joy' : 'ok';
    face(c, fx + fw / 2, fy + fh / 2, fh, mood, s.crash > 0 ? '#64748b' : P ? P.c : '#4ade80', t, s.i);
    // meghajtók és LED-ek
    for (let k = 0; k < 4; k++) {
      const by = y + h * .5 + k * h * .11; rr(c, x + w * .12, by, w * .76, h * .075, 4); c.fillStyle = '#1a1e27'; c.fill();
      const on = s.crash > 0 ? false : P ? Math.sin(t * 10 + k) > 0 : Math.sin(t * (3 + k * 1.7) + s.i * 2) > -.3;
      c.fillStyle = on ? (P ? '#f87171' : '#4ade80') : '#2b313d'; c.beginPath(); c.arc(x + w * .8, by + h * .0375, Math.max(3, w * .025), 0, 7); c.fill();
      c.fillStyle = '#2b313d'; for (let q = 0; q < 5; q++) c.fillRect(x + w * .18 + q * w * .08, by + h * .02, w * .04, h * .035);
    }
    c.fillStyle = '#e2e8f0'; c.font = `800 ${Math.round(Math.max(14, w * .11))}px Inter,system-ui,sans-serif`; c.textAlign = 'center'; c.fillText(s.n, s.x + w / 2, s.y + h + 30);
    // a hibák látványa
    if (s.p === 'hot') for (let k = 0; k < 3; k++) { c.strokeStyle = `rgba(251,146,60,${.7 - ((t * .8 + k / 3) % 1) * .7})`; c.lineWidth = 3; c.beginPath(); const bx = x + w * (.3 + k * .2), ph = (t * .8 + k / 3) % 1; for (let q = 0; q <= 12; q++) { const yy = y - 6 - ph * 40 - q * 3; c.lineTo(bx + Math.sin(q * .9 + t * 6) * 5, yy) } c.stroke() }
    if (s.p === 'virus') for (let k = 0; k < 3; k++) { const a = t * 1.3 + k * 2.1; drawIcon(c, 'bug', x + w / 2 + Math.cos(a) * w * .42, y + h * .58 + Math.sin(a * 1.3) * h * .3, 22, '#4ade80', 2.2) }
    if (s.p === 'cable') { const sw = Math.sin(t * 2.5) * 12; c.strokeStyle = '#60a5fa'; c.lineWidth = 5; c.beginPath(); c.moveTo(x + w, y + h * .55); c.bezierCurveTo(x + w + 30, y + h * .6, x + w + 22 + sw, y + h * .95, x + w + 26 + sw, y + h - 6); c.stroke(); drawIcon(c, 'plug', x + w + 26 + sw, y + h - 14, 22, '#93c5fd', 2.4) }
    if (s.p === 'full') for (let k = 0; k < 3; k++) { const wob = Math.sin(t * 4 + k) * 4; c.save(); c.translate(x + w * (.25 + k * .25), y - 14 - (k === 1 ? 20 : 0)); c.rotate(wob * .03); c.fillStyle = '#facc15'; c.fillRect(-15, -12, 30, 24); c.strokeStyle = '#a16207'; c.lineWidth = 2; c.strokeRect(-15, -12, 30, 24); c.beginPath(); c.moveTo(-15, -3); c.lineTo(15, -3); c.stroke(); c.restore() }
    if (s.p === 'sleep') for (let k = 0; k < 3; k++) { const ph = (t * .5 + k / 3) % 1; c.globalAlpha = 1 - ph; c.fillStyle = '#c4b5fd'; c.font = `900 ${16 + ph * 14}px Inter,sans-serif`; c.fillText('Z', x + w * .75 + ph * 24, y + h * .1 - ph * 46); c.globalAlpha = 1 }
    // javítás animációja
    if (s.fxT > 0) {
      const p = 1 - s.fxT, cx = x + w / 2, cy = y + h * .45, T = KT.find(q => q[0] === s.fx);
      c.globalAlpha = Math.min(1, s.fxT * 2.5);
      c.strokeStyle = T[2]; c.lineWidth = 5; c.beginPath(); c.arc(cx, cy, w * .4 + p * w * .45, 0, 7); c.stroke();
      c.save(); c.translate(cx, cy);
      if (s.fx === 'fan' || s.fx === 'refresh') c.rotate(p * Math.PI * (s.fx === 'fan' ? 8 : 3));
      const sc = s.fx === 'shield' ? .8 + back(Math.min(1, p * 2.2)) * .5 : 1; c.scale(sc, sc);
      c.beginPath(); c.arc(0, 0, w * .3, 0, 7); c.fillStyle = '#0b0f19dd'; c.fill(); drawIcon(c, s.fx, 0, 0, w * .4, T[2], 2.6); c.restore();
      if (s.fx === 'fan') for (let k = 0; k < 5; k++) { const yy = y + h * (.2 + k * .15), xx = x - 20 - ((p * 2 + k * .2) % 1) * 50; c.strokeStyle = '#7dd3fc'; c.lineWidth = 3; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + 26, yy); c.stroke() }
      if (s.fx === 'trash') for (let k = 0; k < 3; k++) { c.fillStyle = '#facc15'; c.fillRect(x + w * (.25 + k * .25) - 12 + (k - 1) * p * 90, y - 14 - p * 140 + p * p * 60, 24, 20) }
      c.globalAlpha = 1;
    }
    // buborék a hibával és a visszaszámláló körrel
    if (P) {
      const a = back(s.appear), r = w * .27 * a, cx = s.x + w / 2, f = s.left / s.max, urgent = f < .3, cy = s.y - r - 26 + Math.sin(t * 3 + s.i) * 4 + (urgent ? Math.sin(t * 20) * 2 : 0);
      c.save(); c.globalAlpha = Math.min(1, s.appear * 2);
      c.beginPath(); c.moveTo(cx - 10, cy + r - 3); c.lineTo(cx, cy + r + 14); c.lineTo(cx + 10, cy + r - 3); c.fillStyle = '#0f172a'; c.fill();
      c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fillStyle = '#0f172a'; c.shadowColor = P.c; c.shadowBlur = 18; c.fill(); c.shadowBlur = 0;
      c.lineWidth = 7; c.strokeStyle = '#ffffff1a'; c.beginPath(); c.arc(cx, cy, r - 2, 0, 7); c.stroke();
      c.strokeStyle = urgent ? '#f87171' : P.c; c.lineCap = 'round'; c.beginPath(); c.arc(cx, cy, r - 2, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); c.stroke();
      drawIcon(c, P.ic, cx, cy, r * 1.05, P.c, 2.6);
      c.font = `800 ${Math.round(Math.max(14, w * .1))}px Inter,system-ui,sans-serif`; const tw = c.measureText(P.n).width + 20, ty = cy - r - 22;
      rr(c, cx - tw / 2, ty - 15, tw, 28, 14); c.fillStyle = P.c; c.fill(); c.fillStyle = '#111827'; c.textAlign = 'center'; c.fillText(P.n, cx, ty + 5);
      c.restore();
    }
    c.restore();
  }
  function kDraw() {
    if (!kcv) return; const w = kcv.clientWidth, h = kcv.clientHeight; if (!w || !h) return;
    const dpr = Math.min(window.LOWFX ? 1 : 2, devicePixelRatio || 1);
    if (kcv.width !== Math.round(w * dpr) || kcv.height !== Math.round(h * dpr)) { kcv.width = Math.round(w * dpr); kcv.height = Math.round(h * dpr) }
    kW = w; kH = h; const c = kc; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const floorY = h - 56;
    let g = c.createLinearGradient(0, 0, 0, floorY); g.addColorStop(0, '#0b1020'); g.addColorStop(1, '#1b1f3a'); c.fillStyle = g; c.fillRect(0, 0, w, floorY);
    g = c.createLinearGradient(0, floorY, 0, h); g.addColorStop(0, '#191c2c'); g.addColorStop(1, '#0a0b10'); c.fillStyle = g; c.fillRect(0, floorY, w, h - floorY);
    c.strokeStyle = '#ffffff0d'; c.lineWidth = 1; for (let k = -12; k <= 12; k++) { c.beginPath(); c.moveTo(w / 2 + k * 70, floorY); c.lineTo(w / 2 + k * 200, h); c.stroke() }
    c.strokeStyle = '#ffffff08'; for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(0, 30 + k * 40); c.lineTo(w, 30 + k * 40); c.stroke() }
    const n = 4, sw = Math.max(90, Math.min(175, (w - 40) / n - 50)), sh = Math.min(sw * 1.5, (floorY - 40) * .6), gap = (w - n * sw) / (n + 1);
    K.sv.forEach((s, i) => { s.w = sw; s.h = sh; s.x = gap + i * (sw + gap); s.y = floorY - sh; drawServer(c, s) });
    K.fly.forEach(f => { const e = ease(f.t), tx = f.s.x + f.s.w / 2, ty = f.s.y + f.s.h * .4; badge(c, f.tool, f.x0 + (tx - f.x0) * e, f.y0 + (ty - f.y0) * e - Math.sin(Math.PI * f.t) * 90, 30 + 8 * Math.sin(Math.PI * f.t)) });
    if (K.drag && K.drag.moved) badge(c, K.drag.tool, K.drag.x, K.drag.y, 34);
    K.pop.forEach(p => { c.globalAlpha = Math.max(0, 1 - Math.max(0, p.t - .7) / .6); c.font = '900 26px Inter,system-ui,sans-serif'; c.textAlign = 'center'; c.lineWidth = 5; c.strokeStyle = '#0b0c10'; const yy = p.y - ease(Math.min(1, p.t)) * 50; c.strokeText(p.txt, p.x, yy); c.fillStyle = p.c; c.fillText(p.txt, p.x, yy); c.globalAlpha = 1 });
  }
  function kPos(e) { const r = kcv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
  function kBind() {
    kc = kcv.getContext('2d');
    kcv.onpointermove = e => { if (K.drag) return; const [x, y] = kPos(e); K.hover = kHit(x, y); kcv.style.cursor = K.hover >= 0 ? 'pointer' : '' };
    kcv.onpointerleave = () => { if (!K.drag) K.hover = -1 };
    kcv.onpointerdown = e => {
      if (!K.on) return; const [x, y] = kPos(e), i = kHit(x, y); if (i < 0) return; const s = K.sv[i];
      if (K.tool) { const [bx, by] = kToolPos(K.tool); kApply(K.tool, s, bx, by) } else if (s.p) { K.sel = i; sfx.click(); kTools() }
    };
    $$('.k-tool').forEach(b => b.onpointerdown = e => {
      if (!K.on) return; e.preventDefault(); const tool = b.dataset.k, [x0, y0] = kPos(e); K.drag = { tool, x: x0, y: y0, x0, y0, moved: false };
      const mv = ev => { const [x, y] = kPos(ev); K.drag.x = x; K.drag.y = y; if (Math.hypot(x - x0, y - y0) > 8) K.drag.moved = true; K.hover = K.drag.moved ? kHit(x, y) : -1 };
      const up = ev => {
        removeEventListener('pointermove', mv); removeEventListener('pointerup', up); const d = K.drag; K.drag = null; K.hover = -1; if (!d) return;
        if (d.moved) { const i = kHit(d.x, d.y); if (i >= 0) kApply(tool, K.sv[i], d.x, d.y, .45); return }
        sfx.click(); if (K.sel !== null) { const [bx, by] = kToolPos(tool); kApply(tool, K.sv[K.sel], bx, by) } else { K.tool = K.tool === tool ? null : tool; kTools() }
      };
      addEventListener('pointermove', mv); addEventListener('pointerup', up);
    });
  }
  function setMode(m) { mode = m; $('#o-wrap').style.display = m === 'kid' ? 'none' : ''; $('#k-wrap').style.display = m === 'kid' ? '' : 'none'; if (m === 'kid') requestAnimationFrame(kDraw) }
  function intro() {
    if (G.on || K.on) return; const o = $('#o-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card" style="max-width:820px"><h2>Rendszergazda-ügyelet</h2><p>Válassz játékmódot!</p>
      <div class="k-modes">
        <button class="k-mode ${window.EASY ? 'rec' : ''}" id="k-m-kid" style="--c:#4ade80">${window.EASY ? '<em>Ajánlott</em>' : ''}<span>${icon('heart', 40)}</span><b>Szervermentő</b><small>Egyszerű, színpárosítós játék kisebbeknek: húzd a jó szerszámot a bajban lévő szerverre! 60 másodperc.</small></button>
        <button class="k-mode ${window.EASY ? '' : 'rec'}" id="k-m-pro" style="--c:#fb7185">${window.EASY ? '' : '<em>Ajánlott</em>'}<span>${icon('activity', 40)}</span><b>Profi ügyelet</b><small>Hat szerver valódi mérőszámokkal, közben e-mailek, chatek és hívások. 90 másodperc.</small></button>
      </div></div>`;
    $('#k-m-kid').onclick = () => { sfx.click(); setMode('kid'); kIntro() };
    $('#k-m-pro').onclick = () => { sfx.click(); setMode('pro'); proIntro() };
  }
  S.build = root => {
    root.innerHTML = `<style>
      #o-wrap{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1fr) 330px;grid-template-rows:minmax(0,1fr) auto;gap:12px;padding:12px}
      #o-grid{grid-column:1;grid-row:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:minmax(0,1fr);gap:12px;min-height:0}
      @media (max-width:1100px){#o-wrap{grid-template-columns:minmax(0,1fr) 280px}#o-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:auto;overflow:auto}}
      .o-srv{position:relative;display:flex;flex-direction:column;gap:6px;background:#15171c;border:2px solid var(--line);border-radius:16px;padding:10px 12px;cursor:pointer;transition:border-color .2s,box-shadow .2s,transform .15s;min-height:0;overflow:hidden}
      .o-srv:hover{border-color:var(--cyan)}.o-srv.sel{border-color:var(--yellow);box-shadow:0 0 20px #fbbf2466}
      .o-srv.bad{border-color:var(--red);background:#1f1218;animation:obad 1s infinite}
      @keyframes obad{50%{box-shadow:0 0 30px #f87171aa}}
      .o-h{display:flex;gap:10px;align-items:center}.o-h b{font-size:16px}.o-ic{display:grid;place-items:center}.o-os{font-size:12px;color:var(--muted)}
      .o-led{margin-left:auto;width:14px;height:14px;border-radius:50%;background:var(--green);box-shadow:0 0 10px var(--green);flex:none}.bad .o-led{background:var(--red);box-shadow:0 0 12px var(--red)}
      .o-ms{display:flex;flex-direction:column;gap:2px}
      .o-m{display:grid;grid-template-columns:44px 1fr 36px;gap:6px;align-items:center;font-size:12px}.o-m>span:last-child{text-align:right;font-variant-numeric:tabular-nums}.o-b{height:8px;background:#1c1f26;border-radius:5px;overflow:hidden}.o-b i{display:block;height:100%;transition:width .4s}
      .o-c{color:var(--cyan)}
      .o-ok{margin-top:auto;display:flex;gap:6px;align-items:center;font-weight:800;font-size:15px;color:var(--green)}
      .o-p{margin-top:auto;display:flex;gap:8px;align-items:center;font-weight:900;font-size:15.5px;line-height:1.2;color:#fff;background:#b91c1c;border-radius:10px;padding:7px 10px}.o-p svg{flex:none}
      .o-drop{display:flex;gap:6px;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fecaca;border:2px dashed #f87171;border-radius:10px;padding:6px 8px;text-align:center}.o-drop b{color:#fde68a}
      #o-side{grid-column:2;grid-row:1/3;display:flex;flex-direction:column;gap:10px;min-height:0}
      #o-mon{flex:none;padding:10px 12px}#o-mon h3{margin:0;font-size:14px;color:var(--cyan);display:flex;justify-content:space-between;align-items:baseline}#o-mon h3 span{font-size:12px;color:var(--muted);font-weight:600}#o-av{font-size:32px;font-weight:900;line-height:1.1}#o-hc{width:100%;height:56px;display:block}
      #o-log{flex:none;height:120px;overflow:auto;font-family:var(--mono);font-size:11.5px;line-height:1.45;background:#08090b;border-radius:12px;padding:8px;color:#a3a8b3}
      #o-log .err{color:#ff8080}#o-log .ok{color:#4ade80}
      #o-inbox{flex:1;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:10px;overflow:auto;min-height:0;display:flex;flex-direction:column;gap:6px}
      .o-ih{font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;display:flex;justify-content:space-between}.o-ih span{background:var(--red);color:#fff;border-radius:999px;padding:0 8px}
      .o-tk{display:flex;gap:10px;align-items:center;background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:9px;cursor:pointer}
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
      .o-hint{margin-top:6px;font-size:13px;color:#fde68a;background:rgba(250,204,21,.1);border:1px solid rgba(250,204,21,.35);border-radius:8px;padding:4px 8px}
      #o-tbox{grid-column:1;grid-row:2;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:8px 10px 10px}
      .o-tt{font-size:12.5px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin:0 4px 6px;display:flex;gap:8px;align-items:center}.o-tt b{color:var(--yellow);text-transform:none;letter-spacing:0;font-size:13.5px}
      #o-tools{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}@media (max-width:1100px){#o-tools{grid-template-columns:repeat(3,minmax(0,1fr))}}
      .o-tool{all:unset;box-sizing:border-box;position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center;padding:8px 6px;border-radius:14px;border:2px solid color-mix(in srgb,var(--c) 55%,transparent);background:color-mix(in srgb,var(--c) 12%,#14161b);color:var(--text);cursor:grab;touch-action:none;user-select:none;transition:transform .15s,box-shadow .15s}
      .o-tool:hover{transform:translateY(-3px);box-shadow:0 10px 24px -10px var(--c)}.o-tool.sel{border-color:var(--c);box-shadow:0 0 22px var(--c);transform:translateY(-4px)}
      .o-tool .o-ti{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--c);color:#0b0c10}.o-tool b{font-size:13.5px;line-height:1.2}.o-tool small{font-size:11.5px;color:var(--muted);line-height:1.25}
      .o-tool kbd{position:absolute;top:5px;right:7px;font:700 11px var(--mono);color:var(--muted)}
      .o-tool.drag{opacity:.35}
      .o-ghost{position:fixed;z-index:9999;pointer-events:none;width:150px;transform:translate(-50%,-50%) rotate(-4deg) scale(1.05);box-shadow:0 14px 34px #000c,0 0 0 3px var(--c);cursor:grabbing}
      body.o-dragging .o-srv{outline:2px dashed #ffffff33;outline-offset:-6px}body.o-dragging .o-srv.bad .o-drop{background:#7f1d1d;color:#fff;animation:oDz .7s ease-in-out infinite}@keyframes oDz{50%{transform:scale(1.04)}}
      .o-srv.drop{border-color:var(--yellow)!important;box-shadow:0 0 30px #fbbf24cc!important;transform:scale(1.03)}
      #k-wrap{position:absolute;inset:0;display:flex;flex-direction:column}#k-cv{flex:1;min-height:0;width:100%;display:block;touch-action:none}
      #k-hud{position:absolute;top:12px;left:12px;right:12px;display:flex;gap:10px;align-items:stretch;pointer-events:none}
      .k-box{background:#0f172acc;border:1px solid var(--line2);border-radius:16px;padding:6px 16px;text-align:center;min-width:96px;backdrop-filter:blur(6px)}.k-box small{display:block;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}.k-box b{font-size:30px;font-variant-numeric:tabular-nums}
      .k-msgw{flex:1;background:#0f172acc;border:1px solid var(--line2);border-radius:16px;padding:10px 16px;display:flex;flex-direction:column;justify-content:center;gap:8px;backdrop-filter:blur(6px)}#k-msg{font-size:19px;text-align:center}
      .k-tb{height:8px;background:#ffffff14;border-radius:4px;overflow:hidden}.k-tb i{display:block;height:100%;background:linear-gradient(90deg,#4ade80,#facc15);transform-origin:0 50%;will-change:transform}
      #k-tools{display:flex;gap:12px;justify-content:center;padding:12px;background:#0b0c10;border-top:1px solid var(--line);flex-wrap:wrap}
      .k-tool{--c:#fff;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:118px;padding:10px 14px;border-radius:20px;border:3px solid var(--c);background:color-mix(in srgb,var(--c) 16%,#111318);color:#fff;font:inherit;cursor:grab;touch-action:none;user-select:none;transition:transform .18s cubic-bezier(.2,.8,.2,1),box-shadow .18s}
      .k-tool span{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:var(--c);color:#111827}.k-tool b{font-size:16px}
      .k-tool:hover{transform:translateY(-4px)}.k-tool.sel{transform:translateY(-8px) scale(1.06);box-shadow:0 0 28px var(--c)}
      .k-tool.k-hl{animation:kHint .5s ease-in-out 3}@keyframes kHint{50%{transform:translateY(-10px) scale(1.1);box-shadow:0 0 36px var(--c)}}
      .k-leg{display:grid;gap:8px;margin:14px auto 0;max-width:600px}.k-leg div{display:grid;grid-template-columns:44px 1fr 24px 44px 1fr;align-items:center;gap:8px;text-align:left;background:color-mix(in srgb,var(--c) 10%,transparent);border:1px solid color-mix(in srgb,var(--c) 40%,transparent);border-radius:14px;padding:6px 10px}
      .k-leg span{color:var(--c);display:grid;place-items:center}.k-leg span.tl{background:var(--c);color:#111827;border-radius:50%;width:44px;height:44px}.k-leg i{color:var(--muted);display:grid;place-items:center}.k-leg b{font-size:16px}
      .k-modes{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:12px}.k-mode{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;padding:22px 18px;border-radius:20px;border:2px solid var(--line2);background:var(--bg2);color:var(--text);font:inherit;cursor:pointer;transition:transform .2s,border-color .2s,box-shadow .2s}
      .k-mode:hover,.k-mode.rec{border-color:var(--c);box-shadow:0 0 26px color-mix(in srgb,var(--c) 35%,transparent)}.k-mode:hover{transform:translateY(-4px)}.k-mode span{color:var(--c)}.k-mode b{font-size:24px}.k-mode small{font-size:14.5px;color:var(--muted);line-height:1.45}
      .k-mode em{position:absolute;top:-11px;background:var(--c);color:#111827;font-style:normal;font-weight:800;font-size:12px;padding:3px 10px;border-radius:999px}
      .k-stars{display:flex;gap:10px;justify-content:center;margin:6px 0 10px}.k-stars span{color:#3b4150;animation:kSt .5s cubic-bezier(.2,1.6,.4,1) both}.k-stars span.on{color:#facc15;filter:drop-shadow(0 0 12px #facc15)}@keyframes kSt{from{transform:scale(0) rotate(-40deg)}}
      @media (max-width:760px){.k-modes{grid-template-columns:1fr}.k-tool{min-width:86px;padding:8px}.k-tool span{width:44px;height:44px}#k-msg{font-size:15px}.k-box{min-width:64px;padding:4px 8px}.k-box b{font-size:22px}}
    </style>
    <div id="o-wrap"><div id="o-grid"></div>
      <div id="o-side"><div class="panel" id="o-mon"><h3>Monitorozás <span><b id="o-t">60</b> mp van hátra</span></h3><div id="o-av">100%</div><div style="font-size:12px;color:var(--muted)">rendelkezésre állás (mennyi ideig működtek a szerverek)</div><canvas id="o-hc"></canvas><div style="font-size:12px;color:var(--muted);margin-top:4px;display:flex;justify-content:space-between"><span>felhasználói elégedettség</span><b id="o-satv">80%</b></div><div class="o-satw"><div id="o-sat"></div></div></div>
        <div id="o-inbox"></div><div id="o-log"></div></div>
      <div id="o-tbox"><div class="o-tt">${icon('hand', 16, 2)} Szerszámosláda <b>– fogd meg, és húzd rá a piros szerverre!</b></div>
        <div id="o-tools">${TOOLS.map((t, i) => `<button class="o-tool" data-t="${t[0]}" style="--c:${t[4]}"><kbd>${i + 1}</kbd><span class="o-ti">${icon(t[1], 22, 2.2)}</span><b>${t[2]}</b><small>${t[3]}</small></button>`).join('')}</div></div></div>
    <div id="k-wrap" style="display:none"><canvas id="k-cv"></canvas>
      <div id="k-hud"><div class="k-box"><small>Idő</small><b id="k-time">60</b></div><div class="k-msgw"><div id="k-msg"></div><div class="k-tb"><i id="k-tbar"></i></div></div><div class="k-box"><small>Megmentve</small><b id="k-fix">0</b></div><div class="k-box"><small>Pont</small><b id="k-pts">0</b></div></div>
      <div id="k-tools">${KT.map(t => `<button class="k-tool" data-k="${t[0]}" style="--c:${t[2]}"><span>${icon(t[0], 34, 2.2)}</span><b>${t[1]}</b></button>`).join('')}</div></div>
    <div class="big-overlay" id="o-over"></div>`;
    hcv = $('#o-hc'); reset(); render(); renderInbox(); renderSat(); kcv = $('#k-cv'); kReset(); kBind();
    let oDragged = false; // húzás után a gomb click eseményét el kell nyelni
    $$('.o-tool', root).forEach(b => {
      b.onclick = () => { if (oDragged) { oDragged = false; return } G.tool = G.tool === b.dataset.t ? null : b.dataset.t; sfx.click(); tryFix() };
      // Fogd és vidd: a szerszámot rá lehet húzni a hibás szerverre
      b.onpointerdown = e => {
        if (!G.on || e.button > 0) return; e.preventDefault(); oDragged = false;
        const tool = b.dataset.t, x0 = e.clientX, y0 = e.clientY; let gh = null, over = null;
        const srvAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.closest('.o-srv') };
        const mark = el => { $$('.o-srv.drop').forEach(s => s !== el && s.classList.remove('drop')); el && el.classList.add('drop') };
        const mv = ev => {
          if (!gh) { if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return; gh = b.cloneNode(true); gh.className = 'o-tool o-ghost'; document.body.appendChild(gh); document.body.classList.add('o-dragging'); b.classList.add('drag'); G.tool = null; G.sel = null; $$('.o-tool').forEach(t => t.classList.remove('sel')) }
          gh.style.left = ev.clientX + 'px'; gh.style.top = ev.clientY + 'px';
          over = srvAt(ev.clientX, ev.clientY); mark(over);
        };
        const up = ev => {
          removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
          if (!gh) return; // sima kattintás: a click esemény kezeli
          gh.remove(); document.body.classList.remove('o-dragging'); b.classList.remove('drag'); mark(null); oDragged = true; setTimeout(() => oDragged = false, 0);
          const el = ev.type === 'pointerup' ? srvAt(ev.clientX, ev.clientY) : null;
          if (el && G.on) { G.tool = tool; G.sel = +el.dataset.i; tryFix() }
        };
        addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up);
      };
    });
    addEventListener('keydown', e => { if (App.cur !== S || !G.on) return; const k = +e.key; if (k >= 1 && k <= 6) { G.tool = TOOLS[k - 1][0]; tryFix() } });
  };
  S.enter = intro;
  S.comp = { rules: '90 másodperces műszak: hárítsd el a szerverhibákat, és válaszolj helyesen az e-mailekre, chatekre és hívásokra, mielőtt lejár az idő! Pont jár a rendelkezésre állásért, a megoldott kérésekért és az elégedettségért.', start: () => { if (window.EASY) kStart(); else { setMode('pro'); $('#o-over').style.display = 'none'; start() } } };
  S.comp.live = () => K.on ? K.pts : G.on ? Math.round(((G.tot ? G.up / G.tot * 100 : 100) * 10 + G.sat * 3) * Math.min(1, (DUR - G.t) / DUR) + G.fixes * 25 + G.tpts) : 0; // verseny közbeni részeredmény (élő ranglista-mentés)
  S._dbg = () => K;
  S.leave = () => { if (K.on) { K.on = false; K.sv.forEach(s => s.p = null) } };
  S.score = () => best;
  let acc = 0;
  S.tick = dt => {
    if (mode === 'kid') { kTick(dt); return }
    if (!G.on) return;
    G.t -= dt; G.spawn -= dt; acc += dt;
    const healthy = srv.filter(s => !s.p).length; G.up += healthy * dt; G.tot += srv.length * dt;
    if (G.spawn <= 0) { spawn(); G.spawn = window.EASY ? rnd(9, 12) : Math.max(4.5, 7 - (DUR - G.t) * .03) }
    G.tkT -= dt; if (G.tkT <= 0) { newTicket(); G.tkT = window.EASY ? rnd(15, 19) : rnd(10, 14) }
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
