import { COLORS, BALANCE } from './config.js'
import { TAU } from './math.js'
import { SENSE } from './brain.js'
import {
  drawCreatureSprite,
  drawTopDownTree,
  drawFruit,
  rayColor,
  drawTrailDots,
} from './render.js'

const modal = document.getElementById('infoModal')
const overlay = document.getElementById('infoModalOverlay')
const closeBtn = document.getElementById('infoModalClose')
const titleEl = document.getElementById('infoModalTitle')
const textEl = document.getElementById('infoModalText')
const pageEl = document.getElementById('infoModalPage')
const prevBtn = document.getElementById('infoPrevBtn')
const nextBtn = document.getElementById('infoNextBtn')
const canvas = document.getElementById('infoModalCanvas')
const ctx = canvas ? canvas.getContext('2d') : null

// Logical drawing space; every page.draw() works in these coordinates.
// The backing store is rendered at LOGICAL × INFO_RENDER_SCALE so the
// art stays crisp when the modal stretches the canvas wider than 900px
// (it was previously a flat 900×380 store, upscaled and blurry).
const INFO_LOGICAL_W = 900
const INFO_LOGICAL_H = 380
const INFO_RENDER_SCALE = Math.min(
  Math.max(window.devicePixelRatio || 1, 1) * 2,
  4,
)

function configureInfoCanvas() {
  const targetW = Math.round(INFO_LOGICAL_W * INFO_RENDER_SCALE)
  const targetH = Math.round(INFO_LOGICAL_H * INFO_RENDER_SCALE)
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW
    canvas.height = targetH
  }
  ctx.setTransform(INFO_RENDER_SCALE, 0, 0, INFO_RENDER_SCALE, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
}

let currentIndex = 0
let animTick = 0
let animRafId = null

function infoNeutralGenome(overrides) {
  return Object.assign(
    { tank: 0, vision: 0, focus: 0, burst: 0, forage: 0, water: 0 },
    overrides || {},
  )
}

function infoTwoEyeBase(overrides) {
  return Object.assign(
    { tank: 0, vision: 0, focus: 0.5, burst: 0, forage: 0, water: 0 },
    overrides || {},
  )
}

function infoRadius(genome, scale) {
  return (6.5 + genome.tank * 10.5) * scale
}

function infoCaption(ctx, x, y, text, opts) {
  ctx.save()
  ctx.fillStyle = (opts && opts.color) || 'rgba(26, 33, 19, 0.92)'
  ctx.font = (opts && opts.font) || '800 14px Inter, sans-serif'
  ctx.textAlign = (opts && opts.align) || 'center'
  ctx.textBaseline = (opts && opts.baseline) || 'top'
  ctx.fillText(text, x, y)
  ctx.restore()
}

function infoArrow(ctx, x1, y1, x2, y2, color) {
  ctx.save()
  ctx.strokeStyle = color || 'rgba(26, 33, 19, 0.7)'
  ctx.fillStyle = ctx.strokeStyle
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  const ang = Math.atan2(y2 - y1, x2 - x1)
  const ah = 8
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - ah * Math.cos(ang - 0.4), y2 - ah * Math.sin(ang - 0.4))
  ctx.lineTo(x2 - ah * Math.cos(ang + 0.4), y2 - ah * Math.sin(ang + 0.4))
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function infoForageRing(ctx, cx, cy, scale, genome) {
  const r = infoRadius(genome, scale)
  const ringR = r + (4 + genome.forage * 8) * scale
  ctx.save()
  ctx.strokeStyle = 'rgba(40, 178, 162, 0.95)'
  ctx.lineWidth = 3.2
  ctx.setLineDash([10, 6])
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(cx, cy, ringR, 0, TAU)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
}

function labelForBurst(state) {
  if (state === 'burst') {
    return 'aktív'
  }
  if (state === 'recovery') {
    return 'felépülés'
  }
  return 'kész'
}

function infoDrawRaySpread(ctx, cx, cy, genome, range) {
  const sideOffset = BALANCE.RAY_BASE_SIDE_OFFSET + (1 - genome.focus) * BALANCE.RAY_FOCUS_SIDE_SPREAD
  const angles = [0, -sideOffset, sideOffset]
  ctx.save()
  ctx.lineWidth = 2.6
  ctx.lineCap = 'round'
  for (const a of angles) {
    ctx.strokeStyle = a === 0 ? 'rgba(26, 33, 19, 0.58)' : 'rgba(26, 33, 19, 0.36)'
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(a) * range, cy + Math.sin(a) * range)
    ctx.stroke()
    ctx.fillStyle = a === 0 ? 'rgba(26, 33, 19, 0.58)' : 'rgba(26, 33, 19, 0.36)'
    ctx.beginPath()
    ctx.arc(cx + Math.cos(a) * range, cy + Math.sin(a) * range, 3.2, 0, TAU)
    ctx.fill()
  }
  ctx.restore()
}

