# Nyílt nap – Informatika

Interaktív, böngészőben futó bemutató az **informatikai rendszer- és alkalmazás-üzemeltető technikus** szakmához.
Nyílt napra készült: a gyerekek játékosan kipróbálhatják, mit tanulnak a képzésben, a szülők pedig kivetíthető összefoglalót kapnak a szakmáról.

**Megnyitás:** https://justkopi.github.io/hamori_nyiltnap/

## Állomások

| Állomás | Témakör |
|---|---|
| Az internet útja | csomagok, sávszélesség, késleltetés, redundancia, kábelezés |
| Légy te a router! | IPv4, CIDR, útvonaltábla, leghosszabb egyezés, TTL |
| Kapcsoló-labor | VLAN, STP, DHCP + szabad hálózatépítő labor (IP, átjáró, ping) |
| WiFi-tervező | könnyű és nehéz mód: router, mesh, jelismétlő, kábeles AP, powerline, kábelezés, csatornák, valós idejű zavarok |
| Te vagy a tűzfal! | támadástípusok, portok, DDoS |
| Jelszó-törő | erős jelszavak, hitelesítés |
| Parancssor-kaland | „Éjszakai riasztás” küldetéssor: átjáró, DNS, napló, tűzfal, szolgáltatások, mentés; Kódfejtő kihívás (Caesar, Base64, bináris, hex) |
| Rendszergazda-ügyelet | szerverhibák + e-mail, chat, telefonos kérések |
| Gépépítő műhely 3D | alkatrészek, összeszerelés, hibakeresés, rendszertelepítés, röntgen-nézet, játék a kész gépen |
| Felhő-üzemeltető | virtualizáció, konténerek, élő migráció; 90 mp-es vagy végtelen mód, fogd és vidd |
| Programozd a robotot! | blokkos programozás, ciklus, feltétel, Python, 8 pálya |
| Weblap-műhely | HTML, CSS, Bootstrap/Tailwind/React, WordPress vs oldalkészítő vs kézi kód |
| AI-labor | neurális háló a böngészőben, rajzfelismerő, szövegjósló, élő Claude-chat (saját API-kulccsal) |
| RJ45-krimpelő | T568B, kábeltesztelés |
| Adathalász-felismerő | phishing felismerése |
| Hibakereső detektív | rendszeres hibaelhárítás |
| Melyik IT-szakma való nekem? | pályaorientációs kérdőív |
| Villámkvíz | vegyes |
| Szülőknek | a szakma bemutatása, kivetíthető diasor |

Verseny mód: kötelező névmegadás, időre menő játék, ranglista és összesített bajnokság (a böngésző helyi tárolójában).

## Futtatás

Nincs szükség telepítésre vagy szerverre: az `index.html` közvetlenül megnyitható böngészőben (internet nélkül is működik).

Külső könyvtárak a `js/vendor` mappában: [three.js](https://threejs.org/) r149 (MIT licenc) és az [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript) 1.10.0 böngészős csomagja (Apache-2.0), amelyet csak az AI-labor élő chatje tölt be.

**Tanári beállítások** (fogaskerék a fejlécben): kioszk mód (Ctrl+Alt+K), gyenge gépes mód, saját Claude API-kulcs az AI-chathez – a kulcs csak az adott gép böngészőjében tárolódik.
