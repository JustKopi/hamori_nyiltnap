import { COLORS, LILY_PAD_DARK, LILY_PAD_FILL, LILY_FLOWER_COLORS, WORLD_W, WORLD_H, WATER_BOUNDARY_X, BALANCE } from './config.js'
import { TAU, clamp, rand, distSq } from './math.js'
import { SENSE } from './brain.js'
import { TRAITS, TRAIT_COLORS } from './trait-defs.js'
import {
  traitHue, traitSat, traitLight, furAmount, cornerRadius,
  eyeRadius, eyeCount, forageZoneRadius, bodyOutlineWidth,
} from './trait-visuals.js'

const W = 1280
const H = 720
const WHOLE_WORLD_ZOOM = Math.min(W / WORLD_W, H / WORLD_H)

let renderScale = 1

const camera = {
  x: 0,
  y: 0,
  zoom: WHOLE_WORLD_ZOOM,
  dragging: false,
  dragMoved: false,
  lastX: 0,
  lastY: 0,
  dragStartX: 0,
  dragStartY: 0,
  followId: null,
}

const SKIP_NIGHT_OVERLAY_ABOVE_SPEED = 2

const renderOptions = {
  showSelectionView: false,
  showTrails: true,
  showLabels: false,
  followMode: true,
  simSpeed: 1,
}


let focusOverrideId = null
let focusCachedId = null
let focusCacheTick = -1
let starField = []
let activeCanvas = null
let activeWorld = null
let onCreaturePick = null
let chartLastDay = -1
let chartLastLen = -1

export { camera }

export function setRenderOptions(partial) {
  Object.assign(renderOptions, partial || {})
}

export function getRenderOptions() { return renderOptions }

export function resetRenderState() {
  focusOverrideId = null
  focusCachedId = null
  focusCacheTick = -1
  // Drop any follow lock (the followed creature won't survive a reset),
  // but deliberately leave camera.x/y/zoom untouched so a restart keeps
  // the user's current pan & zoom.
  camera.followId = null
  starField = []
  chartLastDay = -1
  chartLastLen = -1
}

export function setFocusOverride(id) {
  focusOverrideId = id
  return focusOverrideId
}

export function setFollowTarget(id) {
  camera.followId = id
}

export function getFollowTarget() { return camera.followId }

function visibleWorldWidth() { return W / camera.zoom }
function visibleWorldHeight() { return H / camera.zoom }

function clampCamera() {
  camera.x = clamp(camera.x, 0, Math.max(0, WORLD_W - visibleWorldWidth()))
  camera.y = clamp(camera.y, 0, Math.max(0, WORLD_H - visibleWorldHeight()))
}

export function centerCameraOn(x, y) {
  camera.x = x - visibleWorldWidth() / 2
  camera.y = y - visibleWorldHeight() / 2
  clampCamera()
}

function screenToCanvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * W,
    y: ((event.clientY - rect.top) / rect.height) * H,
  }
}

function canvasToWorldPoint(point) {
  return {
    x: camera.x + point.x / camera.zoom,
    y: camera.y + point.y / camera.zoom,
  }
}

function useViewportTransform(ctx) {
  ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0)
}

function useWorldTransform(ctx) {
  const scale = renderScale * camera.zoom
  ctx.setTransform(scale, 0, 0, scale, -camera.x * scale, -camera.y * scale)
}

function isNearCamera(x, y, padding) {
  return (
    x >= camera.x - padding &&
    x <= camera.x + visibleWorldWidth() + padding &&
    y >= camera.y - padding &&
    y <= camera.y + visibleWorldHeight() + padding
  )
}

export function setCameraZoom(nextZoom) {
  const centerX = camera.x + visibleWorldWidth() / 2
  const centerY = camera.y + visibleWorldHeight() / 2
  camera.zoom = nextZoom
  centerCameraOn(centerX, centerY)
}

export function syncCanvasResolution(canvas, ctx, hiRes) {
  renderScale = hiRes ? 2 : 1
  const nextW = W * renderScale
  const nextH = H * renderScale
  if (canvas.width !== nextW || canvas.height !== nextH) {
    canvas.width = nextW
    canvas.height = nextH
  }
  useViewportTransform(ctx)
  ctx.imageSmoothingEnabled = true
  canvas.dataset.resolutionScale = renderScale.toString()
}

function projectAngleToRect(angle, halfL, halfW) {
  const cosA = Math.cos(angle), sinA = Math.sin(angle)
  let t = Infinity
  if (Math.abs(cosA) > 1e-6) {
    t = halfL / Math.abs(cosA)
  }
  if (Math.abs(sinA) > 1e-6) {
    t = Math.min(t, halfW / Math.abs(sinA))
  }
  return t
}

function dawnAlpha(world) {
  // Used by meadow blades, flowers, ripples — surface decorations that
  // still do a whole-list dawn crossfade. Trees handle their own per-
  // tree fade via birthTick/deathTick and no longer touch this.
  if (world.phase !== 'day') {
    return 1
  }
  if (world.phaseTick >= BALANCE.DAWN_LENGTH) {
    return 1
  }
  const noPrev =
    world.prevMeadowMarks.length === 0 &&
    world.prevFlowers.length === 0 &&
    world.prevWaterMarks.length === 0
  if (noPrev) {
    return 1
  }
  return world.phaseTick / BALANCE.DAWN_LENGTH
}

function focusCreature(world) {
  if (focusOverrideId !== null) {
    const overridden = world.creatures.find((c) => c.id === focusOverrideId && c.alive)
    if (overridden) {
      return overridden
    }
    focusOverrideId = null
  }
  if (focusCachedId !== null && world.globalTick - focusCacheTick < 60) {
    const cached = world.creatures.find((c) => c.id === focusCachedId && c.alive)
    if (cached) {
      return cached
    }
  }
  let best = null
  for (const c of world.creatures) {
    if (!c.alive) {
      continue
    }
    if (!best || c.fitness > best.fitness) {
      best = c
    }
  }
  if (best) {
    focusCachedId = best.id
    focusCacheTick = world.globalTick
  }
  return best
}

// Fill a rect with the layered water look (base + diagonal light + side
// depth). Used by the in-game water region and by the static preview
// cards on the site so any tweak here flows through both.
export function drawWaterFill(ctx, x, y, w, h) {
  ctx.fillStyle = COLORS.waterBase
  ctx.fillRect(x, y, w, h)

  const lightGrad = ctx.createLinearGradient(x, y, x + w, y + h)
  lightGrad.addColorStop(0, 'rgba(180, 220, 240, 0.16)')
  lightGrad.addColorStop(0.6, 'rgba(60, 110, 150, 0)')
  lightGrad.addColorStop(1, 'rgba(10, 30, 50, 0.34)')
  ctx.fillStyle = lightGrad
  ctx.fillRect(x, y, w, h)

  const depthGrad = ctx.createLinearGradient(x, y, x + w, y)
  depthGrad.addColorStop(0, 'rgba(10, 24, 44, 0.22)')
  depthGrad.addColorStop(1, 'rgba(10, 24, 44, 0)')
  ctx.fillStyle = depthGrad
  ctx.fillRect(x, y, w, h)
}

