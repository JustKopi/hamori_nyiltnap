// Bounds-checks an incoming save-file payload BEFORE applySave touches
// state. Goal: keep a corrupt or malicious JSON from OOM'ing the tab,
// poisoning the sim with NaN/Infinity, or allocating absurd buffers.
//
// Throws Error with a Hungarian user-facing message on first failure.
// Returns silently on success.

import { BRAIN_LAYERS } from './brain.js'
import {
  MAX_CREATURES as SAB_MAX_CREATURES,
  MAX_TREES as SAB_MAX_TREES,
  MAX_PONDS as SAB_MAX_PONDS,
} from './sim-shared.js'

// Stay strictly within SAB capacities — going over crashes mid-mirror.
const MAX_CREATURES = SAB_MAX_CREATURES
const MAX_TREES = SAB_MAX_TREES
const MAX_PONDS = SAB_MAX_PONDS
const MIN_WORLD_SCALE = 1
const MAX_WORLD_SCALE = 10
const MAX_COORD = 1e6
const MAX_MEMORY_LEN = 16

function assertFiniteNumber(value, path) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Érvénytelen szám: ${path}`)
  }
}

function assertFiniteInRange(value, path, min, max) {
  assertFiniteNumber(value, path)
  if (value < min || value > max) {
    throw new Error(`${path} a megengedett tartományon kívül (${min}..${max}).`)
  }
}

function assertArrayLen(arr, path, max) {
  if (!Array.isArray(arr)) {
    throw new Error(`${path} nem tömb.`)
  }
  if (arr.length > max) {
    throw new Error(`${path} túl nagy (${arr.length}, max ${max}).`)
  }
}

function validateBrainLayer(layer, expectedLen, path) {
  if (!Array.isArray(layer)) {
    throw new Error(`${path} nem tömb.`)
  }
  if (layer.length !== expectedLen) {
    throw new Error(`${path} hossza ${layer.length}, várt ${expectedLen}.`)
  }
  for (let i = 0; i < layer.length; i++) {
    const v = layer[i]
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      throw new Error(`${path}[${i}] nem véges szám.`)
    }
  }
}

function validateBrain(brain, path) {
  if (!brain || typeof brain !== 'object') {
    throw new Error(`${path} hiányzik vagy érvénytelen.`)
  }
  const expectedLayers = BRAIN_LAYERS.length - 1
  if (!Array.isArray(brain.weights) || brain.weights.length !== expectedLayers) {
    throw new Error(`${path}.weights rétegszáma érvénytelen.`)
  }
  if (!Array.isArray(brain.biases) || brain.biases.length !== expectedLayers) {
    throw new Error(`${path}.biases rétegszáma érvénytelen.`)
  }
  for (let layer = 0; layer < expectedLayers; layer++) {
    const inCount = BRAIN_LAYERS[layer]
    const outCount = BRAIN_LAYERS[layer + 1]
    validateBrainLayer(brain.weights[layer], inCount * outCount, `${path}.weights[${layer}]`)
    validateBrainLayer(brain.biases[layer], outCount, `${path}.biases[${layer}]`)
  }
}

function validateCreature(raw, idx) {
  const path = `creatures[${idx}]`
  if (!raw || typeof raw !== 'object') {
    throw new Error(`${path} érvénytelen.`)
  }
  assertFiniteInRange(raw.x, `${path}.x`, -MAX_COORD, MAX_COORD)
  assertFiniteInRange(raw.y, `${path}.y`, -MAX_COORD, MAX_COORD)
  assertFiniteNumber(raw.angle, `${path}.angle`)
  assertFiniteInRange(raw.ageDays, `${path}.ageDays`, 0, 1e6)
  assertFiniteInRange(raw.foodHeld, `${path}.foodHeld`, 0, 1e6)
  if (raw.memory != null) {
    if (!Array.isArray(raw.memory)) {
      throw new Error(`${path}.memory nem tömb.`)
    }
    if (raw.memory.length > MAX_MEMORY_LEN) {
      throw new Error(`${path}.memory túl hosszú.`)
    }
    for (let i = 0; i < raw.memory.length; i++) {
      assertFiniteNumber(raw.memory[i], `${path}.memory[${i}]`)
    }
  }
  validateBrain(raw.genome && raw.genome.brain, `${path}.genome.brain`)
}

function validateTree(raw, idx, key) {
  const path = `${key}[${idx}]`
  if (!raw || typeof raw !== 'object') {
    throw new Error(`${path} érvénytelen.`)
  }
  assertFiniteInRange(raw.x, `${path}.x`, -MAX_COORD, MAX_COORD)
  assertFiniteInRange(raw.y, `${path}.y`, -MAX_COORD, MAX_COORD)
  assertFiniteInRange(raw.r, `${path}.r`, 0, 1e5)
}

export function validateSave(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('A JSON nem objektum.')
  }
  if (data.version !== 1) {
    throw new Error(`Ismeretlen mentés-verzió (${data.version}). Várt: 1.`)
  }
  if (!data.meta || typeof data.meta !== 'object') {
    throw new Error('Hiányzik a meta blokk.')
  }
  assertFiniteInRange(data.meta.worldScale, 'meta.worldScale', MIN_WORLD_SCALE, MAX_WORLD_SCALE)
  assertFiniteInRange(data.meta.day, 'meta.day', 1, 1e6)
  assertFiniteInRange(data.meta.nextCreatureId, 'meta.nextCreatureId', 1, 1e9)

  assertArrayLen(data.creatures, 'creatures', MAX_CREATURES)
  assertArrayLen(data.trees, 'trees', MAX_TREES)
  assertArrayLen(data.waterTrees, 'waterTrees', MAX_TREES)
  if (data.ponds != null) {
    assertArrayLen(data.ponds, 'ponds', MAX_PONDS)
    for (let i = 0; i < data.ponds.length; i++) {
      const p = data.ponds[i]
      if (!p || typeof p !== 'object') {
        throw new Error(`ponds[${i}] érvénytelen.`)
      }
      assertFiniteInRange(p.x, `ponds[${i}].x`, -MAX_COORD, MAX_COORD)
      assertFiniteInRange(p.y, `ponds[${i}].y`, -MAX_COORD, MAX_COORD)
      assertFiniteInRange(p.r, `ponds[${i}].r`, 0, 1e5)
    }
  }

  for (let i = 0; i < data.trees.length; i++) {
    validateTree(data.trees[i], i, 'trees')
  }
  for (let i = 0; i < data.waterTrees.length; i++) {
    validateTree(data.waterTrees[i], i, 'waterTrees')
  }
  for (let i = 0; i < data.creatures.length; i++) {
    validateCreature(data.creatures[i], i)
  }
}
