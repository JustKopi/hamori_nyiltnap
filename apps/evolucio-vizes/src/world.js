import {
  BALANCE,
  COLORS,
  WORLD_W,
  WORLD_H,
  WORLD_SCALE,
  BASE_WORLD_SCALE,
  WATER_BOUNDARY_X,
  HISTORY_LIMIT,
  DEFAULT_WORLD_CONFIG,
  ESTABLISHED_AGE_DAYS,
  getHotSpotRadius,
  landHotspots,
  waterHotspots,
} from './config.js'
import { TAU, clamp, rand, distSq } from './math.js'
import { makeGrid, gridIndex, queryGrid, clearGrid, GRID_CELL, GRID_COLS, GRID_ROWS } from './grid.js'
import { Creature } from './creature.js'
import {
  randomGenome,
  cloneGenome,
  mutateGenome,
  applyMutation,
  crossoverGenome,
} from './genome.js'
import {
  initialPopulationCount,
  randomSpawnLocation,
  biasFreshGenome,
} from './spawn.js'
import { TRAITS } from './trait-defs.js'

export class World {
  constructor(config) {
    this.config = Object.assign({}, DEFAULT_WORLD_CONFIG, config || {})
    this.creatures = []
    this.food = []
    this.landTrees = []
    this.waterTrees = []
    this.prevLandTrees = []
    this.prevWaterTrees = []
    this.meadowMarks = []
    this.prevMeadowMarks = []
    this.flowers = []
    this.prevFlowers = []
    this.waterMarks = []
    this.prevWaterMarks = []
    this.rocks = []
    this.prevRocks = []
    this.lilypads = []
    this.prevLilypads = []
    this.ponds = []
    this.day = 1
    this.phase = 'day'
    this.phaseTick = 0
    this.globalTick = 0
    this.dailyFoodTarget = 0
    this.dailyFoodSpawned = 0
    this.nextCreatureId = 1
    this.bestGenome = null
    this.bestGenomeAgeDays = 0
    this.nightStats = { survived: 0, born: 0, invasives: 0, died: 0, denied: 0 }
    this.traitHistory = []
    this.creatureGrid = makeGrid()
    this.foodGrid = makeGrid()
    this.treeGrid = makeGrid()
    this.treeGridStamp = -1
    this.foodQueryBuffer = []
    this.contestQueryBuffer = []
  }

  setConfig(partial) { Object.assign(this.config, partial || {}) }

  rebuildAfterResize() {
    this.creatureGrid = makeGrid()
    this.foodGrid = makeGrid()
    this.treeGrid = makeGrid()
    this.treeGridStamp = -1
  }

  regenerateTrees() {
    this.prevLandTrees = []
    this.prevWaterTrees = []
    this.generateAllTrees()
    this.resetDailyFood()
  }

  foodBudget() {
    return Math.floor(this.config.populationTarget * BALANCE.FOOD_RATIO)
  }

  notifyFocusCreature(creature) {
    if (this.config.onReseed) {
      this.config.onReseed(creature)
    }
  }

  keepInBounds(creature) {
    const margin = BALANCE.WALL_MARGIN
    if (creature.x < margin) {
      creature.x = margin
      creature.angle = 0
    } else if (creature.x > WORLD_W - margin) {
      creature.x = WORLD_W - margin
      creature.angle = Math.PI
    } else if (creature.y < margin) {
      creature.y = margin
      creature.angle = Math.PI / 2
    } else if (creature.y > WORLD_H - margin) {
      creature.y = WORLD_H - margin
      creature.angle = -Math.PI / 2
    }
  }

  allTrees() { return this.landTrees.concat(this.waterTrees) }

  rebuildCreatureGrid() {
    clearGrid(this.creatureGrid)
    for (const c of this.creatures) {
      if (!c.alive) {
        c._cellIndex = -1
        continue
      }
      const idx = gridIndex(c.x, c.y)
      c._cellIndex = idx
      this.creatureGrid[idx].push(c)
    }
  }

  rebuildTreeGrid() {
    clearGrid(this.treeGrid)
    for (const tree of this.landTrees) {
      this.treeGrid[gridIndex(tree.x, tree.y)].push(tree)
    }
    for (const tree of this.waterTrees) {
      this.treeGrid[gridIndex(tree.x, tree.y)].push(tree)
    }
  }

