/* ===== Közös grafika: vonalas ikonok, valósághű eszközrajzok, kábelek ===== */
Object.assign(ICON_PATHS, {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
  school: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/>',
  gamepad: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3M15.5 12h.01M18 13.5h.01"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  book: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4"/>',
  bug: '<rect x="7" y="8" width="10" height="12" rx="5"/><path d="M12 8V5M9 5l1.5 2M15 5l-1.5 2M3 13h4M17 13h4M4 8l3 2M20 8l-3 2M4 19l3-2M20 19l-3-2"/>',
  hook: '<path d="M12 3v11a4 4 0 0 1-8 0v-2l2 2"/><circle cx="12" cy="3" r="1"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14 9l2 2"/>',
  waves: '<path d="M2 8c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.5 5-1M2 13c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.5 5-1M2 18c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.5 5-1"/>',
  unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  plug: '<path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0zM12 17v5"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  circle: '<circle cx="12" cy="12" r="8"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8 21h8M9.5 17h5"/>',
  star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
  fan: '<circle cx="12" cy="12" r="1.8"/><path d="M12 10.2c-1-3.5 0-6.7 2.6-6.2 2.4.5 1.6 4.2-.8 6.6M13.8 12.6c3.5.9 5.8 3.4 4 5.4-1.6 1.8-4.4-.7-5.3-3.9M10.4 13c-2.6 2.6-5.9 3.3-6.7.8-.8-2.4 2.8-3.6 6.2-2.8"/>',
  thermo: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 9v7"/>',
  camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l1.5-3h5L16 7"/><circle cx="12" cy="13.5" r="3.5"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  drop: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
  plant: '<path d="M12 21v-9M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 14c0-4 3-6 7-6 0 4-3 6-7 6z"/>',
  siren: '<path d="M6 18v-6a6 6 0 0 1 12 0v6M4 18h16v3H4zM12 2v2M4.5 5l1.5 1.5M19.5 5L18 6.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V5.5a1.5 1.5 0 0 1 3 0V14c0 4-3 7-6.5 7S5 18.5 4 16l-1.5-3.5a1.5 1.5 0 0 1 2.6-1.4L8 14"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>', turnL: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v5"/>', turnR: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0-6 6v5"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  play: '<path d="M7 4l13 8-13 8z"/>', monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/>',
  rocket: '<path d="M5 15c-1.5 1.5-2 4.5-2 6 1.5 0 4.5-.5 6-2M9 15l-3-3c1-4 5-9 13-9 0 8-5 12-9 13z"/><circle cx="15" cy="9" r="1.5"/>',
  heart: '<path d="M12 20s-8-4.6-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.4 12 20 12 20z"/>',
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  cat: '<path d="M4 20V8l4 3h8l4-3v12z"/><path d="M9 15h.01M15 15h.01"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  wifi2: '<path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r=".8"/>',
  mega: '<path d="M3 10v4h3l8 5V5L6 10z"/><path d="M18 9a4 4 0 0 1 0 6"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>', box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>', flame: '<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 3 3 5 1-2 1-6 1-9z"/>',
});

