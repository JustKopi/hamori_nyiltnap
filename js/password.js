/* ===== 6. Jelszó-detektív: törd fel a gyenge fiókokat, ismerd fel az erőseket – kvízkérdésekkel, utána a saját ötlet tesztelése ===== */
App.add((() => {
  const S = {
    id: 'jelszo', icon: '', title: 'Jelszó-detektív', color: '#fb923c',
    desc: 'Etikus hekker vagy: tesztelj hat kitalált fiókot! Melyiket lehet feltörni, és melyik biztonságos? Közben kvízkérdések, a végén kiderül, mennyit érne a te jelszóötleted.',
    topic: 'Hálózatbiztonság, erős jelszavak, szótáras és nyers erős támadás, kétlépcsős azonosítás'
  };
  const COMMON = ['123456', '123456789', '12345678', '12345', '1234', 'password', 'jelszo', 'jelszó', 'qwerty', 'qwertz', 'abc123', '111111', '000000', 'iloveyou', 'admin', 'szeretlek', 'macska', 'kutya', 'cica', 'asdfgh', 'asd123', 'monkey', 'dragon', 'football', 'letmein', 'welcome', 'login', 'princess', 'sunshine', 'master', 'hello', 'szia', 'budapest', 'magyarorszag', 'ferencvaros', 'fradi', 'minecraft', 'fortnite', 'roblox', 'pokemon', 'barcelona', 'messi', 'ronaldo', 'anyu', 'apu', 'titok'];
  const GUESS = 1e11; // próbálkozás/másodperc – erős, videókártyás törőgép
  const COST = { dict: 4, guess: 3, brute: 6 };

  /* ---------- véletlen szereplők és jelszavak ---------- */
  const R = a => a[Math.floor(Math.random() * a.length)];
  const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i);[a[i], a[j]] = [a[j], a[i]] } return a };
  const KIDS = ['Bence', 'Lili', 'Dani', 'Anna', 'Máté', 'Zsófi', 'Levente', 'Hanna', 'Noel', 'Emma', 'Olivér', 'Luca', 'Gergő', 'Réka', 'Ádám', 'Panna', 'Marci', 'Dóri', 'Kristóf', 'Boglárka'];
  const SUR = ['Kovács', 'Szabó', 'Nagy', 'Tóth', 'Varga', 'Kiss', 'Molnár', 'Horváth', 'Farkas', 'Balogh', 'Papp', 'Lakatos', 'Takács', 'Juhász', 'Mészáros', 'Oláh', 'Simon', 'Fekete'];
  const PETS = [['Bodri', 'Kutyája'], ['Morzsi', 'Kutyája'], ['Buksi', 'Kutyája'], ['Frakk', 'Kutyája'], ['Csoki', 'Kutyája'], ['Cirmi', 'Macskája'], ['Pötyi', 'Macskája'], ['Mázli', 'Macskája'], ['Szuszi', 'Macskája'], ['Füles', 'Nyuszija'], ['Pamacs', 'Hörcsöge'], ['Kiwi', 'Papagája']];
  const TEAMS = ['Fradi', 'Barca', 'Real', 'Liverpool', 'Arsenal', 'Bayern', 'Juve', 'Milan'];
  const HOBBY = ['Minecraft', 'Roblox', 'Fortnite', 'Pokemon', 'Lego', 'Gitar', 'Foci', 'Rajz', 'Tanc', 'Kosar'];
  const HOBBYTXT = { Minecraft: 'a Minecraft', Roblox: 'a Roblox', Fortnite: 'a Fortnite', Pokemon: 'a Pokémon', Lego: 'a Lego', Gitar: 'a gitározás', Foci: 'a foci', Rajz: 'a rajzolás', Tanc: 'a tánc', Kosar: 'a kosárlabda' };
  const MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  const WORDS = ['zsiraf', 'ceruza', 'felho', 'tavasz', 'kalap', 'repulo', 'banan', 'hegy', 'lampa', 'tigris', 'esernyo', 'csiga', 'robot', 'citrom', 'sziget', 'trombita', 'pingvin', 'vulkan', 'kakaos', 'bicikli'];
  const AV_KID = ['gamepad', 'heart', 'star', 'music', 'rocket', 'cat', 'trophy', 'camera'], AV_T = ['bulb', 'book', 'code', 'globe', 'chip'];
  const COLS = ['#a78bfa', '#f472b6', '#fbbf24', '#4ade80', '#38bdf8', '#fb923c', '#f87171', '#22d3ee'];
  const randStr = (n, set) => { let s = ''; const a = new Uint32Array(n); crypto.getRandomValues(a); a.forEach(x => s += set[x % set.length]); return s };
  const LOWNUM = 'abcdefghijkmnpqrstuvwxyz23456789', ALL = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!#$%&?*@';
  // a jelszó leírása a „nyomhoz”: hossz + jelkészlet (ebből számol a nyers erő)
  function leakOf(pw) {
    const lo = /[a-z]/.test(pw), up = /[A-Z]/.test(pw), d = /[0-9]/.test(pw), sym = /[^a-zA-Z0-9]/.test(pw);
    const set = (lo ? 26 : 0) + (up ? 26 : 0) + (d ? 10 : 0) + (sym ? 33 : 0);
    const kinds = [lo && 'kisbetű', up && 'nagybetű', d && 'szám', sym && 'írásjel'].filter(Boolean);
    return { len: pw.length, set, txt: `${pw.length} karakter, ${kinds.length === 1 ? 'csak ' + kinds[0] : kinds.join(', ')}` };
  }
  function makeTarget(kind) {
    const teacher = Math.random() < .3, first = R(KIDS), sur = R(SUR), [pet, petW] = R(PETS), team = R(TEAMS), hobby = R(HOBBY);
    const year = String(teacher ? rnd(1972, 1995) : rnd(2010, 2015)), mo = rnd(1, 12), day = rnd(1, 28), mmdd = String(mo).padStart(2, '0') + String(day).padStart(2, '0');
    const t = { kind, who: `${sur} ${first}`, role: teacher ? R(['matektanár', 'informatikatanár', 'történelemtanár', 'osztályfőnök', 'könyvtáros']) : `${rnd(5, 8)}.${R(['a', 'b', 'c'])} osztályos tanuló`, av: R(teacher ? AV_T : AV_KID), col: R(COLS) };
    const facts = { pet: `${petW}: <b>${pet}</b>`, year: `Született: <b>${year}</b>. ${MONTHS[mo - 1]} ${day}. (<b>${mmdd}</b>)`, team: `Kedvenc csapata: <b>${team}</b>`, hobby: `Kedvence: ${HOBBYTXT[hobby]} (<b>${hobby}</b>)`, name: `Becenév: <b>${first}</b>` };
    let bio = shuf(['pet', 'year', 'team', 'hobby']).slice(0, 3).map(k => facts[k]);
    const chipsBase = [first, pet, year, team, hobby, mmdd, '123', '!'];
    if (kind === 'common') {
      t.pw = R(['123456', 'qwertz', 'jelszo', 'szeretlek', 'abc123', '111111', 'minecraft', 'roblox', 'fortnite', 'fradi', 'macska', 'titok']);
      if (['minecraft', 'roblox', 'fortnite'].includes(t.pw)) bio[0] = `Kedvence: <b>${t.pw[0].toUpperCase() + t.pw.slice(1)}</b>`;
      t.why = `A <b>${esc(t.pw)}</b> rajta van a leggyakoribb jelszavak listáján. A támadó ezzel kezdi – azonnal megtalálja!`;
    } else if (kind === 'personal' || kind === '2fa') {
      const pats = [[pet, year], [pet, '123'], [first, year], [team, year, '!'], [hobby, year], [first, pet], [pet, mmdd], [team, '123']];
      t.parts = R(pats); t.pw = t.parts.join('');
      const need = { [pet]: 'pet', [year]: 'year', [team]: 'team', [hobby]: 'hobby', [mmdd]: 'year', [first]: 'name' };
      // minden darab nyoma legyen ott a profilban
      const want = [...new Set(t.parts.map(x => need[x]).filter(Boolean))];
      bio = want.map(k => facts[k]).concat(shuf(['pet', 'year', 'team', 'hobby'].filter(k => !want.includes(k))).map(k => facts[k])).slice(0, 3);
      bio = shuf(bio);
      t.why = kind === '2fa' ? `A jelszó gyenge volt (<b>${esc(t.pw)}</b>), de a <b>kétlépcsős azonosítás</b> megvédte: a telefonra érkező kód nélkül nem lehet belépni.`
        : `A jelszó a profilból kitalálható: <b>${t.parts.map(esc).join(' + ')}</b>. Ami rólad kiderül, azt a támadó is látja!`;
      if (kind === '2fa') bio.push('<b>Kétlépcsős azonosítás bekapcsolva</b> 📱 (belépéskor kód jön a telefonjára)');
    } else if (kind === 'short') {
      t.pw = randStr(rnd(3, 5), LOWNUM); t.why = `Véletlenszerű, de csak <b>${t.pw.length} karakter</b>: a gép a másodperc töredéke alatt végigpróbálja az összes lehetőséget. A <b>hossz</b> a legfontosabb!`;
      bio[2] = R(['„Rövid jelszót használok, mert gyorsan beírható.”', '„Minek bonyolítani? Elég pár betű.”']);
    } else if (kind === 'strong') {
      t.pw = randStr(rnd(13, 16), ALL); if (Math.random() < (window.EASY ? 1 : .5)) bio[2] = R(['Jelszókezelőt használ 🔐', 'Minden oldalhoz más, generált jelszava van']);
    } else if (kind === 'phrase') {
      t.pw = shuf(WORDS).slice(0, 4).join('-'); if (Math.random() < (window.EASY ? 1 : .5)) bio[2] = '„4 véletlen szóból álló jelmondatot használok.”';
    }
    t.leak = leakOf(t.pw);
    if (kind === 'strong') t.why = `${t.pw.length} véletlen karakter, mindenféle jellel: a gépnek <b>${human(bruteSec(t.leak))}</b> kellene hozzá. Ilyet egy <b>jelszókezelő</b> talál ki.`;
    if (kind === 'phrase') t.why = `<b>4 véletlen szó</b> összefűzve: hosszú, mégis könnyű megjegyezni. Végigpróbálni <b>${human(bruteSec(t.leak))}</b> lenne.`;
    t.bio = bio.slice(0, 4); t.chips = shuf([...new Set(chipsBase.concat(t.parts || []))]);
    return t;
  }

  /* ---------- kvízkérdések: [kérdés, [helyes, rossz, rossz], magyarázat] ---------- */
  const QUIZ = [
    ['Elmondhatod a jelszavadat a legjobb barátodnak?', ['Nem, a jelszó titok – senkinek sem mondom el', 'Igen, neki szabad', 'Csak ha megígéri, hogy titokban tartja'], 'A barátság is véget érhet, és a barátod gépe is lehet fertőzött. A jelszó csak a tiéd.'],
    ['Mit csinál a kétlépcsős azonosítás?', ['A jelszó mellé egy kód is kell, pl. a telefonról', 'Kétszer kell beírni a jelszót', 'Két jelszót kell kitalálni'], 'Ha valaki meg is tudja a jelszavad, a telefonod nélkül akkor sem tud belépni.'],
    ['Mi az a jelszókezelő?', ['Program, ami erős jelszavakat talál ki és megjegyez', 'Egy füzet a jelszavaimnak', 'A rendszergazda, aki tudja a jelszavakat'], 'Elég egyetlen erős főjelszót megjegyezned, a többit a program tárolja titkosítva.'],
    ['Használhatod ugyanazt a jelszót mindenhol?', ['Nem, minden oldalhoz más kell', 'Igen, így könnyebb megjegyezni', 'Csak a játékokhoz'], 'Ha egy oldalról kiszivárog, a támadó mindenhol kipróbálja – és mindenhova bejut.'],
    ['E-mail jött: „Add meg a jelszavad, különben töröljük a fiókod!” Mit teszel?', ['Nem adom meg, és szólok egy felnőttnek', 'Gyorsan megadom', 'Visszaírok a jelszavammal'], 'Ez adathalászat. Valódi szolgáltató soha nem kéri el e-mailben a jelszavadat.'],
    ['Mi számít a legtöbbet egy jelszónál?', ['A hossza', 'Hogy szép szó legyen', 'Hogy benne legyen a nevem'], 'Minden új karakter sokszorosára növeli a lehetőségek számát.'],
    ['Melyik NEM jó ötlet jelszónak?', ['A születésnapod', '4 véletlen szó összefűzve', 'Egy jelszókezelő által kitalált jelszó'], 'A születésnapod sokan tudják – és a közösségi oldaladon is látszik.'],
    ['Mi az a szótáras támadás?', ['A gyakori jelszavak és szavak végigpróbálása', 'Amikor valaki szótárt lop', 'Helyesírás-ellenőrzés'], 'Ezért gyenge minden olyan jelszó, ami egy ismert szó vagy gyakori jelszó.'],
    ['Belépve hagytad a fiókodat a suli gépén. Mit teszel?', ['Visszamegyek és kijelentkezem', 'Nem baj, majd valaki kilép', 'Felírom a jelszót egy cetlire a gépre'], 'Aki utánad leül, a nevedben bármit megtehet. Mindig jelentkezz ki!'],
    ['Hol a legjobb tárolni a jelszavaidat?', ['Jelszókezelőben', 'Cetlin a monitoron', 'A tolltartóban'], 'A cetlit bárki elolvashatja, a jelszókezelő titkosítva tárolja őket.'],
    ['Valaki megtudta a jelszavadat. Mi az első lépés?', ['Azonnal megváltoztatom', 'Várok, hátha nem használja', 'Elmondom még valakinek'], 'Minél előbb cseréled, annál kevesebb ideje van visszaélni vele.'],
    ['Látja-e a rendszergazda a jelszavadat?', ['Nem, ő is csak új jelszót állíthat be', 'Igen, bármikor megnézheti', 'Csak hétvégén'], 'A jelszavakat „összekeverve” (hash-elve) tárolják, így senki nem látja őket.'],
    ['Mi az adathalászat?', ['Csaló üzenet, ami a jelszavadat akarja megszerezni', 'Horgászat a Balatonon', 'Adatok mentése pendrive-ra'], 'Ellenőrizd a feladót és a linket, és soha ne add meg a jelszavad egy üzenetre válaszolva!'],
    ['Melyik a jobb jelmondat?', ['zsiraf-ceruza-felho-tavasz', 'en-szeretem-a-focit', 'jelszo-jelszo-jelszo'], 'Az egymáshoz nem illő, véletlen szavakat sokkal nehezebb kitalálni, mint egy értelmes mondatot.'],
    ['Mit tegyél, ha egy oldal azt írja: „Gyenge jelszó”?', ['Hosszabbat és véletlenszerűbbet választok', 'Teszek a végére egy felkiáltójelet', 'Nem foglalkozom vele'], 'Egy ! a végén alig segít – a támadók ezt a mintát is ismerik. A hossz számít.']
  ];
  function genQuiz() {
    const p = makeTarget('personal'), s = randStr(14, ALL), sh = randStr(4, LOWNUM), c = R(['123456', 'qwertz', 'jelszo', 'fradi']);
    return R([
      ['Melyik a legerősebb jelszó?', [s, p.pw, c], `A <b>${esc(s)}</b> hosszú és véletlenszerű. A <b>${esc(p.pw)}</b> személyes adatokból áll, a <b>${esc(c)}</b> pedig gyakori jelszó.`],
      ['Melyiket törné fel LEGGYORSABBAN egy gép, ha mindent végigpróbál?', [sh, p.pw, s], `A <b>${esc(sh)}</b> csak ${sh.length} karakter – a gép pillanatok alatt végigpróbálja az összes lehetőséget.`],
      [`${p.who} profiljában ez áll: ${p.bio.join(' • ').replace(/<[^>]+>/g, '')}. Melyik jelszó a legveszélyesebb neki?`, [p.pw, s, shuf(WORDS).slice(0, 4).join('-')], `A <b>${esc(p.pw)}</b> a profiljából kitalálható – bárki összerakhatja, aki megnézi az oldalát.`]
    ]);
  }

  /* ---------- segédek ---------- */
  function human(sec) {
    if (sec < 1) return 'kevesebb mint 1 másodperc';
    const u = [['másodperc', 60], ['perc', 60], ['óra', 24], ['nap', 365], ['év', 1e3], ['ezer év', 1e3], ['millió év', 1e3], ['milliárd év', 1e3], ['billió év', Infinity]];
    let v = sec, i = 0; while (i < u.length - 1 && v >= u[i][1]) { v /= u[i][1]; i++ }
    return (v < 10 ? v.toFixed(1).replace('.', ',') : Math.round(v).toLocaleString('hu-HU')) + ' ' + u[i][0];
  }
  const bruteSec = lk => Math.pow(lk.set, lk.len) / 2 / GUESS;

  /* ---------- játék ---------- */
  let G = null, best = 0, racing = false, view = 'game', fake = null;
  function start() {
    const kinds = shuf(['common', 'personal', 'short', R(['strong', 'phrase']), '2fa', R(['personal', 'common', 'short', 'strong', 'phrase'])]);
    const accs = kinds.map(makeTarget), qs = shuf(QUIZ).slice(0, 2).concat([genQuiz()]).map(q => ({ q: q[0], ans: q[1][0], opts: shuf(q[1]), why: q[2] }));
    const steps = []; accs.forEach((a, i) => { steps.push({ acc: a }); if (i % 2 === 1) steps.push({ quiz: qs.shift() }) });
    G = { steps, i: 0, t: window.EASY ? 150 : 110, pts: 0, res: [], guess: [], tries: 0, on: true, lock: false, pause: false, nQ: 0 };
    $('#pd-over').style.display = 'none'; show();
  }
  const step = () => G.steps[G.i], cur = () => step().acc;
  function progress() { $('#pd-prog').innerHTML = G.steps.map((s, k) => `<span class="${k === G.i ? 'on' : G.res[k] ? G.res[k].ok ? 'ok' : 'bad' : ''} ${s.quiz ? 'q' : ''}" title="${s.quiz ? 'Kvízkérdés' : 'Fiók'}">${s.quiz ? '?' : icon('user', 15, 2.4)}</span>`).join('') }
  function show() {
    progress(); G.lock = false; G.pause = false; G.guess = []; G.tries = 0; G.fails = 0; $('#pd-res').style.display = 'none';
    const st = step();
    if (st.quiz) {
      G.pause = true; $('#pd-acc').style.display = 'none'; $('#pd-quiz').style.display = '';
      $('#pd-quiz').innerHTML = `<div class="pd-qh">${icon('bulb', 26, 2)} Gyors kérdés</div><div class="pd-qq">${st.quiz.q}</div><div class="pd-qo">${st.quiz.opts.map((o, k) => `<button class="pd-qb" data-k="${k}">${esc(o)}</button>`).join('')}</div>`;
      $$('.pd-qb').forEach(b => b.onclick = () => answerQuiz(st.quiz.opts[+b.dataset.k], b)); hud(); return;
    }
    $('#pd-quiz').style.display = 'none'; $('#pd-acc').style.display = '';
    const t = cur();
    $('#pd-card').innerHTML = `<div class="pd-ph"><span class="pd-av" style="--c:${t.col}">${icon(t.av, 34, 1.8)}</span><div><b>${t.who}</b><small>${t.role}</small></div></div>
      <div class="pd-lbl">A profilja:</div><div class="pd-bio">${t.bio.map(x => `<div>${x}</div>`).join('')}</div>
      <div class="pd-leak">${icon('search', 18, 2)}<span><b>Nyom a jelszóról:</b> ${t.leak.txt}<br><span class="pd-bt ${bruteSec(t.leak) < 60 ? 'fast' : 'slow'}">Ha a gép minden kombinációt végigpróbál: kb. <b>${human(bruteSec(t.leak))}</b>${bruteSec(t.leak) < 60 ? ' – ez gyors!' : ' – ez túl sok idő.'}</span></span></div>`;
    $('#pd-chips').innerHTML = t.chips.map(c => `<button class="pd-chip" data-c="${esc(c)}">${esc(c)}</button>`).join('');
    $$('.pd-chip').forEach(b => b.onclick = () => { if (G.lock || G.guess.length >= 4) return; G.guess.push(b.dataset.c); sfx.blip(); guessUI() });
    $('#pd-crack').innerHTML = '<span class="pd-idle">Nézd meg a profilt és a nyomot, aztán válassz módszert!</span>';
    guessUI(); hud();
  }
  function guessUI() { $('#pd-guess').innerHTML = G.guess.length ? G.guess.map(x => `<span>${esc(x)}</span>`).join('') : '<i>Kattints a darabokra, és rakd össze a tippedet!</i>'; $('#pd-try').disabled = !G.guess.length || G.lock; $('#pd-undo').disabled = !G.guess.length || G.lock }
  function hud() { if (!G) return; $('#pd-time').textContent = Math.max(0, Math.ceil(G.t)); $('#pd-time').style.color = G.t < 20 ? 'var(--red)' : ''; $('#pd-pts').textContent = G.pts; $$('.pd-act').forEach(b => b.disabled = !G.on || G.lock) }
  function spend(s) { G.t -= s; hud(); if (G.t <= 0) end() }
  function crackAnim(ms, cb) {
    G.lock = true; hud(); guessUI(); clearInterval(fake); const el = $('#pd-crack'), len = Math.min(18, cur().leak.len); let n = 0;
    fake = setInterval(() => { n++; el.innerHTML = `<span class="pd-idle">próbálkozás…</span><code>${esc(randStr(len, ALL))}</code>`; if (n % 2) sfx.blip() }, 50);
    setTimeout(() => { clearInterval(fake); if (!G.on) return; G.lock = false; cb(); hud(); guessUI() }, ms);
  }
  // egy fiók vége: eredménylap, a következőre csak gombnyomásra lépünk (van idő elolvasni)
  function result(ok, title, extra) {
    const t = cur(); G.res[G.i] = { ok, t }; G.lock = true; G.pause = true; hud(); progress();
    const r = $('#pd-res'); r.style.display = 'flex'; r.className = ok ? 'good' : 'bad';
    r.innerHTML = `<div class="pd-rt">${icon(ok ? 'check' : 'x', 34, 3)} ${title}</div><div class="pd-rp">A jelszó: <code>${esc(t.pw)}</code></div>${extra ? `<div class="pd-rx">${extra}</div>` : ''}<div class="pd-rw">${t.why}</div><button class="btn go" id="pd-next">Tovább ▶</button>`;
    $('#pd-next').onclick = next;
  }
  function next() { sfx.click(); G.i++; if (G.i >= G.steps.length) end(); else show() }
  function solved(how) {
    const t = cur();
    if (t.kind === '2fa') { $('#pd-crack').innerHTML = `<b style="color:var(--yellow)">📱 A jelszó jó… de a telefonra küldött kód is kell!</b><span>Ezt a fiókot nem tudod feltörni – jelöld biztonságosnak!</span>`; sfx.bad(); return }
    const bonus = Math.max(0, 40 - G.tries * 10); G.pts += 100 + bonus; sfx.ok();
    result(true, `Feltörted! +${100 + bonus} pont`, `Módszer: ${how}`);
  }
  const TIP = { common: 'Ez egy nagyon gyakori jelszó lehet – próbáld a <b>Gyakori jelszavak</b> gombot!', personal: 'A jelszó a profil adataiból áll – rakd össze 2-3 darabból (pl. név, állat, évszám)!', short: 'Nézd meg a nyomot: ilyen rövid jelszót a <b>Minden kombináció</b> gyorsan megtalál!', strong: 'Ha semmi nem működik, és a nyom szerint évekig tartana… lehet, hogy ez a fiók <b>biztonságos</b>!', phrase: 'Ha semmi nem működik, és a nyom szerint évekig tartana… lehet, hogy ez a fiók <b>biztonságos</b>!', '2fa': 'A jelszó a profil adataiból áll – rakd össze 2-3 darabból!' };
  function fail(html) { G.fails++; $('#pd-crack').innerHTML = `<span class="pd-no">${html}</span>` + (G.fails >= 2 ? `<span class="pd-tip">💡 Tipp: ${TIP[cur().kind]}</span>` : ''); sfx.bad() }
  function dict() {
    if (G.lock) return; const t = cur(); spend(COST.dict); if (!G.on) return;
    crackAnim(900, () => { if (COMMON.includes(t.pw.toLowerCase())) solved('gyakori jelszavak listája'); else fail('Nincs a gyakori jelszavak között. Próbálj mást!') });
  }
  function brute() {
    if (G.lock) return; const t = cur(), sec = bruteSec(t.leak); spend(COST.brute); if (!G.on) return;
    crackAnim(1100, () => {
      if (sec < 60) solved(`minden kombináció (${human(sec)} alatt)`);
      else fail(`Ehhez <b>${human(sec)}</b> kellene – túl hosszú! Próbálj mást!`)
    });
  }
  function tryGuess() {
    if (G.lock || !G.guess.length) return; const t = cur(), g = G.guess.join(''); G.tries++; spend(COST.guess); if (!G.on) return;
    if (g === t.pw) { crackAnim(500, () => solved('kitaláltad a profil adataiból')); return }
    const parts = t.parts || [], hit = G.guess.filter(x => parts.includes(x)), all = parts.length && hit.length === parts.length;
    let msg = !parts.length ? 'Ez a jelszó <b>nem a profil adataiból</b> készült – hiába rakod össze a darabokat. Próbálj más módszert!' : hit.length ? `<b>${hit.length}</b> darab stimmel${window.EASY ? ` (${hit.map(esc).join(', ')})` : ''}${all ? ' – de a sorrend vagy a többi darab nem jó!' : '.'}` : 'Egyik darab sem szerepel benne.';
    if (t.kind === 'common' && G.guess.some(x => x.toLowerCase() === t.pw)) msg = 'Közel jársz… de a gyakori jelszavak csupa kisbetűsek. Próbáld a <b>Gyakori jelszavak</b> gombot!';
    fail(`Nem jó. ${msg}`); G.guess = []; guessUI();
  }
  function markSafe() {
    if (G.lock) return; const t = cur(), ok = ['strong', 'phrase', '2fa'].includes(t.kind);
    if (ok) { G.pts += 150; sfx.ok(); result(true, 'Helyes, ez a fiók biztonságos! +150 pont') }
    else { G.pts = Math.max(0, G.pts - 50); sfx.bad(); result(false, 'Hoppá – ezt fel lehetett volna törni! −50 pont', 'Nézd meg, miért volt gyenge:') }
  }
  function answerQuiz(o, btn) {
    if (G.lock) return; G.lock = true; const q = step().quiz, ok = o === q.ans; G.nQ += ok ? 1 : 0; G.res[G.i] = { ok, quiz: q }; if (ok) G.pts += 50;
    $$('.pd-qb').forEach(b => { const v = q.opts[+b.dataset.k]; b.disabled = true; b.classList.toggle('right', v === q.ans); if (b === btn && !ok) b.classList.add('wrong') });
    ok ? sfx.ok() : sfx.bad(); progress(); hud();
    $('#pd-quiz').insertAdjacentHTML('beforeend', `<div class="pd-qw ${ok ? 'good' : 'bad'}"><b>${ok ? 'Helyes! +50 pont.' : 'Nem ez a jó válasz.'}</b> ${q.why}</div><button class="btn go" id="pd-qnext">Tovább ▶</button>`);
    $('#pd-qnext').onclick = next;
  }
  function end() {
    if (!G.on) return; G.on = false; clearInterval(fake); const sc = Math.round(G.pts + Math.max(0, G.t) * 3); best = Math.max(best, sc);
    const accs = G.steps.map((s, k) => ({ s, r: G.res[k] })).filter(x => x.s.acc), nOk = accs.filter(x => x.r && x.r.ok).length, nQ = G.steps.filter(s => s.quiz).length;
    if (racing) { racing = false; Comp.finish(sc, `${nOk}/${accs.length} fiók · ${G.nQ}/${nQ} kvízkérdés · ${Math.max(0, Math.ceil(G.t))} mp maradt`) }
    if (nOk >= 5) { sfx.win(); FX.confetti() } else sfx.ok();
    const o = $('#pd-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card" style="max-width:860px"><h2>${nOk >= 5 ? 'Profi etikus hekker!' : nOk >= 3 ? 'Jó munka!' : G.t <= 0 ? 'Lejárt az idő…' : 'Gyakorolj még!'}</h2><p style="font-size:17px">${nOk}/${accs.length} fiók • ${G.nQ}/${nQ} kvízkérdés • <b>${sc} pont</b></p>
      <div class="pd-sum">${accs.map(({ s, r }) => `<div class="${r ? r.ok ? 'ok' : 'bad' : ''}"><b>${s.acc.who}</b><code>${esc(s.acc.pw)}</code><span>${s.acc.why}</span></div>`).join('')}</div>
      <div class="learn"><b>A tanulság:</b> a jó jelszó <b>hosszú</b> (legalább 12 karakter), <b>véletlenszerű</b>, és nincs benne semmi, ami rólad kiderülhet (háziállat, évszám, kedvenc csapat). Minden oldalhoz más kell – ezt egy <b>jelszókezelő</b> jegyzi meg helyetted. A <b>kétlépcsős azonosítás</b> akkor is véd, ha a jelszó kiszivárog.</div>
      <div style="margin-top:14px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn go" id="pd-again">Új játék (új fiókokkal) ▶</button><button class="btn" id="pd-tolab">Jelszó-labor: milyen erős a te ötleted?</button></div></div>`;
    $('#pd-again').onclick = start; $('#pd-tolab').onclick = () => { o.style.display = 'none'; setView('lab') };
  }
  function intro() {
    const o = $('#pd-over'); o.style.display = 'flex';
    o.innerHTML = `<div class="card" style="max-width:760px"><h2>Jelszó-detektív</h2>
      <p style="font-size:18px">Te vagy az <b>etikus hekker</b>: egy iskola megkért, hogy tesztelj <b>6 fiókot</b>. Minden fióknál válassz:</p>
      <div class="pd-how"><div style="--c:#60a5fa">${icon('book', 26, 2)}<b>Gyakori jelszavak</b><span>Kipróbálod a legnépszerűbb jelszavakat.</span></div>
      <div style="--c:#f472b6">${icon('user', 26, 2)}<b>Kitalálom a profilból</b><span>Összerakod a tippet a profil adataiból.</span></div>
      <div style="--c:#facc15">${icon('bolt', 26, 2)}<b>Minden kombináció</b><span>A gép mindent végigpróbál. Rövid jelszónál gyors!</span></div>
      <div style="--c:#4ade80">${icon('shield', 26, 2)}<b>Ez biztonságos!</b><span>Ha szerinted nem lehet feltörni.</span></div></div>
      <p style="font-size:15px;color:var(--muted)">Közben <b>gyors kérdések</b> is jönnek. Minden játékban <b>új szereplők és jelszavak</b> – mind kitalált!</p>
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
    if (COMMON.includes(low) || COMMON.includes(base) && base.length >= 3) { bits = Math.min(bits, 12); reason = 'Ez rajta van a leggyakoribb jelszavak listáján – azonnal megtalálják!' }
    else if (/^(.)\1+$/.test(pw)) { bits = Math.min(bits, 8); reason = 'Csupa ugyanolyan karakter – ezt azonnal kitalálják.' }
    else if (/^(0123|1234|2345|abcd|qwer|asdf)/i.test(pw)) { bits *= .5; reason = 'Billentyűzet-sor vagy számsor – a törőprogramok ezt is ismerik.' }
    else if (/^[A-ZÁÉÍÓÖŐÚÜŰ]?[a-záéíóöőúüű]+((19|20)\d\d|\d{1,4})?[!?.]?$/.test(pw)) { bits = Math.min(bits, 30); reason = 'Szó + szám + írásjel: ez a leggyakoribb minta (mint a Jelszó-detektívben). Ha a szó rólad szól, még könnyebb kitalálni!' }
    else if (/(19|20)\d\d/.test(pw)) { bits -= 8; reason = 'Évszám van benne? A támadók először a születési éveket próbálják.' }
    return { bits: Math.max(0, bits), cs, reason };
  }
  function labUpdate() {
    const pw = $('#p-in').value;
    const checks = [[pw.length >= 12, 'Legalább 12 karakter'], [/[a-z]/.test(pw) && /[A-Z]/.test(pw), 'Kis- és nagybetű is'], [/[0-9]/.test(pw), 'Szám is van benne'], [/[^a-zA-Z0-9]/.test(pw), 'Írásjel vagy ékezet'], [pw && !COMMON.includes(pw.toLowerCase()), 'Nem közismert jelszó'], [pw && !/(19|20)\d\d/.test(pw), 'Nincs benne évszám']];
    $('#p-checks').innerHTML = checks.map(([ok, t]) => `<div class="${ok ? 'ok' : ''}">${icon(ok ? 'check' : 'circle', 18, 2.4)} ${t}</div>`).join('');
    if (!pw) { $('#p-time').textContent = '–'; $('#p-meter').style.width = '0%'; $('#p-why').textContent = ''; $('#p-bits').textContent = ''; return }
    const a = analyze(pw), sec = Math.pow(2, a.bits) / 2 / GUESS;
    $('#p-time').textContent = sec < 1 ? 'azonnal' : human(sec);
    const col = a.bits < 35 ? 'var(--red)' : a.bits < 55 ? 'var(--orange)' : a.bits < 70 ? 'var(--yellow)' : 'var(--green)';
    $('#p-meter').style.width = clamp(a.bits / 90 * 100, 3, 100) + '%'; $('#p-meter').style.background = col; $('#p-time').style.color = col;
    $('#p-why').innerHTML = a.reason || (sec > 4.3e17 ? 'Ez tovább tartana, mint amióta a <b>világegyetem létezik</b>!' : a.bits >= 70 ? 'Nagyon erős jelszó!' : 'Hosszabb jelszóval sokkal erősebb lenne.');
    $('#p-bits').textContent = `${pw.length} karakter • ${a.cs} féle jel`;
  }
  function setView(v) { view = v; $('#pd-game').style.display = v === 'game' ? '' : 'none'; $('#pd-lab').style.display = v === 'lab' ? '' : 'none'; $$('.pd-tab').forEach(b => b.classList.toggle('on', b.dataset.v === v)); if (v === 'lab') { $('#pd-over').style.display = 'none'; setTimeout(() => $('#p-in').focus(), 50) } else if (!G || !G.on) intro() }

  S.build = root => {
    root.innerHTML = `<style>
      #pd{position:absolute;inset:0;display:flex;flex-direction:column}
      #pd-tabs{display:flex;gap:8px;justify-content:center;padding:10px 12px 0}.pd-tab{font-size:15px}.pd-tab.on{border-color:var(--orange);color:var(--orange);box-shadow:0 0 16px #fb923c44}
      #pd-game{flex:1;min-height:0;overflow:auto;padding:12px}
      .pd-wrap{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
      .pd-top{display:flex;gap:12px;align-items:center}#pd-prog{flex:1;display:flex;gap:6px;flex-wrap:wrap;align-items:center}#pd-prog span{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--panel2);font-weight:900;font-size:16px;color:var(--muted);transition:transform .2s}#pd-prog .q{border-radius:10px}#pd-prog .on{background:var(--orange);color:#111;transform:scale(1.15)}#pd-prog .ok{background:#16a34a;color:#fff}#pd-prog .bad{background:#b91c1c;color:#fff}
      .pd-hud{display:flex;gap:10px}.pd-hud div{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:4px 16px;text-align:center;min-width:96px}.pd-hud small{display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}.pd-hud b{font-size:28px;font-variant-numeric:tabular-nums}
      #pd-acc{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:12px}@media(max-width:900px){#pd-acc{grid-template-columns:1fr}}
      .pd-ph{display:flex;gap:14px;align-items:center}.pd-av{width:66px;height:66px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 22%,transparent);color:var(--c);border:3px solid var(--c);flex:none}
      .pd-ph b{font-size:24px}.pd-ph small{display:block;color:var(--muted);font-size:15px}
      .pd-lbl{margin:14px 0 6px;font-size:13px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
      .pd-bio{display:flex;flex-direction:column;gap:7px}.pd-bio div{background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:9px 12px;font-size:16.5px}.pd-bio b{color:var(--yellow);font-size:17px}
      .pd-leak{margin-top:12px;display:flex;gap:10px;align-items:center;font-size:16px;color:#fde68a;background:rgba(250,204,21,.08);border:2px solid rgba(250,204,21,.4);border-radius:12px;padding:10px 12px}.pd-leak svg{flex:none}.pd-bt{display:inline-block;margin-top:4px;font-size:15px}.pd-bt.fast{color:#4ade80}.pd-bt.slow{color:#fca5a5}
      .pd-acts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .pd-act{all:unset;box-sizing:border-box;cursor:pointer;display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:16px;border:2px solid color-mix(in srgb,var(--c) 55%,transparent);background:color-mix(in srgb,var(--c) 12%,#14161b);transition:transform .15s,box-shadow .15s}
      .pd-act:hover:not(:disabled){transform:translateY(-3px);box-shadow:0 10px 24px -10px var(--c)}.pd-act:disabled{opacity:.45;cursor:default}
      .pd-act .pd-ai{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:var(--c);color:#0b0c10;flex:none}.pd-act b{display:block;font-size:17px}.pd-act small{display:block;font-size:13px;color:var(--muted);margin-top:2px}
      .pd-comp{margin-top:10px;background:var(--bg2);border:2px solid color-mix(in srgb,#f472b6 45%,transparent);border-radius:16px;padding:12px}.pd-comp h4{margin:0 0 8px;font-size:16px;display:flex;gap:8px;align-items:center;color:#f9a8d4}.pd-comp h4 small{color:var(--muted);font-weight:600;font-size:13px}
      #pd-chips{display:flex;flex-wrap:wrap;gap:7px}.pd-chip{all:unset;cursor:pointer;font-family:var(--mono);font-size:17px;font-weight:700;padding:7px 12px;border-radius:10px;background:#1e293b;border:1px solid #334155;color:#fde68a}.pd-chip:hover{background:#334155}
      #pd-guess{margin:10px 0 8px;min-height:48px;display:flex;flex-wrap:wrap;gap:3px;align-items:center;background:#08090b;border:2px dashed var(--line2);border-radius:12px;padding:6px 10px;font-family:var(--mono);font-size:22px}#pd-guess span{background:#1e293b;border-radius:6px;padding:2px 6px;color:#fde68a}#pd-guess i{font-family:var(--font);font-size:14px;color:var(--muted)}
      .pd-gb{display:flex;gap:8px}.pd-gb .btn{flex:1;font-size:16px}
      #pd-crack{margin-top:10px;min-height:52px;display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;background:#000;border-radius:12px;padding:10px 14px;font-size:16.5px}.pd-tip{display:block;width:100%;color:#93c5fd;font-weight:700}#pd-crack code{font-family:var(--mono);color:#4ade80;font-size:18px}.pd-idle{color:var(--muted)}.pd-no{color:#fbbf24}
      #pd-res{position:absolute;inset:0;z-index:3;display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:24px;border-radius:18px;background:#0b0c10f2;border:3px solid}
      #pd-res.good{border-color:#16a34a}#pd-res.bad{border-color:#dc2626}.pd-rt{display:flex;gap:10px;align-items:center;font-size:28px;font-weight:900}#pd-res.good .pd-rt{color:#4ade80}#pd-res.bad .pd-rt{color:#f87171}
      .pd-rp{font-size:18px}.pd-rp code{font-family:var(--mono);font-size:24px;color:#fde68a;background:#1e293b;border-radius:8px;padding:2px 10px;word-break:break-all}.pd-rx{color:var(--muted);font-size:15px}.pd-rw{font-size:18px;max-width:680px;line-height:1.5;color:#e2e8f0}#pd-res .btn{font-size:22px;padding:0 30px;height:54px}
      #pd-quiz{max-width:860px;width:100%;margin:10px auto 0;text-align:center}.pd-qh{display:flex;gap:8px;justify-content:center;align-items:center;color:var(--yellow);font-weight:900;font-size:18px;text-transform:uppercase;letter-spacing:.05em}.pd-qq{font-size:24px;font-weight:800;margin:12px 0 18px;line-height:1.35}
      .pd-qo{display:flex;flex-direction:column;gap:10px}.pd-qb{all:unset;box-sizing:border-box;cursor:pointer;padding:14px 18px;border-radius:14px;background:var(--bg2);border:2px solid var(--line2);font-size:19px;font-weight:700;text-align:left;word-break:break-word}.pd-qb:hover:not(:disabled){border-color:var(--orange)}.pd-qb.right{border-color:#16a34a;background:#14532d}.pd-qb.wrong{border-color:#dc2626;background:#450a0a}
      .pd-qw{margin:16px 0 12px;font-size:18px;line-height:1.5;padding:12px 16px;border-radius:14px}.pd-qw.good{background:#14532d55;border:1px solid #16a34a}.pd-qw.bad{background:#450a0a88;border:1px solid #dc2626}#pd-quiz .btn.go{font-size:22px;padding:0 30px;height:54px}
      .pd-how{display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:left;margin:12px 0}.pd-how div{display:grid;grid-template-columns:32px 1fr;gap:2px 10px;background:color-mix(in srgb,var(--c) 10%,var(--bg2));border:2px solid color-mix(in srgb,var(--c) 45%,transparent);border-radius:14px;padding:10px 12px}.pd-how svg{grid-row:span 2;color:var(--c)}.pd-how b{font-size:17px}.pd-how span{font-size:14px;color:var(--muted)}
      .pd-sum{display:flex;flex-direction:column;gap:6px;text-align:left;margin:10px 0;max-height:40vh;overflow:auto}.pd-sum div{display:grid;grid-template-columns:140px 180px 1fr;gap:10px;align-items:center;background:var(--bg2);border-left:4px solid var(--line2);border-radius:8px;padding:6px 10px;font-size:13.5px}.pd-sum div.ok{border-left-color:#16a34a}.pd-sum div.bad{border-left-color:#dc2626}.pd-sum code{font-family:var(--mono);color:#fde68a;font-size:14px;word-break:break-all}.pd-sum span{color:#c9ccd3}
      @media(max-width:760px){.pd-sum div{grid-template-columns:1fr}.pd-how,.pd-acts{grid-template-columns:1fr}}
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
      <div id="pd-game"><div class="pd-wrap">
        <div class="pd-top"><div id="pd-prog"></div><div class="pd-hud"><div><small>Idő</small><b id="pd-time">–</b></div><div><small>Pont</small><b id="pd-pts">0</b></div></div></div>
        <div id="pd-acc">
          <div class="panel" id="pd-card"></div>
          <div class="panel">
            <div class="pd-lbl" style="margin-top:0">Hogyan próbálod meg?</div>
            <div class="pd-acts">
              <button class="pd-act" id="pd-dict" style="--c:#60a5fa"><span class="pd-ai">${icon('book', 24, 2.2)}</span><span><b>Gyakori jelszavak</b><small>a legnépszerűbbek kipróbálása • −${COST.dict} mp</small></span></button>
              <button class="pd-act" id="pd-brute" style="--c:#facc15"><span class="pd-ai">${icon('bolt', 24, 2.2)}</span><span><b>Minden kombináció</b><small>rövid jelszónál gyors! • −${COST.brute} mp</small></span></button>
              <button class="pd-act" id="pd-safe" style="--c:#4ade80;grid-column:1/-1"><span class="pd-ai">${icon('shield', 24, 2.2)}</span><span><b>Ez a fiók biztonságos!</b><small>ha szerinted nem lehet feltörni • jó: +150, rossz: −50 pont</small></span></button>
            </div>
            <div class="pd-comp"><h4>${icon('user', 18, 2.2)} Kitalálom a profilból <small>• −${COST.guess} mp / tipp</small></h4><div id="pd-chips"></div><div id="pd-guess"></div>
              <div class="pd-gb"><button class="btn" id="pd-undo">↶ Visszavon</button><button class="btn go" id="pd-try">Kipróbálom ▶</button></div></div>
            <div id="pd-crack"></div>
          </div>
          <div id="pd-res"></div>
        </div>
        <div class="panel" id="pd-quiz" style="display:none"></div>
      </div></div>
      <div id="pd-lab" style="display:none"><div id="p-wrap">
        <div class="panel">
          <h2 style="margin:0 0 10px;font-size:26px">Milyen erős a jelszóötleted?</h2>
          <input id="p-in" placeholder="Írj be egy jelszóötletet…" autocomplete="off" spellcheck="false">
          <div class="p-warn">Ne a saját, igazi jelszavadat írd be! Találj ki egy hasonlót.</div>
          <div class="p-ex">Próbáld ki: <button class="btn">123456</button><button class="btn">Morzsi2012</button><button class="btn">Fradi2011!</button><button class="btn">k7q2</button><button class="btn">zsiraf-ceruza-felho-tavasz</button><button class="btn" id="p-gen" style="font-family:var(--font)">${icon('refresh', 15)} Generálj egy erőset</button></div>
          <div id="p-res"><div style="color:var(--muted);font-size:16px">Egy profi törőgépnek ennyi idő kell:</div><div id="p-time">–</div><div class="p-mb"><div id="p-meter"></div></div><div id="p-why"></div><div id="p-bits"></div></div>
        </div>
        <div class="panel"><h3 style="margin:0 0 8px;color:var(--yellow)">Jó jelszó ellenőrzőlista</h3><div id="p-checks"></div>
          <div class="learn"><b>A hossz a legfontosabb!</b> Minden új karakter sokszorosára növeli a lehetőségek számát. A profi jelszó <b>hosszú és véletlenszerű</b> – ilyet egy <b>jelszókezelő</b> generál és jegyez meg helyetted.<br><br><b>Vigyázat:</b> a becslés csak a „minden kombináció” módszert számolja. Ha a jelszavadban olyan szó vagy évszám van, ami rólad kiderülhet (háziállat, csapat, születésnap), a támadó <b>kitalálhatja</b> – ahogy te is a Jelszó-detektívben.<br><br>A számítás 100 milliárd próbálkozást feltételez másodpercenként (videókártyás törőgép). Még biztonságosabb: <b>kétlépcsős azonosítás</b>, és minden oldalhoz más jelszó.</div>
        </div>
      </div></div>
      <div class="big-overlay" id="pd-over" style="display:none"></div>
    </div>`;
    $$('.pd-tab', root).forEach(b => b.onclick = () => { if (racing && b.dataset.v === 'lab') { toast('Verseny közben előbb fejezd be a játékot!', '#fbbf24', 1600); return } sfx.click(); setView(b.dataset.v) });
    $('#pd-dict').onclick = dict; $('#pd-brute').onclick = brute; $('#pd-safe').onclick = markSafe; $('#pd-try').onclick = tryGuess;
    $('#pd-undo').onclick = () => { if (G && !G.lock) { G.guess.pop(); guessUI() } };
    $('#p-in').oninput = () => { labUpdate(); sfx.blip() };
    $$('.p-ex .btn:not(#p-gen)', root).forEach(b => b.onclick = () => { $('#p-in').value = b.textContent; labUpdate(); sfx.click() });
    $('#p-gen').onclick = () => { $('#p-in').value = randStr(14, ALL); labUpdate(); sfx.click() };
    labUpdate(); setView('game');
  };
  S.enter = () => { if (view === 'game' && (!G || !G.on)) intro() };
  S.tick = dt => { if (!G || !G.on || G.lock || G.pause) return; G.t -= dt; if (Math.ceil(G.t) !== +$('#pd-time').textContent) hud(); if (G.t <= 0) end() };
  S.leave = () => { clearInterval(fake); if (G && G.on) G.on = false; racing = false };
  S.score = () => best;
  S.comp = { rules: 'Jelszó-detektív: ítéld meg helyesen a 6 fiókot, és válaszolj a kvízkérdésekre! Pont jár minden feltört gyenge fiókért, minden helyesen biztonságosnak jelölt fiókért, a jó válaszokért és a megmaradt időért.', start: () => { racing = true; setView('game'); start() } };
  S.comp.live = () => racing && G ? G.pts : 0;
  S._dbg = () => ({ get G() { return G }, makeTarget, genQuiz, bruteSec, show });
  return S;
})());
