/* ===== Gyakorlati kihívások: RJ45-krimpelő, Adathalász-felismerő, Hibakereső detektív ===== */

/* ---------- RJ45-krimpelő (T568B) ---------- */
App.add((() => {
  const S = { id: 'rj45', icon: '', title: 'RJ45-krimpelő', color: '#f97316', desc: 'Rakd sorba a nyolc eret a T568B szabvány szerint, krimpeld rá a csatlakozót, és mérd ki a kábeltesztelővel!', topic: 'Strukturált kábelezés, T568B, kábeltesztelés' };
  const W = [['fehér-narancs', '#fb923c', 1], ['narancs', '#fb923c', 0], ['fehér-zöld', '#22c55e', 1], ['kék', '#3b82f6', 0], ['fehér-kék', '#3b82f6', 1], ['zöld', '#22c55e', 0], ['fehér-barna', '#a16207', 1], ['barna', '#a16207', 0]];
  let pool = [], slots = [], sel = null, phase = 'sort', racing = false, rT = 0, done = 0, mist = 0, best = 0, root;
  const wireCss = (w) => w[2] ? `background:repeating-linear-gradient(45deg,#f5f5f4 0 7px,${w[1]} 7px 13px)` : `background:${w[1]}`;
  function newPlug() { pool = W.map((w, i) => i).sort(() => Math.random() - .5); slots = Array(8).fill(null); sel = null; phase = 'sort'; render() }
  function render() {
    $('#rj-pool').innerHTML = pool.map(i => `<button class="rj-w ${sel === i ? 'sel' : ''}" data-w="${i}" style="${wireCss(W[i])}" title="${W[i][0]}"><span>${W[i][0]}</span></button>`).join('') || '<span class="rj-ok">Minden ér a helyén!</span>';
    $('#rj-plug').innerHTML = slots.map((w, i) => `<div class="rj-s ${w === null ? '' : 'f'}" data-s="${i}"><b>${i + 1}</b>${w === null ? (window.EASY ? `<i class="rj-gh" style="${wireCss(W[i])}"></i><small>${W[i][0]}</small>` : '<em>?</em>') : `<i style="${wireCss(W[w])}"></i><small>${W[w][0]}</small>`}</div>`).join('');
    $$('.rj-w').forEach(b => b.onpointerdown = e => dragStart(e, b, { w: +b.dataset.w, from: -1 }));
    $$('.rj-s').forEach(s => s.onpointerdown = e => { const i = +s.dataset.s; if (phase !== 'sort') return; if (slots[i] !== null) dragStart(e, s, { w: slots[i], from: i }); else slotClick(i) });
    $('#rj-crimp').disabled = slots.includes(null) || phase !== 'sort';
    $('#rj-st').innerHTML = racing ? `<b>Verseny:</b> ${done}/3 kész • ${Math.round(rT)} mp • ${mist} hiba` : `Kész csatlakozó: ${done}`;
  }
  // kattintás: kijelölés / lerakás; húzás: fogd és vidd (helyek között csere, a sorba visszahúzva kivétel)
  function slotClick(i) { if (slots[i] !== null) { pool.push(slots[i]); slots[i] = null } else if (sel !== null) { slots[i] = sel; pool = pool.filter(x => x !== sel); sel = null; beep(700 + i * 40, .04, 'triangle', .04) } render() }
  function putWire(w, from, to) {
    if (to === from) return;
    const prev = to >= 0 ? slots[to] : null;
    if (from >= 0) slots[from] = null; else pool = pool.filter(x => x !== w);
    if (to < 0) { pool.push(w); render(); return }
    slots[to] = w; if (prev !== null) { if (from >= 0) slots[from] = prev; else pool.push(prev) }
    beep(700 + to * 40, .05, 'triangle', .05); render();
  }
  function dragStart(e, el, d) {
    e.preventDefault(); const x0 = e.clientX, y0 = e.clientY; let gh = null;
    const mv = ev => {
      if (!gh && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 6) { gh = document.createElement('div'); gh.className = 'rj-drag'; gh.style.cssText = wireCss(W[d.w]); gh.innerHTML = `<span>${W[d.w][0]}</span>`; document.body.appendChild(gh); sel = null }
      if (gh) { gh.style.left = ev.clientX - 59 + 'px'; gh.style.top = ev.clientY - 27 + 'px'; const t = document.elementFromPoint(ev.clientX, ev.clientY); $$('.rj-s').forEach(x => x.classList.toggle('over', !!t && x.contains(t))) }
    };
    const up = ev => {
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up);
      if (!gh) { if (d.from >= 0) slotClick(d.from); else { sel = sel === d.w ? null : d.w; sfx.click(); render() } return }
      gh.remove(); $$('.rj-s').forEach(x => x.classList.remove('over'));
      const t = document.elementFromPoint(ev.clientX, ev.clientY), sl = t && t.closest('.rj-s'), inPool = t && t.closest('#rj-pool');
      if (sl) putWire(d.w, d.from, +sl.dataset.s); else if (inPool && d.from >= 0) putWire(d.w, d.from, -1); else render();
    };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  }
  async function crimp() {
    phase = 'test'; const tool = $('#rj-tool'); tool.classList.add('go'); noise(.25, .08); beep(200, .2, 'sawtooth', .06); await new Promise(r => setTimeout(r, 700)); tool.classList.remove('go');
    const leds = $('#rj-leds'); leds.innerHTML = ''; let ok = 0;
    for (let i = 0; i < 8; i++) { const good = slots[i] === i; if (good) ok++; leds.innerHTML += `<div class="rj-l ${good ? 'g' : 'r'}"><b>${i + 1}</b><i></i><span>${good ? 'OK' : `→ ${W[slots[i]][0]}`}</span></div>`; beep(good ? 900 : 250, .06, 'square', .04); await new Promise(r => setTimeout(r, 160)) }
    if (ok === 8) { done++; sfx.win(); FX.confetti(); toast('<b>Tökéletes!</b> Mind a 8 ér jó helyen van – a kábel működik.', '#4ade80', 2600) }
    else { mist++; sfx.bad(); toast(`<b>${8 - ok} ér rossz helyen.</b> A kábel nem fog (jól) működni. Vágd le, és csináld újra!`, '#f87171', 3200) }
    render();
    setTimeout(() => { leds.innerHTML = ''; if (racing && done >= 3) { racing = false; const sc = Math.max(50, Math.round(1500 - rT * 8 - mist * 150)); best = Math.max(best, sc); Comp.finish(sc, `3 csatlakozó ${Math.round(rT)} mp alatt, ${mist} hiba`); done = 0 } newPlug() }, 2600);
  }
  S.build = r => {
    root = r;
    r.innerHTML = `<style>
      #rj{position:absolute;inset:0;overflow:auto;padding:20px;display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px}
      #rj-main{display:flex;flex-direction:column;gap:16px;align-items:center}
      #rj-plug{display:flex;gap:8px;padding:22px 26px 40px;background:linear-gradient(#e2e8f0cc,#cbd5e1aa);border:3px solid #94a3b8;border-radius:16px 16px 26px 26px;position:relative;box-shadow:inset 0 -12px 0 #94a3b844}
      #rj-plug::after{content:"RJ45 csatlakozó (érintkezők felül, fül alul)";position:absolute;left:0;right:0;bottom:8px;text-align:center;font-size:12px;color:#334155;font-weight:600}
      .rj-s{width:64px;height:170px;border-radius:8px;background:#f8fafccc;border:2px dashed #94a3b8;display:flex;flex-direction:column;align-items:center;gap:6px;padding:6px 0;cursor:pointer;color:#0f172a}
      .rj-s b{font-size:15px}.rj-s em{font-style:normal;font-size:26px;color:#94a3b8;margin-top:40px}.rj-s.f{border-style:solid;border-color:#64748b}
      .rj-s i{width:22px;flex:1;border-radius:6px}.rj-s .rj-gh{opacity:.28}.rj-s.over{border-color:var(--accent)!important;background:#e0f2fe;transform:scale(1.05)}.rj-s,.rj-w{touch-action:none;user-select:none}.rj-drag{position:fixed;z-index:100;width:118px;height:54px;border-radius:27px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:4px;pointer-events:none;box-shadow:0 14px 30px #000a;transform:rotate(-4deg)}.rj-drag span{font-size:11px;font-weight:700;background:#0b0c0fcc;color:#fff;padding:1px 7px;border-radius:8px}.rj-s small{font-size:10px;text-align:center;line-height:1.1;height:24px}
      #rj-pool{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;min-height:70px}
      .rj-w{all:unset;cursor:pointer;width:118px;height:54px;border-radius:27px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:4px;box-shadow:inset 0 -6px 10px #0004;border:3px solid transparent}
      .rj-w span{font-size:11px;font-weight:700;background:#0b0c0fcc;color:#fff;padding:1px 7px;border-radius:8px}.rj-w.sel{border-color:#fff;transform:translateY(-4px);box-shadow:0 0 0 3px var(--accent)}
      .rj-ok{color:var(--green);font-weight:700;font-size:18px}
      #rj-tool{font-size:40px;transition:transform .2s}#rj-tool.go{transform:scaleY(.6)}
      #rj-crimp{height:54px;font-size:20px;padding:0 30px}
      #rj-leds{display:flex;gap:8px;min-height:64px}.rj-l{display:flex;flex-direction:column;align-items:center;gap:3px;width:64px;font-size:11px}.rj-l i{width:22px;height:22px;border-radius:50%}.rj-l.g i{background:#22c55e;box-shadow:0 0 14px #22c55e}.rj-l.r i{background:#ef4444;box-shadow:0 0 14px #ef4444}.rj-l span{text-align:center;line-height:1.1}
      .rj-side{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px;font-size:14.5px;line-height:1.5;display:flex;flex-direction:column;gap:10px}
      .rj-side ol{margin:0;padding-left:22px}.rj-side li{margin:2px 0}#rj-st{font-size:16px}
    </style>
    <div id="rj"><div id="rj-main"><h2 style="margin:0">Krimpeld meg a hálózati kábelt!</h2>
      <div style="color:var(--muted)"><b>Húzd</b> az ereket a csatlakozó helyeire (vagy kattints az érre, majd a helyre). Egy eret másik helyre húzva helyet cserélnek, a sorba visszahúzva kiveszed.</div>
      <div id="rj-plug"></div><div id="rj-pool"></div>
      <div style="display:flex;gap:14px;align-items:center"><span id="rj-tool">${icon('rj45', 44, 1.6)}</span><button class="btn go" id="rj-crimp">Krimpelés és tesztelés</button></div><div id="rj-leds"></div></div>
      <div class="rj-side"><b style="font-size:17px">T568B szabvány</b><div id="rj-st"></div>
        <details><summary style="cursor:pointer;color:var(--accent);font-weight:700">Puska (ha elakadsz)</summary><ol>${W.map(w => `<li>${w[0]}</li>`).join('')}</ol></details>
        <div class="learn" style="margin-top:0">A hálózati kábelben <b>4 csavart érpár</b> fut. A csavarás csökkenti a zavarokat. Ha mindkét végén T568B a sorrend, <b>egyenes kábel</b> lesz belőle: így kötjük a gépeket a kapcsolóhoz. A technikusok a <b>kábeltesztelővel</b> ellenőrzik, hogy mind a 8 ér jó helyre került-e.</div></div></div>`;
    $('#rj-crimp').onclick = crimp; newPlug();
  };
  S.tick = dt => { if (racing) { rT += dt; if (Math.random() < .05) render() } };
  S.comp = { rules: 'Készíts el 3 hibátlan T568B csatlakozót a lehető leggyorsabban! Minden rossz krimpelés pontlevonással jár.', start: () => { racing = true; rT = 0; done = 0; mist = 0; newPlug() } };
  S.score = () => best || done * 100;
  S.leave = () => { racing = false };
  return S;
})());

