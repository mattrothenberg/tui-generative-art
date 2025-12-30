/**
 * Game of Life simulation logic
 */

export type Grid = boolean[][];

/**
 * Create an empty grid
 */
export function createGrid(width: number, height: number): Grid {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => false)
  );
}

/**
 * Create a randomized grid
 */
export function randomizeGrid(width: number, height: number, density: number = 0.3): Grid {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => Math.random() < density)
  );
}

/**
 * Count live neighbors for a cell
 */
function countNeighbors(grid: Grid, x: number, y: number, wrap: boolean): number {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  let count = 0;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;

      let nx = x + dx;
      let ny = y + dy;

      if (wrap) {
        // Toroidal wrapping
        nx = (nx + width) % width;
        ny = (ny + height) % height;
      } else {
        // Bounded - out of bounds cells are dead
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      }

      if (grid[ny]?.[nx]) count++;
    }
  }

  return count;
}

/**
 * Advance simulation by one generation (Conway's Game of Life rules)
 * B3/S23: Birth if 3 neighbors, Survive if 2 or 3 neighbors
 */
export function step(grid: Grid, wrap: boolean = true): Grid {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const next = createGrid(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alive = grid[y]?.[x] ?? false;
      const neighbors = countNeighbors(grid, x, y, wrap);

      // Conway's rules
      if (alive) {
        // Survive if 2 or 3 neighbors
        next[y]![x] = neighbors === 2 || neighbors === 3;
      } else {
        // Birth if exactly 3 neighbors
        next[y]![x] = neighbors === 3;
      }
    }
  }

  return next;
}

/**
 * Count total live cells
 */
export function countLiveCells(grid: Grid): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell) count++;
    }
  }
  return count;
}

/**
 * Place a pattern on the grid at given position
 */
export function placePattern(
  grid: Grid,
  pattern: boolean[][],
  offsetX: number,
  offsetY: number
): Grid {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const newGrid = grid.map((row) => [...row]);

  for (let py = 0; py < pattern.length; py++) {
    for (let px = 0; px < (pattern[py]?.length ?? 0); px++) {
      const x = offsetX + px;
      const y = offsetY + py;
      if (x >= 0 && x < width && y >= 0 && y < height) {
        newGrid[y]![x] = pattern[py]![px] ?? false;
      }
    }
  }

  return newGrid;
}