  ensureTreeGrid() {
    const stamp = this.landTrees.length * 100003 + this.waterTrees.length
    if (this.treeGridStamp !== stamp) {
      this.rebuildTreeGrid()
      this.treeGridStamp = stamp
    }
  }

  createSurfaceDecoration() {
    const marks = []
    const flowerList = []
    const waterMarks = []
    const rocks = []
    const areaScale = (WORLD_W * WORLD_H) / (1280 * 720) / 9

    const landBladeCount = Math.floor(520 * 9 * areaScale * (2 / 3))
    for (let i = 0; i < landBladeCount; i++) {
      const x = rand(WATER_BOUNDARY_X, WORLD_W)
      marks.push({
        x,
        y: rand(0, WORLD_H),
        len: rand(4, 14),
        angle: rand(-0.7, 0.7),
        alpha: rand(0.22, 0.5),
        sway: rand(0.6, 1.4),
        dark: Math.random() < 0.7,
      })
    }
    const landFlowerCount = Math.floor(70 * 9 * areaScale * (2 / 3))
    for (let i = 0; i < landFlowerCount; i++) {
      flowerList.push({
        x: rand(WATER_BOUNDARY_X, WORLD_W),
        y: rand(0, WORLD_H),
        r: rand(1.4, 2.8),
        color: Math.random() < 0.55 ? '#f6d56a' : '#e8a26e',
      })
    }
    const waterMarkCount = Math.floor(280 * 9 * areaScale * (1 / 3))
    for (let i = 0; i < waterMarkCount; i++) {
      waterMarks.push({
        x: rand(0, WATER_BOUNDARY_X),
        y: rand(0, WORLD_H),
        len: rand(6, 16),
        angle: rand(-0.2, 0.2),
        alpha: rand(0.12, 0.32),
        sway: rand(0.7, 1.4),
      })
    }
    const landRockCount = Math.floor(35 * areaScale * (2 / 3))
    for (let i = 0; i < landRockCount; i++) {
      rocks.push({
        x: rand(WATER_BOUNDARY_X, WORLD_W),
        y: rand(0, WORLD_H),
        r: rand(7, 18),
        ratio: rand(0.55, 1.0),
        angle: rand(0, TAU),
        seed: Math.random() * 1000,
        biome: 'land',
      })
    }
    const waterRockCount = Math.floor(45 * areaScale * (1 / 3))
    for (let i = 0; i < waterRockCount; i++) {
      rocks.push({
        x: rand(0, WATER_BOUNDARY_X),
        y: rand(0, WORLD_H),
        r: rand(5, 13),
        ratio: rand(0.65, 1.0),
        angle: rand(0, TAU),
        seed: Math.random() * 1000,
        biome: 'water',
      })
    }
    const lilypads = []
    const lilyCount = Math.floor(20 * areaScale * (1 / 3))
    for (let i = 0; i < lilyCount; i++) {
      const r = rand(16, 28)
      const margin = BALANCE.WALL_MARGIN + r
      lilypads.push({
        x: rand(margin, WATER_BOUNDARY_X - margin),
        y: rand(margin, WORLD_H - margin),
        r,
        angle: rand(0, TAU),
        flowerIndex: Math.random() < 0.25 ? Math.floor(Math.random() * 3) : -1,
      })
    }
    return { marks, flowerList, waterMarks, rocks, lilypads }
  }

  regenerateSurface() {
    this.prevMeadowMarks = this.meadowMarks
    this.prevFlowers = this.flowers
    this.prevWaterMarks = this.waterMarks
    this.prevRocks = this.rocks
    this.prevLilypads = this.lilypads
    const s = this.createSurfaceDecoration()
    this.meadowMarks = s.marks
    this.flowers = s.flowerList
    this.waterMarks = s.waterMarks
    this.rocks = s.rocks
    this.lilypads = s.lilypads
  }

  generatePonds() {
    const ponds = []
    const scaleFactor = WORLD_SCALE / BASE_WORLD_SCALE
    const baseCount = 2 + Math.floor(Math.random() * 2)
    const extraCount = Math.max(0, Math.floor((scaleFactor - 1) * 2))
    const targetCount = Math.min(4, baseCount + extraCount)
    for (let attempt = 0; attempt < 80 && ponds.length < targetCount; attempt++) {
      const candidate = this.makePondCandidate(ponds)
      if (candidate) {
        ponds.push(candidate)
      }
    }
    this.ponds = ponds
  }

