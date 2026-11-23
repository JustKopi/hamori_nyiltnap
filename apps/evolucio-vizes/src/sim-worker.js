import { World } from './world.js'
import {
  setWorldScale, BASE_WORLD_SCALE, densityScaleFactor, BALANCE,
  WORLD_W, WORLD_H, WATER_BOUNDARY_X, TRAIL_CAPACITY,
} from './config.js'
import { recomputeGridDims, gridIndex, GRID_COLS, GRID_ROWS } from './grid.js'
import { serializeWorld, applySave } from './save-load.js'
import { validateSave } from './save-validate.js'
import { biomeSpeedMult } from './biome.js'
import {
  RECURRENT_COUNT, ACTION_OUTPUT_SIZE, OUTPUT_SIZE, BRAIN_LAYERS,
} from './brain.js'
import {
  TOTAL_SAB_BYTES, makeViews, MAX_GRID_CELLS,
  SYNC_TICK, SYNC_DONE_COUNT, SYNC_POOL_SIZE, SYNC_SHUTDOWN,
  BRAIN_FLOATS, LAYER_W_OFFSET, LAYER_B_OFFSET,
  WCFG_WORLD_W, WCFG_WORLD_H, WCFG_WATER_BOUNDARY_X, WCFG_GRID_COLS, WCFG_GRID_ROWS,
  WCFG_POND_COUNT, WCFG_POND_DATA, MAX_PONDS,
} from './sim-shared.js'

let world = null
let isPaused = false
let simSpeed = 1
let renderRequested = false
let surfaceVersion = 0
let lastSentSurfaceVersion = -1
let treesVersion = 0
let lastSentTreesVersion = -1

let pool = null
let treeMirrorStamp = -2

function scaleConfigForArea(config) {
  const k = densityScaleFactor()
  const out = { ...config }
  if (typeof config.populationTarget === 'number') {
    out.populationTarget = Math.max(1, Math.round(config.populationTarget * k))
  }
  if (typeof config.treeCount === 'number') {
    out.treeCount = Math.max(1, Math.round(config.treeCount * k))
  }
  return out
}

function init({ scale, config }) {
  setWorldScale(scale || BASE_WORLD_SCALE)
  recomputeGridDims()
  world = new World(scaleConfigForArea(config))
  world.resetSimulation()
  surfaceVersion++
  treesVersion++
  initPool()
  writeWorldConfig()
  mirrorAllToSAB()
  scheduleNextTick()
}

function pickPoolSize() {
  const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4
  return Math.max(2, Math.min(8, cores - 2))
}

function initPool() {
  const poolSize = pickPoolSize()
  const sab = new SharedArrayBuffer(TOTAL_SAB_BYTES)
  const views = makeViews(sab)
  Atomics.store(views.sync, SYNC_TICK, 0)
  Atomics.store(views.sync, SYNC_DONE_COUNT, 0)
  Atomics.store(views.sync, SYNC_POOL_SIZE, poolSize)
  Atomics.store(views.sync, SYNC_SHUTDOWN, 0)

  let readyCount = 0
  const workers = []
  for (let i = 0; i < poolSize; i++) {
    const w = new Worker(new URL('./sim-pool-worker.js', import.meta.url), { type: 'module' })
    w.onmessage = (e) => {
      if (e.data && e.data.type === 'ready') {
        readyCount++
        if (readyCount === poolSize) {
          pool.ready = true
          console.info('[sim-worker] pool fully ready (', poolSize, 'workers acked)')
        }
      }
    }
    w.postMessage({
      type: 'init',
      sab,
      workerIndex: i,
      foodCap: BALANCE.FOOD_CAP,
    })
    workers.push(w)
  }
  pool = { sab, views, workers, poolSize, ready: false }
  console.info('[sim-worker] SAB pool spawning', poolSize, 'workers (sim paused until ready)')
}

function writeWorldConfig() {
  if (!pool) {
    return
  }
  const cfg = pool.views.worldCfg
  cfg[WCFG_WORLD_W] = WORLD_W
  cfg[WCFG_WORLD_H] = WORLD_H
  cfg[WCFG_WATER_BOUNDARY_X] = WATER_BOUNDARY_X
  cfg[WCFG_GRID_COLS] = GRID_COLS
  cfg[WCFG_GRID_ROWS] = GRID_ROWS
  const ponds = world ? world.ponds : []
  const n = Math.min(ponds.length, MAX_PONDS)
  cfg[WCFG_POND_COUNT] = n
  for (let i = 0; i < n; i++) {
    cfg[WCFG_POND_DATA + i * 3 + 0] = ponds[i].x
    cfg[WCFG_POND_DATA + i * 3 + 1] = ponds[i].y
    cfg[WCFG_POND_DATA + i * 3 + 2] = ponds[i].r
  }
}

