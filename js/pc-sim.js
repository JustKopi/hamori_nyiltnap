/* ===== Gépépítő: szimulációs motor – a valós alkatrészadatokból számol ===== */
const PCSim = (() => {
  const GAMES = [
    { n: 'Cyberpunk 2077 (magas)', g: 74, c: 125 }, { n: 'Fortnite (epikus)', g: 150, c: 240 },
    { n: 'Counter-Strike 2', g: 300, c: 420 }, { n: 'Minecraft (shaderekkel)', g: 105, c: 170 },
  ];
  const RES = { '1080p': 1, '1440p': .68, '4K': .38 };
  function airflow(B) {
    const nf = (B.case ? B.case.fans.n : 0) + (B.fans ? B.fans.n : 0) + (B.cooler && B.cooler.type === 'aio' ? B.cooler.rad / 120 : 0);
    return (B.case ? B.case.air : 1.1) * (nf < 2 ? 1.18 : nf < 4 ? 1.0 : .92);
  }
  function power(B, load) {
    const cpuW = B.cpu ? (B.cpu.w * (.18 + .82 * load)) : 0, gpuW = B.gpu ? B.gpu.w * (.1 + .9 * load) : 0;
    const rest = 35 + (B.ram ? B.ram.length * 4 : 0) + (B.storage ? B.storage.length * 5 : 0) + ((B.fans ? B.fans.n : 0) + (B.case ? B.case.fans.n : 0)) * 2 + (B.cooler && B.cooler.type === 'aio' ? 6 : 0);
    return { cpuW, gpuW, total: cpuW + gpuW + rest };
  }
  const need = B => Math.ceil(((B.cpu ? B.cpu.w : 0) + (B.gpu ? B.gpu.w : 0) + 90) * 1.25 / 50) * 50;
  function cpuTarget(B, load) {
    if (!B.cpu) return 25;
    if (!B.cooler || !B.coolerSecure) return 30 + 85 * (.3 + .7 * load) * (B.cpu.w / 90);
    const w = B.cpu.w * (.18 + .82 * load), r = w / B.cooler.cap;
    let t = 27 + 66 * Math.pow(r, .8) * airflow(B);
    if (!B.paste) t += 20 + 18 * load; else t += B.paste.dt || 0;
    return t;
  }
  function gpuTarget(B, load) { if (!B.gpu) return 0; return 32 + (.18 + .82 * load) * (B.gpu.w * .085 + 22) * airflow(B) }
  function dual(B) { const s = (B.ramSlots || []).slice().sort(); return s.length >= 4 || (s.length === 2 && ((s[0] === 0 && s[1] === 2) || (s[0] === 1 && s[1] === 3))) || (B.mb && B.mb.slots === 2 && s.length === 2) }
  function fps(B) {
    if (!B.cpu || (!B.gpu && !B.cpu.igpu)) return [];
    const gperf = B.gpu ? B.gpu.perf : 12, ram = (dual(B) ? 1 : .85) * (B.mb && B.mb.mem === 'DDR4' ? .95 : 1), gb = (B.ram || []).reduce((s, r) => s + r.gb, 0), memF = gb < 16 ? .8 : 1;
    const thr = B.paste ? 1 : .55;
    return GAMES.map(g => ({ n: g.n, r: Object.fromEntries(Object.entries(RES).map(([k, f]) => [k, Math.round(Math.min(g.c * B.cpu.st / 100 * ram * memF * thr, g.g * gperf / 100 * f * (B.gpu && B.gpu.vram < 10 && k === '4K' ? .8 : 1)))])) }));
  }
  function score(B) { if (!B.cpu) return 0; const f = fps(B); return Math.round((B.cpu.mt * 60 + (B.gpu ? B.gpu.perf : 12) * 110) * (dual(B) ? 1 : .9)) }
  // bekapcsoláskori ellenőrzés (POST)
  function post(B) {
    const L = ['UEFI BIOS – ' + (B.mb ? B.mb.name : '?')];
    if (!B.conn.cfp) return { lvl: 0, t: 'Semmi sem történik.', d: 'A ház bekapcsológombja nincs bekötve az alaplapra (előlapi csatlakozók).', scr: 'off' };
    if (!B.psu || !B.conn.c24 || !B.mb) return { lvl: 0, t: 'Semmi sem történik.', d: 'Az alaplap nem kap áramot: hiányzik a tápegység vagy a 24 tűs kábel.', scr: 'off' };
    if (!B.cpu) return { lvl: 1, t: 'Pörögnek a ventilátorok, de nincs kép.', d: 'Nincs processzor a foglalatban.', scr: 'off', fans: true };
    if (!B.conn.ceps) return { lvl: 1, t: 'Elindul, majd azonnal leáll.', d: 'A processzor nem kap tápot: kösd be a 8 tűs CPU-tápkábelt.', scr: 'off', off: 600 };
    if (!B.ram || !B.ram.length) return { lvl: 1, t: 'Sípolás: 1 hosszú, 2 rövid…', d: 'Nincs memória a gépben – a sípkód elárulja!', scr: 'off', beeps: true, fans: true };
    const gpuOut = B.gpu ? B.conn.cgpu : B.cpu.igpu;
    if (B.gpu && !B.conn.cgpu) return { lvl: 2, t: 'Nincs kép.', d: 'A videokártya nem kap tápot: kösd be a PCIe tápkábelt!', scr: 'nosignal', fans: true };
    if (!gpuOut) return { lvl: 2, t: 'Nincs kép.', d: `Nincs videokártya, és a(z) ${B.cpu.name} processzornak nincs integrált grafikája.`, scr: 'nosignal', fans: true };
    L.push('CPU ........ ' + B.cpu.name, 'Memória .... ' + B.ram.reduce((s, r) => s + r.gb, 0) + ' GB ' + B.ram[0].mem + (dual(B) ? ' (kétcsatornás)' : ' (EGYCSATORNÁS!)'));
    const warn = [];
    if (!B.conn.cfan) { L.push('!CPU Fan Error! – nyomj F1-et a folytatáshoz'); warn.push('A processzorhűtő ventilátora nincs bekötve a CPU_FAN csatlakozóba.') }
    if (!dual(B)) warn.push('A memóriák rossz foglalatban vannak: egycsatornás mód, lassabb gép. Használd az A2 és B2 helyet!');
    if (!B.storage || !B.storage.length) { L.push('!Rendszerindító eszköz nem található'); return { lvl: 3, t: 'Nincs rendszerindító eszköz.', d: 'Nincs tárhely a gépben, amire a rendszert telepíteni lehetne.', scr: 'bios', bios: L } }
    B.storage.forEach(s => L.push((s.p.kind === 'hdd' ? 'HDD ' : 'SSD ') + '........ ' + s.p.name));
    const os = B.storage.find(s => s.os);
    if (!os) { L.push('Nincs operációs rendszer.', 'Csatlakoztass telepítő USB-meghajtót!'); return { lvl: 4, t: 'A gép működik – telepítsd a Windowst!', d: 'A hardver rendben van, de a tárhely még üres. Nyisd meg a monitort, és telepítsd a rendszert!', scr: 'noos', bios: L, warn } }
    return { lvl: 5, t: 'A gép elindult!', d: warn.length ? warn.join(' ') : 'Minden alkatrész rendben működik.', scr: 'os', bios: L, warn, boot: os.p.kind === 'hdd' ? 38 : os.p.kind === 'ssd25' ? 14 : 8 };
  }
  // élő szenzorok
  const S = { cpuT: 25, gpuT: 25, load: 0, run: false, B: null, shutdown: null };
  function start(B) { S.B = B; S.cpuT = 30; S.gpuT = 30; S.run = true; S.shutdown = null; S.load = .04 }
  function stop() { S.run = false }
  function tick(dt, load) {
    const B = S.B; if (!B || !S.run) return null;
    S.load += (load - S.load) * Math.min(1, dt * 1.5);
    const ct = cpuTarget(B, S.load), gt = gpuTarget(B, S.load);
    S.cpuT += (ct - S.cpuT) * Math.min(1, dt * (B.paste && B.coolerSecure ? .45 : .8)); S.gpuT += (gt - S.gpuT) * Math.min(1, dt * .3);
    const thr = S.cpuT > 95 ? Math.max(.4, 1 - (S.cpuT - 95) * .06) : 1;
    const p = power(B, S.load * thr), n = (a, k = 1) => a + (Math.random() - .5) * k;
    const fanC = clamp(500 + (S.cpuT - 38) * 32, 500, 2000), fanCase = clamp(700 + S.load * 600, 600, 1400);
    if (S.cpuT > 104 && !S.shutdown) S.shutdown = 'A processzor túlmelegedett (105 °C) – vészleállás!';
    if (B.psu && p.total > B.psu.w * .98 && S.load > .6 && !S.shutdown) S.shutdown = `A ${B.psu.w} W-os tápegység túlterhelődött (${Math.round(p.total)} W) – a gép kikapcsolt!`;
    const st = B.cpu ? B.cpu.boost * 1000 * thr * (.55 + .45 * Math.min(1, S.load * 3)) : 0;
    return {
      cpuT: n(S.cpuT, .8), cpuW: n(p.cpuW, 2), cpuMHz: n(st, 30), gpuT: B.gpu ? n(S.gpuT, .6) : null, gpuW: B.gpu ? n(p.gpuW, 3) : null,
      fanC: B.cooler ? n(fanC, 20) : 0, fanCase: n(fanCase, 15), psuW: n(p.total, 3), psuPct: B.psu ? p.total / B.psu.w * 100 : 0,
      ram: (B.ram || []).reduce((s, r) => s + r.gb, 0), ramUse: 3.6 + S.load * 8 + Math.random() * .2, throttle: thr < 1, shutdown: S.shutdown,
      noise: Math.round(24 + fanC / 90 + fanCase / 140 + (B.gpu ? S.load * B.gpu.w / 22 : 0)),
    };
  }
  // a rendelésekhez: tulajdonságok
  function props(B) {
    const cols = [B.case && B.case.col, B.mb && (B.mb.white ? '#fff' : B.mb.col), B.cooler && B.cooler.col, B.gpu && B.gpu.col, ...(B.ram || []).map(r => r.col), B.fans && B.fans.col];
    const isW = c => c && /^#(e|f|d|c)/i.test(c);
    return {
      ramGB: (B.ram || []).reduce((s, r) => s + r.gb, 0), tb: (B.storage || []).reduce((s, x) => s + x.p.tb, 0), ssd: (B.storage || []).some(s => s.p.kind !== 'hdd' && s.os),
      cores: B.cpu ? B.cpu.cores : 0, vram: B.gpu ? B.gpu.vram : 0, aio: !!(B.cooler && B.cooler.type === 'aio'),
      rgb: [B.cooler && B.cooler.rgb, B.gpu && B.gpu.rgb, ...(B.ram || []).map(r => r.rgb), B.fans && B.fans.rgb, B.case && B.case.fans.rgb].filter(Boolean).length,
      white: cols.filter(Boolean).every(isW) && !!B.case, whiteCase: !!(B.case && isW(B.case.col)), form: B.case ? B.case.form : null,
      fps: fps(B),
    };
  }
  return { power, need, post, start, stop, tick, fps, score, props, dual, GAMES };
})();
