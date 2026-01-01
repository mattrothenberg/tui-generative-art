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
 *
 * PERFORMANCE: Uses direct buffer rendering via addPostProcessFn for 60fps.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useKeyboard } from "@opentui/react";
import { RGBA } from "@opentui/core";
import type { CliRenderer, OptimizedBuffer } from "@opentui/core";
import { ExperimentFrame, Slider } from "../../components";
import { hueToHex, hexToRgb } from "../../utils";
import { simplex3, seed } from "./noise";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface FlowFieldProps {
  width?: number;
  height?: number;
  onBack?: () => void;
  renderer: CliRenderer;
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
 */
const COLOR_PALETTE: string[] = [];
for (let i = 0; i < 6; i++) {
  COLOR_PALETTE.push(hueToHex((i / 6) * 360, 0.75, 0.55));
}

/** 6-level grayscale palette for non-color mode */
const GRAY_PALETTE = ["#444", "#666", "#888", "#aaa", "#ccc", "#fff"];

// Pre-convert palettes to RGBA for direct buffer rendering
const COLOR_PALETTE_RGBA = COLOR_PALETTE.map((hex) => {
  const rgb = hexToRgb(hex);
  return RGBA.fromInts(rgb.r, rgb.g, rgb.b, 255);
});

const GRAY_PALETTE_RGBA = GRAY_PALETTE.map((hex) => {
  const rgb = hexToRgb(hex);
  return RGBA.fromInts(rgb.r, rgb.g, rgb.b, 255);
});

// ─────────────────────────────────────────────────────────────────────────────
// Mapping Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert an angle (radians) to one of 8 directional arrows.
 */
function angleToArrowIndex(angle: number): number {
  const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return Math.round(normalized / (Math.PI / 4)) % 8;
}

/**
 * Convert an angle (radians) to one of 4 line characters.
 */
function angleToLineIndex(angle: number): number {
  const normalized = ((angle % Math.PI) + Math.PI) % Math.PI;
  return Math.round(normalized / (Math.PI / 4)) % 4;
}

/**
 * Convert noise value [-1, 1] to a dot index.
 */
function noiseToDotIndex(value: number): number {
  const index = Math.floor(((value + 1) / 2) * (DOTS.length - 0.01));
  return Math.max(0, Math.min(DOTS.length - 1, index));
}

/**
 * Map angle to rainbow color palette index (6 colors).
 */
function angleToColorIndex(angle: number): number {
  const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return Math.floor((normalized / (2 * Math.PI)) * 6) % 6;
}

/**
 * Map noise value [-1, 1] to grayscale palette index.
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
  renderer,
}: FlowFieldProps) {
  // Visualization parameters
  const [scale, setScale] = useState(1);
  const [speed, setSpeed] = useState(10);
  const [playing, setPlaying] = useState(true);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("arrows");
  const [colorMode, setColorMode] = useState(false);
  const [seedValue, setSeedValue] = useState(42);
  const [focusedSlider, setFocusedSlider] = useState<FocusedSlider>("scale");

  // Animation time - using state to trigger re-renders
  const [time, setTime] = useState(0);
  
  // State ref for postProcess access (avoids stale closures)
  const stateRef = useRef({
    scale,
    displayMode,
    colorMode,
    width,
    height,
    time,
  });

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = { scale, displayMode, colorMode, width, height, time };
  }, [scale, displayMode, colorMode, width, height, time]);

  // Re-seed noise generator when seed changes
  useEffect(() => {
    seed(seedValue);
  }, [seedValue]);

  // Animation loop - update time state to trigger re-renders
  useEffect(() => {
    if (!playing) return;

    const frameTime = 16; // ~60fps
    const interval = setInterval(() => {
      const timeIncrement = 0.12 * (speed / 100);
      setTime((t) => t + timeIncrement);
    }, frameTime);

    return () => clearInterval(interval);
  }, [playing, speed]);

  // Register direct buffer rendering
  useEffect(() => {
    const postProcess = (buffer: OptimizedBuffer, deltaTime: number) => {
      const { scale, displayMode, colorMode, width, height } = stateRef.current;
      const time = stateRef.current.time;
      const noiseScale = scale / 100;

      // Calculate offset (ExperimentFrame adds borders/padding)
      // border (1) + padding (1) = 2
      const offsetX = 2;
      const offsetY = 3; // header row + border + padding

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Sample noise (y scaled 2x for terminal aspect ratio)
          const noiseValue = simplex3(x * noiseScale, y * noiseScale * 2, time);
          const angle = (noiseValue + 1) * Math.PI;

          // Select character based on display mode
          let char: string;
          if (displayMode === "arrows") {
            char = ARROWS[angleToArrowIndex(angle)] ?? "→";
          } else if (displayMode === "lines") {
            char = LINES[angleToLineIndex(angle)] ?? "─";
          } else {
            char = DOTS[noiseToDotIndex(noiseValue)] ?? " ";
          }

          // Get color
          const colorIdx = colorMode
            ? angleToColorIndex(angle)
            : noiseToGrayIndex(noiseValue);

          const fgColor = colorMode
            ? COLOR_PALETTE_RGBA[colorIdx]!
            : GRAY_PALETTE_RGBA[colorIdx]!;

          // Write directly to buffer
          const bgColor = RGBA.fromInts(0, 0, 0, 255);
          buffer.setCell(offsetX + x, offsetY + y, char, fgColor, bgColor);
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

    // Reseed with random value
    if (key.name === "r") {
      setSeedValue(Math.floor(Math.random() * 100000));
      setTime(0);
    }

    // Cycle through display modes
    if (key.name === "d") {
      setDisplayMode((m) =>
        m === "arrows" ? "lines" : m === "lines" ? "dots" : "arrows"
      );
    }

    // Toggle color mode
    if (key.name === "c") setColorMode((c) => !c);

    // Tab between sliders
    if (key.name === "tab") {
      setFocusedSlider((prev) => (prev === "scale" ? "speed" : "scale"));
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

  const sidebar = (
    <>
      <text fg="#FFCC00" marginBottom={1}>
        Flow Field
      </text>

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
      <text fg="#666" marginLeft={2}>
        [R] Reseed
      </text>
      <text fg="#666" marginLeft={2}>
        [D] Mode
      </text>
      <text fg="#666" marginLeft={2}>
        [Arrows] Adjust
      </text>
      <text fg="#666" marginLeft={2}>
        [Esc] Back
      </text>
    </>
  );

  return (
    <ExperimentFrame title="Flow Field" sidebar={sidebar} footer={footer}>
      {/* Placeholder box to reserve space - rendering happens via postProcess */}
      <box width={width} height={height} />
    </ExperimentFrame>
  );
}