function mirrorCreatureTickFields(slot, c) {
  const v = pool.views
  v.cX[slot] = c.x
  v.cY[slot] = c.y
  v.cAngle[slot] = c.angle
  v.cFoodHeld[slot] = c.foodHeld
  v.cBurstReady[slot] = c.burstState === 'idle' ? 1 : 0
  v.cAlive[slot] = (c.alive && !c.knockedOut && !c.sleeping) ? 1 : 0
  v.cMemory[slot * 3 + 0] = c.memory[0]
  v.cMemory[slot * 3 + 1] = c.memory[1]
  v.cMemory[slot * 3 + 2] = c.memory[2]
}

function mirrorCreatureConstants(slot, c) {
  const v = pool.views
  v.cRadius[slot] = c._radius
  v.cStrength[slot] = c._strength
  v.cVisionRadius[slot] = c._visionRadius
  v.cRaySideOffset[slot] = c._raySideOffset
  v.cWater[slot] = c.genome.water
  const brainBase = slot * BRAIN_FLOATS
  for (let layer = 0; layer < BRAIN_LAYERS.length - 1; layer++) {
    const w = c.genome.brain.weights[layer]
    const b = c.genome.brain.biases[layer]
    const wOff = brainBase + LAYER_W_OFFSET[layer]
    const bOff = brainBase + LAYER_B_OFFSET[layer]
    for (let j = 0; j < w.length; j++) {
      v.cBrain[wOff + j] = w[j]
    }
    for (let j = 0; j < b.length; j++) {
      v.cBrain[bOff + j] = b[j]
    }
  }
}

function mirrorAllToSAB() {
  if (!pool) {
    return
  }
  for (let i = 0; i < world.creatures.length; i++) {
    const c = world.creatures[i]
    c._sabSlot = i
    mirrorCreatureTickFields(i, c)
    mirrorCreatureConstants(i, c)
  }
  mirrorTreesToSAB()
  treeMirrorStamp = world.treeGridStamp
}

function mirrorTickStateToSAB(active) {
  const v = pool.views
  for (let i = 0; i < world.creatures.length; i++) {
    const c = world.creatures[i]
    mirrorCreatureTickFields(c._sabSlot, c)
  }
  v.activeCount[0] = active.length
  for (let i = 0; i < active.length; i++) {
    v.activeIndices[i] = active[i]._sabSlot
  }
}

function mirrorTreesToSAB() {
  if (!pool) {
    return
  }
  const v = pool.views
  const { landTrees, waterTrees } = world
  v.treeCount[0] = landTrees.length + waterTrees.length
  let idx = 0
  for (let i = 0; i < landTrees.length; i++) {
    const t = landTrees[i]
    v.treeX[idx] = t.x
    v.treeY[idx] = t.y
    v.treeR[idx] = t.r
    idx++
  }
  for (let i = 0; i < waterTrees.length; i++) {
    const t = waterTrees[i]
    v.treeX[idx] = t.x
    v.treeY[idx] = t.y
    v.treeR[idx] = t.r
    idx++
  }
}

function mirrorFoodToSAB() {
  const v = pool.views
  v.foodCount[0] = world.food.length
  for (let i = 0; i < world.food.length; i++) {
    const f = world.food[i]
    v.foodX[i] = f.x
    v.foodY[i] = f.y
    v.foodR[i] = f.r
  }
}

const cellCountScratch = new Int32Array(MAX_GRID_CELLS)
const cellCursorScratch = new Int32Array(MAX_GRID_CELLS)

function buildCSRGrid(itemCount, cellOf, cellStarts, cellData) {
  const numCells = GRID_COLS * GRID_ROWS
  for (let i = 0; i < numCells; i++) {
    cellCountScratch[i] = 0
  }
  for (let i = 0; i < itemCount; i++) {
    const cell = cellOf(i)
    if (cell < 0) {
      continue
    }
    cellCountScratch[cell]++
  }
  let acc = 0
  for (let c = 0; c < numCells; c++) {
    cellStarts[c] = acc
    acc += cellCountScratch[c]
    cellCursorScratch[c] = 0
  }
  cellStarts[numCells] = acc
  for (let i = 0; i < itemCount; i++) {
    const cell = cellOf(i)
    if (cell < 0) {
      continue
    }
    cellData[cellStarts[cell] + cellCursorScratch[cell]] = i
    cellCursorScratch[cell]++
  }
}

