/* ===== AI-labor: igazi gépi tanulás a böngészőben + opcionális élő Claude-chat ===== */
App.add((() => {
  const S = {
    id: 'ai', icon: '', title: 'AI-labor', color: '#22d3ee',
    desc: 'Taníts be egy neurális hálót, rajzolj, és a gép felismeri, nézd meg, hogyan jósol szót egy nyelvi modell – és beszélgess egy igazi AI-val!',
    topic: 'Mesterséges intelligencia, gépi tanulás, neurális hálók, nyelvi modellek'
  };
  let root, tab = 'learn', raf = 0;

  /* ============ 1. Tanítsd a gépet: 2D osztályozás (kNN vagy neurális háló) ============ */
  const L = { pts: [], cls: 0, model: 'nn', net: null, cv: null, ctx: null, ep: 0, acc: 0 };
  function initNet() { const r = () => (Math.random() * 2 - 1) * .8, mk = (a, b) => Array.from({ length: b }, () => Array.from({ length: a }, r)); L.net = { W1: mk(2, 12), b1: Array(12).fill(0), W2: mk(12, 12), b2: Array(12).fill(0), W3: mk(12, 1)[0], b3: 0 }; L.ep = 0 }
  function fwd(x, y) { const n = L.net, h1 = n.W1.map((w, i) => Math.tanh(w[0] * x + w[1] * y + n.b1[i])), h2 = n.W2.map((w, i) => Math.tanh(w.reduce((s, v, j) => s + v * h1[j], 0) + n.b2[i])), o = 1 / (1 + Math.exp(-(n.W3.reduce((s, v, j) => s + v * h2[j], 0) + n.b3))); return { h1, h2, o } }
  function trainStep(lr = .08) {
    const n = L.net; for (const p of L.pts) {
      const x = p.x * 2 - 1, y = p.y * 2 - 1, { h1, h2, o } = fwd(x, y), d3 = o - p.c;
      const d2 = h2.map((h, j) => d3 * n.W3[j] * (1 - h * h)); const d1 = h1.map((h, i) => d2.reduce((s, d, j) => s + d * n.W2[j][i], 0) * (1 - h * h));
      for (let j = 0; j < 12; j++) { n.W3[j] -= lr * d3 * h2[j]; for (let i = 0; i < 12; i++) n.W2[j][i] -= lr * d2[j] * h1[i]; n.b2[j] -= lr * d2[j] }
      n.b3 -= lr * d3; for (let i = 0; i < 12; i++) { n.W1[i][0] -= lr * d1[i] * x; n.W1[i][1] -= lr * d1[i] * y; n.b1[i] -= lr * d1[i] }
    } L.ep++;
  }
  function knn(x, y, k = 5) { const d = L.pts.map(p => [(p.x - x) ** 2 + (p.y - y) ** 2, p.c]).sort((a, b) => a[0] - b[0]).slice(0, k); return d.length ? d.reduce((s, v) => s + v[1], 0) / d.length : .5 }
  const pred = (x, y) => L.model === 'nn' ? fwd(x * 2 - 1, y * 2 - 1).o : knn(x, y);
  function learnDraw() {
    const c = L.ctx, W = L.cv.width, H = L.cv.height; c.fillStyle = '#0e1014'; c.fillRect(0, 0, W, H); if (L.model === 'nn' && L.pts.length > 1) for (let k = 0; k < 6; k++) trainStep();
    const G = 46; for (let gy = 0; gy < G * H / W; gy++) for (let gx = 0; gx < G; gx++) { const v = L.pts.length > 1 ? pred((gx + .5) / G, (gy + .5) / (G * H / W)) : .5; c.fillStyle = `rgba(${Math.round(56 + (251 - 56) * v)},${Math.round(189 + (146 - 189) * v)},${Math.round(248 + (60 - 248) * v)},.55)`; c.fillRect(gx * W / G, gy * W / G, W / G + 1, W / G + 1) }
    for (const p of L.pts) { c.beginPath(); c.arc(p.x * W, p.y * H, 9, 0, 7); c.fillStyle = p.c ? '#ea580c' : '#0284c7'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#ffffff'; c.stroke() }
    if (L.pts.length > 1) { L.acc = L.pts.filter(p => (pred(p.x, p.y) > .5 ? 1 : 0) === p.c).length / L.pts.length; $('#ai-l-st').innerHTML = `Pontosság: <b>${Math.round(L.acc * 100)}%</b> • ${L.pts.length} példa${L.model === 'nn' ? ` • ${L.ep} tanulókör` : ''}` }
    else $('#ai-l-st').textContent = 'Tegyél le legalább 2-2 pontot!';
  }
  function presetPts(k) {
    L.pts = []; const add = (x, y, c) => L.pts.push({ x, y, c });
    if (k === 'xor') for (let i = 0; i < 40; i++) { const x = Math.random(), y = Math.random(); add(x, y, (x > .5) !== (y > .5) ? 1 : 0) }
    if (k === 'ring') for (let i = 0; i < 60; i++) { const a = Math.random() * 6.28, r = i % 2 ? .1 + Math.random() * .12 : .3 + Math.random() * .1; add(.5 + Math.cos(a) * r, .5 + Math.sin(a) * r * 1.6, i % 2 ? 1 : 0) }
    if (k === 'line') for (let i = 0; i < 30; i++) { const x = Math.random(), y = Math.random(); add(x, y, y > x * .8 + .1 ? 1 : 0) }
    initNet();
  }

  /* ============ 2. Rajzfelismerő: kNN a saját és generált példákon ============ */
  const D = { cv: null, ctx: null, drawing: false, strokes: [], set: [], classes: ['Kör', 'Négyzet', 'Háromszög', 'Villám', 'Szív'] };
  const N = 16;
  function vecFromStrokes(strokes) {
    const pts = strokes.flat(); if (pts.length < 2) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
    const s = Math.max(x1 - x0, y1 - y0) || 1, oc = document.createElement('canvas'); oc.width = oc.height = N; const c = oc.getContext('2d');
    c.lineWidth = 1.6; c.lineCap = c.lineJoin = 'round'; c.strokeStyle = '#000';
    for (const st of strokes) { c.beginPath(); st.forEach(([x, y], i) => { const X = 1 + (x - x0 + (s - (x1 - x0)) / 2) / s * (N - 2), Y = 1 + (y - y0 + (s - (y1 - y0)) / 2) / s * (N - 2); i ? c.lineTo(X, Y) : c.moveTo(X, Y) }); c.stroke() }
    const d = c.getImageData(0, 0, N, N).data, v = []; for (let i = 3; i < d.length; i += 4) v.push(d[i] / 255); const m = Math.hypot(...v) || 1; return v.map(x => x / m);
  }
  function synth(cl) {
    const j = () => (Math.random() - .5) * .12, rot = (Math.random() - .5) * .5, pts = [];
    const P = (t) => { // alakzatok paraméteresen
      if (cl === 0) return [Math.cos(t * 6.283), Math.sin(t * 6.283)];
      if (cl === 1) { const k = t * 4, e = k % 1, s = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]], a = s[Math.floor(k)], b = s[Math.floor(k) + 1]; return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e] }
      if (cl === 2) { const k = t * 3, e = k % 1, s = [[0, -1], [1, .8], [-1, .8], [0, -1]], a = s[Math.floor(k)], b = s[Math.floor(k) + 1]; return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e] }
      if (cl === 3) { const s = [[.3, -1], [-.4, .1], [.3, .1], [-.3, 1]], k = t * 3, e = k % 1, a = s[Math.floor(k)], b = s[Math.min(3, Math.floor(k) + 1)]; return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e] }
      const a = t * 6.283; return [16 * Math.sin(a) ** 3 / 16, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16];
    };
    for (let i = 0; i <= 40; i++) { const t = Math.min(.9999, i / 40), [x, y] = P(t), X = x * Math.cos(rot) - y * Math.sin(rot) + j(), Y = x * Math.sin(rot) + y * Math.cos(rot) + j(); pts.push([X * (1 + j()), Y * (1 + j())]) }
    return [pts];
  }
  function seedSet() { D.set = []; D.classes.forEach((_, c) => { for (let i = 0; i < 14; i++) D.set.push({ c, v: vecFromStrokes(synth(c)), mine: 0 }) }) }
  function classify(v) { const sc = D.set.map(e => [e.v.reduce((s, x, i) => s + x * v[i], 0), e.c]).sort((a, b) => b[0] - a[0]).slice(0, 7), votes = D.classes.map(() => 0); sc.forEach(([s, c]) => votes[c] += s); const tot = votes.reduce((a, b) => a + b, 0) || 1; return votes.map((x, i) => [i, x / tot]).sort((a, b) => b[1] - a[1]) }
  function drawRender() {
    const c = D.ctx, W = D.cv.width, H = D.cv.height; c.fillStyle = '#f8fafc'; c.fillRect(0, 0, W, H); c.strokeStyle = '#0f172a'; c.lineWidth = 9; c.lineCap = c.lineJoin = 'round';
    for (const st of D.strokes) { c.beginPath(); st.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke() }
    if (!D.strokes.length) { c.fillStyle = '#94a3b8'; c.font = '600 20px Inter,sans-serif'; c.textAlign = 'center'; c.fillText('Rajzolj ide egy alakzatot!', W / 2, H / 2) }
    const v = vecFromStrokes(D.strokes), out = $('#ai-d-res');
    if (!v) { out.innerHTML = '<div class="ai-hint">A gép 5 alakzatot ismer: kör, négyzet, háromszög, villám, szív.</div>'; return }
    const r = classify(v); out.innerHTML = `<div class="ai-guess">Szerintem ez egy: <b>${D.classes[r[0][0]]}</b></div>` + r.map(([i, p]) => `<div class="ai-bar"><span>${D.classes[i]}</span><i><em style="width:${p * 100}%"></em></i><b>${Math.round(p * 100)}%</b></div>`).join('') +
      `<div class="ai-teach">Nem talált? Tanítsd meg neki, mi ez: ${D.classes.map((n, i) => `<button class="btn" data-teach="${i}">${n}</button>`).join('')}</div>`;
    $$('[data-teach]').forEach(b => b.onclick = () => { D.set.push({ c: +b.dataset.teach, v, mine: 1 }); toast(`Megtanulta! Ez egy <b>${D.classes[+b.dataset.teach]}</b>. Saját példák: ${D.set.filter(e => e.mine).length}`, '#22d3ee', 2200); D.strokes = []; drawRender() });
  }

  /* ============ 3. Szövegjósló: n-gram nyelvi modell ============ */
  const CORPUS = `A számítógép adatokat dolgoz fel. A számítógép programokat futtat. A számítógép az internetre csatlakozik. Az internet hálózatok hálózata. Az internet csomagokban küldi az adatokat. Az internet a routereken keresztül működik. A router továbbítja a csomagokat. A router megnézi a cél IP-címet. A router összeköti a hálózatokat. A robot követi a programot. A robot összeszedi a kristályokat. A robot eljut a töltőhöz. A mesterséges intelligencia adatokból tanul. A mesterséges intelligencia képeket ismer fel. A mesterséges intelligencia szöveget ír. A mesterséges intelligencia segít a tanulásban. A rendszergazda megjavítja a szervert. A rendszergazda telepíti a programokat. A rendszergazda védi a hálózatot. A hálózat összeköti a gépeket. A hálózat gyors és biztonságos. A jelszó legyen hosszú és erős. A jelszó védi a fiókot. A tűzfal megállítja a támadókat. A tűzfal védi a hálózatot. A programozó kódot ír. A programozó játékot fejleszt. A programozó weboldalt készít. A diák informatikát tanul. A diák hálózatot épít. A diák programot ír. A diák a nyílt napon játszik.`;
  const LM = (() => { const w = CORPUS.toLowerCase().replace(/\./g, ' .').split(/\s+/).filter(Boolean), b = {}, t = {}; for (let i = 0; i < w.length - 1; i++) { (b[w[i]] = b[w[i]] || {})[w[i + 1]] = (b[w[i]][w[i + 1]] || 0) + 1; if (i < w.length - 2) { const k = w[i] + ' ' + w[i + 1]; (t[k] = t[k] || {})[w[i + 2]] = (t[k][w[i + 2]] || 0) + 1 } } return { b, t } })();
  let words = ['a', 'számítógép'];
  function nextDist() { const k = words.slice(-2).join(' '), d = LM.t[k] || LM.b[words[words.length - 1]] || {}, tot = Object.values(d).reduce((a, b) => a + b, 0) || 1; return Object.entries(d).map(([w, c]) => [w, c / tot]).sort((a, b) => b[1] - a[1]).slice(0, 6) }
  function textRender() {
    const d = nextDist(), txt = words.join(' ').replace(/ \./g, '.').replace(/(^|\. )([a-záéíóöőúüű])/g, (m, a, b) => a + b.toUpperCase());
    $('#ai-t-out').innerHTML = `${esc(txt)}<span class="ai-cur">▌</span>`;
    $('#ai-t-next').innerHTML = d.length ? d.map(([w, p], i) => `<button class="ai-nw ${i ? '' : 'top'}" data-w="${esc(w)}"><span>${w === '.' ? '(mondat vége)' : esc(w)}</span><i><em style="width:${p * 100}%"></em></i><b>${Math.round(p * 100)}%</b></button>`).join('') : '<div class="ai-hint">Itt elfogyott a tudása – kezdj új mondatot!</div>';
    $$('[data-w]').forEach(b => b.onclick = () => { words.push(b.dataset.w); sfx.click(); textRender() });
  }
  function autoGen() { let n = 0; const st = () => { const d = nextDist(); if (!d.length || n++ > 14) return; let r = Math.random(), pick = d[0][0]; for (const [w, p] of d) { if ((r -= p) <= 0) { pick = w; break } } words.push(pick); textRender(); if (pick !== '.') setTimeout(st, 350) }; st() }

  /* ============ 4. Élő AI-chat (Claude) – saját API-kulccsal ============ */
  const SYS = 'Egy magyar középiskola informatikai nyílt napján beszélgetsz 10–16 éves gyerekekkel és a szüleikkel. Mindig magyarul válaszolj, röviden (legfeljebb 5-6 mondat), barátságosan, érthetően, emoji nélkül. Ha informatikáról kérdeznek, adj egy érdekes, konkrét példát is. Ne kérj és ne tárolj személyes adatot. Ha valami nem gyerekeknek való, udvariasan tereld más témára.';
  let chat = [], busy = false;
  function loadSdk() { return new Promise((res, rej) => { if (window.Anthropic) return res(); const s = document.createElement('script'); s.src = 'js/vendor/anthropic-sdk.min.js'; s.onload = () => window.Anthropic ? res() : rej(new Error('sdk')); s.onerror = () => rej(new Error('sdk')); document.head.appendChild(s) }) }
  function chatRender() {
    const key = store.get('aikey', '');
    $('#ai-c-log').innerHTML = (chat.length ? chat.map(m => `<div class="ai-m ${m.role}">${m.role === 'user' ? '' : `<span class="ai-av">${icon('ai', 18)}</span>`}<div>${esc(typeof m.content === 'string' ? m.content : m.content.map(b => b.text || '').join('')).replace(/\n/g, '<br>')}</div></div>`).join('') :
      `<div class="ai-hint">${key ? 'Kérdezz bármit! Például: <b>Hogyan működik az internet?</b> • <b>Írj egy rövid verset a routerről!</b> • <b>Mit csinál egy rendszergazda?</b>' : '<b>Az élő AI-chathez API-kulcs kell.</b> A tanár a jobb felső fogaskerék (Beállítások) alatt megadhatja a saját Claude API-kulcsát – csak ezen a gépen tárolódik. Kulcs nélkül is kipróbálhatod a többi fület: ott a gépi tanulás teljesen a böngészőben fut!'}</div>`);
    $('#ai-c-in').disabled = !key || busy; $('#ai-c-go').disabled = !key || busy; const lg = $('#ai-c-log'); lg.scrollTop = lg.scrollHeight;
  }
  async function send(text) {
    const key = store.get('aikey', ''); if (!key || busy || !text.trim()) return;
    chat.push({ role: 'user', content: text.trim() }); const msg = { role: 'assistant', content: '' }; chat.push(msg); busy = true; chatRender();
    const out = () => { const n = $$('#ai-c-log .ai-m.assistant div'); const el = n[n.length - 1]; if (el) el.innerHTML = esc(msg.content).replace(/\n/g, '<br>') + (busy ? '<span class="ai-cur">▌</span>' : ''); $('#ai-c-log').scrollTop = 1e9 };
    try {
      await loadSdk();
      const client = new window.Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
      const stream = client.beta.messages.stream({
        model: 'claude-opus-5-5', max_tokens: 2000,
        betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
        output_config: { effort: 'low' },
        system: SYS, messages: chat.slice(0, -1).slice(-12)
      });
      for await (const ev of stream) { if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') { msg.content += ev.delta.text; out() } }
      const fin = await stream.finalMessage();
      if (fin.stop_reason === 'refusal') msg.content = (msg.content ? msg.content + '\n\n' : '') + '(Erre a kérdésre nem tudok válaszolni. Kérdezz valami mást!)';
    } catch (e) {
      const A = window.Anthropic;
      msg.content = A && e instanceof A.AuthenticationError ? 'Érvénytelen API-kulcs. Ellenőrizd a Beállításokban!' : A && e instanceof A.RateLimitError ? 'Most túl sokan kérdeznek – próbáld újra pár másodperc múlva!' : A && e instanceof A.APIConnectionError ? 'Nem érem el az AI-szolgáltatást. Van internet?' : e && e.message === 'sdk' ? 'Az élő chat ebben a változatban nem érhető el – nyisd meg a GitHub Pages-es címet!' : 'Hiba történt: ' + (e && e.message || e);
    }
    busy = false; chatRender();
  }

  /* ============ felület ============ */
  function setTab(t) {
    tab = t; $$('[data-at]').forEach(b => b.classList.toggle('sel', b.dataset.at === t)); $$('.ai-pane').forEach(p => p.style.display = p.dataset.p === t ? '' : 'none');
    if (t === 'draw') drawRender(); if (t === 'text') textRender(); if (t === 'chat') chatRender();
  }
  S.build = r => {
    root = r;
    r.innerHTML = `<style>
      #ai{position:absolute;inset:0;overflow:auto;padding:16px 20px}
      #ai-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}#ai-tabs .btn{height:42px;font-size:15px;display:inline-flex;gap:7px;align-items:center}
      .ai-pane{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px}@media(max-width:900px){.ai-pane{grid-template-columns:1fr}}
      .ai-side{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:10px;font-size:14.5px;line-height:1.5}
      .ai-side h3{margin:0;font-size:19px}.ai-side .row{display:flex;gap:6px;flex-wrap:wrap}.ai-side .row .btn{flex:1;height:38px;font-size:14px}
      .ai-cvw{position:relative;border-radius:16px;overflow:hidden;border:1px solid var(--line);background:#0e1014}.ai-cvw canvas{display:block;width:100%;cursor:crosshair;touch-action:none}
      #ai-l-st{font-size:16px}.ai-hint{color:var(--muted);font-size:15px;line-height:1.5}
      .ai-guess{font-size:22px;margin-bottom:8px}.ai-guess b{color:var(--accent)}
      .ai-bar{display:grid;grid-template-columns:90px 1fr 46px;gap:8px;align-items:center;font-size:14px;margin:4px 0}.ai-bar i{height:10px;background:var(--panel2);border-radius:5px;overflow:hidden}.ai-bar em{display:block;height:100%;background:var(--accent)}.ai-bar b{text-align:right}
      .ai-teach{margin-top:10px;font-size:13px;color:var(--muted);display:flex;flex-wrap:wrap;gap:5px;align-items:center}.ai-teach .btn{height:30px;font-size:12.5px;padding:0 9px}
      #ai-t-out{font-size:26px;line-height:1.45;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px;min-height:140px}.ai-cur{color:var(--accent);animation:aiB 1s steps(2) infinite}@keyframes aiB{50%{opacity:0}}
      #ai-t-next{display:flex;flex-direction:column;gap:6px;margin-top:12px}
      .ai-nw{all:unset;cursor:pointer;display:grid;grid-template-columns:200px 1fr 50px;gap:10px;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:9px 12px;font-size:16px}.ai-nw:hover{border-color:var(--accent)}.ai-nw.top{border-color:color-mix(in srgb,var(--accent) 50%,var(--line))}
      .ai-nw i{height:10px;background:var(--panel2);border-radius:5px;overflow:hidden}.ai-nw em{display:block;height:100%;background:var(--accent)}.ai-nw b{text-align:right}
      #ai-c-log{height:min(56vh,560px);overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:10px}
      .ai-m{display:flex;gap:8px;max-width:86%;font-size:16px;line-height:1.5}.ai-m div{padding:10px 14px;border-radius:14px;background:var(--panel2)}.ai-m.user{align-self:flex-end}.ai-m.user div{background:color-mix(in srgb,var(--accent) 22%,var(--panel2))}
      .ai-av{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--accent) 18%,transparent);color:var(--accent);flex:none}
      #ai-c-f{display:flex;gap:8px;margin-top:10px}#ai-c-in{flex:1;font-size:17px;padding:12px 14px;border-radius:12px;border:2px solid var(--line);background:#101216;color:var(--text)}#ai-c-go{height:50px;padding:0 22px}
      .ai-sug{display:flex;flex-wrap:wrap;gap:6px}.ai-sug .btn{height:auto;min-height:34px;font-size:13px;text-align:left;white-space:normal}
    </style>
    <div id="ai"><div id="ai-tabs"><button class="btn sel" data-at="learn">${icon('activity', 16)} Tanítsd a gépet</button><button class="btn" data-at="draw">${icon('eye', 16)} Rajzfelismerő</button><button class="btn" data-at="text">${icon('code', 16)} Szövegjósló</button><button class="btn" data-at="chat">${icon('ai', 16)} Beszélgess egy AI-val</button></div>
      <div class="ai-pane" data-p="learn"><div class="ai-cvw"><canvas id="ai-l-cv" width="900" height="560"></canvas></div>
        <div class="ai-side"><h3>Tanítsd a gépet!</h3><div>Kattints a táblára, és tegyél le <b style="color:#38bdf8">kék</b> és <b style="color:#fb923c">narancs</b> pontokat. A gép <b>élőben tanul</b>, és kiszínezi, szerinte hol melyik szín van.</div>
          <div class="row"><button class="btn sel" data-lc="0" style="color:#38bdf8">Kék pont</button><button class="btn" data-lc="1" style="color:#fb923c">Narancs pont</button></div>
          <div class="row"><button class="btn sel" data-lm="nn">Neurális háló</button><button class="btn" data-lm="knn">Legközelebbi szomszéd</button></div>
          <div class="row"><button class="btn" data-lp="line">Egyenes</button><button class="btn" data-lp="ring">Gyűrű</button><button class="btn" data-lp="xor">Sakktábla</button><button class="btn" data-lp="clr">Törlés</button></div>
          <div id="ai-l-st"></div>
          <div class="learn" style="margin-top:0">Ez <b>igazi gépi tanulás</b>: egy 2 rejtett rétegű, 24 neuronos <b>neurális háló</b> fut a böngésződben, és minden körben egy kicsit javít a súlyain (visszaterjesztés). A gyűrűt és a sakktáblát egy egyenes vonal nem tudná szétválasztani – a háló mégis megtanulja!</div></div></div>
      <div class="ai-pane" data-p="draw" style="display:none"><div class="ai-cvw" style="max-width:560px"><canvas id="ai-d-cv" width="560" height="560"></canvas></div>
        <div class="ai-side"><h3>Rajzfelismerő</h3><div id="ai-d-res"></div><button class="btn" id="ai-d-clr">${icon('trash', 16)} Törlés</button>
          <div class="learn" style="margin-top:0">A gép a rajzodat <b>16 × 16-os képpé</b> kicsinyíti (256 szám), és összeveti a példákkal, amiket már látott. Így működik a képfelismerés alapja – a nagy AI-k ugyanezt csinálják, csak millió képpel és sokkal nagyobb neurális hálóval. Minél több példát tanítasz neki, annál okosabb lesz!</div></div></div>
      <div class="ai-pane" data-p="text" style="display:none"><div><div id="ai-t-out"></div><div id="ai-t-next"></div></div>
        <div class="ai-side"><h3>Hogyan „ír” egy AI?</h3><div>Kattints a következő szóra – vagy hagyd, hogy a gép válasszon!</div>
          <div class="row"><button class="btn go" id="ai-t-auto">Írjon a gép!</button><button class="btn" id="ai-t-rs">Új mondat</button></div>
          <div class="row">${['A számítógép', 'Az internet', 'A robot', 'A mesterséges intelligencia', 'A diák'].map(s => `<button class="btn" data-ts="${s}">${s}…</button>`).join('')}</div>
          <div class="learn" style="margin-top:0">Egy <b>nyelvi modell</b> (mint a ChatGPT vagy a Claude) azt számolja ki, melyik szó jön a legvalószínűbben. Ez a kis modell 32 mondatból tanult, és csak az előző két szót nézi. A nagy modellek <b>milliárdnyi</b> szövegből tanulnak, és egész oldalakat vesznek figyelembe – ezért tudnak verset írni, programot javítani vagy fordítani.</div></div></div>
      <div class="ai-pane" data-p="chat" style="display:none"><div><div id="ai-c-log"></div><div id="ai-c-f"><input id="ai-c-in" placeholder="Írd ide a kérdésed…" autocomplete="off"><button class="btn go" id="ai-c-go">Küldés</button></div></div>
        <div class="ai-side"><h3>Igazi AI: Claude</h3><div>Ez egy valódi nagy nyelvi modell. Kérdezz tőle, kérj tőle verset, magyarázatot vagy ötletet!</div>
          <div class="ai-sug">${['Hogyan jut el egy üzenet a nagymamám tabletjére?', 'Írj egy négysoros verset a routerről!', 'Mit csinál egy rendszergazda egy átlagos napon?', 'Magyarázd el egy 10 évesnek, mi az IP-cím!', 'Milyen munkákat könnyít meg az AI?'].map(q => `<button class="btn" data-q="${q}">${q}</button>`).join('')}</div>
          <div class="learn" style="margin-top:0"><b>Fontos tudni:</b> az AI hibázhat, és magabiztosan mondhat valótlant is – mindig ellenőrizd a fontos dolgokat! Ne írj be neki személyes adatot. Az AI nagyszerű segítő a tanulásban, a programozásban és a munkában, de a döntés mindig a miénk.</div><button class="btn" id="ai-c-clr">Beszélgetés törlése</button></div></div>
    </div>`;
    $$('[data-at]', r).forEach(b => b.onclick = () => { setTab(b.dataset.at); sfx.click() });
    L.cv = $('#ai-l-cv'); L.ctx = L.cv.getContext('2d'); presetPts('ring');
    $$('[data-lc]', r).forEach(b => b.onclick = () => { L.cls = +b.dataset.lc; $$('[data-lc]').forEach(x => x.classList.toggle('sel', x === b)) });
    $$('[data-lm]', r).forEach(b => b.onclick = () => { L.model = b.dataset.lm; $$('[data-lm]').forEach(x => x.classList.toggle('sel', x === b)); initNet() });
    $$('[data-lp]', r).forEach(b => b.onclick = () => { if (b.dataset.lp === 'clr') { L.pts = []; initNet() } else presetPts(b.dataset.lp); sfx.click() });
    L.cv.addEventListener('pointerdown', e => { const rc = L.cv.getBoundingClientRect(); L.pts.push({ x: (e.clientX - rc.left) / rc.width, y: (e.clientY - rc.top) / rc.height, c: e.button === 2 ? 1 - L.cls : L.cls }); beep(L.cls ? 500 : 800, .04, 'triangle', .04) });
    L.cv.addEventListener('contextmenu', e => e.preventDefault());
    D.cv = $('#ai-d-cv'); D.ctx = D.cv.getContext('2d'); seedSet();
    const dp = e => { const rc = D.cv.getBoundingClientRect(); return [(e.clientX - rc.left) / rc.width * D.cv.width, (e.clientY - rc.top) / rc.height * D.cv.height] };
    D.cv.addEventListener('pointerdown', e => { D.drawing = true; D.strokes.push([dp(e)]); D.cv.setPointerCapture(e.pointerId) });
    D.cv.addEventListener('pointermove', e => { if (D.drawing) { D.strokes[D.strokes.length - 1].push(dp(e)); drawRender() } });
    D.cv.addEventListener('pointerup', () => { D.drawing = false; drawRender() });
    $('#ai-d-clr').onclick = () => { D.strokes = []; drawRender() };
    $('#ai-t-auto').onclick = autoGen; $('#ai-t-rs').onclick = () => { words = ['a', 'számítógép']; textRender() };
    $$('[data-ts]', r).forEach(b => b.onclick = () => { words = b.dataset.ts.toLowerCase().split(' '); textRender() });
    $('#ai-c-go').onclick = () => { const i = $('#ai-c-in'); send(i.value); i.value = '' };
    $('#ai-c-in').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') $('#ai-c-go').click() });
    $$('[data-q]', r).forEach(b => b.onclick = () => send(b.dataset.q));
    $('#ai-c-clr').onclick = () => { chat = []; chatRender() };
    setTab('learn');
  };
  S.tick = () => { if (tab === 'learn' && L.ctx) learnDraw() };
  S.leave = () => { };
  return S;
})());