  makePondCandidate(existing) {
    const scaleFactor = WORLD_SCALE / BASE_WORLD_SCALE
    const minSep = 220
    for (let attempt = 0; attempt < 60; attempt++) {
      // Base radius range widened (was 120–210) for more visible size
      // variety — some ponds end up small, others noticeably larger.
      // Still scales linearly with world size.
      const r = rand(110, 245) * scaleFactor
      const margin = BALANCE.WALL_MARGIN + r + 40
      if (WATER_BOUNDARY_X + margin >= WORLD_W - margin) {
        return null
      }
      if (margin >= WORLD_H - margin) {
        return null
      }
      const x = rand(WATER_BOUNDARY_X + margin, WORLD_W - margin)
      const y = rand(margin, WORLD_H - margin)
      let ok = true
      for (const p of existing) {
        const dx = x - p.x, dy = y - p.y
        if (Math.sqrt(dx * dx + dy * dy) < r + p.r + minSep) { ok = false; break }
      }
      if (ok) {
        return { x, y, r, seed: Math.random() * 1000 }
      }
    }
    return null
  }

  isInPond(x, y) {
    for (let i = 0; i < this.ponds.length; i++) {
      const p = this.ponds[i]
      const dx = x - p.x, dy = y - p.y
      if (dx * dx + dy * dy <= p.r * p.r) {
        return true
      }
    }
    return false
  }

  generateAllTrees() {
    const total = this.config.treeCount
    // Tree count is split proportional to biome area (water region is
    // 1/3 of the map), keeping overall vegetation density even between
    // biomes. Per-hotspot density is equalised separately in
    // treePlacementPlan by amplifying water's hotspot share — that way
    // clusters look the same on both sides without flooding water with
    // total trees.
    const waterShare = 1 / 3
    const waterCount = Math.round(total * waterShare)
    const landCount = total - waterCount
    this.landTrees = this.generateBiomeTrees(landCount, 'land')
    this.waterTrees = this.generateBiomeTrees(waterCount, 'water')
    this.treeGridStamp = -1
  }

  generateBiomeTrees(count, biome) {
    const result = []
    const minDistance = 92
    const plan = this.treePlacementPlan(count, biome)
    for (let i = 0; i < count; i++) {
      result.push(this.createTreeAt(plan[i], result, minDistance, biome))
    }
    return result
  }

  treePlacementPlan(count, biome) {
    // Water gets the area-proportional share of total trees (half what
    // land gets), so we amplify its effective hotspot share by the
    // inverse ratio to keep per-hotspot counts roughly equal between
    // biomes. Clamp keeps the slider's intent: 0 = none, 0.5 = most.
    const baseShare = clamp(this.config.hotspotShare, 0, 0.5)
    const biomeBoost = biome === 'water' ? 2 : 1
    const share = Math.min(0.5, baseShare * biomeBoost)
    const spots = biome === 'water' ? waterHotspots() : landHotspots()
    const perSpot = Math.round(count * share)
    const used = perSpot * spots.length
    const scatterCount = Math.max(0, count - used)
    const plan = []
    for (const spot of spots) {
      for (let i = 0; i < perSpot; i++) {
        plan.push({ kind: 'hotspot', spot, biome })
      }
    }
    for (let i = 0; i < scatterCount; i++) {
      plan.push({ kind: 'scatter', biome })
    }
    return plan
  }

  createTreeAt(placement, existingTrees, minDistance, biome, excludeIndex) {
    // birthTick = 0 means "no fade-in needed" (used for the initial
    // world-generation pass before any ticks have elapsed). Daily
    // replacements pass the current globalTick so each new tree fades
    // in over TREE_FADE_TICKS.
    const birthTick = 0
    for (let attempt = 0; attempt < 150; attempt++) {
      const point = this.samplePlacement(placement)
      const actualBiome = biome === 'land' && this.isInPond(point.x, point.y) ? 'water' : biome
      const candidate = {
        x: point.x,
        y: point.y,
        r: rand(30, 46),
        seed: Math.random() * 1000,
        biome: actualBiome,
        birthTick,
      }
      if (this.hasTreeSpacing(candidate, existingTrees, minDistance, excludeIndex)) {
        return candidate
      }
    }
    const fallback = this.samplePlacement(placement)
    const fbBiome = biome === 'land' && this.isInPond(fallback.x, fallback.y) ? 'water' : biome
    return {
      x: fallback.x, y: fallback.y, r: rand(30, 46),
      seed: Math.random() * 1000, biome: fbBiome, birthTick,
    }
  }

