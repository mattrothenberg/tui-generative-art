/**
 * Color Utilities
 *
 * Functions for color conversion and manipulation used by the
 * generative art experiments. Includes HSL/RGB conversions and
 * pre-computed lookup tables for performance.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Pre-computed Lookup Tables
// ─────────────────────────────────────────────────────────────────────────────

/** 6-level grayscale shade lookup table (faster than computing each time) */
const SHADE_TABLE = ["#333333", "#555555", "#808080", "#AAAAAA", "#DDDDDD", "#FFFFFF"] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Grayscale Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a shade hex color from brightness using the lookup table.
 * @param brightness - Value from 0 (dark) to 255 (bright)
 */
export const getShadeHex = (brightness: number): string => {
  const level = Math.min(5, Math.floor((brightness / 255) * 6));
  return SHADE_TABLE[level] ?? "#FFFFFF";
};

/**
 * Quantize a value by masking lower bits.
 * Reduces unique color combinations for better segment batching.
 */
export const quantize = (v: number): number => (v & 0xE0);

/**
 * Convert a brightness value (0-255) to a grayscale hex color.
 */
export const brightnessToHex = (b: number): string => {
  const clamped = b < 0 ? 0 : b > 255 ? 255 : b;
  const hex = (clamped | 0).toString(16).padStart(2, "0");
  return `#${hex}${hex}${hex}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// RGB/Hex Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert RGB values to a hex color string.
 * Values are clamped to 0-255 range.
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v) | 0;
  const rr = clamp(r).toString(16).padStart(2, "0");
  const gg = clamp(g).toString(16).padStart(2, "0");
  const bb = clamp(b).toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// HSL Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert HSL to RGB color values.
 * @param h - Hue (0-360)
 * @param s - Saturation (0-1)
 * @param l - Lightness (0-1)
 * @returns RGB tuple [r, g, b] with values 0-255
 */
export const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  // Calculate chroma and intermediate values
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  // Map hue to RGB based on 60-degree segments
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  // Scale to 0-255 range and add lightness adjustment
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
};

/**
 * Convert a hue angle to a hex color string.
 * @param hue - Hue angle (0-360)
 * @param saturation - Saturation (0-1, default 0.8)
 * @param lightness - Lightness (0-1, default 0.5)
 */
export const hueToHex = (hue: number, saturation = 0.8, lightness = 0.5): string => {
  const [r, g, b] = hslToRgb(hue % 360, saturation, lightness);
  return rgbToHex(r, g, b);
};