/* ---------- Adathalász-felismerő ---------- */
App.add((() => {
  const S = { id: 'phish', icon: '', title: 'Adathalász-felismerő', color: '#ef4444', desc: 'Valódi vagy csaló? Nézd meg a feladót, a linket és a szöveget, és döntsd el gyorsan! A szülőknek is hasznos.', topic: 'Kiberbiztonság, adathalászat (phishing), biztonságos internethasználat' };
  // [csatorna, feladó, tárgy, szöveg, link, csaló-e, [árulkodó jelek]] – minden cégnév kitalált
  const M = [
    ['e-mail', 'ugyfelszolgalat@szuperbank-biztonsag.info', 'SÜRGŐS: Fiókját zároljuk 24 órán belül!', 'Tisztelt Ügyfelünk! Szokatlan tevékenységet észleltünk. Kattintson az alábbi linkre, és adja meg kártyaadatait, különben fiókja végleg zárolásra kerül.', 'szuperbank-biztonsag.info/belepes', 1, ['A bank sosem kér kártyaadatot e-mailben', 'Furcsa domain: „-biztonsag.info”', 'Sürgetés és fenyegetés']],
    ['SMS', '+36 30 ...', 'Csomagja megérkezett', 'FutárX: csomagja vámkezelés miatt várakozik. Fizessen 499 Ft-ot itt: futarx-csomag.top/fizetes', 'futarx-csomag.top', 1, ['Ismeretlen szám, rövid link', 'Kis összeg kérése – így tűnik ártalmatlannak', '„.top” végződésű, nem hivatalos oldal']],
    ['e-mail', 'ertesito@iskola.hu', 'Szülői értekezlet csütörtökön', 'Kedves Szülők! A szülői értekezlet csütörtökön 17 órakor lesz a 12-es teremben. Várjuk Önöket!', '', 0, ['Ismert feladó, iskolai domain', 'Nincs link, nincs adatkérés', 'Hétköznapi, nyugodt hangnem']],
    ['chat', 'Anya (új szám)', 'Szia, elromlott a telefonom', 'Szia kicsim, ez az új számom. Most nem tudok beszélni, utalnál nekem 50 ezret? Holnap megadom.', '', 1, ['„Új szám”, sürgős pénzkérés', 'Nem lehet felhívni', 'Mindig hívd vissza a régi számot!']],
    ['e-mail', 'noreply@jatekbolt.hu', 'Rendelésed visszaigazolása', 'Köszönjük a rendelést! Rendelésszám: 48213. A csomagot 2–3 munkanapon belül szállítjuk. Részletek a fiókodban.', 'jatekbolt.hu/fiokom', 0, ['Valóban rendeltél tőlük', 'A link a hivatalos oldalra mutat', 'Nem kér jelszót, kártyát']],
    ['e-mail', 'nyertes@lottoszerencse-nyeremeny.com', 'GRATULÁLUNK! 10 000 000 Ft-ot nyert!', 'Ön lett a havi sorsolás nyertese! A nyeremény kifizetéséhez küldje el személyi igazolványa másolatát és bankszámlaszámát, valamint fizessen 9 900 Ft kezelési díjat.', '', 1, ['Nem is játszottál', 'Előre fizetendő „kezelési díj”', 'Személyes iratok kérése']],
    ['chat', 'Gamer_Pro_2011', 'Ingyen skin!', 'Ingyen legendary skin mindenkinek!!! Csak lépj be a fiókoddal itt: free-skinz-now.xyz', 'free-skinz-now.xyz', 1, ['Túl szép, hogy igaz legyen', 'A fiókod jelszavát kéri egy idegen oldalon', 'Ismeretlen küldő']],
    ['SMS', 'Bankod', 'Belépési kód', 'Az Ön egyszer használatos belépési kódja: 482 913. Soha ne adja meg senkinek, a banki ügyintéző sem kérheti!', '', 0, ['Te kérted a belépést', 'Nincs link', 'Kifejezetten figyelmeztet, hogy ne add ki']],
    ['e-mail', 'it-tamogatas@iskola-it-help.net', 'Jelszava lejár', 'Az iskolai rendszerben jelszava ma lejár. A megtartásához adja meg jelenlegi jelszavát az alábbi űrlapon.', 'iskola-it-help.net/jelszo', 1, ['A rendszergazda sosem kéri a jelszavad', 'Nem az iskola domainje', 'A „régi jelszó megadása” trükk']],
    ['e-mail', 'hirlevel@kedvencmozi.hu', 'Heti műsor', 'Ezen a héten új filmek érkeznek! Nézd meg a műsort a weboldalunkon. Leiratkozás a levél alján.', 'kedvencmozi.hu/musor', 0, ['Feliratkoztál rá', 'Nem kér adatot', 'Van leiratkozási lehetőség']],
    ['chat', 'Ismeretlen', 'Ez te vagy a videóban?', 'haha ez te vagy ezen a videón?? haha nezd meg: vid-eo-share.click/v=8812', 'vid-eo-share.click', 1, ['Kíváncsiságra játszik', 'Furcsa link', 'Gyakran feltört barát fiókjából jön']],
    ['e-mail', 'szamla@aramszolgaltato.hu', 'Havi számla', 'Elkészült a novemberi számlája: 12 480 Ft. Fizetési határidő: december 10. A számlát az ügyfélportálon tekintheti meg.', 'aramszolgaltato.hu/ugyfelportal', 0, ['Szokásos havi számla, szokásos összeg', 'Hivatalos domain', 'Nem sürget, nem fenyeget']],
    ['SMS', '+44 7...', 'Adóvisszatérítés', 'Adóvisszatérítés jár Önnek: 86 200 Ft. Igényelje itt kártyaadatai megadásával: ado-visszaterites.online', 'ado-visszaterites.online', 1, ['Külföldi szám', 'Hivatal nem SMS-ben kér kártyaadatot', 'Pénzt ígér']],
    ['e-mail', 'tanar.kovacs@iskola.hu', 'Házi feladat', 'Sziasztok! A jövő heti házi feladatot feltöltöttem az iskolai rendszerbe. Ha kérdés van, írjatok!', '', 0, ['Ismert tanár, iskolai cím', 'Nincs gyanús link', 'Várható tartalom']]
  ];
  let deck = [], i = 0, ok = 0, bad = 0, t = 0, racing = false, best = 0, lock = false, streak = 0;
  function start() { deck = [...M].sort(() => Math.random() - .5).slice(0, 10); i = 0; ok = 0; bad = 0; t = 0; streak = 0; lock = false; show() }
  function show() {
    if (i >= deck.length) return end();
    const m = deck[i];
    $('#ph-card').innerHTML = `<div class="ph-ch">${icon(m[0] === 'SMS' ? 'phone' : m[0] === 'chat' ? 'user' : 'mail', 18)} ${m[0]} • ${i + 1}/${deck.length}</div><div class="ph-from"><span>Feladó:</span> <b>${esc(m[1])}</b></div><h3>${m[2]}</h3><p>${m[3]}</p>${m[4] ? `<div class="ph-link">${icon('globe', 14)} ${esc(m[4])}</div>` : ''}<div id="ph-why"></div>`;
    $('#ph-card').className = 'ph-in'; $('#ph-st').innerHTML = `Helyes: <b style="color:var(--green)">${ok}</b> • Hibás: <b style="color:var(--red)">${bad}</b>${racing ? ` • ${Math.round(t)} mp` : ''}`;
  }
  function answer(fake) {
    if (lock || i >= deck.length) return; lock = true; const m = deck[i], right = !!m[5] === fake;
    if (right) { ok++; streak++; sfx.ok() } else { bad++; streak = 0; sfx.bad() }
    $('#ph-card').className = right ? 'ph-ok' : 'ph-bad';
    $('#ph-why').innerHTML = `<div class="ph-v">${right ? 'Helyes!' : 'Nem jó!'} Ez ${m[5] ? '<b style="color:var(--red)">CSALÓ</b>' : '<b style="color:var(--green)">VALÓDI</b>'} üzenet.</div><ul>${m[6].map(x => `<li>${x}</li>`).join('')}</ul><button class="btn go" id="ph-nx">Következő</button>`;
    $('#ph-nx').onclick = () => { i++; lock = false; show() };
  }
  function end() {
    const sc = Math.max(0, Math.round(ok * 150 - bad * 100 + (racing ? Math.max(0, 120 - t) * 4 : 0))); best = Math.max(best, sc);
    if (racing) { racing = false; Comp.finish(sc, `${ok}/${deck.length} helyes, ${Math.round(t)} mp`) }
    $('#ph-card').className = 'ph-in'; $('#ph-card').innerHTML = `<h3>${ok >= 9 ? 'Kiberbiztonsági profi vagy!' : ok >= 6 ? 'Szép munka!' : 'Vigyázz, könnyen bedőlnél…'}</h3><div class="ph-big">${ok} / ${deck.length}</div>
      <div class="learn"><b>Az 5 aranyszabály:</b><br>1. A bank, az iskola és a rendszergazda <b>soha nem kéri</b> a jelszavad vagy a kártyaadataid.<br>2. Nézd meg a <b>feladó címét</b> és a link <b>valódi domainjét</b>.<br>3. A <b>sürgetés</b>, a fenyegetés és a „túl szép, hogy igaz legyen” ajánlat gyanús.<br>4. Pénzkérésnél <b>hívd vissza</b> az ismerőst a régi számán.<br>5. Ha bedőltél: azonnal cserélj jelszót, és szólj a banknak vagy a rendszergazdának.</div>
      <button class="btn go" id="ph-re" style="margin-top:12px">Új kör</button>`;
    $('#ph-re').onclick = start;
  }
  S.build = r => {
    r.innerHTML = `<style>
      #ph{position:absolute;inset:0;overflow:auto;padding:22px;display:flex;flex-direction:column;align-items:center;gap:16px}
      #ph-card{width:min(720px,96%);background:#f8fafc;color:#0f172a;border-radius:20px;padding:22px 26px;box-shadow:0 20px 60px #0008;border:4px solid transparent;transition:border-color .2s}
      #ph-card.ph-in{animation:phIn .3s}@keyframes phIn{from{opacity:0;transform:translateY(16px) rotate(-1deg)}}#ph-card.ph-ok{border-color:#22c55e}#ph-card.ph-bad{border-color:#ef4444;animation:phSh .35s}@keyframes phSh{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
      .ph-ch{font-size:12px;font-weight:700;text-transform:uppercase;color:#64748b;display:flex;gap:6px;align-items:center}.ph-from{margin-top:8px;font-size:14px}.ph-from span{color:#64748b}
      #ph-card h3{margin:8px 0;font-size:24px}#ph-card p{font-size:17px;line-height:1.5;margin:0}.ph-link{margin-top:10px;display:inline-flex;gap:6px;align-items:center;background:#e2e8f0;border-radius:8px;padding:5px 10px;font-family:var(--mono);font-size:14px;color:#1d4ed8}
      .ph-v{margin-top:14px;font-size:18px;font-weight:800}#ph-why ul{margin:6px 0 10px;padding-left:22px;font-size:15.5px}#ph-why .btn{height:42px}
      .ph-big{font-size:64px;font-weight:900;text-align:center}#ph-card .learn{color:#334155;background:#e2e8f0;border-color:#cbd5e1}#ph-card .learn b{color:#0f172a}
      #ph-btns{display:flex;gap:16px}#ph-btns .btn{height:64px;min-width:210px;font-size:22px;display:inline-flex;gap:10px;align-items:center;justify-content:center}
      #ph-real{background:#16a34a!important;color:#fff!important;border:none}#ph-fake{background:#dc2626!important;color:#fff!important;border:none}
    </style><div id="ph"><div id="ph-st" style="font-size:16px"></div><div id="ph-card"></div>
      <div id="ph-btns"><button class="btn" id="ph-real">${icon('check', 24, 2.4)} Valódi <small style="opacity:.7">[←]</small></button><button class="btn" id="ph-fake">${icon('x', 24, 2.4)} Csaló <small style="opacity:.7">[→]</small></button></div></div>`;
    $('#ph-real').onclick = () => answer(false); $('#ph-fake').onclick = () => answer(true);
    addEventListener('keydown', e => { if (App.cur !== S || e.target.tagName === 'INPUT') return; if (e.key === 'ArrowLeft') answer(false); if (e.key === 'ArrowRight') answer(true); if (e.key === 'Enter' && lock) { const n = $('#ph-nx'); if (n) n.click() } });
    start();
  };
  S.tick = dt => { if (racing && i < deck.length) t += dt };
  S.comp = { rules: '10 üzenet: döntsd el mindegyikről, hogy valódi vagy csaló! A helyes válasz pontot ér, a hibás levonást, és gyorsaságért bónusz jár.', start: () => { racing = true; start() } };
  S.score = () => best || ok * 150;
  S.leave = () => { racing = false };
  return S;
})());