  hasTreeSpacing(candidate, existingTrees, minDistance, excludeIndex) {
    const minDistSq = minDistance * minDistance
    for (let i = 0; i < existingTrees.length; i++) {
      if (i === excludeIndex) {
        continue
      }
      const e = existingTrees[i]
      if (distSq(candidate.x, candidate.y, e.x, e.y) < minDistSq) {
        return false
      }
    }
    return true
  }

  samplePlacement(placement) {
    if (placement.kind === 'scatter') {
      const margin = BALANCE.WALL_MARGIN
      if (placement.biome === 'water') {
        return {
          x: rand(margin, WATER_BOUNDARY_X - margin),
          y: rand(margin, WORLD_H - margin),
        }
      }
      return {
        x: rand(WATER_BOUNDARY_X + margin, WORLD_W - margin),
        y: rand(margin, WORLD_H - margin),
      }
    }
    const spot = placement.spot
    const angle = Math.random() * TAU
    const hotR = getHotSpotRadius()
    // Sigma controls how tightly trees pack toward the spot center.
    // sigma = hotR / divisor — LARGER divisor = smaller sigma = tighter
    // cluster, SMALLER divisor = wider spread. We keep divisor=4 up to
    // scale 7.5 (looks like a real hotspot at default sizes); past 7.5
    // we reduce the divisor so the much larger tree count at big scales
    // spreads across the cluster instead of cramming into the center.
    // Floor at 1.6 so the gaussian still pulls noticeably toward center.
    const sizeOver = Math.max(0, WORLD_SCALE - 7.5)
    const divisor = Math.max(1.6, 4 - sizeOver * 0.8)
    const sigma = hotR / divisor
    const u = Math.max(1e-9, Math.random())
    const r = Math.min(hotR, sigma * Math.sqrt(-2 * Math.log(u)))
    const margin = BALANCE.WALL_MARGIN
    let x = spot.cx + Math.cos(angle) * r
    let y = spot.cy + Math.sin(angle) * r
    if (placement.biome === 'water') {
      x = clamp(x, margin, WATER_BOUNDARY_X - margin)
    } else {
      x = clamp(x, WATER_BOUNDARY_X + margin, WORLD_W - margin)
    }
    y = clamp(y, margin, WORLD_H - margin)
    return { x, y }
  }

  randomReplacementPlacement(biome) {
    const r = Math.random()
    // Same biome boost as treePlacementPlan so daily tree replacements
    // preserve the per-hotspot density balance over time.
    const baseShare = clamp(this.config.hotspotShare, 0, 0.5)
    const biomeBoost = biome === 'water' ? 2 : 1
    const share = Math.min(0.5, baseShare * biomeBoost)
    const spots = biome === 'water' ? waterHotspots() : landHotspots()
    if (r < share) {
      return { kind: 'hotspot', spot: spots[0], biome }
    }
    if (r < share * 2) {
      return { kind: 'hotspot', spot: spots[1] || spots[0], biome }
    }
    return { kind: 'scatter', biome }
  }

  replaceDailyTrees() {
    if (this.config.treeDespawnDisabled) {
      return
    }
    let anyChanged = false
    const now = this.globalTick
    const fadeDone = (deathTick) => (now - (deathTick || 0)) >= BALANCE.TREE_FADE_TICKS
    for (const biome of ['land', 'water']) {
      const prevKey = biome === 'water' ? 'prevWaterTrees' : 'prevLandTrees'
      // Drop any prev trees whose fade-out has already finished. New
      // dying trees from this pass get appended below.
      this[prevKey] = this[prevKey].filter((t) => !fadeDone(t.deathTick))
      const list = biome === 'water' ? this.waterTrees : this.landTrees
      if (list.length === 0) {
        continue
      }
      const next = list.slice()
      const minDistance = 92
      let changed = false
      for (let i = 0; i < list.length; i++) {
        if (Math.random() >= BALANCE.TREE_REPLACEMENT_CHANCE) {
          continue
        }
        const placement = this.randomReplacementPlacement(biome)
        const newTree = this.createTreeAt(placement, next, minDistance, biome, i)
        newTree.birthTick = now
        const dyingTree = { ...list[i], deathTick: now }
        this[prevKey].push(dyingTree)
        next[i] = newTree
        changed = true
      }
      if (changed) {
        if (biome === 'water') {
          this.waterTrees = next
        }
        else {
          this.landTrees = next
        }
        anyChanged = true
      }
    }
    if (anyChanged) {
      this.treeGridStamp = -1
    }
  }

