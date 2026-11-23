# Nyílt nap – Informatika

Interaktív, böngészőben futó bemutató az **informatikai rendszer- és alkalmazás-üzemeltető technikus** szakmához.
Nyílt napra készült: a gyerekek játékosan kipróbálhatják, mit tanulnak a képzésben, a szülők pedig kivetíthető összefoglalót kapnak a szakmáról.

**Megnyitás:** https://justkopi.github.io/hamori_nyiltnap/

## Állomások

| Állomás | Témakör |
|---|---|
| Az internet útja | Netfaló: 5 pályás túlterheléses játék (sávszélesség, szűk keresztmetszet, gyorsítótár, QoS, tartalék vonal) |
| Légy te a router! | IPv4, CIDR, útvonaltábla, leghosszabb egyezés, TTL |
| Kapcsoló-labor | VLAN, STP, DHCP + szabad hálózatépítő labor (IP, átjáró, ping) |
| WiFi-tervező | könnyű és nehéz mód: router, mesh, jelismétlő, kábeles AP, powerline, kábelezés, csatornák, valós idejű zavarok |
| Te vagy a tűzfal! | támadástípusok, portok, DDoS |
| Jelszó-törő | erős jelszavak, hitelesítés |
| Parancssor-kaland | „Éjszakai riasztás” küldetéssor: átjáró, DNS, napló, tűzfal, szolgáltatások, mentés; Kódfejtő kihívás (Caesar, Base64, bináris, hex) |
| Rendszergazda-ügyelet | Szervermentő (kicsiknek) és Profi ügyelet: szerverhibák + e-mail, chat, telefonos kérések |
| Gépépítő műhely 3D | alkatrészek, összeszerelés, hibakeresés, rendszertelepítés, röntgen-nézet, játék a kész gépen |
| Felhő-üzemeltető | virtualizáció, konténerek, élő migráció; 90 mp-es vagy végtelen mód, fogd és vidd |
| Programozd a robotot! | blokkos programozás, ciklus, feltétel, Python, 8 pálya |
| Weblap-műhely | HTML, CSS, Bootstrap/Tailwind/React, WordPress vs oldalkészítő vs kézi kód |
| Trend-stúdió | Divatkód: öltöztetés témára HEX színkódokkal és CSS-mintákkal, kifutó és AI-zsűri; For You algoritmus: ajánlórendszer és szűrőbuborék |
| AI-labor | neurális háló a böngészőben, rajzfelismerő, 34 rajzot felismerő rajzfelismerő, szövegjósló, önvezető autók (neurális háló + evolúció) |
| RJ45-krimpelő | T568B, kábeltesztelés |
| Adathalász-felismerő | phishing felismerése |
| Hibakereső detektív | rendszeres hibaelhárítás |
| Melyik IT-szakma való nekem? | pályaorientációs kérdőív |
| Villámkvíz | vegyes |
| Szülőknek | a szakma bemutatása, kivetíthető diasor |

Verseny mód: kötelező névmegadás, időre menő játék, ranglista és összesített bajnokság (a böngésző helyi tárolójában).

## Futtatás

Nincs szükség telepítésre vagy szerverre: az `index.html` közvetlenül megnyitható böngészőben (internet nélkül is működik).

Külső könyvtárak a `js/vendor` mappában: [three.js](https://threejs.org/) r149 a GLTFLoaderrel és a meshopt-dekóderrel (MIT licenc), egy QR-kód-generátor (MIT licenc), valamint Quaternius [Ultimate Modular Women](https://quaternius.com) 3D modelljei (CC0, közkincs) a Trend-stúdióhoz.

**Tanári beállítások** (fogaskerék a fejlécben): kioszk mód (Ctrl+Alt+K), gyenge gépes mód.
