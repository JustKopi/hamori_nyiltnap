import {
  makeViews, SYNC_TICK, SYNC_DONE_COUNT, SYNC_POOL_SIZE, SYNC_SHUTDOWN,
  BRAIN_FLOATS, LAYER_W_OFFSET, LAYER_B_OFFSET,
  WCFG_WORLD_W, WCFG_WORLD_H, WCFG_WATER_BOUNDARY_X, WCFG_GRID_COLS, WCFG_GRID_ROWS,
  WCFG_POND_COUNT, WCFG_POND_DATA, MAX_PONDS,
  MAX_CREATURES, MAX_TREES, MAX_FOOD,
} from './sim-shared.js'
import { GRID_CELL } from './grid.js'
import { BALANCE, FOOD_RAY_PADDING } from './config.js'
import {
  TYPE_RAY_COUNT, TYPE_RAY_INPUTS, INPUT_SIZE, OUTPUT_SIZE,
  WALL_INPUT_INDEX, WATER_RAY_INPUT_INDEX, FOOD_LEFT_INPUT_INDEX,
  BURST_READY_INPUT_INDEX, X_INPUT_INDEX, Y_INPUT_INDEX,
  MEMORY_INPUT_START, RECURRENT_COUNT, BRAIN_LAYERS, SENSE,
  RAY_OFFSET_MULTIPLIERS,
} from './brain.js'

self.onerror = (event) => {
  console.error('[pool-worker] uncaught error:', event.message || event)
}

let workerIndex = 0
let views = null
let foodCap = 5
let worldW = 0, worldH = 0, waterBoundaryX = 0
let gridCols = 0, gridRows = 0
const pondX = new Float32Array(MAX_PONDS)
const pondY = new Float32Array(MAX_PONDS)
const pondR = new Float32Array(MAX_PONDS)
let pondCount = 0
const gridCell = GRID_CELL

const inputBuffer = new Float32Array(INPUT_SIZE)
const layerBuffers = []
for (let i = 1; i < BRAIN_LAYERS.length; i++) {
  layerBuffers.push(new Float32Array(BRAIN_LAYERS[i]))
}
const preyBuf = new Int32Array(MAX_CREATURES)
const otherBuf = new Int32Array(MAX_CREATURES)
const threatBuf = new Int32Array(MAX_CREATURES)
let preyCount = 0, otherCount = 0, threatCount = 0
const treeBuf = new Int32Array(MAX_TREES)
let treeBufCount = 0
const foodBuf = new Int32Array(MAX_FOOD)
let foodBufCount = 0
const rayDx = new Float32Array(TYPE_RAY_COUNT)
const rayDy = new Float32Array(TYPE_RAY_COUNT)

self.onmessage = (e) => {
  const msg = e.data
  try {
    if (msg.type === 'init') {
      workerIndex = msg.workerIndex
      views = makeViews(msg.sab)
      foodCap = msg.foodCap
      self.postMessage({ type: 'ready', workerIndex })
      runLoop()
    }
  } catch (err) {
    console.error('[pool-worker]', workerIndex, 'message handler threw:', err)
  }
}

function refreshWorldConfig() {
  const cfg = views.worldCfg
  worldW = cfg[WCFG_WORLD_W]
  worldH = cfg[WCFG_WORLD_H]
  waterBoundaryX = cfg[WCFG_WATER_BOUNDARY_X]
  gridCols = cfg[WCFG_GRID_COLS]
  gridRows = cfg[WCFG_GRID_ROWS]
  pondCount = cfg[WCFG_POND_COUNT] | 0
  for (let i = 0; i < pondCount; i++) {
    pondX[i] = cfg[WCFG_POND_DATA + i * 3 + 0]
    pondY[i] = cfg[WCFG_POND_DATA + i * 3 + 1]
    pondR[i] = cfg[WCFG_POND_DATA + i * 3 + 2]
  }
}

