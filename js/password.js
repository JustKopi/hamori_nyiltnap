/* ===== 6. Jelszó-detektív: törd fel a gyenge fiókokat, ismerd fel az erőseket – utána teszteld a saját jelszóötletedet ===== */
App.add((() => {
  const S = {
    id: 'jelszo', icon: '', title: 'Jelszó-detektív', color: '#fb923c',
    desc: 'Etikus hekker vagy: egy iskola megbízott, hogy tesztelj hat fiókot. Melyiket tudod feltörni, és melyik biztonságos? Utána kiderül, mennyit érne a te jelszavad!',
    topic: 'Hálózatbiztonság, erős jelszavak, szótáras és nyers erős támadás, kétlépcsős azonosítás'
  };
  const COMMON = ['123456', '123456789', '12345678', '12345', '1234', 'password', 'jelszo', 'jelszó', 'qwerty', 'qwertz', 'abc123', '111111', '000000', 'iloveyou', 'admin', 'szeretlek', 'macska', 'kutya', 'cica', 'asdfgh', 'asd123', 'monkey', 'dragon', 'football', 'letmein', 'welcome', 'login', 'princess', 'sunshine', 'master', 'hello', 'szia', 'budapest', 'magyarorszag', 'ferencvaros', 'fradi', 'minecraft', 'fortnite', 'roblox', 'pokemon', 'barcelona', 'messi', 'ronaldo', 'anyu', 'apu', 'titok'];
  const GUESS = 1e11; // próbálkozás/másodperc – erős, videókártyás törőgép
  // Kitalált célpontok. pw: a jelszó; kind: common | personal | short | strong | 2fa; parts: a jelszó darabjai (személyes adatos találgatáshoz)
  // leak: amit egy korábbi adatszivárgásból tudunk a jelszóról (hossz, jelkészlet) – ebből becsülhető a nyers erő ideje
  const TARGETS = [
    { who: 'Kovács Bence', role: '8.b osztályos tanuló', av: 'gamepad', col: '#a78bfa', pw: 'minecraft', kind: 'common',
      bio: ['Kedvenc játéka: <b>Minecraft</b>', 'Kutyája: <b>Bodri</b>', 'Született: <b>2012</b>'], chips: ['Bence', 'Bodri', 'Minecraft', 'minecraft', '2012', '123', '!'],
      leak: { len: 9, set: 26, txt: '9 karakter, csak kisbetű' }, why: 'A <b>minecraft</b> rajta van a leggyakoribb jelszavak listáján – a támadók ezzel kezdik, másodpercek alatt megvan.' },
    { who: 'Szabó Lili', role: '10.a osztályos tanuló', av: 'heart', col: '#f472b6', pw: 'Morzsi2010', kind: 'personal', parts: ['Morzsi', '2010'],
      bio: ['Kutyája: <b>Morzsi</b> 🐶 (minden második posztja róla szól)', 'Szülinap: <b>2010</b>. március 3.', 'Kedvenc csapat: <b>Fradi</b>'], chips: ['Lili', 'Szabo', 'Morzsi', 'Fradi', '2010', '0303', '123', '!'],
      leak: { len: 10, set: 62, txt: '10 karakter, kis- és nagybetű, szám' }, why: 'A kutya neve és a születési év: bárki kiolvashatja a közösségi profiljából. Hosszú, de <b>kitalálható</b> – nyers erővel hetekig tartana, okos találgatással pár próbálkozás.' },
    { who: 'Nagy Péter', role: 'fizikatanár', av: 'bulb', col: '#fbbf24', pw: 'k7q2', kind: 'short',
      bio: ['Kedvenc mondása: „Egyszerűbb nem lehetne!”', 'Macskája: <b>Newton</b>', 'Szereti a rövid jelszavakat, mert gyorsan beírhatók'], chips: ['Peter', 'Newton', 'fizika', '1975', '123', '!'],
      leak: { len: 4, set: 36, txt: '4 karakter, kisbetű és szám' }, why: 'Véletlenszerű, de csak <b>4 karakter</b>: alig 1,7 millió lehetőség, egy törőgép a másodperc töredéke alatt végigpróbálja. A <b>hossz</b> a legfontosabb!' },
    { who: 'Tóth Anna', role: 'informatikatanár', av: 'shield', col: '#4ade80', pw: 'r7#Qm!x2V$k9pL', kind: 'strong',
      bio: ['Jelszókezelőt használ', 'Minden oldalhoz más jelszava van', 'Macskája: <b>Bit</b>, születési éve: <b>1988</b>'], chips: ['Anna', 'Bit', 'Toth', '1988', 'info', '123', '!'],
      leak: { len: 14, set: 95, txt: '14 karakter, kis- és nagybetű, szám, írásjel' }, why: '14 véletlenszerű karakter, mindenféle jellel: a nyers erőhöz <b>milliárd évek</b> kellenének, kitalálni pedig nem lehet. Ezt egy <b>jelszókezelő</b> generálta.' },
    { who: 'Varga Dani', role: '11.c osztályos tanuló', av: 'trophy', col: '#38bdf8', pw: 'Fradi2009!', kind: 'personal', parts: ['Fradi', '2009', '!'],
      bio: ['Kedvenc csapat: <b>Fradi</b> 💚 (a profilképe is zöld-fehér)', 'Született: <b>2009</b>', 'Macskája: <b>Pityu</b>'], chips: ['Dani', 'Varga', 'Fradi', 'Pityu', '2009', '123', '!', '?'],
      leak: { len: 10, set: 95, txt: '10 karakter, kis- és nagybetű, szám, írásjel' }, why: 'Hiába van benne nagybetű, szám és felkiáltójel: a <b>csapat + évszám + !</b> a leggyakoribb minta. A „bonyolultnak látszó” jelszó is lehet kitalálható.' },
    { who: 'Kiss Gábor', role: 'igazgató', av: 'user', col: '#fb923c', pw: 'Balaton1987', kind: '2fa', parts: ['Balaton', '1987'],
      bio: ['Minden nyáron a <b>Balaton</b>nál nyaral', 'Született: <b>1987</b>', '<b>Kétlépcsős azonosítás bekapcsolva</b> (kód a telefonra)'], chips: ['Gabor', 'Kiss', 'Balaton', 'igazgato', '1987', '123', '!'],
      leak: { len: 11, set: 62, txt: '11 karakter, kis- és nagybetű, szám' }, why: 'A jelszava gyenge (nyaralóhely + évszám), de a <b>kétlépcsős azonosítás</b> megvédte: a belépéshez a telefonjára érkező kód is kell.' }
  ];
  const COST = { dict: 4, guess: 3, brute: 6, safe: 0 };
  let G = null, best = 0, racing = false, view = 'game', fake = null;
  const order = () => { const a = TARGETS.slice(0, 2), b = TARGETS.slice(2); for (let i = b.length - 1; i > 0; i--) { const j = rnd(0, i);[b[i], b[j]] = [b[j], b[i]] } return a.concat(b) };

  /* ---------- segédek ---------- */
  function human(sec) {
    if (sec < 1) return 'kevesebb mint 1 másodperc';
    const u = [['másodperc', 60], ['perc', 60], ['óra', 24], ['nap', 365], ['év', 1e3], ['ezer év', 1e3], ['millió év', 1e3], ['milliárd év', 1e3], ['billió év', Infinity]];
    let v = sec, i = 0; while (i < u.length - 1 && v >= u[i][1]) { v /= u[i][1]; i++ }
    return (v < 10 ? v.toFixed(1).replace('.', ',') : Math.round(v).toLocaleString('hu-HU')) + ' ' + u[i][0];
  }
  const bruteSec = lk => Math.pow(lk.set, lk.len) / 2 / GUESS;
  function log(t, cls = '') { const l = $('#pd-log'); if (!l) return; const d = document.createElement('div'); d.className = cls; d.innerHTML = t; l.prepend(d); while (l.children.length > 40) l.lastChild.remove() }

  /* ---------- játék ---------- */
  function start() {
    G = { list: order(), i: 0, t: window.EASY ? 150 : 100, pts: 0, res: [], guess: [], tries: 0, on: true, lock: false };
    $('#pd-over').style.display = 'none'; $('#pd-log').innerHTML = ''; log('Törőgép online. Megbízás: 6 iskolai fiók biztonsági tesztje.', 'ok'); show();
  }
  const cur = () => G.list[G.i];
  function show() {
    const t = cur(); G.guess = []; G.tries = 0; G.lock = false;
    $('#pd-prog').innerHTML = G.list.map((x, k) => `<span class="${k === G.i ? 'on' : G.res[k] ? G.res[k].ok ? 'ok' : 'bad' : ''}">${k + 1}</span>`).join('');
    $('#pd-card').innerHTML = `<div class="pd-ph"><span class="pd-av" style="--c:${t.col}">${icon(t.av, 34, 1.8)}</span><div><b>${t.who}</b><small>${t.role}</small></div></div>
      <div class="pd-bio">${t.bio.map(x => `<div>${x}</div>`).join('')}</div>
      <div class="pd-leak">${icon('search', 16, 2)} <span><b>Kiszivárgott adat a jelszóról:</b> ${t.leak.txt}</span></div>`;
    $('#pd-chips').innerHTML = t.chips.map(c => `<button class="btn pd-chip" data-c="${esc(c)}">${esc(c)}</button>`).join('');
    $$('.pd-chip').forEach(b => b.onclick = () => { if (G.lock || G.guess.length >= 4) return; G.guess.push(b.dataset.c); sfx.blip(); guessUI() });
    guessUI(); hud();
  }
  function guessUI() { $('#pd-guess').innerHTML = G.guess.length ? G.guess.map(x => `<span>${esc(x)}</span>`).join('') : '<i>Kattints a darabokra, és rakd össze a tippedet…</i>'; $('#pd-try').disabled = !G.guess.length || G.lock; $('#pd-undo').disabled = !G.guess.length || G.lock }
  function hud() { if (!G) return; $('#pd-time').textContent = Math.max(0, Math.ceil(G.t)); $('#pd-time').style.color = G.t < 20 ? 'var(--red)' : ''; $('#pd-pts').textContent = G.pts; $$('.pd-act').forEach(b => b.disabled = !G.on || G.lock) }
  function spend(s) { G.t -= s; hud(); if (G.t <= 0) end() }
  // a törőgép animációja, utána az eredmény
  function crackAnim(ms, cb) {
    G.lock = true; hud(); guessUI(); clearInterval(fake); const el = $('#pd-crack'), chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%', len = cur().leak.len; let n = 0;
    fake = setInterval(() => { n++; let g = ''; for (let i = 0; i < len; i++) g += chars[rnd(0, chars.length - 1)]; el.textContent = `[${String(n * 7919).padStart(9, '0')}] ${g}`; if (n % 2) sfx.blip() }, 50);
    setTimeout(() => { clearInterval(fake); G.lock = false; cb(); hud(); guessUI() }, ms);
  }
  function solved(how) {
    const t = cur();
    if (t.kind === '2fa') { $('#pd-crack').innerHTML = `<b style="color:var(--yellow)">JELSZÓ STIMMEL… de SMS-kód kell!</b>`; log(`${t.who}: a jelszó <b>${esc(t.pw)}</b> – de a kétlépcsős azonosítás megállított.`, 'warn'); toast('A jelszó jó, de a belépéshez a telefonjára érkező kód is kell. A fiók védett – jelöld biztonságosnak!', '#fbbf24', 4200); sfx.bad(); G.knew2fa = true; return }
    const bonus = Math.max(0, 40 - G.tries * 10); G.pts += 100 + bonus; sfx.ok();
    $('#pd-crack').innerHTML = `<b style="color:var(--red)">FELTÖRVE: ${esc(t.pw)}</b>`; log(`${t.who}: feltörve (${how}) → <b>${esc(t.pw)}</b>  +${100 + bonus}`, 'ok');
    next({ ok: true, how });
  }
  function next(r) { const t = cur(); G.res[G.i] = { ...r, t }; G.knew2fa = false; G.lock = true; hud(); setTimeout(() => { if (!G.on) return; toast(t.why, r.ok ? '#4ade80' : '#f87171', 5200); G.i++; if (G.i >= G.list.length) end(); else show() }, 900) }
  function dict() {
    if (G.lock) return; const t = cur(); spend(COST.dict); if (!G.on) return; log(`Szótáras támadás: a ${COMMON.length * 2000} leggyakoribb jelszó kipróbálása…`);
    crackAnim(900, () => { if (COMMON.includes(t.pw.toLowerCase())) solved('szótáras támadás'); else { $('#pd-crack').innerHTML = '<span style="color:#94a3b8">Nincs a gyakori jelszavak között.</span>'; log('Nem volt a listán.', 'err'); sfx.bad() } });
  }
  function brute() {
    if (G.lock) return; const t = cur(), sec = bruteSec(t.leak); spend(COST.brute); if (!G.on) return; log(`Nyers erő: minden ${t.leak.len} karakteres kombináció (${t.leak.set} féle jel)…`);
    crackAnim(1100, () => {
      if (sec < 60) solved(`nyers erő, ${human(sec)}`);
      else { $('#pd-crack').innerHTML = `<span style="color:var(--yellow)">Ehhez <b>${human(sec)}</b> kellene. Feladva.</span>`; log(`Nyers erő: ${human(sec)} kellene – reménytelen.`, 'err'); sfx.bad() }
    });
  }
  function tryGuess() {
    if (G.lock || !G.guess.length) return; const t = cur(), g = G.guess.join(''); G.tries++; spend(COST.guess); if (!G.on) return; log(`Tipp: <b>${esc(g)}</b>`);
    if (g === t.pw) { crackAnim(500, () => solved('személyes adatokból')); return }
    // visszajelzés: hány darab szerepel a jelszóban (könnyű módban azt is, melyik)
    const parts = t.parts || [], hit = G.guess.filter(x => parts.includes(x)), all = parts.length && hit.length === parts.length;
    let msg = !parts.length ? 'Egyik darab sem szerepel a jelszóban.' : hit.length ? `${hit.length} darab stimmel${window.EASY ? ` (${hit.map(esc).join(', ')})` : ''}${all ? ', de a sorrend vagy a többi darab nem jó!' : '.'}` : 'Egyik darab sem szerepel a jelszóban.';
    if (t.kind === 'common' && G.guess.some(x => x.toLowerCase() === t.pw)) msg = 'Közel jársz… pontosan így, kisbetűvel? Vagy próbáld a gyakori jelszavak listáját!';
    $('#pd-crack').innerHTML = `<span style="color:#fbbf24">Nem jó. ${msg}</span>`; sfx.bad(); G.guess = []; guessUI();
  }
  function markSafe() {
    if (G.lock) return; const t = cur(), ok = t.kind === 'strong' || t.kind === '2fa';
    if (ok) { G.pts += 150; sfx.ok(); log(`${t.who}: biztonságosnak jelölve – helyes!  +150`, 'ok'); $('#pd-crack').innerHTML = `<b style="color:var(--green)">Helyes: ez a fiók tényleg védett.</b>` }
    else { G.pts = Math.max(0, G.pts - 60); sfx.bad(); log(`${t.who}: biztonságosnak jelölted, pedig a jelszó <b>${esc(t.pw)}</b> volt!  −60`, 'err'); $('#pd-crack').innerHTML = `<b style="color:var(--red)">Tévedés! A jelszó ez volt: ${esc(t.pw)}</b>` }
    next({ ok, how: ok ? 'biztonságosnak jelölve' : 'tévesen biztonságosnak jelölve' });
  }
  function end() {
    if (!G.on) return; G.on = false; clearInterval(fake); const sc = Math.round(G.pts + Math.max(0, G.t) * 3); best = Math.max(best, sc);
    const nOk = G.res.filter(r => r && r.ok).length;
    if (racing) { racing = false; Comp.finish(sc, `${nOk}/6 fiók helyesen megítélve, ${Math.max(0, Math.ceil(G.t))} mp maradt`) }
    if (nOk >= 5) { sfx.win(); FX.confetti() } else sfx.ok();
    const o = $('#pd-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card" style="max-width:860px"><h2>${nOk >= 5 ? 'Profi etikus hekker!' : nOk >= 3 ? 'Jó munka!' : 'Lejárt az idő…'}</h2><p>${nOk}/6 fiók helyesen megítélve • <b>${sc} pont</b>${G.t > 0 ? ` (maradék idő bónusz: ${Math.round(G.t * 3)})` : ''}</p>
      <div class="pd-sum">${G.list.map((t, k) => { const r = G.res[k]; return `<div class="${r ? r.ok ? 'ok' : 'bad' : ''}"><b>${t.who}</b><code>${esc(t.pw)}</code><span>${t.why}</span></div>` }).join('')}</div>
      <div class="learn"><b>A tanulság:</b> a jó jelszó <b>hosszú</b> (legalább 12 karakter), <b>véletlenszerű</b>, és nincs benne semmi, ami rólad kiderülhet (háziállat, évszám, kedvenc csapat). Minden oldalhoz más kell – ezt egy <b>jelszókezelő</b> jegyzi meg helyetted. A <b>kétlépcsős azonosítás</b> akkor is véd, ha a jelszó kiszivárog.</div>
      <div style="margin-top:14px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn go" id="pd-again">Újra ▶</button><button class="btn" id="pd-tolab">Jelszó-labor: milyen erős a te ötleted?</button></div></div>`;
    $('#pd-again').onclick = start; $('#pd-tolab').onclick = () => { o.style.display = 'none'; setView('lab') };
  }
  function intro() {
    const o = $('#pd-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card" style="max-width:720px"><h2>Jelszó-detektív</h2>
      <p style="font-size:17px">Egy iskola <b>etikus hekkernek</b> kért fel: teszteld hat fiók jelszavát! Minden fióknál válassz módszert:</p>
      <div class="pd-how"><div>${icon('book', 22)}<b>Gyakori jelszavak</b><span>Szótáras támadás a legnépszerűbb jelszavakkal. −${COST.dict} mp</span></div>
      <div>${icon('user', 22)}<b>Személyes adatokból</b><span>Rakd össze a tippet a profilban látott adatokból! −${COST.guess} mp / tipp</span></div>
      <div>${icon('bolt', 22)}<b>Nyers erő</b><span>Minden kombináció kipróbálása – csak rövid jelszónál működik. −${COST.brute} mp</span></div>
      <div>${icon('shield', 22)}<b>Ez biztonságos!</b><span>Ha szerinted nem törhető fel. Helyes: +150, tévedés: −60 pont.</span></div></div>
      <p style="font-size:14px;color:var(--muted)">Minden szereplő és jelszó kitalált. Idő: ${window.EASY ? 150 : 100} másodperc.</p>
      <button class="btn go" id="pd-start" style="font-size:24px">Kezdjük! ▶</button></div>`;
    $('#pd-start').onclick = () => { sfx.click(); start() };
  }

  /* ---------- Jelszó-labor: a saját ötlet tesztelése ---------- */
  function analyze(pw) {
    const low = pw.toLowerCase();
    let cs = 0; if (/[a-z]/.test(pw)) cs += 26; if (/[A-Z]/.test(pw)) cs += 26; if (/[0-9]/.test(pw)) cs += 10;
    if (/[^a-zA-Z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/.test(pw)) cs += 33; if (/[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/.test(pw)) cs += 18;
    let bits = pw.length * Math.log2(Math.max(cs, 1)), reason = '';
    const base = low.replace(/[0-9!?.@#_\-]+$/, '').replace(/^[0-9]+/, '');
    if (COMMON.includes(low) || COMMON.includes(base) && base.length >= 3) { bits = Math.min(bits, 12); reason = 'Ez rajta van a leggyakoribb jelszavak listáján – a szótáras támadás azonnal megtalálja!' }
    else if (/^(.)\1+$/.test(pw)) { bits = Math.min(bits, 8); reason = 'Csupa ugyanolyan karakter – ezt azonnal kitalálják.' }
    else if (/^(0123|1234|2345|abcd|qwer|asdf)/i.test(pw)) { bits *= .5; reason = 'Billentyűzet-sor vagy számsor – a törőprogramok ezt is ismerik.' }
    else if (/^[A-ZÁÉÍÓÖŐÚÜŰ]?[a-záéíóöőúüű]+((19|20)\d\d|\d{1,4})?[!?.]?$/.test(pw)) { bits = Math.min(bits, 30); reason = 'Szó + évszám/szám + írásjel: ez a leggyakoribb minta (mint a Jelszó-detektívben). Ha a szó rólad szól, még könnyebb kitalálni!' }
    else if (/(19|20)\d\d/.test(pw)) { bits -= 8; reason = 'Évszám van benne? A támadók először a születési éveket próbálják.' }
    return { bits: Math.max(0, bits), cs, reason };
  }
  function labUpdate() {
    const pw = $('#p-in').value;
    const checks = [[pw.length >= 12, 'Legalább 12 karakter'], [/[a-z]/.test(pw) && /[A-Z]/.test(pw), 'Kis- és nagybetű is'], [/[0-9]/.test(pw), 'Szám is van benne'], [/[^a-zA-Z0-9]/.test(pw), 'Írásjel vagy ékezet'], [pw && !COMMON.includes(pw.toLowerCase()), 'Nem közismert jelszó'], [pw && !/(19|20)\d\d/.test(pw), 'Nincs benne évszám']];
    $('#p-checks').innerHTML = checks.map(([ok, t]) => `<div class="${ok ? 'ok' : ''}">${icon(ok ? 'check' : 'circle', 18, 2.4)} ${t}</div>`).join('');
    if (!pw) { $('#p-time').textContent = '–'; $('#p-meter').style.width = '0%'; $('#p-why').textContent = ''; $('#p-bits').textContent = ''; return }
    const a = analyze(pw), sec = Math.pow(2, a.bits) / 2 / GUESS, txt = human(sec);
    $('#p-time').textContent = sec < 1 ? 'azonnal' : txt;
    const col = a.bits < 35 ? 'var(--red)' : a.bits < 55 ? 'var(--orange)' : a.bits < 70 ? 'var(--yellow)' : 'var(--green)';
    $('#p-meter').style.width = clamp(a.bits / 90 * 100, 3, 100) + '%'; $('#p-meter').style.background = col; $('#p-time').style.color = col;
    $('#p-why').innerHTML = a.reason || (sec > 4.3e17 ? 'Ez tovább tartana, mint amióta a <b>világegyetem létezik</b>!' : a.bits >= 70 ? 'Nagyon erős jelszó!' : 'Hosszabb jelszóval sokkal erősebb lenne.');
    $('#p-bits').textContent = `${pw.length} karakter • ${a.cs} féle jel`;
  }
  function genPw() { const ch = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!#$%&?'; let s = ''; const a = new Uint32Array(14); crypto.getRandomValues(a); a.forEach(x => s += ch[x % ch.length]); return s }
  function setView(v) { view = v; $('#pd-game').style.display = v === 'game' ? '' : 'none'; $('#pd-lab').style.display = v === 'lab' ? '' : 'none'; $$('.pd-tab').forEach(b => b.classList.toggle('on', b.dataset.v === v)); if (v === 'lab') { $('#pd-over').style.display = 'none'; setTimeout(() => $('#p-in').focus(), 50) } else if (!G || !G.on) intro() }

  S.build = root => {
    root.innerHTML = `<style>
      #pd{position:absolute;inset:0;display:flex;flex-direction:column}
      #pd-tabs{display:flex;gap:8px;justify-content:center;padding:10px 12px 0}.pd-tab{font-size:15px}.pd-tab.on{border-color:var(--orange);color:var(--orange);box-shadow:0 0 16px #fb923c44}
      #pd-game{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr) minmax(0,.9fr);gap:12px;padding:12px;overflow:auto}
      @media(max-width:1000px){#pd-game{grid-template-columns:1fr}}
      #pd-card .pd-ph{display:flex;gap:12px;align-items:center}.pd-av{width:60px;height:60px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 22%,transparent);color:var(--c);border:2px solid var(--c);flex:none}
      #pd-card .pd-ph b{font-size:21px}#pd-card small{display:block;color:var(--muted);font-size:14px}
      .pd-bio{margin-top:12px;display:flex;flex-direction:column;gap:6px}.pd-bio div{background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:8px 11px;font-size:15px}.pd-bio b{color:var(--yellow)}
      .pd-leak{margin-top:12px;display:flex;gap:8px;align-items:flex-start;font-size:14px;color:#fde68a;background:rgba(250,204,21,.08);border:1px solid rgba(250,204,21,.35);border-radius:10px;padding:8px 11px}.pd-leak svg{flex:none;margin-top:2px}
      #pd-prog{display:flex;gap:6px;margin-bottom:10px}#pd-prog span{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--panel2);font-weight:800;font-size:13px}#pd-prog .on{background:var(--orange);color:#111}#pd-prog .ok{background:#16a34a;color:#fff}#pd-prog .bad{background:#b91c1c;color:#fff}
      .pd-acts{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pd-act{display:flex;flex-direction:column;align-items:flex-start;gap:2px;height:auto!important;padding:10px 12px!important;text-align:left;white-space:normal}.pd-act b{font-size:15.5px;display:flex;gap:6px;align-items:center}.pd-act small{font-size:12px;color:var(--muted)}
      .pd-act.safe{border-color:#16a34a}
      .pd-comp{margin-top:12px;background:var(--bg2);border:1px solid var(--line);border-radius:14px;padding:10px}.pd-comp h4{margin:0 0 6px;font-size:14px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
      #pd-chips{display:flex;flex-wrap:wrap;gap:6px}.pd-chip{font-family:var(--mono);font-size:15px;padding:6px 10px;min-height:0}
      #pd-guess{margin:10px 0 8px;min-height:44px;display:flex;flex-wrap:wrap;gap:3px;align-items:center;background:#08090b;border:2px dashed var(--line2);border-radius:10px;padding:6px 10px;font-family:var(--mono);font-size:20px}#pd-guess span{background:#1e293b;border-radius:6px;padding:2px 6px;color:#fde68a}#pd-guess i{font-family:var(--font);font-size:13.5px;color:var(--muted)}
      .pd-gb{display:flex;gap:8px}.pd-gb .btn{flex:1}
      #pd-crack{font-family:var(--mono);font-size:16px;background:#000;color:#4ade80;border-radius:10px;padding:10px;margin-top:12px;min-height:44px}
      .pd-hud{display:flex;gap:10px}.pd-hud div{flex:1;background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:6px 10px;text-align:center}.pd-hud small{display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}.pd-hud b{font-size:28px;font-variant-numeric:tabular-nums}
      #pd-log{margin-top:10px;font-family:var(--mono);font-size:12.5px;line-height:1.5;background:#08090b;border-radius:12px;padding:8px;color:#a3a8b3;height:calc(100% - 90px);min-height:160px;overflow:auto}#pd-log .ok{color:#4ade80}#pd-log .err{color:#f87171}#pd-log .warn{color:#fbbf24}
      .pd-how{display:grid;grid-template-columns:1fr 1fr;gap:8px;text-align:left;margin:10px 0}.pd-how div{display:grid;grid-template-columns:26px 1fr;gap:2px 8px;background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:8px 10px}.pd-how svg{grid-row:span 2;color:var(--orange)}.pd-how b{font-size:15px}.pd-how span{font-size:13px;color:var(--muted)}
      .pd-sum{display:flex;flex-direction:column;gap:6px;text-align:left;margin:10px 0;max-height:42vh;overflow:auto}.pd-sum div{display:grid;grid-template-columns:130px 150px 1fr;gap:10px;align-items:center;background:var(--bg2);border-left:4px solid var(--line2);border-radius:8px;padding:6px 10px;font-size:13px}.pd-sum div.ok{border-left-color:#16a34a}.pd-sum div.bad{border-left-color:#dc2626}.pd-sum code{font-family:var(--mono);color:#fde68a;font-size:13.5px;word-break:break-all}.pd-sum span{color:#c9ccd3}
      @media(max-width:760px){.pd-sum div{grid-template-columns:1fr}.pd-how{grid-template-columns:1fr}}
      #pd-lab{flex:1;min-height:0;overflow:auto}
      #p-wrap{max-width:1100px;margin:0 auto;padding:16px 22px;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:18px;align-content:start}@media(max-width:900px){#p-wrap{grid-template-columns:1fr}}
      #p-in{width:100%;font-size:30px;padding:14px 18px;border-radius:16px;border:3px solid var(--line);background:#101216;color:var(--text);font-family:var(--mono)}#p-in:focus{outline:none;border-color:var(--orange)}
      .p-warn{font-size:14px;color:var(--yellow);margin:8px 0 0}#p-res{margin-top:16px;text-align:center}#p-time{font-size:42px;font-weight:900;margin:6px 0}
      .p-mb{height:22px;background:#1c1f26;border-radius:11px;overflow:hidden}#p-meter{height:100%;width:0;transition:width .3s,background .3s}
      #p-why{font-size:17px;margin-top:10px;color:#c9ccd3}#p-bits{font-size:13px;color:var(--muted);margin-top:6px}
      #p-checks div{font-size:17px;padding:4px 0;color:var(--muted);display:flex;gap:10px;align-items:center}#p-checks .ok{color:var(--green)}
      .p-ex{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;align-items:center}.p-ex .btn{font-size:14px;padding:6px 10px;font-family:var(--mono)}
    </style>
    <div id="pd">
      <div id="pd-tabs"><button class="btn pd-tab on" data-v="game">${icon('search', 18)} Jelszó-detektív (játék)</button><button class="btn pd-tab" data-v="lab">${icon('lock', 18)} Jelszó-labor (teszteld a sajátodat)</button></div>
      <div id="pd-game">
        <div class="panel"><div id="pd-prog"></div><div id="pd-card"></div></div>
        <div class="panel">
          <div class="pd-acts">
            <button class="btn pd-act" id="pd-dict"><b>${icon('book', 18)} Gyakori jelszavak</b><small>szótáras támadás • −${COST.dict} mp</small></button>
            <button class="btn pd-act" id="pd-brute"><b>${icon('bolt', 18)} Nyers erő</b><small>minden kombináció • −${COST.brute} mp</small></button>
            <button class="btn pd-act safe" id="pd-safe" style="grid-column:1/-1"><b>${icon('shield', 18)} Ez a fiók biztonságos!</b><small>ha szerinted nem törhető fel • helyes: +150, tévedés: −60</small></button>
          </div>
          <div class="pd-comp"><h4>${icon('user', 14)} Tipp személyes adatokból (−${COST.guess} mp)</h4><div id="pd-chips"></div><div id="pd-guess"></div>
            <div class="pd-gb"><button class="btn" id="pd-undo">Visszavon</button><button class="btn go" id="pd-try">Kipróbálom ▶</button></div></div>
          <div id="pd-crack">A törőgép várakozik…</div>
        </div>
        <div class="panel"><div class="pd-hud"><div><small>Idő</small><b id="pd-time">–</b></div><div><small>Pont</small><b id="pd-pts">0</b></div></div><div id="pd-log"></div></div>
      </div>
      <div id="pd-lab" style="display:none"><div id="p-wrap">
        <div class="panel">
          <h2 style="margin:0 0 10px;font-size:26px">Milyen erős a jelszóötleted?</h2>
          <input id="p-in" placeholder="Írj be egy jelszóötletet…" autocomplete="off" spellcheck="false">
          <div class="p-warn">Ne a saját, igazi jelszavadat írd be! Találj ki egy hasonlót.</div>
          <div class="p-ex">Próbáld ki: <button class="btn">123456</button><button class="btn">Morzsi2010</button><button class="btn">Fradi2009!</button><button class="btn">k7q2</button><button class="btn">r7#Qm!x2V$k9pL</button><button class="btn" id="p-gen" style="font-family:var(--font)">${icon('refresh', 15)} Generálj egy erőset</button></div>
          <div id="p-res"><div style="color:var(--muted);font-size:16px">Egy profi törőgépnek ennyi idő kell:</div><div id="p-time">–</div><div class="p-mb"><div id="p-meter"></div></div><div id="p-why"></div><div id="p-bits"></div></div>
        </div>
        <div class="panel"><h3 style="margin:0 0 8px;color:var(--yellow)">Jó jelszó ellenőrzőlista</h3><div id="p-checks"></div>
          <div class="learn"><b>A hossz a legfontosabb!</b> Minden új karakter sokszorosára növeli a lehetőségek számát. A profi jelszó <b>hosszú és véletlenszerű</b> – ilyet egy <b>jelszókezelő</b> generál és jegyez meg helyetted.<br><br><b>Vigyázat:</b> a becslés csak a nyers erőt számolja. Ha a jelszavadban olyan szó vagy évszám van, ami rólad kiderülhet (háziállat, csapat, születésnap), a támadó <b>kitalálhatja</b> – ahogy te is a Jelszó-detektívben.<br><br>A számítás 100 milliárd próbálkozást feltételez másodpercenként (videókártyás törőgép). Még biztonságosabb: <b>kétlépcsős azonosítás</b>, és minden oldalhoz más jelszó.</div>
        </div>
      </div></div>
      <div class="big-overlay" id="pd-over" style="display:none"></div>
    </div>`;
    $$('.pd-tab', root).forEach(b => b.onclick = () => { if (racing && b.dataset.v === 'lab') { toast('Verseny közben előbb fejezd be a játékot!', '#fbbf24', 1600); return } sfx.click(); setView(b.dataset.v) });
    $('#pd-dict').onclick = dict; $('#pd-brute').onclick = brute; $('#pd-safe').onclick = markSafe; $('#pd-try').onclick = tryGuess;
    $('#pd-undo').onclick = () => { if (G && !G.lock) { G.guess.pop(); guessUI() } };
    $('#p-in').oninput = () => { labUpdate(); sfx.blip() };
    $$('.p-ex .btn:not(#p-gen)', root).forEach(b => b.onclick = () => { $('#p-in').value = b.textContent; labUpdate(); sfx.click() });
    $('#p-gen').onclick = () => { $('#p-in').value = genPw(); labUpdate(); sfx.click() };
    labUpdate(); setView('game');
  };
  S.enter = () => { if (view === 'game' && (!G || !G.on)) intro() };
  S.tick = dt => { if (!G || !G.on || G.lock) return; G.t -= dt; if (Math.ceil(G.t) !== +$('#pd-time').textContent) hud(); if (G.t <= 0) end() };
  S.leave = () => { clearInterval(fake); if (G && G.on) G.on = false; racing = false };
  S.score = () => best;
  S.comp = { rules: 'Jelszó-detektív: ítéld meg helyesen mind a 6 fiókot! Pont jár minden feltört gyenge fiókért és minden helyesen biztonságosnak jelölt fiókért, plusz a megmaradt időért.', start: () => { racing = true; setView('game'); start() } };
  S.comp.live = () => racing && G ? G.pts : 0;
  return S;
})());