  resetDailyFood() {
    this.food = []
    clearGrid(this.foodGrid)
    this.dailyFoodTarget = this.foodBudget()
    if (this.phase === 'day') {
      const spawnWindow = BALANCE.DAY_LENGTH * BALANCE.FOOD_SPAWN_DAY_FRACTION
      this.dailyFoodSpawned = Math.floor((Math.min(this.phaseTick, spawnWindow) / spawnWindow) * this.dailyFoodTarget)
    } else {
      this.dailyFoodSpawned = 0
    }
  }

  spawnFoodItem() {
    const treesLand = this.landTrees
    const treesWater = this.waterTrees
    const totalTrees = treesLand.length + treesWater.length
    if (totalTrees === 0 || this.dailyFoodSpawned >= this.dailyFoodTarget) {
      return false
    }
    const pickIndex = Math.floor(Math.random() * totalTrees)
    const tree = pickIndex < treesLand.length
      ? treesLand[pickIndex]
      : treesWater[pickIndex - treesLand.length]
    // Food just rings its tree. It deliberately does NOT respect biomes:
    // collectFood() is pure distance (any creature eats any food it can
    // reach) and nothing reads food.biome. Earlier versions clamped/
    // rejected food to keep it in the tree's biome — that was the root
    // cause of coast-tree food being yanked onto the shoreline away from
    // its tree. Clamp only to the world edges so it never goes off-map.
    const angle = rand(0, TAU)
    const distance = rand(tree.r * 0.28, tree.r * 1.7)
    const margin = BALANCE.WALL_MARGIN
    const x = clamp(tree.x + Math.cos(angle) * distance, margin, WORLD_W - margin)
    const y = clamp(tree.y + Math.sin(angle) * distance, margin, WORLD_H - margin)
    const item = {
      x, y,
      r: rand(3.4, 5.2),
      color: Math.random() < 0.55 ? COLORS.foodRed : COLORS.foodGold,
      biome: tree.biome,
      index: this.food.length,
    }
    this.food.push(item)
    this.foodGrid[gridIndex(item.x, item.y)].push(item)
    this.dailyFoodSpawned++
    return true
  }

  disperseDailyFood() {
    const spawnWindow = BALANCE.DAY_LENGTH * BALANCE.FOOD_SPAWN_DAY_FRACTION
    const targetByNow = Math.floor((Math.min(this.phaseTick + 1, spawnWindow) / spawnWindow) * this.dailyFoodTarget)
    let toSpawn = targetByNow - this.dailyFoodSpawned
    while (toSpawn > 0) {
      if (!this.spawnFoodItem()) {
        break
      }
      toSpawn--
    }
  }

  collectFood() {
    for (const creature of this.creatures) {
      if (!creature.alive || creature.sleeping || creature.knockedOut) {
        continue
      }
      if (creature.foodHeld >= BALANCE.FOOD_CAP) {
        continue
      }
      const reach = creature._radius + creature._forageReachBonus
      const candidates = queryGrid(this.foodGrid, creature.x, creature.y, reach + 8, this.foodQueryBuffer)
      for (let i = 0; i < candidates.length; i++) {
        const item = candidates[i]
        const r = reach + item.r
        if (distSq(creature.x, creature.y, item.x, item.y) <= r * r) {
          creature.foodHeld++
          this.removeFoodItem(item)
          break
        }
      }
    }
  }

  removeFoodItem(item) {
    const idx = item.index
    if (idx >= 0 && this.food[idx] === item) {
      const last = this.food.length - 1
      if (idx !== last) {
        const moved = this.food[last]
        this.food[idx] = moved
        moved.index = idx
      }
      this.food.pop()
    }
    item.index = -1
    const cell = this.foodGrid[gridIndex(item.x, item.y)]
    const cellIdx = cell.indexOf(item)
    if (cellIdx !== -1) {
      const cellLast = cell.length - 1
      if (cellIdx !== cellLast) {
        cell[cellIdx] = cell[cellLast]
      }
      cell.pop()
    }
  }

