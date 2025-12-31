/**
 * Plasma Experiment
 *
 * A classic demoscene effect using layered sine waves to create
 * organic, blobby animated patterns. Inspired by 1990s demo scene graphics.
 *
 * The plasma effect works by summing multiple sine waves at different
 * frequencies and directions, then mapping the result to colors.
 */

import { useState, useMemo, useEffect } from "react";
import { useKeyboard } from "@opentui/react";
import { ExperimentFrame, Slider } from "../../components";
import { hueToHex } from "../../utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PlasmaProps {
  width?: number;
  height?: number;
  onBack?: () => void;
}

type FocusedSlider = "scale" | "speed" | null;
type CharSet = "blocks" | "dots" | "ascii";
type Palette = "rainbow" | "fire" | "ocean" | "gray";

// ─────────────────────────────────────────────────────────────────────────────
// Character Sets
// ─────────────────────────────────────────────────────────────────────────────

/** Block characters with increasing density */
const CHARS_BLOCKS = " ░▒▓█";

/** Dot characters with increasing size */
const CHARS_DOTS = " ·•●█";

/** ASCII art gradient (classic style) */
const CHARS_ASCII = " .:-=+*#%@";

const CHAR_SETS: Record<CharSet, string> = {
  blocks: CHARS_BLOCKS,
  dots: CHARS_DOTS,
  ascii: CHARS_ASCII,
};

// ─────────────────────────────────────────────────────────────────────────────
// Color Palettes (pre-computed for performance)
// ─────────────────────────────────────────────────────────────────────────────

const PALETTE_RAINBOW: string[] = [];
const PALETTE_FIRE: string[] = [];
const PALETTE_OCEAN: string[] = [];
const PALETTE_GRAY: string[] = [];

// Generate 6 colors per palette (fewer colors = better segment batching)
for (let i = 0; i < 6; i++) {
  const t = i / 6;
  
  // Rainbow: full hue spectrum
  PALETTE_RAINBOW.push(hueToHex(t * 360, 0.8, 0.5));
  
  // Fire: red to yellow gradient
  PALETTE_FIRE.push(hueToHex(t * 60, 0.9, 0.3 + t * 0.4));
  
  // Ocean: cyan to blue gradient
  PALETTE_OCEAN.push(hueToHex(180 + t * 60, 0.7, 0.3 + t * 0.3));
  
  // Grayscale: dark to light
  const gray = Math.floor(40 + t * 200);
  PALETTE_GRAY.push(`#${gray.toString(16).padStart(2, "0").repeat(3)}`);
}

const PALETTES: Record<Palette, string[]> = {
  rainbow: PALETTE_RAINBOW,
  fire: PALETTE_FIRE,
  ocean: PALETTE_OCEAN,
  gray: PALETTE_GRAY,
};

// ─────────────────────────────────────────────────────────────────────────────
// Plasma Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate plasma intensity at a given point.
 *
 * The classic plasma effect is created by summing multiple sine waves
 * with different frequencies, directions, and phase offsets:
 * - Horizontal wave (moves left-right)
 * - Vertical wave (moves up-down)
 * - Diagonal wave (moves diagonally)
 * - Two circular waves (radiate outward from offset centers)
 *
 * @returns Normalized value in range [0, 1]
 */
