/* ===== Beállítások, kioszk mód, gyenge gépes mód, első lépés súgó ===== */
ICON_PATHS.gear = '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>';
ICON_PATHS.szakma = '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>';
ICON_PATHS.ai = '<rect x="5" y="7" width="14" height="11" rx="3"/><path d="M12 7V4M9 12h.01M15 12h.01M9.5 15h5M3 12h2M19 12h2"/>';
ICON_PATHS.rj45 = '<path d="M7 3h10v6l-2 2v9H9v-9L7 9z"/><path d="M9.5 3v4M12 3v4M14.5 3v4"/>';
ICON_PATHS.phish = '<path d="M3 7l9 6 9-6"/><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M17 15l2 2 3-4"/>';
ICON_PATHS.detektiv = '<circle cx="10.5" cy="10.5" r="6"/><path d="M20 20l-5-5M8 10.5h5M10.5 8v5"/>';
window.LOWFX = store.get('lowfx', false);
window.EASY = store.get('easy', false);

const Tut = (() => {
  // állomásonként 3 rövid lépés: mi a cél, hogyan kell irányítani, mire figyelj
  const T = {
    internet: [['Netfaló', 'Ma online dolgozat lenne – de ha leáll a suli internete, elmarad az óra!'], ['Tervezz', 'Húzd a videókat, letöltéseket a termekbe. Figyelj a pénzedre és a vékony kábelekre!'], ['Rajt!', 'Ha a „Leállás” sáv betelik, nyertél. De a rendszergazda minden pályán okosabb lesz…']],
    router: [['Te vagy a router', 'Minden csomagon van egy <b>cél IP-cím</b>.'], ['Irányítás', 'Nyilakkal vagy kattintással küldd a jó kimenetre. A bal felső <b>útvonaltábla</b> segít.'], ['Pontok', 'Gyorsaság és kombó = több pont. Rossz válasz: −3 mp.']],
    kapcsolo: [['Két fül', 'Fent választhatsz: <b>VLAN és STP bemutató</b> vagy <b>Szabad labor</b>.'], ['Szabad labor', 'Tegyél le eszközöket, a <b>Kábel</b> eszközzel kösd össze őket, és adj IP-címet.'], ['Ping', 'A <b>Ping</b> eszközzel kattints két gépre: kiderül, látják-e egymást.']],
    wifi: [['Válassz nehézséget', '<b>Könnyű</b> vagy <b>Nehéz</b> mód – a nehéz tényleg nehéz!'], ['Tervezés', 'Húzd a routert, vegyél eszközöket, húzz kábelt, válassz sávot és csatornát.'], ['Teszt', 'A <b>Teszt</b> alatt élőben zavar a mikró, a szomszéd WiFi és az emberek.']],
    tuzfal: [['Te vagy a tűzfal', 'Csomagok jönnek a szerverek felé.'], ['Irányítás', 'Kattints vagy húzd az egeret a <b>veszélyes</b> csomagokon – a lézer megsemmisíti őket.'], ['Vigyázz', 'A hasznos forgalmat engedd át, különben a szerverek megsínylik!']],
    jelszo: [['Jelszó-mérő', 'Írj be egy <b>kitalált</b> jelszót (ne a sajátodat!).'], ['Figyeld', 'Megmutatja, mennyi idő alatt törhetné fel egy erős gép.'], ['Tipp', 'A hossz és a véletlenszerűség számít a legjobban.']],
    terminal: [['Parancssor', 'Itt <b>gépeléssel</b> irányítod a gépet, mint a rendszergazdák.'], ['Küldetések', 'Jobbra választhatsz: <b>Éjszakai riasztás</b> vagy <b>Kódfejtő</b>.'], ['Elakadtál?', 'Kattints a <b>Tipp</b> gombra, vagy írd be: <b>help</b>.']],
    ugyelet: [['Két mód', 'Kicsiknek a <b>Szervermentő</b>, nagyobbaknak a <b>Profi ügyelet</b>.'], ['Szervermentő', 'Ha egy szerver fölött színes buborék jelenik meg, húzd rá az ugyanolyan színű szerszámot!'], ['Profi ügyelet', 'Hat szerver mérőszámokkal, közben e-mailek, chatek és hívások.']],
    pc: [['Gépépítés', 'Vegyél alkatrészeket a <b>Webáruházban</b>, vagy teljesíts egy megrendelést.'], ['Szerelés', 'Kattints egy alkatrészre, majd a kék helyre – vagy <b>húzd rá</b>. A sárgán villogó csavarokat csavarhúzóval [S] kezeld.'], ['Kamera', 'Bal gomb: forgatás • jobb gomb: mozgatás • görgő: közelítés • X: röntgen.']],
    felho: [['Felhő-üzemeltető', 'Ügyfelek virtuális gépeket kérnek.'], ['Irányítás', '<b>Húzd</b> a kérést egy zöld keretes szerverre.'], ['Spórolj', 'Az üres szervert kapcsold ki, a piros szerverről költöztesd el a gépeket!']],
    robot: [['Programozás', 'Vezesd a robotot a töltőre, és szedd össze a kristályokat.'], ['Blokkok', 'Kattints a blokkokra a program összerakásához. Ismételd/Amíg/Ha blokkba is tehetsz.'], ['Futtatás', 'Nyomd meg a <b>Futtatás</b> gombot. Rövidebb program = több csillag.']],
    weblap: [['Weblap-műhely', 'Válassz sablont (portfólió, iskolaújság, webshop, játékklán), kapcsolj be részeket, állíts színt.'], ['Keretrendszerek', 'Válts Bootstrap, Tailwind, Material, Bulma, React vagy 1999-es Retro kinézetre, és nézd, hogyan változik az oldal és a kód!'], ['Egymás mellett', 'A második fülön mind a 7 változatot egyszerre látod.'], ['Összehasonlítás', 'A <b>Melyik eszközzel?</b> fülön: oldalkészítő vs WordPress vs kézi kód.']],
    ai: [['AI-labor', 'Négy fül: <b>Tanítsd a gépet</b>, <b>Rajzfelismerő</b>, <b>Szövegjósló</b> és <b>Önvezető autók</b>.'], ['Rajzolj!', 'A Rajzfelismerő több mint 30 rajzot ismer: házat, cicát, napot, autót… Kérj feladatot, és nézd, kitalálja-e!'], ['Önvezető autók', 'Nézd, ahogy az autók generációról generációra megtanulnak vezetni – senki nem programozta be nekik!']],
    rj45: [['Három rész', 'Először nézd meg az <b>animációt</b> a kábelről, aztán <b>krimpelj</b>, végül kösd be a kábeleket a <b>jó aljzatokba</b>!'], ['Krimpelés', 'Húzd az ereket a csatlakozó helyeire T568B sorrendben.'], ['Melyik dugó hova?', 'Húzd a kábelt a hozzá illő aljzatba – figyeld a dugó alakját!']],
    phish: [['Valódi vagy csaló?', 'Üzenetek érkeznek: e-mailek, SMS-ek, chatek.'], ['Nyomozz', 'Figyeld a <b>feladót</b>, a <b>linket</b> és azt, hogy mit kérnek tőled.'], ['Döntés', 'Bal nyíl: valódi • jobb nyíl: csaló. Utána megmutatjuk az árulkodó jeleket.']],
    detektiv: [['Hibakereső detektív', 'Egy felhasználó panaszkodik – neked kell kitalálni, mi a baj.'], ['Vizsgálat', 'Válassz vizsgálatokat (LED, ipconfig, ping…). Mindegyik pontba kerül!'], ['Megoldás', 'Ha megvan a tettes, válaszd ki a hiba okát.']],
    szakma: [['Pályaválasztó', '14 rövid kérdés következik.'], ['Válaszolj őszintén', 'Nincs jó vagy rossz válasz – azt válaszd, ami rád igaz.'], ['Eredmény', 'A végén megmutatjuk, mely informatikai területek illenek hozzád.']],
    kviz: [['Villámkvíz', '10 kérdés az informatikáról.'], ['Gyorsaság', 'Minden kérdésre 15 másodperc jut – a gyors válasz több pont.'], ['Verseny', 'A <b>Verseny</b> gombbal felkerülhetsz a ranglistára.']]
  };
  let seen = {};
  function show(st, then) {
    const steps = T[st.id]; if (!steps || seen[st.id]) { then && then(); return } seen[st.id] = 1; let i = 0;
    let m = $('#tut'); if (!m) { m = document.createElement('div'); m.id = 'tut'; document.body.appendChild(m) }
    const draw = () => {
      const [h, t] = steps[i];
      m.innerHTML = `<div class="tut-card"><div class="tut-k">${st.title} • ${i + 1}/${steps.length}</div><h3>${h}</h3><p>${t}</p><div class="tut-dots">${steps.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div><div class="tut-b"><button class="btn" id="tut-x">Kihagyom</button><button class="btn go" id="tut-n">${i < steps.length - 1 ? 'Tovább' : 'Kezdjük!'}</button></div></div>`;
      m.classList.add('show'); $('#tut-x').onclick = done; $('#tut-n').onclick = () => { if (++i >= steps.length) done(); else { sfx.click(); draw() } };
    };
    const done = () => { m.classList.remove('show'); then && then() };
    draw();
  }
  return { show, reset: () => { seen = {} }, close: () => { const m = $('#tut'); if (m) m.classList.remove('show') } };
})();