// Same idea for grass — base + diagonal warm light + corner depth.
export function drawGrassFill(ctx, x, y, w, h) {
  ctx.fillStyle = COLORS.grassBase
  ctx.fillRect(x, y, w, h)

  const lightGrad = ctx.createLinearGradient(x, y, x + w * 0.7, y + h)
  lightGrad.addColorStop(0, 'rgba(255, 244, 200, 0.22)')
  lightGrad.addColorStop(0.5, 'rgba(120, 162, 80, 0)')
  lightGrad.addColorStop(1, 'rgba(40, 60, 22, 0.28)')
  ctx.fillStyle = lightGrad
  ctx.fillRect(x, y, w, h)

  const depthGrad = ctx.createLinearGradient(x + w, y + h, x, y)
  depthGrad.addColorStop(0, 'rgba(34, 52, 24, 0.18)')
  depthGrad.addColorStop(1, 'rgba(34, 52, 24, 0)')
  ctx.fillStyle = depthGrad
  ctx.fillRect(x, y, w, h)
}

function drawWaterRegion(world, ctx) {
  drawWaterFill(ctx, 0, 0, WATER_BOUNDARY_X, WORLD_H)

  const wind = Math.sin(world.globalTick * 0.0014)
  const fade = dawnAlpha(world)
  if (fade < 1 && world.prevWaterMarks.length > 0) {
    drawRipples(ctx, world.prevWaterMarks, wind, 1 - fade)
  }
  drawRipples(ctx, world.waterMarks, wind, fade)
}

function drawRipples(ctx, marks, wind, alphaScale) {
  ctx.save()
  ctx.lineCap = 'round'
  for (const r of marks) {
    const a = r.alpha * alphaScale
    if (a < 0.02) {
      continue
    }
    if (!isNearCamera(r.x, r.y, r.len + 4)) {
      continue
    }
    ctx.strokeStyle = `rgba(220, 235, 245, ${a * 0.8})`
    ctx.lineWidth = 1
    const angle = r.angle + wind * 0.3 * r.sway
    ctx.beginPath()
    ctx.moveTo(r.x - Math.cos(angle) * r.len * 0.5, r.y - Math.sin(angle) * r.len * 0.5)
    ctx.lineTo(r.x + Math.cos(angle) * r.len * 0.5, r.y + Math.sin(angle) * r.len * 0.5)
    ctx.stroke()
  }
  ctx.restore()
}

function drawLandRegion(world, ctx) {
  drawGrassFill(ctx, WATER_BOUNDARY_X, 0, WORLD_W - WATER_BOUNDARY_X, WORLD_H)

  const wind = Math.sin(world.globalTick * 0.0014)
  const fade = dawnAlpha(world)
  if (fade < 1 && world.prevMeadowMarks.length > 0) {
    drawBlades(ctx, world.prevMeadowMarks, wind, 1 - fade)
    drawFlowerList(ctx, world.prevFlowers, 1 - fade)
  }
  drawBlades(ctx, world.meadowMarks, wind, fade)
  drawFlowerList(ctx, world.flowers, fade)
  applyPhaseTint(world, ctx)
}

function applyPhaseTint(world, ctx) {
  if (world.phase !== 'day') {
    return
  }
  const dayProgress = world.phaseTick / BALANCE.DAY_LENGTH
  const EDGE = 0.15
  let t = 0
  if (dayProgress > 1 - EDGE) {
    t = (dayProgress - (1 - EDGE)) / EDGE
  }
  else if (dayProgress < EDGE) {
    t = 1 - dayProgress / EDGE
  }
  if (t > 0) {
    ctx.fillStyle = `rgba(220, 130, 60, ${t * 0.18})`
    ctx.fillRect(WATER_BOUNDARY_X, 0, WORLD_W - WATER_BOUNDARY_X, WORLD_H)
    ctx.fillStyle = `rgba(180, 110, 60, ${t * 0.10})`
    ctx.fillRect(0, 0, WATER_BOUNDARY_X, WORLD_H)
  }
}

function drawBlades(ctx, marks, wind, alphaScale) {
  ctx.save()
  ctx.lineCap = 'round'
  for (const blade of marks) {
    const a = blade.alpha * alphaScale
    if (a < 0.02) {
      continue
    }
    if (!isNearCamera(blade.x, blade.y, blade.len + 4)) {
      continue
    }
    const dark = blade.dark
    ctx.strokeStyle = dark
      ? `rgba(48, 70, 28, ${a})`
      : `rgba(160, 188, 110, ${a * 0.85})`
    ctx.lineWidth = dark ? 1.2 : 1
    const angle = blade.angle + wind * 0.22 * blade.sway
    ctx.beginPath()
    ctx.moveTo(blade.x, blade.y)
    ctx.lineTo(
      blade.x + Math.cos(angle - Math.PI / 2) * blade.len,
      blade.y + Math.sin(angle - Math.PI / 2) * blade.len,
    )
    ctx.stroke()
  }
  ctx.restore()
}

function drawFlowerList(ctx, list, alphaScale) {
  if (alphaScale < 0.03) {
    return
  }
  ctx.save()
  ctx.globalAlpha = alphaScale
  for (const f of list) {
    if (!isNearCamera(f.x, f.y, 12)) {
      continue
    }
    ctx.fillStyle = f.color
    ctx.beginPath()
    ctx.arc(f.x, f.y, f.r, 0, TAU)
    ctx.fill()
  }
  ctx.restore()
}

const POND_OUTLINE_SAMPLES = 30

function ensurePondOutline(pond) {
  if (pond._outline) {
    return pond._outline
  }
  const outline = new Float32Array(POND_OUTLINE_SAMPLES)
  for (let i = 0; i < POND_OUTLINE_SAMPLES; i++) {
    const a = (i / POND_OUTLINE_SAMPLES) * TAU
    outline[i] =
      1.0 +
      Math.sin(a * 2 + pond.seed) * 0.07 +
      Math.sin(a * 5 + pond.seed * 1.7) * 0.04
  }
  pond._outline = outline
  return outline
}

function pondShapePath(ctx, pond, outline, scale) {
  for (let i = 0; i < POND_OUTLINE_SAMPLES; i++) {
    const a = (i / POND_OUTLINE_SAMPLES) * TAU
    const rr = pond.r * outline[i] * scale
    const px = pond.x + Math.cos(a) * rr
    const py = pond.y + Math.sin(a) * rr
    if (i === 0) {
      ctx.moveTo(px, py)
    }
    else {
      ctx.lineTo(px, py)
    }
  }
  ctx.closePath()
}