function isPointInAnyPond(x, y) {
  for (let i = 0; i < pondCount; i++) {
    const dx = x - pondX[i]
    const dy = y - pondY[i]
    if (dx * dx + dy * dy <= pondR[i] * pondR[i]) {
      return true
    }
  }
  return false
}

function runLoop() {
  let lastTick = 0
  for (;;) {
    Atomics.wait(views.sync, SYNC_TICK, lastTick)
    lastTick = Atomics.load(views.sync, SYNC_TICK)
    if (Atomics.load(views.sync, SYNC_SHUTDOWN) === 1) {
      return
    }

    try {
      processSlice()
    } catch (err) {
      console.error('[pool-worker]', workerIndex, 'processSlice threw:', err)
    }

    const done = Atomics.add(views.sync, SYNC_DONE_COUNT, 1) + 1
    const poolSize = Atomics.load(views.sync, SYNC_POOL_SIZE)
    if (done >= poolSize) {
      Atomics.notify(views.sync, SYNC_DONE_COUNT, 1)
    }
  }
}

function processSlice() {
  refreshWorldConfig()
  const activeCount = views.activeCount[0]
  const poolSize = Atomics.load(views.sync, SYNC_POOL_SIZE)
  for (let k = workerIndex; k < activeCount; k += poolSize) {
    const idx = views.activeIndices[k]
    senseAndPredict(idx)
  }
}

