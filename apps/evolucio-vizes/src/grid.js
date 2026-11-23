// Uniform spatial hash grid. Used for creature/food/tree neighbor queries
// so vision and combat can run in O(k) per creature instead of O(N).
//
// Cell size is set in config (GRID_CELL = 320) so any vision query covers
// only a small constant number of cells.
//
// GRID_COLS / GRID_ROWS are `export let` so they can be recomputed when
// the world size slider changes (see recomputeGridDims). All consumers
// read live bindings, so a recompute auto-propagates.

import { WORLD_W, WORLD_H } from './config.js'

export const GRID_CELL = 320
export let GRID_COLS = Math.ceil(WORLD_W / GRID_CELL) + 1
export let GRID_ROWS = Math.ceil(WORLD_H / GRID_CELL) + 1

export function recomputeGridDims() {
  GRID_COLS = Math.ceil(WORLD_W / GRID_CELL) + 1
  GRID_ROWS = Math.ceil(WORLD_H / GRID_CELL) + 1
}

export function makeGrid() {
  const cells = new Array(GRID_COLS * GRID_ROWS)
  for (let i = 0; i < cells.length; i++) {
    cells[i] = []
  }
  return cells
}

export function gridIndex(x, y) {
  let col = Math.floor(x / GRID_CELL)
  let row = Math.floor(y / GRID_CELL)
  if (col < 0) {
    col = 0
  }
  else if (col >= GRID_COLS) {
    col = GRID_COLS - 1
  }
  if (row < 0) {
    row = 0
  }
  else if (row >= GRID_ROWS) {
    row = GRID_ROWS - 1
  }
  return row * GRID_COLS + col
}

export function clearGrid(grid) {
  for (let i = 0; i < grid.length; i++) {
    if (grid[i].length > 0) {
      grid[i].length = 0
    }
  }
}

// Query grid cells overlapping a square of half-side `range` around (cx, cy).
// Results are written into `out`, which is cleared first. Returning the
// same array allows the caller to reuse a single scratch buffer per query
// site (sense, contests, food collection) instead of allocating per call.
export function queryGrid(grid, cx, cy, range, out) {
  out.length = 0
  const minCol = Math.max(0, Math.floor((cx - range) / GRID_CELL))
  const maxCol = Math.min(GRID_COLS - 1, Math.floor((cx + range) / GRID_CELL))
  const minRow = Math.max(0, Math.floor((cy - range) / GRID_CELL))
  const maxRow = Math.min(GRID_ROWS - 1, Math.floor((cy + range) / GRID_CELL))
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const cell = grid[row * GRID_COLS + col]
      for (let i = 0; i < cell.length; i++) {
        out.push(cell[i])
      }
    }
  }
  return out
}