function buildCreatureGridSAB() {
  const v = pool.views
  buildCSRGrid(
    world.creatures.length,
    (i) => (v.cAlive[i] === 1 ? gridIndex(v.cX[i], v.cY[i]) : -1),
    v.creatureCellStarts,
    v.creatureCellData,
  )
}

function buildFoodGridSAB() {
  const v = pool.views
  buildCSRGrid(
    v.foodCount[0],
    (i) => gridIndex(v.foodX[i], v.foodY[i]),
    v.foodCellStarts,
    v.foodCellData,
  )
}

function buildTreeGridSAB() {
  const v = pool.views
  buildCSRGrid(
    v.treeCount[0],
    (i) => gridIndex(v.treeX[i], v.treeY[i]),
    v.treeCellStarts,
    v.treeCellData,
  )
}

function buildPrePassActiveList() {
  const active = []
  for (const c of world.creatures) {
    if (!c.alive || c.sleeping) {
      continue
    }
    c.contestCooldown--
    c.blockedPulse = Math.max(0, c.blockedPulse - 1)
    if (c.koImmunity > 0) {
      c.koImmunity--
    }
    if (c.knockedOut) {
      c.koTimer--
      if (c.koTimer <= 0) {
        c.knockedOut = false
        if (c.genome.tank <= 0.15) {
          c.koImmunity = Math.floor(c.lastKoDuration * 0.75)
        }
      }
      continue
    }
    c.fitness =
      c.ageDays * 900 + c.foodHeld * 180 + c.children * 1250 + c.denials * 240
    active.push(c)
  }
  return active
}

function signalPoolAndWait() {
  const sync = pool.views.sync
  Atomics.store(sync, SYNC_DONE_COUNT, 0)
  Atomics.add(sync, SYNC_TICK, 1)
  Atomics.notify(sync, SYNC_TICK, pool.poolSize)

  const waitStart = performance.now()
  for (;;) {
    const done = Atomics.load(sync, SYNC_DONE_COUNT)
    if (done >= pool.poolSize) {
      return true
    }
    const result = Atomics.wait(sync, SYNC_DONE_COUNT, done, 5000)
    if (result === 'timed-out') {
      console.error('[sim-worker] pool wait TIMED OUT — done=', done, 'expected=', pool.poolSize, 'elapsed=', performance.now() - waitStart)
      // Stop stepping rather than feeding stale brain outputs back into
      // the sim — keeps the world consistent until the page is reloaded.
      pool.ready = false
      return false
    }
  }
}

function applyBrainOutputsToCreature(c, recordTrail) {
  const v = pool.views
  const idx = c._sabSlot
  const outBase = idx * OUTPUT_SIZE
  const out0 = v.cOutput[outBase + 0]
  const out1 = v.cOutput[outBase + 1]
  const out2 = v.cOutput[outBase + 2]
  c.tickBurst(out2)
  const keep = BALANCE.MEMORY_KEEP
  const mix = 1 - keep
  for (let mi = 0; mi < RECURRENT_COUNT; mi++) {
    c.memory[mi] = c.memory[mi] * keep + v.cOutput[outBase + ACTION_OUTPUT_SIZE + mi] * mix
  }
  const biomeMult = biomeSpeedMult(c.genome, c.x, c.y, world.ponds)
  const forward = out0 * c._baseSpeed * c.speedMult() * biomeMult
  // Turn-rate is strictly proportional to forward commitment: no
  // movement, no turning. Brain output is unchanged; only its effect on
  // angle is scaled. abs(out0) so backward motion still allows turning
  // (otherwise a wall-pinned creature could get stuck reversing forever).
  const turnCoupling = Math.min(1, Math.abs(out0))
  c.angle += out1 * c._turnRate * turnCoupling
  c.x += Math.cos(c.angle) * forward
  c.y += Math.sin(c.angle) * forward
  world.keepInBounds(c)
  if (recordTrail) {
    const ti = c._trailIndex
    c._trailX[ti] = c.x
    c._trailY[ti] = c.y
    c._trailIndex = (ti + 1) % TRAIL_CAPACITY
    if (c._trailLength < TRAIL_CAPACITY) {
      c._trailLength++
    }
  }
  const newCell = gridIndex(c.x, c.y)
  if (newCell !== c._cellIndex) {
    const oldCell = world.creatureGrid[c._cellIndex]
    const cIdx = oldCell.indexOf(c)
    if (cIdx !== -1) {
      const last = oldCell.length - 1
      if (cIdx !== last) {
        oldCell[cIdx] = oldCell[last]
      }
      oldCell.pop()
    }
    world.creatureGrid[newCell].push(c)
    c._cellIndex = newCell
  }
}

