/* ===== Verseny, névmegadás, ranglisták ===== */
const Comp = (() => {
  let player = store.get('player', ''), cur = null, racing = false, enterT = 0;
  const lb = () => store.get('lb', {}), save = d => store.set('lb', d);
  const fmtS = (s, st) => (st && st.comp && st.comp.fmt) ? st.comp.fmt(s) : Math.round(s).toLocaleString('hu-HU') + ' ' + ((st && st.comp && st.comp.unit) || 'pont');
  // run: { t } esetén a már meglévő (ugyanilyen t-jű) bejegyzést frissíti – így
  // egy verseny élő mentései és a végeredmény egyetlen sor a ranglistán.
  function add(id, s, race, run) {
    const n = run ? run.n : player;
    if (!n || !(s > 0)) return null; id = run ? run.sid : id + (window.EASY ? '@easy' : ''); const d = lb(), L = d[id] = d[id] || [];
    let e = run && L.find(x => x.t === run.t);
    if (e) { e.s = Math.round(s); e.part = !!run.part } else { e = { n, s: Math.round(s), race: !!race, t: run ? run.t : Date.now() }; if (run && run.part) e.part = true; L.push(e) }
    L.sort((a, b) => b.s - a.s); d[id] = L.slice(0, 200); save(d);
    const list = d[id].filter(x => !!x.race === !!race); return { rank: list.indexOf(list.find(x => x.t === e.t)) + 1, of: list.length, e };
  }

  /* ----- Élő mentés: verseny közben folyamatosan rögzítjük a részeredményt,
     így ha valaki félúton kilép (másik állomás, főoldal, lap bezárása), az addig
     elért pontszáma is a ranglistán marad. ----- */
  let run = null;
  const NET_EVERY = 8000; // ms – ennyi időnként megy fel a részeredmény a közös ranglistára
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = b[6] & 15 | 64; b[8] = b[8] & 63 | 128;
    const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  function liveScore(st) {
    try { const v = st && st.comp && st.comp.live ? st.comp.live() : 0; return v > 0 ? Math.round(v) : 0 } catch (e) { return 0 }
  }
  // Helyben mindig, a közös ranglistára szakaszosan (vagy azonnal: force) ment.
  function record(s, final, force) {
    if (!run || !(s > 0)) return null;
    run.s = s; run.part = !final;
    const r = add(null, s, true, run);
    if (NetBoard.usable() && (final || s !== run.sent && (force || Date.now() - run.sentAt >= NET_EVERY))) {
      run.sent = s; run.sentAt = Date.now();
      r.net = NetBoard.submit(run.sid, run.n, s, run.id, !final);
      r.net.catch(() => { if (run && run.sent === s) run.sent = 0 }); // hiba esetén a következő körben újrapróbálja
    }
    return r;
  }
  function flush() { if (racing && run && cur) record(liveScore(cur) || run.s, false, true) }
  setInterval(() => { if (racing && run && cur) { const s = liveScore(cur); if (s > 0 && s !== run.s) record(s, false); else if (run.s > 0 && run.s !== run.sent && NetBoard.usable() && Date.now() - run.sentAt >= NET_EVERY) record(run.s, false) } }, 1000);
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush() });
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
  function onLeave(st) {
    if (!st) return;
    if (racing && run) record(liveScore(st) || run.s, false, true); // félbehagyott verseny: az addigi eredmény marad
    else if (!racing && st.score) { const s = st.score(); if (s > 0) add(st.id, s, false) }
    racing = false; run = null; close(); cur = null; upd();
  }
  function race() {
    const st = cur; if (!st || !st.comp) return;
    askName(st, () => {
      modal(`<div class="cmp-ic">${icon('trophy', 30)}</div><h2>Verseny: ${st.title}</h2><p>${st.comp.rules}</p><p class="cmp-who">Versenyző: <b>${esc(player)}</b></p><div class="cmp-b"><button class="btn" id="cmp-x">Mégse</button><button class="btn go" id="cmp-go">Rajt!</button></div>`);
      $('#cmp-x').onclick = close; $('#cmp-go').onclick = async () => {
        for (const n of [3, 2, 1]) { modal(`<div class="cmp-cd">${n}</div>`); beep(500, .12, 'square', .06); await new Promise(r => setTimeout(r, 750)) }
        modal(`<div class="cmp-cd" style="color:var(--green)">RAJT!</div>`); beep(1000, .3, 'square', .07); await new Promise(r => setTimeout(r, 450)); close();
        racing = true; run = { id: uuid(), sid: st.id + (window.EASY ? '@easy' : ''), n: player, t: Date.now(), s: 0, sent: 0, sentAt: 0 };
        st.comp.start();
      };
    });
  }
  function finish(score, detail = '') {
    const st = cur; if (!st) return; const wasRace = racing && !!run; racing = false;
    const r = wasRace ? record(Math.round(score), true) : add(st.id, score, false); run = null; const list = (lb()[st.id + (window.EASY ? '@easy' : '')] || []).filter(x => !!x.race === wasRace).slice(0, 10);
    if (wasRace && score > 20) FX.confetti();
    modal(`<div class="cmp-ic">${icon('trophy', 30)}</div><h2>${wasRace ? 'Verseny vége!' : 'Kör vége!'}</h2><div class="cmp-big">${fmtS(score, st)}</div>${detail ? `<p>${detail}</p>` : ''}
      ${r ? `<p class="cmp-rank"><b>${r.rank}. hely</b> a(z) ${r.of} ${wasRace ? 'versenyző' : 'játék'} közül</p>` : ''}
      <div class="cmp-tbl">${list.map((x, i) => `<div class="${r && x.t === r.e.t ? 'me' : ''}"><span>${i + 1}.</span><span>${esc(x.n)}</span><b>${fmtS(x.s, st)}</b></div>`).join('')}</div>
      <p class="cmp-net" id="cmp-net"></p>
      <div class="cmp-b"><button class="btn" id="cmp-nx">Új játékos</button>${st.comp ? '<button class="btn go" id="cmp-ag">Új verseny</button>' : ''}<button class="btn" id="cmp-cl">Bezárás</button></div>`);
    $('#cmp-cl').onclick = close; $('#cmp-nx').onclick = () => { player = ''; store.set('player', ''); askName(st) }; const ag = $('#cmp-ag'); if (ag) ag.onclick = () => { close(); race() };
    if (wasRace && r && r.net) {
      const note = $('#cmp-net'); note.textContent = 'Feltöltés a közös ranglistára…';
      r.net.then(() => { if (note.isConnected) note.textContent = 'Felkerült a mai közös ranglistára.' })
        .catch(() => { if (note.isConnected) note.textContent = 'A közös ranglista most nem érhető el, az eredmény ezen a gépen megmaradt.' });
    }
  }
  // Ranglista-rács: összesített bajnokság + állomásonként az első öt.
  function grid(sts, listOf, tot, removable) {
    return `<div class="cmp-grid"><div><h3>Összesített bajnokság</h3><div class="cmp-tbl">${tot.slice(0, 10).map(([n, p], i) => `<div class="${n === player ? 'me' : ''}"><span>${i + 1}.</span><span>${esc(n)}</span><b>${p} pont</b></div>`).join('') || '<p>Még nincs versenyeredmény.</p>'}</div></div>
      ${sts.map(s => { const L = listOf(s.id).slice(0, 5); return `<div><h3>${s.title}</h3><div class="cmp-tbl">${L.map((x, i) => `<div><span>${i + 1}.</span><span>${esc(x.n)}${removable ? ` <button class="cmp-del" data-n="${esc(x.n)}" data-s="${s.id}" title="Eredmény törlése (admin)" aria-label="${esc(x.n)} eredményének törlése">×</button>` : ''}</span><b>${fmtS(x.s, s)}</b></div>`).join('') || '<p style="font-size:13px">Még üres</p>'}</div></div>` }).join('')}</div>`;
  }
  function stationsWith(has) {
    const sts = []; App.stations.forEach(s => { if (s.comp || has(s.id)) sts.push({ id: s.id, title: s.title, comp: s.comp }); if (has(s.id + '@easy')) sts.push({ id: s.id + '@easy', title: s.title + ' (könnyű)', comp: s.comp }) });
    return sts;
  }
  function board(view) {
    const net = NetBoard.usable(); view = net && view !== 'local' ? 'net' : 'local';
    const tabs = net ? `<div class="cmp-tabs" role="tablist"><button class="btn ${view === 'net' ? 'go' : ''}" id="cmp-tn" role="tab" aria-selected="${view === 'net'}">Közös – mai nap</button><button class="btn ${view === 'local' ? 'go' : ''}" id="cmp-tl" role="tab" aria-selected="${view === 'local'}">Ezen a gépen</button></div>` : '';
    const rules = 'Az összesítettben minden állomáson az 1. hely 10, a 2. hely 9 pontot ér, és így tovább.';
    const bind = () => {
      $('#cmp-cl').onclick = close; $('#cmp').firstChild.classList.add('wide');
      const tn = $('#cmp-tn'), tl = $('#cmp-tl'); if (tn) tn.onclick = () => board('net'); if (tl) tl.onclick = () => board('local');
    };
    if (view === 'local') {
      const d = lb(), sts = stationsWith(id => d[id] && d[id].length);
      const pts = {}; sts.forEach(s => { const L = (d[s.id] || []).filter(x => x.race), best = {}; L.forEach(x => { if (!(x.n in best)) best[x.n] = x.s }); Object.keys(best).sort((a, b) => best[b] - best[a]).forEach((n, i) => { pts[n] = (pts[n] || 0) + Math.max(1, 10 - i) }) });
      const tot = Object.entries(pts).sort((a, b) => b[1] - a[1]);
      modal(`<div class="cmp-ic">${icon('trophy', 30)}</div><h2>Ranglista</h2>${tabs}<p>Ezen a gépen, verseny módban elért legjobb eredmények. ${rules}</p>
        ${grid(sts, id => (d[id] || []).filter(x => x.race), tot, false)}
        <div class="cmp-b"><button class="btn" id="cmp-rs">Helyi ranglista törlése</button><button class="btn go" id="cmp-cl">Bezárás</button></div>`);
      bind();
      $('#cmp-rs').onclick = () => { if ($('#cmp-rs').dataset.c) { save({}); board('local') } else { $('#cmp-rs').dataset.c = 1; $('#cmp-rs').textContent = 'Biztosan? Kattints újra' } };
      return;
    }
    modal(`<div class="cmp-ic">${icon('trophy', 30)}</div><h2>Ranglista</h2>${tabs}<p>A mai nap verseny-eredményei minden gépről. ${rules}</p><div id="cmp-body"><p>Betöltés…</p></div>
      <div class="cmp-b"><button class="btn go" id="cmp-cl">Bezárás</button></div>`);
    bind();
    NetBoard.load().then(({ byStation, total }) => {
      const body = $('#cmp-body'); if (!body) return;
      body.innerHTML = grid(stationsWith(id => byStation[id]), id => byStation[id] || [], total, NetBoard.signedIn);
      body.querySelectorAll('.cmp-del').forEach(b => b.onclick = async () => {
        if (!confirm(`Törlöd ${b.dataset.n} mai eredményét ezen az állomáson?`)) return;
        try { await NetBoard.remove(b.dataset.n, b.dataset.s); board('net') } catch (e) { alert('A törlés nem sikerült: ' + e.message) }
      });
    }).catch(e => {
      const body = $('#cmp-body'); if (body) body.innerHTML = `<p>A közös ranglista most nem érhető el (${esc(e.message)}). A helyi eredményeket az „Ezen a gépen” fülön látod.</p>`;
    });
  }
  function resetPlayer() { player = ''; store.set('player', ''); upd() }
  return { onEnter, onLeave, race, finish, board, resetPlayer, get racing() { return racing }, get player() { return player } };
})();