function infoTraitPair(ctx, w, h, trait, valueLow, valueHigh, base, opts) {
  const o = opts || {}
  const scale = o.scale || 8
  const cy = h * 0.55
  const lowGenome = Object.assign({}, base, { [trait]: valueLow })
  const highGenome = Object.assign({}, base, { [trait]: valueHigh })

  if (o.showForageZone) {
    infoForageRing(ctx, w * 0.28, cy, scale, lowGenome)
    infoForageRing(ctx, w * 0.72, cy, scale, highGenome)
  }

  drawCreatureSprite(ctx, w * 0.28, cy, 0, infoRadius(lowGenome, scale), lowGenome, {})
  drawCreatureSprite(ctx, w * 0.72, cy, 0, infoRadius(highGenome, scale), highGenome, {})

  const lowR = infoRadius(lowGenome, scale)
  const highR = infoRadius(highGenome, scale)
  const lowBottom = o.showForageZone ? lowR + (4 + lowGenome.forage * 8) * scale : lowR
  const highBottom = o.showForageZone ? highR + (4 + highGenome.forage * 8) * scale : highR
  infoCaption(ctx, w * 0.28, cy + lowBottom + 14, `${o.label || trait}: ${valueLow.toFixed(2)}`)
  infoCaption(ctx, w * 0.72, cy + highBottom + 14, `${o.label || trait}: ${valueHigh.toFixed(2)}`)
}

const LAND_PALETTE = { dark: COLORS.treeLeafDark, fill: COLORS.treeLeaf }
const KELP_PALETTE = { dark: COLORS.kelpLeafDark, fill: COLORS.kelpLeaf }


