// Biome system: water vs land. The world is partitioned by a vertical
// boundary at WATER_BOUNDARY_X. Creatures get a biome-aware speed
// multiplier from the `water` trait — linear blend between water and land
// proficiency. Coastal creatures end up specialized, hybrids stay slow
// everywhere.
//
// Designed to extend: add a third biome (e.g. desert) by widening this
// module to a region list with per-region speed multipliers and palette.

import { WATER_BOUNDARY_X } from './config.js'

export const BIOME = {
  LAND: 0,
  WATER: 1,
}

// Inland ponds count as water for the speed-multiplier and sensing
// purposes. `ponds` is an array of {x, y, r} (or undefined for callers
// that don't have pond context — e.g. early init paths).
export function isInPond(x, y, ponds) {
  if (!ponds) {
    return false
  }
  for (let i = 0; i < ponds.length; i++) {
    const p = ponds[i]
    const dx = x - p.x
    const dy = y - p.y
    if (dx * dx + dy * dy <= p.r * p.r) {
      return true
    }
  }
  return false
}

export function biomeAt(x, y, ponds) {
  if (x < WATER_BOUNDARY_X) {
    return BIOME.WATER
  }
  
  if (isInPond(x, y, ponds)) {
    return BIOME.WATER
  }

  return BIOME.LAND
}

export function isInWater(x, y, ponds) {
  if (x < WATER_BOUNDARY_X) {
    return true
  }
  
  return isInPond(x, y, ponds)
}

// Genome.water is the linear blend factor. At water=0.8 a creature moves
// at 80% of base in water and 20% on land. At water=0 it's a pure land
// specialist (and stuck if it ends up in water).
export function waterSpeedMult(genome) {
  return genome.water
}

export function landSpeedMult(genome) {
  return 1 - genome.water
}

export function biomeSpeedMult(genome, x, y, ponds) {
  return isInWater(x, y, ponds) ? waterSpeedMult(genome) : landSpeedMult(genome)
}