function drawPonds(world, ctx) {
  if (!world.ponds || world.ponds.length === 0) {
    return
  }
  ctx.save()
  for (const p of world.ponds) {
    if (!isNearCamera(p.x, p.y, p.r * 1.4)) {
      continue
    }
    drawPond(ctx, world, p)
  }
  ctx.restore()
}

function drawPond(ctx, world, pond) {
  const outline = ensurePondOutline(pond)

  // Water fill.
  ctx.fillStyle = COLORS.waterBase
  ctx.beginPath()
  pondShapePath(ctx, pond, outline, 1.0)
  ctx.fill()

  // Sandy shore — two passes of stroke on the pond path, matching the
  // ocean's drawShorelineSandBand approach. Wider/fainter band + a
  // narrower/denser band centered on the same edge. No outer shadow,
  // no halo gradient, no wet-sand rim — same recipe as the ocean.
  ctx.lineJoin = 'round'
  ctx.beginPath()
  pondShapePath(ctx, pond, outline, 1.0)
  ctx.strokeStyle = 'rgba(220, 200, 150, 0.16)'
  ctx.lineWidth = 26
  ctx.stroke()
  ctx.beginPath()
  pondShapePath(ctx, pond, outline, 1.0)
  ctx.strokeStyle = 'rgba(230, 210, 160, 0.36)'
  ctx.lineWidth = 12
  ctx.stroke()
  const grad = ctx.createRadialGradient(
    pond.x - pond.r * 0.25, pond.y - pond.r * 0.25, pond.r * 0.1,
    pond.x, pond.y, pond.r,
  )
  grad.addColorStop(0, 'rgba(180, 220, 240, 0.18)')
  grad.addColorStop(0.7, 'rgba(60, 110, 150, 0)')
  grad.addColorStop(1, 'rgba(10, 30, 50, 0.34)')
  ctx.fillStyle = grad
  ctx.beginPath()
  pondShapePath(ctx, pond, outline, 1.0)
  ctx.fill()
  ctx.save()
  ctx.beginPath()
  pondShapePath(ctx, pond, outline, 1.0)
  ctx.clip()
  const wind = Math.sin(world.globalTick * 0.0014)
  const seed = Math.floor(pond.x + pond.y * 13)
  const rippleCount = Math.max(4, Math.floor(pond.r / 18))
  ctx.strokeStyle = 'rgba(220, 235, 245, 0.30)'
  ctx.lineCap = 'round'
  ctx.lineWidth = 1
  for (let i = 0; i < rippleCount; i++) {
    const a = (Math.sin(seed + i * 17.3) + 1) * Math.PI
    const dist = (Math.sin(seed + i * 7.1) * 0.5 + 0.5) * pond.r * 0.85
    const cx = pond.x + Math.cos(a) * dist
    const cy = pond.y + Math.sin(a) * dist
    const len = 6 + (Math.sin(seed + i * 3.7) + 1) * 4
    const ang = wind * 0.3 + Math.sin(seed + i * 1.1) * 0.3
    ctx.beginPath()
    ctx.moveTo(cx - Math.cos(ang) * len * 0.5, cy - Math.sin(ang) * len * 0.5)
    ctx.lineTo(cx + Math.cos(ang) * len * 0.5, cy + Math.sin(ang) * len * 0.5)
    ctx.stroke()
  }
  ctx.restore()
}

function shorelineCurve(segments) {
  const dy = WORLD_H / segments
  const pts = new Array(segments + 1)
  for (let i = 0; i <= segments; i++) {
    const y = i * dy
    const wobble =
      Math.sin(y * 0.0042 + 0.5) * 9 +
      Math.sin(y * 0.0125 + 2.1) * 4 +
      Math.sin(y * 0.0290 + 5.7) * 2
    pts[i] = { x: WATER_BOUNDARY_X + wobble, y }
  }
  return pts
}

function drawCoastline(ctx) {
  const segments = 80
  const pts = shorelineCurve(segments)
  const stripHalf = 18

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(WATER_BOUNDARY_X - stripHalf, 0)
  for (let i = 0; i <= segments; i++) {
    ctx.lineTo(pts[i].x, pts[i].y)
  }
  ctx.lineTo(WATER_BOUNDARY_X - stripHalf, WORLD_H)
  ctx.closePath()
  ctx.fillStyle = COLORS.waterBase
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(WATER_BOUNDARY_X + stripHalf, 0)
  for (let i = 0; i <= segments; i++) {
    ctx.lineTo(pts[i].x, pts[i].y)
  }
  ctx.lineTo(WATER_BOUNDARY_X + stripHalf, WORLD_H)
  ctx.closePath()
  ctx.fillStyle = COLORS.grassBase
  ctx.fill()
  ctx.restore()

  // 3) Feathered sand band along the wavy curve — two passes (wider/
  //    fainter + narrower/denser) gives the soft fade-in/out without
  //    needing a gradient clipped to the wavy strip.
  drawShorelineSandBand(ctx, pts, 13, 'rgba(220, 200, 150, 0.16)')
  drawShorelineSandBand(ctx, pts, 6, 'rgba(230, 210, 160, 0.36)')
}

function drawShorelineSandBand(ctx, pts, half, fillStyle) {
  ctx.save()
  ctx.beginPath()
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    if (i === 0) {
      ctx.moveTo(p.x - half, p.y)
    }
    else {
      ctx.lineTo(p.x - half, p.y)
    }
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    ctx.lineTo(p.x + half, p.y)
  }
  ctx.closePath()
  ctx.fillStyle = fillStyle
  ctx.fill()
  ctx.restore()
}

const TREE_SHAPE_ROUND_BUSH = { bumps: 6, distRatio: 0.55, rrBase: 0.40, rrVar: 0.06, centerR: 0.62, angleJitter: 0.25, sx: 1.0, sy: 1.0 }
const TREE_SHAPES_LAND = [
  TREE_SHAPE_ROUND_BUSH,
  { bumps: 8, distRatio: 0.54, rrBase: 0.36, rrVar: 0.10, centerR: 0.56, angleJitter: 0.40, sx: 1.0, sy: 1.0 },
  { bumps: 4, distRatio: 0.50, rrBase: 0.50, rrVar: 0.06, centerR: 0.72, angleJitter: 0.20, sx: 1.0, sy: 1.0 },
]
const TREE_SHAPES_WATER = [
  TREE_SHAPE_ROUND_BUSH,
  { bumps: 10, distRatio: 0.42, rrBase: 0.26, rrVar: 0.08, centerR: 0.56, angleJitter: 0.30, sx: 1.0, sy: 1.0 },
  { bumps: 7, distRatio: 0.60, rrBase: 0.32, rrVar: 0.10, centerR: 0.50, angleJitter: 0.35, sx: 1.15, sy: 0.85 },
]

