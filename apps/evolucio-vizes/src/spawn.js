// Spawn-location and starting-genome rules. Both the initial population
// and the post-extinction reseed go through here so the "Vízi indulás"
// toggle can't apply to one path and not the other (a previous bug).

import { WORLD_W, WORLD_H, WATER_BOUNDARY_X, BALANCE } from './config.js'
import { rand } from './math.js'

export function initialPopulationCount(config) {
  return config.waterStartEnabled
    ? Math.floor(config.populationTarget / 3)
    : config.populationTarget
}

export function randomSpawnLocation(config) {
  if (config.waterStartEnabled) {
    const m = BALANCE.WALL_MARGIN
    return {
      x: rand(m, WATER_BOUNDARY_X - m),
      y: rand(m, WORLD_H - m),
    }
  }
  return {
    x: rand(28, WORLD_W - 28),
    y: rand(28, WORLD_H - 28),
  }
}

// Bias a fresh random genome toward the chosen biome. Genomes derived
// from an established lineage should NOT pass through here — they keep
// whatever water trait they evolved.
export function biasFreshGenome(genome, config) {
  if (config.waterStartEnabled) {
    // Spread across 80–100% rather than a uniform 100% so the starting
    // population isn't genetically identical on the water axis.
    genome.water = rand(0.8, 1)
  }
  return genome
}