function senseAndPredict(idx) {
  const cx = views.cX[idx]
  const cy = views.cY[idx]
  const angle = views.cAngle[idx]
  const baseRange = views.cVisionRadius[idx]
  const sideOffset = views.cRaySideOffset[idx]
  const selfStrength = views.cStrength[idx]

  // Biome-specialized sight: in water, a creature sees at `genome.water`
  // of its base range; on land, at `1 - genome.water`. Mirrors the speed
  // model — coastal specialists see far in their element, hybrids see
  // mediocre in both. Floor of 0.1 so extreme specialists aren't fully
  // blind in the wrong biome.
  const inWaterHere = cx < waterBoundaryX || isPointInAnyPond(cx, cy)
  const water = views.cWater[idx]
  const sightMult = Math.max(0.1, inWaterHere ? water : 1 - water)
  const range = baseRange * sightMult

  const minCol = Math.max(0, Math.floor((cx - range) / gridCell))
  const maxCol = Math.min(gridCols - 1, Math.floor((cx + range) / gridCell))
  const minRow = Math.max(0, Math.floor((cy - range) / gridCell))
  const maxRow = Math.min(gridRows - 1, Math.floor((cy + range) / gridCell))
  const treeMinCol = Math.max(0, Math.floor((cx - range - 50) / gridCell))
  const treeMaxCol = Math.min(gridCols - 1, Math.floor((cx + range + 50) / gridCell))
  const treeMinRow = Math.max(0, Math.floor((cy - range - 50) / gridCell))
  const treeMaxRow = Math.min(gridRows - 1, Math.floor((cy + range + 50) / gridCell))

  const rangeSq = range * range
  preyCount = 0; otherCount = 0; threatCount = 0
  const cStarts = views.creatureCellStarts
  const cData = views.creatureCellData
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const cellIdx = row * gridCols + col
      const startO = cStarts[cellIdx]
      const endO = cStarts[cellIdx + 1]
      for (let k = startO; k < endO; k++) {
        const oIdx = cData[k]
        if (oIdx === idx) {
          continue
        }
        if (views.cAlive[oIdx] !== 1) {
          continue
        }
        const ox = views.cX[oIdx]
        const oy = views.cY[oIdx]
        const ddx = ox - cx, ddy = oy - cy
        if (ddx * ddx + ddy * ddy > rangeSq) {
          continue
        }
        const ratio = views.cStrength[oIdx] / selfStrength
        if (ratio <= 1 - BALANCE.CONTEST_THRESHOLD) {
          preyBuf[preyCount++] = oIdx
        } else if (ratio >= 1 + BALANCE.CONTEST_THRESHOLD) {
          threatBuf[threatCount++] = oIdx
        } else {
          otherBuf[otherCount++] = oIdx
        }
      }
    }
  }

  treeBufCount = 0
  const tStarts = views.treeCellStarts
  const tData = views.treeCellData
  for (let row = treeMinRow; row <= treeMaxRow; row++) {
    for (let col = treeMinCol; col <= treeMaxCol; col++) {
      const cellIdx = row * gridCols + col
      const startO = tStarts[cellIdx]
      const endO = tStarts[cellIdx + 1]
      for (let k = startO; k < endO; k++) {
        treeBuf[treeBufCount++] = tData[k]
      }
    }
  }

  foodBufCount = 0
  const fStarts = views.foodCellStarts
  const fData = views.foodCellData
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const cellIdx = row * gridCols + col
      const startO = fStarts[cellIdx]
      const endO = fStarts[cellIdx + 1]
      for (let k = startO; k < endO; k++) {
        foodBuf[foodBufCount++] = fData[k]
      }
    }
  }

  for (let i = 0; i < TYPE_RAY_INPUTS; i++) {
    inputBuffer[i] = 0
  }

  for (let r = 0; r < TYPE_RAY_COUNT; r++) {
    const a = angle + RAY_OFFSET_MULTIPLIERS[r] * sideOffset
    rayDx[r] = Math.cos(a)
    rayDy[r] = Math.sin(a)
  }

  for (let r = 0; r < TYPE_RAY_COUNT; r++) {
    let best = Infinity
    const dx = rayDx[r], dy = rayDy[r]
    for (let i = 0; i < treeBufCount; i++) {
      const tIdx = treeBuf[i]
      const tx = views.treeX[tIdx]
      const ty = views.treeY[tIdx]
      const tr = views.treeR[tIdx] * 0.72
      const d = rayCircleDistance(cx, cy, dx, dy, tx, ty, tr, range)
      if (d !== null && d < best) {
        best = d
      }
    }
    const slot = SENSE.tree * TYPE_RAY_COUNT + r
    inputBuffer[slot] = best === Infinity ? 0 : 1 - best / range
  }

  for (let r = 0; r < TYPE_RAY_COUNT; r++) {
    let best = Infinity
    const dx = rayDx[r], dy = rayDy[r]
    for (let i = 0; i < foodBufCount; i++) {
      const fIdx = foodBuf[i]
      const fx = views.foodX[fIdx]
      const fy = views.foodY[fIdx]
      const fr = views.foodR[fIdx] + FOOD_RAY_PADDING
      const d = rayCircleDistance(cx, cy, dx, dy, fx, fy, fr, range)
      if (d !== null && d < best) {
        best = d
      }
    }
    const slot = SENSE.food * TYPE_RAY_COUNT + r
    inputBuffer[slot] = best === Infinity ? 0 : 1 - best / range
  }

  for (let typeIdx = 0; typeIdx < 3; typeIdx++) {
    const senseType = typeIdx === 0 ? SENSE.prey : typeIdx === 1 ? SENSE.other : SENSE.threat
    const buf = typeIdx === 0 ? preyBuf : typeIdx === 1 ? otherBuf : threatBuf
    const count = typeIdx === 0 ? preyCount : typeIdx === 1 ? otherCount : threatCount
    for (let r = 0; r < TYPE_RAY_COUNT; r++) {
      let best = Infinity
      const dx = rayDx[r], dy = rayDy[r]
      for (let i = 0; i < count; i++) {
        const oIdx = buf[i]
        const ox = views.cX[oIdx]
        const oy = views.cY[oIdx]
        const orad = views.cRadius[oIdx] + 2
        const d = rayCircleDistance(cx, cy, dx, dy, ox, oy, orad, range)
        if (d !== null && d < best) {
          best = d
        }
      }
      const slot = senseType * TYPE_RAY_COUNT + r
      inputBuffer[slot] = best === Infinity ? 0 : 1 - best / range
    }
  }

  const wallDist = forwardWallDistance(cx, cy, angle, range)
  inputBuffer[WALL_INPUT_INDEX] = wallDist === null ? 0 : 1 - wallDist / range

  const waterDist = forwardWaterDistance(cx, angle, range)
  const sign = inWaterHere ? 1 : -1
  inputBuffer[WATER_RAY_INPUT_INDEX] = waterDist === null ? 0 : sign * (1 - waterDist / range)

  const foodHeld = views.cFoodHeld[idx]
  const foodLeft = Math.max(0, foodCap - foodHeld)
  inputBuffer[FOOD_LEFT_INPUT_INDEX] = foodLeft / foodCap
  inputBuffer[BURST_READY_INPUT_INDEX] = views.cBurstReady[idx]

  inputBuffer[X_INPUT_INDEX] = (cx / worldW) * 2 - 1
  inputBuffer[Y_INPUT_INDEX] = (cy / worldH) * 2 - 1

  for (let i = 0; i < RECURRENT_COUNT; i++) {
    inputBuffer[MEMORY_INPUT_START + i] = views.cMemory[idx * RECURRENT_COUNT + i]
  }

  predictBrainTo(idx)
}