  knockoutDuration(stronger, weaker) {
    const ratio = stronger._strength / weaker._strength
    const excess = Math.max(0, ratio - 1 - BALANCE.CONTEST_THRESHOLD)
    const base = clamp(BALANCE.KO_BASE + excess * BALANCE.KO_SCALE, BALANCE.KO_BASE, BALANCE.KO_MAX)
    return base * (1 + weaker.genome.forage * 0.8)
  }

  resolveContests() {
    const lowRatio = 1 - BALANCE.CONTEST_THRESHOLD
    const highRatio = 1 + BALANCE.CONTEST_THRESHOLD
    for (let i = 0; i < this.creatures.length; i++) {
      const a = this.creatures[i]
      if (!a.alive || a.sleeping || a.knockedOut || a.contestCooldown > 0) {
        continue
      }
      const aR = a._radius
      const aStrength = a._strength
      const aReach = aR + 30
      const neighbors = queryGrid(this.creatureGrid, a.x, a.y, aReach, this.contestQueryBuffer)
      for (let k = 0; k < neighbors.length; k++) {
        const b = neighbors[k]
        if (b === a || b.id < a.id) {
          continue
        }
        if (!b.alive || b.sleeping || b.knockedOut || b.contestCooldown > 0) {
          continue
        }
        const reach = aR + b._radius + 2
        if (distSq(a.x, a.y, b.x, b.y) > reach * reach) {
          continue
        }
        const ratioAtoB = aStrength / b._strength
        const aStrong = ratioAtoB >= highRatio
        const bStrong = ratioAtoB <= lowRatio
        if (!aStrong && !bStrong) {
          continue
        }
        const stronger = aStrong ? a : b
        const weaker = aStrong ? b : a
        stronger.contestCooldown = BALANCE.CONTEST_COOLDOWN
        weaker.contestCooldown = BALANCE.CONTEST_COOLDOWN
        const koTicks = this.knockoutDuration(stronger, weaker)
        if (weaker.koImmunity > 0) {
          weaker.blockedPulse = Math.min(60, koTicks)
        } else {
          weaker.knockedOut = true
          weaker.koTimer = koTicks
          weaker.lastKoDuration = koTicks
          weaker.blockedPulse = Math.min(120, koTicks)
          weaker.reproductionBlocked = true
          weaker.burstState = 'idle'
          weaker.burstTimer = 0
        }
        stronger.denials++
        if (
          weaker.foodHeld > BALANCE.SURVIVAL_RESERVE &&
          stronger.foodHeld < BALANCE.FOOD_CAP
        ) {
          weaker.foodHeld--
          stronger.foodHeld++
        }
        break
      }
    }
  }

  updateBestGenome() {
    let best = null
    let bestVal = -Infinity
    for (const c of this.creatures) {
      if (!c.alive) {
        continue
      }
      if (c.fitness > bestVal) {
        bestVal = c.fitness
        best = c
      }
    }
    if (best) {
      this.bestGenome = cloneGenome(best.genome)
      this.bestGenomeAgeDays = best.ageDays
    }
  }

  updateNight() {
    this.phaseTick++
    this.globalTick++
    if (!this.config.nightEnabled || this.phaseTick >= BALANCE.NIGHT_LENGTH) {
      this.beginDay()
    }
  }

