/**
 * Mandelbrot and Julia set calculations
 */

export interface FractalParams {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  zoom: number;
  maxIterations: number;
  juliaMode: boolean;
  juliaReal: number;
  juliaImag: number;
}

export interface FractalPixel {
  iterations: number;
  escaped: boolean;
  // Smooth coloring value (for gradient)
  smooth: number;
}

export interface FractalResult {
  pixels: FractalPixel[][];
  params: FractalParams;
}

/**
 * Calculate escape time for a single point
 */
function calculatePoint(
  x0: number,
  y0: number,
  maxIterations: number,
  juliaMode: boolean,
  juliaReal: number,
  juliaImag: number
): FractalPixel {
  let x: number, y: number, cx: number, cy: number;

  if (juliaMode) {
    // Julia set: z starts at the point, c is constant
    x = x0;
    y = y0;
    cx = juliaReal;
    cy = juliaImag;
  } else {
    // Mandelbrot: z starts at 0, c is the point
    x = 0;
    y = 0;
    cx = x0;
    cy = y0;
  }

  let iterations = 0;
  let x2 = x * x;
  let y2 = y * y;

  // Iterate z = z^2 + c until escape or max iterations
  while (x2 + y2 <= 4 && iterations < maxIterations) {
    y = 2 * x * y + cy;
    x = x2 - y2 + cx;
    x2 = x * x;
    y2 = y * y;
    iterations++;
  }

  const escaped = iterations < maxIterations;

  // Smooth coloring using continuous escape time
  let smooth = iterations;
  if (escaped && iterations > 0) {
    // Normalize iteration count for smooth coloring
    const log2 = Math.log(2);
    const logZn = Math.log(x2 + y2) / 2;
    const nu = Math.log(logZn / log2) / log2;
    smooth = iterations + 1 - nu;
  }

  return { iterations, escaped, smooth };
}

/**
 * Generate a fractal image
 */
export function generateFractal(params: FractalParams): FractalResult {
  const {
    width,
    height,
    centerX,
    centerY,
    zoom,
    maxIterations,
    juliaMode,
    juliaReal,
    juliaImag,
  } = params;

  const pixels: FractalPixel[][] = [];

  // Calculate view bounds
  // Aspect ratio correction: terminal chars are ~2x taller than wide
  const aspectRatio = width / (height * 2);
  const rangeX = 4 / zoom;
  const rangeY = rangeX / aspectRatio;

  const minX = centerX - rangeX / 2;
  const minY = centerY - rangeY / 2;

  for (let py = 0; py < height; py++) {
    const row: FractalPixel[] = [];
    const y0 = minY + (py / height) * rangeY;

    for (let px = 0; px < width; px++) {
      const x0 = minX + (px / width) * rangeX;
      const pixel = calculatePoint(x0, y0, maxIterations, juliaMode, juliaReal, juliaImag);
      row.push(pixel);
    }

    pixels.push(row);
  }

  return { pixels, params };
}

/** Character sets for rendering */
export const FRACTAL_CHARS = " .:-=+*#%@";
export const BLOCK_CHARS = " ░▒▓█";

/**
 * Map iteration count to character
 */
export function iterationToChar(
  pixel: FractalPixel,
  maxIterations: number,
  useBlocks: boolean
): string {
  const chars = useBlocks ? BLOCK_CHARS : FRACTAL_CHARS;

  if (!pixel.escaped) {
    // Inside the set - use darkest (space or first char)
    return chars[0] ?? " ";
  }

  // Map smooth value to character index
  const normalized = pixel.smooth / maxIterations;
  const index = Math.floor(normalized * (chars.length - 1));
  return chars[Math.min(index, chars.length - 1)] ?? " ";
}

/**
 * Map iteration count to hue (for color mode)
 */
export function iterationToHue(pixel: FractalPixel, maxIterations: number): number {
  if (!pixel.escaped) {
    return 0; // Black for inside the set
  }
  // Map to hue cycle (0-360)
  return (pixel.smooth / maxIterations) * 360 * 3; // Multiple cycles for variety
}