function plasmaValue(x: number, y: number, time: number, scale: number): number {
  const s = scale / 10;
  let value = 0;
  
  // Horizontal wave
  value += Math.sin(x * s * 0.3 + time);
  
  // Vertical wave (slightly faster)
  value += Math.sin(y * s * 0.5 + time * 1.3);
  
  // Diagonal wave
  value += Math.sin((x * s + y * s) * 0.3 + time * 0.7);
  
  // Circular wave from offset center
  const cx = x * s - 4;
  const cy = y * s - 4;
  value += Math.sin(Math.sqrt(cx * cx + cy * cy) * 0.5 + time);
  
  // Second circular wave (different center, opposite direction)
  const cx2 = x * s + 2;
  const cy2 = y * s - 2;
  value += Math.sin(Math.sqrt(cx2 * cx2 + cy2 * cy2) * 0.4 - time * 1.2);
  
  // Normalize: 5 waves each in [-1,1] gives range [-5,5]
  return (value + 5) / 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function Plasma({
  width = 80,
  height = 24,
  onBack,
}: PlasmaProps) {
  // Visualization parameters
  const [scale, setScale] = useState(4);
  const [speed, setSpeed] = useState(100);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [palette, setPalette] = useState<Palette>("gray");
  const [charSet, setCharSet] = useState<CharSet>("blocks");
  const [focusedSlider, setFocusedSlider] = useState<FocusedSlider>("scale");

  // Animation loop (~60fps)
  useEffect(() => {
    if (!playing) return;

    const frameTime = 16;
    const timeIncrement = 0.06 * (speed / 100);

    const interval = setInterval(() => {
      setTime((t) => t + timeIncrement);
    }, frameTime);

    return () => clearInterval(interval);
  }, [playing, speed]);

  // Keyboard controls
  useKeyboard((key) => {
    if (key.name === "escape" || key.name === "backspace") {
      onBack?.();
      return;
    }

    if (key.name === "space") setPlaying((p) => !p);
    
    // Cycle through color palettes: gray → rainbow → fire → ocean
    if (key.name === "c") {
      setPalette((p) => {
        if (p === "gray") return "rainbow";
        if (p === "rainbow") return "fire";
        if (p === "fire") return "ocean";
        return "gray";
      });
    }
    
    // Cycle through character sets: blocks → dots → ascii
    if (key.name === "d") {
      setCharSet((c) => {
        if (c === "blocks") return "dots";
        if (c === "dots") return "ascii";
        return "blocks";
      });
    }

    // Tab between sliders
    if (key.name === "tab") {
      setFocusedSlider((prev) => prev === "scale" ? "speed" : "scale");
    }

    // Adjust focused slider with arrow keys
    if (key.name === "left" || key.name === "right") {
      const delta = key.name === "right" ? 1 : -1;
      if (focusedSlider === "scale") {
        setScale((s) => Math.max(1, Math.min(20, s + delta)));
      } else if (focusedSlider === "speed") {
        setSpeed((s) => Math.max(10, Math.min(200, s + delta * 10)));
      }
    }
  });

  /**
   * Render the plasma effect.
   *
   * For each pixel, calculate the plasma value and map it to
   * both a character (for intensity) and a color (from palette).
   * Same-colored characters are batched together for efficiency.
   */
  const plasmaElements = useMemo(() => {
    const colors = PALETTES[palette];
    const chars = CHAR_SETS[charSet];
    const rows: JSX.Element[] = [];

    for (let y = 0; y < height; y++) {
      const segments: { text: string; color: string }[] = [];
      let currentText = "";
      let currentColorIdx = -1;

      for (let x = 0; x < width; x++) {
        // Calculate plasma value (y scaled 2x for terminal aspect ratio)
        const value = plasmaValue(x, y * 2, time, scale);
        
        // Map value to color and character
        const colorIdx = Math.floor(value * (colors.length - 0.01));
        const charIdx = Math.floor(value * (chars.length - 0.01));
        const char = chars[charIdx] ?? " ";

        // Batch consecutive same-colored characters
        if (colorIdx === currentColorIdx) {
          currentText += char;
        } else {
          if (currentText) {
            segments.push({ text: currentText, color: colors[currentColorIdx]! });
          }
          currentText = char;
          currentColorIdx = colorIdx;
        }
      }

      if (currentText) {
        segments.push({ text: currentText, color: colors[currentColorIdx]! });
      }

      rows.push(
        <box key={y} flexDirection="row">
          {segments.map((seg, i) => (
            <text key={i} fg={seg.color}>{seg.text}</text>
          ))}
        </box>
      );
    }

    return rows;
  }, [width, height, scale, time, palette, charSet]);

  const sidebar = (
    <>
      <text fg="#FFCC00" marginBottom={1}>Plasma</text>

      <box marginBottom={1} flexDirection="column">
        <text fg={playing ? "#00FF00" : "#FF6600"}>
          {playing ? "Playing" : "Paused"}
        </text>
      </box>

      <Slider
        label="Scale"
        value={scale}
        min={1}
        max={20}
        step={1}
        width={18}
        focused={focusedSlider === "scale"}
        onChange={setScale}
      />

      <Slider
        label="Speed"
        value={speed}
        min={10}
        max={200}
        step={10}
        width={18}
        focused={focusedSlider === "speed"}
        formatValue={(v) => `${v}%`}
        onChange={setSpeed}
      />

      <box marginTop={1} flexDirection="column">
        <text fg="#888">[C] {palette}</text>
        <text fg="#888">[D] {charSet}</text>
      </box>
    </>
  );

  const footer = (
    <>
      <text fg="#666">[Space] {playing ? "Pause" : "Play"}</text>
      <text fg="#666" marginLeft={2}>[C] Palette</text>
      <text fg="#666" marginLeft={2}>[D] Chars</text>
      <text fg="#666" marginLeft={2}>[Arrows] Adjust</text>
      <text fg="#666" marginLeft={2}>[Esc] Back</text>
    </>
  );

  return (
    <ExperimentFrame title="Plasma" sidebar={sidebar} footer={footer}>
      <box flexDirection="column" overflow="hidden">
        {plasmaElements}
      </box>
    </ExperimentFrame>
  );
}
