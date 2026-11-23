// Genome operations — clone, mutate, crossover. Genome is a flat object:
//   { brain, tank, vision, focus, burst, forage, water }
// All traits are floats in (0, 1). The `water` trait blends speed between
// water and land biomes (see biome.js).

import { Brain } from './brain.js'
import { TRAITS } from './config.js'
import { clamp, rand, randomValue } from './math.js'

export function randomGenome() {
  const g = { brain: new Brain() }
  for (const t of TRAITS) {
    g[t] = rand(0.04, 0.86)
  }
  // Slightly lift focus floor so initial creatures aren't all panoramic;
  // matches the original simulator's distribution.
  if (g.focus < 0.10) {
    g.focus = rand(0.10, 0.86)
  }
  return g
}

export function cloneGenome(genome) {
  const g = { brain: genome.brain.clone() }
  for (const t of TRAITS) {
    g[t] = genome[t]
  }
  return g
}

function mutateTrait(value, frequency, amount, force) {
  if (force || Math.random() < frequency) {
    value += randomValue() * amount
  }
  return clamp(value, 0.02, 0.98)
}

// Mutate a genome in place. `strongMutation` is used after extinction
// reseeds — wider perturbation for fresh exploration.
export function applyMutation(genome, strongMutation, mutationFrequency, mutationAmount) {
  const frequency = strongMutation ? 0.55 : mutationFrequency
  const amount = strongMutation ? 0.34 : mutationAmount
  genome.brain.mutate(frequency, amount)
  for (const t of TRAITS) {
    genome[t] = mutateTrait(genome[t], frequency, amount, strongMutation)
  }
}

export function mutateGenome(genome, strongMutation, mutationFrequency, mutationAmount) {
  const copy = cloneGenome(genome)
  applyMutation(copy, strongMutation, mutationFrequency, mutationAmount)
  return copy
}

// Uniform crossover — child starts as a clone of `self`, then for each
// weight, bias, and trait, sample from `partner` with probability
// `amount`. amount=0 → full clone of self, amount=0.5 → standard uniform
// crossover, amount=1 → full clone of partner. Mutation is applied AFTER.
export function crossoverGenome(self, partner, amount) {
  const child = cloneGenome(self)
  for (let layer = 0; layer < child.brain.weights.length; layer++) {
    const a = child.brain.weights[layer]
    const b = partner.brain.weights[layer]
    for (let i = 0; i < a.length; i++) {
      if (Math.random() < amount) {
        a[i] = b[i]
      }
    }
  }
  for (let layer = 0; layer < child.brain.biases.length; layer++) {
    const a = child.brain.biases[layer]
    const b = partner.brain.biases[layer]
    for (let i = 0; i < a.length; i++) {
      if (Math.random() < amount) {
        a[i] = b[i]
      }
    }
  }
  for (const t of TRAITS) {
    if (Math.random() < amount) {
      child[t] = partner[t]
    }
  }
  return child
}
