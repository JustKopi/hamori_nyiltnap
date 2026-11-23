// All tunable constants. Reading this file should tell you the game balance
// at a glance — no balance numbers should live anywhere else.

export const VIEW_W = 1280
export const VIEW_H = 720

// Map size relative to the recording viewport. The "Méret" slider in
// advanced controls this value at runtime (range 1..10). Tree count,
// population target, and any density-derived metric scale by
// (WORLD_SCALE / BASE_WORLD_SCALE)² so density stays constant as the
// world grows.
//
// These are `export let` (not const) because ES module bindings are
// live — when setWorldScale() reassigns them, every importer reads the
// new value without restarting the page.
export const BASE_WORLD_SCALE = 4
export let WORLD_SCALE = BASE_WORLD_SCALE
export let WORLD_W = VIEW_W * WORLD_SCALE
export let WORLD_H = VIEW_H * WORLD_SCALE

// Water occupies the left fraction of the world. Coastline is a vertical
// boundary at x = WORLD_W * WATER_FRACTION.
export const WATER_FRACTION = 1 / 3
export let WATER_BOUNDARY_X = WORLD_W * WATER_FRACTION

// Recompute the world dimensions when the size slider changes. Must be
// followed by a grid recompute (grid.js:recomputeGridDims) and a full
// world.resetSimulation() so the simulation matches the new dims.
export function setWorldScale(scale) {
  WORLD_SCALE = scale
  WORLD_W = VIEW_W * WORLD_SCALE
  WORLD_H = VIEW_H * WORLD_SCALE
  WATER_BOUNDARY_X = WORLD_W * WATER_FRACTION
}

// Multiplier applied to density-derived counts (trees, population) so
// the slider value means "count at default size" and the actual count
// scales with area.
export function densityScaleFactor() {
  return (WORLD_SCALE / BASE_WORLD_SCALE) ** 2
}

export const BALANCE = {
  // Day cycle
  DAY_LENGTH: 5500,
  NIGHT_LENGTH: 220,
  DAWN_LENGTH: 60,

  // Population / food
  FOOD_RATIO: 0.8,
  FOOD_SPAWN_DAY_FRACTION: 0.7,
  STARTING_FOOD: 2,
  SURVIVAL_RESERVE: 2,
  DAILY_FOOD_COST: 1,
  FOOD_CAP: 5,
  MAX_OFFSPRING: 3,

  // World
  WALL_MARGIN: 14,
  TREE_REPLACEMENT_CHANCE: 0.05,
  // Per-tree fade-in / fade-out duration in ticks. ~NIGHT_LENGTH so
  // replacements run quietly across the night and are settled by dawn.
  TREE_FADE_TICKS: 200,

  // Vision rays
  TYPE_RAY_COUNT: 3,
  // Baseline side-ray angle offset (applied even to fully-focused
  // creatures). Bumped from 10° → 22° so every creature has a wider
  // peripheral cone — cuts down on the spin-in-place search behaviour
  // and stacks linearly with the focus-driven spread.
  RAY_BASE_SIDE_OFFSET: (22 * Math.PI) / 180,
  RAY_FOCUS_SIDE_SPREAD: (87.5 * Math.PI) / 180,

  // Movement
  TURN_SCALE: (10 * Math.PI) / 180,
  TANK_TURN_PENALTY: 0.55,

  // Burst
  BURST_DURATION: 120,
  RECOVERY_DURATION: 120,
  BURST_TRIGGER: 0.3,
  MEMORY_KEEP: 0.9,

  // Combat
  CONTEST_THRESHOLD: 0.10,
  KO_BASE: 64,
  KO_SCALE: 1172.8,
  KO_MAX: 640,
  CONTEST_COOLDOWN: 36,
}

export const COLORS = {
  // Land palette
  grassBase: '#7c9e5c',
  grassDeep: '#5e8043',
  grassLight: '#9ab97a',
  grassShadow: '#3e5a2a',
  bladeStroke: '#3a5025',
  treeLeaf: '#4f7233',
  treeLeafDark: '#324d1f',
  treeLeafLight: '#79994f',

  // Water palette — same compositional roles as grass/leaf so the
  // renderer can swap them without per-call branching beyond palette
  // selection.
  waterBase: '#3a7e9c',
  waterDeep: '#1f5a78',
  waterLight: '#5fa3c0',
  waterShadow: '#1a3a52',
  kelpLeaf: '#2e6e58',
  kelpLeafDark: '#1b4a3a',
  kelpLeafLight: '#4a9b7a',

  // Rocks — warm gray for land, cool teal-gray for submerged.
  // Same two-tone (dark base + light highlight) as trees so the
  // flat top-down style is consistent.
  rockLight: '#a6a59a',
  rockDark: '#6e6d63',
  rockLightWet: '#7a949c',
  rockDarkWet: '#4c656f',

  // Food
  foodRed: '#e84a36',
  foodGold: '#f4c235',
  foodHi: '#fff4c8',

  // Atmosphere
  ink: '#1a2113',
  inkSoft: 'rgba(26, 33, 19, 0.7)',
  duskTint: 'rgba(220, 130, 60, 0.18)',
  dawnTint: 'rgba(120, 150, 220, 0.16)',
  nightTint: 'rgba(14, 22, 44, 0.62)',
  starColor: 'rgba(245, 248, 220, 0.85)',
}

