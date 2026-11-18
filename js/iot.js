/* ===== 11. Okosotthon (IoT): szenzorok, szabályok, felhő ===== */
App.add((() => {
  const S = {
    id: 'iot', icon: '', title: 'Okosotthon (IoT)', color: '#34d399',
    desc: 'Szenzorok, szabályok, felhő! Programozd be az okosotthont, és nézd, hogyan reagál.',
    topic: 'Dolgok internete (IoT), szenzorok, felhőszolgáltatások, automatizálás'
  };
  const st = { temp: 22, light: 70, soil: 50, motion: 0, armed: false, fan: false, lamp: false, pump: false, siren: false, night: false };
  const rules = { temp: 26, light: 30, soil: 25 };
  let hist = [], acc = 0, logAcc = 0, cv;
  function apply() {
    const was = { ...st };
    st.fan = st.temp > rules.temp; st.lamp = st.light < rules.light; st.pump = st.soil < rules.soil; st.siren = st.armed && st.motion > 0;
    for (const k of ['fan', 'lamp', 'pump', 'siren']) if (st[k] !== was[k]) { if (st[k]) { beep(k === 'siren' ? 880 : 700, .1, 'triangle', .06); cloud(`{"eszkoz":"${k}","allapot":"BE"}`, 'ok') } else cloud(`{"eszkoz":"${k}","allapot":"KI"}`) }
    render();
  }
  function render() {
    $('#i-fan').classList.toggle('on', st.fan); $('#i-lamp').classList.toggle('on', st.lamp); $('#i-pump').classList.toggle('on', st.pump);
    $('#i-house').classList.toggle('night', st.light < 35); $('#i-house').classList.toggle('alarm', st.siren);
    $('#i-tv').textContent = st.temp.toFixed(1).replace('.', ',') + ' °C'; $('#i-lv').textContent = Math.round(st.light) + ' %'; $('#i-sv').textContent = Math.round(st.soil) + ' %';
    $('#i-plant').style.color = st.soil < 20 ? '#a16207' : '#15803d'; $('#i-arm').textContent = st.armed ? 'Riasztó: ÉLESÍTVE' : 'Riasztó: kikapcsolva'; $('#i-arm').classList.toggle('sel', st.armed);
    $('#i-sun').innerHTML = icon(st.light < 35 ? 'moon' : 'sun', 52, 1.8); $('#i-sun').style.color = st.light < 35 ? '#e5e7eb' : '#fbbf24';
    $$('.i-dev').forEach(d => { const k = d.dataset.k; d.querySelector('b').textContent = st[k] ? 'BE' : 'KI'; d.classList.toggle('on', st[k]) });
  }
  function cloud(msg, cls = '') { const l = $('#i-log'); const d = document.createElement('div'); d.className = cls; d.textContent = `← ${msg}`; l.prepend(d); while (l.children.length > 14) l.lastChild.remove() }
  function chart() {
    const c = cv.getContext('2d'), w = cv.width = cv.clientWidth, h = cv.height = cv.clientHeight; c.clearRect(0, 0, w, h);
    c.strokeStyle = '#ffffff12'; for (let y = 0; y <= h; y += h / 4) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke() }
    const ser = [['temp', '#fb923c', v => (v - 5) / 40], ['light', '#fbbf24', v => v / 100], ['soil', '#5b9dff', v => v / 100]];
    for (const [k, col, f] of ser) {
      c.beginPath(); hist.forEach((p, i) => { const x = i / 79 * w, y = h - clamp(f(p[k]), 0, 1) * (h - 8) - 4; i ? c.lineTo(x, y) : c.moveTo(x, y) });
      c.strokeStyle = col; c.lineWidth = 2.5; c.stroke();
    }
  }
  S.build = root => {
    root.innerHTML = `<style>
      #i-wrap{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:12px;padding:12px}
      #i-house{position:relative;border-radius:20px;overflow:hidden;background:linear-gradient(#5cc8ff,#bde9ff 60%,#3a8f3a 60%);transition:background .6s;min-height:0}
      #i-house.night{background:linear-gradient(#0a1030,#1a2050 60%,#1b3b1b 60%)}
      #i-house.alarm{animation:ialarm .5s infinite}
      @keyframes ialarm{50%{box-shadow:inset 0 0 120px #ff0000}}
      .i-home{position:absolute;left:12%;right:12%;top:22%;bottom:22%;background:#f0e6d2;border-radius:6px;box-shadow:0 10px 30px #0006}
      .night .i-home{background:#3a3550}
      .i-roof{position:absolute;left:6%;right:6%;top:4%;height:20%;background:#b33a3a;clip-path:polygon(50% 0,100% 100%,0 100%)}
      .i-it{position:absolute;text-align:center;line-height:1;color:#334155}.i-it span{display:inline-block}.night .i-it{color:#cbd5e1}
      .i-it small{display:block;font-size:13px;font-weight:800;color:#222;margin-top:2px;background:#fffc;border-radius:6px;padding:1px 4px}
      #i-fan.on span{display:inline-block;animation:spin .4s linear infinite}
      #i-lamp.on span{color:#f59e0b;filter:drop-shadow(0 0 18px #fde047) drop-shadow(0 0 40px #fde047)}
      #i-pump span{opacity:.35}#i-pump.on span{opacity:1;color:#0284c7;animation:drip .6s infinite}
      @keyframes drip{50%{transform:translateY(6px)}}
      #i-sun{position:absolute;right:6%;top:4%}
      #i-side{display:flex;flex-direction:column;gap:10px;overflow:auto;min-height:0}
      .i-row{display:grid;grid-template-columns:150px 1fr 70px;gap:10px;align-items:center;font-size:16px;margin:6px 0}
      .i-row input{width:100%;height:30px}.i-row b{text-align:right;font-family:var(--mono)}
      .i-rule{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:16px;padding:6px 0;border-bottom:1px dashed var(--line)}
      .i-rule input{width:64px;font-size:17px;padding:4px;border-radius:8px;border:2px solid var(--line);background:#101216;color:var(--yellow);text-align:center;font-weight:800}
      .i-k{color:var(--violet);font-weight:900;font-family:var(--mono)}
      .i-devs{display:flex;gap:6px;flex-wrap:wrap}.i-dev{flex:1;display:flex;gap:6px;align-items:center;justify-content:center;padding:6px;border-radius:10px;background:#1c1f26;border:2px solid var(--line);font-size:14px}.i-dev.on{border-color:var(--green);color:var(--green)}
      #i-cv{width:100%;height:110px;display:block}
      #i-log{font-family:var(--mono);font-size:12px;color:#a3a8b3;height:110px;overflow:hidden}#i-log .ok{color:var(--green)}
    </style>
    <div id="i-wrap">
      <div id="i-house"><div id="i-sun"></div><div class="i-roof"></div><div class="i-home"></div>
        <div class="i-it" id="i-lamp" style="left:22%;top:28%"><span>${icon('bulb', 46)}</span><small>lámpa</small></div>
        <div class="i-it" id="i-fan" style="left:46%;top:30%"><span>${icon('fan', 46)}</span><small>ventilátor</small></div>
        <div class="i-it" style="left:68%;top:30%"><span>${icon('thermo', 46)}</span><small id="i-tv">22 °C</small></div>
        <div class="i-it" style="left:24%;top:54%"><span>${icon('camera', 46)}</span><small>mozgásérzékelő</small></div>
        <div class="i-it" id="i-pump" style="left:72%;top:80%"><span>${icon('drop', 46)}</span><small>öntöző</small></div>
        <div class="i-it" style="left:84%;top:80%"><span id="i-plant">${icon('plant', 50)}</span></div>
        <div class="i-it" style="left:48%;top:56%"><span>${icon('chip', 46)}</span><small>vezérlő (Arduino)</small></div>
      </div>
      <div id="i-side">
        <div class="panel"><b>Szenzorok</b> – állítsd a csúszkákat!
          <div class="i-row">Hőmérséklet<input type="range" id="i-t" min="10" max="40" step=".5" value="22"><b id="i-tvv">22</b></div>
          <div class="i-row">Fényerő<input type="range" id="i-l" min="0" max="100" value="70"><b id="i-lv">70 %</b></div>
          <div class="i-row">Talajnedvesség<input type="range" id="i-s" min="0" max="100" value="50"><b id="i-sv">50 %</b></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" id="i-arm">Riasztó</button><button class="btn" id="i-move">Mozgás!</button><button class="btn" id="i-day">Nappal / éjszaka</button></div></div>
        <div class="panel"><b>Szabályok</b> (írd át a számokat!)
          <div class="i-rule"><span class="i-k">HA</span> hőmérséklet &gt; <input id="r-t" value="26"> °C <span class="i-k">AKKOR</span> ventilátor BE</div>
          <div class="i-rule"><span class="i-k">HA</span> fényerő &lt; <input id="r-l" value="30"> % <span class="i-k">AKKOR</span> lámpa BE</div>
          <div class="i-rule"><span class="i-k">HA</span> talajnedvesség &lt; <input id="r-s" value="25"> % <span class="i-k">AKKOR</span> öntözés BE</div>
          <div class="i-rule"><span class="i-k">HA</span> mozgás <span class="i-k">ÉS</span> riasztó élesítve <span class="i-k">AKKOR</span> sziréna</div>
          <div class="i-devs" style="margin-top:8px">${[['fan', 'fan', 'Ventilátor'], ['lamp', 'bulb', 'Lámpa'], ['pump', 'drop', 'Öntözés'], ['siren', 'siren', 'Sziréna']].map(([k, i, n]) => `<div class="i-dev" data-k="${k}">${icon(i, 16)} ${n}: <b>KI</b></div>`).join('')}</div></div>
        <div class="panel"><b>Felhő-irányítópult</b> <span style="font-size:12px;color:var(--muted)">— <span style="color:#fb923c">hőmérséklet</span> • <span style="color:#fbbf24">fény</span> • <span style="color:#5b9dff">talaj</span></span>
          <canvas id="i-cv"></canvas><div id="i-log"></div></div>
        <div class="learn" style="margin:0">Az <b>IoT</b> (dolgok internete) eszközei szenzorokkal mérnek, a mért adatokat a <b>felhőbe</b> küldik, és szabályok vagy programok alapján vezérelnek. Az iskolában Arduino-val és szenzorokkal építünk ilyet!</div>
      </div></div>`;
    cv = $('#i-cv');
    $('#i-t').oninput = e => { st.temp = +e.target.value; $('#i-tvv').textContent = st.temp; apply() };
    $('#i-l').oninput = e => { st.light = +e.target.value; apply() };
    $('#i-s').oninput = e => { st.soil = +e.target.value; apply() };
    $('#i-arm').onclick = () => { st.armed = !st.armed; sfx.click(); apply() };
    $('#i-move').onclick = () => { st.motion = 3; cloud('{"mozgas":true}', 'ok'); if (!st.armed) toast('Mozgást érzékeltünk – de a riasztó nincs élesítve.', '#fbbf24'); apply() };
    $('#i-day').onclick = () => { st.light = st.light < 35 ? 75 : 10; $('#i-l').value = st.light; sfx.click(); apply() };
    [['r-t', 'temp'], ['r-l', 'light'], ['r-s', 'soil']].forEach(([id, k]) => $('#' + id).oninput = e => { const v = parseFloat(String(e.target.value).replace(',', '.')); if (!isNaN(v)) { rules[k] = v; apply() } });
    $$('input', root).forEach(i => i.addEventListener('keydown', e => e.stopPropagation()));
    for (let k = 0; k < 80; k++) hist.push({ temp: st.temp, light: st.light, soil: st.soil });
    apply();
  };
  S.tick = dt => {
    acc += dt; logAcc += dt;
    if (st.motion > 0) { st.motion -= dt; if (st.motion <= 0) { st.motion = 0; apply() } }
    if (st.pump) { st.soil = Math.min(100, st.soil + dt * 6); $('#i-s').value = st.soil; if (st.soil >= rules.soil) apply() }
    if (st.siren && Math.floor(performance.now() / 250) % 2 && acc > .2) beep(1000, .08, 'square', .03);
    if (acc > .25) {
      acc = 0; hist.push({ temp: st.temp + (Math.random() - .5) * .6, light: st.light + (Math.random() - .5) * 2, soil: st.soil }); hist.shift(); chart();
      $('#i-sv').textContent = Math.round(st.soil) + ' %';
    }
    if (logAcc > 2) { logAcc = 0; cloud(`{"homerseklet":${st.temp.toFixed(1)},"feny":${Math.round(st.light)},"talaj":${Math.round(st.soil)}}`) }
  };
  return S;
})());
