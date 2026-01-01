/**
 * Marquee Experiment
 *
 * A scrolling LED-style news ticker with large block letters.
 * Features a custom 5x5 pixel bitmap font that supports uppercase
 * letters, numbers, and common punctuation.
 *
 * The effect mimics classic LED/dot-matrix displays commonly seen
 * in stadiums, stock tickers, and transit stations.
 *
 * PERFORMANCE: Uses direct buffer rendering via addPostProcessFn for 60fps.
 */

import { useState, useMemo, useEffect, useRef } from "react";
// useRef is still used for stateRef
import { useKeyboard } from "@opentui/react";
import { RGBA } from "@opentui/core";
import type { CliRenderer, OptimizedBuffer } from "@opentui/core";
import { ExperimentFrame, Slider } from "../../components";
import { hexToRgb } from "../../utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface MarqueeProps {
  width?: number;
  height?: number;
  onBack?: () => void;
  renderer: CliRenderer;
}

type FocusedSlider = "speed" | null;

// ─────────────────────────────────────────────────────────────────────────────
// 5x5 Bitmap Font
// Each character is represented as 5 strings of 5 characters.
// '#' = lit pixel, ' ' = unlit pixel
// ─────────────────────────────────────────────────────────────────────────────

const FONT: Record<string, string[]> = {
  A: [" ### ", "#   #", "#####", "#   #", "#   #"],
  B: ["#### ", "#   #", "#### ", "#   #", "#### "],
  C: [" ####", "#    ", "#    ", "#    ", " ####"],
  D: ["#### ", "#   #", "#   #", "#   #", "#### "],
  E: ["#####", "#    ", "###  ", "#    ", "#####"],
  F: ["#####", "#    ", "###  ", "#    ", "#    "],
  G: [" ####", "#    ", "#  ##", "#   #", " ### "],
  H: ["#   #", "#   #", "#####", "#   #", "#   #"],
  I: ["#####", "  #  ", "  #  ", "  #  ", "#####"],
  J: ["#####", "   # ", "   # ", "#  # ", " ##  "],
  K: ["#   #", "#  # ", "###  ", "#  # ", "#   #"],
  L: ["#    ", "#    ", "#    ", "#    ", "#####"],
  M: ["#   #", "## ##", "# # #", "#   #", "#   #"],
  N: ["#   #", "##  #", "# # #", "#  ##", "#   #"],
  O: [" ### ", "#   #", "#   #", "#   #", " ### "],
  P: ["#### ", "#   #", "#### ", "#    ", "#    "],
  Q: [" ### ", "#   #", "#   #", "#  # ", " ## #"],
  R: ["#### ", "#   #", "#### ", "#  # ", "#   #"],
  S: [" ####", "#    ", " ### ", "    #", "#### "],
  T: ["#####", "  #  ", "  #  ", "  #  ", "  #  "],
  U: ["#   #", "#   #", "#   #", "#   #", " ### "],
  V: ["#   #", "#   #", "#   #", " # # ", "  #  "],
  W: ["#   #", "#   #", "# # #", "## ##", "#   #"],
  X: ["#   #", " # # ", "  #  ", " # # ", "#   #"],
  Y: ["#   #", " # # ", "  #  ", "  #  ", "  #  "],
  Z: ["#####", "   # ", "  #  ", " #   ", "#####"],
  " ": ["     ", "     ", "     ", "     ", "     "],
  "!": ["  #  ", "  #  ", "  #  ", "     ", "  #  "],
  ".": ["     ", "     ", "     ", "     ", "  #  "],
  ":": ["     ", "  #  ", "     ", "  #  ", "     "],
  "?": [" ### ", "#   #", "  ## ", "     ", "  #  "],
  "0": [" ### ", "#  ##", "# # #", "##  #", " ### "],
  "1": [" ##  ", "  #  ", "  #  ", "  #  ", "#####"],
  "2": [" ### ", "#   #", "  ## ", " #   ", "#####"],
  "3": ["#####", "   # ", "  ## ", "    #", "#### "],
  "4": ["#   #", "#   #", "#####", "    #", "    #"],
  "5": ["#####", "#    ", "#### ", "    #", "#### "],
  "6": [" ### ", "#    ", "#### ", "#   #", " ### "],
  "7": ["#####", "    #", "   # ", "  #  ", "  #  "],
  "8": [" ### ", "#   #", " ### ", "#   #", " ### "],
  "9": [" ### ", "#   #", " ####", "    #", " ### "],
};

// ─────────────────────────────────────────────────────────────────────────────
// Font Configuration
// ─────────────────────────────────────────────────────────────────────────────

const LETTER_WIDTH = 5;
const LETTER_HEIGHT = 5;
const LETTER_SPACING = 1;