const PAGES = [
  {
    title: 'Egyszerű evolúció: alapok',
    html: `
      <ul>
        <li>Ez egy egyszerű <strong>evolúció-szimulátor</strong>: nappal ételt kell gyűjteni, és a többi lénnyel szemben kell fennmaradni.</li>
        <li><strong>Éjjel</strong> eldől, ki marad életben, és kinek lesz utódja. Több étel több utódot tehet lehetővé.</li>
        <li>Minden lénynek van egy öröklődő <strong>neuronhálója</strong>, amely a mozgást, a fordulást és a sprint aktiválását vezérli.</li>
        <li>A neuronháló mellett 6 öröklődő tulajdonság (tank, látás, fókusz, sprint, fürkész, víz kedvelő) alakítja a megjelenést és a viselkedést.</li>
        <li>A cél, hogy látható legyen a szelekció: az öröklődő különbségek több generáción át átrendezik a populációt.</li>
      </ul>
    `,
    draw(ctx, w, h) {
      // Two trees, a few foods, two clearly distinct creatures.
      drawTopDownTree(ctx, { x: w * 0.18, y: h * 0.62, r: 56, seed: 1 }, LAND_PALETTE)
      drawTopDownTree(ctx, { x: w * 0.36, y: h * 0.42, r: 48, seed: 2 }, LAND_PALETTE)
      drawFruit(ctx, { x: w * 0.27, y: h * 0.54, r: 7, color: COLORS.foodRed })
      drawFruit(ctx, { x: w * 0.42, y: h * 0.6, r: 7, color: COLORS.foodGold })
      drawFruit(ctx, { x: w * 0.78, y: h * 0.46, r: 7, color: COLORS.foodRed })

      const fast = { tank: 0.06, vision: 0.6, focus: 0.5, burst: 0.5, forage: 0.15, water: 0 }
      const tank = { tank: 0.85, vision: 0.4, focus: 0.5, burst: 0.4, forage: 0.6, water: 0 }
      drawCreatureSprite(ctx, w * 0.6, h * 0.52, -0.2, infoRadius(fast, 5), fast, {})
      drawCreatureSprite(ctx, w * 0.84, h * 0.62, Math.PI - 0.2, infoRadius(tank, 5), tank, {})
    },
  },

  {
    title: 'Evés és tárolás',
    html: `
      <ul>
        <li>Egy lény minden éjjel <strong>1 ételt</strong> használ fel életben maradásra.</li>
        <li>Maximum <strong>5 ételt</strong> tud cipelni egyszerre.</li>
        <li><strong>2 ételt</strong> csak túlélésre tud magánál tartani.</li>
        <li>Minden 2 fölötti étel egy új utódot tehet lehetővé, <strong>maximum 3 utódot</strong>.</li>
        <li>Példa: 5 étellel → 3 utód + 1 visszamaradó étel másnapra.</li>
      </ul>
    `,
    draw(ctx, w, h) {
      const slotR = 22
      const gap = 14
      const totalW = 5 * slotR * 2 + 4 * gap
      const startX = (w - totalW) / 2 + slotR
      const y = h * 0.42

      for (let i = 0; i < 5; i++) {
        const cx = startX + i * (slotR * 2 + gap)
        ctx.fillStyle = i < 2 ? 'rgba(78, 197, 184, 0.22)' : 'rgba(255, 255, 255, 0.18)'
        ctx.beginPath()
        ctx.arc(cx, y, slotR + 4, 0, TAU)
        ctx.fill()
        drawFruit(ctx, { x: cx, y, r: slotR * 0.7, color: COLORS.foodRed })
        infoCaption(ctx, cx, y + slotR + 10, `${i + 1}`, { font: '800 13px Inter, sans-serif' })
      }

      infoCaption(ctx, startX + slotR + (slotR * 2 + gap) * 0.5, y - slotR - 30, 'Túlélési tartalék')
      infoCaption(ctx, startX + (slotR * 2 + gap) * 3.5, y - slotR - 30, 'Utódok élelme (max 3)')

      const sample = { tank: 0.4, vision: 0.5, focus: 0.5, burst: 0.5, forage: 0.4, water: 0 }
      drawCreatureSprite(ctx, w * 0.5, h * 0.78, 0, infoRadius(sample, 5), sample, {})
    },
  },

  {
    title: 'Nap-éjszaka ciklus',
    html: `
      <ul>
        <li>A <strong>nappal</strong> során a lények mozognak, ételt gyűjtenek, sprintelnek, és közeli találkozáskor versenghetnek.</li>
        <li><strong>Éjjel</strong> mindenki egy helyben marad. Három kimenet:</li>
        <li>1. <strong>Meghal</strong>, ha az éjszakai ételfelhasználás után 0 étel maradna.</li>
        <li>2. <strong>Túléli</strong>, ha legalább 2 étele volt, majd hajnalig alszik.</li>
        <li>3. <strong>Szaporodhat</strong>, ha 3 vagy több étele volt, és nem blokkolta harci vereség.</li>
      </ul>
    `,
    draw(ctx, w, h) {
      const cx0 = w * 0.16, cx1 = w * 0.46, cy = h * 0.5, r = 50

      ctx.fillStyle = '#f5c63a'
      ctx.beginPath()
      ctx.arc(cx0, cy, r, 0, TAU)
      ctx.fill()
      infoCaption(ctx, cx0, cy, 'Nappal', { baseline: 'middle', font: '800 15px Inter, sans-serif' })

      ctx.fillStyle = '#3a4870'
      ctx.beginPath()
      ctx.arc(cx1, cy, r, 0, TAU)
      ctx.fill()
      infoCaption(ctx, cx1, cy, 'Éjjel', { baseline: 'middle', color: '#e8ecd8', font: '800 15px Inter, sans-serif' })

      infoArrow(ctx, cx0 + r + 6, cy, cx1 - r - 6, cy)

      const outX = w * 0.78, yKill = h * 0.22, yIdle = h * 0.5, yKid = h * 0.78
      infoArrow(ctx, cx1 + r + 6, cy - 12, outX - 70, yKill)
      infoArrow(ctx, cx1 + r + 6, cy, outX - 70, yIdle)
      infoArrow(ctx, cx1 + r + 6, cy + 12, outX - 70, yKid)

      const stub = { tank: 0.2, vision: 0.4, focus: 0.5, burst: 0.4, forage: 0.2, water: 0 }
      drawCreatureSprite(ctx, outX, yKill, 0, infoRadius(stub, 3.2), stub, {})
      ctx.strokeStyle = 'rgba(188, 73, 65, 0.9)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(outX - 18, yKill - 14); ctx.lineTo(outX + 18, yKill + 14)
      ctx.moveTo(outX + 18, yKill - 14); ctx.lineTo(outX - 18, yKill + 14)
      ctx.stroke()
      infoCaption(ctx, outX, yKill + 32, 'Meghal (0 étel)')

      drawCreatureSprite(ctx, outX, yIdle, 0, infoRadius(stub, 3.2), stub, { sleeping: true })
      infoCaption(ctx, outX, yIdle + 32, 'Alszik (2 étel)')

      drawCreatureSprite(ctx, outX - 22, yKid, 0, infoRadius(stub, 3.2), stub, {})
      drawCreatureSprite(ctx, outX + 22, yKid - 4, 0, infoRadius(stub, 2.0), stub, {})
      drawCreatureSprite(ctx, outX + 26, yKid + 14, 0, infoRadius(stub, 2.0), stub, {})
      infoCaption(ctx, outX, yKid + 36, 'Szaporodik (3+ étel)')
    },
  },

  {
    title: 'Szaporodás: replikáció és keresztezés',
    html: `
      <ul>
        <li><strong>Replikáció</strong>: a szülő klónozódik, majd néhány gén véletlenszerűen mutál.</li>
        <li><strong>Keresztezés</strong>: a szülő a <em>legközelebbi szaporodó társával</em> keveri az öröklődő értékeit, utána még mutál is. A keresztezés mindig megelőzi a mutációt.</li>
        <li>Keresztezéskor minden öröklődő érték az egyik vagy a másik szülőtől jön. Nincs átlagolás.</li>
        <li>A <em>Keresztezés esély</em> és <em>Keresztezés mért.</em> csúszkák a Haladó panelen szabják, milyen gyakran és milyen erősen történik a keverés.</li>
        <li>Ha nincs más szaporodó lény partnernek, az utód egy szülőből jön létre.</li>
      </ul>
    `,
    draw(ctx, w, h) {
      const labelY = h * 0.16
      infoCaption(ctx, w * 0.25, labelY, 'Replikáció', { font: '800 16px Inter, sans-serif' })
      infoCaption(ctx, w * 0.75, labelY, 'Keresztezés', { font: '800 16px Inter, sans-serif' })

      const parentA = { tank: 0.65, vision: 0.4, focus: 0.6, burst: 0.5, forage: 0.3, water: 0 }
      drawCreatureSprite(ctx, w * 0.25, h * 0.42, 0, infoRadius(parentA, 4.5), parentA, {})
      infoArrow(ctx, w * 0.25, h * 0.55, w * 0.25, h * 0.7)
      drawCreatureSprite(ctx, w * 0.18, h * 0.82, 0, infoRadius(parentA, 3), parentA, {})
      drawCreatureSprite(ctx, w * 0.32, h * 0.82, 0, infoRadius(parentA, 3), parentA, {})

      const parentX = { tank: 0.1, vision: 0.7, focus: 0.6, burst: 0.6, forage: 0.2, water: 0.1 }
      const parentY = { tank: 0.85, vision: 0.3, focus: 0.5, burst: 0.4, forage: 0.7, water: 0.3 }
      drawCreatureSprite(ctx, w * 0.65, h * 0.42, 0, infoRadius(parentX, 4.5), parentX, {})
      drawCreatureSprite(ctx, w * 0.85, h * 0.42, 0, infoRadius(parentY, 4.5), parentY, {})
      infoArrow(ctx, w * 0.68, h * 0.55, w * 0.74, h * 0.7)
      infoArrow(ctx, w * 0.82, h * 0.55, w * 0.76, h * 0.7)
      // Mixed child: gene-by-gene pick, not blend.
      const child = {
        tank: parentY.tank,
        vision: parentX.vision,
        focus: parentY.focus,
        burst: parentX.burst,
        forage: parentY.forage,
        water: parentX.water,
      }
      drawCreatureSprite(ctx, w * 0.75, h * 0.82, 0, infoRadius(child, 3.5), child, {})
    },
  },

  {
    title: 'Mit lát a neuronháló (inputok)',
    html: `
      <ul>
        <li><strong>3 sugár</strong> indul minden lényből: középre (előre), és <strong>balra/jobbra</strong>. A balra/jobbra szög a fókusz tulajdonságból jön.</li>
        <li>Minden sugár <strong>5 inputot</strong> ad: külön mérve a fa, étel, préda, hasonló erejű társ, és veszélyesebb lény közelségét. Ez 15 input.</li>
        <li>Plusz egy <strong>előre néző fal-sugár</strong> a határ érzékelésére, és egy ugyanolyan irányú <strong>parti-sugár</strong>, ami a víz/szárazföld határt jelzi (előjeles).</li>
        <li>Plusz globális inputok: mennyi hely maradt az ételtárolóban, kész-e a sprint, és hol van a lény a mezőn.</li>
        <li>Plusz <strong>3 visszacsatolt memória</strong> érték (a háló saját kimenetei az előző tickből).</li>
        <li>Összesen 24 input → 12 rejtett neuron → 6 kimenet (előre, fordulás, sprint, 3 memória).</li>
      </ul>
    `,
    draw(ctx, w, h) {
      const cx = w * 0.32, cy = h * 0.55
      const focusVal = 0.68
      const sideOffset = BALANCE.RAY_BASE_SIDE_OFFSET + (1 - focusVal) * BALANCE.RAY_FOCUS_SIDE_SPREAD
      const range = 230
      const genome = infoTwoEyeBase({ vision: 0.5, focus: focusVal })
      const r = infoRadius(genome, 4.5)

      // Three rays (center + ±sideOffset). They're shown grey because each ray
      // physically casts once and the brain reads 5 separate type-classified
      // distances along it; see the legend.
      const dirMultipliers = [0, -1, 1]
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      for (const m of dirMultipliers) {
        const a = m * sideOffset
        ctx.strokeStyle = 'rgba(26, 33, 19, 0.42)'
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.cos(a) * range, cy + Math.sin(a) * range)
        ctx.stroke()
      }

      // Wall ray: dashed cyan straight forward, slightly above creature line.
      ctx.setLineDash([6, 5])
      ctx.strokeStyle = 'rgba(114, 207, 255, 0.7)'
      ctx.lineWidth = 2.4
      ctx.beginPath()
      ctx.moveTo(cx, cy - 4)
      ctx.lineTo(cx + range * 1.05, cy - 4)
      ctx.stroke()
      // Water ray: dashed teal straight forward, slightly below.
      ctx.strokeStyle = 'rgba(95, 180, 220, 0.85)'
      ctx.beginPath()
      ctx.moveTo(cx, cy + 4)
      ctx.lineTo(cx + range * 1.05, cy + 4)
      ctx.stroke()
      ctx.setLineDash([])

      drawCreatureSprite(ctx, cx, cy, 0, r, genome, {})

      // Type-color legend on the right.
      const legendX = w * 0.62
      let ly = h * 0.13
      const types = [
        ['Fa', SENSE.tree],
        ['Étel', SENSE.food],
        ['Préda', SENSE.prey],
        ['Hasonló erejű', SENSE.other],
        ['Veszélyesebb', SENSE.threat],
      ]
      infoCaption(ctx, legendX, ly - 22, 'Sugár-inputok típusonként:', { align: 'left', font: '800 12px Inter, sans-serif' })
      for (const [label, type] of types) {
        ctx.fillStyle = rayColor(type, 0.95)
        ctx.fillRect(legendX, ly - 8, 22, 16)
        infoCaption(ctx, legendX + 30, ly, label, { align: 'left', baseline: 'middle', font: '700 13px Inter, sans-serif' })
        ly += 24
      }
      // Wall ray legend.
      ctx.save()
      ctx.strokeStyle = 'rgba(114, 207, 255, 0.8)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.moveTo(legendX, ly)
      ctx.lineTo(legendX + 22, ly)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()
      infoCaption(ctx, legendX + 30, ly, 'Fal (előre)', { align: 'left', baseline: 'middle', font: '700 13px Inter, sans-serif' })
      ly += 24
      // Water ray legend.
      ctx.save()
      ctx.strokeStyle = 'rgba(95, 180, 220, 0.85)'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      ctx.moveTo(legendX, ly)
      ctx.lineTo(legendX + 22, ly)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()
      infoCaption(ctx, legendX + 30, ly, 'Part (előre, előjeles)', { align: 'left', baseline: 'middle', font: '700 13px Inter, sans-serif' })
    },
  },

  {
    title: 'Tank',
    html: `
      <p>A tank a testméretet és az erőt növeli. Ha két lény összeér, és az erőkülönbség átlépi a küszöböt, az erősebb determinisztikusan kiüti a gyengébbet.</p>
      <ul>
        <li><strong>Megjelenés</strong>: nagyobb test, vastagabb körvonal, sötétebb szín.</li>
        <li><strong>Költség</strong>: lassabb mozgás és lassabb fordulás. 0.15 fölött a sebesség hirtelen leesik, majd tovább csökken a tank növekedésével.</li>
        <li><strong>Hatás</strong>: magas tanknál több ellenfél kerülhet a gyengébb kategóriába, de nehezebb gyorsan elérni az ételt.</li>
      </ul>
    `,
    draw(ctx, w, h, tick) {
      // Animated contest demo: a small speedy creature charges the big tank
      // from the left, gets KO'd on contact, sits stunned, then resets and
      // tries again. Uses the live drawCreatureSprite state flags so the KO
      // X-eyes / blocked pulse / koImmunity halo all match in-game visuals.
      const scale = 6
      const cy = h * 0.55
      const small = infoTwoEyeBase({ tank: 0.05, vision: 0.4, burst: 0.4 })
      const big = infoTwoEyeBase({ tank: 0.95, vision: 0.4, forage: 0.3 })
      const bigR = infoRadius(big, scale)
      const smallR = infoRadius(small, scale)
      const bigX = w * 0.66
      const startX = w * 0.18
      const contactX = bigX - bigR - smallR - 2

      const IDLE_BEFORE = 180
      const APPROACH = 70
      const KO_HOLD = 90
      const FADE_OUT = 30
      const IDLE_AFTER = 60
      const APPROACH_END = IDLE_BEFORE + APPROACH
      const KO_END = APPROACH_END + KO_HOLD
      const FADE_END = KO_END + FADE_OUT
      const CYCLE = FADE_END + IDLE_AFTER
      const phase = tick % CYCLE

      const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

      let smallX
      let smallAlpha = 1
      let opts = {}
      const trail = []

      if (phase < IDLE_BEFORE) {
        smallX = startX
      } else if (phase < APPROACH_END) {
        const t = (phase - IDLE_BEFORE) / APPROACH
        smallX = startX + (contactX - startX) * easeInOut(t)
        const N = 9
        for (let i = 0; i < N; i++) {
          const past = Math.max(0, (phase - (N - 1 - i) * 2) - IDLE_BEFORE)
          const tp = Math.min(1, past / APPROACH)
          trail.push({ x: startX + (contactX - startX) * easeInOut(tp), y: cy })
        }
      } else if (phase < KO_END) {
        smallX = contactX
        const koLeft = KO_END - phase
        opts = {
          knockedOut: true,
          lastKoDuration: KO_HOLD,
          blockedPulse: Math.min(120, koLeft * 1.5),
        }
      } else if (phase < FADE_END) {
        smallX = contactX
        const fadeT = (phase - KO_END) / FADE_OUT
        smallAlpha = 1 - fadeT
        opts = {
          knockedOut: true,
          lastKoDuration: KO_HOLD,
          blockedPulse: 0,
        }
      } else {
        smallAlpha = 0
        smallX = startX
      }

      drawCreatureSprite(ctx, bigX, cy, 0, bigR, big, {})
      drawTrailDots(ctx, trail, small, { sizeScale: 2.4, alphaScale: 3 })
      ctx.save()
      ctx.globalAlpha = smallAlpha
      drawCreatureSprite(ctx, smallX, cy, 0, smallR, small, opts)
      ctx.restore()

      infoCaption(ctx, w * 0.5, h * 0.92, 'erős vs. gyenge: az erősebb determinisztikusan kiüt')
      infoCaption(ctx, startX, cy + smallR + 20, `tank: ${small.tank.toFixed(2)}`)
      infoCaption(ctx, bigX, cy + bigR + 20, `tank: ${big.tank.toFixed(2)}`)
    },
  },

  {
    title: 'Látás',
    html: `
      <p>A látás az érzékelési hatótávot növeli. Magasabb értéknél messzebbről kerülhet inputba az étel, a fa és a többi lény.</p>
      <ul>
        <li><strong>Megjelenés</strong>: nagyobb szemek és sárgásabb test.</li>
        <li><strong>Input</strong>: a távoli objektumok gyengébb jelet adnak, a közeli objektumok erősebbet.</li>
        <li><strong>Hatás</strong>: a nagyobb hatótáv több távoli jelet enged be, de ettől még nem garantált a jobb döntés.</li>
      </ul>
    `,
    draw(ctx, w, h) {
      // Same layout as Fókusz, but the contrast is in ray *length* rather
      // than spread. Ranges scale with the live visionRadius curve
      // (87 + vision*360) so the proportional difference matches the sim.
      const scale = 5.8
      const cy = h * 0.52
      const maxRange = Math.min(w * 0.17, h * 0.36)
      const visionLow = 0.25
      const visionHigh = 1.0
      const rangeAtVision = (v) => 87 + v * 360
      const highRange = maxRange
      const lowRange = maxRange * (rangeAtVision(visionLow) / rangeAtVision(visionHigh))
      const low = infoTwoEyeBase({ vision: visionLow })
      const high = infoTwoEyeBase({ vision: visionHigh })
      const leftX = w * 0.28
      const rightX = w * 0.72

      infoDrawRaySpread(ctx, leftX, cy, low, lowRange)
      infoDrawRaySpread(ctx, rightX, cy, high, highRange)
      drawCreatureSprite(ctx, leftX, cy, 0, infoRadius(low, scale), low, {})
      drawCreatureSprite(ctx, rightX, cy, 0, infoRadius(high, scale), high, {})

      infoCaption(ctx, leftX, cy + infoRadius(low, scale) + 14, `látás: ${visionLow.toFixed(2)}, kb. ${Math.round(rangeAtVision(visionLow))} hatótáv`)
      infoCaption(ctx, rightX, cy + infoRadius(high, scale) + 14, `látás: ${visionHigh.toFixed(2)}, kb. ${Math.round(rangeAtVision(visionHigh))} hatótáv`)
    },
  },

  {
    title: 'Fókusz',
    html: `
      <p>A fókusz a három érzékelő-sugár szögtávolságát állítja. Magas fókusznál a sugarak előre szűkülnek, alacsony fókusznál jobban oldalra nyílnak.</p>
      <ul>
        <li><strong>Megjelenés</strong>: magas fókusz: 1 szem középen. Közepes fókusz: 2 előre néző szem. Alacsony fókusz: 3 szélesebben elhelyezett szem. A fókusz a test világosságát is enyhén emeli.</li>
        <li><strong>Hatás</strong>: magas fókusznál a sugarak előre koncentrálódnak, alacsony fókusznál nagyobb oldalirányú területet fednek le.</li>
        <li>A háló ugyanazt a 15 sugár-inputot kapja a fókusztól függetlenül; csak az változik, hogy <em>merre</em> mutatnak a sugarak.</li>
      </ul>
    `,
    draw(ctx, w, h) {
      const scale = 5.2
      const cy = h * 0.52
      const range = Math.min(w * 0.14, h * 0.34)
      const low = infoNeutralGenome({ vision: 0.6, focus: 0.02 })
      const mid = infoNeutralGenome({ vision: 0.6, focus: 0.5 })
      const high = infoNeutralGenome({ vision: 0.6, focus: 0.98 })
      const leftX = w * 0.18
      const midX = w * 0.5
      const rightX = w * 0.82

      infoDrawRaySpread(ctx, leftX, cy, low, range)
      infoDrawRaySpread(ctx, midX, cy, mid, range)
      infoDrawRaySpread(ctx, rightX, cy, high, range)
      drawCreatureSprite(ctx, leftX, cy, 0, infoRadius(low, scale), low, {})
      drawCreatureSprite(ctx, midX, cy, 0, infoRadius(mid, scale), mid, {})
      drawCreatureSprite(ctx, rightX, cy, 0, infoRadius(high, scale), high, {})

      infoCaption(ctx, leftX, cy + infoRadius(low, scale) + 14, 'fókusz: 0.02, kb. +/-96°')
      infoCaption(ctx, midX, cy + infoRadius(mid, scale) + 14, 'fókusz: 0.50, kb. +/-54°')
      infoCaption(ctx, rightX, cy + infoRadius(high, scale) + 14, 'fókusz: 0.98, kb. +/-12°')
    },
  },

  {
    title: 'Sprint',
    html: `
      <p>A sprint időleges sebességnövelés, amelyet a neuronháló aktiválhat. Gyors helyzetváltásra használható.</p>
      <ul>
        <li><strong>Megjelenés</strong>: a test telítettebb színű. Aktív sprint közben világos villanás látszik, utána halvány felépülési réteg.</li>
        <li><strong>Költség</strong>: sprint után felépülési idő következik. A felépülés alatti lassulás a sprint értékével skálázódik.</li>
        <li>A háló a saját inputjai alapján dönti el, mikor aktiválja.</li>
      </ul>
    `,
    draw(ctx, w, h, tick) {
      const scale = 6
      const cy = h * 0.55
      const low = infoTwoEyeBase({ vision: 0.4, burst: 0.15 })
      const high = infoTwoEyeBase({ vision: 0.4, burst: 0.95 })
      const lowR = infoRadius(low, scale)
      const highR = infoRadius(high, scale)

      const burstFrames = 80
      const recoveryFrames = 60
      const idleFrames = 180
      const cycle = burstFrames + recoveryFrames + idleFrames
      function stateFor(t) {
        const p = t % cycle
        if (p < burstFrames) {
          return { state: 'burst', tInPhase: p / burstFrames }
        }
        if (p < burstFrames + recoveryFrames) {
          return { state: 'recovery', tInPhase: (p - burstFrames) / recoveryFrames }
        }
        return { state: 'idle', tInPhase: (p - burstFrames - recoveryFrames) / idleFrames }
      }

      function drawSide(cx, genome, bodyR, phaseShift) {
        const s = stateFor(tick + phaseShift)
        const N = 14
        const trailLen = 70 + genome.burst * 130
        const driftSpeed = 0.018 + genome.burst * 0.05
        const driftPhase = ((tick + phaseShift) * driftSpeed) % 1
        const visibleFraction = s.state === 'burst' ? 1
          : s.state === 'recovery' ? Math.max(0, 1 - s.tInPhase)
          : 0
        const trail = []
        if (visibleFraction > 0) {
          for (let i = 0; i < N; i++) {
            const localPhase = ((N - 1 - i) + driftPhase) / N
            if (localPhase > visibleFraction) {
              continue
            }
            const x = cx - bodyR - 4 - localPhase * trailLen
            trail.push({ x, y: cy })
          }
        }
        drawTrailDots(ctx, trail, genome, { sizeScale: 2.4, alphaScale: 3 })
        drawCreatureSprite(ctx, cx, cy, 0, bodyR, genome, { burstState: s.state })
        return s
      }

      const sLow = drawSide(w * 0.28, low, lowR, 0)
      const sHigh = drawSide(w * 0.72, high, highR, Math.floor(cycle / 2))

      infoCaption(ctx, w * 0.28, cy + lowR + 20, `sprint: ${low.burst.toFixed(2)} (${labelForBurst(sLow.state)})`)
      infoCaption(ctx, w * 0.72, cy + highR + 20, `sprint: ${high.burst.toFixed(2)} (${labelForBurst(sHigh.state)})`)
    },
  },

  {
    title: 'Fürkész',
    html: `
      <p>A fürkész tulajdonság az étel begyűjtési távolságát növeli, és kerekebb testformát ad.</p>
      <ul>
        <li><strong>Megjelenés</strong>: a test sarkai lekerekednek. A türkiz szaggatott kör a tényleges begyűjtési távolságot mutatja.</li>
        <li><strong>Költség</strong>: kiütésnél hosszabb a kiesési idő. Maximumon 1.8-szoros a szorzó.</li>
        <li>Más tulajdonságot közvetlenül nem ront. Tankkal együtt nagyobb begyűjtési távolságot ad, de vereségnél hosszabb kiesést jelent.</li>
      </ul>
    `,
    draw(ctx, w, h, tick) {
      const scale = 6.5
      const cy = h * 0.55
      const low = infoTwoEyeBase({ vision: 0.4, forage: 0.1 })
      const high = infoTwoEyeBase({ vision: 0.4, forage: 1.0 })
      const lowR = infoRadius(low, scale)
      const highR = infoRadius(high, scale)
      const lowRing = lowR + (4 + low.forage * 8) * scale
      const highRing = highR + (4 + high.forage * 8) * scale
      const leftX = w * 0.28
      const rightX = w * 0.72

      infoForageRing(ctx, leftX, cy, scale, low)
      infoForageRing(ctx, rightX, cy, scale, high)

      function drawFruitOrbit(cx, bodyR, ringR, slotCount, phaseOffset) {
        const slotPeriod = 110
        for (let i = 0; i < slotCount; i++) {
          const angle = (i / slotCount) * TAU + phaseOffset
          const slotPhase = ((tick + i * (slotPeriod / slotCount)) % slotPeriod) / slotPeriod
          const r = ringR - (ringR - bodyR + 6) * slotPhase
          const alpha = Math.min(1, Math.min(slotPhase * 6, (1 - slotPhase) * 4))
          if (alpha <= 0.02) {
            continue
          }
          ctx.save()
          ctx.globalAlpha = alpha
          drawFruit(ctx, {
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r,
            r: 6,
            color: i % 2 === 0 ? COLORS.foodRed : COLORS.foodGold,
          })
          ctx.restore()
        }
      }

      drawFruitOrbit(leftX, lowR, lowRing, 2, 0.4)
      drawFruitOrbit(rightX, highR, highRing, 5, 0.1)

      drawCreatureSprite(ctx, leftX, cy, 0, lowR, low, {})
      drawCreatureSprite(ctx, rightX, cy, 0, highR, high, {})

      infoCaption(ctx, leftX, cy + lowRing + 14, `fürkész: ${low.forage.toFixed(2)}`)
      infoCaption(ctx, rightX, cy + highRing + 14, `fürkész: ${high.forage.toFixed(2)}`)
    },
  },

  {
    title: 'Víz kedvelő',
    html: `
      <p>A víz kedvelő tulajdonság lineárisan szabja, milyen gyorsan mozog a lény vízben vagy szárazon. A térkép bal harmada víz, a többi szárazföld.</p>
      <ul>
        <li><strong>Vízben</strong>: sebesség × <em>víz kedvelő</em>. Például 0.80 értéknél vízben az alapsebesség 80%-ával mozog.</li>
        <li><strong>Szárazon</strong>: sebesség × (1 − <em>víz kedvelő</em>). Ugyanezzel a 0.80 értékkel szárazon csak 20%-os sebességgel halad.</li>
        <li><strong>Látótáv</strong>: ugyanígy skálázódik, mint a sebesség. Vízben a látótáv × <em>víz kedvelő</em>, szárazon × (1 − <em>víz kedvelő</em>), így egy vízi specialista szárazon szinte vakon mozog.</li>
        <li><strong>Megjelenés</strong>: minél magasabb a víz kedvelő, annál inkább korall-narancs, telítettebb és kissé világosabb a test színe, és annál simább a test. Alacsony értéknél a szín hidegebb, a test pedig tüskés vagy szőrös.</li>
        <li>A 0.5 körüli értékek mindenhol közepesek, a szelekció többnyire a végletek, vízi vagy földi specialista felé tolja a populációt.</li>
      </ul>
    `,
    draw(ctx, w, h) {
      // Low- vs high-water creature side by side so the color/smoothness
      // shift reads at a glance.
      infoTraitPair(ctx, w, h, 'water', 0.05, 0.95,
        infoTwoEyeBase({ vision: 0.5, focus: 0.5 }),
        { label: 'víz kedvelő' })
    },
  },

  {
    title: 'Lehetséges kombinációk (1/2)',
    html: `
      <ul>
        <li><strong>Alacsony tank, magas fürkész</strong>: gyors mozgás, nagyobb ételbegyűjtési távolság, gyengébb harci erő.</li>
        <li><strong>Magas tank, alacsony fürkész</strong>: nagyobb harci erő, lassabb mozgás, rövidebb kiütési idő vereségnél.</li>
        <li><strong>Alacsony tank, magas sprint</strong>: gyors kitörésekre képes, de sprint után erősebb lassulás jön.</li>
        <li><strong>Magas tank, magas fókusz</strong>: erős test és szűk előre néző érzékelés.</li>
      </ul>
    `,
    draw(ctx, w, h) {
      const builds = [
        { x: w * 0.18, label: 'tank↓ fürkész↑',
          g: { tank: 0.06, vision: 0.5, focus: 0.5, burst: 0.4, forage: 0.9, water: 0 } },
        { x: w * 0.40, label: 'tank↑ fürkész↓',
          g: { tank: 0.9, vision: 0.4, focus: 0.5, burst: 0.3, forage: 0.08, water: 0 } },
        { x: w * 0.62, label: 'tank↓ sprint↑',
          g: { tank: 0.08, vision: 0.5, focus: 0.5, burst: 0.95, forage: 0.2, water: 0 } },
        { x: w * 0.84, label: 'tank↑ fókusz↑',
          g: { tank: 0.85, vision: 0.5, focus: 0.95, burst: 0.3, forage: 0.2, water: 0 } },
      ]
      const cy = h * 0.5
      for (const b of builds) {
        drawCreatureSprite(ctx, b.x, cy, 0, infoRadius(b.g, 5), b.g, {})
        infoCaption(ctx, b.x, cy + infoRadius(b.g, 5) + 14, b.label)
      }
    },
  },

  {
    title: 'Lehetséges kombinációk (2/2)',
    html: `
      <ul>
        <li><strong>Magas látás, alacsony fókusz</strong>: nagy szemek és szélesebb oldalirányú érzékelés.</li>
        <li><strong>Magas tank, magas fürkész</strong>: nagyobb test, nagyobb begyűjtési távolság, hosszabb kiütési idő vereségnél.</li>
        <li><strong>Vízi specialista</strong>: kicsi tank, magas víz kedvelő, vízben gyors, szárazon szinte mozdulatlan.</li>
        <li><strong>Földi specialista</strong>: alacsony víz kedvelő, szárazon gyors, vízben lassú.</li>
      </ul>
    `,
    draw(ctx, w, h) {
      const builds = [
        { x: w * 0.18, label: 'látás↑ fókusz↓',
          g: { tank: 0.1, vision: 0.95, focus: 0.1, burst: 0.4, forage: 0.3, water: 0 } },
        { x: w * 0.40, label: 'tank↑ fürkész↑',
          g: { tank: 0.85, vision: 0.4, focus: 0.5, burst: 0.3, forage: 0.95, water: 0 } },
        { x: w * 0.62, label: 'vízi specialista',
          g: { tank: 0.1, vision: 0.5, focus: 0.5, burst: 0.5, forage: 0.4, water: 0.92 } },
        { x: w * 0.84, label: 'földi specialista',
          g: { tank: 0.3, vision: 0.5, focus: 0.5, burst: 0.5, forage: 0.4, water: 0.05 } },
      ]
      const cy = h * 0.5
      for (const b of builds) {
        drawCreatureSprite(ctx, b.x, cy, 0, infoRadius(b.g, 5), b.g, {})
        infoCaption(ctx, b.x, cy + infoRadius(b.g, 5) + 14, b.label)
      }
    },
  },
]


