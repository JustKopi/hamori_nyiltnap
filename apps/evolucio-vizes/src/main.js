import * as Render from './render.js'
import * as UI from './ui.js'
import { BASE_WORLD_SCALE, WORLD_W, WORLD_H } from './config.js'
import { ensureCrossOriginIsolated } from '../../common/cross-origin-isolation.js'

const canvas = document.getElementById('c')
const ctx = canvas.getContext('2d')

ensureCrossOriginIsolated('evolucio-vizes')
console.info(`[evolucio-vizes] parallel pool enabled (cores=${navigator.hardwareConcurrency})`)

const worker = new Worker(new URL('./sim-worker.js', import.meta.url), { type: 'module' })

const DEFAULT_CONFIG = {
  populationTarget: 200,
  treeCount: 225,
  mutationFrequency: 0.33,
  mutationAmount: 0.33,
  crossoverChance: 0.80,
  crossoverAmount: 0.50,
  hotspotShare: 0.14,
  invasivesEnabled: false,
  nightEnabled: true,
  waterStartEnabled: false,
}

function emptySnapshotFields() {
  return {
    day: 1,
    phase: 'day',
    phaseTick: 0,
    globalTick: 0,
    nextCreatureId: 1,
    nightStats: { survived: 0, born: 0, invasives: 0, died: 0, denied: 0 },
    creatures: [],
    food: [],
    landTrees: [],
    waterTrees: [],
    prevLandTrees: [],
    prevWaterTrees: [],
    meadowMarks: [],
    flowers: [],
    waterMarks: [],
    rocks: [],
    lilypads: [],
    ponds: [],
    prevMeadowMarks: [],
    prevFlowers: [],
    prevWaterMarks: [],
    prevRocks: [],
    prevLilypads: [],
    traitHistory: [],
  }
}

let pendingSave = null
let pendingLoad = null

function rejectPendingSave() {
  if (pendingSave) {
    pendingSave.reject(new Error('Mentés megszakítva'))
    pendingSave = null
  }
}

function rejectPendingLoad() {
  if (pendingLoad) {
    pendingLoad.reject(new Error('Betöltés megszakítva'))
    pendingLoad = null
  }
}

const world = {
  ...emptySnapshotFields(),
  config: { ...DEFAULT_CONFIG },

  setConfig(partial) {
    if (partial) {
      Object.assign(this.config, partial)
    }
    worker.postMessage({ type: 'setConfig', config: partial })
  },
  resetSimulation() {
    worker.postMessage({ type: 'reset' })
  },
  regenerateTrees() {
    worker.postMessage({ type: 'regenerateTrees' })
  },
  resize(scale, config) {
    worker.postMessage({ type: 'resize', scale, config })
  },
  requestSave() {
    rejectPendingSave()
    return new Promise((resolve, reject) => {
      pendingSave = { resolve, reject }
      worker.postMessage({ type: 'requestSave' })
    })
  },
  applyLoad(data) {
    rejectPendingLoad()
    return new Promise((resolve, reject) => {
      pendingLoad = { resolve, reject }
      worker.postMessage({ type: 'applyLoad', data })
    })
  },
}

const SNAPSHOT_FIELDS = [
  'day', 'phase', 'phaseTick', 'globalTick', 'nightStats',
  'creatures', 'food', 'traitHistory',
]
const OPTIONAL_SNAPSHOT_FIELDS = [
  'landTrees', 'waterTrees', 'prevLandTrees', 'prevWaterTrees',
  'meadowMarks', 'flowers', 'waterMarks', 'rocks', 'lilypads', 'ponds',
  'prevMeadowMarks', 'prevFlowers', 'prevWaterMarks', 'prevRocks', 'prevLilypads',
]

function applySnapshot(snap) {
  for (const key of SNAPSHOT_FIELDS) {
    world[key] = snap[key]
  }
  for (const key of OPTIONAL_SNAPSHOT_FIELDS) {
    if (snap[key]) {
      world[key] = snap[key]
    }
  }
  if (snap.config) {
    world.config.nightEnabled = snap.config.nightEnabled
  }
}

worker.onmessage = (e) => {
  const msg = e.data
  if (msg.type === 'snapshot') {
    applySnapshot(msg.snapshot)
    return
  }
  if (msg.type === 'saveData' && pendingSave) {
    pendingSave.resolve(msg.data)
    pendingSave = null
    return
  }
  if (msg.type === 'loadDone' && pendingLoad) {
    pendingLoad.resolve(msg.config)
    pendingLoad = null
    return
  }
  if (msg.type === 'loadError' && pendingLoad) {
    pendingLoad.reject(new Error(msg.message))
    pendingLoad = null
  }
}

let frameCount = 0

function resetSimulation() {
  Render.resetRenderState()
  world.resetSimulation()
  // No centerCameraOn here on purpose: Restart should keep the user's
  // current pan & zoom. Initial page load still centers (see below).
  UI.updateHud(world)
  UI.updateCycleMeter(world)
  Render.drawTraitChart(world, UI.chartCanvas, UI.chartCtx)
}

function loop() {
  frameCount++
  worker.postMessage({ type: 'requestSnapshot' })
  Render.drawAll(world, ctx)
  Render.drawTraitChart(world, UI.chartCanvas, UI.chartCtx)
  UI.updateCycleMeter(world)
  if (frameCount % 4 === 0) {
    UI.updateHud(world)
  }
  requestAnimationFrame(loop)
}

UI.setupUI(world, canvas, ctx, resetSimulation, (paused) => {
  worker.postMessage({ type: 'pause', paused })
})
Render.syncCanvasResolution(canvas, ctx, UI.isHiResEnabled())
UI.updateLabels()

const simSpeedSlider = document.getElementById('simSpeedSlider')
function syncRenderSimSpeed() {
  Render.setRenderOptions({ simSpeed: UI.getSimSpeed() })
}
simSpeedSlider.addEventListener('input', () => {
  worker.postMessage({ type: 'simSpeed', speed: UI.getSimSpeed() })
  syncRenderSimSpeed()
})
syncRenderSimSpeed()

worker.postMessage({
  type: 'init',
  scale: BASE_WORLD_SCALE,
  config: { ...world.config },
})
worker.postMessage({ type: 'simSpeed', speed: UI.getSimSpeed() })
Render.centerCameraOn(WORLD_W / 2, WORLD_H / 2)
requestAnimationFrame(loop)

// Tell the coordinator + pool workers to exit cleanly on navigation /
// iframe unload. Browsers normally tear them down with the document,
// but signalling explicitly avoids brief overlap if the host page
// hangs onto a worker reference for a moment.
const shutdown = () => worker.postMessage({ type: 'shutdown' })
window.addEventListener('pagehide', shutdown)
window.addEventListener('beforeunload', shutdown)