/* ---------- Hibakereső detektív ---------- */
App.add((() => {
  const S = { id: 'detektiv', icon: '', title: 'Hibakereső detektív', color: '#14b8a6', desc: 'Panaszok érkeznek. Nyomozz, mint egy detektív: vizsgáld meg a gépet, gyűjts nyomokat, és találd ki, mi a baj!', topic: 'Hibaelhárítás, rendszeres hibakeresési módszer, diagnosztika' };
  // [szakmai név, hétköznapi leírás, ikon, réteg]
  const TESTS = { led: ['Kábel és lámpák', 'Ránézek a kábelekre és a jelzőlámpákra', 'plug', 0], ip: ['ipconfig', 'Megnézem, kapott-e a gép „lakcímet” (IP-címet) a hálózattól', 'monitor', 1], ping: ['ping', 'Kiküldök egy „kopogtatást” az internetre: válaszol valaki?', 'activity', 1], dns: ['nslookup', 'Kipróbálom a „telefonkönyvet”: a nevekből (pl. youtube.com) tud-e címet keresni', 'search', 2], log: ['Eseménynapló', 'Elolvasom, mit jegyzett fel magának a gép', 'layers', 3], hw: ['Hardverteszt', 'Megvizsgálom az alkatrészeket: hőfok, lemez, videókártya', 'chip', 3], ask: ['Kérdezés', 'Megkérdezem a felhasználót, mi történt előtte', 'user', 4] };
  const LAYERS = [['Kábel', 'plug'], ['Hálózat', 'globe'], ['Nevek (DNS)', 'search'], ['Gép', 'monitor'], ['Ember', 'user']];
  const CASES = [
    ['„Semmi nem megy az interneten, pedig tegnap még működött!”', { led: 'A hálózati kártya LED-je nem világít. A kábel kicsúszott a falból.', ip: 'IPv4-cím: 169.254.12.7 (automatikus magánhálózati cím – nincs DHCP-válasz)', ping: 'Általános hiba: a hálózat nem érhető el.', dns: 'Nem érhető el a DNS-kiszolgáló.', log: 'Hálózati kapcsolat megszakadt (kábel kihúzva).', hw: 'Minden alkatrész rendben.', ask: '„Tegnap takarítottak az irodában…”' }, ['Kihúzódott a hálózati kábel', 'Vírus van a gépen', 'Megtelt a merevlemez', 'Elromlott a monitor'], 0, 'A 169.254.x.x cím azt jelenti, hogy a gép nem kapott címet a DHCP-től – és a LED sem ég: fizikai réteg, a kábel!'],
    ['„A YouTube nem jön be, de a Discordon tudok beszélni!”', { led: 'A LED-ek rendben villognak.', ip: 'IPv4: 192.168.1.23, átjáró: 192.168.1.1, DNS: 0.0.0.0', ping: 'ping 8.8.8.8: 4 válasz, 0% veszteség.', dns: 'nslookup youtube.com: a kiszolgáló nem érhető el.', log: 'DNS-kliens: a névfeloldás sikertelen.', hw: 'Minden rendben.', ask: '„Valaki beállított valamit a hálózatnál…”' }, ['Rossz DNS-beállítás', 'Kiégett a hálózati kártya', 'Lejárt az internet-előfizetés', 'Túl lassú a processzor'], 0, 'A ping IP-címre megy, de a névfeloldás nem: a DNS a hibás (0.0.0.0 nem valódi szerver).'],
    ['„A gép bekapcsol, ventilátor megy, de a monitor fekete.”', { led: 'A monitor kábele a <b>videókártya helyett az alaplapba</b> van dugva.', ip: '—', ping: '—', dns: '—', log: '—', hw: 'Videókártya felismerve, működik.', ask: '„Most hoztuk vissza a szervizből, átrakták az asztalt.”' }, ['Rossz helyre dugták a monitorkábelt', 'Elromlott a processzor', 'Nincs telepítve Windows', 'Vírus'], 0, 'Ha van videókártya, a monitort abba kell dugni – az alaplapi kimenet ilyenkor gyakran ki van kapcsolva.'],
    ['„Nagyon lassú a gép, mindenre percekig vár.”', { led: 'Rendben.', ip: 'Rendben.', ping: 'Rendben.', dns: 'Rendben.', log: 'Figyelmeztetés: C: meghajtó – kevés a szabad hely (0,4 GB).', hw: 'Lemez: 99% foglalt. RAM: rendben.', ask: '„Az összes videót a gépre mentem…”' }, ['Megtelt a meghajtó', 'Kicsi a monitor', 'Rossz az egér', 'Szakadt a hálózati kábel'], 0, 'Ha a rendszermeghajtó tele van, a Windows nem tud ideiglenes fájlokat írni – minden belassul. Takarítás vagy nagyobb SSD!'],
    ['„Furcsa felugró ablakok jönnek, és a böngésző kezdőlapja megváltozott.”', { led: 'Rendben.', ip: 'Rendben.', ping: 'Rendben.', dns: 'A DNS egy ismeretlen külföldi szerverre mutat!', log: 'Ismeretlen program települt tegnap: „SuperFreeGames_Setup.exe”', hw: 'Rendben.', ask: '„Letöltöttem egy ingyenes játékot egy oldalról…”' }, ['Kártevő (adware) fertőzés', 'Kevés a RAM', 'Rossz a WiFi', 'Elromlott a billentyűzet'], 0, 'Ismeretlen forrásból telepített program kártevőt hozott, ami a DNS-t és a böngészőt is átállította. Vírusirtó, eltávolítás, DNS visszaállítása!'],
    ['„A nyomtató ki van írva, hogy offline.”', { led: 'A nyomtató kijelzője: „Wi-Fi nincs csatlakoztatva”.', ip: 'A gép: 192.168.1.23 – rendben.', ping: 'ping 192.168.1.50 (nyomtató): időtúllépés.', dns: 'Rendben.', log: 'Nyomtatási sor: 3 feladat várakozik.', hw: 'A gép hardvere rendben.', ask: '„Tegnap új routert kaptunk a szolgáltatótól.”' }, ['A nyomtató nem csatlakozik az új WiFi-hez', 'Elfogyott a papír', 'Rossz a nyomtató-illesztőprogram', 'A gép túlmelegedett'], 0, 'Új router = új WiFi-név és jelszó. A nyomtatót újra csatlakoztatni kell a hálózathoz.'],
    ['„A gép magától kikapcsol, főleg játék közben.”', { led: 'Rendben.', ip: 'Rendben.', ping: 'Rendben.', dns: 'Rendben.', log: 'Kritikus: a rendszer váratlanul leállt (Kernel-Power 41).', hw: 'Processzor hőmérséklete terhelésnél: <b>104 °C</b>. A hűtő ventilátora porral teli.', ask: '„Már 3 éve nem takarítottam ki.”' }, ['Túlmelegedés a poros hűtő miatt', 'Kevés a tárhely', 'Rossz a DNS', 'Elavult a böngésző'], 0, 'A processzor védelme túl magas hőmérsékletnél leállítja a gépet. Portalanítás és friss hővezető paszta kell!'],
    ['„Nem tudok belépni a gépemre, azt írja: rossz jelszó.”', { led: 'Rendben.', ip: '—', ping: '—', dns: '—', log: 'Biztonsági napló: 5 sikertelen bejelentkezés, a fiók zárolva.', hw: 'Rendben.', ask: '„A billentyűzeten világít a Caps Lock…”' }, ['Bekapcsolt Caps Lock, majd zárolódott a fiók', 'Elromlott a merevlemez', 'Vírus', 'Lassú a hálózat'], 0, 'A Caps Lock miatt nagybetűvel ment a jelszó, és a sok próbálkozás zárolta a fiókot. A rendszergazda feloldja, a felhasználó figyeljen a Caps Lockra!']
  ];
  // „Mit jelent ez?” – hétköznapi magyarázat esetenként és vizsgálatonként
  const SIMPLE = [
    { led: 'A lámpa nem ég: nincs fizikai kapcsolat, a kábel kicsúszott!', ip: 'A gép nem kapott „lakcímet” a hálózattól – teljesen egyedül van.', ping: 'Semmi nem jut ki a gépről a világba.', dns: 'A telefonkönyv sem érhető el – de ez csak következmény.', log: 'A gép maga is észrevette: kihúzták a kábelt!', ask: 'Takarítás után könnyen kirúghatták a kábelt.' },
    { ip: 'Van címe, de a telefonkönyv (DNS) címe 0.0.0.0 – ilyen szerver nem létezik!', ping: 'Szám szerinti címre eljut a kopogtatás → van internet!', dns: 'Nevekből (youtube.com) nem tud címet keresni – ezért nem jön be az oldal.', log: 'A gép feljegyezte: a nevek feloldása nem sikerül.', ask: 'Valaki átállított valamit a hálózati beállításokban.' },
    { led: 'A monitor kábele rossz „lyukba” van dugva!', hw: 'A videókártya hibátlan – csak a monitor nem hozzá van kötve.', ask: 'Költözés után könnyű rossz helyre dugni a kábelt.' },
    { log: 'A gép szól: szinte elfogyott a hely.', hw: 'A tárhely 99%-ig tele van – nincs hova dolgoznia a gépnek.', ask: 'Sok videó = megtelt a tárhely.' },
    { dns: 'Valaki átírta a telefonkönyvet egy idegen, gyanús szerverre!', log: 'Tegnap egy ismeretlen program települt a gépre.', ask: 'Ismeretlen oldalról letöltött „ingyenes” játék – gyakori kártevőforrás!' },
    { led: 'A nyomtató nem csatlakozik a WiFi-hez.', ping: 'A nyomtató nem válaszol a hálózaton.', log: 'A nyomtatási feladatok várnak, mert a gép nem éri el a nyomtatót.', ask: 'Új router = új WiFi-név és jelszó. A nyomtató a régit keresi!' },
    { log: 'A gép többször váratlanul leállt.', hw: '104 °C! Túl forró – a por eltömítette a hűtőt.', ask: '3 év alatt rengeteg por gyűlik össze a gépben.' },
    { log: 'Túl sok rossz jelszó → a fiók biztonsági okból lezárt.', ask: 'Caps Lock = minden nagybetűvel megy, ezért „rossz” a jelszó!' }
  ];
  const neutral = t => /^(Rendben\.?|Minden rendben\.?|A LED-ek rendben villognak\.|A gép hardvere rendben\.|A gép: .* rendben\.)$/.test(t.trim());
  let deck = [], i = 0, used = [], pts = 0, racing = false, t = 0, best = 0, res = [], done = false;
  function start() { deck = [...CASES.map((c, k) => [c, k])].sort(() => Math.random() - .5).slice(0, 5).map(([c, k]) => { let o = c[2].map((x, j) => [x, j === c[3]]); if (window.EASY) o = [o.find(x => x[1]), ...o.filter(x => !x[1]).slice(0, 2)]; o.sort(() => Math.random() - .5); return { c, k, o } }); i = 0; pts = 0; t = 0; res = []; next() }
  function next() { used = []; done = false; render() }
  function clue(k, key) {
    const { c, k: ci } = deck[i], tech = c[1][key], simple = tech === '—' ? 'Ennél a panasznál ez a vizsgálat nem mond semmit.' : (SIMPLE[ci][key] || (neutral(tech) ? 'Ez rendben van – nem itt van a hiba.' : 'Érdekes nyom – gondold végig, mit jelent!'));
    const good = !!SIMPLE[ci][key];
    return `<div class="dt-clue ${good ? 'hot' : ''}" style="--r:${(k % 2 ? 1 : -1) * (1 + k % 3)}deg"><i class="dt-pin"></i><div class="dt-ct">${icon(TESTS[key][2], 16)} ${TESTS[key][0]}</div><div class="dt-tech">${tech}</div><div class="dt-mean"><b>Mit jelent?</b> ${simple}</div></div>`;
  }
  function render() {
    if (i >= deck.length) return end();
    const { c, o } = deck[i], lay = new Set(used.map(k => TESTS[k][3]));
    $('#dt-in').innerHTML = `<div class="dt-top"><span class="dt-badge">${icon('detektiv', 18)} ${i + 1}. eset / ${deck.length}</span><span>Pont: <b>${pts}</b>${racing ? ` • ${Math.round(t)} mp` : ''}</span></div>
      <div class="dt-scene"><div class="dt-person"><span class="dt-av">${icon('user', 30)}</span><div class="dt-bubble">${c[0]}</div></div><div class="dt-pc"><img alt="" src="${Dev.img('desktop', 120)}"><span class="dt-q">?</span></div></div>
      <div class="dt-grid"><div><h4>1. Nyomozz! <small>${window.EASY ? 'Könnyű mód: a vizsgálat ingyenes' : 'minden vizsgálat −20 pont – csak azt nézd meg, ami kell'}</small></h4>
        <div class="dt-tests">${Object.entries(TESTS).map(([k, v]) => `<button class="dt-t ${used.includes(k) ? 'used' : ''}" data-t="${k}" ${done ? 'disabled' : ''}><span class="dt-ti">${icon(v[2], 20)}</span><span><b>${v[1]}</b><small>${v[0]}</small></span></button>`).join('')}</div>
        <div class="dt-ladder">${LAYERS.map(([n, ic], k) => `<div class="${lay.has(k) ? 'on' : ''}">${icon(ic, 14)} ${n}</div>`).join('<em>›</em>')}</div></div>
        <div><h4>2. Nyomtábla</h4><div class="dt-board">${used.map((k, n) => clue(n, k)).join('') || '<div class="dt-ph">Még nincs nyom. Válassz egy vizsgálatot bal oldalt!<br><small>Tipp: a profik alulról kezdik – először a kábelt nézik meg.</small></div>'}</div></div></div>
      <h4>3. Ki a tettes? Mi okozza a hibát?</h4><div class="dt-opts">${o.map((x, k) => `<button class="dt-o" data-o="${k}" ${done ? 'disabled' : ''}><b>${String.fromCharCode(65 + k)}</b><span>${x[0]}</span></button>`).join('')}</div><div id="dt-ex"></div>`;
    $$('[data-t]').forEach(b => b.onclick = () => { if (done || used.includes(b.dataset.t)) return; used.push(b.dataset.t); beep(500 + used.length * 80, .06, 'triangle', .05); render(); const cl = $$('.dt-clue'); const l = cl[cl.length - 1]; if (l) l.classList.add('new') });
    $$('[data-o]').forEach(b => b.onclick = () => answer(o[+b.dataset.o][1], b));
  }
  function answer(right, btn) {
    if (done) return; done = true; const { c } = deck[i], g = right ? (window.EASY ? 200 : Math.max(40, 200 - used.length * 20)) : 0; pts += g; res.push(right);
    right ? (sfx.win(), FX.burstEl(btn, 30)) : sfx.bad();
    $$('.dt-o').forEach(b => { b.disabled = true; const ok = deck[i].o[+b.dataset.o][1]; b.classList.toggle('right', ok); if (b === btn && !ok) b.classList.add('wrong') });
    $('#dt-ex').innerHTML = `<div class="dt-ex ${right ? 'ok' : 'bad'}"><div class="dt-stamp">${right ? 'MEGOLDVA' : 'TÉVES NYOM'}</div><div><b>${right ? `+${g} pont` : 'A helyes megoldás zölddel látszik.'}</b><p>${c[4]}</p><button class="btn go" id="dt-nx">${i < deck.length - 1 ? 'Következő eset' : 'Eredmény'}</button></div></div>`;
    $$('[data-t]').forEach(b => b.disabled = true); $('#dt-nx').onclick = () => { i++; next() }; $('#dt-ex').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function end() {
    const sc = pts + (racing ? Math.max(0, Math.round(150 - t)) * 3 : 0); best = Math.max(best, sc);
    if (racing) { racing = false; Comp.finish(sc, `${res.filter(Boolean).length}/${deck.length} eset megoldva, ${Math.round(t)} mp`) }
    $('#dt-in').innerHTML = `<div class="dt-end"><span class="dt-badge">${icon('detektiv', 18)} Nyomozás lezárva</span><h2>${res.filter(Boolean).length} / ${deck.length} eset megoldva</h2><div class="dt-big">${sc} pont</div>
      <div class="dt-steps">${[['plug', 'Kábel, áram', 'Be van dugva? Világít a lámpa?'], ['globe', 'Hálózat', 'Van címe? Kijut az internetre?'], ['search', 'Nevek', 'Működik a „telefonkönyv”?'], ['monitor', 'Gép', 'Mit írt a naplóba? Jók az alkatrészek?'], ['user', 'Ember', 'Mi történt előtte?']].map(([ic, n, d], k) => `<div><span>${k + 1}</span>${icon(ic, 22)}<b>${n}</b><small>${d}</small></div>`).join('')}</div>
      <div class="learn">Így dolgozik egy igazi rendszergazda: <b>alulról felfelé</b> halad, minden lépésnél gyűjt egy nyomot, és csak azt változtatja meg, amiről biztosan tudja, hogy hibás. Ez a módszer a képzés egyik legfontosabb része.</div>
      <button class="btn go" id="dt-re" style="margin-top:14px;height:48px;padding:0 24px">Új esetek</button></div>`;
    $('#dt-re').onclick = start;
  }
  S.build = r => {
    r.innerHTML = `<style>
      #dt{position:absolute;inset:0;overflow:auto;padding:20px}#dt-in{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
      .dt-top{display:flex;justify-content:space-between;align-items:center;color:var(--muted);font-weight:700}.dt-badge{display:inline-flex;gap:8px;align-items:center;background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--accent);border-radius:999px;padding:6px 14px;font-weight:800}
      .dt-scene{display:flex;align-items:center;gap:20px;background:radial-gradient(120% 140% at 0% 0%,color-mix(in srgb,var(--accent) 14%,var(--panel)),var(--panel));border:1px solid var(--line);border-radius:20px;padding:18px 22px}
      .dt-person{display:flex;gap:14px;align-items:flex-start;flex:1}.dt-av{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:#334155;color:#e2e8f0;flex:none}
      .dt-bubble{position:relative;background:#f8fafc;color:#0f172a;border-radius:18px;padding:14px 18px;font-size:22px;font-weight:700;line-height:1.35;animation:dtIn .4s}.dt-bubble::before{content:"";position:absolute;left:-10px;top:18px;border:10px solid transparent;border-right-color:#f8fafc;border-left:0}
      @keyframes dtIn{from{opacity:0;transform:translateY(8px)}}
      .dt-pc{position:relative;width:140px;flex:none}.dt-pc img{width:140px;filter:drop-shadow(0 10px 20px #0008)}.dt-q{position:absolute;right:6px;top:-6px;width:38px;height:38px;border-radius:50%;background:var(--red);color:#fff;font-weight:900;font-size:24px;display:grid;place-items:center;animation:dtP 1.2s infinite}@keyframes dtP{50%{transform:scale(1.15)}}
      .dt-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:16px}@media(max-width:900px){.dt-grid{grid-template-columns:1fr}}
      #dt-in h4{margin:0 0 8px;font-size:18px}#dt-in h4 small{color:var(--muted);font-weight:500;font-size:13px;margin-left:6px}
      .dt-tests{display:flex;flex-direction:column;gap:7px}.dt-t{all:unset;cursor:pointer;display:flex;gap:12px;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:10px 12px;transition:all .15s}
      .dt-t:hover{border-color:var(--accent);transform:translateX(3px)}.dt-t b{display:block;font-size:15px;font-weight:600;line-height:1.3}.dt-t small{font-family:var(--mono);color:var(--muted);font-size:12px}
      .dt-ti{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent);flex:none}
      .dt-t.used{opacity:.55;border-style:dashed}.dt-t.used .dt-ti{background:var(--panel2);color:var(--muted)}.dt-t[disabled]{cursor:default}
      .dt-ladder{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-top:10px;font-size:12.5px;color:var(--muted)}.dt-ladder div{display:inline-flex;gap:4px;align-items:center;border:1px solid var(--line);border-radius:999px;padding:3px 9px}.dt-ladder div.on{border-color:var(--accent);color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent)}.dt-ladder em{font-style:normal}
      .dt-board{min-height:320px;background:#3b2f22;background-image:radial-gradient(#4a3b2b 1px,transparent 1px);background-size:14px 14px;border:6px solid #5b4632;border-radius:16px;padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:12px;align-content:start}
      .dt-ph{grid-column:1/-1;color:#e7d9c4;text-align:center;padding:60px 10px;font-size:16px;line-height:1.6}.dt-ph small{color:#c4b29a}
      .dt-clue{position:relative;background:#fef9c3;color:#1c1917;border-radius:4px;padding:16px 12px 12px;transform:rotate(var(--r));box-shadow:0 8px 16px #0006}.dt-clue.hot{background:#fde68a}.dt-clue.new{animation:dtC .45s cubic-bezier(.2,1.4,.4,1)}@keyframes dtC{from{opacity:0;transform:scale(.6) rotate(-12deg)}}
      .dt-pin{position:absolute;top:-6px;left:50%;width:14px;height:14px;border-radius:50%;background:#dc2626;box-shadow:0 2px 3px #0008;transform:translateX(-50%)}
      .dt-ct{display:flex;gap:6px;align-items:center;font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:#57534e}.dt-tech{font-family:var(--mono);font-size:12px;color:#44403c;margin:6px 0;line-height:1.4}
      .dt-mean{font-size:15px;line-height:1.4;border-top:1px dashed #a8a29e;padding-top:6px}.dt-mean b{color:#b45309}
      .dt-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:760px){.dt-opts{grid-template-columns:1fr}}
      .dt-o{all:unset;cursor:pointer;display:flex;gap:12px;align-items:center;background:var(--panel);border:2px solid var(--line);border-radius:16px;padding:14px 16px;font-size:17px;font-weight:600;transition:all .15s}.dt-o:hover{border-color:var(--accent)}
      .dt-o b{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:var(--panel2);flex:none}.dt-o.right{border-color:var(--green);background:rgba(74,222,128,.1)}.dt-o.right b{background:var(--green);color:#0b0c0f}.dt-o.wrong{border-color:var(--red);background:rgba(248,113,113,.1)}.dt-o[disabled]{cursor:default}
      .dt-ex{display:flex;gap:18px;align-items:center;border-radius:16px;padding:16px 20px;border:1px solid;animation:dtIn .3s}.dt-ex.ok{background:rgba(74,222,128,.08);border-color:#1f5134}.dt-ex.bad{background:rgba(248,113,113,.08);border-color:#7f1d1d}.dt-ex p{margin:6px 0 10px;font-size:16px}.dt-ex .btn{height:44px}
      .dt-stamp{font-size:26px;font-weight:900;letter-spacing:.06em;border:4px solid;border-radius:10px;padding:6px 12px;transform:rotate(-8deg);flex:none;animation:dtS .4s cubic-bezier(.2,1.6,.4,1)}.ok .dt-stamp{color:var(--green)}.bad .dt-stamp{color:var(--red)}@keyframes dtS{from{transform:rotate(-8deg) scale(2.4);opacity:0}}
      .dt-end{text-align:center}.dt-end h2{font-size:34px;margin:12px 0 4px}.dt-big{font-size:58px;font-weight:900;color:var(--accent)}
      .dt-steps{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:18px 0}.dt-steps div{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;gap:6px;position:relative}.dt-steps span{position:absolute;top:8px;left:10px;color:var(--muted);font-weight:800}.dt-steps svg{color:var(--accent)}.dt-steps small{color:var(--muted);font-size:12.5px}
      @media(max-width:760px){.dt-steps{grid-template-columns:1fr 1fr}.dt-scene{flex-direction:column}.dt-board{grid-template-columns:1fr}}
    </style><div id="dt"><div id="dt-in"></div></div>`;
    start();
  };
  S.tick = dt => { if (racing && i < deck.length) t += dt };
  S.comp = { rules: '5 hibás gép: nyomozz, és találd meg a hibát a lehető legkevesebb vizsgálattal és leggyorsabban!', start: () => { racing = true; start() } };
  S.score = () => best || pts;
  S.leave = () => { racing = false };
  return S;
})());
