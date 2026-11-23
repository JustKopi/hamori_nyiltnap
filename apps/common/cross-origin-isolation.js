// Shared guard for the simulators that need SharedArrayBuffer (their
// parallel Web Worker pools allocate a SAB). The browser only exposes
// SharedArrayBuffer when the document is *cross-origin isolated*, which
// requires COOP: same-origin + COEP: require-corp on BOTH the parent
// React shell and this iframe — see firebase.json (prod) and
// vite.config.ts (dev).
//
// When isolation is missing we can't run, so instead of a blank crash
// we show an overlay that diagnoses *why* and gives the right advice.
// The cause is almost never an out-of-date browser — it's usually the
// browsing *context* (an in-app webview, an old iOS, a stripped header).
//
// Usage, once near the top of an app's entry module:
//   import { ensureCrossOriginIsolated } from '../../common/cross-origin-isolation.js'
//   ensureCrossOriginIsolated('evolucio-vizes')

// In-app browsers (Instagram, Facebook/Messenger, TikTok, Snapchat,
// LINE, X/Twitter, Pinterest, the Google app) and generic Android
// WebViews embed a browser that does not grant cross-origin isolation,
// however modern the underlying engine is. These users have to reopen
// the link in a standalone browser.
function isInAppBrowser() {
  const ua = navigator.userAgent || ''
  return /FBAN|FBAV|FB_IAB|Instagram|Messenger|TikTok|musical_ly|Bytedance|Snapchat|\bLine\/|Twitter|Pinterest|\bGSA\/|; wv\)/i.test(ua)
}

// Every iOS/iPadOS browser (Chrome, Edge, Brave included) is really
// WebKit, and SharedArrayBuffer needs Safari/WebKit 15.2+. So on iOS
// "use Chrome" is useless advice — the fix is updating iOS itself.
function isIOS() {
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua)) {
    return true
  }
  // iPadOS 13+ reports as desktop Safari; sniff the touch + Mac combo.
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

// Pick the most useful explanation + advice for the current failure.
// Two root conditions: SharedArrayBuffer missing entirely, or present
// but the page isn't isolated. Context (in-app / iOS) refines further.
function diagnose() {
  if (isInAppBrowser()) {
    return {
      reason: 'in-app-browser',
      title: 'Nyisd meg böngészőben',
      body: 'Úgy tűnik, egy alkalmazás beépített böngészőjében (pl. Instagram, Facebook, TikTok) nyitottad meg az oldalt. Ezek nem támogatják a szimulációhoz szükséges technológiát (SharedArrayBuffer).',
      advice: 'Koppints a ••• vagy a megosztás ikonra, majd a „Megnyitás böngészőben” lehetőségre (Chrome vagy Safari).',
    }
  }

  if (isIOS()) {
    return {
      reason: 'ios-webkit',
      title: 'Frissítsd az iOS-t',
      body: 'iPhone-on és iPaden minden böngésző a Safari motorját használja, és ehhez a szimulációhoz iOS 15.2 vagy újabb kell. Külön Chrome letöltése nem segít.',
      advice: 'Frissítsd a készüléket a legújabb iOS-re (Beállítások → Általános → Szoftverfrissítés), majd töltsd újra az oldalt.',
    }
  }

  if (typeof SharedArrayBuffer === 'undefined' && self.crossOriginIsolated === true) {
    return {
      reason: 'no-sharedarraybuffer',
      title: 'Túl régi böngésző',
      body: 'A böngésződ nem ismeri a szimulációhoz szükséges SharedArrayBuffer technológiát.',
      advice: 'Frissíts egy friss asztali böngészőre (Chrome, Edge vagy Firefox legújabb verziója), majd töltsd újra az oldalt.',
    }
  }

  // The browser is capable, but this document isn't cross-origin
  // isolated — an embedding we don't control, a header-stripping
  // extension or proxy, or an insecure http:// load stripped it.
  return {
    reason: 'not-isolated',
    title: 'A szimuláció nem tudott elindulni',
    body: 'A böngésződ alkalmas lenne rá, de ez az oldal nem „cross-origin isolated” módban töltődött be, így a SharedArrayBuffer nem érhető el.',
    advice: 'Nyisd meg közvetlenül a https://lors.hu oldalról, normál böngészőablakban (ne beágyazva), és kapcsold ki az olyan bővítményeket, amelyek módosíthatják az oldalt.',
  }
}

function showOverlay(info) {
  const overlay = document.createElement('div')
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'display:flex', 'align-items:center',
    'justify-content:center', 'padding:32px', 'box-sizing:border-box',
    'background:rgba(18,24,12,0.92)', 'color:#f6f1dc', 'z-index:9999',
    "font-family:'Segoe UI', system-ui, sans-serif",
  ].join(';')
  overlay.innerHTML = `
    <div style="max-width:560px; line-height:1.5">
      <h1 style="margin-top:0; font-size:1.6rem">${info.title}</h1>
      <p>${info.body}</p>
      <p>${info.advice}</p>
    </div>`
  document.body.appendChild(overlay)
}

// Returns nothing when isolation is available. Otherwise renders the
// diagnosis overlay and throws, so the caller's module evaluation halts
// — the simulator must not continue without SharedArrayBuffer.
export function ensureCrossOriginIsolated(appName) {
  const ready = typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated === true
  if (ready) {
    return
  }

  const info = diagnose()
  console.warn(
    `[${appName}] SharedArrayBuffer unavailable — reason="${info.reason}", ` +
    `crossOriginIsolated=${self.crossOriginIsolated}, ` +
    `hasSharedArrayBuffer=${typeof SharedArrayBuffer !== 'undefined'}`,
  )
  showOverlay(info)
  throw new Error(`[${appName}] SharedArrayBuffer / cross-origin isolation unavailable (${info.reason})`)
}
