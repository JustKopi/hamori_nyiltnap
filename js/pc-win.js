/* ===== Gépépítő: Windows 11 telepítés és asztal – szimuláció a monitoron ===== */
const WinSim = (() => {
  let C = null, el = null, step = 'off', st = {}, timer = null, benchT = null, tmT = null;
  const CSS = `
  .w-scr{position:absolute;inset:0;font-family:"Segoe UI Variable","Segoe UI",Inter,system-ui,sans-serif;color:#1b1b1b;overflow:hidden;user-select:none}
  .w-dlg{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(760px,86%);background:#f3f3f3;border-radius:10px;box-shadow:0 20px 60px #0007;padding:28px 34px;min-height:340px;display:flex;flex-direction:column}
  .w-dlg h2{font-weight:600;font-size:26px;margin:0 0 6px}.w-dlg p{font-size:14px;color:#444;margin:4px 0 14px;line-height:1.5}
  .w-row{display:flex;flex-direction:column;gap:4px;margin:8px 0}.w-row label{font-size:13px;color:#333}
  .w-sel{appearance:none;border:1px solid #c8c8c8;border-radius:5px;padding:8px 10px;font:inherit;font-size:14px;background:#fff;width:100%}
  .w-btns{margin-top:auto;display:flex;justify-content:flex-end;gap:10px;padding-top:18px}
  .w-b{border:1px solid #c8c8c8;background:#fdfdfd;border-radius:5px;padding:7px 26px;font:inherit;font-size:14px;cursor:pointer}.w-b.p{background:#005fb8;color:#fff;border-color:#005fb8}.w-b:disabled{opacity:.45;cursor:default}
  .w-opt{display:flex;gap:12px;align-items:flex-start;padding:10px 12px;border:1px solid #d6d6d6;border-radius:6px;margin:6px 0;cursor:pointer;background:#fff;font-size:14px}.w-opt.on{border-color:#005fb8;box-shadow:inset 0 0 0 1px #005fb8}
  .w-opt small{display:block;color:#666;font-size:12.5px;margin-top:2px}
  .w-chk{display:flex;gap:10px;align-items:center;font-size:14px;margin:10px 0;cursor:pointer}.w-chk input{width:18px;height:18px}
  .w-in{border:0;border-bottom:2px solid #005fb8;background:#fff;padding:9px 10px;font:inherit;font-size:15px;width:100%;border-radius:4px 4px 0 0}
  .w-tbl{width:100%;border-collapse:collapse;font-size:13.5px;background:#fff}.w-tbl td,.w-tbl th{padding:8px 10px;border-bottom:1px solid #e3e3e3;text-align:left}.w-tbl tr.on td{background:#cce4f7}.w-tbl tr{cursor:pointer}
  .w-prog{height:6px;background:#d6d6d6;border-radius:3px;overflow:hidden;margin:12px 0}.w-prog i{display:block;height:100%;background:#005fb8;transition:width .3s}
  .w-dark{background:#0b1f3a;color:#fff}.w-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center}
  .w-spin{width:44px;height:44px;border-radius:50%;border:4px solid #ffffff33;border-top-color:#fff;animation:wsp 1s linear infinite}@keyframes wsp{to{transform:rotate(360deg)}}
  .w-logo{width:64px;height:64px;border-radius:14px;background:linear-gradient(135deg,#38bdf8,#2563eb);display:grid;place-items:center;color:#fff;font-weight:800;font-size:28px}
  .w-oobe{position:absolute;inset:0;background:linear-gradient(135deg,#dfe9f5,#eef2f8);display:flex;align-items:center;justify-content:center}
  .w-oc{width:min(860px,90%);height:min(470px,86%);background:#fafafa;border-radius:10px;box-shadow:0 10px 40px #0002;display:grid;grid-template-columns:42% 58%;overflow:hidden}
  .w-oc .l{background:linear-gradient(160deg,#e4eefb,#cfe0f6);display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-size:24px;font-weight:600;color:#1b3a63}
  .w-oc .r{padding:28px 30px;display:flex;flex-direction:column;overflow:auto}.w-oc .r h3{margin:0 0 12px;font-weight:600;font-size:21px}
  .w-list{border:1px solid #ddd;border-radius:6px;overflow:auto;max-height:190px;background:#fff}.w-list div{padding:8px 12px;font-size:14px;cursor:pointer}.w-list div.on{background:#cce4f7}
  .w-tg{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #e6e6e6;font-size:14px}
  .w-sw{width:40px;height:20px;border-radius:10px;background:#005fb8;position:relative;cursor:pointer}.w-sw::after{content:"";position:absolute;right:3px;top:3px;width:14px;height:14px;border-radius:50%;background:#fff;transition:all .2s}.w-sw.off{background:#8a8a8a}.w-sw.off::after{right:23px}
  .w-desk{position:absolute;inset:0;background:radial-gradient(120% 90% at 30% 110%,#3b82f6 0%,#1e3a8a 35%,#0b1736 70%);overflow:hidden}
  .w-desk::before{content:"";position:absolute;left:40%;top:30%;width:60%;height:90%;border-radius:50%;background:radial-gradient(closest-side,#60a5fa88,transparent);filter:blur(30px)}
  .w-ico{position:absolute;left:14px;display:flex;flex-direction:column;align-items:center;width:78px;color:#fff;font-size:12px;text-align:center;gap:4px;cursor:pointer;padding:6px;border-radius:4px}.w-ico:hover{background:#ffffff22}
  .w-ico i{width:42px;height:42px;border-radius:9px;display:grid;place-items:center;font-style:normal;font-weight:700}
  .w-bar{position:absolute;left:0;right:0;bottom:0;height:46px;background:#1f2633e6;backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;gap:6px}
  .w-bar .t{width:36px;height:36px;border-radius:6px;display:grid;place-items:center;cursor:pointer;color:#fff}.w-bar .t:hover{background:#ffffff1f}
  .w-clock{position:absolute;right:14px;bottom:6px;color:#fff;font-size:12px;text-align:right;line-height:1.3}
  .w-win{position:absolute;background:#f9f9f9;border-radius:8px;box-shadow:0 18px 50px #000a;overflow:hidden;display:flex;flex-direction:column;font-size:13.5px}
  .w-win .tb{height:34px;display:flex;align-items:center;justify-content:space-between;padding:0 4px 0 12px;background:#f0f0f0;font-size:12.5px}
  .w-win .tb b{font-weight:600}.w-win .x{width:40px;height:30px;border:0;background:transparent;cursor:pointer;font-size:14px}.w-win .x:hover{background:#c42b1c;color:#fff}
  .w-win .bd{padding:14px 16px;overflow:auto;flex:1}
  .w-start{position:absolute;left:50%;bottom:54px;transform:translateX(-50%);width:440px;background:#1f2633f2;border-radius:10px;padding:18px;color:#fff;box-shadow:0 20px 50px #000a}
  .w-start .g{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.w-start .a{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;padding:10px 4px;border-radius:6px;cursor:pointer}.w-start .a:hover{background:#ffffff1a}
  .w-lock{position:absolute;inset:0;background:linear-gradient(160deg,#0f2a52,#1e40af 60%,#3b82f6);color:#fff;cursor:pointer}
  .w-graph{width:100%;height:70px;background:#fff;border:1px solid #ddd;border-radius:4px}`;
  const icoS = n => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[n]}</svg>`;
  function open(ctx) { C = ctx; el = ctx.el; if (!document.getElementById('w-css')) { const s = document.createElement('style'); s.id = 'w-css'; s.textContent = CSS; document.head.appendChild(s) } render() }
  function set(s, extra = {}) { step = s; Object.assign(st, extra); render(); C && C.onPaint && C.onPaint() }
  function power(mode) { clearTimeout(timer); clearInterval(benchT); clearInterval(tmT); st = { win: null }; if (mode === 'off') step = 'off'; else if (mode === 'noos') step = 'noos'; else if (mode === 'os') step = 'boot'; render(); if (mode === 'os') { timer = setTimeout(() => set('lock'), (C.bootTime || 8) * 220) } }
  const T = (h) => el.innerHTML = `<div class="w-scr">${h}</div>`;
  function render() {
    if (!el) return; clearInterval(tmT);
    const s = step;
    if (s === 'off') return T('<div style="position:absolute;inset:0;background:#050505"></div>');
    if (s === 'noos') return T(`<div style="position:absolute;inset:0;background:#000;color:#ddd;font-family:monospace;padding:28px;font-size:15px;line-height:1.7">${(C.bios || []).map(l => `<div style="color:${l.startsWith('!') ? '#f87171' : '#ddd'}">${l.replace(/^!/, '')}</div>`).join('')}<br><div style="color:#fbbf24">Reboot and Select proper Boot device</div><br>
      <button class="w-b p" id="w-usb" style="font-family:Inter,sans-serif">Telepítő USB-meghajtó csatlakoztatása</button><div style="font-family:Inter,sans-serif;color:#9aa0ab;font-size:13px;margin-top:8px">A valóságban egy előre elkészített, Windows-telepítőt tartalmazó pendrive-ot dugunk be.</div></div>`), on('#w-usb', () => { C.onUsb && C.onUsb(); set('setupboot'); timer = setTimeout(() => set('lang'), 2600) });
    if (s === 'setupboot' || s === 'boot') return T(`<div class="w-center w-dark" style="background:#000"><div class="w-logo">W</div><div class="w-spin"></div><div style="font-size:13px;color:#9aa0ab">${s === 'boot' ? 'Windows indítása…' : 'Telepítő betöltése a USB-ről…'}</div></div>`);
    if (s === 'lang') return T(`<div style="position:absolute;inset:0;background:#2563eb33"></div><div class="w-dlg"><h2>Válassza ki a nyelvi beállításokat</h2><p>Windows 11 telepítő – szimuláció</p>
      <div class="w-row"><label>Telepítendő nyelv</label><select class="w-sel"><option>magyar</option><option>English (United States)</option><option>Deutsch</option></select></div>
      <div class="w-row"><label>Idő- és pénznemformátum</label><select class="w-sel"><option>magyar (Magyarország)</option><option>English (United Kingdom)</option></select></div>
      <div class="w-row"><label>Billentyűzet vagy beviteli mód</label><select class="w-sel"><option>Magyar</option><option>US</option></select></div>
      <div class="w-btns"><button class="w-b p" id="w-n">Tovább</button></div></div>`), on('#w-n', () => set('ed'));
    if (s === 'ed') return T(`<div style="position:absolute;inset:0;background:#2563eb33"></div><div class="w-dlg"><h2>Válassza ki a telepítendő kiadást</h2><p>Nincs termékkulcsod? Később is aktiválhatod.</p>
      ${['Windows 11 Home', 'Windows 11 Pro', 'Windows 11 Education'].map((e, i) => `<div class="w-opt ${st.ed === i ? 'on' : ''}" data-e="${i}"><input type="radio" ${st.ed === i ? 'checked' : ''}><div>${e}<small>${['Otthoni használatra', 'Vállalkozásoknak: BitLocker, távoli asztal, tartományhoz csatlakozás', 'Iskoláknak'][i]}</small></div></div>`).join('')}
      <div class="w-btns"><button class="w-b" id="w-bk">Vissza</button><button class="w-b p" id="w-n" ${st.ed == null ? 'disabled' : ''}>Tovább</button></div></div>`), $$('.w-opt', el).forEach(o => o.onclick = () => set('ed', { ed: +o.dataset.e })), on('#w-n', () => set('lic')), on('#w-bk', () => set('lang'));
    if (s === 'lic') return T(`<div style="position:absolute;inset:0;background:#2563eb33"></div><div class="w-dlg"><h2>Alkalmazandó megjegyzések és licencfeltételek</h2>
      <div style="background:#fff;border:1px solid #ddd;border-radius:6px;padding:12px;height:130px;overflow:auto;font-size:12.5px;color:#555;line-height:1.5">Ez egy oktatási szimuláció. A valódi telepítésnél itt olvasható a szoftver licencszerződése. Mindig olvasd el, mit fogadsz el! A szerződés leírja, hány gépen használhatod a szoftvert, milyen adatokat küldhet a gyártónak, és mit nem szabad vele csinálni…</div>
      <label class="w-chk"><input type="checkbox" id="w-ok" ${st.ok ? 'checked' : ''}> Elfogadom a licencfeltételeket</label>
      <div class="w-btns"><button class="w-b" id="w-bk">Vissza</button><button class="w-b p" id="w-n" ${st.ok ? '' : 'disabled'}>Tovább</button></div></div>`), on('#w-ok', e => set('lic', { ok: e.target.checked }), 'change'), on('#w-n', () => set('disk')), on('#w-bk', () => set('ed'));
    if (s === 'disk') { const d = C.drives(); if (st.disk == null) st.disk = 0;
      return T(`<div style="position:absolute;inset:0;background:#2563eb33"></div><div class="w-dlg"><h2>Hová szeretné telepíteni a Windows 11-et?</h2>
        <table class="w-tbl"><tr><th>Név</th><th>Teljes méret</th><th>Szabad terület</th><th>Típus</th></tr>${d.map((x, i) => `<tr class="${st.disk === i ? 'on' : ''}" data-d="${i}"><td>${i}. meghajtó – ${x.name}</td><td>${x.gb} GB</td><td>${x.os ? (x.gb - 26).toFixed(1) : x.gb} GB</td><td>${x.os ? 'Elsődleges' : 'Kiosztatlan terület'}</td></tr>`).join('')}</table>
        <p style="margin-top:12px">${d[st.disk] && d[st.disk].kind === 'hdd' ? '<b>Figyelem:</b> merevlemezre (HDD) telepítve a rendszer sokkal lassabban fog indulni, mint SSD-ről.' : 'Tipp: a rendszert mindig a leggyorsabb SSD-re telepítsd!'}</p>
        <div class="w-btns"><button class="w-b" id="w-bk">Vissza</button><button class="w-b p" id="w-n">Tovább</button></div></div>`), $$('.w-tbl tr[data-d]', el).forEach(r => r.onclick = () => set('disk', { disk: +r.dataset.d })), on('#w-n', () => startCopy()), on('#w-bk', () => set('lic')) }
    if (s === 'copy') { const ph = ['Windows-fájlok másolása', 'Fájlok előkészítése a telepítésre', 'Szolgáltatások telepítése', 'Frissítések telepítése'];
      return T(`<div style="position:absolute;inset:0;background:#2563eb33"></div><div class="w-dlg"><h2>Windows 11 telepítése</h2><p>A számítógép a telepítés során többször újraindulhat.</p>
        ${ph.map((p, i) => `<div style="font-size:14px;margin:6px 0;color:${i < st.ph ? '#107c10' : i === st.ph ? '#1b1b1b' : '#999'}">${i < st.ph ? '✓ ' : i === st.ph ? '• ' : ''}${p}${i === st.ph ? ` (${Math.round(st.pp)}%)` : ''}</div>`).join('')}
        <div class="w-prog"><i style="width:${st.tot}%"></i></div><p style="font-size:12.5px">Meghajtó: ${C.drives()[st.disk].name} · sebesség: ${C.drives()[st.disk].read} MB/s</p></div>`) }
    if (s === 'reboot') return T(`<div class="w-center w-dark"><div class="w-logo">W</div><div style="font-size:16px">A számítógép újraindul…</div><div class="w-spin"></div></div>`);
    if (s.startsWith('o')) return oobe(s);
    if (s === 'final') return T(`<div class="w-center w-dark" style="background:linear-gradient(135deg,#0b1f3a,#1e3a8a)"><div style="font-size:26px;font-weight:300">Szia!</div><div style="font-size:15px;color:#cbd5e1">Egy pillanat… Előkészítjük az asztalt.</div><div class="w-spin"></div></div>`);
    if (s === 'lock') { const d = new Date(); return T(`<div class="w-lock" id="w-lk"><div style="position:absolute;left:0;right:0;top:18%;text-align:center"><div style="font-size:84px;font-weight:600">${d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}</div><div style="font-size:20px">${d.toLocaleDateString('hu-HU', { weekday: 'long', month: 'long', day: 'numeric' })}</div></div><div style="position:absolute;bottom:30px;width:100%;text-align:center;font-size:13px;opacity:.8">Kattints a bejelentkezéshez</div></div>`), on('#w-lk', () => set('pin')) }
    if (s === 'pin') return T(`<div class="w-lock"><div class="w-center"><div style="width:96px;height:96px;border-radius:50%;background:#ffffff33;display:grid;place-items:center">${icoS('user')}</div><div style="font-size:22px">${esc(st.user || C.user || 'Diák')}</div><input id="w-pin" class="w-in" style="width:220px;text-align:center;background:#ffffffee;color:#111" placeholder="PIN-kód" type="password" maxlength="6"><div style="font-size:12.5px;opacity:.8">Bármilyen PIN jó – ez csak szimuláció</div></div></div>`), focusIn('#w-pin', () => set('desk'));
    if (s === 'desk') return desk();
  }
  function on(sel, fn, ev = 'click') { const e = el.querySelector(sel); if (e) e.addEventListener(ev, fn) }
  function focusIn(sel, fn) { const i = el.querySelector(sel); if (!i) return; setTimeout(() => i.focus(), 50); i.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') fn() }) }
  function startCopy() {
    const d = C.drives()[st.disk], speed = d.kind === 'hdd' ? 2.6 : d.kind === 'ssd25' ? 1.4 : 1; let t = 0; const dur = 16 * speed;
    st.ph = 0; st.pp = 0; st.tot = 0; set('copy'); C.onCopy && C.onCopy(true);
    clearInterval(timer); timer = setInterval(() => {
      t += .25; st.tot = Math.min(100, t / dur * 100); st.ph = Math.min(3, Math.floor(st.tot / 25)); st.pp = (st.tot % 25) * 4; if (st.tot >= 100) { clearInterval(timer); C.onCopy && C.onCopy(false); set('reboot'); timer = setTimeout(() => set('o1'), 2500 * speed); return } render(); C.onPaint && C.onPaint();
    }, 250);
  }
  function oobe(s) {
    const L = { o1: 'Ez a megfelelő ország vagy régió?', o2: 'Megfelelő ez a billentyűzetkiosztás?', o3: 'Csatlakozzunk egy hálózathoz', o4: 'Nevezd el az eszközt', o5: 'Ki fogja használni ezt az eszközt?', o6: 'Adatvédelmi beállítások' }[s];
    let body = '';
    if (s === 'o1') body = `<div class="w-list">${['Magyarország', 'Ausztria', 'Szlovákia', 'Románia', 'Németország'].map((c, i) => `<div class="${i ? '' : 'on'}">${c}</div>`).join('')}</div>`;
    if (s === 'o2') body = `<div class="w-list">${['Magyar', 'Magyar (101 billentyűs)', 'Egyesült államokbeli', 'Német'].map((c, i) => `<div class="${i ? '' : 'on'}">${c}</div>`).join('')}</div>`;
    if (s === 'o3') body = C.net() === 'eth' ? `<div class="w-opt on">${icoS('internet')}<div>Ethernet<small>Csatlakoztatva – internet-hozzáférés</small></div></div>` : C.net() === 'wifi' ? `<div class="w-opt ${st.wifi ? 'on' : ''}" id="w-wf">${icoS('wifi2')}<div>NyiltNap-WiFi<small>${st.wifi ? 'Csatlakoztatva, biztonságos' : 'Biztonságos – kattints a csatlakozáshoz'}</small></div></div>` : `<p>Nem található hálózati adapter.</p>`;
    if (s === 'o4') body = `<p>Ez a név jelenik meg a hálózaton.</p><input id="w-dn" class="w-in" value="${esc(st.dev || C.devName || 'DIAK-PC')}" maxlength="15">`;
    if (s === 'o5') body = `<p>Add meg a neved:</p><input id="w-un" class="w-in" value="${esc(st.user || '')}" placeholder="Felhasználónév" maxlength="20">`;
    if (s === 'o6') body = ['Hely', 'Eszköz megkeresése', 'Diagnosztikai adatok', 'Hirdetési azonosító'].map((n, i) => `<div class="w-tg">${n}<span class="w-sw ${st['p' + i] ? 'off' : ''}" data-p="${i}"></span></div>`).join('') + '<p style="margin-top:10px;font-size:12.5px">Tipp: csak azt engedélyezd, amire tényleg szükséged van!</p>';
    T(`<div class="w-oobe"><div class="w-oc"><div class="l">${L}</div><div class="r">${body}<div class="w-btns">${s === 'o3' && C.net() !== 'eth' ? '<button class="w-b" id="w-sk">Nincs internetem</button>' : ''}<button class="w-b p" id="w-n">${s === 'o1' || s === 'o2' ? 'Igen' : s === 'o6' ? 'Elfogadás' : 'Tovább'}</button></div></div></div></div>`);
    $$('.w-list div', el).forEach(d => d.onclick = () => { $$('.w-list div', el).forEach(x => x.classList.toggle('on', x === d)) });
    on('#w-wf', () => set('o3', { wifi: true }));
    $$('.w-sw', el).forEach(w => w.onclick = () => { st['p' + w.dataset.p] = !st['p' + w.dataset.p]; w.classList.toggle('off') });
    const nx = { o1: 'o2', o2: 'o3', o3: 'o4', o4: 'o5', o5: 'o6', o6: 'fin' }[s];
    const go = () => {
      if (s === 'o4') st.dev = (el.querySelector('#w-dn').value || 'DIAK-PC').toUpperCase();
      if (s === 'o5') { const u = el.querySelector('#w-un').value.trim(); if (!u) { el.querySelector('#w-un').style.borderColor = '#c42b1c'; return } st.user = u }
      if (nx === 'fin') { set('final'); C.onInstalled && C.onInstalled(st.disk, st.user, st.dev); timer = setTimeout(() => set('desk'), 3200); return }
      set(nx);
    };
    on('#w-n', go); on('#w-sk', () => set('o4'));
    if (s === 'o4' || s === 'o5') focusIn(s === 'o4' ? '#w-dn' : '#w-un', go);
  }
  function desk() {
    const d = new Date(), w = st.win;
    T(`<div class="w-desk">
      ${[['Gépinformáció', 'pc', '#2563eb', 'info'], ['Teljesítményteszt', 'activity', '#16a34a', 'bench'], ['Feladatkezelő', 'layers', '#7c3aed', 'tm'], ['Lomtár', 'trash', '#64748b', null]].map(([n, ic, c, k], i) => `<div class="w-ico" data-w="${k || ''}" style="top:${14 + i * 86}px"><i style="background:${c}">${icoS(ic)}</i>${n}</div>`).join('')}
      ${w ? `<div class="w-win" style="left:14%;top:7%;width:72%;height:76%"><div class="tb"><b>${{ info: 'Gépinformáció', bench: 'Teljesítményteszt', tm: 'Feladatkezelő' }[w]}</b><button class="x" id="w-x">✕</button></div><div class="bd" id="w-bd"></div></div>` : ''}
      ${st.start ? `<div class="w-start"><div style="font-size:13px;margin-bottom:10px;opacity:.8">Rögzített</div><div class="g">${[['Gépinformáció', 'pc', 'info'], ['Teljesítményteszt', 'activity', 'bench'], ['Feladatkezelő', 'layers', 'tm'], ['Beállítások', 'refresh', 'info']].map(([n, ic, k]) => `<div class="a" data-w="${k}">${icoS(ic)}${n}</div>`).join('')}</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;border-top:1px solid #ffffff22;padding-top:12px"><span>${icoS('user')} ${esc(st.user || C.user || 'Diák')}</span><button class="w-b" id="w-off" style="padding:5px 12px">Leállítás</button></div></div>` : ''}
      <div class="w-bar"><div class="t" id="w-st"><span style="width:20px;height:20px;border-radius:6px;background:linear-gradient(135deg,#38bdf8,#2563eb);display:block"></span></div>${[['search'], ['box'], ['globe'], ['pc']].map(([ic]) => `<div class="t">${icoS(ic)}</div>`).join('')}
      <div class="w-clock">${d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}<br>${d.toLocaleDateString('hu-HU')}</div></div></div>`);
    $$('[data-w]', el).forEach(i => i.onclick = () => { if (i.dataset.w) { st.start = false; set('desk', { win: i.dataset.w }) } });
    on('#w-st', () => set('desk', { start: !st.start })); on('#w-x', () => { clearInterval(benchT); C.onLoad && C.onLoad(0); set('desk', { win: null }) }); on('#w-off', () => C.onShutdown && C.onShutdown());
    const bd = el.querySelector('#w-bd'); if (!bd) return;
    if (w === 'info') { const s = C.specs(); bd.innerHTML = `<h3 style="margin:0 0 10px;font-weight:600">${esc(st.dev || 'DIAK-PC')}</h3><table class="w-tbl">${s.map(([k, v]) => `<tr><td style="width:34%;color:#555">${k}</td><td><b>${v}</b></td></tr>`).join('')}</table>` }
    if (w === 'tm') { const draw = () => { const r = C.sensors(); if (!r || !el.querySelector('#w-bd')) return; el.querySelector('#w-bd').innerHTML = `<table class="w-tbl">${[['Processzor', `${Math.round(r.cpuMHz)} MHz · ${Math.round(r.cpuT)} °C · ${Math.round(r.cpuW)} W`], ['Memória', `${r.ramUse.toFixed(1)} / ${r.ram} GB használatban`], ['Videokártya', r.gpuT != null ? `${Math.round(r.gpuT)} °C · ${Math.round(r.gpuW)} W` : 'integrált'], ['Ventilátorok', `CPU: ${Math.round(r.fanC)} rpm · Ház: ${Math.round(r.fanCase)} rpm`], ['Tápegység terhelése', `${Math.round(r.psuW)} W (${Math.round(r.psuPct)}%)`]].map(([k, v]) => `<tr><td style="width:34%;color:#555">${k}</td><td><b>${v}</b></td></tr>`).join('')}</table><p style="color:#666;font-size:12.5px">Az értékek élőben frissülnek a szimulációból.</p>` }; draw(); tmT = setInterval(draw, 700) }
    if (w === 'bench') { bd.innerHTML = `<p>A teljesítményteszt 10 másodpercig teljes terhelést ad a processzorra és a videokártyára, közben figyeld a hőmérsékletet!</p><button class="w-b p" id="w-run">Teszt indítása</button><div id="w-res" style="margin-top:14px"></div>`; on('#w-run', runBench) }
  }
  function runBench() {
    const r = el.querySelector('#w-res'), b = el.querySelector('#w-run'); b.disabled = true; let t = 0; C.onLoad && C.onLoad(1);
    clearInterval(benchT); benchT = setInterval(() => {
      t += .5; const s = C.sensors(); if (!el.querySelector('#w-res')) { clearInterval(benchT); return }
      if (!s) { clearInterval(benchT); return }
      r.innerHTML = `<div class="w-prog"><i style="width:${t * 10}%"></i></div>CPU: <b>${Math.round(s.cpuT)} °C</b> · ${Math.round(s.cpuW)} W ${s.throttle ? '<b style="color:#c42b1c">– TÚLMELEGEDÉS, LASSÍT!</b>' : ''} · GPU: <b>${s.gpuT != null ? Math.round(s.gpuT) + ' °C' : '–'}</b> · Táp: ${Math.round(s.psuPct)}%`;
      if (t >= 10) { clearInterval(benchT); C.onLoad && C.onLoad(0); const f = C.fps(), sc = C.score(); b.disabled = false;
        r.innerHTML += `<h3 style="margin:14px 0 6px;font-weight:600">Eredmény: ${sc.toLocaleString('hu-HU')} pont</h3><table class="w-tbl"><tr><th>Játék</th><th>1080p</th><th>1440p</th><th>4K</th></tr>${f.map(g => `<tr><td>${g.n}</td>${['1080p', '1440p', '4K'].map(k => `<td style="color:${g.r[k] >= 60 ? '#107c10' : g.r[k] >= 30 ? '#9a6700' : '#c42b1c'}"><b>${g.r[k]}</b> FPS</td>`).join('')}</tr>`).join('')}</table>`; C.onBench && C.onBench(sc, f) }
    }, 500);
  }
  // kis kép a 3D monitorra
  function paint(c, w, h) {
    const s = step;
    if (s === 'off') { c.fillStyle = '#0d0e10'; c.fillRect(0, 0, w, h); return }
    if (s === 'noos') { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.fillStyle = '#ddd'; c.font = '26px monospace'; (C.bios || []).forEach((l, i) => { c.fillStyle = l.startsWith('!') ? '#f87171' : '#ddd'; c.fillText(l.replace(/^!/, ''), 30, 50 + i * 36) }); c.fillStyle = '#fbbf24'; c.fillText('Reboot and Select proper Boot device', 30, h - 60); return }
    if (s === 'desk' || s === 'lock' || s === 'pin' || s === 'final') { const g = c.createRadialGradient(w * .3, h * 1.1, 10, w * .5, h * .5, w); g.addColorStop(0, '#3b82f6'); g.addColorStop(.45, '#1e3a8a'); g.addColorStop(1, '#0b1736'); c.fillStyle = g; c.fillRect(0, 0, w, h); if (s === 'desk') { c.fillStyle = '#1f2633e6'; c.fillRect(0, h - 40, w, 40); if (st.win) { c.fillStyle = '#f9f9f9'; c.fillRect(w * .14, h * .07, w * .72, h * .76) } } else { c.fillStyle = '#fff'; c.font = '600 80px Inter'; c.textAlign = 'center'; c.fillText(new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }), w / 2, h * .38); c.textAlign = 'left' } return }
    if (s === 'boot' || s === 'setupboot' || s === 'reboot') { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); const g = c.createLinearGradient(w / 2 - 40, h / 2 - 80, w / 2 + 40, h / 2); g.addColorStop(0, '#38bdf8'); g.addColorStop(1, '#2563eb'); c.fillStyle = g; c.fillRect(w / 2 - 40, h / 2 - 90, 80, 80); return }
    c.fillStyle = s.startsWith('o') ? '#e4eefb' : '#c7d7f5'; c.fillRect(0, 0, w, h); c.fillStyle = '#f3f3f3'; c.fillRect(w * .15, h * .18, w * .7, h * .64); c.fillStyle = '#1b1b1b'; c.font = '600 34px Inter'; c.fillText(s === 'copy' ? 'Windows 11 telepítése…' : 'Windows 11 telepítő', w * .19, h * .3);
    if (s === 'copy') { c.fillStyle = '#d6d6d6'; c.fillRect(w * .19, h * .62, w * .62, 12); c.fillStyle = '#005fb8'; c.fillRect(w * .19, h * .62, w * .62 * st.tot / 100, 12) }
  }
  const stepName = () => step;
  return { open, power, paint, stepName };
})();
