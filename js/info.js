/* ===== Szülőknek: a szakma bemutatása (a KKK alapján) ===== */
App.add((() => {
  const S = {
    id: 'info', icon: '', title: 'Szülőknek: a szakma', color: '#e5e7eb',
    desc: 'Mit tanul, milyen vizsgát tesz és hol dolgozhat egy informatikai rendszer- és alkalmazás-üzemeltető technikus?',
    topic: 'Képzési és kimeneti követelmények (KKK)'
  };
  const MAP = [
    ['internet', 'Az internet útja', 'Hálózatok felépítése, IP, TCP/UDP, sávszélesség, késleltetés, redundancia'],
    ['router', 'Légy te a router!', 'IPv4-címzés, CIDR-maszkok, útvonaltábla, leghosszabb egyezés, TTL'],
    ['kapcsolo', 'Kapcsoló-labor', 'VLAN-ok, STP, DHCP, és szabad hálózatépítés IP-címzéssel, átjáróval, pinggel'],
    ['wifi', 'WiFi-tervező', 'Vezeték nélküli hálózatok, 802.11 szabványok, frekvenciasávok, mesh, lefedettségi terv'],
    ['tuzfal', 'Te vagy a tűzfal!', 'Hálózatbiztonság, támadástípusok, tűzfal, vírusvédelem'],
    ['jelszo', 'Jelszó-törő', 'Biztonsági alapelvek, erős jelszavak, hitelesítés'],
    ['terminal', 'Parancssor-kaland', 'Linux/Windows parancssor: hibakeresés, átjáró, DNS, naplóelemzés, tűzfal, szolgáltatások, mentés'],
    ['ugyelet', 'Rendszergazda-ügyelet', 'Alkalmazás-üzemeltetés, monitorozás, virtualizáció, konténerek, mentés'],
    ['pc', 'Gépépítő műhely 3D', 'Számítógép felépítése, összeszerelés, alkatrészcsere, hibakeresés'],
    ['iot', 'Okosotthon (IoT)', 'Dolgok internete, szenzorok, felhőszolgáltatások'],
    ['robot', 'Programozd a robotot!', 'Python programozás, algoritmusok, automatizálás'],
    ['weblap', 'Weblap-műhely', 'HTML5, CSS3, reszponzív weboldalak'],
  ];

  /* ---- Kivetíthető, tömör diasor ---- */
  const SL = [
    { k: 'Informatikai rendszer- és alkalmazás-üzemeltető technikus', h: 'Ő tartja működésben a hálózatot, a szervereket és a felhőt.', big: [['5 év', 'technikum, érettségivel és szakmával'], ['2 év', 'érettségi után, csak szakmai képzés'], ['5. szint', 'Magyar és Európai Képesítési Keretrendszer']] },
    { k: 'Mit csinál?', h: 'Egy cég teljes informatikai háttere a kezében van.', cards: [['globe', 'Hálózatot épít', 'Routerek, kapcsolók, WiFi, VPN több telephely között'], ['layers', 'Szervert üzemeltet', 'Windows és Linux szerverek, virtualizáció, konténerek'], ['shield', 'Védi a rendszert', 'Tűzfal, vírusvédelem, mentés, jogosultságok'], ['user', 'Segít az embereknek', 'Hibaelhárítás, támogatás magyarul és angolul']] },
    { k: 'Az út a képzésben', h: 'Két év alapozás, utána szakirány, a végén csapatban készült vizsgaremek.', steps: [['1–2. év', 'Alapok', 'Gépszerelés, hálózat, web, Python, elektronika'], ['Alapvizsga', 'Mérföldkő', 'Weboldal, program és hálózat a gyakorlatban'], ['Szakirány', 'Profi szinten', 'Nagyvállalati hálózat, szerverek, felhő, automatizálás'], ['Technikusi vizsga', 'Vizsgaremek', 'Egy cég teljes hálózata csapatban, angol bemutatással']] },
    { k: 'Valódi, ipari eszközökkel', h: 'Ugyanazt tanulják, amit a munkahelyeken használnak.', tags: ['Cisco routerek és kapcsolók', 'Hardveres tűzfal', 'Packet Tracer', 'Wireshark', 'Windows Server', 'Linux', 'Hyper-V, VMware', 'Docker, Kubernetes', 'AWS, Azure, Google Cloud', 'Python', 'Git, GitHub', 'Arduino, IoT'] },
    { k: 'Merre tovább?', h: 'Minden cégnek, iskolának és kórháznak kell valaki, aki az informatikát működteti.', cards: [['monitor', 'Rendszergazda', 'Cégek, iskolák, intézmények'], ['globe', 'Hálózati technikus', 'Internetszolgáltatók, távközlés'], ['phone', 'IT-támogatás', 'Helpdesk, ügyfélszolgálat'], ['school', 'Továbbtanulás', 'Felsőoktatás, informatikai szakok']] },
    { k: 'Ma a nyílt napon', h: 'Minden állomás egy valódi tananyagrészt mutat be játékosan.', map: true }
  ];
  let si = 0, auto = null;
  function slideHTML(d) {
    let b = '';
    if (d.big) b = `<div class="sl-big">${d.big.map(([n, t]) => `<div><b>${n}</b><span>${t}</span></div>`).join('')}</div>`;
    if (d.cards) b = `<div class="sl-cards">${d.cards.map(([i, n, t]) => `<div><span class="sl-ic">${icon(i, 40, 1.6)}</span><b>${n}</b><span>${t}</span></div>`).join('')}</div>`;
    if (d.steps) b = `<div class="sl-steps">${d.steps.map(([y, n, t], i) => `<div><span class="sl-n">${i + 1}</span><em>${y}</em><b>${n}</b><span>${t}</span></div>`).join('')}</div>`;
    if (d.tags) b = `<div class="sl-tags">${d.tags.map(t => `<span>${t}</span>`).join('')}</div>`;
    if (d.map) b = `<div class="sl-map">${MAP.map(([i, n, t]) => `<div><span class="sl-mi">${icon(i, 26)}</span><span><b>${n}</b><i>${t}</i></span></div>`).join('')}</div>`;
    return `<div class="sl-k">${d.k}</div><h1>${d.h}</h1>${b}`;
  }
  function show(n) {
    si = (n + SL.length) % SL.length; const st = $('#sl-stage'); if (!st) return;
    st.classList.remove('in'); void st.offsetWidth; st.innerHTML = slideHTML(SL[si]); st.classList.add('in');
    $('#sl-dots').innerHTML = SL.map((_, i) => `<i class="${i === si ? 'on' : ''}"></i>`).join('');
  }
  function present() {
    let o = $('#sl'); if (!o) { o = document.createElement('div'); o.id = 'sl'; document.body.appendChild(o) }
    o.innerHTML = `<div id="sl-stage"></div><div id="sl-bar"><button class="btn" id="sl-p">${icon('back', 18, 2)}</button><div id="sl-dots"></div><button class="btn" id="sl-a">Automatikus lapozás</button><button class="btn" id="sl-n">${icon('arrow', 18, 2)}</button><button class="btn" id="sl-x">Bezárás</button></div>`;
    o.classList.add('show'); show(0);
    try { document.documentElement.requestFullscreen().catch(() => { }) } catch (e) { }
    $('#sl-p').onclick = () => show(si - 1); $('#sl-n').onclick = () => show(si + 1);
    $('#sl-a').onclick = e => { if (auto) { clearInterval(auto); auto = null; e.currentTarget.classList.remove('go') } else { auto = setInterval(() => show(si + 1), 9000); e.currentTarget.classList.add('go') } };
    $('#sl-x').onclick = closeP; $('#sl-stage').onclick = () => show(si + 1);
  }
  function closeP() { clearInterval(auto); auto = null; const o = $('#sl'); if (o) o.classList.remove('show'); try { if (document.fullscreenElement) document.exitFullscreen() } catch (e) { } }
  addEventListener('keydown', e => { const o = $('#sl'); if (!o || !o.classList.contains('show')) return; if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') show(si + 1); else if (e.key === 'ArrowLeft' || e.key === 'PageUp') show(si - 1); else if (e.key === 'Escape') closeP() });
  S.leave = closeP;
  S.build = root => {
    root.innerHTML = `<style>
      #in-wrap{position:absolute;inset:0;overflow:auto}
      #in{max-width:1180px;margin:0 auto;padding:24px 24px 60px;font-size:17px;line-height:1.55;color:#dfe4ff}
      #in h2{font-size:clamp(30px,4vw,46px);line-height:1.08;margin:0 0 8px;color:#fff;text-wrap:balance}
      #in h3{font-size:24px;margin:40px 0 14px;color:var(--text);letter-spacing:-.02em}
      #in .lead{font-size:20px;max-width:900px;color:#c9ccd3}
      .in-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:18px}
      .in-f{background:#15171c;border:1px solid var(--line);border-radius:16px;padding:14px 16px}
      .in-f b{display:block;font-size:26px;color:var(--text);line-height:1.1;letter-spacing:-.02em}.in-f span{display:block;margin-top:6px;font-size:14px;line-height:1.4;color:var(--muted)}
      .in-path{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}
      .in-step{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:16px;position:relative}
      .in-step .y{font-size:13px;font-weight:600;color:var(--muted)}.in-step h4{margin:4px 0 6px;font-size:19px;color:#fff}
      .in-step ul{margin:0;padding-left:18px;font-size:15px}
      .in-tags{display:flex;flex-wrap:wrap;gap:8px}.in-tags span{background:#1c1f26;border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-size:15px}
      table.in-t{width:100%;border-collapse:collapse;font-size:16px}
      .in-t td,.in-t th{padding:9px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
      .in-t th{color:var(--muted);font-size:13px;font-weight:700}
      .in-t a{color:var(--cyan);cursor:pointer;text-decoration:none;font-weight:700}
      .in-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px}@media(max-width:800px){.in-two{grid-template-columns:1fr}}
      .in-box{background:#15171c;border:1px solid var(--line);border-radius:16px;padding:16px 18px}
      .in-box h4{margin:0 0 8px;color:var(--text);font-size:17px}
      #sl{position:fixed;inset:0;z-index:200;background:radial-gradient(90% 70% at 85% 0%,#1d2a44 0%,#0b0c0f 60%);display:none;flex-direction:column;color:#fff}
      #sl.show{display:flex}
      #sl-stage{flex:1;padding:6vh 7vw 2vh;display:flex;flex-direction:column;justify-content:center;cursor:pointer;overflow:hidden}
      #sl-stage.in>*{animation:slIn .55s cubic-bezier(.2,.8,.2,1) both}#sl-stage.in>*:nth-child(2){animation-delay:.08s}#sl-stage.in>*:nth-child(3){animation-delay:.18s}
      @keyframes slIn{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}
      .sl-k{font-size:clamp(16px,1.6vw,26px);font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#60a5fa}
      #sl h1{font-size:clamp(34px,4.6vw,76px);line-height:1.08;letter-spacing:-.035em;margin:.25em 0 .7em;max-width:20ch;text-wrap:balance}
      .sl-big{display:grid;grid-template-columns:repeat(3,1fr);gap:2.5vw}.sl-big div{border-top:4px solid #60a5fa;padding-top:1.2vw}
      .sl-big b{display:block;font-size:clamp(48px,7vw,120px);line-height:1;letter-spacing:-.04em}.sl-big span{font-size:clamp(16px,1.6vw,26px);color:#b5bac4}
      .sl-cards,.sl-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:1.6vw}
      .sl-cards>div,.sl-steps>div{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:2vw;display:flex;flex-direction:column;gap:.6vw}
      .sl-ic{color:#60a5fa}.sl-cards b,.sl-steps b{font-size:clamp(20px,2vw,34px);letter-spacing:-.02em}.sl-cards span:last-child,.sl-steps span:last-child{font-size:clamp(14px,1.3vw,22px);color:#b5bac4;line-height:1.4}
      .sl-n{width:2.4em;height:2.4em;border-radius:50%;background:#60a5fa;color:#0b0c0f;display:grid;place-items:center;font-weight:800;font-size:clamp(14px,1.2vw,20px)}
      .sl-steps em{font-style:normal;color:#60a5fa;font-weight:700;font-size:clamp(13px,1.1vw,18px);text-transform:uppercase;letter-spacing:.05em}
      .sl-tags{display:flex;flex-wrap:wrap;gap:1vw}.sl-tags span{font-size:clamp(18px,1.9vw,32px);padding:.4em .9em;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05)}
      .sl-map{display:grid;grid-template-columns:repeat(3,1fr);gap:1.2vw 2vw}.sl-map>div{display:flex;gap:.8vw;align-items:center}
      .sl-mi{width:2.6em;height:2.6em;border-radius:14px;display:grid;place-items:center;background:rgba(96,165,250,.14);color:#60a5fa;flex:none}
      .sl-map b{display:block;font-size:clamp(15px,1.4vw,24px)}.sl-map i{font-style:normal;color:#9aa0ab;font-size:clamp(12px,1vw,17px)}
      #sl-bar{display:flex;gap:10px;align-items:center;padding:14px 22px;justify-content:center}
      #sl-dots{display:flex;gap:8px;margin:0 10px}#sl-dots i{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.2);transition:all .3s}#sl-dots i.on{background:#60a5fa;width:28px;border-radius:5px}
      @media(max-width:900px){.sl-cards,.sl-steps{grid-template-columns:1fr 1fr}.sl-map{grid-template-columns:1fr 1fr}.sl-big{grid-template-columns:1fr}}
      .in-pres{display:flex;gap:16px;align-items:center;background:linear-gradient(120deg,#1d2a44,#15171c);border:1px solid #2b3b5c;border-radius:18px;padding:16px 20px;margin:18px 0 6px;cursor:pointer}
      .in-pres b{font-size:19px;color:#fff;display:block}.in-pres span{color:#b5bac4;font-size:15px}.in-pres .btn{margin-left:auto;flex:none}
      .in-src{font-size:13px;color:var(--muted);margin-top:30px}
    </style>
    <div id="in-wrap"><div id="in">
      <h2>Informatikai rendszer- és alkalmazás-üzemeltető technikus</h2>
      <p class="lead">Ő az, aki megtervezi, felépíti és működteti egy cég vagy iskola hálózatát, szervereit és felhőszolgáltatásait. Gondoskodik arról, hogy minden gép, program és internetkapcsolat biztonságosan működjön, és segít a kollégáknak, ha elakadnak.</p>
      <div class="in-pres" id="in-pres"><span style="color:#60a5fa;flex:none">${icon('monitor', 34, 1.6)}</span><span><b>Kivetítős bemutató</b><span>6 dia nagy betűkkel, teljes képernyőn. Lapozás nyilakkal vagy kattintással, automatikus lapozás is van.</span></span><button class="btn go">Bemutató indítása</button></div>
      <div class="in-facts">
        <div class="in-f"><b>5 év</b><span>technikumi képzés, érettségivel és technikusi szakképesítéssel</span></div>
        <div class="in-f"><b>2 év</b><span>érettségi után, csak szakmai képzésként</span></div>
        <div class="in-f"><b>5. szint</b><span>az Európai és a Magyar Képesítési Keretrendszerben</span></div>
        <div class="in-f"><b>2100+ óra</b><span>szakmai foglalkozás a képzés során</span></div>
        <div class="in-f"><b>FEOR 3143</b><span>számítógéphálózat- és rendszertechnikus</span></div>
      </div>

      <h3>Mivel foglalkozik a munkája során?</h3>
      <div class="in-two">
        <div class="in-box"><h4>A szakma leírása szerint…</h4>
          kis és közepes méretű <b>hálózatok tervezésében, telepítésében és üzemeltetésében</b> vesz részt, csapatban és önállóan is. Üzemelteti a cég hálózati eszközeit, a különböző operációs rendszerű <b>szervereket és munkaállomásokat</b>, valamint a <b>felhőszolgáltatásokat</b>. Tűzfalakat és vírusvédelmet telepít, <b>virtualizált</b> szerverkörnyezetet működtet, webes szervert üzemeltet, adatbázisokat kezel, és szakmai témákban <b>magyarul és angolul</b> is kommunikál.</div>
        <div class="in-box"><h4>Ezekkel az eszközökkel dolgozik</h4><div class="in-tags">
          <span>Cisco routerek és kapcsolók</span><span>ASA hardveres tűzfal</span><span>WiFi routerek</span><span>Packet Tracer</span><span>Wireshark</span><span>Nagios</span>
          <span>Hyper-V / VMware</span><span>Docker / Kubernetes</span><span>Windows Server</span><span>Linux</span><span>Python / PyCharm</span><span>VS Code</span><span>Git / GitHub</span><span>Arduino, IoT-készletek</span><span>Felhő: AWS, Azure, Google Cloud</span></div></div>
      </div>

      <h3>Az út a képzésben</h3>
      <div class="in-path">
        <div class="in-step"><div class="y">1–2. ÉV • ÁGAZATI ALAPOKTATÁS</div><h4>Az informatika alapjai</h4><ul>
          <li>számítógép szétszedése és összerakása, operációs rendszerek</li><li>otthoni és irodai hálózat, WiFi router beállítása</li><li>elektronika: áramkörök, forrasztás, Arduino</li>
          <li>weboldalkészítés (HTML, CSS), programozás Pythonban</li><li>hálózatbiztonság, hibaelhárítás</li><li>mesterséges intelligencia, IoT, felhő, csapatmunka és projektek</li></ul></div>
        <div class="in-step"><div class="y">VIZSGA • ÁGAZATI ALAPVIZSGA</div><h4>Az első mérföldkő</h4><ul>
          <li>30 perces számítógépes teszt (15 kérdés)</li><li>180 perces gyakorlati vizsga, három feladattal:<br>weboldal, Python-program, hálózat a Packet Tracerben</li></ul></div>
        <div class="in-step"><div class="y">SZAKIRÁNYÚ OKTATÁS</div><h4>Hálózatok és szerverek profin</h4><ul>
          <li>IPv4 és IPv6, VLAN-ok, redundáns hálózatok (STP, FHRP)</li><li>forgalomirányítás (OSPF), címfordítás (NAT), WAN, VPN, SSH</li><li>vezeték nélküli hálózatok nagyvállalati szinten</li>
          <li>Windows és Linux szerverek, Active Directory, DNS, DHCP</li><li>virtualizáció, konténerek, felhő (SaaS, PaaS, IaaS)</li><li>monitorozás, SQL-adatbázisok, hálózatautomatizálás Pythonnal</li></ul></div>
        <div class="in-step"><div class="y">VIZSGA • TECHNIKUSI VIZSGA</div><h4>Vizsgaremek csapatban</h4><ul>
          <li>2–3 fős csapat egy valós vagy kitalált cég <b>teljes hálózatát</b> tervezi meg és építi fel (legalább 3 telephely, VLAN-ok, WiFi, VPN, tűzfal, Windows- és Linux-szerverek)</li>
          <li>bemutatás magyarul és <b>angolul</b></li><li>gyakorlati vizsga: hálózat, szerverek és felhőszolgáltatás beállítása</li><li>45 perces központi teszt (20 kérdés)</li></ul></div>
      </div>

      <h3>Melyik nyílt napi állomás melyik tananyagot mutatja be?</h3>
      <table class="in-t"><thead><tr><th>Állomás</th><th>A képzés témaköre</th></tr></thead><tbody>
        ${MAP.map(([i, n, t]) => `<tr><td><a data-go="${i}" style="display:inline-flex;gap:8px;align-items:center">${icon(i, 18)} ${n}</a></td><td>${t}</td></tr>`).join('')}
      </tbody></table>

      <h3>Kinek ajánljuk?</h3>
      <div class="in-two">
        <div class="in-box">akit érdekel, <b>hogyan működik</b> a számítógép és az internet<br>aki szeret <b>szerelni, kísérletezni, kipróbálni</b> dolgokat<br>aki szívesen old meg <b>logikai feladványokat</b> és problémákat<br>aki szeret <b>csapatban</b> dolgozni</div>
        <div class="in-box">A felvételhez <b>alapfokú iskolai végzettség</b> szükséges, külön egészségügyi vagy pályaalkalmassági vizsgálat nem kell. A végzettek rendszergazdaként, hálózati technikusként, üzemeltetőként, IT-támogatási (helpdesk) munkatársként helyezkedhetnek el, vagy továbbtanulhatnak a felsőoktatásban.</div>
      </div>
      <p class="in-src">Forrás: Informatikai rendszer- és alkalmazás-üzemeltető technikus szakma képzési és kimeneti követelményei (azonosító: 5 0612 12 02, ágazat: Informatika és távközlés).</p>
    </div></div>`;
    $('#in-pres').onclick = present;
    $$('[data-go]', root).forEach(a => a.onclick = () => { if (a.dataset.go) location.hash = a.dataset.go });
  };
  return S;
})());