function predictBrainTo(idx) {
  const brainBase = idx * BRAIN_FLOATS
  const cBrain = views.cBrain
  let activations = inputBuffer
  let inputCount = INPUT_SIZE
  for (let layer = 0; layer < BRAIN_LAYERS.length - 1; layer++) {
    const next = layerBuffers[layer]
    const outputCount = BRAIN_LAYERS[layer + 1]
    const wOff = brainBase + LAYER_W_OFFSET[layer]
    const bOff = brainBase + LAYER_B_OFFSET[layer]
    for (let out = 0; out < outputCount; out++) {
      let sum = cBrain[bOff + out]
      const offset = wOff + out * inputCount
      for (let i = 0; i < inputCount; i++) {
        sum += activations[i] * cBrain[offset + i]
      }
      next[out] = Math.tanh(sum)
    }
    activations = next
    inputCount = outputCount
  }
  const outBase = idx * OUTPUT_SIZE
  for (let i = 0; i < OUTPUT_SIZE; i++) {
    views.cOutput[outBase + i] = activations[i]
  }
}

function rayCircleDistance(ox, oy, dx, dy, cx, cy, radius, range) {
  const vx = cx - ox
  const vy = cy - oy
  const along = vx * dx + vy * dy
  if (along <= 0 || along > range) {
    return null
  }
  const sideSq = vx * vx + vy * vy - along * along
  const radiusSq = radius * radius
  if (sideSq > radiusSq) {
    return null
  }
  const offset = Math.sqrt(Math.max(0, radiusSq - sideSq))
  const d = along - offset
  if (d < 0) {
    return 0
  }
  if (d > range) {
    return range
  }
  return d
}

function forwardWallDistance(cx, cy, angle, range) {
  const dx = Math.cos(angle), dy = Math.sin(angle)
  const margin = BALANCE.WALL_MARGIN
  let nearest = Infinity
  if (dx > 0.0001) {
    const d = (worldW - margin - cx) / dx
    if (d > 0 && d < nearest) {
      nearest = d
    }
  } else if (dx < -0.0001) {
    const d = (margin - cx) / dx
    if (d > 0 && d < nearest) {
      nearest = d
    }
  }
  if (dy > 0.0001) {
    const d = (worldH - margin - cy) / dy
    if (d > 0 && d < nearest) {
      nearest = d
    }
  } else if (dy < -0.0001) {
    const d = (margin - cy) / dy
    if (d > 0 && d < nearest) {
      nearest = d
    }
  }
  if (!Number.isFinite(nearest) || nearest > range) {
    return null
  }
  return nearest
}

function forwardWaterDistance(cx, angle, range) {
  const dx = Math.cos(angle)
  if (Math.abs(dx) < 0.0001) {
    return null
  }
  const d = (waterBoundaryX - cx) / dx
  if (d <= 0 || d > range) {
    return null
  }
  return d
}
