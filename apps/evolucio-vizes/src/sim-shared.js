// Shared state layout for the SAB worker pool. Imported by sim-worker.js
// (coordinator) and sim-pool-worker.js (pool members) so they agree on
// byte offsets, strides, and sync primitives.
//
// The SAB is allocated worst-case so we never need to resize. At max
// world size (10x), the world has ~944 grid cells; we round up to 1024.

import { OUTPUT_SIZE, BRAIN_LAYERS, RECURRENT_COUNT } from './brain.js'

// === Capacity ===

export const MAX_CREATURES = 4000
export const MAX_TREES = 4000
export const MAX_FOOD = 4000
export const MAX_GRID_CELLS = 1024  // 32 × 32 ample for size=10

// === Brain layout (per creature) ===

let brainFloats = 0
for (let layer = 0; layer < BRAIN_LAYERS.length - 1; layer++) {
  brainFloats += BRAIN_LAYERS[layer] * BRAIN_LAYERS[layer + 1]
  brainFloats += BRAIN_LAYERS[layer + 1]
}
export const BRAIN_FLOATS = brainFloats // ~378

// Brain weight + bias offsets within a creature's brain block.
// Layer L's weights start at LAYER_W_OFFSET[L], biases at LAYER_B_OFFSET[L].
export const LAYER_W_OFFSET = []
export const LAYER_B_OFFSET = []
{
  let off = 0
  for (let layer = 0; layer < BRAIN_LAYERS.length - 1; layer++) {
    const wCount = BRAIN_LAYERS[layer] * BRAIN_LAYERS[layer + 1]
    const bCount = BRAIN_LAYERS[layer + 1]
    LAYER_W_OFFSET.push(off)
    off += wCount
    LAYER_B_OFFSET.push(off)
    off += bCount
  }
}

// === Sync words (Int32) ===

export const SYNC_WORDS = 16
export const SYNC_TICK = 0       // bumped by coordinator to signal pool
export const SYNC_DONE_COUNT = 1  // incremented by each pool worker on completion
export const SYNC_POOL_SIZE = 2   // number of pool workers (set at init)
export const SYNC_SHUTDOWN = 3    // set to 1 to signal pool to exit

// === Byte layout ===
//
// Each region's offset is calculated from the previous one. All
// Float32Arrays are 4-byte aligned (which matches SAB).

const SYNC_BYTES = SYNC_WORDS * 4

// World config — coordinator writes on init and on every resize, pool
// workers read at the start of each tick. This replaces the per-worker
// postMessage path which doesn't work: workers blocked in Atomics.wait
// can't process incoming messages, so a queued reconfigure never
// arrives.
export const WCFG_WORLD_W = 0
export const WCFG_WORLD_H = 1
export const WCFG_WATER_BOUNDARY_X = 2
export const WCFG_GRID_COLS = 3
export const WCFG_GRID_ROWS = 4
// Inland ponds: pond count + up to MAX_PONDS triples of (x, y, r).
// Pool worker reads these each tick when computing the water-ray sign
// so a creature inside a pond senses water like one inside the main
// water region.
export const MAX_PONDS = 8
export const WCFG_POND_COUNT = 5
export const WCFG_POND_DATA = 6 // first of MAX_PONDS * 3 floats
const WORLD_CFG_FIELDS = WCFG_POND_DATA + MAX_PONDS * 3
const WORLD_CFG_OFFSET = SYNC_BYTES
const WORLD_CFG_BYTES = WORLD_CFG_FIELDS * 4

// activeIndices: Int32Array of indices to process this tick
const ACTIVE_OFFSET = WORLD_CFG_OFFSET + WORLD_CFG_BYTES
const ACTIVE_BYTES = (1 + MAX_CREATURES) * 4 // [count, ...indices]

// Per-creature scalar fields (parallel arrays for cache locality during
// grid building / mirror).
// Pool worker reads ALL of these to compute sense inputs; coordinator
// writes them in the per-tick mirror.
const SCALAR_FIELD_COUNT = 11
const SCALAR_BYTES = SCALAR_FIELD_COUNT * MAX_CREATURES * 4
const SCALAR_OFFSET = ACTIVE_OFFSET + ACTIVE_BYTES

const F_X = 0
const F_Y = 1
const F_ANGLE = 2
const F_RADIUS = 3
const F_STRENGTH = 4
const F_VISION_RADIUS = 5
const F_RAY_SIDE_OFFSET = 6
const F_WATER = 7
const F_ALIVE = 8           // 1 if alive and non-KO and non-sleeping
const F_FOOD_HELD = 9       // foodHeld (used by sense for FOOD_LEFT input)
const F_BURST_READY = 10    // 1 if burstState === 'idle', 0 otherwise

// Per-creature memory (recurrent state)
const MEMORY_OFFSET = SCALAR_OFFSET + SCALAR_BYTES
const MEMORY_BYTES = MAX_CREATURES * RECURRENT_COUNT * 4

// Per-creature brain weights (packed)
const BRAIN_OFFSET = MEMORY_OFFSET + MEMORY_BYTES
const BRAIN_BYTES = MAX_CREATURES * BRAIN_FLOATS * 4

// Per-creature output buffer (forward, turn, burst, mem0, mem1, mem2)
const OUTPUT_OFFSET = BRAIN_OFFSET + BRAIN_BYTES
const OUTPUT_BYTES = MAX_CREATURES * OUTPUT_SIZE * 4

// Tree positions (parallel arrays + count)
const TREE_OFFSET = OUTPUT_OFFSET + OUTPUT_BYTES
const TREE_BYTES = (1 + 3 * MAX_TREES) * 4 // [count, ...x, ...y, ...r]

