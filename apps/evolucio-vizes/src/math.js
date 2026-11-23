// Math helpers. Pure, no domain knowledge.

export const TAU = Math.PI * 2

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function rand(min, max) {
  return min + Math.random() * (max - min)
}

export function distSq(ax, ay, bx, by) {
  const dx = ax - bx
  const dy = ay - by
  return dx * dx + dy * dy
}

// Symmetric uniform sample on [-1, 1]. Used for weight initialization and
// per-step weight perturbation in mutation.
export function randomValue() {
  return Math.random() * 2 - 1
}