function parallelDayTick() {
  const active = buildPrePassActiveList()

  mirrorTickStateToSAB(active)
  mirrorFoodToSAB()
  if (treeMirrorStamp !== world.treeGridStamp) {
    mirrorTreesToSAB()
    buildTreeGridSAB()
    treeMirrorStamp = world.treeGridStamp
  }
  buildCreatureGridSAB()
  buildFoodGridSAB()

  if (!signalPoolAndWait()) {
    return
  }

  const recordTrail = world.phaseTick % 4 === 0
  for (let i = 0; i < active.length; i++) {
    applyBrainOutputsToCreature(active[i], recordTrail)
  }

  world.collectFood()
  world.resolveContests()
  world.phaseTick++
  world.globalTick++
  if (world.phaseTick % 240 === 0) {
    world.updateBestGenome()
  }
  if (world.phaseTick >= BALANCE.DAY_LENGTH) {
    world.beginNight()
    mirrorAllToSAB()
  }
}

function parallelStep(iterations) {
  for (let i = 0; i < iterations; i++) {
    if (world.phase === 'day') {
      world.disperseDailyFood()
      world.ensureTreeGrid()
      parallelDayTick()
    } else {
      world.updateNight()
    }
  }
}

function buildCreatureSnapshot() {
  const out = new Array(world.creatures.length)
  for (let i = 0; i < world.creatures.length; i++) {
    const c = world.creatures[i]
    out[i] = {
      id: c.id, x: c.x, y: c.y, angle: c.angle,
      alive: c.alive, sleeping: c.sleeping, knockedOut: c.knockedOut,
      burstState: c.burstState, koImmunity: c.koImmunity,
      lastKoDuration: c.lastKoDuration, blockedPulse: c.blockedPulse,
      reproductionBlocked: c.reproductionBlocked,
      foodHeld: c.foodHeld, fitness: c.fitness,
      _radius: c._radius, _visionRadius: c._visionRadius,
      genome: {
        tank: c.genome.tank, vision: c.genome.vision, focus: c.genome.focus,
        burst: c.genome.burst, forage: c.genome.forage, water: c.genome.water,
      },
      _trailX: c._trailX, _trailY: c._trailY,
      _trailIndex: c._trailIndex, _trailLength: c._trailLength,
    }
  }
  return out
}

function buildFoodSnapshot() {
  const out = new Array(world.food.length)
  for (let i = 0; i < world.food.length; i++) {
    const f = world.food[i]
    out[i] = { x: f.x, y: f.y, r: f.r, color: f.color, biome: f.biome }
  }
  return out
}

function buildSnapshot() {
  const sendSurface = surfaceVersion !== lastSentSurfaceVersion
  const sendTrees = treesVersion !== lastSentTreesVersion

  const snap = {
    day: world.day,
    phase: world.phase,
    phaseTick: world.phaseTick,
    globalTick: world.globalTick,
    nightStats: world.nightStats,
    config: { ...world.config },
    creatures: buildCreatureSnapshot(),
    food: buildFoodSnapshot(),
    traitHistory: world.traitHistory,
    landTrees: sendTrees ? world.landTrees : null,
    waterTrees: sendTrees ? world.waterTrees : null,
    prevLandTrees: sendTrees ? world.prevLandTrees : null,
    prevWaterTrees: sendTrees ? world.prevWaterTrees : null,
    meadowMarks: sendSurface ? world.meadowMarks : null,
    flowers: sendSurface ? world.flowers : null,
    waterMarks: sendSurface ? world.waterMarks : null,
    rocks: sendSurface ? world.rocks : null,
    lilypads: sendSurface ? world.lilypads : null,
    ponds: sendSurface ? world.ponds : null,
    prevMeadowMarks: sendSurface ? world.prevMeadowMarks : null,
    prevFlowers: sendSurface ? world.prevFlowers : null,
    prevWaterMarks: sendSurface ? world.prevWaterMarks : null,
    prevRocks: sendSurface ? world.prevRocks : null,
    prevLilypads: sendSurface ? world.prevLilypads : null,
  }

  if (sendSurface) {
    lastSentSurfaceVersion = surfaceVersion
  }
  if (sendTrees) {
    lastSentTreesVersion = treesVersion
  }
  return snap
}