function renderShell() {
  const page = PAGES[currentIndex]
  titleEl.textContent = page.title
  textEl.innerHTML = page.html || ''
  pageEl.textContent = `${currentIndex + 1} / ${PAGES.length}`
  prevBtn.disabled = currentIndex === 0
  nextBtn.disabled = currentIndex === PAGES.length - 1
}

function renderCanvas() {
  if (!ctx) {
    return
  }
  const page = PAGES[currentIndex]
  configureInfoCanvas()
  const width = INFO_LOGICAL_W
  const height = INFO_LOGICAL_H
  ctx.fillStyle = '#7c9e5c'
  ctx.fillRect(0, 0, width, height)
  if (page.draw) {
    page.draw(ctx, width, height, animTick)
  }
}

function startAnim() {
  if (animRafId !== null) {
    return
  }
  const tick = () => {
    animTick++
    renderCanvas()
    animRafId = requestAnimationFrame(tick)
  }
  animRafId = requestAnimationFrame(tick)
}

function stopAnim() {
  if (animRafId !== null) {
    cancelAnimationFrame(animRafId)
  }
  animRafId = null
}

function next() {
  if (currentIndex >= PAGES.length - 1) {
    return
  }
  currentIndex++
  animTick = 0
  renderShell()
}

function prev() {
  if (currentIndex <= 0) {
    return
  }
  currentIndex--
  animTick = 0
  renderShell()
}

function onKey(e) {
  if (e.key === 'Escape') {
    closeInfoModal()
  }
  else if (e.key === 'ArrowRight') {
    next()
  }
  else if (e.key === 'ArrowLeft') {
    prev()
  }
}

export function openInfoModal() {
  if (!modal) {
    return
  }
  modal.hidden = false
  currentIndex = 0
  animTick = 0
  renderShell()
  renderCanvas()
  startAnim()
  document.addEventListener('keydown', onKey)
}

export function closeInfoModal() {
  if (!modal) {
    return
  }
  modal.hidden = true
  stopAnim()
  document.removeEventListener('keydown', onKey)
}

if (closeBtn) {
  closeBtn.addEventListener('click', closeInfoModal)
}
if (overlay) {
  overlay.addEventListener('click', closeInfoModal)
}
if (prevBtn) {
  prevBtn.addEventListener('click', prev)
}
if (nextBtn) {
  nextBtn.addEventListener('click', next)
}
