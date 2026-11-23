/* ===== 13. Weblap-műhely: sablonok, keretrendszerek, összehasonlítás ===== */
App.add((() => {
  const S = {
    id: 'weblap', icon: '', title: 'Weblap-műhely', color: '#f472b6',
    desc: 'Rakd össze a saját weboldalad, és nézd meg, hogyan néz ki Bootstrapben, Tailwindben, Material Designban, Bulmában, Reactban – vagy 1999-es stílusban!',
    topic: 'HTML5, CSS3, reszponzív dizájn, keretrendszerek, CMS (WordPress)'
  };
  const THEMES = [['Óceán', '#0ea5e9', '#6366f1'], ['Láva', '#ef4444', '#f97316'], ['Erdő', '#16a34a', '#84cc16'], ['Galaxis', '#7c3aed', '#ec4899'], ['Arany', '#d97706', '#facc15']];
  const TPL = {
    portfolio: { n: 'Portfólió', title: 'Kiss Bence', slogan: 'Hetedikes vagyok, és imádom a számítógépeket.', nav: ['Rólam', 'Munkáim', 'Kapcsolat'], cta: 'Írj nekem!', cards: [['Programozás', 'Pythonban írtam egy kis játékot.'], ['Robotika', 'Építettem egy vonalkövető robotot.'], ['Videók', 'Saját YouTube-csatornám van.']], price: [['Alap', '0 Ft', 'Ingyenes tippek'], ['Haladó', '990 Ft', 'Videós segítség'], ['Profi', '2 990 Ft', 'Személyes óra']], tl: [['2023', 'Első program'], ['2024', 'Robotverseny'], ['2025', 'Saját weboldal']] },
    school: { n: 'Iskolaújság', title: 'Suli Hírek', slogan: 'Minden, ami a suliban történik – diákoktól diákoknak.', nav: ['Hírek', 'Programok', 'Szerkesztőség'], cta: 'Feliratkozom', cards: [['Nyílt nap', 'Gyere el, és próbáld ki az informatikát!'], ['Focikupa', 'A 9.b nyerte a házibajnokságot.'], ['Robotszakkör', 'Új tagokat keresünk csütörtökre.']], price: [['Diák', '0 Ft', 'Online újság'], ['Nyomtatott', '200 Ft', 'Havi szám'], ['Támogató', '1 000 Ft', 'Név a hátoldalon']], tl: [['Szept.', 'Tanévnyitó'], ['Nov.', 'Nyílt nap'], ['Febr.', 'Farsang']] },
    shop: { n: 'Webshop', title: 'Kütyübolt', slogan: 'Okos kiegészítők gamereknek és diákoknak.', nav: ['Termékek', 'Akciók', 'Kosár'], cta: 'Vásárlás', cards: [['RGB billentyűzet', '12 990 Ft • színes világítás'], ['Gamer egér', '7 490 Ft • 6 gomb'], ['Fejhallgató', '9 990 Ft • mikrofonnal']], price: [['Alap szállítás', '990 Ft', '3–5 nap'], ['Expressz', '1 990 Ft', 'Holnapra'], ['Személyes', '0 Ft', 'Átvétel a boltban']], tl: [['1. lépés', 'Kosárba teszed'], ['2. lépés', 'Fizetsz'], ['3. lépés', 'Megérkezik']] },
    game: { n: 'Játékklán', title: 'Pixel Lovagok', slogan: 'Barátságos játékklán – csatlakozz, és játsszunk együtt!', nav: ['Tagok', 'Versenyek', 'Csatlakozás'], cta: 'Csatlakozom', cards: [['Péntek esti meccs', 'Minden héten 18 órakor.'], ['Bajnokság', 'Jövő hónapban iskolai kupa.'], ['Tippek', 'Profi taktikák kezdőknek.']], price: [['Újonc', '0 Ft', 'Alap tagság'], ['Veterán', '0 Ft', 'Saját rang'], ['Kapitány', '0 Ft', 'Csapatot vezethetsz']], tl: [['Hétfő', 'Edzés'], ['Szerda', 'Stratégia'], ['Péntek', 'Meccs']] }
  };
  // keretrendszerek: név, letöltési méret, rövid jellemzés, saját kinézet
  const FW = {
    html: ['Sima HTML + CSS', 'kb. 3 KB', 'Kézzel írt kód: teljes szabadság, a legkisebb méret.', '#111827'],
    bootstrap: ['Bootstrap', 'kb. 230 KB', 'Kész komponensek: navigációs sáv, kártyák, gombok. Gyors, de sok Bootstrap-oldal hasonlít.', '#7952b3'],
    tailwind: ['Tailwind CSS', 'kb. 10 KB', 'Apró segédosztályok a HTML-ben: modern, egyedi dizájn, nincs külön CSS-fájl.', '#38bdf8'],
    material: ['Material Design', 'kb. 300 KB', 'A Google tervezési nyelve: árnyékok, „lebegő” gombok, egységes mozgás (Angular Material, MUI).', '#6200ee'],
    bulma: ['Bulma', 'kb. 200 KB', 'Egyszerű, olvasható osztálynevek, látványos „hero” blokk, JavaScript nélkül.', '#00d1b2'],
    react: ['React', 'kb. 140 KB', 'Az oldal újrahasználható komponensekből épül (pl. &lt;Kartya/&gt;). Nagy, interaktív alkalmazásokhoz.', '#61dafb'],
    retro: ['Retro HTML (1999)', 'kb. 2 KB', 'Így néztek ki a weboldalak a 90-es években: táblázatok, Times betű, villogó szöveg!', '#808080']
  };
  const st = { tpl: 'portfolio', fw: 'tailwind', th: 3, dark: false, anim: true, r: 14, mobile: false, comp: true, sec: { cards: true, gallery: true, price: false, tl: false, form: false } };
  const T = () => TPL[st.tpl];
  // ---- egy oldal HTML-je adott keretrendszer kinézetével (az előnézethez) ----
  function page(fw, small) {
    const t = T(), [, c1, c2] = THEMES[st.th], dk = st.dark && fw !== 'retro', r = fw === 'retro' ? 0 : st.r;
    const C = { html: [c1, c1], bootstrap: ['#0d6efd', '#0d6efd'], tailwind: [c1, c2], material: ['#6200ee', '#03dac6'], bulma: ['#00d1b2', '#3273dc'], react: [c1, c2], retro: ['#0000ee', '#ff0000'] }[fw];
    const bg = dk ? '#0f172a' : { retro: '#c0c0c0', bulma: '#fff', material: '#fafafa' }[fw] || '#f8fafc', fg = dk ? '#e2e8f0' : '#111827', card = dk ? '#1e293b' : '#fff';
    const font = { retro: '"Times New Roman",serif', material: 'Roboto,Arial,sans-serif', bootstrap: 'system-ui,-apple-system,"Segoe UI",Arial,sans-serif' }[fw] || 'Inter,system-ui,sans-serif';
    const lab = (n, h) => fw === 'react' && st.comp && !small ? `<div class="cmp" data-c="&lt;${n}/&gt;">${h}</div>` : h;
    const css = `
      .pg{font-family:${font};background:${bg};color:${fg};min-height:100%;container-type:inline-size;--c1:${C[0]};--c2:${C[1]};--r:${r}px;--card:${card}}
      .pg *{box-sizing:border-box}.pg h1,.pg h2,.pg h3{margin:0}
      .nav{display:flex;align-items:center;gap:18px;padding:12px 22px}.nav b{font-size:18px;margin-right:auto}.nav a{color:inherit;text-decoration:none;font-size:14px;opacity:.85}
      .hero{padding:44px 24px;text-align:center}.hero h1{font-size:40px;line-height:1.1}.hero p{font-size:17px;opacity:.85;margin:10px auto 18px;max-width:520px}
      .btn{display:inline-block;padding:11px 22px;border-radius:var(--r);background:var(--c1);color:#fff;font-weight:700;text-decoration:none;border:0}
      .sec{padding:20px 22px}.sec h2{font-size:24px;margin-bottom:12px}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.card{background:var(--card);border-radius:var(--r);padding:16px}.card h3{font-size:17px;margin-bottom:6px}.card p{margin:0;font-size:14px;opacity:.8}
      .gal{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.gal i{display:block;aspect-ratio:1;border-radius:var(--r)}
      .tl{display:flex;gap:10px}.tl div{flex:1;border-left:4px solid var(--c1);padding:6px 10px;background:var(--card);border-radius:0 var(--r) var(--r) 0}.tl b{display:block;color:var(--c1)}
      .form{display:grid;gap:8px;max-width:420px}.form input,.form textarea{padding:10px;border-radius:var(--r);border:1px solid #cbd5e1;font:inherit;background:var(--card);color:inherit}
      .price .card{text-align:center}.price .card b{display:block;font-size:26px;margin:6px 0;color:var(--c1)}
      .foot{padding:16px;text-align:center;font-size:13px;opacity:.7}
      @container (max-width:560px){.grid,.gal{grid-template-columns:1fr 1fr}.tl{flex-direction:column}.nav a{display:none}.hero h1{font-size:30px}}
      ${st.anim && fw !== 'retro' ? '.card,.gal i,.btn{transition:transform .25s,box-shadow .25s}.card:hover,.gal i:hover{transform:translateY(-4px)}.btn:hover{transform:scale(1.05)}.hero h1{animation:fi .8s both}@keyframes fi{from{opacity:0;transform:translateY(14px)}}' : ''}
      ${{
        html: `.nav{border-bottom:1px solid #e5e7eb}.hero{background:var(--c1);color:#fff}.hero .btn{background:#fff;color:var(--c1)}.card{border:1px solid ${dk ? '#334155' : '#e5e7eb'}}`,
        bootstrap: `.nav{background:#212529;color:#fff}.nav b{color:#fff}.hero{background:${dk ? '#1e293b' : '#e9ecef'};text-align:left;padding:44px 32px}.hero h1{font-weight:500;font-size:38px}.card{border:1px solid rgba(0,0,0,.175);border-radius:6px;padding:0}.card h3{background:rgba(0,0,0,.03);border-bottom:1px solid rgba(0,0,0,.125);padding:10px 14px;margin:0;font-size:15px}.card p{padding:12px 14px}.btn{border-radius:6px;font-weight:400}.sec h2{font-weight:500}`,
        tailwind: `.nav{background:${dk ? 'rgba(15,23,42,.8)' : 'rgba(255,255,255,.8)'};backdrop-filter:blur(8px);position:sticky;top:0}.hero{background:linear-gradient(135deg,var(--c1),var(--c2));color:#fff;margin:14px;border-radius:calc(var(--r) * 2)}.hero h1{font-weight:900;letter-spacing:-.03em}.hero .btn{background:#fff;color:var(--c1);border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.2)}.card{box-shadow:0 10px 30px rgba(0,0,0,.08);border:1px solid ${dk ? '#334155' : '#f1f5f9'}}.card h3{background:linear-gradient(90deg,var(--c1),var(--c2));-webkit-background-clip:text;color:transparent}`,
        material: `.nav{background:var(--c1);color:#fff;box-shadow:0 2px 6px rgba(0,0,0,.3);text-transform:uppercase;letter-spacing:.06em}.nav b{text-transform:none;letter-spacing:0}.hero{background:${dk ? '#1e293b' : '#ede7f6'}}.hero h1{font-weight:400}.btn{text-transform:uppercase;letter-spacing:.08em;border-radius:4px;box-shadow:0 3px 5px rgba(0,0,0,.25);font-weight:500;font-size:14px}.card{border-radius:4px;box-shadow:0 2px 1px -1px rgba(0,0,0,.2),0 1px 1px rgba(0,0,0,.14),0 1px 3px rgba(0,0,0,.12)}.fab{position:absolute;right:18px;bottom:18px;width:56px;height:56px;border-radius:50%;background:var(--c2);color:#000;display:grid;place-items:center;font-size:28px;box-shadow:0 6px 10px rgba(0,0,0,.3)}`,
        bulma: `.nav{border-bottom:1px solid #eee}.hero{background:var(--c1);color:#fff;padding:60px 24px;text-align:left}.hero h1{font-size:44px;font-weight:700}.hero p{margin-left:0}.hero .btn{background:#fff;color:var(--c1);border-radius:4px}.card{box-shadow:0 .5em 1em -.125em rgba(10,10,10,.1),0 0 0 1px rgba(10,10,10,.02);border-radius:6px}.sec h2{font-weight:600}`,
        react: `.nav{border-bottom:1px solid #e5e7eb}.hero{background:linear-gradient(135deg,var(--c1),var(--c2));color:#fff}.hero .btn{background:#fff;color:var(--c1)}.card{box-shadow:0 6px 20px rgba(0,0,0,.08)}.cmp{position:relative;outline:2px dashed #61dafb;outline-offset:-2px;margin:4px}.cmp::before{content:attr(data-c);position:absolute;top:0;right:0;background:#20232a;color:#61dafb;font:700 11px monospace;padding:2px 6px;z-index:2}`,
        retro: `.pg{font-size:16px}.nav{background:#000080;color:#fff}.nav a{color:#ffff00;text-decoration:underline}.hero{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='10' height='10' fill='%23b0b0b0'/%3E%3C/svg%3E");border:3px outset #fff}.hero h1{color:#ff0000;font-size:36px;animation:bl 1s steps(2) infinite}@keyframes bl{50%{opacity:0}}.btn{background:#c0c0c0;color:#000;border:3px outset #fff;border-radius:0;font-weight:400}.card{background:#fff;border:2px inset #fff;border-radius:0}.card h3{color:#0000ee;text-decoration:underline}.gal i{border:2px ridge #fff}.marq{background:#ffff00;color:#000;padding:4px;font-weight:700;white-space:nowrap;overflow:hidden}.marq span{display:inline-block;animation:mq 8s linear infinite}@keyframes mq{from{transform:translateX(100%)}to{transform:translateX(-100%)}}`
      }[fw]}`;
    const s = st.sec;
    const body = `
      ${lab('Fejlec', `<div class="nav"><b>${esc(t.title)}</b>${t.nav.map(n => `<a href="#">${n}</a>`).join('')}</div>`)}
      ${fw === 'retro' ? `<div class="marq"><span>*** Üdvözöllek a honlapomon! *** Te vagy a 000137. látogató! *** Az oldal 800×600 felbontásra optimalizálva ***</span></div>` : ''}
      ${lab('Hero', `<div class="hero"><h1>${esc(t.title)}</h1><p>${esc(t.slogan)}</p><a class="btn" href="#">${esc(t.cta)}</a></div>`)}
      ${s.cards ? lab('Kartyak', `<div class="sec"><h2>${t.nav[0]}</h2><div class="grid">${t.cards.map(([h, p]) => `<div class="card"><h3>${h}</h3><p>${p}</p></div>`).join('')}</div></div>`) : ''}
      ${s.gallery ? lab('Galeria', `<div class="sec"><h2>Galéria</h2><div class="gal">${[0, 1, 2, 3].map(k => `<i style="background:linear-gradient(${45 + k * 40}deg,${C[0]},${C[1]})"></i>`).join('')}</div></div>`) : ''}
      ${s.price ? lab('Arak', `<div class="sec price"><h2>Csomagok</h2><div class="grid">${t.price.map(([n, p, d]) => `<div class="card"><h3>${n}</h3><b>${p}</b><p>${d}</p></div>`).join('')}</div></div>`) : ''}
      ${s.tl ? lab('Idovonal', `<div class="sec"><h2>Idővonal</h2><div class="tl">${t.tl.map(([a, b]) => `<div><b>${a}</b>${b}</div>`).join('')}</div></div>`) : ''}
      ${s.form ? lab('Urlap', `<div class="sec"><h2>${t.nav[2]}</h2><div class="form"><input placeholder="Neved"><input placeholder="E-mail címed"><textarea placeholder="Üzenet" rows="3"></textarea><a class="btn" href="#">Küldés</a></div></div>`) : ''}
      <div class="foot">${fw === 'retro' ? 'Készült Jegyzettömbbel • Legjobb Netscape Navigatorral' : `© 2026 ${esc(t.title)} • készült: ${FW[fw][0]}`}</div>${fw === 'material' ? '<div class="fab">+</div>' : ''}`;
    return `<style>${css}</style><div class="pg" style="position:relative">${body}</div>`;
  }
  // ---- kódnézet: ugyanaz az oldal a választott keretrendszer nyelvén ----
  function code() {
    const t = T(), s = st.sec, cards = t.cards;
    if (st.fw === 'react') return `import { Kartya, Hero, Fejlec } from "./komponensek";\n\nexport default function App() {\n  const kartyak = [\n${cards.map(([h, p]) => `    { cim: "${h}", szoveg: "${p}" },`).join('\n')}\n  ];\n  return (\n    <>\n      <Fejlec cim="${t.title}" />\n      <Hero cim="${t.title}" gomb="${t.cta}" />\n${s.cards ? `      <section>\n        {kartyak.map(k => <Kartya key={k.cim} {...k} />)}\n      </section>\n` : ''}    </>\n  );\n}`;
    if (st.fw === 'retro') return `<HTML>\n<BODY BGCOLOR="#C0C0C0">\n<MARQUEE>*** Üdvözöllek a honlapomon! ***</MARQUEE>\n<CENTER><FONT COLOR="red" SIZE="6"><BLINK>${t.title}</BLINK></FONT></CENTER>\n<TABLE BORDER="2" WIDTH="100%">\n<TR>\n${cards.map(([h, p]) => `  <TD><A HREF="#">${h}</A><BR>${p}</TD>`).join('\n')}\n</TR>\n</TABLE>\n<HR>\n<FONT SIZE="2">Legjobb Netscape Navigatorral</FONT>\n</BODY>\n</HTML>`;
    const cls = { html: ['nav', 'hero', 'btn', 'grid', 'card'], bootstrap: ['navbar navbar-dark bg-dark', 'p-5 bg-light rounded-3', 'btn btn-primary btn-lg', 'row g-3', 'col card'], tailwind: ['flex items-center gap-6 px-6 py-3 backdrop-blur', 'm-4 rounded-3xl bg-gradient-to-br from-violet-600 to-pink-500 p-12 text-center text-white', 'rounded-full bg-white px-6 py-3 font-bold text-violet-600 shadow-xl', 'grid grid-cols-1 gap-4 sm:grid-cols-3', 'rounded-2xl p-4 shadow-xl'], material: ['mdc-top-app-bar', 'mdc-layout-grid hero', 'mdc-button mdc-button--raised', 'mdc-layout-grid__inner', 'mdc-card'], bulma: ['navbar', 'hero is-primary is-medium', 'button is-white', 'columns', 'column card'] }[st.fw];
    const head = { html: '<link rel="stylesheet" href="style.css">', bootstrap: '<link rel="stylesheet" href="bootstrap.min.css">', tailwind: '<script src="tailwind.js"></script>', material: '<link rel="stylesheet" href="material-components-web.min.css">', bulma: '<link rel="stylesheet" href="bulma.min.css">' }[st.fw];
    return `<!DOCTYPE html>\n<html lang="hu">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  ${head}\n</head>\n<body>\n  <nav class="${cls[0]}">${t.title}</nav>\n  <header class="${cls[1]}">\n    <h1>${t.title}</h1>\n    <p>${t.slogan}</p>\n    <a class="${cls[2]}">${t.cta}</a>\n  </header>\n${s.cards ? `  <section class="${cls[3]}">\n${cards.map(([h, p]) => `    <div class="${cls[4]}">\n      <h3>${h}</h3>\n      <p>${p}</p>\n    </div>`).join('\n')}\n  </section>\n` : ''}</body>\n</html>`;
  }
  function hl(line) { return line.replace(/(\/\/.*$)|(<\/?)([A-Za-z0-9!]+)|([a-zA-Z-]+)(=)(?=")|([^<\/a-zA-Z]+|.)/g, (m, cm, lt, tg, at, eq) => cm ? `<span class="w-c">${esc(cm)}</span>` : tg ? esc(lt) + `<span class="w-t">${tg}</span>` : at ? `<span class="w-a">${at}</span>=` : esc(m)) }
  let prev = '';
  function render() {
    $('#w-prev').shadowRoot.innerHTML = `<style>:host{display:block;height:100%;overflow:auto}</style>` + page(st.fw);
    $('#w-frame').classList.toggle('mobile', st.mobile);
    $('#w-url').textContent = `https://${T().title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '')}.hu`;
    const c = code(); $('#w-code').innerHTML = `<b class="w-f">${st.fw === 'react' ? 'App.jsx' : 'index.html'}</b>\n` + c.split('\n').map(hl).join('\n');
    $('#w-fwi').innerHTML = `<b>${FW[st.fw][0]}</b> • letöltés: ${FW[st.fw][1]}<br><span>${FW[st.fw][2]}</span>`;
    $$('[data-fw]').forEach(b => b.classList.toggle('sel', b.dataset.fw === st.fw)); $$('[data-tp]').forEach(b => b.classList.toggle('sel', b.dataset.tp === st.tpl));
    $$('[data-th]').forEach(b => b.classList.toggle('sel', +b.dataset.th === st.th)); $$('[data-sec]').forEach(b => b.classList.toggle('sel', !!st.sec[b.dataset.sec]));
    $('#w-dark').classList.toggle('sel', st.dark); $('#w-anim').classList.toggle('sel', st.anim); $('#w-mob').classList.toggle('sel', st.mobile); $('#w-cmpt').style.display = st.fw === 'react' ? '' : 'none'; $('#w-cmpt').classList.toggle('sel', st.comp);
    if (prev && prev !== st.fw) { const f = $('#w-frame'); f.classList.remove('swap'); void f.offsetWidth; f.classList.add('swap') } prev = st.fw;
  }
  function renderGrid() {
    $('#w-gridv').innerHTML = Object.keys(FW).map(k => `<div class="wg-c" data-pick="${k}"><div class="wg-h"><b style="color:${FW[k][3] === '#111827' ? 'var(--text)' : FW[k][3]}">${FW[k][0]}</b><span>${FW[k][1]}</span></div><div class="wg-p"><div class="wg-s"></div></div><small>${FW[k][2]}</small></div>`).join('');
    $$('.wg-c').forEach(c => { const sr = c.querySelector('.wg-s').attachShadow({ mode: 'open' }); sr.innerHTML = page(c.dataset.pick, true); c.onclick = () => { st.fw = c.dataset.pick; setTab('ed'); sfx.click() } });
  }
  /* ---- Oldalkészítő vs WordPress vs kézi kód ---- */
  const WAYS = [
    { k: 'b', n: 'Online oldalkészítő', ic: 'layers', c: '#38bdf8', sub: 'húzd-és-ejtsd szolgáltatás', m: [5, 2, 2, 2, 5, 1], cost: 'kb. 4–12 ezer Ft/hó (tárhellyel együtt)', kb: 2.8, req: 90,
      stack: ['A szolgáltató zárt rendszerében fut', 'Sablonok, egérrel szerkeszthető', 'A tárhely és a frissítés benne van az árban', 'Nehéz máshová költöztetni'] },
    { k: 'w', n: 'WordPress', ic: 'globe', c: '#a78bfa', sub: 'tartalomkezelő rendszer (CMS)', m: [4, 4, 4, 3, 3, 2], cost: 'kb. 1–4 ezer Ft/hó tárhely + témák, bővítmények', kb: 1.9, req: 60,
      stack: ['PHP-program + MySQL-adatbázis a szerveren', 'Témák és több ezer bővítmény', 'Rendszeresen frissíteni kell (biztonság!)', 'A világ weboldalainak jelentős része ezzel készül'] },
    { k: 'h', n: 'Kézzel kódolt', ic: 'code', c: '#f472b6', sub: 'HTML, CSS, JavaScript (+ keretrendszer)', m: [1, 3, 5, 5, 2, 5], cost: 'kb. 1 ezer Ft/hó tárhely + a fejlesztő munkadíja', kb: .35, req: 12,
      stack: ['HTML + CSS + JavaScript, verziókezelés (Git)', 'Bármilyen egyedi funkció megírható', 'A leggyorsabb és legkisebb oldal', 'Fejlesztő kell hozzá – ezt tanulják a technikusok'] }
  ];
  const MET = ['Gyors elkészítés', 'Alacsony költség', 'Testreszabhatóság', 'Betöltési sebesség', 'Könnyű karbantartás', 'Szaktudás kell hozzá'];
  const SC = [
    { n: 'Pékség bemutatkozó oldala', best: 'b', why: 'Egy egyszerű, néhány oldalas bemutatkozáshoz az <b>oldalkészítő</b> a leggyorsabb: egy délután alatt kész, és a pék maga is szerkesztheti.' },
    { n: 'Iskolai blog, hírek', best: 'w', why: 'Sok szerző, rendszeres hírek, képgalériák: erre való a <b>WordPress</b>. A tanárok is könnyen írhatnak bele, de a frissítéseket a rendszergazdának kell intéznie.' },
    { n: 'Kis webshop', best: 'w', why: 'A <b>WordPress</b> webshop-bővítménnyel (pl. WooCommerce) olcsón indítható bolt. Oldalkészítővel is megy, de drágább és kevésbé rugalmas.' },
    { n: 'Egyedi foglalórendszer', best: 'h', why: 'Egyedi működés, saját adatbázis, más rendszerekhez kapcsolódás: ezt csak <b>kódolással</b> lehet jól megoldani. Itt kell a fejlesztő.' }
  ];
  let sc = 0, race = null;
  function cmpRender() {
    const el = $('#w-cmp'); if (!el) return; const S0 = SC[sc];
    el.innerHTML = `<div class="wc-top"><h2>Melyiket válasszam?</h2><div class="w-row">${SC.map((x, i) => `<button class="btn ${i === sc ? 'sel' : ''}" data-sc="${i}">${x.n}</button>`).join('')}</div></div>
      <div class="wc-why">${icon('bulb', 20)}<span>${S0.why}</span></div>
      <div class="wc-cols">${WAYS.map(w => `<div class="wc-col ${S0.best === w.k ? 'best' : ''}" style="--c:${w.c}">
        ${S0.best === w.k ? '<div class="wc-badge">Ehhez ezt ajánljuk</div>' : ''}
        <div class="wc-h"><span class="wc-ic">${icon(w.ic, 22)}</span><div><b>${w.n}</b><span>${w.sub}</span></div></div>
        ${MET.map((m, i) => `<div class="wc-m"><span>${m}</span><div>${[1, 2, 3, 4, 5].map(k => `<i class="${k <= w.m[i] ? 'on' : ''}"></i>`).join('')}</div></div>`).join('')}
        <div class="wc-cost">${icon('coin', 16)} ${w.cost}</div>
        <div class="wc-race"><div class="wc-rl"><span>Betöltés mobilon</span><b id="wr-${w.k}">–</b></div><div class="wc-rb"><i id="wb-${w.k}"></i></div><small>${String(w.kb).replace('.', ',')} MB • kb. ${w.req} kérés</small></div>
        <ul>${w.stack.map(x => `<li>${x}</li>`).join('')}</ul></div>`).join('')}</div>
      <div class="wc-foot"><button class="btn go" id="wc-go">${icon('play', 16)} Betöltési verseny (4G mobilnet)</button><span>Tipikus, szemléltető értékek: a valóságban a konkrét oldaltól függ.</span></div>`;
    $$('[data-sc]', el).forEach(b => b.onclick = () => { sc = +b.dataset.sc; sfx.click(); cmpRender() });
    $('#wc-go').onclick = () => { race = { t: 0 }; WAYS.forEach(w => { $('#wr-' + w.k).textContent = '…' }); beep(600, .1, 'triangle', .05) };
  }
  // betöltési idő: méret / 10 Mbit/s + kérésenként kb. 20 ms
  const loadT = w => w.kb * 8 / 10 + w.req * .02;
  S.tick = dt => {
    if (!race) return; race.t += dt; let all = true;
    for (const w of WAYS) {
      const T = loadT(w), f = Math.min(1, race.t / T); const b = $('#wb-' + w.k); if (b) b.style.width = f * 100 + '%';
      if (f < 1) all = false; else if ($('#wr-' + w.k).textContent === '…') { $('#wr-' + w.k).textContent = T.toFixed(1).replace('.', ',') + ' mp'; beep(900 + w.req * 3, .06, 'triangle', .05) }
    }
    if (all) race = null;
  };

  function setTab(t) {
    $$('[data-wt]').forEach(b => b.classList.toggle('sel', b.dataset.wt === t));
    $('#w-wrap').style.display = t === 'ed' ? '' : 'none'; $('#w-gridw').style.display = t === 'grid' ? '' : 'none'; $('#w-cmp').style.display = t === 'cmp' ? 'flex' : 'none';
    if (t === 'ed') render(); if (t === 'grid') renderGrid(); if (t === 'cmp') cmpRender();
  }
  S.build = root => {
    root.innerHTML = `<style>
      #w-tabs{position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:3;display:flex;gap:4px;background:var(--panel);border:1px solid var(--line2);border-radius:14px;padding:5px}#w-tabs .btn{height:38px;font-size:14px;padding:0 14px}
      #w-wrap{position:absolute;inset:62px 12px 12px;display:grid;grid-template-columns:300px minmax(0,1.35fr) minmax(0,.9fr);gap:12px}
      #w-ctl{overflow:auto;display:flex;flex-direction:column;gap:12px;font-size:14px}#w-ctl h4{margin:0 0 6px;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
      .w-row{display:flex;gap:5px;flex-wrap:wrap}.w-row .btn{padding:6px 10px;font-size:13.5px;min-height:36px}
      .w-fwb{display:grid;grid-template-columns:1fr 1fr;gap:6px}.w-fwb .btn{min-height:44px;font-size:13.5px;text-align:left;padding:6px 10px;border-left:4px solid var(--fc)}
      .w-sw{width:36px;height:36px;border-radius:50%;border:3px solid transparent;cursor:pointer}.w-sw.sel{border-color:#fff;box-shadow:0 0 12px #fff}
      #w-mid{display:flex;flex-direction:column;gap:8px;min-height:0}
      #w-frame{position:relative;border-radius:14px;border:3px solid #3a3f4b;background:#fff;overflow:hidden;transition:all .4s;justify-self:center;width:100%;flex:1;display:flex;flex-direction:column;min-height:0}
      #w-frame.mobile{width:min(380px,100%);border-radius:32px;border-width:10px;border-color:#1f2937;align-self:center}
      #w-frame.swap #w-prev{animation:wSw .5s cubic-bezier(.2,.8,.2,1)}@keyframes wSw{from{opacity:0;transform:scale(.96) translateY(10px);filter:blur(4px)}}
      .w-bar{background:#dde3f0;color:#333;font-size:13px;padding:6px 10px;display:flex;gap:6px;align-items:center}.w-bar i{width:10px;height:10px;border-radius:50%;background:#f66;display:inline-block}.w-bar span{background:#fff;border-radius:8px;padding:2px 10px;flex:1;font-family:var(--mono)}
      #w-prev{flex:1;min-height:0;overflow:auto}
      #w-codew{display:flex;flex-direction:column;gap:8px;min-height:0}#w-fwi{font-size:12.5px;color:#c9ccd3;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:8px 10px;line-height:1.4}#w-fwi span{color:var(--muted)}
      #w-code{flex:1;margin:0;font-family:var(--mono);font-size:12px;line-height:1.5;white-space:pre-wrap!important;word-break:break-word;background:#08090b;border-radius:14px;padding:10px 12px;overflow:auto;white-space:pre;color:#c9ccd3}
      .w-t{color:#ff79c6}.w-a{color:#50fa7b}.w-c{color:#6b7180}.w-f{color:var(--yellow)}
      #w-gridw{position:absolute;inset:62px 12px 12px;overflow:auto}#w-gridv{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:14px}
      .wg-c{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:12px;cursor:pointer;display:flex;flex-direction:column;gap:8px;transition:transform .15s}.wg-c:hover{transform:translateY(-3px);border-color:var(--accent)}
      .wg-h{display:flex;justify-content:space-between;align-items:baseline}.wg-h b{font-size:17px}.wg-h span{font-size:12px;color:var(--muted)}.wg-c small{font-size:12.5px;color:var(--muted);line-height:1.4}
      .wg-p{height:260px;overflow:hidden;border-radius:10px;border:1px solid var(--line2);background:#fff;position:relative}.wg-s{width:250%;transform:scale(.4);transform-origin:0 0;pointer-events:none}
      #w-cmp{position:absolute;inset:62px 12px 12px 12px;overflow:auto;display:none;flex-direction:column;gap:12px}
            .wc-top h2{margin:0 0 8px;font-size:26px}.wc-why{display:flex;gap:10px;align-items:flex-start;background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--yellow);border-radius:12px;padding:12px 14px;font-size:16px;line-height:1.45}.wc-why svg{color:var(--yellow);flex:none}
      .wc-cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
      .wc-col{position:relative;background:var(--panel);border:2px solid var(--line);border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:7px;transition:all .3s}
      .wc-col.best{border-color:var(--c);box-shadow:0 0 30px color-mix(in srgb,var(--c) 30%,transparent);transform:translateY(-3px)}
      .wc-badge{position:absolute;top:-12px;left:16px;background:var(--c);color:#0b0c0f;font-size:12px;font-weight:800;padding:3px 10px;border-radius:999px}
      .wc-h{display:flex;gap:10px;align-items:center;margin-bottom:4px}.wc-h b{display:block;font-size:18px}.wc-h span{font-size:12.5px;color:var(--muted)}
      .wc-ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;color:var(--c);background:color-mix(in srgb,var(--c) 15%,transparent);flex:none}
      .wc-m{display:flex;justify-content:space-between;align-items:center;font-size:13.5px}.wc-m div{display:flex;gap:3px}.wc-m i{width:16px;height:8px;border-radius:3px;background:#262a33}.wc-m i.on{background:var(--c)}
      .wc-cost{font-size:13px;color:#c9ccd3;display:flex;gap:6px;align-items:center;border-top:1px solid var(--line);padding-top:8px;margin-top:2px}
      .wc-race{background:var(--bg2);border-radius:10px;padding:8px 10px}.wc-rl{display:flex;justify-content:space-between;font-size:13px}.wc-rl b{color:var(--c)}
      .wc-rb{height:8px;background:#262a33;border-radius:4px;overflow:hidden;margin:5px 0 3px}.wc-rb i{display:block;height:100%;width:0;background:var(--c)}.wc-race small{font-size:11.5px;color:var(--muted)}
      .wc-col ul{margin:4px 0 0;padding-left:18px;font-size:13px;color:#c9ccd3;line-height:1.45}
      .wc-foot{display:flex;gap:14px;align-items:center;flex-wrap:wrap}.wc-foot .btn{height:44px}.wc-foot span{font-size:13px;color:var(--muted)}
    </style>
    <div id="w-tabs"><button class="btn sel" data-wt="ed">Szerkesztő</button><button class="btn" data-wt="grid">Egymás mellett: 7 keretrendszer</button><button class="btn" data-wt="cmp">Melyik eszközzel készüljön?</button></div>
    <div id="w-wrap">
      <div class="panel" id="w-ctl">
        <div><h4>1. Sablon</h4><div class="w-row">${Object.entries(TPL).map(([k, v]) => `<button class="btn" data-tp="${k}">${v.n}</button>`).join('')}</div></div>
        <div><h4>2. Keretrendszer – nézd, hogy változik!</h4><div class="w-fwb">${Object.entries(FW).map(([k, v]) => `<button class="btn" data-fw="${k}" style="--fc:${v[3]}">${v[0]}</button>`).join('')}</div></div>
        <div><h4>3. Részek</h4><div class="w-row">${[['cards', 'Kártyák'], ['gallery', 'Galéria'], ['price', 'Árak'], ['tl', 'Idővonal'], ['form', 'Kapcsolat-űrlap']].map(([k, n]) => `<button class="btn" data-sec="${k}">${n}</button>`).join('')}</div></div>
        <div><h4>4. Stílus</h4><div class="w-row">${THEMES.map((t, i) => `<div class="w-sw" data-th="${i}" title="${t[0]}" style="background:linear-gradient(135deg,${t[1]},${t[2]})"></div>`).join('')}</div>
          <div style="margin-top:8px;font-size:13px;color:var(--muted)">Lekerekítés: <b id="w-rv"></b></div><input type="range" id="w-r" min="0" max="30" style="width:100%">
          <div class="w-row" style="margin-top:6px"><button class="btn" id="w-dark">Sötét mód</button><button class="btn" id="w-anim">Animációk</button><button class="btn" id="w-mob">Mobil nézet</button><button class="btn" id="w-cmpt">Komponensek mutatása</button></div></div>
        <div class="learn" style="margin-top:0;font-size:13px">A keretrendszer egy <b>előre megírt eszközkészlet</b>: kész gombokat, kártyákat, rácsokat ad. Ugyanaz a tartalom egészen másképp néz ki bennük – a webfejlesztő a feladathoz választ.</div>
      </div>
      <div id="w-mid"><div id="w-frame"><div class="w-bar"><i></i><i style="background:#fc6"></i><i style="background:#6c6"></i><span id="w-url"></span></div><div id="w-prev"></div></div></div>
      <div id="w-codew"><div id="w-fwi"></div><pre id="w-code"></pre></div>
    </div>
    <div id="w-gridw" style="display:none"><div id="w-gridv"></div></div><div id="w-cmp"></div>`;
    $('#w-prev').attachShadow({ mode: 'open' });
    $$('[data-tp]', root).forEach(b => b.onclick = () => { st.tpl = b.dataset.tp; sfx.click(); render() });
    $$('[data-fw]', root).forEach(b => b.onclick = () => { st.fw = b.dataset.fw; sfx.click(); render() });
    $$('[data-sec]', root).forEach(b => b.onclick = () => { st.sec[b.dataset.sec] = !st.sec[b.dataset.sec]; sfx.click(); render() });
    $$('[data-th]', root).forEach(b => b.onclick = () => { st.th = +b.dataset.th; sfx.click(); render() });
    $('#w-r').value = st.r; $('#w-rv').textContent = st.r + ' px'; $('#w-r').oninput = e => { st.r = +e.target.value; $('#w-rv').textContent = st.r + ' px'; render() };
    $('#w-dark').onclick = () => { st.dark = !st.dark; render() }; $('#w-anim').onclick = () => { st.anim = !st.anim; render() };
    $('#w-mob').onclick = () => { st.mobile = !st.mobile; render(); if (st.mobile) toast('Reszponzív dizájn: mobilon a kártyák <b>egymás alá</b> kerülnek!', '#f472b6') };
    $('#w-cmpt').onclick = () => { st.comp = !st.comp; render() };
    $$('[data-wt]', root).forEach(b => b.onclick = () => { setTab(b.dataset.wt); sfx.click() });
    render();
  };
  return S;
})());
