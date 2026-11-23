import {
  BALANCE, BASE_WORLD_SCALE, WORLD_SCALE,
  TRAIL_CAPACITY, MAX_VISION_RADIUS, MAX_SPEED_SCALE,
} from './config.js'
import { rand, TAU, clamp } from './math.js'
import { RECURRENT_COUNT } from './brain.js'
import { randomGenome } from './genome.js'

const TANK_SPEED_TOP = 1.23
const TANK_SPEED_PRE_CLIFF = 0.90
const TANK_SPEED_POST_CLIFF = TANK_SPEED_PRE_CLIFF - 0.4
const TANK_SPEED_MID = 0.20
const TANK_SPEED_HEAVY = 0.05
const TANK_CLIFF = 0.15
const TANK_MID = 0.5

export function tankSpeedCurve(tank) {
  if (tank <= TANK_CLIFF) {
    return TANK_SPEED_TOP + (TANK_SPEED_PRE_CLIFF - TANK_SPEED_TOP) * (tank / TANK_CLIFF)
  }
  if (tank <= TANK_MID) {
    return TANK_SPEED_POST_CLIFF + (TANK_SPEED_MID - TANK_SPEED_POST_CLIFF) * ((tank - TANK_CLIFF) / (TANK_MID - TANK_CLIFF))
  }
  return TANK_SPEED_MID + (TANK_SPEED_HEAVY - TANK_SPEED_MID) * ((tank - TANK_MID) / (1 - TANK_MID))
}

export function bodyRadius(tank) { return 6.5 + tank * 10.5 }
function bodyStrength(tank) { return 0.42 + tank * 1.0 }
function visionScaleFactor() { return Math.sqrt(WORLD_SCALE / BASE_WORLD_SCALE) }

export class Creature {
  constructor(world, genome, x, y, generation) {
    this.world = world
    this.id = world.nextCreatureId++
    this.genome = genome || randomGenome()
    this.x = x
    this.y = y
    this.angle = rand(0, TAU)
    this.generation = generation || 1
    this.ageDays = 0
    this.foodHeld = BALANCE.STARTING_FOOD
    this.alive = true
    this.sleeping = false
    this.knockedOut = false
    this.koTimer = 0
    this.lastKoDuration = 0
    this.koImmunity = 0
    this.reproductionBlocked = false
    this.blockedPulse = 0
    this.contestCooldown = 0
    this._trailX = new Float32Array(TRAIL_CAPACITY)
    this._trailY = new Float32Array(TRAIL_CAPACITY)
    this._trailIndex = 0
    this._trailLength = 0
    this._cellIndex = -1
    this._sabSlot = -1
    this.memory = new Float32Array(RECURRENT_COUNT)
    this.fitness = 0
    this.children = 0
    this.denials = 0
    this.burstState = 'idle'
    this.burstTimer = 0

    const { tank, vision, focus, forage } = this.genome
    const visionScale = visionScaleFactor()
    const speedScale = Math.min(MAX_SPEED_SCALE, visionScale)
    this._radius = bodyRadius(tank)
    this._strength = bodyStrength(tank)
    this._turnRate = BALANCE.TURN_SCALE * (1 - tank * BALANCE.TANK_TURN_PENALTY)
    // Flat +20% range bonus applied to every creature. Stacks
    // multiplicatively with the biome-water sight multiplier in
    // sim-pool-worker (so a water=0.9 specialist sees 0.9 × 1.2 = 1.08
    // × the previous base while in water, etc.).
    this._visionRadius = Math.min(MAX_VISION_RADIUS, (87 + vision * 360) * visionScale * 1.2)
    this._baseSpeed = tankSpeedCurve(tank) * speedScale
    this._raySideOffset = BALANCE.RAY_BASE_SIDE_OFFSET + (1 - focus) * BALANCE.RAY_FOCUS_SIDE_SPREAD
    this._forageReachBonus = 4 + forage * 8
  }

  survivalReserve() { return BALANCE.SURVIVAL_RESERVE }
  offspringPotential() {
    return clamp(Math.floor(this.foodHeld - this.survivalReserve()), 0, BALANCE.MAX_OFFSPRING)
  }

  clearTrail() {
    this._trailIndex = 0
    this._trailLength = 0
  }

  speedMult() {
    if (this.burstState === 'burst') {
      return 1 + this.genome.burst
    }
    if (this.burstState === 'recovery') {
      return 1 - this.genome.burst * 0.5
    }
    return 1
  }

  tickBurst(triggerOutput) {
    if (this.burstState === 'idle') {
      if (triggerOutput > BALANCE.BURST_TRIGGER) {
        this.burstState = 'burst'
        this.burstTimer = BALANCE.BURST_DURATION
      }
      return
    }
    this.burstTimer--
    if (this.burstTimer > 0) {
      return
    }
    if (this.burstState === 'burst') {
      this.burstState = 'recovery'
      this.burstTimer = BALANCE.RECOVERY_DURATION
    } else {
      this.burstState = 'idle'
      this.burstTimer = 0
    }
  }
}