// Lily pads — a darker green ring and a brighter top, distinctly more
// yellow-green than the kelp palette so pads stand out against water-
// trees. Flowers (rare) pick a dark+light pair from LILY_FLOWER_COLORS.
export const LILY_PAD_DARK = '#3a5a2c'
export const LILY_PAD_FILL = '#5e8a40'
export const LILY_FLOWER_COLORS = [
  { dark: '#cfc8b8', light: '#fbf6e8' }, // white
  { dark: '#c47b94', light: '#f3c4d2' }, // pink
  { dark: '#c7a23a', light: '#f4dd6a' }, // yellow
]


// How many trait history points to keep on the chart.
export const HISTORY_LIMIT = 60

// Trail ring-buffer capacity per creature. Was originally a JS array
// with .push/.shift; now a Float32Array ring buffer of this length.
// 22 captures roughly the last 88 ticks (push every 4th tick).
export const TRAIL_CAPACITY = 22

// Vision range scales with map size by sqrt(WORLD_SCALE / BASE_WORLD_SCALE),
// but caps here so it doesn't grow without bound at extreme sizes.
export const MAX_VISION_RADIUS = 900

// Speed scales with the same sqrt factor and caps at this multiplier.
// At size=4 (default) speed is 1.0× baseline; at size=16+ it saturates at 2×.
export const MAX_SPEED_SCALE = 2.0

// Reseed-after-extinction behavior: while the best-tracked lineage is
// younger than this many days, all reseeded creatures are heavy mutations
// of it (preserves what little learning exists). Older lineages get a
// 50/50 split with random genomes (fresh blood for established populations).
export const ESTABLISHED_AGE_DAYS = 5

export const DEFAULT_WORLD_CONFIG = {
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
  treeDespawnDisabled: false,
}

// Trait list — re-exported from trait-defs.js for callers that already
// import from config. New code should import directly from trait-defs.js.
export { TRAITS } from './trait-defs.js'

// Tree placement: hotspots produce dense clusters. Water hotspots live in
// the water region (x < WATER_BOUNDARY_X), land hotspots in the land
// region. Each tree roll picks a placement plan from the appropriate set.
//
// Hot spot radius scales as (WORLD_SCALE / BASE_WORLD_SCALE)^0.4 — i.e.,
// the cluster area grows slower than linearly with map scale while the
// tree count in the cluster grows quadratically (via densityScaleFactor),
// so cluster density grows with map size. Linear scaling kept density
// flat and made hotspots stop looking like hotspots on large maps.
// Exponent 0.4 (slightly tighter than sqrt=0.5) gives ~15–20% denser
// clusters at scale 8–10 than pure sqrt. At scale=4 the radius is 440
// (unchanged); at scale=9 it's ~614; at scale=10 it's ~634.
const BASE_HOT_SPOT_RADIUS = 440
const HOT_SPOT_RADIUS_EXPONENT = 0.4
export function getHotSpotRadius() {
  return BASE_HOT_SPOT_RADIUS * (WORLD_SCALE / BASE_WORLD_SCALE) ** HOT_SPOT_RADIUS_EXPONENT
}

// Four conceptual hotspots: one deep in water, one straddling the
// coastline (registered in both lists, water half offset to the left of
// the boundary and land half offset to the right so the Gaussian's bulk
// lands on the correct side instead of being clamped to a wall on the
// boundary line), two cleanly inland.
const BORDER_OFFSET = 0.06 // fraction of WORLD_W on each side of the coastline (~12% apart total)
export function landHotspots() {
  return [
    { cx: WATER_BOUNDARY_X + WORLD_W * BORDER_OFFSET, cy: WORLD_H * 0.62 },
    { cx: WORLD_W * 0.60,                              cy: WORLD_H * 0.22 },
    { cx: WORLD_W * 0.85,                              cy: WORLD_H * 0.78 },
  ]
}

export function waterHotspots() {
  return [
    { cx: WORLD_W * 0.14,                              cy: WORLD_H * 0.30 },
    { cx: WATER_BOUNDARY_X - WORLD_W * BORDER_OFFSET, cy: WORLD_H * 0.62 },
  ]
}

// Food sprites are tiny relative to vision range — pad their effective ray
// radius so creatures can actually spot them with a side ray. Bumped from
// 10 → 28 so food has a meaningful angular silhouette even in a busy
// hotspot where trees and other creatures dominate the brain's input —
// directly targets the "spin-in-place to scan" behaviour.
export const FOOD_RAY_PADDING = 28