  beginNight() {
    this.phase = 'night'
    this.phaseTick = 0
    // Run the daily tree turnover under cover of darkness so the fade
    // animation plays through the night instead of bleeding into dawn.
    this.replaceDailyTrees()
    const survivors = []
    const children = []
    let died = 0
    let denied = 0
    const reproducers = []
    for (const c of this.creatures) {
      const childCount = c.offspringPotential()
      if (childCount <= 0 || c.reproductionBlocked) {
        continue
      }
      const foodAfterNight = Math.max(
        0,
        Math.min(c.foodHeld, c.survivalReserve()) - BALANCE.DAILY_FOOD_COST,
      )
      if (foodAfterNight <= 0) {
        continue
      }
      reproducers.push(c)
    }
    const reproducerGrid = reproducers.length > 1 ? this.buildReproducerGrid(reproducers) : null

    for (const c of this.creatures) {
      const childCount = c.offspringPotential()
      const foodAfterNight = Math.max(
        0,
        Math.min(c.foodHeld, c.survivalReserve()) - BALANCE.DAILY_FOOD_COST,
      )
      if (foodAfterNight <= 0) {
        died++
        continue
      }
      c.foodHeld = foodAfterNight
      c.ageDays++
      c.sleeping = true
      survivors.push(c)
      if (childCount <= 0) {
        continue
      }
      if (c.reproductionBlocked) {
        denied += childCount
        continue
      }
      const partner = reproducerGrid ? this.nearestReproducer(c, reproducerGrid) : null
      for (let i = 0; i < childCount; i++) {
        children.push(this.spawnChild(c, partner))
        c.children++
      }
    }

    const invasives = []
    if (this.config.invasivesEnabled && this.day % 5 === 0) {
      const target = this.config.populationTarget
      const current = survivors.length + children.length
      const deficit = Math.max(0, target - current)
      let invasiveCount = Math.floor(deficit * 0.1)
      while (invasiveCount > 0) {
        invasives.push(this.spawnInvasiveCreature(survivors))
        invasiveCount--
      }
    }

    this.creatures = survivors.concat(children, invasives)
    this.nightStats = {
      survived: survivors.length,
      born: children.length,
      invasives: invasives.length,
      died,
      denied,
    }
    this.recordTraitHistory()
    this.day++
    this.updateBestGenome()
    if (this.creatures.length === 0) {
      this.reseedAfterExtinction()
    }
    for (const c of this.creatures) {
      c.knockedOut = false
      c.koTimer = 0
      c.lastKoDuration = 0
      c.koImmunity = 0
      c.reproductionBlocked = false
      c.blockedPulse = 0
      c.contestCooldown = 0
      c.clearTrail()
      c.burstState = 'idle'
      c.burstTimer = 0
    }
    this.rebuildCreatureGrid()
  }

  beginDay() {
    this.phase = 'day'
    this.phaseTick = 0
    this.resetDailyFood()
    for (const c of this.creatures) {
      c.sleeping = false
      c.angle = rand(0, TAU)
    }
  }

  spawnChild(parent, partner) {
    let genome
    const cxChance = this.config.crossoverChance
    if (partner && cxChance > 0 && Math.random() < cxChance) {
      genome = crossoverGenome(parent.genome, partner.genome, this.config.crossoverAmount)
      applyMutation(genome, false, this.config.mutationFrequency, this.config.mutationAmount)
    } else {
      genome = mutateGenome(parent.genome, false, this.config.mutationFrequency, this.config.mutationAmount)
    }
    const child = new Creature(
      this,
      genome,
      clamp(parent.x + rand(-26, 26), 18, WORLD_W - 18),
      clamp(parent.y + rand(-26, 26), 18, WORLD_H - 18),
      parent.generation + 1,
    )
    child.sleeping = true
    return child
  }

  spawnInvasiveCreature(parentPool) {
    const randomParent = randomGenome()
    const existingParent = parentPool.length > 0
      ? parentPool[Math.floor(Math.random() * parentPool.length)]
      : null
    let genome
    if (existingParent && this.config.crossoverChance > 0 && Math.random() < this.config.crossoverChance) {
      genome = crossoverGenome(randomParent, existingParent.genome, this.config.crossoverAmount)
      applyMutation(genome, false, this.config.mutationFrequency, this.config.mutationAmount)
    } else {
      genome = mutateGenome(randomParent, false, this.config.mutationFrequency, this.config.mutationAmount)
    }
    const c = new Creature(
      this,
      genome,
      rand(28, WORLD_W - 28),
      rand(28, WORLD_H - 28),
      existingParent ? existingParent.generation + 1 : this.day,
    )
    c.sleeping = true
    return c
  }

  buildReproducerGrid(reproducers) {
    const grid = makeGrid()
    for (let i = 0; i < reproducers.length; i++) {
      const r = reproducers[i]
      grid[gridIndex(r.x, r.y)].push(r)
    }
    return grid
  }