function treeShape(seed, biome) {
  const variants = biome === 'water' ? TREE_SHAPES_WATER : TREE_SHAPES_LAND
  const h = Math.floor(Math.abs(Math.sin(seed * 12.91) * 10000)) % variants.length
  return variants[h]
}

function drawTrees(world, ctx) {
  // Tree fades are per-tree now (driven by birthTick / deathTick on the
  // tree itself), so all four lists are drawn unconditionally and each
  // tree decides its own alpha / scale based on its age.
  drawTreeList(ctx, world.prevLandTrees, world.globalTick, true)
  drawTreeList(ctx, world.prevWaterTrees, world.globalTick, true)
  drawTreeList(ctx, world.landTrees, world.globalTick, false)
  drawTreeList(ctx, world.waterTrees, world.globalTick, false)
}

const WATER_TREE_PALETTE = { dark: COLORS.kelpLeafDark, fill: COLORS.kelpLeaf }
const LAND_TREE_PALETTE = { dark: COLORS.treeLeafDark, fill: COLORS.treeLeaf }

// Smoothstep-style ease so the fade isn't a hard linear ramp.
function smoothEase(t) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return t * t * (3 - 2 * t)
}

function treeRenderEnvelope(tree, globalTick, dying) {
  const fadeTicks = BALANCE.TREE_FADE_TICKS
  if (dying) {
    const age = globalTick - (tree.deathTick || 0)
    if (age >= fadeTicks) {
      return null
    }
    const t = smoothEase(1 - age / fadeTicks)
    return { alpha: t, scale: 0.85 + 0.15 * t }
  }
  const birth = tree.birthTick || 0
  if (birth <= 0) {
    return { alpha: 1, scale: 1 }
  }
  const age = globalTick - birth
  if (age >= fadeTicks) {
    return { alpha: 1, scale: 1 }
  }
  const t = smoothEase(Math.max(0, age / fadeTicks))
  return { alpha: t, scale: 0.85 + 0.15 * t }
}

function drawTreeList(ctx, treeList, globalTick, dying) {
  for (const tree of treeList) {
    const env = treeRenderEnvelope(tree, globalTick, dying)
    if (!env) {
      continue
    }
    if (!isNearCamera(tree.x, tree.y, tree.r * 1.7)) {
      continue
    }
    ctx.save()
    ctx.globalAlpha = env.alpha
    const isWater = tree.biome === 'water'
    const drawn = env.scale === 1
      ? tree
      : { ...tree, r: tree.r * env.scale }
    drawTopDownTree(ctx, drawn, isWater ? WATER_TREE_PALETTE : LAND_TREE_PALETTE, isWater ? 'water' : 'land')
    ctx.restore()
  }
}

export function drawTopDownTree(ctx, tree, palette, biome = 'land') {
  const shape = treeShape(tree.seed, biome)
  const isWater = biome === 'water'

  if (isWater) {
    ctx.fillStyle = 'rgba(120, 200, 215, 0.12)'
    ctx.beginPath()
    ctx.arc(tree.x, tree.y, tree.r * 1.34, 0, TAU)
    ctx.fill()
  }

  ctx.fillStyle = isWater ? 'rgba(8, 28, 50, 0.34)' : 'rgba(20, 30, 12, 0.32)'
  ctx.beginPath()
  ctx.arc(tree.x + tree.r * 0.16, tree.y + tree.r * 0.20, tree.r * 1.05, 0, TAU)
  ctx.fill()

  ctx.fillStyle = palette.dark
  treeBumpsPath(ctx, tree, 1.06, shape)
  ctx.fill()

  ctx.fillStyle = palette.fill
  treeBumpsPath(ctx, tree, 0.92, shape)
  ctx.fill()

  if (isWater) {
    ctx.fillStyle = COLORS.kelpLeafLight
    waterHighlightBumps(ctx, tree)
    ctx.fill()
  }
}

function waterHighlightBumps(ctx, tree) {
  const baseR = tree.r * 0.92
  ctx.beginPath()
  for (let i = 0; i < 3; i++) {
    const seedOffset = tree.seed + i * 41.7
    // Bias toward upper-left so highlights read as a consistent light
    // direction across the cluster.
    const angle = -Math.PI * 0.7 + Math.sin(seedOffset) * 0.55
    const dist = baseR * (0.32 + 0.14 * Math.sin(seedOffset * 1.3))
    const rr = baseR * (0.15 + 0.05 * Math.sin(seedOffset * 2.1))
    const cx = tree.x + Math.cos(angle) * dist
    const cy = tree.y + Math.sin(angle) * dist
    ctx.moveTo(cx + rr, cy)
    ctx.arc(cx, cy, rr, 0, TAU)
  }
}

function treeBumpsPath(ctx, tree, scale, shape) {
  const { bumps, distRatio, rrBase, rrVar, centerR, angleJitter, sx, sy } = shape
  const baseR = tree.r * scale
  ctx.beginPath()
  ctx.moveTo(tree.x + baseR * centerR * sx, tree.y)
  ctx.ellipse(tree.x, tree.y, baseR * centerR * sx, baseR * centerR * sy, 0, 0, TAU)
  for (let i = 0; i < bumps; i++) {
    const seedOffset = tree.seed + i * 73.137
    const angle = (i / bumps) * TAU + Math.sin(seedOffset) * angleJitter
    const dist = baseR * distRatio
    const rr = baseR * (rrBase + rrVar * Math.sin(seedOffset * 1.7))
    const cx = tree.x + Math.cos(angle) * dist * sx
    const cy = tree.y + Math.sin(angle) * dist * sy
    ctx.moveTo(cx + rr, cy)
    ctx.arc(cx, cy, rr, 0, TAU)
  }
}

function drawRocks(world, ctx) {
  const fade = dawnAlpha(world)
  if (fade < 1 && world.prevRocks && world.prevRocks.length > 0) {
    drawRockList(ctx, world.prevRocks, 1 - fade)
  }
  drawRockList(ctx, world.rocks, fade)
}

function drawRockList(ctx, rocks, alphaScale) {
  if (alphaScale < 0.03) {
    return
  }
  ctx.save()
  ctx.globalAlpha = alphaScale
  for (const rock of rocks) {
    if (!isNearCamera(rock.x, rock.y, rock.r * 1.6)) {
      continue
    }
    drawRock(ctx, rock)
  }
  ctx.restore()
}

