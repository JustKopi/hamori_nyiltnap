// Single source of truth for trait metadata. Order here defines display
// order in the HUD chart and history sums. Adding a trait means:
//   1. append an entry here,
//   2. add a default in genome.js's randomGenome,
//   3. add a HUD bar in play.html (id `${name}Bar`, `${name}Avg`)
//      and a CSS color in play.css (`.bar-${name}`),
//   4. wire up its physical effect in creature.js / biome.js / etc.

export const TRAIT_DEFS = [
  { name: 'tank',   huLabel: 'Tank',         color: '#e2604b' },
  { name: 'vision', huLabel: 'Látás',        color: '#f5c63a' },
  { name: 'focus',  huLabel: 'Fókusz',       color: '#9c79e0' },
  { name: 'burst',  huLabel: 'Sprint',       color: '#f08a3a' },
  { name: 'forage', huLabel: 'Fürkész',      color: '#4ec5b8' },
  { name: 'water',  huLabel: 'Víz kedvelő',  color: '#5fa3c0' },
]

export const TRAITS = TRAIT_DEFS.map((d) => d.name)

export const TRAIT_COLORS = Object.fromEntries(
  TRAIT_DEFS.map((d) => [d.name, d.color]),
)

export const TRAIT_LABELS = Object.fromEntries(
  TRAIT_DEFS.map((d) => [d.name, d.huLabel]),
)
