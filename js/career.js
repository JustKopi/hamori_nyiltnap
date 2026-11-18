/* ===== Melyik informatikai szakma való nekem? – kérdőív ===== */
App.add((() => {
  const S = {
    id: 'szakma', icon: '', title: 'Melyik IT-szakma való nekem?', color: '#f59e0b',
    desc: '14 kérdés, és megtudod, az informatika melyik területe illik hozzád a legjobban: hálózat, biztonság, fejlesztés, AI, játék vagy hardver?',
    topic: 'Pályaorientáció: informatikai szakterületek'
  };
  // terület: [név, ikon, szín, leírás, eszközök, kapcsolódó állomások, mennyire tanítja a technikusi képzés (0-3)]
  const AR = {
    uzem: ['Rendszerüzemeltető', 'layers', '#fb7185', 'Ő tartja életben egy cég szervereit, gépeit és szolgáltatásait: telepít, frissít, ment, hibát hárít, és segít a kollégáknak.', 'Windows Server, Linux, Active Directory, mentőrendszerek', ['ugyelet', 'terminal'], 3],
    halo: ['Hálózati szakember', 'internet', '#5b9dff', 'Megtervezi és felépíti, hogy minden gép elérje egymást és az internetet: routerek, kapcsolók, WiFi, VPN.', 'Cisco routerek és kapcsolók, Packet Tracer, Wireshark', ['internet', 'router', 'kapcsolo', 'wifi'], 3],
    bizt: ['Kiberbiztonsági szakember', 'shield', '#f87171', 'Megvédi a rendszereket a támadóktól: tűzfalat állít, gyanús forgalmat figyel, és kivizsgálja a betöréseket.', 'Tűzfalak, naplóelemzés, titkosítás, etikus hekkelés', ['tuzfal', 'jelszo', 'terminal'], 2],
    felho: ['Felhő- és DevOps-mérnök', 'felho', '#38bdf8', 'Virtuális gépeken és konténereken futtatja az alkalmazásokat, és automatizálja, hogy minden magától települjön és skálázódjon.', 'Docker, Kubernetes, AWS / Azure, Python-szkriptek', ['felho', 'ugyelet'], 2],
    dev: ['Szoftverfejlesztő', 'code', '#a78bfa', 'Programokat és alkalmazásokat ír: kitalálja a működést, megírja a kódot, és teszteli, hogy hibátlanul fusson.', 'Python, C#, Java, Git', ['robot'], 1],
    web: ['Webfejlesztő', 'globe', '#f472b6', 'Weboldalakat és webalkalmazásokat készít, a kinézettől a háttérben futó adatbázisig.', 'HTML, CSS, JavaScript, React, WordPress', ['weblap'], 1],
    data: ['Adat- és AI-szakember', 'bulb', '#2dd4bf', 'Adatokból keres összefüggéseket, és mesterséges intelligenciát tanít be, hogy felismerjen, jósoljon vagy beszélgessen.', 'Python, statisztika, gépi tanulás, adatbázisok', ['ai'], 1],
    game: ['Játékfejlesztő', 'gamepad', '#facc15', 'Játékokat tervez és programoz: pályákat, karaktereket, fizikát és mesterséges intelligenciát az ellenfeleknek.', 'Unity, Unreal, C#, 3D-modellezés', ['robot', 'pc'], 0],
    hw: ['Hardver- és IoT-technikus', 'chip', '#4ade80', 'Számítógépeket, szervereket és okoseszközöket szerel, javít és köt össze – a csavarhúzótól az érzékelőkig.', 'Alkatrészek, mérőműszerek, Arduino, forrasztás', ['pc', 'rj45'], 2],
    ux: ['UX/UI tervező', 'eye', '#c084fc', 'Azt tervezi meg, hogyan nézzen ki és mennyire legyen könnyen használható egy alkalmazás vagy weboldal.', 'Figma, felhasználói tesztek, színek és betűk', ['weblap'], 0]
  };
  const Q = [
    ['Elromlik otthon a WiFi. Mit csinálsz?', [['Megnézem a routert, újraindítom, és kiderítem, mi a baj', { halo: 3, uzem: 2 }], ['Megkeresem, ki használja a netet a szomszédból', { bizt: 3 }], ['Írok egy programot, ami figyeli, mikor szakad meg', { dev: 2, data: 1 }], ['Megvárom, amíg más megjavítja', { ux: 1 }]]],
    ['Melyik lenne a kedvenc órád?', [['Matek és logika', { dev: 2, data: 3 }], ['Rajz, vizuális kultúra', { ux: 3, web: 1, game: 1 }], ['Fizika, technika', { hw: 3, halo: 1 }], ['Angol és kommunikáció', { uzem: 2, ux: 1, felho: 1 }]]],
    ['Mit építenél a legszívesebben?', [['Egy saját játékot', { game: 3, dev: 1 }], ['Egy menő weboldalt', { web: 3, ux: 1 }], ['Egy erős gamer PC-t', { hw: 3 }], ['Egy egész iskola hálózatát', { halo: 3, uzem: 1 }]]],
    ['Egy titkos kódolt üzenetet találsz. Mi az első gondolatod?', [['Vajon hogyan lehet feltörni?', { bizt: 3, data: 1 }], ['Ki küldte, és honnan jött?', { halo: 2, bizt: 1 }], ['Írok rá egy programot, ami megfejti', { dev: 3 }], ['Nem érdekel', {}]]],
    ['Melyik szuperképességet választanád?', [['Mindenkit megvédek a támadóktól', { bizt: 3 }], ['Bármit meg tudok szerelni', { hw: 3, uzem: 1 }], ['Megjósolom a jövőt az adatokból', { data: 3 }], ['Egy kattintással ezer gépet irányítok', { felho: 3, uzem: 1 }]]],
    ['Szereted, ha minden rendben, szervezetten működik?', [['Nagyon! Szeretem, ha minden a helyén van', { uzem: 3, felho: 1, halo: 1 }], ['Inkább kísérletezek és újat alkotok', { dev: 1, game: 2, ux: 1 }], ['A hibák megkeresése a kedvencem', { bizt: 2, uzem: 1, hw: 1 }], ['Attól függ', { web: 1 }]]],
    ['Egy csapatban melyik szerepet vállalnád?', [['Aki megtervezi, hogy nézzen ki', { ux: 3, web: 1 }], ['Aki megírja a kódot', { dev: 3, web: 1, game: 1 }], ['Aki gondoskodik róla, hogy minden fusson', { uzem: 2, felho: 2 }], ['Aki ellenőrzi, hogy biztonságos-e', { bizt: 3 }]]],
    ['Mit csinálsz szívesen a gépen?', [['Játszom, és azon gondolkodom, hogyan készült', { game: 3 }], ['Szétszedem, bővítem, tuningolom', { hw: 3 }], ['Weboldalakat, videókat szerkesztek', { web: 2, ux: 2 }], ['Parancsokat, beállításokat próbálgatok', { uzem: 2, halo: 1, bizt: 1 }]]],
    ['Melyik hír érdekelne jobban?', [['Új mesterséges intelligencia tud verset írni', { data: 3, dev: 1 }], ['Hekkerek megtámadtak egy nagy céget', { bizt: 3 }], ['Kijött az új videókártya-generáció', { hw: 2, game: 1 }], ['Leállt a világ egyik legnagyobb felhőszolgáltatása', { felho: 3, uzem: 1 }]]],
    ['Szereted a feladványokat, rejtvényeket?', [['Imádom, minél nehezebb, annál jobb', { dev: 2, bizt: 2, data: 1 }], ['Inkább a kézzelfogható feladatokat', { hw: 2, halo: 1 }], ['Ha szép és jól megtervezett', { ux: 2 }], ['Néha', { uzem: 1, web: 1 }]]],
    ['Egy barátod nem tud belépni a fiókjába. Mit teszel?', [['Végigvezetem lépésről lépésre', { uzem: 3, ux: 1 }], ['Megnézem, nem törték-e fel', { bizt: 3 }], ['Kitalálom, hogyan lehetne az egészet egyszerűbbé tenni', { ux: 2, web: 1 }], ['Megmutatom, hogyan legyen erős a jelszava', { bizt: 2, uzem: 1 }]]],
    ['Hol dolgoznál a legszívesebben?', [['Egy menő játékstúdióban', { game: 3 }], ['Egy nagy cég szervertermében', { uzem: 2, halo: 2, felho: 1 }], ['Egy startupnál, ami AI-t fejleszt', { data: 3, dev: 1 }], ['Bárhonnan, otthonról, egy laptoppal', { web: 2, dev: 1, felho: 1 }]]],
    ['Mi tesz igazán büszkévé?', [['Ha valami az én ötletem alapján működik', { dev: 2, game: 1, web: 1 }], ['Ha megjavítottam valamit, amit más nem tudott', { hw: 2, uzem: 2 }], ['Ha megakadályoztam egy bajt', { bizt: 3 }], ['Ha másoknak könnyebb lett az élete', { ux: 2, uzem: 1 }]]],
    ['Melyik eszközzel dolgoznál a legszívesebben?', [['Csavarhúzó és mérőműszer', { hw: 3 }], ['Kódszerkesztő', { dev: 2, web: 1, data: 1 }], ['Hálózati eszközök és kábelek', { halo: 3 }], ['Rajzprogram', { ux: 3, game: 1 }]]]
  ];
  let qi = 0, sc = {}, hist = [], root;
  function render() {
    const el = $('#cr-in');
    if (qi >= Q.length) return result();
    const [q, opts] = Q[qi];
    el.innerHTML = `<div class="cr-top"><span>${qi + 1} / ${Q.length}</span><div class="cr-bar"><i style="width:${qi / Q.length * 100}%"></i></div>${qi ? '<button class="btn" id="cr-bk">Vissza</button>' : ''}</div>
      <h2 class="cr-q">${q}</h2><div class="cr-opts">${opts.map((o, i) => `<button class="cr-o" data-o="${i}"><b>${String.fromCharCode(65 + i)}</b><span>${o[0]}</span></button>`).join('')}</div>`;
    $$('.cr-o', el).forEach(b => b.onclick = () => { const w = opts[+b.dataset.o][1]; hist.push(w); for (const k in w) sc[k] = (sc[k] || 0) + w[k]; qi++; sfx.click(); render() });
    const bk = $('#cr-bk'); if (bk) bk.onclick = () => { const w = hist.pop(); for (const k in w) sc[k] -= w[k]; qi--; render() };
  }
  function result() {
    const max = {}; Q.forEach(([, opts]) => { const m = {}; opts.forEach(([, w]) => { for (const k in w) m[k] = Math.max(m[k] || 0, w[k]) }); for (const k in m) max[k] = (max[k] || 0) + m[k] });
    const res = Object.keys(AR).map(k => [k, Math.round((sc[k] || 0) / max[k] * 100)]).sort((a, b) => b[1] - a[1]), top = res.slice(0, 3);
    const tw = ['nem része a képzésnek', 'érinti a képzés', 'jól megalapozza a képzés', 'erre készít fel a képzés'];
    $('#cr-in').innerHTML = `<div class="cr-res"><div class="cr-k">Az eredményed</div><h2>${AR[top[0][0]][0]}</h2>
      <div class="cr-cards">${top.map(([k, v], i) => { const a = AR[k]; return `<div class="cr-card ${i ? '' : 'main'}" style="--c:${a[2]}"><div class="cr-ch"><span class="cr-ic">${icon(a[1], 26)}</span><div><b>${a[0]}</b><em>${v}% egyezés</em></div></div><p>${a[3]}</p><div class="cr-tools">${a[4]}</div>
        <div class="cr-tw">${[0, 1, 2].map(n => `<i class="${n < a[6] ? 'on' : ''}"></i>`).join('')}<span>${tw[a[6]]}</span></div>
        <div class="cr-go">${a[5].filter(id => App.byId(id)).map(id => `<button class="btn" data-go="${id}">${icon(id, 15)} ${App.byId(id).title}</button>`).join('')}</div></div>` }).join('')}</div>
      <h3>Minden terület</h3><div class="cr-all">${res.map(([k, v]) => `<div><span>${AR[k][0]}</span><i><em style="width:${v}%;background:${AR[k][2]}"></em></i><b>${v}%</b></div>`).join('')}</div>
      <div class="learn">Az <b>informatikai rendszer- és alkalmazás-üzemeltető technikus</b> képzés a hálózatokra, a rendszerüzemeltetésre, a biztonságra és a felhőre épít, de programozást és webfejlesztést is tanulsz. Bármelyik irányba továbbmehetsz utána – munkába vagy egyetemre.</div>
      <div class="cr-b"><button class="btn go" id="cr-re">Újrakezdés</button></div></div>`;
    $$('[data-go]').forEach(b => b.onclick = () => { location.hash = b.dataset.go }); $('#cr-re').onclick = () => { qi = 0; sc = {}; hist = []; render() };
    sfx.win(); FX.confetti(); best = Math.max(best, 1);
  }
  let best = 0;
  S.build = r => {
    root = r;
    r.innerHTML = `<style>
      #cr{position:absolute;inset:0;overflow:auto;padding:24px}#cr-in{max-width:980px;margin:0 auto}
      .cr-top{display:flex;align-items:center;gap:14px;color:var(--muted);font-weight:700}.cr-bar{flex:1;height:8px;background:var(--panel2);border-radius:4px;overflow:hidden}.cr-bar i{display:block;height:100%;background:var(--accent);transition:width .3s}.cr-top .btn{height:36px;font-size:14px}
      .cr-q{font-size:clamp(26px,3.2vw,40px);letter-spacing:-.02em;margin:34px 0 22px;text-wrap:balance}
      .cr-opts{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:760px){.cr-opts{grid-template-columns:1fr}}
      .cr-o{all:unset;cursor:pointer;display:flex;gap:14px;align-items:center;background:var(--panel);border:2px solid var(--line);border-radius:18px;padding:20px;font-size:18px;line-height:1.35;transition:all .15s;animation:crIn .3s both}
      .cr-o:nth-child(2){animation-delay:.05s}.cr-o:nth-child(3){animation-delay:.1s}.cr-o:nth-child(4){animation-delay:.15s}@keyframes crIn{from{opacity:0;transform:translateY(10px)}}
      .cr-o:hover{border-color:var(--accent);transform:translateY(-2px);background:var(--panel2)}.cr-o b{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:color-mix(in srgb,var(--accent) 18%,transparent);color:var(--accent);flex:none}
      .cr-k{font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}.cr-res h2{font-size:clamp(30px,4vw,48px);margin:4px 0 18px;letter-spacing:-.03em}
      .cr-cards{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:12px}@media(max-width:900px){.cr-cards{grid-template-columns:1fr}}
      .cr-card{background:var(--panel);border:1px solid var(--line);border-top:4px solid var(--c);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:8px}.cr-card.main{box-shadow:0 0 34px color-mix(in srgb,var(--c) 25%,transparent)}
      .cr-ch{display:flex;gap:10px;align-items:center}.cr-ch b{display:block;font-size:18px}.cr-ch em{font-style:normal;color:var(--c);font-weight:700;font-size:14px}
      .cr-ic{width:46px;height:46px;border-radius:13px;display:grid;place-items:center;color:var(--c);background:color-mix(in srgb,var(--c) 15%,transparent);flex:none}
      .cr-card p{margin:0;font-size:14.5px;color:#d1d5db;line-height:1.45}.cr-tools{font-size:12.5px;color:var(--muted)}
      .cr-tw{display:flex;gap:4px;align-items:center;font-size:12.5px;color:#c9ccd3}.cr-tw i{width:14px;height:6px;border-radius:3px;background:var(--line2)}.cr-tw i.on{background:var(--green)}.cr-tw span{margin-left:6px}
      .cr-go{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto}.cr-go .btn{height:32px;font-size:12.5px;padding:0 10px;display:inline-flex;gap:5px;align-items:center}
      .cr-res h3{margin:26px 0 10px}.cr-all div{display:grid;grid-template-columns:220px 1fr 50px;gap:10px;align-items:center;padding:4px 0;font-size:15px}.cr-all i{height:10px;background:var(--panel2);border-radius:5px;overflow:hidden}.cr-all em{display:block;height:100%}.cr-all b{text-align:right}
      .cr-b{margin-top:16px;text-align:center}.cr-b .btn{height:48px;padding:0 24px}
    </style><div id="cr"><div id="cr-in"></div></div>`;
    render();
  };
  S.enter = () => { };
  return S;
})());