function drawRock(ctx, rock) {
  const wet = rock.biome === 'water'
  const shadow = wet ? 'rgba(8, 18, 28, 0.22)' : 'rgba(20, 30, 12, 0.30)'
  const darkFill = wet ? COLORS.rockDarkWet : COLORS.rockDark
  const lightFill = wet ? COLORS.rockLightWet : COLORS.rockLight
  const rx = rock.r * rock.ratio
  const ry = rock.r
  ctx.fillStyle = shadow
  ctx.beginPath()
  ctx.ellipse(rock.x + rock.r * 0.18, rock.y + rock.r * 0.22, rx * 1.05, ry * 1.05, rock.angle, 0, TAU)
  ctx.fill()
  ctx.fillStyle = darkFill
  ctx.beginPath()
  ctx.ellipse(rock.x, rock.y, rx, ry, rock.angle, 0, TAU)
  ctx.fill()
  ctx.fillStyle = lightFill
  ctx.beginPath()
  ctx.ellipse(rock.x - rock.r * 0.10, rock.y - rock.r * 0.10, rx * 0.74, ry * 0.74, rock.angle, 0, TAU)
  ctx.fill()
}

const LILY_NOTCH_HALF = Math.PI * 0.08

function drawLilypads(world, ctx) {
  const fade = dawnAlpha(world)
  if (fade < 1 && world.prevLilypads && world.prevLilypads.length > 0) {
    drawLilypadList(ctx, world.prevLilypads, 1 - fade)
  }
  drawLilypadList(ctx, world.lilypads, fade)
}

function drawLilypadList(ctx, pads, alphaScale) {
  if (alphaScale < 0.03 || !pads || pads.length === 0) {
    return
  }
  ctx.save()
  ctx.globalAlpha = alphaScale
  for (const p of pads) {
    if (!isNearCamera(p.x, p.y, p.r * 1.4)) {
      continue
    }
    drawLilypad(ctx, p)
  }
  ctx.restore()
}

function lilypadPath(ctx, x, y, r, angle) {
  const startA = angle + LILY_NOTCH_HALF
  const endA = angle + Math.PI * 2 - LILY_NOTCH_HALF
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + r * Math.cos(startA), y + r * Math.sin(startA))
  ctx.arc(x, y, r, startA, endA, false)
  ctx.closePath()
}


function drawLilypad(ctx, pad) {
  ctx.fillStyle = 'rgba(8, 24, 44, 0.26)'
  lilypadPath(ctx, pad.x + pad.r * 0.10, pad.y + pad.r * 0.14, pad.r * 1.02, pad.angle)
  ctx.fill()
  ctx.fillStyle = LILY_PAD_DARK
  lilypadPath(ctx, pad.x, pad.y, pad.r, pad.angle)
  ctx.fill()
  ctx.fillStyle = LILY_PAD_FILL
  lilypadPath(ctx, pad.x, pad.y, pad.r * 0.84, pad.angle)
  ctx.fill()
  if (pad.flowerIndex >= 0) {
    const flower = LILY_FLOWER_COLORS[pad.flowerIndex] || LILY_FLOWER_COLORS[0]
    const fAngle = pad.angle + Math.PI
    const fx = pad.x + Math.cos(fAngle) * pad.r * 0.28
    const fy = pad.y + Math.sin(fAngle) * pad.r * 0.28
    const fr = pad.r * 0.22
    ctx.fillStyle = flower.dark
    ctx.beginPath()
    ctx.arc(fx, fy, fr, 0, TAU)
    ctx.fill()
    ctx.fillStyle = flower.light
    ctx.beginPath()
    ctx.arc(fx, fy, fr * 0.6, 0, TAU)
    ctx.fill()
  }
}

function drawVignette(ctx) {
  const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.34, W / 2, H / 2, Math.max(W, H) * 0.78)
  grad.addColorStop(0, 'rgba(20, 32, 12, 0)')
  grad.addColorStop(1, 'rgba(20, 32, 12, 0.48)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)
}

function ensureStarField() {
  if (starField.length > 0) {
    return
  }
  for (let i = 0; i < 110; i++) {
    starField.push({
      x: Math.random() * W,
      y: Math.random() * H * 0.7,
      r: rand(0.6, 1.6),
      twinkle: Math.random() * TAU,
      phase: rand(0.012, 0.04),
    })
  }
}

function drawNightOverlay(world, ctx) {
  if (world.phase !== 'night') {
    return
  }
  if (renderOptions.simSpeed > SKIP_NIGHT_OVERLAY_ABOVE_SPEED) {
    return
  }
  ensureStarField()
  const RAMP = Math.min(60, BALANCE.NIGHT_LENGTH * 0.35)
  const fadeIn = Math.min(1, world.phaseTick / RAMP)
  const fadeOut = Math.min(1, (BALANCE.NIGHT_LENGTH - world.phaseTick) / RAMP)
  const fade = Math.min(fadeIn, fadeOut)
  const baseAlpha = world.config.nightEnabled ? 0.6 : 0.22
  const alpha = baseAlpha * fade
  const warmAlpha = (1 - fade) * 0.18
  if (warmAlpha > 0.001) {
    ctx.fillStyle = `rgba(220, 130, 60, ${warmAlpha})`
    ctx.fillRect(0, 0, W, H)
  }
  const tintGrad = ctx.createRadialGradient(W * 0.7, H * 0.3, 80, W / 2, H / 2, Math.max(W, H) * 0.85)
  tintGrad.addColorStop(0, `rgba(38, 52, 92, ${alpha * 0.7})`)
  tintGrad.addColorStop(1, `rgba(10, 16, 38, ${alpha})`)
  ctx.fillStyle = tintGrad
  ctx.fillRect(0, 0, W, H)
  if (world.config.nightEnabled) {
    ctx.save()
    for (const star of starField) {
      const a = 0.55 + 0.4 * Math.sin(world.globalTick * star.phase + star.twinkle)
      ctx.fillStyle = `rgba(245, 248, 220, ${a * 0.7 * fade})`
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.r, 0, TAU)
      ctx.fill()
    }
    ctx.restore()
  }
  ctx.save()
  ctx.fillStyle = `rgba(248, 250, 239, ${0.92 * fade})`
  ctx.font = '850 28px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.shadowColor = `rgba(8, 14, 32, ${0.7 * fade})`
  ctx.shadowBlur = 16
  ctx.fillText(
    `Éjszaka: ${world.nightStats.survived} túlélő · ${world.nightStats.born} utód · ${world.nightStats.died} kieső`,
    W / 2, H - 86,
  )
  let extra = ''
  if (world.nightStats.denied > 0) {
    extra += `${world.nightStats.denied} szaporodás blokkolva`
  }
  if (world.nightStats.invasives > 0) {
    extra += (extra ? ' · ' : '') + `${world.nightStats.invasives} vándorló`
  }
  if (extra) {
    ctx.font = '800 16px Inter, sans-serif'
    ctx.fillText(extra, W / 2, H - 60)
  }
  ctx.restore()
}

// === Food ===

function drawFood(world, ctx) {
  for (const item of world.food) {
    if (!isNearCamera(item.x, item.y, item.r * 4)) {
      continue
    }
    drawFruit(ctx, item)
  }
}

