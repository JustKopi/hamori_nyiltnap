/* ===== Szabad hálózati labor (Packet Tracer-szerű) – a Kapcsoló-labor része ===== */
const Lab = (() => {
  const TYPES = {
    pc: { n: 'PC', dev: 'desktop', s: 62, ports: 1, host: 1 },
    laptop: { n: 'Laptop', dev: 'laptop', s: 66, ports: 1, host: 1 },
    sw: { n: 'Kapcsoló', dev: 'switch', s: 100, ports: 8 },
    router: { n: 'Router', dev: 'router', s: 74, ports: 4 },
    server: { n: 'DHCP-szerver', dev: 'rack', s: 60, ports: 1, host: 1 }
  };
  const MISS = [
    { k: 'm1', n: 'Két gép, egy kapcsoló', d: 'Tegyél le 2 PC-t és egy kapcsolót, kösd össze őket, adj nekik IP-címet ugyanabból a hálózatból (pl. 192.168.1.10 és 192.168.1.20, /24), majd pingeld az egyiket a másikról!' },
    { k: 'm2', n: 'Két hálózat, egy router', d: 'Kössön össze egy router két külön hálózatot (pl. 192.168.1.0/24 és 10.0.0.0/24). A router portjai kapjanak IP-t, a gépeken az átjáró a router címe legyen. Pingelj át a másik hálózatba!' },
    { k: 'm3', n: 'Automatikus címek (DHCP)', d: 'Tegyél le egy DHCP-szervert (adj neki IP-t), és egy gépen kapcsold be az „IP automatikusan” opciót. Ha kapott címet, pingeld vele a szervert!' }
  ];
  let snips = [], hovL = null, C, ctx, root, devs = [], links = [], uid = 1, sel = null, tool = 'move', drag = null, wireFrom = null, wirePt = null, pingSrc = null, anim = [], T = 0, done = {}, race = null, log = [];
  const D = id => devs.find(d => d.id === id);
  const px = d => d.x * C.W, py = d => d.y * C.H;

  /* ---- IP-segédek ---- */
  const ipOk = s => /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(s || '') && s.split('.').every(x => +x <= 255);
  const ipN = s => s.split('.').reduce((a, b) => a * 256 + +b, 0) >>> 0;
  const nStr = n => [24, 16, 8, 0].map(k => (n >>> k) & 255).join('.');
  const net = (ip, p) => p === 0 ? 0 : (ipN(ip) & (~0 << (32 - p))) >>> 0;
  const same = (a, b, p) => ipOk(a) && ipOk(b) && net(a, p) === net(b, p);
  // végpontok: gép vagy router-interfész (linkenként)
  function addrs(d) {
    if (TYPES[d.t].host) return d.ip ? [{ ip: d.ip, p: d.p, link: links.find(l => l.a === d.id || l.b === d.id) }] : [];
    if (d.t === 'router') return links.filter(l => l.a === d.id || l.b === d.id).map(l => ({ ip: (d.ifs[l.id] || {}).ip, p: (d.ifs[l.id] || {}).p || 24, link: l })).filter(x => ipOk(x.ip));
    return [];
  }
  // szórási tartomány: a kapcsolókon átlátszó, routeren megáll
  function domain(link) {
    if (!link) return new Set(); const seen = new Set([link.id]), st = [link], ends = new Set();
    while (st.length) {
      const l = st.pop();
      for (const e of [l.a, l.b]) {
        const d = D(e); if (!d) continue;
        if (d.t === 'sw') { for (const k of links) if ((k.a === e || k.b === e) && !seen.has(k.id)) { seen.add(k.id); st.push(k) } }
        else ends.add(d.id + (d.t === 'router' ? ':' + l.id : ''));
      }
    }
    return { links: seen, ends };
  }
  const hostLink = d => links.find(l => l.a === d.id || l.b === d.id);
  const inDom = (dom, d, link) => dom.ends && dom.ends.has(d.id + (d.t === 'router' ? ':' + link.id : ''));

  /* ---- DHCP ---- */
  function dhcpAll() {
    const servers = devs.filter(d => d.t === 'server' && ipOk(d.ip) && hostLink(d));
    devs.filter(d => TYPES[d.t].host && d.dhcp).forEach(h => {
      const hl = hostLink(h); h.ip = ''; h.gw = ''; if (!hl) return;
      const dom = domain(hl);
      const sv = servers.find(s => dom.ends.has(s.id));
      if (!sv) return;
      const used = new Set(devs.filter(x => x !== h && x.ip).map(x => x.ip)); let k = 100;
      while (used.has(nStr(net(sv.ip, sv.p) + k))) k++;
      h.ip = nStr(net(sv.ip, sv.p) + k); h.p = sv.p;
      const r = devs.find(x => x.t === 'router' && addrs(x).some(a => same(a.ip, sv.ip, sv.p) && inDom(dom, x, a.link)));
      h.gw = r ? addrs(r).find(a => same(a.ip, sv.ip, sv.p)).ip : (sv.gw || '');
    });
  }

  /* ---- Ping ---- */
  function physPath(a, b) {
    const prev = { [a]: null }, q = [a];
    while (q.length) { const u = q.shift(); if (u === b) break; for (const l of links) { if (l.a !== u && l.b !== u) continue; const v = l.a === u ? l.b : l.a; if (v in prev) continue; if (D(v).t !== 'sw' && D(v).t !== 'router' && v !== b) continue; prev[v] = u; q.push(v) } }
    if (!(b in prev)) return null; const p = [b]; while (prev[p[0]] !== null) p.unshift(prev[p[0]]); return p;
  }
  function ping(s, t) {
    const fail = (msg, upto) => ({ ok: false, msg, path: upto });
    if (!ipOk(s.ip)) return fail(`<b>${s.name}</b> gépnek nincs IP-címe.${s.dhcp ? ' A DHCP-szerver nem érhető el ugyanabban a hálózatban.' : ''}`);
    if (!ipOk(t.ip)) return fail(`A célgépnek (<b>${t.name}</b>) nincs IP-címe.`);
    if (s.ip === t.ip) return fail('A két gépnek ugyanaz az IP-címe: <b>címütközés</b>!');
    if (devs.filter(d => d.ip === t.ip).length > 1) return fail(`Az ${t.ip} címet több eszköz is használja: <b>címütközés</b>!`);
    const sl = hostLink(s), tl = hostLink(t); if (!sl) return fail(`<b>${s.name}</b> nincs bekötve kábellel.`); if (!tl) return fail(`<b>${t.name}</b> nincs bekötve kábellel.`);
    const sd = domain(sl), path = physPath(s.id, t.id);
    if (same(s.ip, t.ip, s.p)) {
      if (sd.ends.has(t.id)) return { ok: true, msg: `Sikeres ping! A két gép <b>ugyanabban a hálózatban</b> van (${nStr(net(s.ip, s.p))}/${s.p}), a kapcsoló közvetlenül továbbítja.`, path, kind: 'local' };
      return fail('A célcím ugyanabba a hálózatba esne, de fizikailag nincs összekötve a két gép (vagy egy router van köztük).', [s.id]);
    }
    if (!ipOk(s.gw)) return fail(`A cél <b>másik hálózatban</b> van, de <b>${s.name}</b> gépen nincs beállítva <b>alapértelmezett átjáró</b>.`, [s.id]);
    const gwR = devs.find(r => r.t === 'router' && addrs(r).some(a => a.ip === s.gw && inDom(sd, r, a.link)));
    if (!gwR) return fail(`Az átjáró (${s.gw}) nem egy router portja ebben a hálózatban. Ellenőrizd a router port IP-címét!`, [s.id]);
    if (!same(s.ip, s.gw, s.p)) return fail('Az átjáró nem ugyanabban a hálózatban van, mint a gép.', [s.id]);
    // routerek közötti továbbítás (dinamikus útválasztás, pl. OSPF feltételezve)
    const seen = new Set([gwR.id]), q = [gwR]; let exitR = null, exitA = null;
    while (q.length && !exitR) {
      const r = q.shift();
      for (const a of addrs(r)) {
        if (same(a.ip, t.ip, a.p) && inDom(domain(a.link), t, tl)) { exitR = r; exitA = a; break }
        const dm = domain(a.link);
        devs.filter(x => x.t === 'router' && !seen.has(x.id)).forEach(x => { if (addrs(x).some(b => same(b.ip, a.ip, a.p) && inDom(dm, x, b.link))) { seen.add(x.id); q.push(x) } });
      }
    }
    if (!exitR) return fail(`A router (${gwR.name}) nem ismer olyan hálózatot, amelyben ${t.ip} van. Adj IP-t a cél felőli portjának!`, path ? path.slice(0, path.indexOf(gwR.id) + 1) : [s.id]);
    if (!ipOk(t.gw) || t.gw !== exitA.ip) return fail(`A kérés odaért, de a <b>válasz nem tud visszajönni</b>: ${t.name} gépen az átjáró nem ${exitA.ip}.`, path);
    return { ok: true, msg: `Sikeres ping <b>két hálózat között</b>! ${s.name} → átjáró (${s.gw}) → ${exitR === gwR ? '' : 'routerek → '}${t.name}.`, path, kind: 'routed' };
  }
  function doPing(s, t) {
    dhcpAll(); const r = ping(s, t); addLog(`${s.name} → ${t.name}`, r.ok, r.msg);
    const path = r.path && r.path.length ? r.path : [s.id];
    anim.push({ path: r.ok ? [...path, ...path.slice(0, -1).reverse()] : path, t: 0, ok: r.ok, failAt: !r.ok });
    if (r.ok) {
      sfx.ok(); const hosts = [s, t].filter(x => x.t === 'pc' || x.t === 'laptop');
      if (r.kind === 'local' && hosts.length === 2) mission('m1');
      if (r.kind === 'routed') mission('m2');
      if ((s.dhcp && ipOk(s.ip)) && t.t === 'server') mission('m3');
    } else sfx.bad();
  }
  function addLog(h, ok, msg) { log.unshift({ h, ok, msg }); log = log.slice(0, 6); renderLog() }
  function renderLog() { const el = $('#lb-log'); if (el) el.innerHTML = log.map(x => `<div class="${x.ok ? 'ok' : 'bad'}"><b>${x.ok ? 'OK' : 'HIBA'}</b> ${x.h}<span>${x.msg}</span></div>`).join('') || '<div class="hint2">Válaszd a Ping eszközt, kattints egy forrásgépre, majd a célra.</div>' }
  function mission(k) {
    if (done[k]) return; done[k] = race ? race.t : 1; sfx.win(); FX.confetti(); const m = MISS.find(x => x.k === k);
    toast(`Feladat teljesítve: <b>${m.n}</b>`, '#4ade80', 3000); renderMiss();
    if (race && MISS.every(x => done[x.k])) finishRace();
  }
  function renderMiss() { const el = $('#lb-miss'); if (el) el.innerHTML = MISS.map((m, i) => `<div class="${done[m.k] ? 'ok' : ''}"><b>${done[m.k] ? icon('check', 16, 2.4) : i + 1 + '.'} ${m.n}</b><span>${m.d}</span></div>`).join('') }

  /* ---- Szerkesztés ---- */
  function nameOf(t) { const n = devs.filter(d => d.t === t).length + 1; return t === 'pc' ? 'PC' + n : t === 'laptop' ? 'Laptop' + n : t === 'sw' ? 'SW' + n : t === 'router' ? 'R' + n : 'Szerver' + n }
  function add(t, x, y) { const d = { id: 'd' + uid++, t, name: nameOf(t), x: x ?? .25 + Math.random() * .5, y: y ?? .3 + Math.random() * .4, ip: '', p: 24, gw: '', dhcp: false, ifs: {} }; devs.push(d); sel = d; panel(); beep(700, .06, 'triangle', .05); return d }
  function connect(a, b) {
    if (a.id === b.id || links.some(l => (l.a === a.id && l.b === b.id) || (l.a === b.id && l.b === a.id))) return;
    const cnt = d => links.filter(l => l.a === d.id || l.b === d.id).length;
    if (cnt(a) >= TYPES[a.t].ports) { toast(`${a.name}: nincs több szabad port.`, '#fbbf24'); return }
    if (cnt(b) >= TYPES[b.t].ports) { toast(`${b.name}: nincs több szabad port.`, '#fbbf24'); return }
    links.push({ id: 'l' + uid++, a: a.id, b: b.id }); beep(900, .08, 'triangle', .05, 300); dhcpAll(); panel();
  }
  function cutLink(l) {
    links = links.filter(x => x !== l); [D(l.a), D(l.b)].forEach(d => { if (d && d.ifs) delete d.ifs[l.id] });
    const a = D(l.a), b = D(l.b); snips.push({ x: (px(a) + px(b)) / 2, y: (py(a) + py(b)) / 2, t: 0 }); hovL = null;
    beep(300, .08, 'square', .05, -150); dhcpAll(); panel(); toast('Kábel kihúzva.', '#f87171', 1200);
  }
  function linkAt(mx, my) {
    let best = null, bd = 12;
    for (const l of links) { const a = D(l.a), b = D(l.b), x1 = px(a), y1 = py(a), x2 = px(b), y2 = py(b), L2 = (x2 - x1) ** 2 + (y2 - y1) ** 2 || 1, t = clamp(((mx - x1) * (x2 - x1) + (my - y1) * (y2 - y1)) / L2, .12, .88), d = Math.hypot(mx - (x1 + (x2 - x1) * t), my - (y1 + (y2 - y1) * t)); if (d < bd) { bd = d; best = l } }
    return best;
  }
  function del(d) { links = links.filter(l => l.a !== d.id && l.b !== d.id); devs = devs.filter(x => x !== d); if (sel === d) sel = null; dhcpAll(); panel() }
  function panel() {
    const el = $('#lb-cfg'); if (!el) return; const d = sel;
    if (!d) { el.innerHTML = '<div class="hint2">Kattints egy eszközre a beállításához.</div>'; return }
    const pr = v => `<select data-f="p">${[8, 16, 24, 25, 26, 27, 28, 30].map(x => `<option ${x === v ? 'selected' : ''}>${x}</option>`).join('')}</select>`;
    let h = `<div class="lb-h">${icon(d.t === 'router' ? 'router' : d.t === 'sw' ? 'layers' : d.t === 'server' ? 'box' : 'monitor', 18)} <b>${d.name}</b> <span>${TYPES[d.t].n}</span></div>`;
    if (TYPES[d.t].host) {
      h += d.t !== 'server' ? `<label class="lb-ck"><input type="checkbox" data-f="dhcp" ${d.dhcp ? 'checked' : ''}> IP automatikusan (DHCP)</label>` : '<div class="hint2">Ez a szerver oszt címet a hálózatában (a .100-tól kezdve).</div>';
      h += `<label>IP-cím<input data-f="ip" value="${d.ip}" ${d.dhcp ? 'disabled' : ''} placeholder="pl. 192.168.1.10"></label><label>Maszk (prefix) /${pr(d.p)}</label><label>Alapértelmezett átjáró<input data-f="gw" value="${d.gw}" ${d.dhcp ? 'disabled' : ''} placeholder="pl. 192.168.1.1"></label>`;
    } else if (d.t === 'router') {
      const ls = links.filter(l => l.a === d.id || l.b === d.id);
      h += ls.length ? ls.map((l, i) => { const o = D(l.a === d.id ? l.b : l.a), f = d.ifs[l.id] || {}; return `<div class="lb-if"><div>Port ${i} → ${o.name}</div><input data-if="${l.id}" data-k="ip" value="${f.ip || ''}" placeholder="pl. 192.168.1.1"><select data-if="${l.id}" data-k="p">${[8, 16, 24, 25, 26, 27, 28, 30].map(x => `<option ${x === (f.p || 24) ? 'selected' : ''}>${x}</option>`).join('')}</select></div>` }).join('') : '<div class="hint2">Köss a routerre kábeleket, utána portonként adhatsz IP-címet. Minden port másik hálózat!</div>';
    } else h += '<div class="hint2">A kapcsolónak nem kell IP-cím: a gépek MAC-címe alapján továbbítja a kereteket ugyanazon a hálózaton belül.</div>';
    if (window.EASY && d.t !== 'sw') h += `<button class="btn go" id="lb-sug">Javasolt beállítás (könnyű mód)</button>`;
    h += `<button class="btn" id="lb-del">${icon('trash', 16)} Törlés</button>`;
    el.innerHTML = h;
    $$('[data-f]', el).forEach(i => i.onchange = i.oninput = () => { const f = i.dataset.f; if (f === 'dhcp') { d.dhcp = i.checked; dhcpAll(); panel(); return } d[f] = f === 'p' ? +i.value : i.value.trim(); if (d.t === 'server' || f !== 'p') dhcpAll() });
    $$('[data-if]', el).forEach(i => i.onchange = i.oninput = () => { const f = d.ifs[i.dataset.if] = d.ifs[i.dataset.if] || { p: 24 }; f[i.dataset.k] = i.dataset.k === 'p' ? +i.value : i.value.trim(); dhcpAll() });
    $$('input', el).forEach(i => i.addEventListener('keydown', e => e.stopPropagation()));
    $('#lb-del').onclick = () => del(d); const sg = $('#lb-sug'); if (sg) sg.onclick = () => { suggest(d); dhcpAll(); panel(); toast('Beállítva! Nézd meg, milyen IP-címet és átjárót kapott.', '#4ade80', 2200) };
  }
  function suggest(d) {
    const used = new Set(devs.map(x => x.ip).concat(devs.flatMap(x => Object.values(x.ifs || {}).map(f => f.ip))));
    if (d.t === 'router') { let n = 1; links.filter(l => l.a === d.id || l.b === d.id).forEach(l => { const f = d.ifs[l.id] = d.ifs[l.id] || { p: 24 }; if (!ipOk(f.ip)) { while (used.has(`192.168.${n}.1`)) n++; f.ip = `192.168.${n}.1`; f.p = 24; used.add(f.ip) } }); return }
    const hl = hostLink(d); let base = '192.168.1.', gw = '';
    if (hl) { const dom = domain(hl), r = devs.find(x => x.t === 'router' && addrs(x).some(a => inDom(dom, x, a.link))); if (r) { const a = addrs(r).find(a => inDom(dom, r, a.link)); base = a.ip.split('.').slice(0, 3).join('.') + '.'; gw = a.ip } }
    let k = 10; while (used.has(base + k)) k += 10; d.ip = base + k; d.p = 24; d.gw = gw; d.dhcp = false;
  }
  function example() {
    if (race) { toast('Verseny közben nem tölthető be a példa – építsd meg magad!', '#fbbf24'); return }
    devs = []; links = []; sel = null;
    const r = add('router', .5, .25), s1 = add('sw', .27, .55), s2 = add('sw', .73, .55), a = add('pc', .15, .85), b = add('laptop', .37, .85), c = add('pc', .63, .85), sv = add('server', .85, .85);
    connect(r, s1); connect(r, s2); connect(s1, a); connect(s1, b); connect(s2, c); connect(s2, sv);
    r.ifs[links[0].id] = { ip: '192.168.1.1', p: 24 }; r.ifs[links[1].id] = { ip: '10.0.0.1', p: 24 };
    Object.assign(a, { ip: '192.168.1.10', gw: '192.168.1.1' }); Object.assign(b, { ip: '192.168.1.20', gw: '192.168.1.1' });
    Object.assign(sv, { ip: '10.0.0.5', gw: '10.0.0.1' }); c.dhcp = true; dhcpAll(); sel = null; panel();
    toast('Kész példahálózat: két hálózat, egy router, DHCP. Próbálj pingelni!', '#a78bfa', 3200);
  }

  /* ---- Rajzolás ---- */
  function draw() {
    const W = C.W, H = C.H; ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff07'; for (let x = 20; x < W; x += 28) for (let y = 20; y < H; y += 28) ctx.fillRect(x, y, 1.5, 1.5);
    if (!devs.length) { ctx.fillStyle = '#ffffff55'; ctx.font = '600 18px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Tegyél le eszközöket a bal oldali gombokkal, vagy tölts be egy példát!', W / 2, H / 2) }
    for (const l of links) {
      const a = D(l.a), b = D(l.b); Cable.draw(ctx, px(a), py(a), px(b), py(b), { type: 'patch', w: 4, sag: .05, r1: TYPES[a.t].s * .35, r2: TYPES[b.t].s * .35 });
      if (a.t === 'router' || b.t === 'router') { const r = a.t === 'router' ? a : b, f = r.ifs[l.id]; if (f && f.ip) { const o = r === a ? b : a, t = .25, x = px(r) + (px(o) - px(r)) * t, y = py(r) + (py(o) - py(r)) * t; tag(`${f.ip}/${f.p || 24}`, x, y, '#fbbf24') } }
    }
    if (hovL && links.includes(hovL)) { const a = D(hovL.a), b = D(hovL.b), mx = (px(a) + px(b)) / 2, my = (py(a) + py(b)) / 2; ctx.strokeStyle = '#f87171'; ctx.lineWidth = 8; ctx.globalAlpha = .45; ctx.beginPath(); ctx.moveTo(px(a), py(a)); ctx.lineTo(px(b), py(b)); ctx.stroke(); ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(mx, my, 15, 0, 7); ctx.fillStyle = '#f87171'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mx - 6, my - 6); ctx.lineTo(mx + 6, my + 6); ctx.moveTo(mx + 6, my - 6); ctx.lineTo(mx - 6, my + 6); ctx.stroke() }
    for (const sn of snips) { const k = sn.t / .6; ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; for (let q = 0; q < 8; q++) { const a = q * Math.PI / 4, r1 = 8 + k * 20, r2 = 14 + k * 30; ctx.beginPath(); ctx.moveTo(sn.x + Math.cos(a) * r1, sn.y + Math.sin(a) * r1); ctx.lineTo(sn.x + Math.cos(a) * r2, sn.y + Math.sin(a) * r2); ctx.stroke() } ctx.globalAlpha = 1 }
    if (wireFrom && wirePt) { ctx.setLineDash([8, 6]); ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px(wireFrom), py(wireFrom)); ctx.lineTo(...wirePt); ctx.stroke(); ctx.setLineDash([]) }
    for (const d of devs) {
      const x = px(d), y = py(d), ty = TYPES[d.t];
      if (d === sel || d === pingSrc) { ctx.strokeStyle = d === pingSrc ? '#4ade80' : '#a78bfa'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.arc(x, y, ty.s * .62, 0, 7); ctx.stroke(); ctx.setLineDash([]) }
      Dev.draw(ctx, ty.dev, x, y, ty.s, { t: T });
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 13px Inter,sans-serif';
      const lw = ctx.measureText(d.name).width + 14; ctx.fillStyle = 'rgba(11,12,15,.88)'; rrect(ctx, x - lw / 2, y + ty.s * .45, lw, 20, 6); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(d.name, x, y + ty.s * .45 + 10);
      if (ty.host) tag(d.ip ? `${d.ip}/${d.p}${d.dhcp ? ' (DHCP)' : ''}` : 'nincs IP', x, y + ty.s * .45 + 32, d.ip ? '#5b9dff' : '#f87171');
    }
    for (const a of anim) {
      const segs = a.path.length - 1, k = Math.min(segs, Math.floor(a.t)), f = a.t - k;
      let x, y; if (segs <= 0) { x = px(D(a.path[0])); y = py(D(a.path[0])) } else { const p = D(a.path[k]), q = D(a.path[Math.min(k + 1, segs)]); x = px(p) + (px(q) - px(p)) * f; y = py(p) + (py(q) - py(p)) * f }
      if (a.t >= segs && a.failAt) { ctx.strokeStyle = '#f87171'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 14, y - 14 - 40); ctx.lineTo(x + 14, y + 14 - 40); ctx.moveTo(x + 14, y - 14 - 40); ctx.lineTo(x - 14, y + 14 - 40); ctx.stroke(); continue }
      ctx.shadowColor = a.ok ? '#4ade80' : '#f87171'; ctx.shadowBlur = 14; ctx.fillStyle = a.ok ? '#4ade80' : '#fbbf24'; rrect(ctx, x - 14, y - 10 - 30, 28, 20, 5); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = '#0b0c0f'; ctx.font = '800 9px Inter,sans-serif'; ctx.fillText('ICMP', x, y - 30);
    }
  }
  function tag(t, x, y, c) { ctx.font = '600 11px "JetBrains Mono",Consolas,monospace'; const w = ctx.measureText(t).width + 12; ctx.fillStyle = 'rgba(11,12,15,.9)'; rrect(ctx, x - w / 2, y - 9, w, 18, 6); ctx.fill(); ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = c; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y) }
  const hit = (mx, my) => [...devs].reverse().find(d => Math.hypot(mx - px(d), my - py(d)) < TYPES[d.t].s * .55);

  function setTool(t) { tool = t; pingSrc = null; $$('[data-lt]').forEach(b => b.classList.toggle('sel', b.dataset.lt === t)); if (t === 'ping') toast('Ping: kattints a forrásgépre, majd a célgépre!', '#4ade80', 2400); if (t === 'wire') toast('Kábel: húzd az egyik eszközről a másikra!', '#a78bfa', 2400); if (t === 'cut') toast('Kattints arra a kábelre, amelyiket törölni szeretnéd! (Mozgatás módban is: vidd fölé az egeret, és kattints a piros X-re.)', '#f87171', 3200) }
  function mount(el) {
    root = el;
    el.innerHTML = `<style>
      #lb-left{position:absolute;top:12px;left:12px;width:250px;bottom:12px;display:flex;flex-direction:column;gap:10px;z-index:2;overflow:auto}
      #lb-right{position:absolute;top:12px;right:12px;width:300px;bottom:12px;display:flex;flex-direction:column;gap:10px;z-index:2;overflow:auto}
      .lb-p{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:10px 12px}
      .lb-p h4{margin:0 0 8px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
      .lb-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.lb-grid .btn,.lb-tools .btn{height:38px;font-size:14px;padding:0 8px;display:inline-flex;gap:6px;align-items:center;justify-content:center}
      .lb-tools{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
      #lb-cfg label{display:block;font-size:13px;color:var(--muted);margin-top:8px}#lb-cfg input:not([type=checkbox]),#lb-cfg select{display:block;width:100%;margin-top:3px;padding:7px 9px;border-radius:9px;border:1px solid var(--line2);background:#101216;color:var(--text);font-family:var(--mono);font-size:14px}
      #lb-cfg select{width:auto;display:inline-block}#lb-cfg .btn{margin-top:12px;width:100%;height:36px;font-size:14px}
      .lb-ck{display:flex!important;gap:8px;align-items:center;color:var(--text)!important;font-size:14px!important}
      .lb-h{display:flex;gap:8px;align-items:center;font-size:16px}.lb-h span{color:var(--muted);font-size:13px;margin-left:auto}
      .lb-if{margin-top:8px;font-size:13px;color:var(--muted)}.lb-if input{display:inline-block!important;width:68%!important}.lb-if select{margin-left:4px}
      .hint2{font-size:13px;color:var(--muted);line-height:1.45}
      #lb-miss div{padding:6px 0;border-bottom:1px solid var(--line);font-size:13px}#lb-miss b{display:flex;gap:6px;align-items:center;font-size:14px}#lb-miss span{display:block;color:var(--muted);margin-top:2px;line-height:1.4}
      #lb-miss .ok b{color:var(--green)}#lb-miss .ok span{display:none}
      #lb-log div{font-size:13px;padding:6px 0;border-bottom:1px solid var(--line);line-height:1.4}#lb-log div b{margin-right:6px}#lb-log .ok b{color:var(--green)}#lb-log .bad b{color:var(--red)}#lb-log span{display:block;color:#c9ccd3}
      #lb-timer{font-size:22px;font-weight:800;color:var(--yellow);text-align:center}
    </style>
    <div id="lb-left">
      <div class="lb-p"><h4>Eszközök</h4><div class="lb-grid">${Object.entries(TYPES).map(([k, v]) => `<button class="btn" data-add="${k}">+ ${v.n}</button>`).join('')}<button class="btn" id="lb-ex">Példa</button></div></div>
      <div class="lb-p"><h4>Eszköz</h4><div class="lb-tools"><button class="btn sel" data-lt="move">Mozgat</button><button class="btn" data-lt="wire">Kábel</button><button class="btn" data-lt="ping">Ping</button></div><button class="btn" data-lt="cut" style="width:100%;margin-top:6px;height:36px;font-size:14px">${icon('trash', 15)} Kábelvágó</button><button class="btn" id="lb-clr" style="width:100%;margin-top:6px;height:34px;font-size:13px">Minden törlése</button></div>
      <div class="lb-p" id="lb-mp"><h4>Feladatok</h4><div id="lb-timer" style="display:none"></div><div id="lb-miss"></div></div>
    </div>
    <div id="lb-right"><div class="lb-p"><h4>Beállítások</h4><div id="lb-cfg"></div></div><div class="lb-p"><h4>Ping-napló</h4><div id="lb-log"></div></div></div>`;
    C = makeCanvas(el); ctx = C.ctx;
    $$('[data-add]', el).forEach(b => b.onclick = () => add(b.dataset.add));
    $$('[data-lt]', el).forEach(b => b.onclick = () => setTool(b.dataset.lt));
    $('#lb-ex').onclick = example; $('#lb-clr').onclick = () => { devs = []; links = []; sel = null; panel() };
    const pos = e => { const r = C.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] };
    C.cv.addEventListener('pointerdown', e => {
      const [mx, my] = pos(e), d = hit(mx, my);
      if (tool === 'ping') { if (!d || !TYPES[d.t].host) return; if (!pingSrc) { pingSrc = d; beep(800, .05, 'triangle', .05) } else if (d !== pingSrc) { doPing(pingSrc, d); pingSrc = null } return }
      if (tool !== 'wire') { const l = !d || tool === 'cut' ? linkAt(mx, my) : null; if (l) { cutLink(l); return } }
      if (tool === 'cut') return;
      if (!d) { sel = null; panel(); return }
      if (tool === 'wire') { wireFrom = d; wirePt = [mx, my]; C.cv.setPointerCapture(e.pointerId); return }
      sel = d; panel(); drag = { d, ox: mx - px(d), oy: my - py(d) }; C.cv.setPointerCapture(e.pointerId);
    });
    C.cv.addEventListener('pointermove', e => { const [mx, my] = pos(e); if (drag) { drag.d.x = clamp((mx - drag.ox) / C.W, .03, .97); drag.d.y = clamp((my - drag.oy) / C.H, .06, .94) } if (wireFrom) wirePt = [mx, my]; hovL = !drag && !wireFrom && tool !== 'ping' && (tool === 'cut' || !hit(mx, my)) ? linkAt(mx, my) : null; C.cv.style.cursor = hovL ? 'pointer' : '' });
    C.cv.addEventListener('pointerup', e => { const [mx, my] = pos(e); if (wireFrom) { const d = hit(mx, my); if (d) connect(wireFrom, d); wireFrom = wirePt = null } drag = null });
    addEventListener('keydown', e => { if (!root || !root.offsetParent || e.target.tagName === 'INPUT') return; if ((e.key === 'Delete' || e.key === 'Backspace') && sel) del(sel) });
    panel(); renderMiss(); renderLog();
  }
  function tick(dt) {
    T += dt; for (const a of anim) a.t += dt * 2.2; anim = anim.filter(a => a.t < a.path.length + .8);
    if (race) { race.t += dt; $('#lb-timer').textContent = `${Math.floor(race.t / 60)}:${String(Math.floor(race.t % 60)).padStart(2, '0')}`; if (race.t > 600) finishRace() }
    draw();
  }
  function startRace() { devs = []; links = []; sel = null; done = {}; log = []; race = { t: 0 }; $('#lb-timer').style.display = ''; panel(); renderMiss(); renderLog(); setTool('move') }
  function finishRace() {
    const n = MISS.filter(m => done[m.k]).length, sc = Math.max(0, n * 400 + (n === 3 ? Math.max(0, Math.round(900 - race.t * 2)) : 0)), t = race.t; race = null; $('#lb-timer').style.display = 'none';
    best = Math.max(best, sc); Comp.finish(sc, `${n}/3 feladat, ${Math.floor(t / 60)} perc ${Math.round(t % 60)} mp`);
  }
  let best = 0;
  return { mount, tick, resize: () => C && C.resize(), startRace, stopRace: () => { race = null }, liveScore: () => race ? MISS.filter(m => done[m.k]).length * 400 : 0, get best() { return Math.max(best, Object.keys(done).length * 300) }, _dbg: { add, connect, doPing, get devs() { return devs }, get links() { return links }, ping, dhcpAll, done: () => done } };
})();