// Food positions
const FOOD_OFFSET = TREE_OFFSET + TREE_BYTES
const FOOD_BYTES = (1 + 3 * MAX_FOOD) * 4 // [count, ...x, ...y, ...r]

// Spatial grids in CSR format: starts (cells+1) + data (max items).
// Three grids: creature, food, tree.
const CREATURE_GRID_OFFSET = FOOD_OFFSET + FOOD_BYTES
const CREATURE_GRID_BYTES = ((MAX_GRID_CELLS + 1) + MAX_CREATURES) * 4

const FOOD_GRID_OFFSET = CREATURE_GRID_OFFSET + CREATURE_GRID_BYTES
const FOOD_GRID_BYTES = ((MAX_GRID_CELLS + 1) + MAX_FOOD) * 4

const TREE_GRID_OFFSET = FOOD_GRID_OFFSET + FOOD_GRID_BYTES
const TREE_GRID_BYTES = ((MAX_GRID_CELLS + 1) + MAX_TREES) * 4

export const TOTAL_SAB_BYTES = TREE_GRID_OFFSET + TREE_GRID_BYTES

// === View factory ===
//
// Each worker (and the coordinator) builds its own typed-array views
// over the same SAB. Reads/writes through these views go to the same
// underlying memory.

export function makeViews(sab) {
  return {
    sync: new Int32Array(sab, 0, SYNC_WORDS),
    worldCfg: new Float32Array(sab, WORLD_CFG_OFFSET, WORLD_CFG_FIELDS),

    activeCount: new Int32Array(sab, ACTIVE_OFFSET, 1),
    activeIndices: new Int32Array(sab, ACTIVE_OFFSET + 4, MAX_CREATURES),

    // Parallel scalar fields. Each is a length-MAX_CREATURES typed array.
    cX: new Float32Array(sab, SCALAR_OFFSET + F_X * MAX_CREATURES * 4, MAX_CREATURES),
    cY: new Float32Array(sab, SCALAR_OFFSET + F_Y * MAX_CREATURES * 4, MAX_CREATURES),
    cAngle: new Float32Array(sab, SCALAR_OFFSET + F_ANGLE * MAX_CREATURES * 4, MAX_CREATURES),
    cRadius: new Float32Array(sab, SCALAR_OFFSET + F_RADIUS * MAX_CREATURES * 4, MAX_CREATURES),
    cStrength: new Float32Array(sab, SCALAR_OFFSET + F_STRENGTH * MAX_CREATURES * 4, MAX_CREATURES),
    cVisionRadius: new Float32Array(sab, SCALAR_OFFSET + F_VISION_RADIUS * MAX_CREATURES * 4, MAX_CREATURES),
    cRaySideOffset: new Float32Array(sab, SCALAR_OFFSET + F_RAY_SIDE_OFFSET * MAX_CREATURES * 4, MAX_CREATURES),
    cWater: new Float32Array(sab, SCALAR_OFFSET + F_WATER * MAX_CREATURES * 4, MAX_CREATURES),
    cAlive: new Float32Array(sab, SCALAR_OFFSET + F_ALIVE * MAX_CREATURES * 4, MAX_CREATURES),
    cFoodHeld: new Float32Array(sab, SCALAR_OFFSET + F_FOOD_HELD * MAX_CREATURES * 4, MAX_CREATURES),
    cBurstReady: new Float32Array(sab, SCALAR_OFFSET + F_BURST_READY * MAX_CREATURES * 4, MAX_CREATURES),

    cMemory: new Float32Array(sab, MEMORY_OFFSET, MAX_CREATURES * RECURRENT_COUNT),
    cBrain: new Float32Array(sab, BRAIN_OFFSET, MAX_CREATURES * BRAIN_FLOATS),
    cOutput: new Float32Array(sab, OUTPUT_OFFSET, MAX_CREATURES * OUTPUT_SIZE),

    treeCount: new Int32Array(sab, TREE_OFFSET, 1),
    treeX: new Float32Array(sab, TREE_OFFSET + 4, MAX_TREES),
    treeY: new Float32Array(sab, TREE_OFFSET + 4 + MAX_TREES * 4, MAX_TREES),
    treeR: new Float32Array(sab, TREE_OFFSET + 4 + 2 * MAX_TREES * 4, MAX_TREES),

    foodCount: new Int32Array(sab, FOOD_OFFSET, 1),
    foodX: new Float32Array(sab, FOOD_OFFSET + 4, MAX_FOOD),
    foodY: new Float32Array(sab, FOOD_OFFSET + 4 + MAX_FOOD * 4, MAX_FOOD),
    foodR: new Float32Array(sab, FOOD_OFFSET + 4 + 2 * MAX_FOOD * 4, MAX_FOOD),

    creatureCellStarts: new Int32Array(sab, CREATURE_GRID_OFFSET, MAX_GRID_CELLS + 1),
    creatureCellData: new Int32Array(sab, CREATURE_GRID_OFFSET + (MAX_GRID_CELLS + 1) * 4, MAX_CREATURES),

    foodCellStarts: new Int32Array(sab, FOOD_GRID_OFFSET, MAX_GRID_CELLS + 1),
    foodCellData: new Int32Array(sab, FOOD_GRID_OFFSET + (MAX_GRID_CELLS + 1) * 4, MAX_FOOD),

    treeCellStarts: new Int32Array(sab, TREE_GRID_OFFSET, MAX_GRID_CELLS + 1),
    treeCellData: new Int32Array(sab, TREE_GRID_OFFSET + (MAX_GRID_CELLS + 1) * 4, MAX_TREES),
  }
}