export function drawFruit(ctx, item) {
  ctx.fillStyle = 'rgba(20, 30, 12, 0.30)'
  ctx.beginPath()
  ctx.ellipse(item.x + 1, item.y + item.r * 0.45, item.r * 1.0, item.r * 0.36, 0, 0, TAU)
  ctx.fill()
  ctx.fillStyle = item.color
  ctx.beginPath()
  ctx.arc(item.x, item.y, item.r, 0, TAU)
  ctx.fill()
  ctx.strokeStyle = item.color === COLORS.foodRed ? '#9c2418' : '#a87715'
  ctx.lineWidth = 0.8
  ctx.stroke()
}

export function rayColor(type, alpha) {
  if (type === SENSE.tree) {
    return `rgba(72, 126, 62, ${alpha})`
  }
  if (type === SENSE.food) {
    return `rgba(211, 154, 47, ${alpha})`
  }
  if (type === SENSE.prey) {
    return `rgba(213, 111, 58, ${alpha})`
  }
  if (type === SENSE.other) {
    return `rgba(76, 116, 180, ${alpha})`
  }
  if (type === SENSE.threat) {
    return `rgba(188, 73, 65, ${alpha})`
  }
  return `rgba(38, 50, 37, ${alpha * 0.32})`
}

function stampTrailDot(ctx, x, y, t, hue, sizeScale, alphaScale) {
  const sScale = sizeScale || 1
  const aScale = alphaScale || 1
  ctx.fillStyle = `hsla(${hue}, 60%, 45%, ${(0.05 + t * 0.16) * aScale})`
  ctx.beginPath()
  ctx.arc(x, y, (1.6 + t * 3.2) * sScale, 0, TAU)
  ctx.fill()
}

function drawTrail(ctx, creature) {
  const len = creature._trailLength
  if (!renderOptions.showTrails || len < 2) {
    return
  }
  const hue = traitHue(creature.genome)
  const cap = creature._trailX.length
  const start = (creature._trailIndex - len + cap) % cap
  const xs = creature._trailX
  const ys = creature._trailY
  for (let i = 0; i < len; i++) {
    const slot = (start + i) % cap
    const x = xs[slot]
    const y = ys[slot]
    if (!isNearCamera(x, y, 12)) {
      continue
    }
    stampTrailDot(ctx, x, y, i / len, hue)
  }
}

export function drawTrailDots(ctx, points, genome, opts) {
  if (!points || points.length < 2) {
    return
  }
  const o = opts || {}
  const hue = traitHue(genome)
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    stampTrailDot(ctx, p.x, p.y, i / points.length, hue, o.sizeScale, o.alphaScale)
  }
}

function drawCreatures(world, ctx) {
  const focus = focusCreature(world)
  if (focus) {
    drawTrail(ctx, focus)
  }
  for (const c of world.creatures) {
    if (c !== focus) {
      drawCreature(ctx, c, false)
    }
  }
  if (focus) {
    drawCreature(ctx, focus, true)
  }
}

function drawCreature(ctx, creature, focused) {
  const r = creature._radius
  if (!focused && !isNearCamera(creature.x, creature.y, r + 12)) {
    return
  }
  const showSel = focused && renderOptions.showSelectionView
  drawCreatureSprite(ctx, creature.x, creature.y, creature.angle, r, creature.genome, {
    sleeping: creature.sleeping,
    knockedOut: creature.knockedOut,
    burstState: creature.burstState,
    koImmunity: creature.koImmunity,
    lastKoDuration: creature.lastKoDuration,
    blockedPulse: creature.blockedPulse,
    focused: showSel,
    showForageZone: showSel,
  })
  if (renderOptions.showLabels || showSel) {
    drawCreatureLabel(ctx, creature, showSel)
  }
}

