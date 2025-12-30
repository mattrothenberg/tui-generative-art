/**
 * Color utility functions for generative art rendering
 */

/** Pre-computed shade lookup table (6 levels) */
const SHADE_TABLE = ["#333333", "#555555", "#808080", "#AAAAAA", "#DDDDDD", "#FFFFFF"] as const;

/** Get shade hex from brightness (0-255) using lookup table */
export const getShadeHex = (brightness: number): string => {
  const level = Math.min(5, Math.floor((brightness / 255) * 6));
  return SHADE_TABLE[level] ?? "#FFFFFF";
};

/** Quantize value to reduce unique color combinations (for batching) */
export const quantize = (v: number): number => (v & 0xE0);

/** Convert brightness (0-255) to grayscale hex */
export const brightnessToHex = (b: number): string => {
  const clamped = b < 0 ? 0 : b > 255 ? 255 : b;
  const hex = (clamped | 0).toString(16).padStart(2, "0");
  return `#${hex}${hex}${hex}`;
};

/** Convert RGB to hex color */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v) | 0;
  const rr = clamp(r).toString(16).padStart(2, "0");
  const gg = clamp(g).toString(16).padStart(2, "0");
  const bb = clamp(b).toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
};

/** Convert HSL to RGB */
export const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
};

/** Convert hue (0-360) to hex color with full saturation */
export const hueToHex = (hue: number, saturation = 0.8, lightness = 0.5): string => {
  const [r, g, b] = hslToRgb(hue % 360, saturation, lightness);
  return rgbToHex(r, g, b);
};
