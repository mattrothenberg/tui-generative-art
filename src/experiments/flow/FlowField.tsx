/**
 * Flow Field Experiment
 *
 * A vector field visualization powered by 3D Simplex noise.
 * The noise function samples x, y position and time (z) to create
 * smooth, organic animations.
 *
 * Display modes:
 * - Arrows: 8-direction unicode arrows showing flow direction
 * - Lines: 4-direction line segments for a more abstract look
 * - Dots: Intensity-based dots showing noise magnitude
 */

import { useState, useMemo, useEffect } from "react";
import { useKeyboard } from "@opentui/react";
import { ExperimentFrame, Slider } from "../../components";
import { hueToHex } from "../../utils";
import { simplex3, seed } from "./noise";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface FlowFieldProps {
  width?: number;
  height?: number;
  onBack?: () => void;
}

type FocusedSlider = "scale" | "speed" | null;
type DisplayMode = "arrows" | "lines" | "dots";

// ─────────────────────────────────────────────────────────────────────────────
// Character Sets & Color Palettes
// ─────────────────────────────────────────────────────────────────────────────

/** 8 directional arrows (N, NE, E, SE, S, SW, W, NW) */
const ARROWS = ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"];

/** 4 directional lines (horizontal, diagonal-down, vertical, diagonal-up) */
const LINES = ["─", "╲", "│", "╱"];

/** 5 intensity levels from empty to solid */
const DOTS = [" ", "·", "•", "●", "█"];

/**
 * Pre-computed rainbow color palette (6 hues).
 * Fewer colors = better batching performance.
 */
const COLOR_PALETTE: string[] = [];
for (let i = 0; i < 6; i++) {
  COLOR_PALETTE.push(hueToHex((i / 6) * 360, 0.75, 0.55));
}

/** 6-level grayscale palette for non-color mode */
const GRAY_PALETTE = ["#444", "#666", "#888", "#aaa", "#ccc", "#fff"];

// ─────────────────────────────────────────────────────────────────────────────
// Mapping Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert an angle (radians) to one of 8 directional arrows.
 * Divides the full circle into 8 equal segments.
 */
function angleToArrow(angle: number): string {
  const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const index = Math.round(normalized / (Math.PI / 4)) % 8;
  return ARROWS[index] ?? "→";
}

/**
 * Convert an angle (radians) to one of 4 line characters.
 * Lines are symmetric, so we only need half the circle.
 */
function angleToLine(angle: number): string {
  const normalized = ((angle % Math.PI) + Math.PI) % Math.PI;
  const index = Math.round(normalized / (Math.PI / 4)) % 4;
  return LINES[index] ?? "─";
}

/**
 * Convert noise value [-1, 1] to a dot character based on intensity.
 */
function noiseToDot(value: number): string {
  const index = Math.floor(((value + 1) / 2) * (DOTS.length - 0.01));
  return DOTS[Math.max(0, Math.min(DOTS.length - 1, index))] ?? " ";
}

/**
 * Map angle to rainbow color palette index (6 colors).
 * Used for color mode to create hue-based coloring.
 */
function angleToColorIndex(angle: number): number {
  const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return Math.floor((normalized / (2 * Math.PI)) * 6) % 6;
}

/**
 * Map noise value [-1, 1] to grayscale palette index.
 * Brighter values = higher noise magnitude.
 */