const SITE_URL = 'https://justkopi.github.io/hamori_nyiltnap/';
const QR = { svg(text, margin = 2) { try { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 4, margin, scalable: true }) } catch (e) { return '' } } };
const Settings = (() => {
  let kiosk = store.get('kiosk', false);
  function upd() { const b = $('#setbtn'); if (b) b.style.display = kiosk ? 'none' : ''; document.body.classList.toggle('kiosk', kiosk) }
  function setKiosk(v) { kiosk = v; store.set('kiosk', v); upd(); toast(v ? '<b>Kioszk mód bekapcsolva.</b> 2 perc tétlenség után visszaáll a főoldalra. Kikapcsolás: Ctrl + Alt + K' : 'Kioszk mód kikapcsolva.', '#5b9dff', 3500); if (v) try { document.documentElement.requestFullscreen().catch(() => { }) } catch (e) { } }
  function menu() {
    let m = $('#setm'); if (m) { m.remove(); return }
    m = document.createElement('div'); m.id = 'setm';
    m.innerHTML = `<h4>Beállítások</h4>
      <label class="set-r"><span><b>Kioszk mód</b><small>Tétlenség után főoldal + új név. Ki: Ctrl+Alt+K</small></span><input type="checkbox" id="set-k" ${kiosk ? 'checked' : ''}></label>
      <label class="set-r"><span><b>Gyenge gépes mód</b><small>Kevesebb effekt, árnyék nélküli 3D. Újratölti az oldalt.</small></span><input type="checkbox" id="set-l" ${window.LOWFX ? 'checked' : ''}></label>
      <div class="set-b"><button class="btn" id="set-t">Súgók újra</button><button class="btn" id="set-x">Bezárás</button></div>`;
    document.body.appendChild(m);
    $('#set-k').onchange = e => setKiosk(e.target.checked);
    $('#set-l').onchange = e => { store.set('lowfx', e.target.checked); location.reload() };
    $('#set-t').onclick = () => { Tut.reset(); toast('A súgók újra megjelennek.', '#4ade80'); m.remove() }; $('#set-x').onclick = () => m.remove();
  }
  function init() {
    const b = document.createElement('button'); b.className = 'iconbtn'; b.id = 'setbtn'; b.title = 'Beállítások'; b.innerHTML = icon('gear', 20); b.onclick = menu;
    const mu = $('#mute'); mu.parentNode.insertBefore(b, mu); upd();
    const eb = document.createElement('button'); eb.className = 'btn hbtn'; eb.id = 'easybtn'; eb.title = 'Könnyű mód általános iskolásoknak: lassabb játék, több segítség';
    const eu = () => { eb.classList.toggle('on', window.EASY); eb.innerHTML = `${icon('star', 16, 2)} ${window.EASY ? 'Könnyű mód: BE' : 'Könnyű mód'}` }; eu();
    eb.onclick = () => { window.EASY = !window.EASY; store.set('easy', window.EASY); eu(); sfx.click(); toast(window.EASY ? '<b>Könnyű mód bekapcsolva</b> – lassabb játékok, több segítség. A következő játéktól érvényes, és külön ranglistára kerül.' : 'Könnyű mód kikapcsolva – normál nehézség.', '#4ade80', 3500) };
    const pl = $('#plbtn'); pl.parentNode.insertBefore(eb, pl);
    $$('.st-n').forEach(e => e.textContent = App.stations.filter(x => x.id !== 'info').length);
    const pc = $('#parents-card'); if (pc && !$('#qr-card')) { const q = document.createElement('div'); q.id = 'qr-card'; q.innerHTML = `<div class="qr">${QR.svg(SITE_URL)}</div><div><h4>Nyisd meg a telefonodon is!</h4><p>Olvasd be a QR-kódot, és otthon is kipróbálhatod az összes játékot.</p><code>${SITE_URL.replace('https://', '')}</code></div>`; pc.after(q) }
    addEventListener('keydown', e => { if (e.ctrlKey && e.altKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); setKiosk(!kiosk) } });
    addEventListener('pointerdown', () => { if (kiosk && !document.fullscreenElement) try { document.documentElement.requestFullscreen().catch(() => { }) } catch (e) { } }, { once: false, passive: true });
    setInterval(() => {
      if (!kiosk || App.idle < 120) return;
      if (location.hash || Comp.player) { App.idle = 0; Tut.close(); Tut.reset(); Comp.resetPlayer(); const s = $('#setm'); if (s) s.remove(); location.hash = ''; setTimeout(() => toast('<b>Szia!</b> Válassz egy állomást, és kezdődhet a játék!', '#5b9dff', 4000), 300) }
    }, 1000);
  }
  return { init, get kiosk() { return kiosk } };
})();
