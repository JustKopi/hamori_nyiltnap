/* ===== 7. Hacker-terminál: Linux / Windows / Cisco parancssor ===== */
App.add((() => {
  const S = {
    id: 'terminal', icon: '', title: 'Parancssor-kaland', color: '#4ade80',
    desc: 'Gépelj be igazi parancsokat, mint a rendszergazdák! Van egy titkos fájl is… megtalálod?',
    topic: 'Linux és Windows parancssor, Cisco IOS, hálózati diagnosztika, jogosultságok'
  };
  let out, inp, hist = [], hi = 0, busy = false, matrix = null, cisco = 0, cwd = '~';
  const IPS = { 'google.com': '142.250.180.14', 'google.hu': '142.250.186.67', 'youtube.com': '142.250.184.238', 'iskola.hu': '193.6.12.80', 'facebook.com': '157.240.224.35', 'tiktok.com': '23.40.104.5', 'wikipedia.org': '185.15.59.224', 'minecraft.net': '13.107.246.50' };
  const resolve = h => IPS[h] || (/^\d+\.\d+\.\d+\.\d+$/.test(h) ? h : /\.[a-z]{2,}$/.test(h) ? `${rnd(20, 220)}.${rnd(0, 255)}.${rnd(0, 255)}.${rnd(1, 254)}` : null);
  const FILES = { 'jegyzet.txt': 'Holnap nyílt nap! Ne felejtsd el bekapcsolni a routereket. ', 'titok.txt': null, 'bevasarlas.txt': '- tej\n- kenyér\n- 2 db UTP-kábel\n- csoki a rendszergazdának' };
  function print(html, cls = '') { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; out.appendChild(d); out.scrollTop = out.scrollHeight }
  async function slow(lines, ms = 90) { busy = true; for (const l of lines) { print(l); sfx.blip(); await new Promise(r => setTimeout(r, ms)) } busy = false }
  const prompt = () => cisco === 0 ? `<span class="t-p">diak@nyiltnap</span>:<span class="t-d">${cwd}</span>$` : cisco === 1 ? 'Router>' : cisco === 2 ? 'Router#' : 'Router(config)#';
  function updPrompt() { $('#t-pr').innerHTML = prompt() }
  const HELP = [
    ['help', 'ezt a listát mutatja'], ['ping google.com', 'elérhető-e egy gép?'], ['tracert youtube.com', 'milyen úton jut el a csomag?'],
    ['ipconfig', 'a gép IP-címe'], ['nslookup iskola.hu', 'név → IP-cím (DNS)'], ['ls', 'fájlok listája'], ['cat jegyzet.txt', 'fájl tartalma'],
    ['whoami', 'ki vagyok?'], ['neofetch', 'gép adatai'], ['docker run hello-world', 'konténer indítása'], ['python', 'egy kis Python'],
    ['enable', 'belépés a Cisco routerbe'], ['matrix', ''], ['hack', 'filmes hekkelés'], ['clear', 'képernyő törlése'],
  ];
  async function run(raw) {
    const line = raw.trim(); print(`${prompt()} ${esc(line)}`, 't-cmd'); if (!line) return;
    hist.push(line); hi = hist.length;
    const [c0, ...args] = line.split(/\s+/), c = c0.toLowerCase(), a = args.join(' ');
    if (cisco) return runCisco(c, line);
    switch (c) {
      case 'help': case 'sugo': case 'súgó': case '?':
        print('Kipróbálható parancsok (kattintással is!):'); print(HELP.map(([k, d]) => `  <span class="t-k">${k.padEnd(24)}</span> ${d}`).join('\n'), 't-pre'); break;
      case 'ping': {
        const h = args[0] || 'google.com', ip = resolve(h);
        if (!ip) { print(`ping: ${esc(h)}: Ismeretlen gépnév`, 't-err'); break }
        print(`PING ${esc(h)} (${ip}): 56 adatbájt`);
        const L = []; let s = 0; for (let i = 1; i <= 4; i++) { const t = (Math.random() * 20 + 8).toFixed(1); s += +t; L.push(`64 bájt innen: ${ip}: icmp_seq=${i} ttl=${rnd(52, 118)} idő=${t} ms`) }
        L.push(`--- ${esc(h)} ping statisztika ---`, `4 csomag elküldve, 4 megérkezett, <span class="t-ok">0% csomagvesztés</span>, átlag ${(s / 4).toFixed(1)} ms`);
        await slow(L, 450); break;
      }
      case 'tracert': case 'traceroute': {
        const h = args[0] || 'youtube.com', ip = resolve(h); if (!ip) { print('Ismeretlen cél', 't-err'); break }
        print(`Útvonal követése: ${esc(h)} [${ip}], legfeljebb 30 ugrás:`);
        const hops = ['192.168.1.1  (otthoni router)', '10.12.0.1  (szolgáltató – helyi központ)', '84.2.44.1  (Budapest gerinchálózat)', '195.111.97.110  (BIX – Budapesti internetcsomópont)', '80.81.192.1  (Bécs)', '72.14.218.20  (Frankfurt)', `${ip}  (${esc(h)})`];
        await slow(hops.map((x, i) => `  ${String(i + 1).padStart(2)}   ${rnd(1, 9 + i * 4)} ms   ${rnd(1, 9 + i * 4)} ms   ${rnd(1, 9 + i * 4)} ms   ${x}`), 380);
        print('Az útvonal követése befejeződött. Minden sor egy <b>router</b>, amin a csomag átment!', 't-ok'); break;
      }
      case 'ipconfig': case 'ifconfig': case 'ip':
        await slow(['Ethernet-adapter Ethernet:', '   IPv4-cím . . . . . . . . . : <b>192.168.1.23</b>', '   Alhálózati maszk . . . . . : 255.255.255.0', '   Alapértelmezett átjáró . . : 192.168.1.1', '   IPv6-cím . . . . . . . . . : 2001:db8:acad:1::23', '   DNS-kiszolgáló . . . . . . : 192.168.1.1'], 60); break;
      case 'nslookup': case 'dig': case 'host': {
        const h = args[0] || 'iskola.hu', ip = resolve(h); if (!ip) { print('*** A kiszolgáló nem találja: ' + esc(h), 't-err'); break }
        await slow(['Kiszolgáló:  dns.nyiltnap.lan', 'Address:  192.168.1.1', '', `Név:    ${esc(h)}`, `Address:  <b>${ip}</b>`, '<span class="t-ok">A DNS olyan, mint egy telefonkönyv: névből IP-címet csinál.</span>'], 80); break;
      }
      case 'ls': case 'dir': print(Object.keys(FILES).map(f => f === 'titok.txt' ? `<span class="t-err">${f}</span>` : f).join('    ') + '    <span class="t-d">dokumentumok/</span>'); break;
      case 'cat': case 'type': {
        const f = args[0]; if (!f) { print('Melyik fájlt? pl.: cat jegyzet.txt', 't-err'); break }
        if (f === 'titok.txt') { print('cat: titok.txt: <b>Hozzáférés megtagadva</b> (ehhez rendszergazdai jog kell… próbáld: sudo cat titok.txt)', 't-err'); break }
        if (FILES[f] !== undefined) print(esc(FILES[f]), 't-pre'); else print(`cat: ${esc(f)}: Nincs ilyen fájl`, 't-err'); break;
      }
      case 'sudo': {
        if (a === 'cat titok.txt' || a === 'type titok.txt') {
          print('[sudo] diak jelszava: ********'); await slow(['…', '<span class="t-ok">Rendszergazdai jog megadva</span>'], 500);
          print(`<div class="t-secret">GRATULÁLOK, MEGTALÁLTAD A TITKOS FÁJLT! <br>Mutasd meg ezt a képernyőt a tanárnak!<br><b>Titkos kód: NYILT-${new Date().getFullYear()}</b></div>`);
          sfx.win(); FX.confetti();
        } else if (/make me a sandwich/.test(a)) print('Rendben. ', 't-ok');
        else if (/rm -rf/.test(a)) print('Szép próbálkozás Ezt a parancsot SOHA ne futtasd igazi gépen: mindent letöröl!', 't-err');
        else print('sudo: rendszergazdaként futtat egy parancsot. Próbáld: sudo cat titok.txt'); break;
      }
      case 'rm': print('Hoppá! Itt nem törlünk semmit.', 't-err'); break;
      case 'cd': cwd = args[0] && args[0] !== '~' ? '~/' + args[0].replace(/\/$/, '') : '~'; updPrompt(); break;
      case 'pwd': print('/home/diak' + cwd.slice(1)); break;
      case 'whoami': print('diak – de hamarosan <b>rendszergazda</b> '); break;
      case 'date': print(new Date().toLocaleString('hu-HU')); break;
      case 'echo': print(esc(a)); break;
      case 'neofetch':
        print(`<span class="t-k">      .--.      </span>  <b>diak@nyiltnap</b>
<span class="t-k">     |o_o |     </span>  --------------
<span class="t-k">     |:_/ |     </span>  OS: Linux (Ubuntu Server)
<span class="t-k">    //   \\ \\    </span>  Kernel: 6.8.0
<span class="t-k">   (|     | )   </span>  CPU: 8 mag, virtualizáció: 
<span class="t-k">  /'\\_   _/\`\\   </span>  RAM: 16 GB  •  Lemez: 512 GB SSD
<span class="t-k">  \\___)=(___/   </span>  Hálózat: 192.168.1.23 / 24  •  Futó konténerek: 3`, 't-pre'); break;
      case 'docker':
        if (/run/.test(a)) await slow(['Unable to find image \'hello-world:latest\' locally', 'latest: Pulling from library/hello-world', 'Pull complete ', '', '<b>Hello from Docker!</b>', 'Ez az üzenet egy <span class="t-ok">konténerből</span> jön: egy kis, elszigetelt programcsomagból,', 'ami másodpercek alatt elindul bármelyik szerveren. A felhő így működik! '], 260);
        else if (/ps/.test(a)) print('CONTAINER ID   IMAGE     STATUS        NAMES\n3f2a1b9c       nginx     Up 2 hours    weboldal\n8c1d77e0       mysql     Up 2 hours    adatbazis\n91aa02ff       python    Up 5 mins     robot-api', 't-pre');
        else print('Próbáld: docker run hello-world  vagy  docker ps'); break;
      case 'python': case 'python3':
        print('Python 3.12 – írj egy sort, pl.: <b>print("Szia!")</b> vagy <b>2**100</b>'); $('#t-in').dataset.py = '1'; break;
      case 'matrix': startMatrix(); break;
      case 'hack': await hack(); break;
      case 'enable': case 'ssh': case 'telnet':
        if (c === 'telnet') { print('Telnet? Titkosítatlan! A jelszavad lehallgatható. Használj inkább SSH-t: ssh admin@router', 't-err'); break }
        print('Csatlakozás a Cisco routerhez… <span class="t-ok">kapcsolódva</span> (Cisco IOS)'); cisco = 1; updPrompt(); print('Írd be: <b>enable</b>, majd <b>show ip route</b>, <b>show vlan</b> vagy <b>exit</b>'); break;
      case 'clear': case 'cls': out.innerHTML = ''; break;
      case 'exit': print('Ide nem lehet kilépni… itt maradsz velünk! '); break;
      case 'cowsay': print(` ${'_'.repeat(a.length + 2)}\n< ${esc(a || 'Mú!')} >\n ${'-'.repeat(a.length + 2)}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`, 't-pre'); break;
      default:
        if ($('#t-in').dataset.py) return py(line);
        print(`${esc(c0)}: parancs nem található. Írd be: <b>help</b>`, 't-err');
    }
  }
  function py(line) {
    const m = line.match(/^print\((["'])(.*)\1\)$/);
    if (m) return print(esc(m[2]));
    if (/^\s*\d+\s*\*\*\s*\d+\s*$/.test(line)) { const [x, y] = line.split('**').map(s => BigInt(s.trim())); if (y < 2000n) return print((x ** y).toString(), 't-ok') }
    if (/^[\d\s+\-*/().]+$/.test(line)) { try { return print(String(calc(line)), 't-ok') } catch (e) { } }
    if (line === 'exit()' || line === 'quit()') { delete $('#t-in').dataset.py; return print('Kilépés a Pythonból.') }
    print('Ezt a mini-Python nem érti Próbáld: print("Szia") vagy 2**100. Kilépés: exit()', 't-err');
  }
  function calc(s) { // kis kifejezés-kiértékelő (eval nélkül)
    const t = s.match(/\d+(\.\d+)?|[()+\-*/]/g); let i = 0;
    const num = () => { const k = t[i++]; if (k === '(') { const v = add(); i++; return v } if (k === '-') return -num(); const v = parseFloat(k); if (isNaN(v)) throw 0; return v };
    const mul = () => { let v = num(); while (t[i] === '*' || t[i] === '/') { const o = t[i++], w = num(); v = o === '*' ? v * w : v / w } return v };
    const add = () => { let v = mul(); while (t[i] === '+' || t[i] === '-') { const o = t[i++], w = mul(); v = o === '+' ? v + w : v - w } return v };
    const v = add(); if (i !== t.length) throw 0; return Math.round(v * 1e9) / 1e9;
  }
  async function runCisco(c, line) {
    const l = line.toLowerCase();
    if (l === 'exit' || l === 'end' || l === 'logout') { cisco = cisco === 3 ? 2 : 0; updPrompt(); if (!cisco) print('Kapcsolat bontva.'); return }
    if (l === 'enable' || l === 'en') { cisco = 2; updPrompt(); return }
    if (/^conf(igure)? t(erminal)?$/.test(l)) { if (cisco < 2) return print('% Előbb: enable', 't-err'); cisco = 3; updPrompt(); return print('Konfigurációs mód. Pl.: hostname IskolaRouter') }
    if (l.startsWith('hostname') && cisco === 3) return print('Átnevezve (a valóságban így konfiguráljuk a routereket!)', 't-ok');
    if (/^sh(ow)? ip ro/.test(l)) return slow(['Codes: C - közvetlenül csatlakozó, S - statikus, O - OSPF', '', 'Gateway of last resort is 84.2.44.1 to network 0.0.0.0', '', 'S*    0.0.0.0/0 [1/0] via 84.2.44.1', 'C     192.168.10.0/24 is directly connected, GigabitEthernet0/0.10', 'C     192.168.20.0/24 is directly connected, GigabitEthernet0/0.20', 'O     10.0.0.0/8 [110/2] via 172.16.1.2, Serial0/1/0', '<span class="t-ok">Ez a router útvonaltáblája – ebből tudja, merre küldje a csomagokat.</span>'], 70);
    if (/^sh(ow)? vlan/.test(l)) return slow(['VLAN Név          Állapot   Portok', '---- ------------ --------- ----------------', '10   Diakok       active    Fa0/1-12', '20   Tanarok      active    Fa0/13-20', '30   Vendeg       active    Fa0/21-24'], 70);
    if (/^sh(ow)? run/.test(l)) return slow(['hostname IskolaRouter', 'enable secret 5 $1$mERr$hx5rVt7rPNoS4wqbXKX7m0', 'interface GigabitEthernet0/0', ' ip address 192.168.1.1 255.255.255.0', 'ip route 0.0.0.0 0.0.0.0 84.2.44.1', 'line vty 0 4', ' transport input ssh'], 60);
    if (l === '?' || l === 'help') return print('show ip route • show vlan • show running-config • configure terminal • exit');
    print('% Ismeretlen parancs. Próbáld: show ip route', 't-err');
  }
  async function hack() {
    busy = true; const box = $('#t-box'); box.classList.add('hack');
    const words = ['BYPASS FIREWALL', 'DECRYPT RSA-4096', 'INJECT PAYLOAD', 'TRACE IP', 'DOWNLOAD MAINFRAME', 'OVERRIDE PROXY', 'COMPILE EXPLOIT'];
    for (let i = 0; i < 40; i++) {
      print(`<span class="t-ok">${Array.from({ length: 6 }, () => rnd(0, 0xffff).toString(16).padStart(4, '0')).join(' ')}  ${pick(words)}... ${rnd(10, 99)}%</span>`);
      sfx.blip(); await new Promise(r => setTimeout(r, 45));
    }
    print('<div class="t-secret" style="border-color:var(--green);color:var(--green)">ACCESS GRANTED </div>'); sfx.win();
    print('Ez csak filmes effekt! A valódi informatikusok nem így dolgoznak… de a <b>védekezést</b> nagyon is tanuljuk!', 't-err');
    box.classList.remove('hack'); busy = false;
  }
  function startMatrix() {
    const cv = $('#t-mx'); cv.style.display = 'block'; const c = cv.getContext('2d');
    cv.width = cv.clientWidth; cv.height = cv.clientHeight; const cols = Math.floor(cv.width / 16), y = Array(cols).fill(0).map(() => rnd(-40, 0));
    clearInterval(matrix);
    matrix = setInterval(() => {
      c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = '#4ade80'; c.font = '16px monospace';
      y.forEach((v, i) => { c.fillText(String.fromCharCode(0x30A0 + rnd(0, 95)), i * 16, v * 16); y[i] = v * 16 > cv.height && Math.random() > .97 ? 0 : v + 1 });
    }, 40);
    print('Matrix mód: kattints a képernyőre a kilépéshez.', 't-ok');
  }
  S.build = root => {
    root.innerHTML = `<style>
      #t-box{position:absolute;inset:14px 14px 92px 14px;background:#08090b;border:2px solid #1d3b2b;border-radius:14px;box-shadow:0 0 40px #4ade8022, inset 0 0 80px #4ade800a;overflow:hidden;display:flex;flex-direction:column;font-family:var(--mono)}
      #t-box.hack{border-color:var(--green);box-shadow:0 0 60px #4ade8088}
      #t-bar{background:#0b1a12;padding:6px 12px;font-size:13px;color:#7fd8a0;display:flex;gap:8px;align-items:center}
      #t-bar i{width:12px;height:12px;border-radius:50%;display:inline-block}
      #t-out{flex:1;overflow:auto;padding:12px 16px;font-size:18px;line-height:1.45;color:#d1fae5;white-space:pre-wrap;word-break:break-word}
      #t-line{display:flex;gap:10px;padding:8px 16px 14px;font-size:20px;color:#d1fae5}
      #t-in{flex:1;background:transparent;border:none;color:#fff;font:inherit;outline:none;caret-color:#4ade80}
      .t-p{color:#4ade80;font-weight:700}.t-d{color:#60a5fa;font-weight:700}.t-cmd{color:#fff}.t-err{color:#ff7b7b}.t-ok{color:#4ade80}.t-k{color:#fbbf24}.t-pre{white-space:pre}
      .t-secret{border:3px dashed var(--yellow);color:var(--yellow);font-size:26px;text-align:center;padding:16px;margin:10px 0;border-radius:12px;font-family:"Segoe UI",sans-serif;font-weight:800}
      #t-mx{position:absolute;inset:0;width:100%;height:100%;display:none;z-index:5;background:#000;cursor:pointer}
      #t-chips{position:absolute;left:14px;right:14px;bottom:14px;display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
      #t-chips .btn{font-family:var(--mono);font-size:15px;padding:6px 10px;min-height:36px}
    </style>
    <div id="t-box"><div id="t-bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i>&nbsp; diak@nyiltnap – terminál</div>
      <div id="t-out"></div><div id="t-line"><span id="t-pr"></span><input id="t-in" autocomplete="off" spellcheck="false" autocapitalize="off"></div><canvas id="t-mx"></canvas></div>
    <div id="t-chips">${['help', 'ping google.com', 'tracert youtube.com', 'ipconfig', 'nslookup iskola.hu', 'ls', 'cat titok.txt', 'neofetch', 'docker run hello-world', 'enable', 'matrix', 'hack'].map(c => `<button class="btn">${c}</button>`).join('')}</div>`;
    out = $('#t-out'); inp = $('#t-in'); updPrompt();
    print('<b style="color:#4ade80">Üdv a terminálban! </b> Itt <b>parancsokkal</b> irányítjuk a gépet – ahogy a rendszergazdák is.');
    print('Írd be: <span class="t-k">help</span> és nyomj Entert. Küldetés: találd meg a <span class="t-err">titkos fájlt</span>!');
    inp.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Enter' && !busy) { const v = inp.value; inp.value = ''; run(v) }
      if (e.key === 'ArrowUp' && hi > 0) { inp.value = hist[--hi]; e.preventDefault() }
      if (e.key === 'ArrowDown') { inp.value = hi < hist.length - 1 ? hist[++hi] : (hi = hist.length, ''); e.preventDefault() }
    });
    $('#t-box').onclick = () => inp.focus();
    $('#t-mx').onclick = e => { e.stopPropagation(); clearInterval(matrix); $('#t-mx').style.display = 'none'; inp.focus() };
    $$('#t-chips .btn', root).forEach(b => b.onclick = () => { if (!busy) { run(b.textContent); inp.focus() } });
  };
  S.enter = () => setTimeout(() => inp.focus(), 50);
  S.leave = () => { clearInterval(matrix); $('#t-mx').style.display = 'none' };
  return S;
})());
