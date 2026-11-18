/* ===== OSZTAG: Raktárbázis – saját, belső nézetes taktikai játék botok ellen (raycaster) =====
   A megépített gépen fut; a felbontás és a kijelzett FPS a szimulált hardvertől függ. */
const PCGame = (() => {
  const MAP = [
    '####################',
    '#P....#.......#....#',
    '#.....#..cc...#..B.#',
    '#..cc.#..cc.......c#',
    '#..cc.........##...#',
    '#.......####..##...#',
    '###.##..#..........#',
    '#......B#...cc..####',
    '#.cc....#...cc.....#',
    '#.cc.......B.......#',
    '#....####.....##...#',
    '#....#........##.B.#',
    '#..B.#..cc.........#',
    '#....#..cc....#....#',
    '#.........B...#..cc#',
    '####################'
  ];
  let cv, ctx, wrap, raf = 0, last = 0, P, bots, keys = {}, mouseDown = false, state, quality = 1, simFps = 60, zbuf = [], flash = 0, hitT = 0, dmgT = 0, round = 1, msg = '', msgT = 0, kills = 0, startT = 0, onKey, onKeyUp, onMove, active = false;
  const W0 = 480, H0 = 270;
  const cell = (x, y) => (MAP[y | 0] || '#')[x | 0] || '#';
  const solid = (x, y) => { const c = cell(x, y); return c === '#' || c === 'c' };
  function los(ax, ay, bx, by) { const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d * 4); for (let i = 1; i < n; i++) { const t = i / n; if (solid(ax + (bx - ax) * t, ay + (by - ay) * t)) return false } return true }
  function spawnRound(r) {
    const spots = []; MAP.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'B') spots.push([x + .5, y + .5]) }));
    const n = Math.min(spots.length, 2 + r * 2); bots = [];
    for (let i = 0; i < n; i++) { const [x, y] = spots[i % spots.length]; bots.push({ x: x + (Math.random() - .5) * .4, y: y + (Math.random() - .5) * .4, a: Math.random() * 6.28, hp: 100, cd: 1 + Math.random(), tx: x, ty: y, dead: 0, spd: 1.1 + r * .25, acc: .45 + r * .07 }) }
    msg = `${r}. KÖR – ${n} ellenfél`; msgT = 2.2;
  }
  function reset() {
    MAP.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'P') P = { x: x + .5, y: y + .5, a: .3, hp: 100, ammo: 30, mag: 90, rel: 0, fireCd: 0, bob: 0 } }));
    round = 1; kills = 0; state = 'play'; startT = performance.now(); spawnRound(1);
  }
  function tryMove(o, dx, dy, r = .22) { if (!solid(o.x + dx + Math.sign(dx) * r, o.y)) o.x += dx; if (!solid(o.x, o.y + dy + Math.sign(dy) * r)) o.y += dy }
  function shoot() {
    if (P.rel > 0 || P.fireCd > 0) return; if (P.ammo <= 0) { reload(); return }
    P.ammo--; P.fireCd = .11; flash = .06; P.a += (Math.random() - .5) * .012; beep(140 + Math.random() * 40, .06, 'square', .05);
    // találat: a képernyő közepén lévő legközelebbi bot, ha nincs előtte fal
    const wallD = zbuf[(zbuf.length / 2) | 0] || 99; let best = null, bd = 99;
    for (const b of bots) { if (b.dead) continue; const dx = b.x - P.x, dy = b.y - P.y, d = Math.hypot(dx, dy); let ang = Math.atan2(dy, dx) - P.a; while (ang > Math.PI) ang -= 6.283; while (ang < -Math.PI) ang += 6.283; if (Math.abs(ang) < Math.atan(.28 / d) && d < wallD && d < bd) { bd = d; best = b } }
    if (best) { best.hp -= 34 + Math.random() * 10; hitT = .15; best.alert = 1; beep(900, .04, 'triangle', .05); if (best.hp <= 0) { best.dead = 1; kills++; beep(220, .25, 'sawtooth', .05, -120) } }
  }
  function reload() { if (P.rel > 0 || P.mag <= 0 || P.ammo >= 30) return; P.rel = 1.6; beep(500, .08, 'triangle', .04); setTimeout(() => beep(700, .06, 'triangle', .04), 900) }
  function update(dt) {
    if (state !== 'play') return;
    const mv = 3.2 * dt, rs = 2.4 * dt, cs = Math.cos(P.a), sn = Math.sin(P.a); let moving = false;
    if (keys.KeyW || keys.ArrowUp) { tryMove(P, cs * mv, sn * mv); moving = true }
    if (keys.KeyS || keys.ArrowDown) { tryMove(P, -cs * mv, -sn * mv); moving = true }
    if (keys.KeyA) { tryMove(P, sn * mv, -cs * mv); moving = true }
    if (keys.KeyD) { tryMove(P, -sn * mv, cs * mv); moving = true }
    if (keys.ArrowLeft || keys.KeyQ) P.a -= rs; if (keys.ArrowRight || keys.KeyE) P.a += rs;
    if (moving) P.bob += dt * 9;
    P.fireCd -= dt; if (P.rel > 0) { P.rel -= dt; if (P.rel <= 0) { const n = Math.min(30 - P.ammo, P.mag); P.ammo += n; P.mag -= n } }
    if ((mouseDown || keys.Space) && P.ammo > 0) shoot(); else if ((mouseDown || keys.Space) && P.ammo === 0 && P.rel <= 0) reload();
    for (const b of bots) {
      if (b.dead) { b.dead = Math.min(2, b.dead + dt * 3); continue }
      const dx = P.x - b.x, dy = P.y - b.y, d = Math.hypot(dx, dy), see = d < 11 && los(b.x, b.y, P.x, P.y);
      if (see) { b.alert = 1; b.a = Math.atan2(dy, dx); if (d > 3) tryMove(b, Math.cos(b.a) * b.spd * dt * .6, Math.sin(b.a) * b.spd * dt * .6, .25);
        b.cd -= dt; if (b.cd <= 0) { b.cd = .7 + Math.random() * .8; b.shot = .08; beep(180, .05, 'square', .03); if (Math.random() < b.acc - d * .025) { const dm = 8 + Math.random() * 9; P.hp -= dm; dmgT = .3; if (P.hp <= 0) { P.hp = 0; state = 'dead'; beep(110, .6, 'sawtooth', .07, -60) } } } }
      else { const tdx = b.tx - b.x, tdy = b.ty - b.y, td = Math.hypot(tdx, tdy); if (td < .3 || b.stuck > 1.5) { for (let k = 0; k < 20; k++) { const x = 1 + Math.random() * 18, y = 1 + Math.random() * 14; if (!solid(x, y) && los(b.x, b.y, x, y)) { b.tx = x; b.ty = y; break } } b.stuck = 0 } else { const ox = b.x, oy = b.y; b.a = Math.atan2(tdy, tdx); tryMove(b, tdx / td * b.spd * dt * (b.alert ? 1.2 : .6), tdy / td * b.spd * dt * (b.alert ? 1.2 : .6), .25); if (Math.hypot(b.x - ox, b.y - oy) < .001) b.stuck = (b.stuck || 0) + dt } }
      if (b.shot > 0) b.shot -= dt;
    }
    if (bots.every(b => b.dead)) { if (round >= 3) { state = 'won' } else { round++; P.hp = Math.min(100, P.hp + 40); P.mag += 60; spawnRound(round) } }
    flash -= dt; hitT -= dt; dmgT -= dt; msgT -= dt;
  }
  function render() {
    const w = cv.width, h = cv.height, c = ctx, bob = Math.sin(P.bob) * 2 * quality;
    let g = c.createLinearGradient(0, 0, 0, h / 2); g.addColorStop(0, '#2a2f38'); g.addColorStop(1, '#4a4f58'); c.fillStyle = g; c.fillRect(0, 0, w, h / 2 + bob);
    g = c.createLinearGradient(0, h / 2, 0, h); g.addColorStop(0, '#3b3328'); g.addColorStop(1, '#6b5a44'); c.fillStyle = g; c.fillRect(0, h / 2 + bob, w, h / 2);
    const fov = .66, dirX = Math.cos(P.a), dirY = Math.sin(P.a), plX = -dirY * fov, plY = dirX * fov; zbuf = new Array(w);
    for (let x = 0; x < w; x++) {
      const camX = 2 * x / w - 1, rdx = dirX + plX * camX, rdy = dirY + plY * camX; let mx = P.x | 0, my = P.y | 0;
      const ddx = Math.abs(1 / rdx), ddy = Math.abs(1 / rdy); let sx, sy, sdx, sdy, side = 0, hitc = '#';
      if (rdx < 0) { sx = -1; sdx = (P.x - mx) * ddx } else { sx = 1; sdx = (mx + 1 - P.x) * ddx } if (rdy < 0) { sy = -1; sdy = (P.y - my) * ddy } else { sy = 1; sdy = (my + 1 - P.y) * ddy }
      for (let k = 0; k < 64; k++) { if (sdx < sdy) { sdx += ddx; mx += sx; side = 0 } else { sdy += ddy; my += sy; side = 1 } hitc = cell(mx, my); if (hitc === '#' || hitc === 'c') break }
      const pd = side ? (my - P.y + (1 - sy) / 2) / rdy : (mx - P.x + (1 - sx) / 2) / rdx; zbuf[x] = pd;
      const lh = h / pd, top = -lh / 2 + h / 2 + bob; let wx = side ? P.x + pd * rdx : P.y + pd * rdy; wx -= Math.floor(wx);
      const sh = Math.max(.25, 1 - pd / 14) * (side ? .78 : 1);
      if (hitc === 'c') { const edge = wx < .07 || wx > .93 || Math.abs(wx - .5) < .04; const base = edge ? [92, 64, 32] : [176, 128, 70]; c.fillStyle = `rgb(${base[0] * sh | 0},${base[1] * sh | 0},${base[2] * sh | 0})`; c.fillRect(x, top + lh * .35, 1, lh * .65); c.fillStyle = `rgb(${120 * sh | 0},${84 * sh | 0},${44 * sh | 0})`; c.fillRect(x, top + lh * .35, 1, lh * .04) }
      else { const stripe = ((wx * 4) | 0) % 2, base = stripe ? [118, 124, 134] : [104, 110, 120]; c.fillStyle = `rgb(${base[0] * sh | 0},${base[1] * sh | 0},${base[2] * sh | 0})`; c.fillRect(x, top, 1, lh); c.fillStyle = `rgba(250,204,21,${.55 * sh})`; c.fillRect(x, top + lh * .78, 1, lh * .04) }
    }
    // botok (billboard), hátulról előre
    const vis = bots.map(b => ({ b, d: (b.x - P.x) ** 2 + (b.y - P.y) ** 2 })).sort((a, b) => b.d - a.d), inv = 1 / (plX * dirY - dirX * plY);
    for (const { b } of vis) {
      const sxr = b.x - P.x, syr = b.y - P.y, tx = inv * (dirY * sxr - dirX * syr), ty = inv * (-plY * sxr + plX * syr); if (ty <= .1) continue;
      const scx = (w / 2) * (1 + tx / ty), sh2 = Math.abs(h / ty), sw = sh2 * .42, fall = b.dead ? b.dead / 2 : 0, ytop = h / 2 - sh2 / 2 + sh2 * .12 + bob + fall * sh2 * .45, hh = sh2 * .88 * (1 - fall * .55);
      const x0 = Math.max(0, scx - sw / 2 | 0), x1 = Math.min(w - 1, scx + sw / 2 | 0), shd = Math.max(.3, 1 - ty / 14);
      for (let x = x0; x <= x1; x++) {
        if (ty >= zbuf[x]) continue; const u = (x - (scx - sw / 2)) / sw;
        if (u > .34 && u < .66) { c.fillStyle = `rgb(${224 * shd | 0},${180 * shd | 0},${140 * shd | 0})`; c.fillRect(x, ytop, 1, hh * .14) } // fej
        if (u > .38 && u < .62) { c.fillStyle = `rgb(${30 * shd | 0},${35 * shd | 0},${40 * shd | 0})`; c.fillRect(x, ytop, 1, hh * .05) } // sisak
        if (u > .18 && u < .82) { c.fillStyle = b.dead ? `rgb(${90 * shd | 0},40,40)` : `rgb(${168 * shd | 0},${46 * shd | 0},${46 * shd | 0})`; c.fillRect(x, ytop + hh * .15, 1, hh * .42) } // test
        if ((u > .24 && u < .46) || (u > .54 && u < .76)) { c.fillStyle = `rgb(${46 * shd | 0},${50 * shd | 0},${58 * shd | 0})`; c.fillRect(x, ytop + hh * .57, 1, hh * .43) } // láb
      }
      if (b.shot > 0 && !b.dead) { c.fillStyle = '#ffd166'; c.beginPath(); c.arc(scx + sw * .3, ytop + hh * .35, Math.max(2, sw * .12), 0, 7); c.fill() }
      if (!b.dead && b.hp < 100 && ty < zbuf[Math.max(0, Math.min(w - 1, scx | 0))]) { c.fillStyle = '#000a'; c.fillRect(scx - sw / 2, ytop - 6 * quality, sw, 3 * quality); c.fillStyle = '#f87171'; c.fillRect(scx - sw / 2, ytop - 6 * quality, sw * b.hp / 100, 3 * quality) }
    }
    // fegyver
    const gx = w * .62, gy = h * .72 + Math.abs(Math.sin(P.bob)) * 5 * quality + (flash > 0 ? 6 * quality : 0) + (P.rel > 0 ? h * .25 * Math.sin(P.rel / 1.6 * Math.PI) : 0), s = h / 270;
    c.fillStyle = '#1f2329'; c.beginPath(); c.moveTo(gx, gy + 70 * s); c.lineTo(gx + 40 * s, gy - 10 * s); c.lineTo(gx + 70 * s, gy - 6 * s); c.lineTo(gx + 64 * s, gy + 80 * s); c.fill();
    c.fillStyle = '#3a4048'; c.fillRect(gx + 34 * s, gy - 22 * s, 16 * s, 20 * s); c.fillStyle = '#596270'; c.fillRect(gx + 40 * s, gy - 44 * s, 6 * s, 26 * s);
    if (flash > 0) { c.fillStyle = 'rgba(255,214,102,.95)'; c.beginPath(); c.arc(gx + 43 * s, gy - 48 * s, 12 * s, 0, 7); c.fill() }
    // célkereszt, találat
    c.strokeStyle = hitT > 0 ? '#f87171' : '#4ade80'; c.lineWidth = Math.max(1, quality); const cx = w / 2, cy = h / 2, gap = 4 * s + (flash > 0 ? 3 * s : 0);
    c.beginPath(); c.moveTo(cx - gap - 6 * s, cy); c.lineTo(cx - gap, cy); c.moveTo(cx + gap, cy); c.lineTo(cx + gap + 6 * s, cy); c.moveTo(cx, cy - gap - 6 * s); c.lineTo(cx, cy - gap); c.moveTo(cx, cy + gap); c.lineTo(cx, cy + gap + 6 * s); c.stroke();
    if (dmgT > 0) { c.fillStyle = `rgba(220,38,38,${dmgT})`; c.fillRect(0, 0, w, h) }
    // HUD
    c.font = `700 ${14 * s}px Inter,sans-serif`; c.textBaseline = 'bottom'; c.fillStyle = '#000a'; c.fillRect(8 * s, h - 34 * s, 150 * s, 26 * s); c.fillRect(w - 158 * s, h - 34 * s, 150 * s, 26 * s);
    c.fillStyle = P.hp > 30 ? '#4ade80' : '#f87171'; c.textAlign = 'left'; c.fillText(`+ ${Math.ceil(P.hp)}  ÉLET`, 16 * s, h - 13 * s);
    c.fillStyle = '#fde68a'; c.textAlign = 'right'; c.fillText(P.rel > 0 ? 'TÁRCSERE…' : `${P.ammo} / ${P.mag}`, w - 16 * s, h - 13 * s);
    c.textAlign = 'left'; c.textBaseline = 'top'; c.fillStyle = '#000a'; c.fillRect(8 * s, 8 * s, 168 * s, 40 * s); c.fillStyle = '#fff'; c.font = `700 ${12 * s}px Inter,sans-serif`;
    c.fillText(`${round}/3. kör • ellenfél: ${bots.filter(b => !b.dead).length}`, 14 * s, 13 * s); c.fillStyle = '#94a3b8'; c.fillText(`${kills} kiütés • ${simFps} FPS (szimulált)`, 14 * s, 29 * s);
    // minitérkép
    const ms = 3 * s, mx0 = w - MAP[0].length * ms - 8 * s, my0 = 8 * s; c.globalAlpha = .75;
    MAP.forEach((row, y) => [...row].forEach((ch, x) => { c.fillStyle = ch === '#' ? '#64748b' : ch === 'c' ? '#a16207' : '#111827'; c.fillRect(mx0 + x * ms, my0 + y * ms, ms, ms) }));
    c.fillStyle = '#4ade80'; c.fillRect(mx0 + P.x * ms - ms / 2, my0 + P.y * ms - ms / 2, ms, ms); c.globalAlpha = 1;
    if (msgT > 0) { c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `800 ${26 * s}px Inter,sans-serif`; c.fillStyle = `rgba(253,230,138,${Math.min(1, msgT)})`; c.fillText(msg, w / 2, h * .3) }
    if (state !== 'play') {
      c.fillStyle = '#000c'; c.fillRect(0, 0, w, h); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `800 ${30 * s}px Inter,sans-serif`; c.fillStyle = state === 'won' ? '#4ade80' : '#f87171'; c.fillText(state === 'won' ? 'GYŐZELEM!' : 'KIESTÉL', w / 2, h * .38);
      c.font = `600 ${14 * s}px Inter,sans-serif`; c.fillStyle = '#e5e7eb'; c.fillText(`${kills} kiütés • ${Math.round((performance.now() - startT) / 1000)} mp`, w / 2, h * .5); c.fillText('Kattints az újrakezdéshez', w / 2, h * .6);
    }
  }
  function loop(t) { if (!active || !cv.isConnected) return stop(); const dt = Math.min(.05, (t - last) / 1000); last = t; update(dt); render(); raf = requestAnimationFrame(loop) }
  function mount(container, opts = {}) {
    stop(); simFps = Math.max(5, Math.round(opts.fps || 60));
    quality = simFps >= 144 ? 1.6 : simFps >= 90 ? 1.3 : simFps >= 60 ? 1 : simFps >= 30 ? .7 : .45;
    container.innerHTML = `<div class="g-wrap" style="position:relative;width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center;outline:none" tabindex="0"><canvas style="width:100%;height:100%;object-fit:contain;image-rendering:${quality < 1 ? 'pixelated' : 'auto'};cursor:crosshair"></canvas><div class="g-help" style="position:absolute;left:0;right:0;bottom:6px;text-align:center;color:#cbd5e1;font:12px Inter,sans-serif;pointer-events:none">Kattints a játékba • W A S D: mozgás • egér vagy Q/E: fordulás • bal klikk / szóköz: lövés • R: tárcsere • Esc: egér elengedése</div></div>`;
    wrap = container.firstChild; cv = wrap.querySelector('canvas'); cv.width = W0 * quality | 0; cv.height = H0 * quality | 0; ctx = cv.getContext('2d');
    reset(); active = true; keys = {};
    onKey = e => { if (!active || !cv.isConnected) return; if (document.activeElement !== wrap && document.pointerLockElement !== cv) return; keys[e.code] = true; if (e.code === 'KeyR') reload(); if (/^(Key[WASDQER]|Arrow|Space)/.test(e.code)) { e.preventDefault(); e.stopPropagation() } };
    onKeyUp = e => { keys[e.code] = false };
    onMove = e => { if (document.pointerLockElement === cv) P.a += e.movementX * .0028 };
    addEventListener('keydown', onKey, true); addEventListener('keyup', onKeyUp, true); addEventListener('mousemove', onMove);
    cv.addEventListener('pointerdown', e => { wrap.focus(); if (state !== 'play') { reset(); return } if (document.pointerLockElement !== cv && cv.requestPointerLock) { try { cv.requestPointerLock() } catch (err) { } } mouseDown = true; e.preventDefault() });
    addEventListener('pointerup', () => mouseDown = false);
    cv.addEventListener('mousemove', e => { if (document.pointerLockElement !== cv && e.buttons === 0) { /* nincs zárolás: a kurzor helye fordít */ } });
    wrap.focus(); last = performance.now(); raf = requestAnimationFrame(loop);
    return { stop };
  }
  function stop() { active = false; cancelAnimationFrame(raf); if (onKey) { removeEventListener('keydown', onKey, true); removeEventListener('keyup', onKeyUp, true); removeEventListener('mousemove', onMove) } if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock() }
  return { mount, stop, _dbg: () => ({ P, bots }) };
})();
