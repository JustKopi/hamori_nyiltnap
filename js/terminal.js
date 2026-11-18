/* ===== 7. Hacker-terminál: Linux / Windows / Cisco parancssor ===== */
App.add((() => {
  const S = {
    id: 'terminal', icon: '', title: 'Parancssor-kaland', color: '#4ade80',
    desc: 'Hajnali kettő, csörög a telefon: a cégnél semmi nem működik! Mentsd meg igazi parancsokkal – vagy kísérletezz szabadon.',
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
    if (ST.on && await storyCmd(c, args, line)) return;
    if (CT.on && await ctfCmd(c, args, line)) return;
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
      case 'hack': case 'kodfejto': case 'kódfejtő': startCtf(); break;
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
  /* ---- Történet: Éjszakai riasztás a Holdfény Kft.-nél ---- */
  const ATT = '203.0.113.66';
  const ST = { on: false, step: 0, t: 0, hints: 0, gw: false, dns: false, blocked: false, disk: false, nginx: false, backup: false, saw: {}, race: false };
  const MS = [
    { who: 'Kovács úr, a főnök', ic: 'phone', kind: 'Bejövő hívás, 02:14', msg: '„Elnézést, hogy felébresztem! Holnap reggel nagy bemutatónk lesz, de az irodában <b>semmi nem megy az interneten</b>! Megnézné távolról?”', goal: 'Derítsd ki, mi a baj: próbáld ki, eléred-e a netet, és nézd meg a gép hálózati beállításait!', hint: ['ping google.com', 'ipconfig'], ok: () => ST.saw.ping && ST.saw.ipconfig },
    { who: 'Te', ic: 'search', kind: 'Hibakeresés', msg: 'Az <b>alapértelmezett átjáró</b> üres! A gép nem tudja, merre küldje a csomagokat a helyi hálózaton kívülre. Az irodai router címe: <b>192.168.1.1</b>.', goal: 'Állítsd be az alapértelmezett átjárót a routerre (192.168.1.1)!', hint: ['ip route add default via 192.168.1.1'], ok: () => ST.gw },
    { who: 'Kovács úr', ic: 'mail', kind: 'Chat, 02:21', msg: '„A pingelés már megy, de a <b>weboldalak még mindig nem jönnek be</b>. Azt írja: nem található a kiszolgáló.”', goal: 'IP-címre megy, névre nem: a DNS a hibás. Nézd meg a DNS-beállítást, és állíts be egy működő DNS-szervert (pl. 8.8.8.8)!', hint: ['ping 8.8.8.8', 'cat /etc/resolv.conf', 'echo "nameserver 8.8.8.8" > /etc/resolv.conf'], ok: () => ST.dns },
    { who: 'Biztonsági rendszer', ic: 'siren', kind: 'RIASZTÁS, 02:29', msg: '<b>Szokatlanul sok sikertelen bejelentkezés</b> a szerveren az elmúlt órában! Valaki jelszavakat próbálgat.', goal: 'Nézd meg a bejelentkezési naplót, keresd meg a támadó IP-címét, és tiltsd ki a tűzfalon!', hint: ['tail /var/log/auth.log', `ufw deny from ${ATT}`], ok: () => ST.blocked },
    { who: 'Monitorozó rendszer', ic: 'activity', kind: 'Riasztás, 02:36', msg: 'A cég weboldala (holdfeny.hu) <b>nem válaszol</b>. A webszerver (nginx) leállt.', goal: 'Derítsd ki, miért állt le a webszerver, hárítsd el az okát, és indítsd újra!', hint: ['systemctl status nginx', 'df -h', 'du -sh /var/log/*', 'rm /var/log/hatalmas.log', 'systemctl restart nginx'], ok: () => ST.nginx },
    { who: 'Kovács úr', ic: 'mail', kind: 'Chat, 02:47', msg: '„Minden megy! Hihetetlen! Csak nehogy újra baj legyen… Van <b>mentés</b> a weboldalról?”', goal: 'Készíts mentést a weboldal fájljairól (/var/www) egy tömörített archívumba!', hint: ['tar -czf mentes.tar.gz /var/www'], ok: () => ST.backup }
  ];
  function storyPanel() {
    const el = $('#t-story'); if (!el) return;
    if (CT.on) return ctfPanel(el);
    if (!ST.on) { el.innerHTML = `<div class="ts-k">Küldetés</div><h3>Éjszakai riasztás</h3><p>Hajnali kettő. Te vagy a Holdfény Kft. ügyeletes rendszergazdája, és megszólal a telefon… Hat valódi hibát kell elhárítanod <b>valódi parancsokkal</b>.</p><button class="btn go" id="ts-go">Küldetés indítása</button><div class="ts-k" style="margin-top:18px">Másik kihívás</div><h3>Kódfejtő</h3><p>Egy titkos szerver jelszava 4 darabban, négyféleképpen elrejtve: Caesar-rejtjel, Base64, bináris és hexadecimális. Fejtsd meg igazi parancsokkal!</p><button class="btn" id="ts-ctf">${icon('lock', 16)} Kódfejtő kihívás</button><p class="ts-s">Vagy gépelj szabadon: <b>help</b></p>`; $('#ts-go').onclick = () => startStory(false); $('#ts-ctf').onclick = () => { startCtf(); inp.focus() }; return }
    if (ST.step >= MS.length) { el.innerHTML = `<div class="ts-k">Küldetés teljesítve</div><h3>A Holdfény Kft. megmenekült!</h3><p>Idő: <b>${Math.floor(ST.t / 60)} perc ${Math.round(ST.t % 60)} mp</b> • tippek: ${ST.hints}</p><div class="learn" style="margin-top:6px">Ma éjjel ezt csináltad: <b>hálózati hibakeresés</b> (ping, ipconfig), <b>útválasztás</b> (átjáró), <b>névfeloldás</b> (DNS), <b>naplóelemzés és tűzfal</b>, <b>szolgáltatás-üzemeltetés</b> (systemctl, lemezterület) és <b>mentés</b>. Pontosan ezt tanulja egy rendszerüzemeltető!</div><button class="btn go" id="ts-go">Újrakezdés</button>`; $('#ts-go').onclick = () => startStory(false); return }
    const m = MS[ST.step];
    el.innerHTML = `<div class="ts-prog">${MS.map((_, i) => `<i class="${i < ST.step ? 'd' : i === ST.step ? 'c' : ''}"></i>`).join('')}</div>
      <div class="ts-msg"><span class="ts-av">${icon(m.ic, 22)}</span><div><div class="ts-who">${m.who}</div><div class="ts-kind">${m.kind}</div></div></div>
      <p class="ts-txt">${m.msg}</p><div class="ts-goal"><b>Feladat:</b> ${m.goal}</div>
      <div id="ts-hint"></div><button class="btn" id="ts-h">${icon('bulb', 16)} Tipp${ST.race ? ' (−100 pont)' : ''}</button>
      ${ST.race ? `<div class="ts-time" id="ts-time"></div>` : ''}`;
    $('#ts-h').onclick = () => { ST.hints++; $('#ts-hint').innerHTML = m.hint.map(h => `<button class="btn ts-c">${esc(h)}</button>`).join(''); $$('.ts-c').forEach(b => b.onclick = () => { if (!busy) { run(b.textContent).then(storyCheck); inp.focus() } }); $('#ts-h').style.display = 'none' };
  }
  function startStory(race) {
    Object.assign(ST, { on: true, step: 0, t: 0, hints: 0, gw: false, dns: false, blocked: false, disk: false, nginx: false, backup: false, saw: {}, race });
    out.innerHTML = ''; cisco = 0; cwd = '~'; updPrompt();
    print(`<div class="t-story">${icon('phone', 18)} BRRR… BRRR… <b>Bejövő hívás: Kovács úr</b></div>`); ring();
    storyPanel(); inp.focus();
  }
  function ring() { [0, .25, 1, 1.25].forEach(d => beep(880, .18, 'sine', .05, 0, d)) }
  function storyCheck() {
    if (!ST.on || ST.step >= MS.length) return;
    if (MS[ST.step].ok()) {
      ST.step++; sfx.win();
      print(`<div class="t-story ok">${icon('check', 18, 2.4)} Feladat teljesítve! ${ST.step < MS.length ? 'Új esemény érkezett…' : ''}</div>`);
      if (ST.step < MS.length) { const m = MS[ST.step]; setTimeout(() => { print(`<div class="t-story">${icon(m.ic, 18)} <b>${m.kind}</b> – ${m.who}</div>`); if (m.ic === 'siren') beep(600, .4, 'sawtooth', .05); else ring() }, 600) }
      else { FX.confetti(); finishStory() }
      storyPanel();
    }
  }
  let best = 0;
  function finishStory() {
    const sc = Math.max(100, Math.round(2400 - ST.t * 4 - ST.hints * 100)); best = Math.max(best, sc);
    if (ST.race) { ST.race = false; Comp.finish(sc, `6 feladat ${Math.floor(ST.t / 60)} perc ${Math.round(ST.t % 60)} mp alatt, ${ST.hints} tipp`) }
  }
  async function storyCmd(c, args, line) {
    const l = line.trim(), a = args.join(' ');
    if (c === 'ping') {
      const h = args[0] || 'google.com'; ST.saw.ping = true;
      if (!ST.gw && !/^192\.168\.1\./.test(h)) { print(`ping: connect: <b>A hálózat nem érhető el</b> (Network is unreachable)`, 't-err'); storyCheck(); return true }
      if (!ST.dns && !/^\d+\.\d+\.\d+\.\d+$/.test(h)) { print(`ping: ${esc(h)}: <b>Ismeretlen gépnév</b> (a névfeloldás nem működik)`, 't-err'); return true }
      if (h === ATT && ST.blocked) { print('ping: a tűzfal blokkolja ezt a címet.', 't-err'); return true }
      return false;
    }
    if (['ipconfig', 'ifconfig', 'ip'].includes(c) && !/route/.test(a)) {
      ST.saw.ipconfig = true;
      await slow(['Ethernet-adapter Ethernet:', '   IPv4-cím . . . . . . . . . : <b>192.168.1.23</b>', '   Alhálózati maszk . . . . . : 255.255.255.0', `   Alapértelmezett átjáró . . : ${ST.gw ? '192.168.1.1' : '<span class="t-err">(nincs beállítva)</span>'}`, `   DNS-kiszolgáló . . . . . . : ${ST.dns ? '8.8.8.8' : '<span class="t-err">(nincs)</span>'}`], 60);
      storyCheck(); return true;
    }
    let m;
    if ((m = l.match(/^(?:sudo\s+)?(?:ip\s+route\s+add\s+default\s+via|route\s+add\s+default\s+(?:gw\s+)?|route\s+add\s+0\.0\.0\.0\s+mask\s+0\.0\.0\.0)\s*(\S+)/i))) {
      if (m[1] !== '192.168.1.1') { print(`Hiba: a(z) ${esc(m[1])} nem a router címe. Az átjáró az irodai router: 192.168.1.1`, 't-err'); return true }
      ST.gw = true; print('Alapértelmezett útvonal hozzáadva: 0.0.0.0/0 → 192.168.1.1', 't-ok'); print('Próbáld ki most: <b>ping google.com</b>'); storyCheck(); return true;
    }
    if (/^(cat|type|more|less)\s+\/etc\/resolv\.conf/.test(l)) { print(ST.dns ? 'nameserver 8.8.8.8' : '# DNS-kiszolgáló:\nnameserver <span class="t-err">0.0.0.0</span>   ← ez nem valódi szerver!', 't-pre'); return true }
    if ((m = l.match(/nameserver\s+(\d+\.\d+\.\d+\.\d+).*>\s*\/etc\/resolv\.conf/))) {
      if (m[1] === '0.0.0.0') { print('Ez ugyanaz a hibás cím.', 't-err'); return true }
      ST.dns = true; print(`DNS-kiszolgáló beállítva: ${m[1]}`, 't-ok'); print('Próbáld: <b>ping google.com</b> vagy <b>nslookup holdfeny.hu</b>'); storyCheck(); return true;
    }
    if (/^(sudo\s+)?(tail|cat|less|grep.*)\s*.*\/var\/log\/auth\.log/.test(l)) {
      const L = []; for (let i = 0; i < 7; i++) L.push(`Nov 18 02:${String(20 + i).padStart(2, '0')}:${rnd(10, 59)} holdfeny sshd: <span class="t-err">Failed password for admin from ${ATT}</span> port ${rnd(40000, 60000)}`);
      L.splice(3, 0, `Nov 18 02:22:41 holdfeny sshd: Accepted publickey for rendszergazda from 192.168.1.23 (ez te vagy)`);
      await slow(L, 70); print('Melyik IP-címről jönnek a sikertelen próbálkozások? Azt kell kitiltani: <b>ufw deny from &lt;IP&gt;</b>', 't-k'); return true;
    }
    if ((m = l.match(/^(?:sudo\s+)?ufw\s+deny\s+from\s+(\S+)/))) {
      if (m[1] === '192.168.1.23') { print('Hoppá! Ez a saját géped címe – kizárnád magad!', 't-err'); return true }
      if (m[1] !== ATT) { print(`Szabály hozzáadva: ${esc(m[1])} tiltva. De a támadások továbbra is jönnek… biztos ez a jó cím?`, 't-err'); return true }
      ST.blocked = true; print(`Szabály hozzáadva: <b>${ATT}</b> minden forgalma tiltva.`, 't-ok'); print('A támadó próbálkozásai megszűntek. Tipp: a valóságban erős jelszó és kulcsos belépés is kell!'); storyCheck(); return true;
    }
    if (/^(sudo\s+)?systemctl\s+status\s+nginx/.test(l)) { await slow(ST.nginx ? ['● nginx.service – webszerver', '   Active: <span class="t-ok">active (running)</span>'] : ['● nginx.service – webszerver', '   Active: <span class="t-err">failed</span>', '   nginx: [emerg] write() failed: <b>No space left on device</b> (nincs hely a lemezen)'], 80); return true }
    if (/^df(\s|$)/.test(l)) { await slow(['Fájlrendszer   Méret  Fogl.  Szabad  Fogl%  Csatolási pont', `/dev/sda1       50G   ${ST.disk ? '3,1G   47G     6%' : '<span class="t-err">50G    0     100%</span>'}  /`], 80); return true }
    if (/^du\s/.test(l) && /\/var\/log/.test(l)) { await slow(['12K    /var/log/auth.log', '4,0K   /var/log/boot.log', ST.disk ? '' : '<span class="t-err">47G    /var/log/hatalmas.log</span>   ← egy elszabadult program teleírta a lemezt!', '88K    /var/log/syslog'].filter(Boolean), 80); return true }
    if (/^(sudo\s+)?(rm|truncate.*)\s+.*\/var\/log\/hatalmas\.log/.test(l)) { if (ST.disk) { print('Ez a fájl már nincs meg.'); return true } ST.disk = true; print('hatalmas.log törölve, felszabadult <b>47 GB</b>.', 't-ok'); print('A naplóbejegyzéseket a valóságban <b>logrotate</b> forgatja, hogy ez ne fordulhasson elő.'); return true }
    if (/^(sudo\s+)?systemctl\s+(re)?start\s+nginx/.test(l)) { if (!ST.disk) { print('Job for nginx.service failed: No space left on device. Előbb szabadíts fel helyet!', 't-err'); return true } ST.nginx = true; print('nginx.service elindítva. <span class="t-ok">active (running)</span>', 't-ok'); print('Próbáld: <b>curl holdfeny.hu</b>'); storyCheck(); return true }
    if (/^curl\s/.test(l)) { if (!ST.gw || !ST.dns) { print('curl: (6) Could not resolve host', 't-err'); return true } print(ST.nginx || !/holdfeny/.test(l) ? '&lt;html&gt;&lt;h1&gt;Holdfény Kft. – Üdvözöljük!&lt;/h1&gt;&lt;/html&gt;' : 'curl: (7) Failed to connect: Connection refused', ST.nginx ? 't-ok' : 't-err'); return true }
    if (/^tar\s+.*-?c.*\.tar(\.gz)?\s+\/var\/www/.test(l)) { if (ST.backup) { print('A mentés már elkészült.'); return true } await slow(['var/www/index.html', 'var/www/css/stilus.css', 'var/www/kepek/logo.png', '<span class="t-ok">mentes.tar.gz elkészült (14 MB)</span>'], 200); ST.backup = true; storyCheck(); return true }
    if (c === 'nslookup' && !ST.dns) { print(';; connection timed out; no servers could be reached (nincs DNS-kiszolgáló)', 't-err'); return true }
    if (c === 'rm') { print('Itt csak az elszabadult naplófájlt szabad törölni: /var/log/hatalmas.log', 't-err'); return true }
    return false;
  }
  /* ---- Kódfejtő kihívás: kódolás és titkosítás valódi parancsokkal ---- */
  const rot13 = s => s.replace(/[a-z]/gi, ch => { const b = ch <= 'Z' ? 65 : 97; return String.fromCharCode((ch.charCodeAt(0) - b + 13) % 26 + b) });
  const caesar = (s, k) => s.replace(/[a-z]/gi, ch => { const b = ch <= 'Z' ? 65 : 97; return String.fromCharCode(((ch.charCodeAt(0) - b - k) % 26 + 26) % 26 + b) });
  const PARTS = ['KOD', 'HALOZAT', 'SZERVER', 'VEDELEM'];
  const CF = {
    'uzenet.txt': rot13(`Szia, kodfejto! Az elso jelszoresz: ${PARTS[0]}. A kovetkezo nyom a kulcs.b64 fajlban van.`),
    'kulcs.b64': btoa(`A masodik resz: ${PARTS[1]}. A harmadik a binaris.txt fajlban rejtozik.`),
    'binaris.txt': [...PARTS[2]].map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' '),
    'hex.txt': [...PARTS[3]].map(c => c.charCodeAt(0).toString(16)).join(''),
    'olvassel.txt': 'KÓDFEJTŐ KIHÍVÁS\n4 fájlban 4 jelszórész rejtőzik. Fejtsd meg őket sorban, aztán:\n  unlock RESZ1-RESZ2-RESZ3-RESZ4\nSegítség: tipp'
  };
  const CTS = [
    { f: 'uzenet.txt', n: 'Caesar-rejtjel (ROT13)', tip: ['cat uzenet.txt', 'rot13 uzenet.txt'], learn: 'A <b>Caesar-rejtjel</b> minden betűt eltol az ábécében (itt 13-mal). Kétezer éves módszer – ma pillanatok alatt feltörhető, mert csak 25 féle eltolás van.' },
    { f: 'kulcs.b64', n: 'Base64-kódolás', tip: ['cat kulcs.b64', 'base64 -d kulcs.b64'], learn: 'A <b>Base64</b> nem titkosítás, csak <b>kódolás</b>: bárki visszaalakíthatja, kulcs nélkül. E-mail-mellékleteknél és weboldalaknál használják.' },
    { f: 'binaris.txt', n: 'Bináris számok', tip: ['cat binaris.txt', 'bin2txt binaris.txt'], learn: 'A számítógép mindent <b>0-k és 1-esek</b> formájában tárol. Egy betű 8 bit (1 bájt): az „S” betű például 01010011 (= 83).' },
    { f: 'hex.txt', n: 'Hexadecimális', tip: ['cat hex.txt', 'xxd -r -p hex.txt'], learn: 'A <b>hexadecimális</b> (16-os) számrendszerben 2 jegy = 1 bájt. MAC-címek, színkódok (#ff0000) és memóriacímek is így néznek ki.' }
  ];
  const CT = { on: false, step: 0, found: [], t: 0, hints: 0 };
  function startCtf() {
    Object.assign(CT, { on: true, step: 0, found: [], t: 0, hints: 0 }); ST.on = false; out.innerHTML = '';
    print('<div class="t-story">' + icon('lock', 18) + ' <b>KÓDFEJTŐ KIHÍVÁS</b> – egy titkos szerver jelszava 4 darabban, 4 különböző módon elrejtve.</div>');
    print('Kezdd így: <span class="t-k">ls</span>, majd <span class="t-k">cat olvassel.txt</span>'); storyPanel(); beep(300, .2, 'sawtooth', .04); beep(600, .2, 'sawtooth', .04, 0, .15);
  }
  // „kirajzolódó” megfejtés: véletlen jelekből áll össze a szöveg
  async function reveal(txt, cls = 't-ok') {
    busy = true; const d = document.createElement('div'); d.className = cls + ' t-rev'; out.appendChild(d); const pool = '01#$%&@ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/\\';
    for (let k = 0; k <= 22; k++) { d.textContent = [...txt].map((c, i) => c === ' ' || i < txt.length * k / 22 ? c : pool[rnd(0, pool.length - 1)]).join(''); out.scrollTop = out.scrollHeight; if (k % 3 === 0) sfx.blip(); await new Promise(r => setTimeout(r, 40)) }
    d.textContent = txt; busy = false;
  }
  async function found(i, txt) {
    await reveal(txt);
    if (!CT.found.includes(i)) { CT.found.push(i); CT.step = Math.max(CT.step, i + 1); sfx.ok(); print(`<div class="t-story ok">${icon('check', 18, 2.4)} ${i + 1}. jelszórész megtalálva: <b>${PARTS[i]}</b></div>`); print(`<div class="t-learn">${CTS[i].learn}</div>`); if (i === 2) print('Utolsó nyom: a <span class="t-k">hex.txt</span> fájl.') }
    storyPanel();
  }
  const fileArg = a => (a || '').split(/\s+/).find(x => CF[x]);
  async function ctfCmd(c, args, line) {
    const l = line.trim(), a = args.join(' '), f = fileArg(a);
    if (c === 'ls' || c === 'dir') { print(Object.keys(CF).map(k => k === 'olvassel.txt' ? `<span class="t-k">${k}</span>` : k).join('    ')); return true }
    if ((c === 'cat' || c === 'type') && f) { print(esc(CF[f]), 't-pre'); if (f !== 'olvassel.txt') print(`<span class="t-d">Ez olvashatatlan… ${f === 'uzenet.txt' ? 'Mintha a betűk el lennének tolva. (rot13 vagy caesar)' : f === 'kulcs.b64' ? 'A .b64 végződés árulkodó. (base64 -d)' : f === 'binaris.txt' ? 'Csupa 0 és 1, 8-as csoportokban. (bin2txt)' : 'Csupa 0-9 és a-f karakter. (xxd -r -p)'}</span>`); return true }
    if (c === 'rot13' || c === 'caesar') {
      let k = 13, src = a; const km = a.match(/-k\s*(\d+)/); if (km) { k = +km[1]; src = a.replace(km[0], '').trim() }
      const txt = CF[src.trim()] || src; if (!txt) { print('Használat: rot13 uzenet.txt  vagy  caesar -k 3 szöveg', 't-err'); return true }
      const dec = c === 'rot13' ? rot13(txt) : caesar(txt, k);
      if (src.trim() === 'uzenet.txt' && k === 13) { await found(0, dec); return true }
      print(esc(dec), 't-pre'); if (src.trim() === 'uzenet.txt') print(`Ez még nem értelmes. Próbálj más eltolást! (a ROT13 = 13-mal tol)`, 't-err'); return true;
    }
    if (c === 'base64') { if (!/-d|--decode/.test(a) || !f) { print('Visszafejtés: base64 -d kulcs.b64', 't-err'); return true } try { const dec = atob(CF[f]); if (f === 'kulcs.b64') { await found(1, dec); return true } print(esc(dec)) } catch (e) { print('base64: érvénytelen bemenet', 't-err') } return true }
    if (c === 'bin2txt' || c === 'binary') { if (!f) { print('Használat: bin2txt binaris.txt', 't-err'); return true } const dec = CF[f].split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join(''); if (f === 'binaris.txt') { print(CF[f].split(' ').map(b => `${b} = ${parseInt(b, 2)} = „${String.fromCharCode(parseInt(b, 2))}”`).join('\n'), 't-pre'); { await found(2, `A harmadik resz: ${dec}`); return true } } return true }
    if (c === 'xxd' || c === 'hex2txt' || c === 'unhex') { if (!f) { print('Használat: xxd -r -p hex.txt', 't-err'); return true } const dec = CF[f].match(/../g).map(h => String.fromCharCode(parseInt(h, 16))).join(''); if (f === 'hex.txt') { await found(3, `A negyedik resz: ${dec}`); return true } return true }
    if (c === 'tipp' || c === 'hint') { const s = CTS[Math.min(CT.step, 3)]; CT.hints++; if (CT.found.length === 4) print(`Írd be: <span class="t-k">unlock ${PARTS.join('-')}</span>`); else print(`Tipp: ${s.tip.map(t => `<span class="t-k">${t}</span>`).join(' , majd ')}`); return true }
    if (c === 'unlock') {
      if (a.toUpperCase() === PARTS.join('-')) { await finale(); return true }
      print('HOZZÁFÉRÉS MEGTAGADVA. ' + (CT.found.length < 4 ? `Még ${4 - CT.found.length} jelszórész hiányzik.` : 'Formátum: unlock RESZ1-RESZ2-RESZ3-RESZ4'), 't-err'); sfx.bad(); return true;
    }
    if (c === 'hack') { print('Itt nem „hekkelünk”: fejtsd meg a fájlokat! Írd be: tipp', 't-k'); return true }
    if (c === 'kilep' || c === 'exit') { CT.on = false; storyPanel(); print('Kiléptél a kihívásból.'); return true }
    return false;
  }
  async function finale() {
    busy = true; const box = $('#t-box'); box.classList.add('hack'); startMatrix();
    await new Promise(r => setTimeout(r, 1800)); clearInterval(matrix); $('#t-mx').style.display = 'none';
    print(`<pre class="t-big">█▀▀▄ ▄▀▀▄ █▀▀▄ █▀▀▄ █▀▀▄ ▄▀▀▄ ▄▀▀▄\n█▄▄▀ █▄▄█ █  █ █▄▄▀ █▄▄▀ █▄▄█ █▄▄▄\n▀    ▀  ▀ ▀  ▀ ▀ ▀▀ ▀    ▀  ▀ ▄▄▄▀</pre>`);
    await reveal('HOZZÁFÉRÉS MEGADVA – A TITKOS SZERVER NYITVA', 't-ok t-huge');
    const secs = Math.round(CT.t); print(`<div class="t-secret">Kódfejtő kihívás teljesítve!<br><small>${Math.floor(secs / 60)} perc ${secs % 60} mp • ${CT.hints} tipp</small></div>`);
    print(`<div class="t-learn"><b>Mit tanultál?</b> A <b>kódolás</b> (Base64, bináris, hex) csak más formába írja az adatot – bárki visszaalakíthatja. A <b>titkosítás</b> kulcs nélkül megfejthetetlen: a Caesar-rejtjel ennek ősi, gyenge változata, ma <b>AES</b> és <b>RSA</b> védi a banki és üzenetküldő forgalmat. A rendszergazdák ezeket naponta használják: tanúsítványok, VPN, SSH-kulcsok.</div>`);
    box.classList.remove('hack'); busy = false; sfx.win(); FX.confetti(); setTimeout(() => FX.confetti(), 500);
    CT.done = true; CT.on = false; ctfBest = Math.max(ctfBest, Math.max(100, Math.round(1500 - secs * 3 - CT.hints * 100)));
    if (CT.race) { CT.race = false; Comp.finish(Math.max(100, Math.round(1500 - secs * 3 - CT.hints * 100)), `Kódfejtő: ${Math.floor(secs / 60)} p ${secs % 60} mp, ${CT.hints} tipp`) }
    storyPanel();
  }
  let ctfBest = 0;
  function ctfPanel(el) {
    el.innerHTML = `<div class="ts-k">Kódfejtő kihívás</div><h3>Titkos szerver</h3>
      <div class="ts-prog">${CTS.map((_, i) => `<i class="${CT.found.includes(i) ? 'd' : i === CT.step ? 'c' : ''}"></i>`).join('')}</div>
      ${CTS.map((s, i) => `<div class="ts-ct ${CT.found.includes(i) ? 'ok' : ''}"><b>${i + 1}. ${s.f}</b><span>${s.n}</span><em>${CT.found.includes(i) ? PARTS[i] : '????'}</em></div>`).join('')}
      <div class="ts-goal"><b>Cél:</b> unlock ${CT.found.length ? PARTS.map((p, i) => CT.found.includes(i) ? p : '????').join('-') : '????-????-????-????'}</div>
      <button class="btn" id="ts-h">${icon('bulb', 16)} Tipp</button><div class="ts-time" id="ts-time"></div>`;
    $('#ts-h').onclick = () => { run('tipp'); inp.focus() };
  }
  S.build = root => {
    root.innerHTML = `<style>
      #t-box{position:absolute;inset:14px 360px 92px 14px;background:#08090b;border:2px solid #1d3b2b;border-radius:14px;box-shadow:0 0 40px #4ade8022, inset 0 0 80px #4ade800a;overflow:hidden;display:flex;flex-direction:column;font-family:var(--mono)}
      #t-box.hack{border-color:var(--green);box-shadow:0 0 60px #4ade8088}
      #t-bar{background:#0b1a12;padding:6px 12px;font-size:13px;color:#7fd8a0;display:flex;gap:8px;align-items:center}
      #t-bar i{width:12px;height:12px;border-radius:50%;display:inline-block}
      #t-out{flex:1;overflow:auto;padding:12px 16px;font-size:18px;line-height:1.45;color:#d1fae5;white-space:pre-wrap;word-break:break-word}
      #t-line{display:flex;gap:10px;padding:8px 16px 14px;font-size:20px;color:#d1fae5}
      #t-in{flex:1;background:transparent;border:none;color:#fff;font:inherit;outline:none;caret-color:#4ade80}
      .t-p{color:#4ade80;font-weight:700}.t-d{color:#60a5fa;font-weight:700}.t-cmd{color:#fff}.t-err{color:#ff7b7b}.t-ok{color:#4ade80}.t-k{color:#fbbf24}.t-pre{white-space:pre}
      .t-secret{border:3px dashed var(--yellow);color:var(--yellow);font-size:26px;text-align:center;padding:16px;margin:10px 0;border-radius:12px;font-family:"Segoe UI",sans-serif;font-weight:800}
      #t-mx{position:absolute;inset:0;width:100%;height:100%;display:none;z-index:5;background:#000;cursor:pointer}
      #t-chips{position:absolute;left:14px;right:360px;bottom:14px;display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
      #t-story{position:absolute;top:14px;right:14px;width:332px;bottom:14px;overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px 16px;font-size:15px;line-height:1.5}
      #t-story h3{margin:4px 0 8px;font-size:22px}#t-story .btn{width:100%;margin-top:10px;height:42px}
      .ts-k{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--green)}.ts-s{font-size:13px;color:var(--muted)}
      .ts-prog{display:flex;gap:5px;margin-bottom:12px}.ts-prog i{flex:1;height:6px;border-radius:3px;background:#262a33}.ts-prog i.d{background:var(--green)}.ts-prog i.c{background:var(--yellow);animation:tsP 1s infinite alternate}
      @keyframes tsP{to{opacity:.4}}
      .ts-msg{display:flex;gap:10px;align-items:center}.ts-av{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:rgba(74,222,128,.12);color:var(--green);flex:none}
      .ts-who{font-weight:800}.ts-kind{font-size:12.5px;color:var(--muted)}.ts-txt{margin:10px 0;color:#d1d5db}
      .ts-goal{background:var(--bg2);border:1px solid var(--line);border-left:3px solid var(--yellow);border-radius:10px;padding:8px 10px;font-size:14px}
      #ts-hint{display:flex;flex-direction:column;gap:6px;margin-top:10px}#ts-hint .btn{font-family:var(--mono);font-size:13px;height:auto;padding:7px 10px;text-align:left;margin:0;white-space:normal}
      .ts-time{margin-top:12px;text-align:center;font-size:26px;font-weight:800;color:var(--yellow);font-variant-numeric:tabular-nums}
      .t-rev{font-size:19px;font-weight:700;letter-spacing:.5px}.t-huge{font-size:26px;text-shadow:0 0 18px #4ade80}
      .t-big{color:#4ade80;font-size:20px;line-height:1.05;text-shadow:0 0 14px #4ade8099;margin:8px 0}
      .t-learn{font-family:Inter,sans-serif;font-size:14.5px;line-height:1.5;color:#d1d5db;border-left:3px solid #fbbf24;background:#16140c;padding:8px 12px;border-radius:0 8px 8px 0;margin:6px 0;white-space:normal}
      .ts-ct{display:grid;grid-template-columns:1fr auto;gap:2px 8px;background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:8px 10px;margin-bottom:6px}.ts-ct b{font-family:var(--mono);font-size:13.5px}.ts-ct span{grid-column:1;font-size:12.5px;color:var(--muted)}.ts-ct em{grid-row:1/3;grid-column:2;align-self:center;font-style:normal;font-family:var(--mono);font-weight:800;color:#6b7180}.ts-ct.ok{border-color:#1f5134}.ts-ct.ok em{color:var(--green)}
      .t-story{font-family:Inter,sans-serif;font-size:15px;border:1px solid #2b3b5c;background:#101a2b;color:#cfe0ff;border-radius:10px;padding:8px 12px;margin:8px 0;display:flex;gap:8px;align-items:center}.t-story.ok{border-color:#1f5134;background:#0d2117;color:#86efac}
      #t-chips .btn{font-family:var(--mono);font-size:15px;padding:6px 10px;min-height:36px}
    </style>
    <div id="t-box"><div id="t-bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i>&nbsp; diak@nyiltnap – terminál</div>
      <div id="t-out"></div><div id="t-line"><span id="t-pr"></span><input id="t-in" autocomplete="off" spellcheck="false" autocapitalize="off"></div><canvas id="t-mx"></canvas></div><div id="t-story"></div>
    <div id="t-chips">${['help', 'ping google.com', 'tracert youtube.com', 'ipconfig', 'nslookup iskola.hu', 'ls', 'cat titok.txt', 'neofetch', 'docker run hello-world', 'enable', 'matrix', 'kodfejto'].map(c => `<button class="btn">${c}</button>`).join('')}</div>`;
    out = $('#t-out'); inp = $('#t-in'); updPrompt();
    print('<b style="color:#4ade80">Üdv a terminálban! </b> Itt <b>parancsokkal</b> irányítjuk a gépet – ahogy a rendszergazdák is.');
    print('Írd be: <span class="t-k">help</span> és nyomj Entert. Küldetés: találd meg a <span class="t-err">titkos fájlt</span>!');
    inp.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Enter' && !busy) { const v = inp.value; inp.value = ''; run(v).then(storyCheck) }
      if (e.key === 'ArrowUp' && hi > 0) { inp.value = hist[--hi]; e.preventDefault() }
      if (e.key === 'ArrowDown') { inp.value = hi < hist.length - 1 ? hist[++hi] : (hi = hist.length, ''); e.preventDefault() }
    });
    $('#t-box').onclick = () => inp.focus();
    $('#t-mx').onclick = e => { e.stopPropagation(); clearInterval(matrix); $('#t-mx').style.display = 'none'; inp.focus() };
    $$('#t-chips .btn', root).forEach(b => b.onclick = () => { if (!busy) { run(b.textContent).then(storyCheck); inp.focus() } });
    storyPanel();
  };
  S.enter = () => setTimeout(() => inp.focus(), 50);
  S.tick = dt => { if (CT.on) { CT.t += dt; const e = $('#ts-time'); if (e) e.textContent = `${Math.floor(CT.t / 60)}:${String(Math.floor(CT.t % 60)).padStart(2, '0')}` } if (ST.on && ST.step < MS.length) { ST.t += dt; const e = $('#ts-time'); if (e) e.textContent = `${Math.floor(ST.t / 60)}:${String(Math.floor(ST.t % 60)).padStart(2, '0')}` } };
  S.comp = { rules: 'Éjszakai riasztás: oldd meg a 6 egymás utáni feladatot valódi parancsokkal, a lehető leggyorsabban! Minden másodperc és minden kért tipp pontlevonással jár.', start: () => startStory(true) };
  S.score = () => best;
  S.leave = () => { clearInterval(matrix); $('#t-mx').style.display = 'none' };
  return S;
})());
