import { WATER_FRACTION, TRAITS, WORLD_W, WORLD_H, WORLD_SCALE, setWorldScale } from './config.js'
import { recomputeGridDims } from './grid.js'
import { Brain } from './brain.js'
import { Creature } from './creature.js'

export const SAVE_VERSION = 1

export function serializeWorld(world) {
  return {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    meta: {
      day: world.day,
      nextCreatureId: world.nextCreatureId,
      worldScale: WORLD_SCALE,
    },
    config: {
      populationTarget: world.config.populationTarget,
      treeCount: world.config.treeCount,
      mutationFrequency: world.config.mutationFrequency,
      mutationAmount: world.config.mutationAmount,
      crossoverChance: world.config.crossoverChance,
      crossoverAmount: world.config.crossoverAmount,
      hotspotShare: world.config.hotspotShare,
      invasivesEnabled: world.config.invasivesEnabled,
      nightEnabled: world.config.nightEnabled,
      treeDespawnDisabled: world.config.treeDespawnDisabled,
    },
    biome: {
      waterFraction: WATER_FRACTION,
      worldW: WORLD_W,
      worldH: WORLD_H,
    },
    trees: world.landTrees.map(serializeTree),
    waterTrees: world.waterTrees.map(serializeTree),
    creatures: world.creatures.map(serializeCreature),
    ponds: world.ponds.map((p) => ({ x: p.x, y: p.y, r: p.r, seed: p.seed })),
  }
}

function serializeTree(tree) {
  return {
    x: tree.x,
    y: tree.y,
    r: tree.r,
    seed: tree.seed,
    biome: tree.biome,
  }
}

function serializeCreature(c) {
  const genome = { brain: c.genome.brain.toJSON() }
  for (const t of TRAITS) {
    genome[t] = c.genome[t]
  }
  return {
    id: c.id,
    x: c.x,
    y: c.y,
    angle: c.angle,
    generation: c.generation,
    ageDays: c.ageDays,
    foodHeld: c.foodHeld,
    children: c.children,
    denials: c.denials,
    genome,
    memory: Array.from(c.memory),
  }
}

export function applySave(world, data) {
  if (data.meta && typeof data.meta.worldScale === 'number') {
    const scale = Math.min(10, Math.max(1, data.meta.worldScale))
    setWorldScale(scale)
    recomputeGridDims()
    world.rebuildAfterResize()
  }

  Object.assign(world.config, data.config)

  world.day = data.meta.day
  world.phase = 'day'
  world.phaseTick = 0
  world.globalTick = 0
  world.nextCreatureId = data.meta.nextCreatureId
  world.bestGenome = null
  world.bestGenomeAgeDays = 0
  world.traitHistory = []
  world.nightStats = { survived: 0, born: 0, invasives: 0, died: 0, denied: 0 }
  world.prevMeadowMarks = []
  world.prevFlowers = []
  world.prevWaterMarks = []
  world.prevRocks = []
  world.prevLilypads = []
  world.prevLandTrees = []
  world.prevWaterTrees = []
  world.treeGridStamp = -1

  if (Array.isArray(data.ponds)) {
    world.ponds = data.ponds.map((p) => ({
      x: p.x, y: p.y, r: p.r,
      seed: typeof p.seed === 'number' ? p.seed : Math.random() * 1000,
    }))
  } else {
    world.generatePonds()
  }

  const s = world.createSurfaceDecoration()
  world.meadowMarks = s.marks
  world.flowers = s.flowerList
  world.waterMarks = s.waterMarks
  world.rocks = s.rocks
  world.lilypads = s.lilypads

  world.landTrees = data.trees.map((t) => ({ ...t }))
  world.waterTrees = data.waterTrees.map((t) => ({ ...t }))

  world.creatures = data.creatures.map((raw) => {
    const c = new Creature(world, deserializeGenome(raw.genome), raw.x, raw.y, raw.generation)
    c.id = raw.id
    c.angle = raw.angle
    c.ageDays = raw.ageDays
    c.foodHeld = raw.foodHeld
    c.children = raw.children || 0
    c.denials = raw.denials || 0
    if (Array.isArray(raw.memory)) {
      for (let i = 0; i < raw.memory.length && i < c.memory.length; i++) {
        c.memory[i] = raw.memory[i]
      }
    }
    return c
  })

  let maxId = 0
  for (const c of world.creatures) {
    if (c.id > maxId) {
      maxId = c.id
    }
  }
  world.nextCreatureId = Math.max(world.nextCreatureId, maxId + 1)

  world.food = []
  world.resetDailyFood()
  world.rebuildCreatureGrid()
  world.recordTraitHistory()
}

function deserializeGenome(raw) {
  const g = { brain: Brain.fromJSON(raw.brain) }
  for (const t of TRAITS) {
    g[t] = typeof raw[t] === 'number' ? raw[t] : 0.5
  }
  return g
}