export function drawCreatureSprite(ctx, cx, cy, angle, r, genome, opts) {
  const o = opts || {}
  const g = genome
  const hue = traitHue(g)
  const sat = traitSat(g)
  const light = traitLight(g)

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)

  const halfL = r
  const halfW = r * 0.78
  const corner = cornerRadius(g, halfW)

  ctx.fillStyle = 'rgba(20, 30, 12, 0.28)'
  ctx.beginPath()
  ctx.roundRect(-halfL + 1.4, -halfW + r * 0.30, halfL * 2, halfW * 2, corner)
  ctx.fill()

  const fur = furAmount(g)
  if (fur > 0.05) {
    const spikeCount = 22
    // Slightly longer spikes (was 0.32) so the furry silhouette reads
    // from further away. The spike base width / inset stays the same,
    // so close-up the look is unchanged — only the tip extends a bit.
    const spikeLen = halfW * 0.55 * fur
    const baseAngularHalf = (TAU / spikeCount) * 0.50
    const baseInsetR = 0.85
    ctx.fillStyle = `hsl(${hue}, ${Math.max(40, sat - 10)}%, ${Math.max(18, light - 22)}%)`
    ctx.beginPath()
    for (let i = 0; i < spikeCount; i++) {
      const a = (i / spikeCount) * TAU
      const aL = a - baseAngularHalf
      const aR = a + baseAngularHalf
      const tCenter = projectAngleToRect(a, halfL, halfW)
      const tL = projectAngleToRect(aL, halfL, halfW)
      const tR = projectAngleToRect(aR, halfL, halfW)
      ctx.moveTo(Math.cos(aL) * tL * baseInsetR, Math.sin(aL) * tL * baseInsetR)
      ctx.lineTo(Math.cos(a) * (tCenter + spikeLen), Math.sin(a) * (tCenter + spikeLen))
      ctx.lineTo(Math.cos(aR) * tR * baseInsetR, Math.sin(aR) * tR * baseInsetR)
    }
    ctx.fill()
  }

  ctx.beginPath()
  ctx.roundRect(-halfL, -halfW, halfL * 2, halfW * 2, corner)
  ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`
  ctx.fill()

  if (o.burstState === 'recovery') {
    ctx.fillStyle = 'rgba(20, 28, 14, 0.18)'
    ctx.fill()
  }

  ctx.lineWidth = bodyOutlineWidth(g, o.focused)
  ctx.strokeStyle = o.focused
    ? COLORS.ink
    : `hsl(${hue}, ${sat}%, ${Math.max(16, light - 28)}%)`
  ctx.stroke()

  if (!o.sleeping && !o.knockedOut) {
    const eyeR = eyeRadius(g, r)
    const sideOffset = BALANCE.RAY_BASE_SIDE_OFFSET + (1 - g.focus) * BALANCE.RAY_FOCUS_SIDE_SPREAD
    const eyes = eyeCount(g)
    const orbitX = halfL * 0.62
    const orbitY = halfW * 0.62
    let eyeAngles
    if (eyes === 1) {
      eyeAngles = [0]
    }
    else if (eyes === 2) {
      eyeAngles = [-sideOffset * 0.5, sideOffset * 0.5]
    }
    else {
      eyeAngles = [0, -sideOffset, sideOffset]
    }
    for (const a of eyeAngles) {
      const ex = orbitX * Math.cos(a)
      const ey = orbitY * Math.sin(a)
      ctx.fillStyle = '#f5f7e8'
      ctx.beginPath()
      ctx.arc(ex, ey, eyeR, 0, TAU)
      ctx.fill()
      ctx.fillStyle = '#15170d'
      ctx.beginPath()
      ctx.arc(ex + Math.cos(a) * eyeR * 0.30, ey + Math.sin(a) * eyeR * 0.30, eyeR * 0.55, 0, TAU)
      ctx.fill()
    }
  } else if (o.sleeping) {
    drawSleepLines(ctx, r)
  } else {
    drawKOLines(ctx, r)
  }

  if (o.koImmunity > 0) {
    const span = Math.max(1, o.lastKoDuration * 0.75)
    const remaining = o.koImmunity / span
    const alpha = 0.30 + 0.45 * Math.min(1, remaining)
    const ringR = Math.max(halfL, halfW) + 4
    ctx.strokeStyle = `rgba(114, 207, 255, ${alpha})`
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.arc(0, 0, ringR, 0, TAU)
    ctx.stroke()
  }

  if (o.blockedPulse > 0) {
    ctx.strokeStyle = `rgba(188, 73, 65, ${Math.min(0.85, o.blockedPulse / 90)})`
    ctx.lineWidth = 2.2
    ctx.beginPath()
    ctx.roundRect(-halfL - 2, -halfW - 2, halfL * 2 + 4, halfW * 2 + 4, corner + 1)
    ctx.stroke()
  }

  if (o.showForageZone) {
    const forageR = forageZoneRadius(g, r)
    ctx.strokeStyle = 'rgba(78, 197, 184, 0.55)'
    ctx.lineWidth = 1.2
    ctx.setLineDash([5, 4])
    ctx.beginPath()
    ctx.arc(0, 0, forageR, 0, TAU)
    ctx.stroke()
    ctx.setLineDash([])
  }

  ctx.restore()
}

function drawSleepLines(ctx, r) {
  ctx.strokeStyle = '#1a1f17'
  ctx.lineWidth = 2.2
  ctx.lineCap = 'round'
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(r * 0.28, side * r * 0.28)
    ctx.lineTo(r * 0.54, side * r * 0.28)
    ctx.stroke()
  }
}

function drawKOLines(ctx, r) {
  ctx.strokeStyle = '#1a1f17'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(r * 0.28, side * r * 0.2)
    ctx.lineTo(r * 0.52, side * r * 0.42)
    ctx.moveTo(r * 0.52, side * r * 0.2)
    ctx.lineTo(r * 0.28, side * r * 0.42)
    ctx.stroke()
  }
}

function drawCreatureLabel(ctx, creature, focused) {
  const g = creature.genome
  const r = creature._radius
  const label = `#${creature.id}  F${creature.foodHeld}/${BALANCE.FOOD_CAP}  T${g.tank.toFixed(1)} V${g.vision.toFixed(1)} f${g.focus.toFixed(1)} B${g.burst.toFixed(1)} R${g.forage.toFixed(1)} W${g.water.toFixed(1)}`
  ctx.save()
  ctx.font = focused ? '800 13px Inter, sans-serif' : '750 10px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillStyle = focused ? COLORS.ink : 'rgba(38, 50, 37, 0.72)'
  ctx.fillText(label, creature.x, creature.y - r - 8)
  if (focused) {
    if (creature.knockedOut) {
      ctx.font = '800 16px Inter, sans-serif'
      ctx.fillText('KO', creature.x + r + 16, creature.y - r - 2)
    } else if (creature.sleeping) {
      ctx.font = '800 16px Inter, sans-serif'
      ctx.fillText('zzz', creature.x + r + 14, creature.y - r - 2)
    } else if (creature.burstState === 'burst') {
      ctx.font = '800 13px Inter, sans-serif'
      ctx.fillText('BURST', creature.x, creature.y - r - 22)
    }
  }
  ctx.restore()
}

function updateFollowCamera(world) {
  if (camera.followId === null) {
    return
  }
  const target = world.creatures.find((c) => c.id === camera.followId && c.alive)
  if (!target) {
    camera.followId = null
    return
  }
  centerCameraOn(target.x, target.y)
}

export function drawAll(world, ctx) {
  updateFollowCamera(world)
  updateKeyboardPan()
  clampCamera()
  useViewportTransform(ctx)
  ctx.clearRect(0, 0, W, H)

  ctx.save()
  useWorldTransform(ctx)
  drawWaterRegion(world, ctx)
  drawLandRegion(world, ctx)
  drawCoastline(ctx)
  drawPonds(world, ctx)
  drawRocks(world, ctx)
  drawLilypads(world, ctx)
  drawTrees(world, ctx)
  drawFood(world, ctx)
  drawCreatures(world, ctx)
  ctx.restore()

  useViewportTransform(ctx)
  drawVignette(ctx)
  drawNightOverlay(world, ctx)
}

export function drawTraitChart(world, chartCanvas, chartCtx) {
  if (!chartCtx) {
    return
  }
  if (world.day === chartLastDay && world.traitHistory.length === chartLastLen) {
    return
  }
  chartLastDay = world.day
  chartLastLen = world.traitHistory.length
  const cw = chartCanvas.width
  const ch = chartCanvas.height
  chartCtx.clearRect(0, 0, cw, ch)

  const bg = chartCtx.createLinearGradient(0, 0, 0, ch)
  bg.addColorStop(0, 'rgba(20, 32, 16, 0.85)')
  bg.addColorStop(1, 'rgba(12, 22, 10, 0.92)')
  chartCtx.fillStyle = bg
  chartCtx.fillRect(0, 0, cw, ch)

  chartCtx.strokeStyle = 'rgba(232, 240, 210, 0.10)'
  chartCtx.lineWidth = 1
  for (let i = 1; i < 4; i++) {
    const y = ch * (i / 4)
    chartCtx.beginPath()
    chartCtx.moveTo(0, y)
    chartCtx.lineTo(cw, y)
    chartCtx.stroke()
  }

  if (world.traitHistory.length < 2) {
    chartCtx.fillStyle = 'rgba(232, 240, 210, 0.45)'
    chartCtx.font = '700 11px Inter, sans-serif'
    chartCtx.textAlign = 'center'
    chartCtx.textBaseline = 'middle'
    chartCtx.fillText('Generációk gyűlnek...', cw / 2, ch / 2)
    return
  }

  const pts = world.traitHistory
  const xStep = cw / Math.max(1, pts.length - 1)

  for (const trait of TRAITS) {
    chartCtx.lineJoin = 'round'
    chartCtx.lineCap = 'round'
    chartCtx.save()
    chartCtx.shadowColor = TRAIT_COLORS[trait]
    chartCtx.shadowBlur = 6
    chartCtx.strokeStyle = TRAIT_COLORS[trait]
    chartCtx.lineWidth = 2.4
    chartCtx.beginPath()
    for (let i = 0; i < pts.length; i++) {
      const x = i * xStep
      const y = ch - pts[i][trait] * ch
      if (i === 0) {
        chartCtx.moveTo(x, y)
      }
      else {
        chartCtx.lineTo(x, y)
      }
    }
    chartCtx.stroke()
    chartCtx.restore()
  }

  chartCtx.fillStyle = 'rgba(232, 240, 210, 0.65)'
  chartCtx.font = '700 9px Inter, sans-serif'
  chartCtx.textAlign = 'left'
  chartCtx.textBaseline = 'top'
  chartCtx.fillText(`nap ${pts[0].day}`, 4, 3)
  chartCtx.textAlign = 'right'
  chartCtx.fillText(`nap ${pts[pts.length - 1].day}`, cw - 4, 3)
}