let lastDay = 1
let lastPrevTreesLength = 0

function tick() {
  const canStep = !isPaused && world && pool && pool.ready
  if (canStep) {
    parallelStep(simSpeed)
    if (world.day !== lastDay) {
      lastDay = world.day
      treesVersion++
    }
    if (world.prevLandTrees.length !== lastPrevTreesLength) {
      lastPrevTreesLength = world.prevLandTrees.length
      treesVersion++
    }
    if (world.pondsDirty) {
      world.pondsDirty = false
      writeWorldConfig()
      surfaceVersion++
      treesVersion++
    }
  }
  if (renderRequested) {
    renderRequested = false
    self.postMessage({ type: 'snapshot', snapshot: buildSnapshot() })
  }
  scheduleNextTick()
}

let nextTickHandle = null
function scheduleNextTick() {
  if (nextTickHandle) {
    return
  }
  nextTickHandle = setTimeout(() => {
    nextTickHandle = null
    tick()
  }, 0)
}

function handleReset() {
  if (!world) {
    return
  }
  world.resetSimulation()
  surfaceVersion++
  treesVersion++
  lastDay = world.day
  lastPrevTreesLength = 0
  mirrorAllToSAB()
}

function handleRegenerateTrees() {
  if (!world) {
    return
  }
  world.regenerateTrees()
  treesVersion++
  lastPrevTreesLength = world.prevLandTrees.length
  mirrorTreesToSAB()
  buildTreeGridSAB()
  treeMirrorStamp = world.treeGridStamp
}

function handleResize(msg) {
  if (!world) {
    return
  }
  setWorldScale(msg.scale)
  recomputeGridDims()
  world.rebuildAfterResize()
  world.setConfig(scaleConfigForArea(msg.config))
  world.resetSimulation()
  surfaceVersion++
  treesVersion++
  writeWorldConfig()
  mirrorAllToSAB()
}

function handleApplyLoad(data) {
  validateSave(data)
  applySave(world, data)
  surfaceVersion++
  treesVersion++
  lastDay = world.day
  lastPrevTreesLength = world.prevLandTrees.length
  writeWorldConfig()
  mirrorAllToSAB()
}

self.onmessage = (e) => {
  const msg = e.data
  switch (msg.type) {
    case 'init':
      init(msg)
      break
    case 'setConfig':
      if (world) {
        world.setConfig(scaleConfigForArea(msg.config))
      }
      break
    case 'simSpeed':
      simSpeed = msg.speed
      break
    case 'pause':
      isPaused = msg.paused
      break
    case 'requestSnapshot':
      renderRequested = true
      break
    case 'reset':
      handleReset()
      break
    case 'regenerateTrees':
      handleRegenerateTrees()
      break
    case 'resize':
      handleResize(msg)
      break
    case 'requestSave':
      self.postMessage({ type: 'saveData', data: serializeWorld(world) })
      break
    case 'applyLoad':
      try {
        handleApplyLoad(msg.data)
        self.postMessage({ type: 'loadDone', config: { ...world.config } })
      } catch (err) {
        self.postMessage({ type: 'loadError', message: err.message })
      }
      break
    case 'shutdown':
      shutdownPool()
      self.close()
      break
  }
}

// Triggered from the main thread's beforeunload / pagehide. Tell the
// pool workers to exit their wait loop, terminate them, then close the
// coordinator. Without this the pool can briefly survive a navigation
// or iframe unload while the GC hasn't reached the SAB yet.
function shutdownPool() {
  if (!pool) {
    return
  }
  Atomics.store(pool.views.sync, SYNC_SHUTDOWN, 1)
  Atomics.add(pool.views.sync, SYNC_TICK, 1)
  Atomics.notify(pool.views.sync, SYNC_TICK, pool.poolSize)
  for (const w of pool.workers) {
    try { w.terminate() } catch { /* already gone */ }
  }
  pool = null
}