// ─────────────────────────────────────────────────────────────────────────────
// Preset Messages
// ─────────────────────────────────────────────────────────────────────────────

const MESSAGES = [
  "BREAKING NEWS: MATT IS BAD AT JAVASCRIPT",
  "HELLO WORLD",
  "LIVE UPDATE",
  "GENERATIVE ART",
  "TUI ROCKS",
];

// ─────────────────────────────────────────────────────────────────────────────
// Color Palettes
// ─────────────────────────────────────────────────────────────────────────────

const PALETTES = {
  amber: [
    "#3d2800",
    "#5c3d00",
    "#7a5200",
    "#996600",
    "#b87a00",
    "#d68f00",
    "#f5a300",
    "#ffb700",
  ],
  green: [
    "#002200",
    "#003300",
    "#004400",
    "#005500",
    "#006600",
    "#007700",
    "#008800",
    "#00aa00",
  ],
  blue: [
    "#001133",
    "#001a4d",
    "#002266",
    "#002b80",
    "#003399",
    "#003db3",
    "#0047cc",
    "#0052e6",
  ],
  red: [
    "#330000",
    "#4d0000",
    "#660000",
    "#800000",
    "#990000",
    "#b30000",
    "#cc0000",
    "#e60000",
  ],
  white: ["#222", "#333", "#444", "#666", "#888", "#aaa", "#ccc", "#fff"],
};

type PaletteKey = keyof typeof PALETTES;
const PALETTE_KEYS: PaletteKey[] = ["amber", "green", "blue", "red", "white"];

