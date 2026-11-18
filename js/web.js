/* ===== 13. Weblap-műhely: HTML, CSS, reszponzív megjelenés ===== */
App.add((() => {
  const S = {
    id: 'weblap', icon: '', title: 'Weblap-műhely', color: '#f472b6',
    desc: 'Készítsd el a saját weboldalad egy perc alatt! Közben látod az igazi HTML- és CSS-kódot is.',
    topic: 'Weboldalak kódolása: HTML5, CSS3, reszponzív webdizájn'
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
    const lines = ['<b class="w-f">index.html</b>', ...h.split('\n').map(l => hl(l, false)), '', '<b class="w-f">style.css</b>', ...c.split('\n').map(l => hl(l, true))];
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
      .w-t{color:#ff79c6}.w-a{color:#50fa7b}.w-p{color:#8be9fd}.w-s{color:#ffb86c}.w-n{color:#fbbf24}.w-f{color:var(--yellow);display:block;margin-top:4px}
    </style>
    <div id="w-wrap">
      <div class="panel" id="w-ctl">
        <div><label>Neved / a weblap címe</label><input type="text" id="w-name"></div>
        <div><label>Bemutatkozás</label><textarea id="w-bio"></textarea></div>
        <div><label>Színtéma</label><div class="w-row">${THEMES.map((t, i) => `<div class="w-sw" data-th="${i}" title="${t.n}" style="background:linear-gradient(135deg,${t.a} 50%,${t.bg} 50%)"></div>`).join('')}</div></div>
        <div><label>Betűtípus</label><div class="w-row">${FONTS.map((f, i) => `<button class="btn" data-font="${i}" style="font-family:${f[0].replace(/"/g, "'")}">${f[1]}</button>`).join('')}</div></div>
        <div><label>Sarkok kerekítése: <b id="w-rv"></b></label><input type="range" id="w-r" min="0" max="40" style="width:100%"></div>
        <div class="w-row"><button class="btn" id="w-sh">Árnyék</button></div>
        <div><label>Kedvenceim</label><div class="w-row">${HOB.map(h => `<button class="btn" data-hob="${h}">${h}</button>`).join('')}</div></div>
        <div><label>Gomb felirata</label><input type="text" id="w-btn"></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;min-height:0">
        <div class="w-row" style="justify-content:center"><button class="btn sel" data-v="0">Számítógép</button><button class="btn" data-v="1">Mobil</button></div>
        <div id="w-frame"><div class="w-bar"><i></i><i style="background:#fc6"></i><i style="background:#6c6"></i><span>https://${'en-weblapom'}.hu</span></div><div id="w-prev"></div></div>
      </div>
      <div id="w-code"></div>
    </div>`;
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
    sync(); render(true);
  };
  return S;
})());