function beginCameraDrag(event) {
  if (event.button !== 0) {
    return
  }
  const point = screenToCanvasPoint(event, activeCanvas)
  camera.dragging = true
  camera.dragMoved = false
  camera.lastX = point.x
  camera.lastY = point.y
  camera.dragStartX = point.x
  camera.dragStartY = point.y
  activeCanvas.classList.add('is-panning')
  activeCanvas.setPointerCapture(event.pointerId)
  event.preventDefault()
  // preventDefault() above suppresses the implicit focus, so the canvas
  // (and the iframe it lives in) would never receive key events after a
  // click. Focus it explicitly so arrow/WASD panning works post-click.
  activeCanvas.focus()
}

function moveCameraDrag(event) {
  if (!camera.dragging) {
    return
  }
  const point = screenToCanvasPoint(event, activeCanvas)
  if (distSq(point.x, point.y, camera.dragStartX, camera.dragStartY) > 25) {
    camera.dragMoved = true
  }
  if (camera.followId !== null) {
    camera.followId = null
  }
  camera.x -= (point.x - camera.lastX) / camera.zoom
  camera.y -= (point.y - camera.lastY) / camera.zoom
  camera.lastX = point.x
  camera.lastY = point.y
  clampCamera()
  event.preventDefault()
}

function pickCreatureAt(event) {
  if (!activeWorld || !activeCanvas) {
    return null
  }
  const point = canvasToWorldPoint(screenToCanvasPoint(event, activeCanvas))
  const screenPickRadius = 28 / camera.zoom
  let best = null
  let bestDistSq = Infinity
  for (const c of activeWorld.creatures) {
    if (!c.alive) {
      continue
    }
    const pickRadius = Math.max(screenPickRadius, c._radius + 10)
    const dSq = distSq(point.x, point.y, c.x, c.y)
    if (dSq <= pickRadius * pickRadius && dSq < bestDistSq) {
      best = c
      bestDistSq = dSq
    }
  }
  return best
}

function handleClick(event) {
  const creature = pickCreatureAt(event)
  if (!creature) {
    return
  }
  setFocusOverride(creature.id)
  focusCachedId = creature.id
  focusCacheTick = activeWorld.globalTick
  if (renderOptions.followMode) {
    camera.followId = creature.id
    centerCameraOn(creature.x, creature.y)
  }
  if (onCreaturePick) {
    onCreaturePick(creature)
  }
}

function endCameraDrag(event) {
  if (!camera.dragging) {
    return
  }
  const wasClick = !camera.dragMoved
  camera.dragging = false
  activeCanvas.classList.remove('is-panning')
  if (activeCanvas.hasPointerCapture(event.pointerId)) {
    activeCanvas.releasePointerCapture(event.pointerId)
  }
  if (wasClick) {
    handleClick(event)
  }
}

// Arrow / WASD smooth panning. Keys set a flag; the actual movement
// happens once per frame in updateKeyboardPan() so the speed is tied to
// elapsed time (smooth, refresh-rate independent) rather than to the OS
// key-repeat rate.
const keyPan = { up: false, down: false, left: false, right: false }
let lastPanTs = 0

// Screen pixels per second at any zoom (divided by camera.zoom so the
// on-screen pan speed feels the same when zoomed in or out).
const KEY_PAN_SPEED = 450

const KEY_DIRS = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
}

function isTypingTarget(el) {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
}

function handleKeyDown(event) {
  const dir = KEY_DIRS[event.code]
  if (!dir || event.repeat || isTypingTarget(event.target)) {
    return
  }
  keyPan[dir] = true
  // Stop arrow keys from scrolling the page/iframe while panning.
  event.preventDefault()
}

function handleKeyUp(event) {
  const dir = KEY_DIRS[event.code]
  if (dir) {
    keyPan[dir] = false
  }
}

function clearKeyPan() {
  keyPan.up = keyPan.down = keyPan.left = keyPan.right = false
}

function updateKeyboardPan() {
  const now = performance.now()
  const dt = lastPanTs ? Math.min((now - lastPanTs) / 1000, 0.05) : 0
  lastPanTs = now

  let dx = (keyPan.right ? 1 : 0) - (keyPan.left ? 1 : 0)
  let dy = (keyPan.down ? 1 : 0) - (keyPan.up ? 1 : 0)
  if (dx === 0 && dy === 0) {
    return
  }
  // Normalize so diagonal panning isn't ~1.4× faster than straight.
  if (dx !== 0 && dy !== 0) {
    dx *= 0.7071
    dy *= 0.7071
  }
  // A keyboard pan is an explicit "look elsewhere" — drop any follow lock
  // so the camera doesn't fight the user (mirrors the drag behavior).
  if (camera.followId !== null) {
    camera.followId = null
  }
  const step = (KEY_PAN_SPEED * dt) / camera.zoom
  camera.x += dx * step
  camera.y += dy * step
}

export function bindCamera(canvas, world, creaturePickCallback) {
  activeCanvas = canvas
  activeWorld = world
  onCreaturePick = creaturePickCallback || null
  // A <canvas> isn't focusable by default, so canvas.focus() in
  // beginCameraDrag would be a no-op. tabIndex -1 makes it
  // programmatically focusable without adding it to the Tab order.
  if (!canvas.hasAttribute('tabindex')) {
    canvas.tabIndex = -1
  }
  canvas.style.outline = 'none'
  canvas.addEventListener('pointerdown', beginCameraDrag)
  canvas.addEventListener('pointermove', moveCameraDrag)
  canvas.addEventListener('pointerup', endCameraDrag)
  canvas.addEventListener('pointercancel', endCameraDrag)
  canvas.addEventListener('lostpointercapture', () => {
    camera.dragging = false
    camera.dragMoved = false
    canvas.classList.remove('is-panning')
  })
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  // Releasing focus (e.g. tabbing away) can swallow the keyup; clear
  // held state so the camera doesn't drift forever.
  window.addEventListener('blur', clearKeyPan)
}