// Pre-convert all palettes to RGBA
const PALETTES_RGBA: Record<PaletteKey, RGBA[]> = {} as any;
for (const key of PALETTE_KEYS) {
  PALETTES_RGBA[key] = PALETTES[key].map((hex) => {
    const rgb = hexToRgb(hex);
    return RGBA.fromInts(rgb.r, rgb.g, rgb.b, 255);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Text Rendering
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render text to a 2D grid of characters using the bitmap font.
 * Each character in the output is either '#' (lit) or ' ' (unlit).
 *
 * @returns Array of 5 strings (one per row)
 */
function renderText(text: string): string[] {
  const rows: string[] = ["", "", "", "", ""];

  for (const char of text.toUpperCase()) {
    const letter = FONT[char] ?? FONT[" "]!;
    for (let row = 0; row < LETTER_HEIGHT; row++) {
      rows[row] += letter[row] + " ".repeat(LETTER_SPACING);
    }
  }

  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function Marquee({
  width = 80,
  height = 24,
  onBack,
  renderer,
}: MarqueeProps) {
  // Animation and display state
  const [speed, setSpeed] = useState(50);
  const [playing, setPlaying] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [focusedSlider, setFocusedSlider] = useState<FocusedSlider>("speed");

  // Animation offset - using state to trigger re-renders
  const [offset, setOffset] = useState(0);

  // Current message and rendering
  const message = MESSAGES[messageIndex] ?? "HELLO";
  const renderedText = useMemo(() => renderText(message), [message]);
  const textWidth = renderedText[0]?.length ?? 0;

  // Store state in ref for postProcess access
  const stateRef = useRef({
    paletteIndex,
    renderedText,
    textWidth,
    width,
    height,
    offset,
  });

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = { paletteIndex, renderedText, textWidth, width, height, offset };
  }, [paletteIndex, renderedText, textWidth, width, height, offset]);

  // Animation loop - update offset state to trigger re-renders
  useEffect(() => {
    if (!playing) return;

    const frameTime = 50;
    const increment = speed / 50;

    const interval = setInterval(() => {
      setOffset((prev) => {
        const next = prev + increment;
        // Loop back when text has fully scrolled off screen
        if (next > textWidth + width) {
          return 0;
        }
        return next;
      });
    }, frameTime);

    return () => clearInterval(interval);
  }, [playing, speed, textWidth, width]);

  // Reset offset when message changes
  useEffect(() => {
    setOffset(0);
  }, [messageIndex]);

  // Register direct buffer rendering
  useEffect(() => {
    const postProcess = (buffer: OptimizedBuffer, deltaTime: number) => {
      const { paletteIndex, renderedText, textWidth, width, height } =
        stateRef.current;
      const offset = stateRef.current.offset;
      const paletteKey = PALETTE_KEYS[paletteIndex] ?? "amber";
      const palette = PALETTES_RGBA[paletteKey];

      // Calculate offset (ExperimentFrame adds borders/padding)
      const frameOffsetX = 2;
      const frameOffsetY = 3;

      // Calculate vertical centering
      const bannerHeight = LETTER_HEIGHT + 4;
      const topPadding = Math.floor((height - bannerHeight) / 2);

      const bgColor = RGBA.fromInts(0, 0, 0, 255);
      const borderColor = palette[3]!;
      const padColor = palette[1]!;
      const litColor = palette[palette.length - 1]!;
      const unlitColor = palette[0]!;

      // Top spacing (empty)
      for (let i = 0; i < topPadding; i++) {
        for (let x = 0; x < width; x++) {
          buffer.setCell(frameOffsetX + x, frameOffsetY + i, " ", bgColor, bgColor);
        }
      }

      // Top border
      const borderY = topPadding;
      for (let x = 0; x < width; x++) {
        buffer.setCell(frameOffsetX + x, frameOffsetY + borderY, "=", borderColor, bgColor);
      }

      // Padding row above text
      const padTopY = topPadding + 1;
      for (let x = 0; x < width; x++) {
        buffer.setCell(frameOffsetX + x, frameOffsetY + padTopY, " ", padColor, bgColor);
      }

      // Render each row of the block letter text
      for (let row = 0; row < LETTER_HEIGHT; row++) {
        const textRow = renderedText[row] ?? "";
        const y = topPadding + 2 + row;

        for (let x = 0; x < width; x++) {
          // Calculate position in the scrolling text
          const textX = Math.floor(x + offset - width);

          let char = " ";
          let color = unlitColor;

          if (textX >= 0 && textX < textRow.length) {
            const sourceChar = textRow[textX];
            if (sourceChar === "#") {
              char = "\u2588"; // Full block
              color = litColor;
            }
          }

          buffer.setCell(frameOffsetX + x, frameOffsetY + y, char, color, bgColor);
        }
      }

      // Padding row below text
      const padBottomY = topPadding + 2 + LETTER_HEIGHT;
      for (let x = 0; x < width; x++) {
        buffer.setCell(frameOffsetX + x, frameOffsetY + padBottomY, " ", padColor, bgColor);
      }

      // Bottom border
      const borderBottomY = topPadding + 3 + LETTER_HEIGHT;
      for (let x = 0; x < width; x++) {
        buffer.setCell(frameOffsetX + x, frameOffsetY + borderBottomY, "=", borderColor, bgColor);
      }

      // Bottom spacing (empty)
      const bottomStart = topPadding + 4 + LETTER_HEIGHT;
      for (let i = bottomStart; i < height; i++) {
        for (let x = 0; x < width; x++) {
          buffer.setCell(frameOffsetX + x, frameOffsetY + i, " ", bgColor, bgColor);
        }
      }
    };

    renderer.addPostProcessFn(postProcess);
    return () => {
      renderer.removePostProcessFn(postProcess);
    };
  }, [renderer]);

  // Keyboard controls
  useKeyboard((key) => {
    if (key.name === "escape" || key.name === "backspace") {
      onBack?.();
      return;
    }

    if (key.name === "space") setPlaying((p) => !p);

    // Cycle to next message
    if (key.name === "m") {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }

    // Cycle color palette
    if (key.name === "c") {
      setPaletteIndex((i) => (i + 1) % PALETTE_KEYS.length);
    }

    // Adjust speed with arrow keys
    if (key.name === "left" || key.name === "right") {
      const delta = key.name === "right" ? 1 : -1;
      if (focusedSlider === "speed") {
        setSpeed((s) => Math.max(10, Math.min(200, s + delta * 10)));
      }
    }
  });

  const sidebar = (
    <>
      <text fg="#FFCC00" marginBottom={1}>
        Marquee
      </text>

      <box marginBottom={1} flexDirection="column">
        <text fg={playing ? "#00FF00" : "#FF6600"}>
          {playing ? "Playing" : "Paused"}
        </text>
      </box>

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
        <text fg="#888">[M] Message</text>
        <text fg="#555" marginLeft={2}>
          {message}
        </text>
        <text fg="#888" marginTop={1}>
          [C] {PALETTE_KEYS[paletteIndex]}
        </text>
      </box>
    </>
  );

  const footer = (
    <>
      <text fg="#666">[Space] {playing ? "Pause" : "Play"}</text>
      <text fg="#666" marginLeft={2}>
        [M] Next Message
      </text>
      <text fg="#666" marginLeft={2}>
        [C] Color
      </text>
      <text fg="#666" marginLeft={2}>
        [Arrows] Speed
      </text>
      <text fg="#666" marginLeft={2}>
        [Esc] Back
      </text>
    </>
  );

  return (
    <ExperimentFrame title="Marquee" sidebar={sidebar} footer={footer}>
      {/* Placeholder box to reserve space - rendering happens via postProcess */}
      <box width={width} height={height} />
    </ExperimentFrame>
  );
}
