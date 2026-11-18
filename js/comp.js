/* ===== Verseny, névmegadás, ranglisták ===== */
const Comp = (() => {
  let player = store.get('player', ''), cur = null, racing = false, enterT = 0;
  const lb = () => store.get('lb', {}), save = d => store.set('lb', d);
  const fmtS = (s, st) => (st && st.comp && st.comp.fmt) ? st.comp.fmt(s) : Math.round(s).toLocaleString('hu-HU') + ' ' + ((st && st.comp && st.comp.unit) || 'pont');
  function add(id, s, race) {
    if (!player || !(s > 0)) return null; const d = lb(), L = d[id] = d[id] || [];
    const e = { n: player, s: Math.round(s), race: !!race, t: Date.now() }; L.push(e); L.sort((a, b) => b.s - a.s); d[id] = L.slice(0, 200); save(d);
    const list = d[id].filter(x => !!x.race === !!race); return { rank: list.indexOf(list.find(x => x.t === e.t)) + 1, of: list.length, e };
  }
  function modal(html) { let m = $('#cmp'); if (!m) { m = document.createElement('div'); m.id = 'cmp'; document.body.appendChild(m) } m.innerHTML = `<div class="cmp-card">${html}</div>`; m.classList.add('show'); return m }
  function close() { const m = $('#cmp'); if (m) m.classList.remove('show') }
  function askName(st, then) {
    const last = player;
    const m = modal(`<div class="cmp-ic">${icon('user', 30)}</div><h2>Ki játszik most?</h2><p>${st.title} – írd be a neved, hogy a pontszámod felkerülhessen a ranglistára!</p>
      <input id="cmp-n" maxlength="16" placeholder="Neved vagy beceneved" value="${esc(last)}" autocomplete="off">
      <div class="cmp-b">${last ? `<button class="btn" id="cmp-same">Igen, ${esc(last)} vagyok</button>` : ''}<button class="btn go" id="cmp-ok">Tovább</button></div>`);
    const inp = $('#cmp-n'); setTimeout(() => { inp.focus(); inp.select() }, 60);
    const go = () => { const v = inp.value.trim(); if (!v) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); return } player = v; store.set('player', v); close(); upd(); then && then() };
    $('#cmp-ok').onclick = go; inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') go() });
    const sm = $('#cmp-same'); if (sm) sm.onclick = () => { close(); upd(); then && then() };
  }
  function upd() { const r = $('#racebtn'), p = $('#plbtn'); if (r) r.style.display = cur && cur.comp ? '' : 'none'; if (p) { p.style.display = cur ? '' : 'none'; p.innerHTML = `${icon('user', 16)} ${esc(player || 'Névtelen')}` } }
  function onEnter(st) { cur = st; racing = false; enterT = performance.now(); upd(); if (st && st.id !== 'info') askName(st, () => typeof Tut !== 'undefined' && Tut.show(st)) }
  function onLeave(st) { if (!st) return; if (!racing && st.score) { const s = st.score(); if (s > 0) add(st.id, s, false) } racing = false; close(); cur = null; upd() }
  function race() {
    const st = cur; if (!st || !st.comp) return;
    askName(st, () => {
      modal(`<div class="cmp-ic">${icon('trophy', 30)}</div><h2>Verseny: ${st.title}</h2><p>${st.comp.rules}</p><p class="cmp-who">Versenyző: <b>${esc(player)}</b></p><div class="cmp-b"><button class="btn" id="cmp-x">Mégse</button><button class="btn go" id="cmp-go">Rajt!</button></div>`);
      $('#cmp-x').onclick = close; $('#cmp-go').onclick = async () => {
        for (const n of [3, 2, 1]) { modal(`<div class="cmp-cd">${n}</div>`); beep(500, .12, 'square', .06); await new Promise(r => setTimeout(r, 750)) }
        modal(`<div class="cmp-cd" style="color:var(--green)">RAJT!</div>`); beep(1000, .3, 'square', .07); await new Promise(r => setTimeout(r, 450)); close();
        racing = true; st.comp.start();
      };
    });
  }
  function finish(score, detail = '') {
    const st = cur; if (!st) return; const wasRace = racing; racing = false;
    const r = add(st.id, score, wasRace); const list = (lb()[st.id] || []).filter(x => !!x.race === wasRace).slice(0, 10);
    if (wasRace && score > 20) FX.confetti();
    modal(`<div class="cmp-ic">${icon('trophy', 30)}</div><h2>${wasRace ? 'Verseny vége!' : 'Kör vége!'}</h2><div class="cmp-big">${fmtS(score, st)}</div>${detail ? `<p>${detail}</p>` : ''}
      ${r ? `<p class="cmp-rank"><b>${r.rank}. hely</b> a(z) ${r.of} ${wasRace ? 'versenyző' : 'játék'} közül</p>` : ''}
      <div class="cmp-tbl">${list.map((x, i) => `<div class="${r && x.t === r.e.t ? 'me' : ''}"><span>${i + 1}.</span><span>${esc(x.n)}</span><b>${fmtS(x.s, st)}</b></div>`).join('')}</div>
      <div class="cmp-b"><button class="btn" id="cmp-nx">Új játékos</button>${st.comp ? '<button class="btn go" id="cmp-ag">Új verseny</button>' : ''}<button class="btn" id="cmp-cl">Bezárás</button></div>`);
    $('#cmp-cl').onclick = close; $('#cmp-nx').onclick = () => { player = ''; store.set('player', ''); askName(st) }; const ag = $('#cmp-ag'); if (ag) ag.onclick = () => { close(); race() };
  }
  function board() {
    const d = lb(), sts = App.stations.filter(s => s.comp || (d[s.id] && d[s.id].length));
    const pts = {}; sts.forEach(s => { const L = (d[s.id] || []).filter(x => x.race), best = {}; L.forEach(x => { if (!(x.n in best)) best[x.n] = x.s }); Object.keys(best).sort((a, b) => best[b] - best[a]).forEach((n, i) => { pts[n] = (pts[n] || 0) + Math.max(1, 10 - i) }) });
    const tot = Object.entries(pts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    modal(`<div class="cmp-ic">${icon('trophy', 30)}</div><h2>Ranglista</h2><p>Verseny módban elért legjobb eredmények. Az összesítettben minden állomáson az 1. hely 10, a 2. hely 9 pontot ér, és így tovább.</p>
      <div class="cmp-grid"><div><h3>Összesített bajnokság</h3><div class="cmp-tbl">${tot.map(([n, p], i) => `<div class="${n === player ? 'me' : ''}"><span>${i + 1}.</span><span>${esc(n)}</span><b>${p} pont</b></div>`).join('') || '<p>Még nincs versenyeredmény.</p>'}</div></div>
      ${sts.map(s => { const L = (d[s.id] || []).filter(x => x.race).slice(0, 5); return `<div><h3>${s.title}</h3><div class="cmp-tbl">${L.map((x, i) => `<div><span>${i + 1}.</span><span>${esc(x.n)}</span><b>${fmtS(x.s, s)}</b></div>`).join('') || '<p style="font-size:13px">Még üres</p>'}</div></div>` }).join('')}</div>
      <div class="cmp-b"><button class="btn" id="cmp-rs">Ranglista törlése</button><button class="btn go" id="cmp-cl">Bezárás</button></div>`);
    $('#cmp-cl').onclick = close; $('#cmp-rs').onclick = () => { if ($('#cmp-rs').dataset.c) { save({}); board() } else { $('#cmp-rs').dataset.c = 1; $('#cmp-rs').textContent = 'Biztosan? Kattints újra' } };
    $('#cmp').firstChild.classList.add('wide');
  }
  function resetPlayer() { player = ''; store.set('player', ''); upd() }
  return { onEnter, onLeave, race, finish, board, resetPlayer, get racing() { return racing }, get player() { return player } };
})();
