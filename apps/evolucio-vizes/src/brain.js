// Neural network for creatures.
// Inputs: 5 object types × 3 center/side closeness rays + wall +
// water-coast (signed, +in-water/-on-land) + foodLeftToCap + burstReady +
// x/y + 3 recurrent = 24 inputs.
// Outputs: forward, turn, burst-trigger + 3 recurrent = 6 outputs.
// Single hidden layer of 12. Tanh activations everywhere.

import { randomValue } from './math.js'

export const RAY_TYPES = ['tree', 'food', 'prey', 'other', 'threat']
export const RAY_TYPE_COUNT = RAY_TYPES.length
export const RAY_OFFSET_MULTIPLIERS = [0, -1, 1]
export const TYPE_RAY_COUNT = 3
export const TYPE_RAY_INPUTS = RAY_TYPE_COUNT * TYPE_RAY_COUNT

export const WALL_INPUT_INDEX = TYPE_RAY_INPUTS
export const WATER_RAY_INPUT_INDEX = WALL_INPUT_INDEX + 1
export const FOOD_LEFT_INPUT_INDEX = WALL_INPUT_INDEX + 2
export const BURST_READY_INPUT_INDEX = WALL_INPUT_INDEX + 3
export const X_INPUT_INDEX = WALL_INPUT_INDEX + 4
export const Y_INPUT_INDEX = WALL_INPUT_INDEX + 5
export const MEMORY_INPUT_START = WALL_INPUT_INDEX + 6

export const RECURRENT_COUNT = 3
export const ACTION_OUTPUT_SIZE = 3
export const INPUT_SIZE = TYPE_RAY_INPUTS + 6 + RECURRENT_COUNT
export const OUTPUT_SIZE = ACTION_OUTPUT_SIZE + RECURRENT_COUNT
export const BRAIN_LAYERS = [INPUT_SIZE, 12, OUTPUT_SIZE]

export const SENSE = { tree: 0, food: 1, prey: 2, other: 3, threat: 4 }

// Per-layer scratch buffers shared across all Brain.predict calls. Each
// layer's output is the next layer's input — one buffer per non-input
// layer suffices. Single-threaded only; do not call from a Web Worker
// without per-instance buffers.
const LAYER_BUFFERS = []
for (let i = 1; i < BRAIN_LAYERS.length; i++) {
  LAYER_BUFFERS.push(new Float32Array(BRAIN_LAYERS[i]))
}

export class Brain {
  constructor(weights, biases) {
    if (weights && biases) {
      this.weights = weights
      this.biases = biases
      return
    }
    this.weights = []
    this.biases = []
    for (let layer = 0; layer < BRAIN_LAYERS.length - 1; layer++) {
      const inputCount = BRAIN_LAYERS[layer]
      const outputCount = BRAIN_LAYERS[layer + 1]
      // Xavier/Glorot for tanh: keeps activations in linear region.
      const scale = Math.sqrt(1 / inputCount)
      this.weights.push(randomTensor(inputCount * outputCount, scale))
      this.biases.push(randomTensor(outputCount, 0.25))
    }
    // Bias the first action output (forward) slightly positive so a
    // freshly-initialized brain tends to move rather than freeze.
    this.biases[this.biases.length - 1][0] += 0.4
  }

  predict(inputs) {
    let activations = inputs
    let inputCount = inputs.length
    for (let layer = 0; layer < this.weights.length; layer++) {
      const next = LAYER_BUFFERS[layer]
      dense(activations, this.weights[layer], this.biases[layer], next, inputCount)
      activations = next
      inputCount = next.length
    }
    return activations
  }

  clone() {
    return new Brain(
      this.weights.map((layer) => new Float32Array(layer)),
      this.biases.map((layer) => new Float32Array(layer)),
    )
  }

  mutate(frequency, amount) {
    for (const layer of this.weights) {
      perturb(layer, frequency, amount)
    }
    for (const layer of this.biases) {
      perturb(layer, frequency, amount)
    }
  }

  // Plain-object serialization for save files. Float32Array → number[].
  toJSON() {
    return {
      weights: this.weights.map((layer) => Array.from(layer)),
      biases: this.biases.map((layer) => Array.from(layer)),
    }
  }

  static fromJSON(obj) {
    return new Brain(
      obj.weights.map((layer) => new Float32Array(layer)),
      obj.biases.map((layer) => new Float32Array(layer)),
    )
  }
}

function randomTensor(count, scale) {
  const values = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    values[i] = randomValue() * scale
  }
  return values
}

function dense(inputs, weights, biases, outputs, inputCount) {
  const outputCount = outputs.length
  for (let out = 0; out < outputCount; out++) {
    let sum = biases[out]
    const offset = out * inputCount
    for (let i = 0; i < inputCount; i++) {
      sum += inputs[i] * weights[offset + i]
    }
    outputs[out] = Math.tanh(sum)
  }
  return outputs
}

function perturb(layer, frequency, amount) {
  for (let i = 0; i < layer.length; i++) {
    if (Math.random() < frequency) {
      layer[i] += randomValue() * amount
    }
    if (layer[i] > 4) {
      layer[i] = 4
    }
    else if (layer[i] < -4) {
      layer[i] = -4
    }
  }
}
