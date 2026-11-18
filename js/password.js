/* ===== 6. Jelszó-törő: mennyi idő alatt törnék fel? ===== */
App.add((() => {
  const S = {
    id: 'jelszo', icon: '', title: 'Jelszó-törő', color: '#fb923c',
    desc: 'Mennyi idő alatt törné fel egy hackergép a jelszavadat? 1 másodperc vagy 1 millió év?',
    topic: 'Hálózatbiztonság, erős jelszavak, hitelesítés'
  };
  const COMMON = ['123456', '123456789', '12345678', '12345', '1234', 'password', 'jelszo', 'jelszó', 'qwerty', 'qwertz', 'abc123', '111111', '000000', 'iloveyou', 'admin', 'szeretlek', 'macska', 'kutya', 'cica', 'asdfgh', 'asd123', 'monkey', 'dragon', 'football', 'letmein', 'welcome', 'login', 'princess', 'sunshine', 'master', 'hello', 'szia', 'budapest', 'magyarorszag', 'ferencvaros', 'fradi', 'minecraft', 'fortnite', 'roblox', 'pokemon', 'barcelona', 'messi', 'ronaldo', 'anyu', 'apu', 'titok'];
  const GUESS = 1e11; // próbálkozás/másodperc – erős, videókártyás törőgép
  let fake = null;
  function analyze(pw) {
    const low = pw.toLowerCase();
    let cs = 0; if (/[a-z]/.test(pw)) cs += 26; if (/[A-Z]/.test(pw)) cs += 26; if (/[0-9]/.test(pw)) cs += 10;
    if (/[^a-zA-Z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/.test(pw)) cs += 33; if (/[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/.test(pw)) cs += 18;
    let bits = pw.length * Math.log2(Math.max(cs, 1));
    let reason = '';
    const base = low.replace(/[0-9!?.@#_\-]+$/, '').replace(/^[0-9]+/, '');
    if (COMMON.includes(low) || COMMON.includes(base) && base.length >= 3) { bits = Math.min(bits, 12); reason = 'Ez a jelszó rajta van a leggyakoribb jelszavak listáján – a támadók ezeket próbálják először!' }
    else if (/^(.)\1+$/.test(pw)) { bits = Math.min(bits, 8); reason = 'Csupa ugyanolyan karakter – ezt azonnal kitalálják.' }
    else if (/^(0123|1234|2345|abcd|qwer|asdf)/i.test(pw)) { bits *= .5; reason = 'Billentyűzet-sor vagy számsor – a törőprogramok ezt is ismerik.' }
    else if (/^[a-záéíóöőúüű]+$/i.test(pw) && pw.length < 10) { bits *= .6; reason = 'Egyetlen rövid szó – a szótáras támadás hamar megtalálja.' }
    else if (/(19|20)\d\d$/.test(pw)) { bits -= 6; reason = 'Évszám a végén? A támadók gyakran próbálják a születési éveket.' }
    return { bits: Math.max(0, bits), cs, reason };
  }
  function human(sec) {
    if (sec < 1) return ['azonnal ', 0];
    const u = [['másodperc', 60], ['perc', 60], ['óra', 24], ['nap', 365], ['év', 1e3], ['ezer év', 1e3], ['millió év', 1e3], ['milliárd év', 1e3], ['billió év', Infinity]];
    let v = sec, i = 0; while (i < u.length - 1 && v >= u[i][1]) { v /= u[i][1]; i++ }
    return [(v < 10 ? v.toFixed(1).replace('.', ',') : Math.round(v).toLocaleString('hu-HU')) + ' ' + u[i][0], i];
  }
  function update() {
    const pw = $('#p-in').value;
    const checks = [[pw.length >= 12, 'Legalább 12 karakter'], [/[a-z]/.test(pw) && /[A-Z]/.test(pw), 'Kis- és nagybetű is'], [/[0-9]/.test(pw), 'Szám is van benne'], [/[^a-zA-Z0-9]/.test(pw), 'Írásjel vagy ékezet'], [pw && !COMMON.includes(pw.toLowerCase()), 'Nem közismert jelszó']];
    $('#p-checks').innerHTML = checks.map(([ok, t]) => `<div class="${ok ? 'ok' : ''}">${icon(ok ? 'check' : 'circle', 18, 2.4)} ${t}</div>`).join('');
    if (!pw) { $('#p-time').textContent = '–'; $('#p-meter').style.width = '0%'; $('#p-why').textContent = ''; $('#p-face').innerHTML = icon('lock', 64, 1.5); $('#p-face').style.color = 'var(--muted)'; return }
    const a = analyze(pw), sec = Math.pow(2, a.bits) / 2 / GUESS, [txt, lvl] = human(sec);
    $('#p-time').textContent = txt;
    const pct = clamp(a.bits / 90 * 100, 3, 100); $('#p-meter').style.width = pct + '%';
    const col = a.bits < 35 ? 'var(--red)' : a.bits < 55 ? 'var(--orange)' : a.bits < 70 ? 'var(--yellow)' : 'var(--green)';
    $('#p-meter').style.background = col; $('#p-time').style.color = col;
    $('#p-face').innerHTML = icon(a.bits < 55 ? 'unlock' : 'lock', 64, 1.5); $('#p-face').style.color = col;
    $('#p-why').innerHTML = a.reason || (sec > 4.3e17 ? 'Ez tovább tartana, mint amióta a <b>világegyetem létezik</b> (13,8 milliárd év)! ' : a.bits >= 70 ? 'Nagyon erős jelszó! ' : 'Hosszabb jelszóval sokkal erősebb lenne.');
    $('#p-bits').textContent = `${pw.length} karakter • ${a.cs} féle jel • kb. ${Math.round(a.bits)} bit`;
  }
  function hackerAnim() {
    clearInterval(fake); const el = $('#p-crack'), pw = $('#p-in').value || 'cica'; let n = 0;
    const a = analyze(pw), quick = a.bits < 30;
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    fake = setInterval(() => {
      n++; let g = '';
      for (let i = 0; i < Math.max(4, pw.length); i++) g += chars[rnd(0, chars.length - 1)];
      el.textContent = `[${String(n * 7919).padStart(8, '0')}] próba: ${g}`;
      sfx.blip();
      if (quick && n > 18) { clearInterval(fake); el.innerHTML = `<b style="color:var(--red)">FELTÖRVE: ${esc(pw)}</b>`; sfx.pop() }
      if (!quick && n > 40) { clearInterval(fake); el.innerHTML = `<b style="color:var(--green)">A törőgép feladta… (${esc($('#p-time').textContent)} kellene neki)</b>`; sfx.win() }
    }, 60);
  }
  S.build = root => {
    root.innerHTML = `<style>
      #p-wrap{max-width:1100px;margin:0 auto;padding:22px;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:18px;height:100%;overflow:auto;align-content:start}
      @media(max-width:900px){#p-wrap{grid-template-columns:1fr}}
      #p-in{width:100%;font-size:34px;padding:14px 18px;border-radius:16px;border:3px solid var(--line);background:#101216;color:var(--text);font-family:var(--mono)}
      #p-in:focus{outline:none;border-color:var(--orange)}
      .p-warn{font-size:14px;color:var(--yellow);margin:8px 0 0}
      #p-res{margin-top:16px;text-align:center}
      #p-face{line-height:1;color:var(--muted)}#p-time{font-size:46px;font-weight:900;margin:6px 0}
      .p-mb{height:22px;background:#1c1f26;border-radius:11px;overflow:hidden}#p-meter{height:100%;width:0;transition:width .3s,background .3s}
      #p-why{font-size:18px;margin-top:10px;color:#c9ccd3}#p-bits{font-size:13px;color:var(--muted);margin-top:6px}
      #p-checks div{font-size:18px;padding:5px 0;color:var(--muted);display:flex;gap:10px;align-items:center}#p-checks .ok{color:var(--green)}
      #p-crack{font-family:var(--mono);font-size:16px;background:#000;color:#4ade80;border-radius:10px;padding:10px;margin-top:10px;min-height:44px}
      .p-ex{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.p-ex .btn{font-size:15px;padding:6px 10px;font-family:var(--mono)}
    </style>
    <div id="p-wrap">
      <div class="panel">
        <h2 style="margin:0 0 10px;font-size:28px">Milyen erős a jelszavad?</h2>
        <input id="p-in" placeholder="Írj be egy jelszót…" autocomplete="off" spellcheck="false">
        <div class="p-warn">Ne a saját, igazi jelszavadat írd be! Találj ki egy hasonlót.</div>
        <div class="p-ex">Próbáld ki: <button class="btn">123456</button><button class="btn">cica2012</button><button class="btn">Fradi!</button><button class="btn">K8#mq2Lp</button><button class="btn">r7#Qm!x2V$k9</button><button class="btn">macska macska macska</button></div>
        <div id="p-res"><div id="p-face"></div><div style="color:var(--muted);font-size:16px">Egy profi törőgépnek ennyi idő kell:</div><div id="p-time">–</div>
          <div class="p-mb"><div id="p-meter"></div></div><div id="p-why"></div><div id="p-bits"></div></div>
        <button class="btn go" id="p-hack" style="margin-top:12px;width:100%">Indítsd a törőgépet!</button>
        <div id="p-crack">A törőgép várakozik…</div>
      </div>
      <div class="panel">
        <h3 style="margin:0 0 8px;color:var(--yellow)">Jó jelszó ellenőrzőlista</h3><div id="p-checks"></div>
        <div class="learn"><b>A hossz a legfontosabb!</b> Minden új karakter sokszorosára növeli a lehetőségek számát.
        A profi jelszó <b>hosszú és véletlenszerű</b>: kis- és nagybetű, szám és írásjel keverve, például <i>r7#Qm!x2V$k9</i> (12 karakter). Ilyet egy <b>jelszókezelő</b> generál és jegyez meg helyetted.<br><br><b>Vigyázat:</b> attól, hogy több szót írsz egymás után, a jelszó nem lesz automatikusan erős! A törőprogramok szótárakkal dolgoznak, ezért a közismert szavak, nevek és ismétlések (pl. <i>macska macska macska</i>) sokkal gyorsabban kiderülnek, mint amit itt a hossz alapján látsz. Ha jelmondatot használsz, legalább 4-5 <b>véletlenszerű, egymáshoz nem illő</b> szó legyen, számmal és írásjellel.<br><br>
        A számítás feltételezi, hogy a támadó másodpercenként <b>100 milliárd</b> jelszót próbál ki (videókártyás törőgéppel), és a jelszavak felét kell végigpróbálnia.<br><br>
        Még biztonságosabb: <b>kétlépcsős azonosítás</b> és <b>jelszókezelő</b> program. Minden oldalhoz más jelszót használj!</div>
      </div>
    </div>`;
    $('#p-in').oninput = () => { update(); sfx.blip() };
    $$('.p-ex .btn', root).forEach(b => b.onclick = () => { $('#p-in').value = b.textContent; update(); sfx.click() });
    $('#p-hack').onclick = hackerAnim; update();
  };
  S.leave = () => clearInterval(fake);
  return S;
})());
