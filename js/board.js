/* ===== Közös ranglista a KopiDev Supabase-projektjében =====
   A verseny módban elért eredmények minden gépről egy közös, napi ranglistába
   kerülnek. Internet nélkül (vagy fájlból megnyitva) csendben kimarad: a helyi
   ranglista ettől függetlenül működik. */
const NetBoard = (() => {
  const API = 'https://mifdcgbtiusrjesgjxlz.supabase.co/rest/v1/rpc/';
  const KEY = 'sb_publishable_ROBXggdUYxIZwIMXwPjU1g_C0J8Y7vO';
  const SESSION = 'sb-mifdcgbtiusrjesgjxlz-auth-token';
  const usable = () => /^https?:$/.test(location.protocol) && navigator.onLine !== false;

  // A KopiDev oldalon (ugyanezen a domainen) bejelentkezett felhasználó tokene.
  function token() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION) || 'null');
      return s && s.access_token && s.expires_at * 1000 > Date.now() ? s.access_token : null;
    } catch (e) { return null }
  }

  // keepalive: az oldal bezárása / elnavigálás közben indított kérés is célba ér.
  async function call(fn, body, auth, keepalive) {
    if (!usable()) throw new Error('offline');
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 6000);
    try {
      const headers = { apikey: KEY, 'Content-Type': 'application/json' };
      if (auth) headers.Authorization = 'Bearer ' + auth;
      const res = await fetch(API + fn, { method: 'POST', headers, body: JSON.stringify(body || {}), signal: ctl.signal, keepalive: !!keepalive });
      const text = await res.text(), data = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error((data && data.message) || 'HTTP ' + res.status);
      return data;
    } finally { clearTimeout(timer) }
  }

  // run: egy verseny azonosítója. Ugyanazzal a run-nal küldött eredmény a
  // korábbit frissíti (élő mentés verseny közben), nem hoz létre új sort.
  const submit = (station, player, score, run, keepalive) =>
    call('nyiltnap_submit', { p_station: station, p_player: String(player).trim().slice(0, 16), p_score: Math.round(score), p_run: run || null }, token(), keepalive);

  // Állomásonként a mai legjobbak + az összesített bajnokság (ugyanazzal a
  // pontozással, mint a helyi: 1. hely 10, 2. hely 9 … legalább 1 pont).
  async function load() {
    const rows = await call('nyiltnap_board', { p_limit: 50 }, token());
    const byStation = {}, pts = {};
    for (const r of rows) {
      (byStation[r.station] = byStation[r.station] || []).push({ n: r.player, s: r.score });
      pts[r.player] = (pts[r.player] || 0) + Math.max(1, 11 - r.rank);
    }
    const total = Object.entries(pts).sort((a, b) => b[1] - a[1]);
    return { byStation, total };
  }

  const remove = (player, station) => call('nyiltnap_remove', { p_player: player, p_station: station || null }, token());

  return { usable, submit, load, remove, get signedIn() { return !!token() } };
})();
