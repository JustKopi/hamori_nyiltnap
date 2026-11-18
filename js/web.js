/* ===== 13. Weblap-műhely: HTML, CSS, reszponzív megjelenés ===== */
App.add((() => {
  const S = {
    id: 'weblap', icon: '', title: 'Weblap-műhely', color: '#f472b6',
    desc: 'Készítsd el a saját weboldalad, és nézd meg a kódját HTML-ben, Bootstrapben, Tailwindben vagy Reactban! Melyik jobb: oldalkészítő, WordPress vagy kézi kód?',
    topic: 'HTML5, CSS3, reszponzív dizájn, keretrendszerek, CMS (WordPress)'
  };
  const THEMES = [
    { n: 'Óceán', a: '#0077b6', bg: '#e9f6ff', fg: '#0b2540', card: '#ffffff' }, { n: 'Láva', a: '#e63946', bg: '#fff1e6', fg: '#3b0d11', card: '#ffffff' },
    { n: 'Erdő', a: '#2d6a4f', bg: '#eef7ee', fg: '#14301f', card: '#ffffff' }, { n: 'Űr', a: '#7b2cbf', bg: '#10002b', fg: '#e0d7ff', card: '#240046' },
    { n: 'Neon', a: '#ff006e', bg: '#0b0b0f', fg: '#f8f8f8', card: '#1b1b24' },
  ];
  const FONTS = [['Arial, sans-serif', 'Egyszerű'], ['Georgia, serif', 'Elegáns'], ['"Comic Sans MS", "Comic Neue", cursive', 'Vicces'], ['"Courier New", monospace', 'Írógép']];
  
  const HOB = ['Videójátékok', 'Foci', 'Rajzolás', 'Zene', 'Olvasás', 'Programozás', 'Úszás', 'Állatok'];
  const st = { name: 'Kiss Bence', bio: 'Szia! Hetedikes vagyok, és szeretném megtanulni, hogyan működik az internet.', av: '', th: 0, font: 0, r: 16, shadow: true, hob: ['Videójátékok', 'Programozás'], btn: 'Írj nekem!', mobile: false };
  let prevLines = [];
  /* ---- ugyanaz az oldal különböző eszközökkel ---- */
  const FW = { html: ['HTML + CSS', 'kb. 3 KB', 'Kézzel írt kód: mindent te döntesz el, a leggyorsabb.'], bs: ['Bootstrap', 'kb. 3 KB + 230 KB keretrendszer', 'Kész CSS-osztályok (pl. card, btn): gyors, de minden Bootstrap-oldal kicsit hasonlít.'], tw: ['Tailwind CSS', 'kb. 3 KB + 10 KB (csak a használt osztályok)', 'Apró segédosztályok közvetlenül a HTML-ben, saját CSS-fájl nélkül.'], react: ['React', 'kb. 3 KB + 140 KB könyvtár', 'Komponensekből épül, JavaScript rajzolja ki. Nagy, interaktív alkalmazásokhoz ideális.'] };
  let fw = 'html';
  function fwCode() {
    const t = THEMES[st.th], hob = st.hob.length ? st.hob : ['…'];
    if (fw === 'bs') return [['index.html', `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="bootstrap.min.css" rel="stylesheet">
</head>
<body style="background:${t.bg};color:${t.fg}">
  <header class="text-center text-white p-4" style="background:${t.a}">
    <div class="rounded-circle bg-white mx-auto fs-2 fw-bold">${esc(mono())}</div>
    <h1>${esc(st.name)}</h1>
  </header>
  <main class="container my-3">
    <div class="row g-3">
      <div class="col-md">
        <div class="card ${st.shadow ? 'shadow' : ''} p-3">
          <h2>Rólam</h2>
          <p>${esc(st.bio)}</p>
        </div>
      </div>
      <div class="col-md">
        <div class="card ${st.shadow ? 'shadow' : ''} p-3">
          <h2>Kedvenceim</h2>
          <ul>
${hob.map(h => `            <li>${h}</li>`).join('\n')}
          </ul>
        </div>
      </div>
    </div>
  </main>
  <footer class="text-center p-3">
    <a class="btn btn-lg text-white" style="background:${t.a}">${esc(st.btn)}</a>
  </footer>
</body>
</html>`, false]];
    if (fw === 'tw') return [['index.html', `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="utf-8">
  <link href="tailwind.css" rel="stylesheet">
</head>
<body class="bg-[${t.bg}] text-[${t.fg}]">
  <header class="bg-[${t.a}] text-white text-center py-8">
    <div class="w-20 h-20 mx-auto rounded-full bg-white text-3xl font-bold leading-[5rem]">${esc(mono())}</div>
    <h1 class="text-3xl font-bold">${esc(st.name)}</h1>
  </header>
  <main class="flex flex-col sm:flex-row gap-4 p-4">
    <section class="flex-1 rounded-[${st.r}px] ${st.shadow ? 'shadow-xl' : ''} bg-[${t.card}] p-6">
      <h2 class="text-xl font-bold">Rólam</h2>
      <p>${esc(st.bio)}</p>
    </section>
    <section class="flex-1 rounded-[${st.r}px] ${st.shadow ? 'shadow-xl' : ''} bg-[${t.card}] p-6">
      <h2 class="text-xl font-bold">Kedvenceim</h2>
      <ul class="list-disc pl-5">
${hob.map(h => `        <li>${h}</li>`).join('\n')}
      </ul>
    </section>
  </main>
  <footer class="text-center p-4">
    <a class="inline-block bg-[${t.a}] text-white font-bold px-6 py-3 rounded-[${st.r}px]">${esc(st.btn)}</a>
  </footer>
</body>
</html>`, false]];
    if (fw === 'react') return [['App.jsx', `import "./style.css";

function Kartya({ cim, children }) {
  return (
    <section className="card">
      <h2>{cim}</h2>
      {children}
    </section>
  );
}

export default function App() {
  const kedvencek = [${hob.map(h => `"${h}"`).join(', ')}];
  return (
    <>
      <header>
        <div className="avatar">${esc(mono())}</div>
        <h1>${esc(st.name)}</h1>
      </header>
      <main>
        <Kartya cim="Rólam">
          <p>${esc(st.bio)}</p>
        </Kartya>
        <Kartya cim="Kedvenceim">
          <ul>
            {kedvencek.map(k => <li key={k}>{k}</li>)}
          </ul>
        </Kartya>
      </main>
      <footer>
        <a className="btn">${esc(st.btn)}</a>
      </footer>
    </>
  );
}`, false], ['style.css', css(), true]];
    return [['index.html', html(), false], ['style.css', css(), true]];
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

  const mono = () => st.name.trim().split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '?';
  function css() {
    const t = THEMES[st.th];
    return `body {
  font-family: ${FONTS[st.font][0]};
  background-color: ${t.bg};
  color: ${t.fg};
  margin: 0;
}
header {
  background: ${t.a};
  color: white;
  text-align: center;
  padding: 2rem 1rem;
}
.avatar {
  width: 5rem;
  height: 5rem;
  margin: 0 auto;
  border-radius: 50%;
  background: white;
  color: ${t.a};
  font-size: 2rem;
  font-weight: bold;
  line-height: 5rem;
}
main {
  display: flex;
  gap: 1rem;
  padding: 1rem;
}
.card {
  flex: 1;
  background: ${t.card};
  border-radius: ${st.r}px;
  padding: 1rem 1.5rem;
  box-shadow: ${st.shadow ? '0 8px 24px rgba(0, 0, 0, 0.2)' : 'none'};
}
footer { text-align: center; padding: 1rem; }
.btn {
  display: inline-block;
  background: ${t.a};
  color: white;
  padding: 0.8rem 1.6rem;
  border-radius: ${st.r}px;
  text-decoration: none;
  font-weight: bold;
}
@media (max-width: 600px) {
  main { flex-direction: column; }
}`;
  }
  function body() {
    return `  <header>
    <div class="avatar">${esc(mono())}</div>
    <h1>${esc(st.name)}</h1>
  </header>
  <main>
    <section class="card">
      <h2>Rólam</h2>
      <p>${esc(st.bio)}</p>
    </section>
    <section class="card">
      <h2>Kedvenceim</h2>
      <ul>
${st.hob.map(h => `        <li>${h}</li>`).join('\n') || '        <li>…</li>'}
      </ul>
    </section>
  </main>
  <footer>
    <a class="btn" href="#">${esc(st.btn)}</a>
  </footer>`;
  }
  function html() {
    return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(st.name)}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
${body()}
</body>
</html>`;
  }
  function hl(line, isCss) {
    let s = esc(line);
    if (isCss) return s.replace(/^(\s*)([a-z-]+)(:)/, '$1<span class="w-p">$2</span>$3').replace(/^([^\s{][^{]*)\{/, '<span class="w-s">$1</span>{').replace(/(#[0-9a-fA-F]{3,6}|\d+(\.\d+)?(px|rem|%)?)/g, '<span class="w-n">$1</span>');
    return s.replace(/([a-z-]+)=(&quot;|")/g, '<span class="w-a">$1</span>=$2').replace(/(&lt;\/?)([a-z0-9!]+)/gi, '$1<span class="w-t">$2</span>');
  }
  function render(noFlash) {
    const c = css(), h = html();
    const sh = $('#w-prev').shadowRoot;
    sh.innerHTML = `<style>:host{display:block;height:100%}.page{container-type:inline-size;min-height:100%;overflow:auto;height:100%}
      ${c.replace(/body \{/, '.page {').replace('@media', '@container').replace(/\bh1\b/, 'h1')} h1{margin:.3em 0 0} ul{padding-left:1.2em} a{cursor:pointer}</style><div class="page">${body()}</div>`;
    const files = fwCode(), lines = []; files.forEach(([n, code, isCss], i) => { if (i) lines.push(''); lines.push(`<b class="w-f">${n}</b>`); code.split('\n').forEach(l => lines.push(hl(l, isCss))) });
    const nl = files.reduce((a, f) => a + f[1].split('\n').length, 0); $('#w-fwi').innerHTML = `<b>${FW[fw][0]}</b> • ${nl} sor • letöltés: ${FW[fw][1]}<br><span>${FW[fw][2]}</span>`;
    $('#w-code').innerHTML = lines.map((l, i) => `<div class="${!noFlash && prevLines.length && prevLines[i] !== l ? 'chg' : ''}">${l || ' '}</div>`).join('');
    const ch = $('#w-code .chg'); if (ch) ch.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    prevLines = lines;
    $('#w-frame').classList.toggle('mobile', st.mobile);
  }
  S.build = root => {
    root.innerHTML = `<style>
      #w-wrap{position:absolute;inset:0;display:grid;grid-template-columns:300px minmax(0,1.2fr) minmax(0,1fr);gap:12px;padding:12px}
      #w-ctl{overflow:auto;display:flex;flex-direction:column;gap:10px;font-size:15px}
      #w-ctl label{font-weight:700;color:var(--muted);font-size:13px}
      #w-ctl input[type=text],#w-ctl textarea{width:100%;font:inherit;font-size:16px;padding:8px;border-radius:10px;border:2px solid var(--line);background:#101216;color:var(--text)}
      #w-ctl textarea{height:70px;resize:none}
      .w-row{display:flex;gap:5px;flex-wrap:wrap}.w-row .btn{padding:6px 9px;font-size:15px;min-height:38px}
      .w-sw{width:38px;height:38px;border-radius:50%;border:3px solid transparent;cursor:pointer}.w-sw.sel{border-color:#fff;box-shadow:0 0 12px #fff}
      #w-frame{position:relative;border-radius:14px;border:3px solid #3a3f4b;background:#fff;overflow:hidden;transition:all .4s;justify-self:center;width:100%;height:100%;display:flex;flex-direction:column}
      #w-frame.mobile{width:min(375px,100%);border-radius:30px;border-width:10px;border-color:#222}
      .w-bar{background:#dde3f0;color:#333;font-size:13px;padding:6px 10px;display:flex;gap:6px;align-items:center}.w-bar i{width:10px;height:10px;border-radius:50%;background:#f66;display:inline-block}
      .w-bar span{background:#fff;border-radius:8px;padding:2px 10px;flex:1;font-family:var(--mono)}
      #w-prev{flex:1;min-height:0}
      #w-code{font-family:var(--mono);font-size:13px;line-height:1.5;background:#08090b;border-radius:14px;padding:10px 12px;overflow:auto;white-space:pre;color:#c9ccd3}
      #w-code .chg{background:#fbbf2433;animation:wch 1.5s}@keyframes wch{0%{background:#fbbf24aa}}
      #w-codew{display:flex;flex-direction:column;gap:8px;min-height:0}#w-codew #w-code{flex:1}
      #w-fw{display:flex;gap:4px;flex-wrap:wrap}#w-fw .btn{height:34px;font-size:13px;padding:0 10px}
      #w-fwi{font-size:12.5px;color:#c9ccd3;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:7px 10px;line-height:1.4}#w-fwi span{color:var(--muted)}
      #w-tabs{display:flex;gap:4px;background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:4px}#w-tabs .btn{flex:1;height:36px;font-size:13px;padding:0 6px}
      #w-cmp{position:absolute;inset:12px 12px 12px 324px;overflow:auto;display:none;flex-direction:column;gap:12px}
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
      .w-t{color:#ff79c6}.w-a{color:#50fa7b}.w-p{color:#8be9fd}.w-s{color:#ffb86c}.w-n{color:#fbbf24}.w-f{color:var(--yellow);display:block;margin-top:4px}
    </style>
    <div id="w-wrap">
      <div class="panel" id="w-ctl">
        <div id="w-tabs"><button class="btn sel" data-wt="0">Saját weblap</button><button class="btn" data-wt="1">Melyik eszközzel?</button></div>
        <div id="w-ed" style="display:flex;flex-direction:column;gap:10px">
        <div><label>Neved / a weblap címe</label><input type="text" id="w-name"></div>
        <div><label>Bemutatkozás</label><textarea id="w-bio"></textarea></div>
        <div><label>Színtéma</label><div class="w-row">${THEMES.map((t, i) => `<div class="w-sw" data-th="${i}" title="${t.n}" style="background:linear-gradient(135deg,${t.a} 50%,${t.bg} 50%)"></div>`).join('')}</div></div>
        <div><label>Betűtípus</label><div class="w-row">${FONTS.map((f, i) => `<button class="btn" data-font="${i}" style="font-family:${f[0].replace(/"/g, "'")}">${f[1]}</button>`).join('')}</div></div>
        <div><label>Sarkok kerekítése: <b id="w-rv"></b></label><input type="range" id="w-r" min="0" max="40" style="width:100%"></div>
        <div class="w-row"><button class="btn" id="w-sh">Árnyék</button></div>
        <div><label>Kedvenceim</label><div class="w-row">${HOB.map(h => `<button class="btn" data-hob="${h}">${h}</button>`).join('')}</div></div>
        <div><label>Gomb felirata</label><input type="text" id="w-btn"></div>
        </div>
        <div id="w-ed2" class="learn" style="display:none;margin-top:0">Egy weboldalt sokféleképpen el lehet készíteni. Válassz feladatot jobbra, és nézd meg, melyik eszköz illik hozzá!<br><br>A technikusok megtanulják a <b>HTML</b>, <b>CSS</b> és <b>JavaScript</b> alapjait, és azt is, hogyan kell egy <b>webszervert</b> és egy <b>WordPress</b>-oldalt biztonságosan üzemeltetni.</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;min-height:0">
        <div class="w-row" style="justify-content:center"><button class="btn sel" data-v="0">Számítógép</button><button class="btn" data-v="1">Mobil</button></div>
        <div id="w-frame"><div class="w-bar"><i></i><i style="background:#fc6"></i><i style="background:#6c6"></i><span>https://${'en-weblapom'}.hu</span></div><div id="w-prev"></div></div>
      </div>
      <div id="w-codew"><div id="w-fw">${Object.entries(FW).map(([k, v]) => `<button class="btn ${k === 'html' ? 'sel' : ''}" data-fw="${k}">${v[0]}</button>`).join('')}</div><div id="w-fwi"></div><div id="w-code"></div></div>
    </div><div id="w-cmp"></div>`;
    $('#w-prev').attachShadow({ mode: 'open' });
    const sync = () => {
      $('#w-name').value = st.name; $('#w-bio').value = st.bio; $('#w-btn').value = st.btn; $('#w-r').value = st.r; $('#w-rv').textContent = st.r + ' px';
      $$('[data-th]').forEach(b => b.classList.toggle('sel', +b.dataset.th === st.th));
      $$('[data-font]').forEach(b => b.classList.toggle('sel', +b.dataset.font === st.font)); $$('[data-hob]').forEach(b => b.classList.toggle('sel', st.hob.includes(b.dataset.hob)));
      $('#w-sh').classList.toggle('sel', st.shadow); $$('[data-v]').forEach(b => b.classList.toggle('sel', +b.dataset.v === +st.mobile));
    };
    const ch = () => { sync(); render(); sfx.click() };
    $('#w-name').oninput = e => { st.name = e.target.value; render() }; $('#w-bio').oninput = e => { st.bio = e.target.value; render() }; $('#w-btn').oninput = e => { st.btn = e.target.value; render() };
    $('#w-r').oninput = e => { st.r = +e.target.value; $('#w-rv').textContent = st.r + ' px'; render() };
    $$('[data-th]', root).forEach(b => b.onclick = () => { st.th = +b.dataset.th; ch() });
    $$('[data-font]', root).forEach(b => b.onclick = () => { st.font = +b.dataset.font; ch() });
    $$('[data-hob]', root).forEach(b => b.onclick = () => { const h = b.dataset.hob; st.hob = st.hob.includes(h) ? st.hob.filter(x => x !== h) : [...st.hob, h]; ch() });
    $$('[data-v]', root).forEach(b => b.onclick = () => { st.mobile = !!+b.dataset.v; ch(); if (st.mobile) toast('Reszponzív dizájn: mobilon a kártyák <b>egymás alá</b> kerülnek!', '#f472b6') });
    $('#w-sh').onclick = () => { st.shadow = !st.shadow; ch() };
    $$('input,textarea', root).forEach(i => i.addEventListener('keydown', e => e.stopPropagation()));
    $$('[data-fw]', root).forEach(b => b.onclick = () => { fw = b.dataset.fw; $$('[data-fw]').forEach(x => x.classList.toggle('sel', x === b)); prevLines = []; render(true); sfx.click() });
    $$('[data-wt]', root).forEach(b => b.onclick = () => { const c = b.dataset.wt === '1'; $$('[data-wt]').forEach(x => x.classList.toggle('sel', x === b)); $('#w-ed').style.display = c ? 'none' : 'flex'; $('#w-ed2').style.display = c ? '' : 'none'; $('#w-cmp').style.display = c ? 'flex' : 'none'; $$('#w-wrap>div:not(#w-ctl)').forEach(x => x.style.visibility = c ? 'hidden' : ''); if (c) cmpRender(); sfx.click() });
    sync(); render(true);
  };
  return S;
})());
