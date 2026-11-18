/* ===== 14. Villámkvíz ===== */
App.add((() => {
  const S = {
    id: 'kviz', icon: '', title: 'Villámkvíz', color: '#fcd34d',
    desc: '10 kérdés, 15 másodperc mindegyikre. Mennyit tudsz az informatikáról? Szülők is játszhatnak!',
    topic: 'Az ágazati alapvizsga és a szakmai vizsga témakörei'
  };
  // [kérdés, helyes, rossz1, rossz2, rossz3, magyarázat]
  const Q = [
    ['Mi a „router” magyar neve?', 'Forgalomirányító', 'Kapcsoló', 'Tűzfal', 'Nyomtató', 'A router irányítja a csomagokat a hálózatok között.'],
    ['Melyik egy érvényes IPv4-cím?', '192.168.1.10', '192.168.300.1', '1.2.3', 'abc.def.1.2', 'Az IPv4-cím 4 darab 0 és 255 közötti számból áll.'],
    ['Mit csinál a DNS?', 'Gépnévből IP-címet keres', 'Vírust irt', 'Kábelt tesztel', 'Fájlt tömörít', 'A DNS az internet „telefonkönyve”.'],
    ['Melyik alkatrész a számítógép „agya”?', 'Processzor (CPU)', 'Tápegység', 'Hűtőventilátor', 'Monitor', 'A CPU végzi a számításokat.'],
    ['Mi történik a RAM tartalmával, ha kikapcsoljuk a gépet?', 'Elvész', 'Megmarad', 'Felkerül a felhőbe', 'Kinyomtatódik', 'A RAM átmeneti memória, áram nélkül kiürül.'],
    ['Melyik a legerősebb jelszó?', 'Kek-Pingvin-Repul-42', '123456', 'jelszo', 'Peti2012', 'A hosszú jelmondat a legnehezebben feltörhető.'],
    ['Mi az „adathalászat” (phishing)?', 'Hamis üzenettel jelszót csalnak ki', 'Horgászverseny', 'Adatmentés', 'Gyors internet', 'Soha ne add meg a jelszavad gyanús üzenetre!'],
    ['Melyik frekvenciát használja a WiFi?', '2,4 és 5 GHz', '50 Hz', '100 MHz FM', '9 V', 'A modern WiFi 6E már 6 GHz-et is használ.'],
    ['Melyik WiFi-sáv ér messzebbre a falakon át?', '2,4 GHz', '5 GHz', 'Mindkettő egyformán', 'Egyik sem', 'Az alacsonyabb frekvencia jobban átjut a falakon, de lassabb.'],
    ['Mit jelent a HTML rövidítésben a „M”?', 'Markup (jelölő)', 'Mobil', 'Mega', 'Monitor', 'HyperText Markup Language – jelölőnyelv weboldalakhoz.'],
    ['Mire való a CSS?', 'A weboldal kinézetének formázására', 'Adatbázis-kezelésre', 'Vírusirtásra', 'Hálózati címzésre', 'A CSS a színeket, betűket, elrendezést adja.'],
    ['Melyik programozási nyelvet tanulják a technikusok?', 'Python', 'Latin', 'Morze', 'Eszperantó', 'A Python egyszerű és nagyon sokoldalú nyelv.'],
    ['Mit csinál egy for ciklus?', 'Többször megismétel utasításokat', 'Kikapcsolja a gépet', 'Letölt egy fájlt', 'Kiszámolja az IP-címet', 'A ciklussal elkerülhető ugyanannak a kódnak a sokszori leírása.'],
    ['Mi az a VLAN?', 'Virtuális helyi hálózat', 'Vezeték nélküli antenna', 'Videókártya', 'Vírusfajta', 'Egy kapcsolón belül is külön hálózatokat lehet kialakítani.'],
    ['Mire való az STP protokoll?', 'Megakadályozza a hurkokat a hálózatban', 'Gyorsítja a WiFit', 'Titkosítja a jelszót', 'Weboldalt készít', 'Hurok esetén szórási vihar alakulna ki.'],
    ['Mit csinál a DHCP?', 'Automatikusan IP-címet oszt ki', 'Vírust keres', 'Weboldalt jelenít meg', 'Hangot erősít', 'Ezért kap azonnal címet a telefonod a WiFin.'],
    ['Mi az a tűzfal?', 'A nem kívánt hálózati forgalmat szűri', 'Égésgátló festék', 'Hűtőborda', 'Képernyővédő', 'Lehet szoftveres vagy hardveres (pl. Cisco ASA).'],
    ['Mi az Ohm-törvény képlete?', 'I = U / R', 'E = mc²', 'a² + b² = c²', 'F = m·a', 'Áram = feszültség / ellenállás.'],
    ['Miért kell ellenállás a LED elé?', 'Hogy ne folyjon túl nagy áram', 'Hogy színes legyen', 'Hogy villogjon', 'Nem kell', 'Túl nagy áramtól a LED kiég.'],
    ['Mi az IoT?', 'A dolgok internete', 'Egy játékkonzol', 'Egy vírus', 'Internetes tőzsde', 'Okoseszközök, amelyek szenzorokkal mérnek és hálózaton kommunikálnak.'],
    ['Mi az a virtuális gép?', 'Egy számítógép, amely egy másik gépen belül, szoftveresen fut', 'Egy játék', 'Egy robot', 'Egy laptoptáska', 'Egy fizikai szerveren sok virtuális gép futhat.'],
    ['Mit jelent a „felhő” (cloud) az informatikában?', 'Interneten elérhető szolgáltatásokat és szervereket', 'Az időjárás-előrejelzést', 'Egy egérfajtát', 'A képernyő hátterét', 'Például az OneDrive vagy a Google Drive.'],
    ['Mi a Docker?', 'Konténertechnológia', 'Egy kikötő', 'Egy vírusirtó', 'Egy webböngésző', 'A konténerben egy program minden szükséges dologgal együtt fut.'],
    ['Mire jó a biztonsági mentés?', 'Adatvesztés után vissza lehet állítani az adatokat', 'Gyorsabb lesz tőle a net', 'Kevesebbet fogyaszt a gép', 'Szebb lesz a képernyő', 'Zsarolóvírus ellen is a mentés a legjobb védelem!'],
    ['Melyik parancs ellenőrzi, hogy elérhető-e egy gép?', 'ping', 'print', 'paint', 'pong', 'A ping kis csomagot küld, és várja a választ.'],
    ['Melyik szoftverrel szimulálnak hálózatot a technikusok?', 'Packet Tracer', 'Paint', 'Minecraft', 'Excel', 'A Cisco Packet Tracerben valódi routereket és kapcsolókat lehet konfigurálni.'],
    ['Mi az SSH?', 'Titkosított távoli bejelentkezés', 'Egy videóformátum', 'Egy kábeltípus', 'Hangkártya', 'A régi Telnet titkosítatlan volt, ezért SSH-t használunk.'],
    ['Mi a Git?', 'Verziókezelő rendszer', 'Gitárhangoló', 'Fájltömörítő', 'Betűtípus', 'Csapatmunkához: nyomon követi a kód változásait.'],
    ['Hány bitből áll egy IPv4-cím?', '32', '8', '64', '128', 'Az IPv6-cím 128 bites, mert az IPv4-címek elfogytak.'],
    ['Mire való az alapértelmezett átjáró?', 'Ezen keresztül jutnak ki a csomagok a helyi hálózatból', 'Ez a bejárati ajtó kódja', 'Ez a monitor beállítása', 'Ez a nyomtató neve', 'Általában az otthoni router címe, pl. 192.168.1.1.'],
    ['Mi az a NAT?', 'Címfordítás privát és nyilvános IP-címek között', 'Egy hálózati kábel', 'Egy programozási nyelv', 'Egy játék', 'Így tud az egész család egyetlen nyilvános IP-címmel internetezni.'],
    ['Melyik egy Linux-parancs a fájlok listázására?', 'ls', 'cd..', 'win', 'list.exe', 'Windows alatt a dir parancs felel meg neki.'],
    ['Mit jelent a „reszponzív” weboldal?', 'Alkalmazkodik a képernyő méretéhez', 'Gyorsan válaszol az e-mailekre', 'Hangosan beszél', 'Csak mobilon működik', 'Ugyanaz az oldal jól néz ki számítógépen és mobilon is.'],
    ['Mi a mesterséges intelligencia egyik gyakori felhasználása?', 'Szöveg- és képfelismerés', 'Kábelek krimpelése', 'Forrasztás', 'Papírnyomtatás', 'A modern technológiákat a technikusok is tanulják.'],
  ];
  let best = 0;
  const G = { on: false, list: [], i: 0, score: 0, right: 0, t: 15, locked: false };
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i);[a[i], a[j]] = [a[j], a[i]] } return a }
  function intro() {
    const b = store.get('quiz-best', 0);
    $('#q-main').innerHTML = `<div class="q-card" style="text-align:center"><div style="color:var(--accent);display:grid;place-items:center">${icon('bolt', 84, 1.4)}</div><h2 style="font-size:40px;margin:0">Villámkvíz</h2>
      <p style="font-size:20px;color:#c9ccd3">10 véletlenszerű kérdés • 15 mp mindegyikre • gyors válaszért több pont jár!</p>
      ${b ? `<p>Mai rekord: <b style="color:var(--yellow)">${b} pont</b></p>` : ''}<button class="btn go" id="q-go" style="font-size:30px">START ▶</button></div>`;
    $('#q-go').onclick = start;
  }
  function start() { Object.assign(G, { on: true, list: shuffle([...Q]).slice(0, 10), i: 0, score: 0, right: 0 }); show() }
  function show() {
    const q = G.list[G.i]; G.t = 15; G.locked = false;
    const ans = shuffle([1, 2, 3, 4]);
    $('#q-main').innerHTML = `<div class="q-card"><div class="q-top"><span>Kérdés ${G.i + 1} / 10</span><span>${G.score} pont</span></div>
      <div class="q-bar"><i id="q-t"></i></div><h2 class="q-q">${q[0]}</h2>
      <div class="q-ans">${ans.map((k, j) => `<button class="q-a" data-k="${k}"><b>${'ABCD'[j]}</b> ${q[k]}</button>`).join('')}</div><div id="q-ex"></div></div>`;
    $$('.q-a').forEach(b => b.onclick = () => answer(+b.dataset.k, b));
  }
  function answer(k, btn) {
    if (G.locked) return; G.locked = true; const q = G.list[G.i];
    $$('.q-a').forEach(b => { if (+b.dataset.k === 1) b.classList.add('ok'); else if (b === btn) b.classList.add('bad'); b.disabled = true });
    if (k === 1) { const pts = 50 + Math.round(G.t * 10); G.score += pts; G.right++; sfx.ok(); FX.burstEl(btn, 25); $('#q-ex').innerHTML = `<b>Helyes! +${pts}</b> ${q[5]}` }
    else { sfx.bad(); $('#q-ex').innerHTML = `${k ? 'Nem ez.' : 'Lejárt az idő!'} <b>${q[1]}</b> – ${q[5]}` }
    $('#q-ex').innerHTML += `<div style="margin-top:12px"><button class="btn go" id="q-next">${G.i < 9 ? 'TOVÁBB ▶' : 'EREDMÉNY '}</button></div>`;
    $('#q-next').onclick = next;
  }
  function next() {
    G.i++; if (G.i < 10) return show();
    G.on = false; best = Math.max(best, G.score); if (Comp.racing) { Comp.finish(G.score, `${G.right} / 10 helyes válasz`); intro(); return }
    const b = store.get('quiz-best', 0), rec = G.score > b; if (rec) store.set('quiz-best', G.score);
    if (G.right >= 7) { sfx.win(); FX.confetti() }
    $('#q-main').innerHTML = `<div class="q-card" style="text-align:center"><div style="color:var(--accent);display:grid;place-items:center">${icon(G.right >= 7 ? 'trophy' : 'star', 80, 1.4)}</div>
      <h2 style="font-size:38px;margin:0">${G.right} / 10 helyes válasz</h2><div class="big" style="font-size:54px;color:var(--yellow);font-weight:900">${G.score} pont</div>
      ${rec ? '<p style="font-size:22px">Új napi rekord!</p>' : ''}
      <p style="font-size:19px;color:#c9ccd3">${G.right >= 7 ? 'Neked itt a helyed! ' : 'Nálunk mindezt megtanulhatod! '}</p>
      <button class="btn go" id="q-again">ÚJ KÖR ▶</button></div>`;
    $('#q-again').onclick = start;
  }
  S.build = root => {
    root.innerHTML = `<style>
      #q-main{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto}
      .q-card{background:var(--panel);border:2px solid var(--line);border-radius:24px;padding:24px 30px;width:min(960px,100%)}
      .q-top{display:flex;justify-content:space-between;font-size:18px;font-weight:800;color:var(--muted)}
      .q-bar{height:12px;background:#1c1f26;border-radius:6px;overflow:hidden;margin:10px 0}.q-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--yellow),var(--orange))}
      .q-q{font-size:clamp(24px,3vw,36px);margin:14px 0 18px;line-height:1.2}
      .q-ans{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:700px){.q-ans{grid-template-columns:1fr}}
      .q-a{font:inherit;font-size:21px;font-weight:700;text-align:left;padding:18px;border-radius:16px;border:3px solid var(--line);background:#1c1f26;color:var(--text);cursor:pointer;min-height:76px}
      .q-a b{display:inline-block;width:34px;height:34px;border-radius:50%;background:#262a33;text-align:center;line-height:34px;margin-right:8px}
      .q-a:hover:not(:disabled){border-color:var(--yellow);transform:translateY(-2px)}
      .q-a.ok{border-color:var(--green);background:#0f3a26}.q-a.bad{border-color:var(--red);background:#3a0f16;animation:shakeX .3s}
      #q-ex{font-size:18px;margin-top:14px;color:#c9ccd3;text-align:center}
    </style><div id="q-main"></div>`;
  };
  S.enter = () => { if (!G.on) intro() };
  S.comp = { rules: '10 kérdés, kérdésenként 15 másodperc. A gyors helyes válasz több pontot ér!', start: () => start() };
  S.score = () => best;
  S.tick = dt => {
    if (!G.on || G.locked) return; G.t -= dt; const b = $('#q-t'); if (b) b.style.width = (G.t / 15 * 100) + '%';
    if (G.t <= 0) answer(0, null);
  };
  return S;
})());