function noiseToGrayIndex(noise: number): number {
  return Math.floor(((noise + 1) / 2) * (GRAY_PALETTE.length - 0.01));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function FlowField({
  width = 80,
  height = 24,
  onBack,
}: FlowFieldProps) {
  // Visualization parameters
  const [scale, setScale] = useState(1);
  const [speed, setSpeed] = useState(10);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("arrows");
  const [colorMode, setColorMode] = useState(false);
  const [seedValue, setSeedValue] = useState(42);
  const [focusedSlider, setFocusedSlider] = useState<FocusedSlider>("scale");

  // Re-seed noise generator when seed changes
  useEffect(() => {
    seed(seedValue);
  }, [seedValue]);

  // Animation loop (~60fps)
  useEffect(() => {
    if (!playing) return;

    const frameTime = 16;
    const timeIncrement = 0.12 * (speed / 100);

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
    
    // Reseed with random value
    if (key.name === "r") {
      setSeedValue(Math.floor(Math.random() * 100000));
      setTime(0);
    }
    
    // Cycle through display modes
    if (key.name === "d") {
      setDisplayMode((m) => m === "arrows" ? "lines" : m === "lines" ? "dots" : "arrows");
    }
    
    // Toggle color mode
    if (key.name === "c") setColorMode((c) => !c);
    
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
   * Render the flow field.
   * 
   * For each pixel, we:
   * 1. Sample 3D simplex noise at (x, y, time)
   * 2. Convert noise to an angle for direction
   * 3. Map to appropriate character based on display mode
   * 4. Batch consecutive same-colored characters for performance
   */
  const fieldElements = useMemo(() => {
    const noiseScale = scale / 100;
    const rows: JSX.Element[] = [];

    for (let y = 0; y < height; y++) {
      // Batch consecutive characters with same color into segments
      const segments: { text: string; color: string }[] = [];
      let currentText = "";
      let currentColorIdx = -1;

      for (let x = 0; x < width; x++) {
        // Sample noise (y scaled 2x to compensate for terminal character aspect ratio)
        const noiseValue = simplex3(x * noiseScale, y * noiseScale * 2, time);
        const angle = (noiseValue + 1) * Math.PI;

        // Select character based on display mode
        let char: string;
        if (displayMode === "arrows") {
          char = angleToArrow(angle);
        } else if (displayMode === "lines") {
          char = angleToLine(angle);
        } else {
          char = noiseToDot(noiseValue);
        }

        // Quantize color for efficient batching
        const colorIdx = colorMode
          ? angleToColorIndex(angle)
          : noiseToGrayIndex(noiseValue);

        // Batch same-colored characters together
        if (colorIdx === currentColorIdx) {
          currentText += char;
        } else {
          if (currentText) {
            const color = colorMode ? COLOR_PALETTE[currentColorIdx]! : GRAY_PALETTE[currentColorIdx]!;
            segments.push({ text: currentText, color });
          }
          currentText = char;
          currentColorIdx = colorIdx;
        }
      }

      // Don't forget the last segment
      if (currentText) {
        const color = colorMode ? COLOR_PALETTE[currentColorIdx]! : GRAY_PALETTE[currentColorIdx]!;
        segments.push({ text: currentText, color });
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
  }, [width, height, scale, time, displayMode, colorMode]);

  const sidebar = (
    <>
      <text fg="#FFCC00" marginBottom={1}>Flow Field</text>

      <box marginBottom={1} flexDirection="column">
        <text fg={playing ? "#00FF00" : "#FF6600"}>
          {playing ? "Playing" : "Paused"}
        </text>
        <text fg="#666">Seed: {seedValue}</text>
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
        <text fg="#888">[D] {displayMode}</text>
        <text fg={colorMode ? "#00FF00" : "#666"}>
          [C] Color {colorMode ? "ON" : "OFF"}
        </text>
      </box>
    </>
  );

  const footer = (
    <>
      <text fg="#666">[Space] {playing ? "Pause" : "Play"}</text>
      <text fg="#666" marginLeft={2}>[R] Reseed</text>
      <text fg="#666" marginLeft={2}>[D] Mode</text>
      <text fg="#666" marginLeft={2}>[Arrows] Adjust</text>
      <text fg="#666" marginLeft={2}>[Esc] Back</text>
    </>
  );

  return (
    <ExperimentFrame title="Flow Field" sidebar={sidebar} footer={footer}>
      <box flexDirection="column" overflow="hidden">
        {fieldElements}
      </box>
    </ExperimentFrame>
  );
}
