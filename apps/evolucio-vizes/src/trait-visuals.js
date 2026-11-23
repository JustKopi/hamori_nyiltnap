// Trait → appearance mappings. The renderer asks this module for colors,
// sizes, and shape parameters derived from a creature's genome. Keep all
// trait-driven visual constants here; render.js should only contain
// drawing primitives and composition.

// Color: HSL pulled toward a coral / reef-fish orange by the water
// trait — the complement of ocean blue, so water creatures pop hard
// against the blue background (think clownfish on coral). Saturation
// stays high; lightness gets a small positive nudge so water creatures
// don't fall into the murky deep tones.
export const WATER_CREATURE_HUE = 18
export const WATER_CREATURE_SAT_BUMP = 45
export const WATER_CREATURE_LIGHT_BUMP = 4
export const WATER_HUE_PULL = 1.0

export function traitHue(genome) {
  const baseHue = 215 - genome.vision * 155 + genome.tank * 40
  const hue = baseHue + (WATER_CREATURE_HUE - baseHue) * genome.water * WATER_HUE_PULL
  return ((hue % 360) + 360) % 360
}

export function traitSat(genome) {
  return 70 + genome.burst * 22 + genome.water * WATER_CREATURE_SAT_BUMP
}

export function traitLight(genome) {
  return 56 - genome.tank * 16 + genome.focus * 14 + genome.water * WATER_CREATURE_LIGHT_BUMP
}

// Spiky/furry body decoration appears as `water` drops — terrestrial
// specialists are visibly hairy, aquatic ones are smooth. Returns 0..1.
export function furAmount(genome) {
  return 1 - genome.water
}

// Foragers have softer/rounder body corners — visual cue for the
// "loves to nose around" trait.
export function cornerRadius(genome, halfW) {
  return Math.max(2, halfW * (0.18 + genome.forage * 0.78))
}

// Vision drives eye size; focus drives how many eyes are drawn and how
// wide they sit. High focus → one big forward eye. Low focus → three
// spread eyes (matches the side-ray spread used by the sense system).
export function eyeRadius(genome, r) {
  return Math.max(1.8, r * (0.18 + 0.20 * genome.vision))
}

export function eyeCount(genome) {
  if (genome.focus > 0.7) {
    return 1
  }
  if (genome.focus > 0.35) {
    return 2
  }
  return 3
}

// Dashed ring around a focused creature showing how far it can grab food
// without aiming directly at it.
export function forageZoneRadius(genome, r) {
  return r + 4 + genome.forage * 8
}

// Body outline thickness: tanky creatures get a heavier rim.
export function bodyOutlineWidth(genome, focused) {
  return focused ? 2.4 : 0.7 + genome.tank * 1.4
}
