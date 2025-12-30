/**
 * Preset patterns for Game of Life
 */

// Helper to convert string pattern to boolean grid
function parsePattern(pattern: string): boolean[][] {
  return pattern
    .trim()
    .split("\n")
    .map((row) => row.split("").map((c) => c === "O" || c === "#"));
}

export interface Pattern {
  name: string;
  data: boolean[][];
  description: string;
}

export const PATTERNS: Pattern[] = [
  {
    name: "Glider",
    description: "Small spaceship that moves diagonally",
    data: parsePattern(`
.O.
..O
OOO
`),
  },
  {
    name: "Blinker",
    description: "Simple period-2 oscillator",
    data: parsePattern(`
OOO
`),
  },
  {
    name: "Toad",
    description: "Period-2 oscillator",
    data: parsePattern(`
.OOO
OOO.
`),
  },
  {
    name: "Beacon",
    description: "Period-2 oscillator",
    data: parsePattern(`
OO..
OO..
..OO
..OO
`),
  },
  {
    name: "Pulsar",
    description: "Period-3 oscillator",
    data: parsePattern(`
..OOO...OOO..
.............
O....O.O....O
O....O.O....O
O....O.O....O
..OOO...OOO..
.............
..OOO...OOO..
O....O.O....O
O....O.O....O
O....O.O....O
.............
..OOO...OOO..
`),
  },
  {
    name: "LWSS",
    description: "Lightweight spaceship",
    data: parsePattern(`
.O..O
O....
O...O
OOOO.
`),
  },
  {
    name: "R-pentomino",
    description: "Methuselah - chaotic evolution",
    data: parsePattern(`
.OO
OO.
.O.
`),
  },
  {
    name: "Gosper Gun",
    description: "Glider gun - produces gliders",
    data: parsePattern(`
........................O...........
......................O.O...........
............OO......OO............OO
...........O...O....OO............OO
OO........O.....O...OO..............
OO........O...O.OO....O.O...........
..........O.....O.......O...........
...........O...O....................
............OO......................
`),
  },
  {
    name: "Acorn",
    description: "Methuselah - produces many patterns",
    data: parsePattern(`
.O.....
...O...
OO..OOO
`),
  },
];

/**
 * Get pattern by index (with wrapping)
 */
export function getPattern(index: number): Pattern {
  const safeIndex = ((index % PATTERNS.length) + PATTERNS.length) % PATTERNS.length;
  return PATTERNS[safeIndex]!;
}

/**
 * Get total number of patterns
 */
export function getPatternCount(): number {
  return PATTERNS.length;
}