/* ---- valósághű eszközrajzok (canvas) ---- */
const Dev = {
  _cache: {},
  rr(c, x, y, w, h, r) { rrect(c, x, y, w, h, Math.min(r, w / 2, h / 2)) },
  grad(c, y0, y1, a, b) { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g },
  shadow(c, x, y, w) { c.save(); c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(x, y, w / 2, w * .08, 0, 0, 7); c.filter = 'blur(4px)'; c.fill(); c.restore() },
  led(c, x, y, r, col, on = true) { c.fillStyle = on ? col : '#2a2d33'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); if (on) { c.save(); c.globalAlpha = .35; c.beginPath(); c.arc(x, y, r * 2.4, 0, 7); c.fill(); c.restore() } },
  // fő belépési pont: x,y = középpont, s = szélesség
  draw(c, type, x, y, s, o = {}) {
    const t = o.t || 0; c.save(); c.translate(x, y);
    const f = this[type]; if (f) f.call(this, c, s, t, o); c.restore();
  },
  img(type, s, o = {}) {
    const k = type + s + JSON.stringify(o); if (this._cache[k]) return this._cache[k];
    const cv = document.createElement('canvas'), d = 2, h = s * (o.h || 1.1); cv.width = s * d * 1.25; cv.height = h * d;
    const c = cv.getContext('2d'); c.scale(d, d); this.draw(c, type, s * .625, h / 2, s, { t: 1, ...o });
    return this._cache[k] = cv.toDataURL();
  },
  router(c, s, t, o) { // otthoni WiFi-router antennákkal
    const w = s, h = s * .26, y = s * .12;
    this.shadow(c, 0, y + h / 2 + 3, w * 1.05);
    c.strokeStyle = '#1b1d22'; c.lineCap = 'round';
    [[-.36, -.12], [-.12, -.04], [.12, .04], [.36, .12]].forEach(([p, a]) => { c.lineWidth = s * .055; c.beginPath(); c.moveTo(w * p, y - h * .2); c.lineTo(w * p + a * s, y - h * .2 - s * .42); c.stroke(); c.strokeStyle = '#2a2d34'; c.lineWidth = s * .03; c.beginPath(); c.moveTo(w * p, y - h * .2); c.lineTo(w * p + a * s, y - h * .2 - s * .42); c.stroke(); c.strokeStyle = '#1b1d22' });
    c.fillStyle = this.grad(c, y - h / 2, y + h / 2, '#3d424d', '#1c1f25'); this.rr(c, -w / 2, y - h / 2, w, h, h * .35); c.fill();
    c.fillStyle = 'rgba(255,255,255,.07)'; this.rr(c, -w / 2 + 2, y - h / 2 + 1, w - 4, h * .32, h * .3); c.fill();
    for (let i = 0; i < 6; i++) this.led(c, -w * .3 + i * w * .1, y + h * .12, s * .014, i === 0 ? '#60a5fa' : '#4ade80', i === 0 || Math.sin(t * (6 + i) + i * 2) > -.3);
    c.fillStyle = '#9aa0ab'; c.font = `600 ${s * .07}px Inter,sans-serif`; c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText('ROUTER', w * .43, y + h * .1);
  },
  corerouter(c, s, t, o) { // szolgáltatói / gerinc router (rack)
    const w = s, h = s * .42;
    this.shadow(c, 0, h / 2 + 3, w);
    c.fillStyle = this.grad(c, -h / 2, h / 2, '#4a505c', '#22252c'); this.rr(c, -w / 2, -h / 2, w, h, 6); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#15171b'; this.rr(c, -w * .44, -h * .3, w * .5, h * .6, 3); c.fill();
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { c.fillStyle = '#0b0c0f'; c.fillRect(-w * .42 + i * w * .078, -h * .22 + r * h * .25, w * .06, h * .18); this.led(c, -w * .39 + i * w * .078, -h * .26 + r * h * .25 + h * .26, s * .009, '#4ade80', Math.sin(t * 9 + i + r * 3) > 0) }
    c.fillStyle = '#0b0c0f'; for (let i = 0; i < 2; i++) this.rr(c, w * .12 + i * w * .14, -h * .2, w * .11, h * .4, 2), c.fill();
    this.led(c, w * .43, -h * .25, s * .016, '#60a5fa'); this.led(c, w * .43, 0, s * .016, '#4ade80'); this.led(c, w * .43, h * .25, s * .016, '#fbbf24', Math.sin(t * 2) > 0);
  },
  switch(c, s, t, o) { // 24 portos kapcsoló
    const w = s, h = s * .2;
    this.shadow(c, 0, h / 2 + 3, w);
    c.fillStyle = this.grad(c, -h / 2, h / 2, o.bad ? '#5b2430' : '#3b4150', o.bad ? '#2a1016' : '#1d2129'); this.rr(c, -w / 2, -h / 2, w, h, 5); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.09)'; c.lineWidth = 1; c.stroke();
    const n = 12, pw = w * .052, ph = h * .3;
    for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) {
      const px = -w * .4 + i * w * .062, py = -h * .36 + r * h * .42;
      c.fillStyle = '#0b0c0f'; c.fillRect(px, py, pw, ph); c.fillStyle = '#2e323b'; c.fillRect(px + pw * .2, py + ph * .7, pw * .6, ph * .3);
      this.led(c, px + pw * .25, py - h * .02 + (r ? ph + h * .06 : -h * .03), s * .006, (o.storm || Math.sin(t * 12 + i * 1.7 + r) > .2) ? (o.storm ? '#fbbf24' : '#4ade80') : '#4ade80', o.storm ? Math.random() > .3 : Math.sin(t * 12 + i * 1.7 + r) > -.2);
    }
    c.fillStyle = '#9aa0ab'; c.font = `700 ${h * .2}px Inter,sans-serif`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(o.label || 'SWITCH', w * .37 - w * .02, 0);
  },
  rack(c, s, t, o) { // szerverszekrény
    const w = s * .62, h = s * .95;
    this.shadow(c, 0, h / 2 + 2, w * 1.2);
    c.fillStyle = this.grad(c, -h / 2, h / 2, '#30343d', '#16181d'); this.rr(c, -w / 2, -h / 2, w, h, 6); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.08)'; c.stroke();
    const u = 5, uh = (h - 16) / u;
    for (let i = 0; i < u; i++) {
      const y = -h / 2 + 8 + i * uh;
      c.fillStyle = this.grad(c, y, y + uh - 3, '#4a505c', '#262a32'); this.rr(c, -w / 2 + 6, y, w - 12, uh - 3, 2); c.fill();
      for (let k = 0; k < 4; k++) { c.fillStyle = '#121418'; c.fillRect(-w / 2 + 10 + k * (w - 30) / 4.6, y + uh * .22, (w - 30) / 5.4, uh * .5) }
      this.led(c, w / 2 - 12, y + uh * .35, Math.max(1.2, s * .012), o.bad ? '#f87171' : '#4ade80', Math.sin(t * (5 + i) + i * 2) > -.4);
      this.led(c, w / 2 - 12, y + uh * .7, Math.max(1, s * .01), '#60a5fa', Math.sin(t * (13 + i)) > .3);
    }
  },
  laptop(c, s, t, o) {
    const w = s * .78, h = s * .5, by = s * .2;
    this.shadow(c, 0, by + s * .05, s);
    c.fillStyle = '#1b1d22'; this.rr(c, -w / 2, by - h, w, h, 6); c.fill();
    const g = c.createLinearGradient(-w / 2, by - h, w / 2, by); g.addColorStop(0, o.screen || '#1e3a8a'); g.addColorStop(1, '#0f172a');
    c.fillStyle = g; this.rr(c, -w / 2 + 4, by - h + 4, w - 8, h - 8, 3); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 4; i++) c.fillRect(-w / 2 + 10, by - h + 10 + i * h * .16, (w - 26) * (i % 2 ? .6 : .85), 2);
    c.fillStyle = this.grad(c, by, by + s * .06, '#c9ccd3', '#7c818c'); c.beginPath(); c.moveTo(-w / 2 - s * .06, by + s * .06); c.lineTo(w / 2 + s * .06, by + s * .06); c.lineTo(w / 2, by); c.lineTo(-w / 2, by); c.closePath(); c.fill();
  },
  desktop(c, s, t, o) {
    const w = s * .8, h = s * .52, top = -s * .38;
    this.shadow(c, 0, s * .3, s * .6);
    c.fillStyle = '#5b6070'; c.fillRect(-s * .04, top + h, s * .08, s * .14); c.fillStyle = '#7c818c'; this.rr(c, -s * .18, top + h + s * .13, s * .36, s * .04, 3); c.fill();
    c.fillStyle = '#1b1d22'; this.rr(c, -w / 2, top, w, h, 5); c.fill();
    const g = c.createLinearGradient(0, top, 0, top + h); g.addColorStop(0, o.screen || '#1e3a8a'); g.addColorStop(1, '#0b1020');
    c.fillStyle = g; this.rr(c, -w / 2 + 3, top + 3, w - 6, h - 6, 2); c.fill();
    if (o.flash) { c.fillStyle = `rgba(255,255,255,${o.flash * .5})`; this.rr(c, -w / 2 + 3, top + 3, w - 6, h - 6, 2); c.fill() }
  },
  phone(c, s, t, o) {
    const w = s * .38, h = s * .72;
    this.shadow(c, 0, h / 2 + 2, w * 1.4);
    c.fillStyle = '#16181d'; this.rr(c, -w / 2, -h / 2, w, h, w * .18); c.fill(); c.strokeStyle = '#4a4f5c'; c.lineWidth = 1.2; c.stroke();
    const g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, o.screen || '#0e7490'); g.addColorStop(1, '#0b1020');
    c.fillStyle = g; this.rr(c, -w / 2 + 3, -h / 2 + 6, w - 6, h - 12, w * .1); c.fill();
    c.fillStyle = '#16181d'; this.rr(c, -w * .15, -h / 2 + 3, w * .3, 3, 2); c.fill();
  },
  tablet(c, s, t, o) {
    const w = s * .66, h = s * .88;
    this.shadow(c, 0, h / 2 + 2, w * 1.1);
    c.fillStyle = '#d4d7de'; this.rr(c, -w / 2, -h / 2, w, h, 10); c.fill();
    c.fillStyle = '#16181d'; this.rr(c, -w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 8); c.fill();
    const g = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, '#fde68a'); g.addColorStop(1, '#f59e0b');
    c.fillStyle = g; this.rr(c, -w / 2 + 7, -h / 2 + 9, w - 14, h - 18, 3); c.fill();
    c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(0, -h * .1, w * .14, 0, 7); c.fill(); this.rr(c, -w * .22, h * .08, w * .44, h * .2, 8); c.fill();
  },
  tv(c, s, t, o) {
    const w = s, h = s * .58;
    this.shadow(c, 0, h / 2 + s * .06, s * .5);
    c.fillStyle = '#4a4f5c'; c.fillRect(-s * .2, h / 2, s * .4, s * .04);
    c.fillStyle = '#121418'; this.rr(c, -w / 2, -h / 2, w, h, 4); c.fill();
    const g = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, '#db2777'); g.addColorStop(.5, '#7c3aed'); g.addColorStop(1, '#1d4ed8');
    c.fillStyle = g; this.rr(c, -w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.moveTo(-w * .06, -h * .14); c.lineTo(w * .1, 0); c.lineTo(-w * .06, h * .14); c.fill();
  },
  console(c, s, t, o) {
    const w = s * .8, h = s * .24;
    this.shadow(c, 0, h / 2 + 2, w);
    c.fillStyle = this.grad(c, -h / 2, h / 2, '#f2f3f5', '#b5bac4'); this.rr(c, -w / 2, -h / 2, w, h, h * .3); c.fill();
    c.fillStyle = '#16181d'; this.rr(c, -w / 2 + 4, -h * .05, w - 8, h * .2, 3); c.fill();
    c.fillStyle = '#60a5fa'; c.fillRect(-w * .3, h * .05, w * .6, 1.5);
  },
  fridge(c, s, t, o) {
    const w = s * .5, h = s * .95;
    this.shadow(c, 0, h / 2 + 2, w * 1.3);
    c.fillStyle = this.grad(c, -h / 2, h / 2, '#e5e7eb', '#a3a8b3'); this.rr(c, -w / 2, -h / 2, w, h, 6); c.fill();
    c.strokeStyle = '#7c818c'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-w / 2, -h * .12); c.lineTo(w / 2, -h * .12); c.stroke();
    c.fillStyle = '#6b7180'; c.fillRect(-w * .35, -h * .4, 3, h * .2); c.fillRect(-w * .35, -h * .02, 3, h * .28);
    c.fillStyle = '#0f172a'; this.rr(c, w * .05, -h * .4, w * .3, h * .14, 2); c.fill(); c.fillStyle = '#5b9dff'; c.font = `700 ${w * .14}px Inter`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('4°', w * .2, -h * .33);
  },
  speaker(c, s, t, o) {
    const w = s * .42, h = s * .7;
    this.shadow(c, 0, h / 2 + 2, w * 1.4);
    c.fillStyle = this.grad(c, -h / 2, h / 2, '#3d424d', '#1c1f25'); this.rr(c, -w / 2, -h / 2, w, h, w / 2); c.fill();
    c.fillStyle = '#2a2e37'; for (let y = -h * .3; y < h * .32; y += 4) for (let x = -w * .3; x < w * .32; x += 4) c.fillRect(x, y, 1.6, 1.6);
    c.fillStyle = '#60a5fa'; this.rr(c, -w * .25, -h / 2 + 3, w * .5, 3, 2); c.fill();
  },
  camera(c, s, t, o) { // biztonsági kamera falon
    c.fillStyle = '#7c818c'; c.fillRect(s * .18, -s * .05, s * .1, s * .2); c.fillRect(s * .1, s * .12, s * .26, s * .06);
    c.fillStyle = this.grad(c, -s * .2, s * .1, '#f2f3f5', '#a3a8b3'); this.rr(c, -s * .38, -s * .2, s * .6, s * .26, s * .1); c.fill();
    c.fillStyle = '#16181d'; c.beginPath(); c.arc(-s * .3, -s * .07, s * .1, 0, 7); c.fill(); c.fillStyle = '#334155'; c.beginPath(); c.arc(-s * .3, -s * .07, s * .05, 0, 7); c.fill();
    this.led(c, s * .12, -s * .13, s * .02, '#f87171', Math.sin(t * 4) > 0);
  },
  ap(c, s, t, o) { // mennyezeti / mesh hozzáférési pont
    const w = s * .8;
    this.shadow(c, 0, s * .14, w);
    c.fillStyle = this.grad(c, -s * .12, s * .12, '#ffffff', '#c9ccd3'); c.beginPath(); c.ellipse(0, 0, w / 2, s * .16, 0, 0, 7); c.fill();
    c.strokeStyle = '#9aa0ab'; c.lineWidth = 1; c.stroke();
    c.strokeStyle = '#5b9dff'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(0, -s * .02, w * .18, s * .05, 0, 0, 7); c.stroke();
  },
  microwave(c, s, t, o) {
    const w = s * .9, h = s * .5;
    c.fillStyle = this.grad(c, -h / 2, h / 2, '#d4d7de', '#8b909b'); this.rr(c, -w / 2, -h / 2, w, h, 5); c.fill();
    c.fillStyle = o.on ? '#f59e0b' : '#1b1d22'; this.rr(c, -w * .42, -h * .36, w * .6, h * .72, 3); c.fill();
    c.fillStyle = '#16181d'; this.rr(c, w * .24, -h * .36, w * .18, h * .2, 2); c.fill();
    c.fillStyle = '#4ade80'; c.font = `700 ${h * .14}px monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.on ? '0:42' : '', w * .33, -h * .26);
  },
  // --- számítógép-alkatrészek (felülnézet) ---
  cpu(c, s) { const w = s * .8; c.fillStyle = '#14532d'; this.rr(c, -w / 2, -w / 2, w, w, 4); c.fill(); c.fillStyle = '#d4af37'; for (let i = 0; i < 8; i++) { c.fillRect(-w / 2 + 4 + i * (w - 8) / 8, -w / 2 + 1, 2, 3); c.fillRect(-w / 2 + 4 + i * (w - 8) / 8, w / 2 - 4, 2, 3) } c.fillStyle = this.grad(c, -w * .35, w * .35, '#e5e7eb', '#9aa0ab'); this.rr(c, -w * .35, -w * .35, w * .7, w * .7, 4); c.fill(); c.fillStyle = '#4a4f5c'; c.font = `700 ${w * .13}px Inter`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('CPU', 0, 0) },
  cooler(c, s, t) { const w = s * .9; c.fillStyle = '#2e323b'; this.rr(c, -w / 2, -w / 2, w, w, 8); c.fill(); c.fillStyle = '#16181d'; c.beginPath(); c.arc(0, 0, w * .42, 0, 7); c.fill(); c.save(); c.rotate(t * 8); c.fillStyle = '#5b6070'; for (let i = 0; i < 7; i++) { c.rotate(Math.PI * 2 / 7); c.beginPath(); c.ellipse(w * .2, 0, w * .19, w * .07, .5, 0, 7); c.fill() } c.restore(); c.fillStyle = '#a78bfa'; c.beginPath(); c.arc(0, 0, w * .09, 0, 7); c.fill() },
  ram(c, s) { const w = s * .26, h = s; c.fillStyle = '#166534'; this.rr(c, -w / 2, -h / 2, w, h, 2); c.fill(); c.fillStyle = '#111'; for (let i = 0; i < 6; i++) c.fillRect(-w * .32, -h * .44 + i * h * .14, w * .64, h * .11); c.fillStyle = '#d4af37'; c.fillRect(w / 2 - 3, -h * .45, 3, h * .9) },
  ssd(c, s) { const w = s, h = s * .26; c.fillStyle = '#0f172a'; this.rr(c, -w / 2, -h / 2, w, h, 2); c.fill(); c.fillStyle = '#1e293b'; c.fillRect(-w * .38, -h * .32, w * .3, h * .64); c.fillRect(0, -h * .32, w * .3, h * .64); c.fillStyle = '#d4af37'; c.fillRect(-w / 2, -h * .35, 4, h * .7); c.fillStyle = '#fbbf24'; c.font = `700 ${h * .32}px Inter`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('NVMe', w * .15, 0) },
  gpu(c, s, t) { const w = s, h = s * .3; c.fillStyle = this.grad(c, -h / 2, h / 2, '#3d424d', '#16181d'); this.rr(c, -w / 2, -h / 2, w, h, 5); c.fill(); c.fillStyle = '#d4af37'; c.fillRect(-w * .25, h / 2 - 2, w * .5, 3); for (const fx of [-w * .24, w * .2]) { c.fillStyle = '#0b0c0f'; c.beginPath(); c.arc(fx, 0, h * .4, 0, 7); c.fill(); c.save(); c.translate(fx, 0); c.rotate(t * 6); c.fillStyle = '#4a4f5c'; for (let i = 0; i < 6; i++) { c.rotate(Math.PI / 3); c.beginPath(); c.ellipse(h * .18, 0, h * .17, h * .06, .5, 0, 7); c.fill() } c.restore() } c.fillStyle = '#f472b6'; c.fillRect(-w / 2 + 6, -h / 2 + 4, w * .08, 2) },
  psu(c, s, t) { const w = s, h = s * .8; c.fillStyle = this.grad(c, -h / 2, h / 2, '#30343d', '#16181d'); this.rr(c, -w / 2, -h / 2, w, h, 4); c.fill(); c.strokeStyle = '#4a4f5c'; c.lineWidth = 1.2; for (let r = h * .12; r < h * .38; r += h * .07) { c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke() } c.beginPath(); c.moveTo(-h * .38, 0); c.lineTo(h * .38, 0); c.moveTo(0, -h * .38); c.lineTo(0, h * .38); c.stroke(); c.fillStyle = '#fb923c'; c.font = `700 ${h * .12}px Inter`; c.textAlign = 'center'; c.fillText('650W', 0, h * .47) },
  nic(c, s) { const w = s, h = s * .34; c.fillStyle = '#065f46'; this.rr(c, -w / 2, -h / 2, w, h, 3); c.fill(); c.fillStyle = '#111'; c.fillRect(-w * .15, -h * .25, w * .2, h * .45); c.fillStyle = '#d4af37'; c.fillRect(-w * .3, h / 2 - 2, w * .4, 3); c.fillStyle = '#9aa0ab'; c.fillRect(w * .32, -h * .4, w * .06, h * .3); c.fillRect(w * .32, h * .1, w * .06, h * .3) },
};

/* ---- kábelek: belógó, árnyékolt, csatlakozóval ---- */
const Cable = {
  TYPES: { patch: ['#2563eb', '#1e3a8a'], fiber: ['#f59e0b', '#92400e'], gray: ['#9ca3af', '#4b5563'], yellow: ['#facc15', '#854d0e'], green: ['#22c55e', '#14532d'], orange: ['#fb923c', '#7c2d12'], cyan: ['#22d3ee', '#155e75'], violet: ['#8b5cf6', '#3b0764'], red: ['#ef4444', '#7f1d1d'] },
  pts(x1, y1, x2, y2, sag = .12, n = 28) {
    const L = Math.hypot(x2 - x1, y2 - y1), mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + L * sag, P = [];
    for (let i = 0; i <= n; i++) { const t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, d = t * t; P.push([a * x1 + b * mx + d * x2, a * y1 + b * my + d * y2]) }
    return P;
  },
  at(P, t) { const f = clamp(t, 0, 1) * (P.length - 1), i = Math.min(P.length - 2, Math.floor(f)), k = f - i; return [P[i][0] + (P[i + 1][0] - P[i][0]) * k, P[i][1] + (P[i + 1][1] - P[i][1]) * k] },
  dist(P, x, y) { let best = 1e9, bt = 0; P.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < best) { best = d; bt = i / (P.length - 1) } }); return [best, bt] },
  stroke(c, P, from, to, w, col, dark, hi = true) {
    const i0 = Math.floor(from * (P.length - 1)), i1 = Math.ceil(to * (P.length - 1)); const S = P.slice(i0, i1 + 1); if (S.length < 2) return;
    const path = () => { c.beginPath(); c.moveTo(S[0][0], S[0][1]); for (const p of S) c.lineTo(p[0], p[1]) };
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.save(); c.translate(0, w * .5); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = w + 2; path(); c.stroke(); c.restore();
    c.strokeStyle = dark; c.lineWidth = w + 1.5; path(); c.stroke();
    c.strokeStyle = col; c.lineWidth = w; path(); c.stroke();
    if (hi) { c.save(); c.translate(0, -w * .22); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = Math.max(1, w * .22); path(); c.stroke(); c.restore() }
  },
  plug(c, P, end, w, col) { // RJ45-dugó a kábelvégen
    const a = end ? P[P.length - 1] : P[0], b = end ? P[P.length - 3] : P[2], ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
    c.save(); c.translate(a[0], a[1]); c.rotate(ang);
    c.fillStyle = col; this.rr(c, -w * 3.2, -w * .95, w * 1.8, w * 1.9, w * .5); c.fill();
    c.fillStyle = 'rgba(230,235,245,.85)'; c.fillRect(-w * 1.5, -w * .8, w * 1.5, w * 1.6); c.fillStyle = '#d4af37'; c.fillRect(-w * .35, -w * .6, w * .3, w * 1.2);
    c.restore();
  },
  rr(c, x, y, w, h, r) { rrect(c, x, y, w, h, Math.min(r, w / 2, h / 2)) },
  // fő rajzoló: o = {type, w, sag, cut, r1, r2 (rövidítés a végeken), plugs, glow}
  draw(c, x1, y1, x2, y2, o = {}) {
    const [col, dark] = this.TYPES[o.type || 'patch'] || [o.type, '#111']; const w = o.w || 5;
    const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L, r1 = o.r1 || 0, r2 = o.r2 || 0;
    const P = this.pts(x1 + ux * r1, y1 + uy * r1, x2 - ux * r2, y2 - uy * r2, o.sag ?? .1);
    c.save(); if (o.alpha != null) c.globalAlpha = o.alpha;
    if (o.glow) { c.save(); c.shadowColor = o.glow; c.shadowBlur = 14; c.strokeStyle = o.glow; c.lineWidth = w + 4; c.globalAlpha = .45; c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.restore() }
    if (o.cut) {
      this.stroke(c, P, 0, .44, w, col, dark); this.stroke(c, P, .56, 1, w, col, dark);
      for (const [t, dir] of [[.44, 1], [.56, -1]]) { const [x, y] = this.at(P, t), [x2b, y2b] = this.at(P, t + dir * .02), a = Math.atan2(y2b - y, x2b - x); c.lineCap = 'round'; ['#ea580c', '#16a34a', '#2563eb', '#a16207'].forEach((wc, k) => { c.strokeStyle = wc; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a + (k - 1.5) * .35) * w * 1.6, y + Math.sin(a + (k - 1.5) * .35) * w * 1.6); c.stroke() }) }
    } else this.stroke(c, P, 0, 1, w, col, dark, true);
    if (o.plugs !== false) { this.plug(c, P, false, w * .9, dark); this.plug(c, P, true, w * .9, dark) }
    c.restore(); return P;
  }
};

/* ---- vonalas ikon rajzolása canvasra (ICON_PATHS alapján) ---- */
const _icoCache = {};
function drawIcon(c, k, x, y, size, col, lw = 2) {
  const src = ICON_PATHS[k]; if (!src) return;
  let parts = _icoCache[k];
  if (!parts) {
    parts = _icoCache[k] = [];
    src.replace(/<path d="([^"]+)"/g, (_, d) => parts.push(new Path2D(d)));
    src.replace(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g, (_, a, b, r) => { const p = new Path2D(); p.arc(+a, +b, +r, 0, 7); parts.push(p) });
    src.replace(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"(?: rx="([\d.]+)")?/g, (_, a, b, w, h, r) => { const p = new Path2D(); const R = +(r || 0); p.moveTo(+a + R, +b); p.arcTo(+a + +w, +b, +a + +w, +b + +h, R); p.arcTo(+a + +w, +b + +h, +a, +b + +h, R); p.arcTo(+a, +b + +h, +a, +b, R); p.arcTo(+a, +b, +a + +w, +b, R); p.closePath(); parts.push(p) });
  }
  c.save(); c.translate(x - size / 2, y - size / 2); c.scale(size / 24, size / 24); c.strokeStyle = col; c.lineWidth = lw * 24 / size * (size / 24); c.lineCap = 'round'; c.lineJoin = 'round';
  c.lineWidth = lw; parts.forEach(p => c.stroke(p)); c.restore();
}