  nearestReproducer(self, reproducerGrid) {
    const sx = self.x
    const sy = self.y
    const col = clamp(Math.floor(sx / GRID_CELL), 0, GRID_COLS - 1)
    const row = clamp(Math.floor(sy / GRID_CELL), 0, GRID_ROWS - 1)
    let best = null
    let bestDistSq = Infinity
    const maxRing = Math.max(GRID_COLS, GRID_ROWS)
    for (let ring = 0; ring <= maxRing; ring++) {
      const c0 = Math.max(0, col - ring)
      const c1 = Math.min(GRID_COLS - 1, col + ring)
      const r0 = Math.max(0, row - ring)
      const r1 = Math.min(GRID_ROWS - 1, row + ring)
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          if (ring > 0 && c > col - ring && c < col + ring && r > row - ring && r < row + ring) {
            continue
          }
          const cell = reproducerGrid[r * GRID_COLS + c]
          for (let i = 0; i < cell.length; i++) {
            const other = cell[i]
            if (other === self) {
              continue
            }
            const d = distSq(sx, sy, other.x, other.y)
            if (d < bestDistSq) {
              bestDistSq = d
              best = other
            }
          }
        }
      }
      if (best && bestDistSq <= (ring * GRID_CELL) * (ring * GRID_CELL)) {
        break
      }
    }
    return best
  }

  spawnInitialCreatures() {
    this.creatures = []
    const count = initialPopulationCount(this.config)
    for (let i = 0; i < count; i++) {
      const genome = biasFreshGenome(randomGenome(), this.config)
      const { x, y } = randomSpawnLocation(this.config)
      this.creatures.push(new Creature(this, genome, x, y, 1))
    }
  }

  reseedAfterExtinction() {
    this.creatures = []
    const count = this.config.populationTarget
    const base = this.bestGenome
    const established = base && this.bestGenomeAgeDays >= ESTABLISHED_AGE_DAYS
    const fromBaseCount = base ? (established ? Math.floor(count / 2) : count) : 0
    for (let i = 0; i < count; i++) {
      const fromBase = i < fromBaseCount
      const genome = fromBase
        ? mutateGenome(base, true, this.config.mutationFrequency, this.config.mutationAmount)
        : biasFreshGenome(randomGenome(), this.config)
      const { x, y } = randomSpawnLocation(this.config)
      const c = new Creature(this, genome, x, y, this.day)
      c.sleeping = this.phase === 'night'
      this.creatures.push(c)
    }
    if (this.creatures.length > 0) {
      this.notifyFocusCreature(this.creatures[0])
    }
  }

  recordTraitHistory() {
    if (this.creatures.length === 0) {
      return
    }
    const sums = Object.fromEntries(TRAITS.map((t) => [t, 0]))
    for (const c of this.creatures) {
      for (const t of TRAITS) {
        sums[t] += c.genome[t]
      }
    }
    const n = this.creatures.length
    const entry = { day: this.day, pop: n }
    for (const t of TRAITS) {
      entry[t] = sums[t] / n
    }
    this.traitHistory.push(entry)
    while (this.traitHistory.length > HISTORY_LIMIT) {
      this.traitHistory.shift()
    }
  }

  resetSimulation() {
    this.day = 1
    this.phase = 'day'
    this.phaseTick = 0
    this.globalTick = 0
    this.nextCreatureId = 1
    this.bestGenome = null
    this.bestGenomeAgeDays = 0
    this.traitHistory = []
    this.nightStats = { survived: 0, born: 0, invasives: 0, died: 0, denied: 0 }
    this.prevMeadowMarks = []
    this.prevFlowers = []
    this.prevWaterMarks = []
    this.prevRocks = []
    this.prevLilypads = []
    this.prevLandTrees = []
    this.prevWaterTrees = []
    this.treeGridStamp = -1
    const s = this.createSurfaceDecoration()
    this.meadowMarks = s.marks
    this.flowers = s.flowerList
    this.waterMarks = s.waterMarks
    this.rocks = s.rocks
    this.lilypads = s.lilypads
    this.generatePonds()
    this.generateAllTrees()
    this.resetDailyFood()
    this.spawnInitialCreatures()
    this.rebuildCreatureGrid()
    if (this.creatures.length > 0) {
      this.notifyFocusCreature(this.creatures[0])
    }
    else {
      this.notifyFocusCreature({ x: WORLD_W / 2, y: WORLD_H / 2 })
    }
    this.recordTraitHistory()
  }
}

