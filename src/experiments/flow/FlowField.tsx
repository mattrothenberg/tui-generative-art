/**
 * Flow Field Experiment
 * Perlin/Simplex noise-based vector field visualization
 */

import { useState, useMemo, useEffect } from "react";
import { useKeyboard } from "@opentui/react";
import { ExperimentFrame, Slider } from "../../components";
import { hueToHex } from "../../utils";
import { simplex3, seed } from "./noise";

interface FlowFieldProps {
  width?: number;
  height?: number;
  onBack?: () => void;
}

type FocusedSlider = "scale" | "speed" | null;
type DisplayMode = "arrows" | "lines" | "dots";

// Arrow characters for 8 directions
const ARROWS = ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"];
// Line characters for 4 directions
const LINES = ["─", "╲", "│", "╱"];
// Dot with intensity
const DOTS = [" ", "·", "•", "●", "█"];

// Pre-compute color palette for performance (6 hues - fewer = faster batching)
const COLOR_PALETTE: string[] = [];
for (let i = 0; i < 6; i++) {
  COLOR_PALETTE.push(hueToHex((i / 6) * 360, 0.75, 0.55));
}

// Grayscale palette (6 shades)
const GRAY_PALETTE = ["#444", "#666", "#888", "#aaa", "#ccc", "#fff"];

function angleToArrow(angle: number): string {
  const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const index = Math.round(normalized / (Math.PI / 4)) % 8;
  return ARROWS[index] ?? "→";
}

function angleToLine(angle: number): string {
  const normalized = ((angle % Math.PI) + Math.PI) % Math.PI;
  const index = Math.round(normalized / (Math.PI / 4)) % 4;
  return LINES[index] ?? "─";
}

function noiseToDot(value: number): string {
  const index = Math.floor(((value + 1) / 2) * (DOTS.length - 0.01));
  return DOTS[Math.max(0, Math.min(DOTS.length - 1, index))] ?? " ";
}

// Quantize angle to color palette index (6 colors)
function angleToColorIndex(angle: number): number {
  const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return Math.floor((normalized / (2 * Math.PI)) * 6) % 6;
}

// Quantize noise to grayscale index
function noiseToGrayIndex(noise: number): number {
  return Math.floor(((noise + 1) / 2) * (GRAY_PALETTE.length - 0.01));
}

export function FlowField({
  width = 80,
  height = 24,
  onBack,
}: FlowFieldProps) {
  const [scale, setScale] = useState(4);
  const [speed, setSpeed] = useState(100);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("arrows");
  const [colorMode, setColorMode] = useState(false);
  const [seedValue, setSeedValue] = useState(42);
  const [focusedSlider, setFocusedSlider] = useState<FocusedSlider>("scale");

  useEffect(() => {
    seed(seedValue);
  }, [seedValue]);

  // Fast animation loop
  useEffect(() => {
    if (!playing) return;

    const frameTime = 16; // ~60fps target
    const timeIncrement = 0.12 * (speed / 100);

    const interval = setInterval(() => {
      setTime((t) => t + timeIncrement);
    }, frameTime);

    return () => clearInterval(interval);
  }, [playing, speed]);

  useKeyboard((key) => {
    if (key.name === "escape" || key.name === "backspace") {
      onBack?.();
      return;
    }

    if (key.name === "space") setPlaying((p) => !p);
    if (key.name === "r") {
      setSeedValue(Math.floor(Math.random() * 100000));
      setTime(0);
    }
    if (key.name === "d") {
      setDisplayMode((m) => m === "arrows" ? "lines" : m === "lines" ? "dots" : "arrows");
    }
    if (key.name === "c") setColorMode((c) => !c);
    if (key.name === "tab") {
      setFocusedSlider((prev) => prev === "scale" ? "speed" : "scale");
    }

    if (key.name === "left" || key.name === "right") {
      const delta = key.name === "right" ? 1 : -1;
      if (focusedSlider === "scale") {
        setScale((s) => Math.max(1, Math.min(20, s + delta)));
      } else if (focusedSlider === "speed") {
        setSpeed((s) => Math.max(10, Math.min(200, s + delta * 10)));
      }
    }
  });

  // Optimized rendering - build rows with minimal segments
  const fieldElements = useMemo(() => {
    const noiseScale = scale / 100;
    const rows: JSX.Element[] = [];

    for (let y = 0; y < height; y++) {
      // Build segments for this row
      const segments: { text: string; color: string }[] = [];
      let currentText = "";
      let currentColorIdx = -1;

      for (let x = 0; x < width; x++) {
        const noiseValue = simplex3(x * noiseScale, y * noiseScale * 2, time);
        const angle = (noiseValue + 1) * Math.PI;

        // Get character
        let char: string;
        if (displayMode === "arrows") {
          char = angleToArrow(angle);
        } else if (displayMode === "lines") {
          char = angleToLine(angle);
        } else {
          char = noiseToDot(noiseValue);
        }

        // Get color index (quantized for batching)
        const colorIdx = colorMode
          ? angleToColorIndex(angle)
          : noiseToGrayIndex(noiseValue);

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
