/**
 * TUI Generative Art - Entry Point
 *
 * Interactive generative art experiments for your terminal.
 * Built with React and OpenTUI for rich terminal graphics.
 *
 * Run with: bun start
 */

import { useState, useEffect, useMemo } from "react";
import { createCliRenderer } from "@opentui/core";
import { createRoot, useKeyboard } from "@opentui/react";
import { FlowField, Plasma, Marquee } from "./experiments";
import { simplex3 } from "./experiments/flow/noise";

// Initialize the terminal renderer
const renderer = await createCliRenderer({
  exitOnCtrlC: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

type Experiment = "menu" | "flow" | "plasma" | "marquee";

/** Main canvas dimensions (10:3 aspect ratio for optimal terminal viewing) */
const CANVAS_WIDTH = 100;
const CANVAS_HEIGHT = 30;

/** Preview card dimensions for the menu */
const PREVIEW_WIDTH = 24;
const PREVIEW_HEIGHT = 6;

/** 6-level grayscale palette for preview animations */
const GRAY_PALETTE = ["#333", "#555", "#777", "#999", "#bbb", "#ddd"];

// ─────────────────────────────────────────────────────────────────────────────
// Preview Components (Mini animated previews for the menu cards)
// ─────────────────────────────────────────────────────────────────────────────

/** Direction arrows for 8 cardinal/ordinal directions */
const ARROWS = ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"];

/**
 * Mini flow field preview for the menu card.
 * Uses simplex noise to animate directional arrows.
 */
function FlowPreview({ time }: { time: number }) {
  const elements = useMemo(() => {
    const noiseScale = 0.1;
    const rows: JSX.Element[] = [];

    for (let y = 0; y < PREVIEW_HEIGHT; y++) {
      // Batch consecutive characters with the same color into segments
      const segments: { text: string; color: string }[] = [];
      let currentText = "";
      let currentColorIdx = -1;

      for (let x = 0; x < PREVIEW_WIDTH; x++) {
        // Sample 3D noise (z = time for animation)
        const noiseValue = simplex3(x * noiseScale, y * noiseScale * 2, time);

        // Map noise to angle and select arrow character
        const angle = (noiseValue + 1) * Math.PI;
        const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const arrowIdx = Math.round(normalized / (Math.PI / 4)) % 8;
        const char = ARROWS[arrowIdx] ?? "→";

        // Map noise to color index for grayscale shading
        const colorIdx = Math.floor(((noiseValue + 1) / 2) * (GRAY_PALETTE.length - 0.01));

        // Batch characters with same color for rendering efficiency
        if (colorIdx === currentColorIdx) {
          currentText += char;
        } else {
          if (currentText) {
            segments.push({ text: currentText, color: GRAY_PALETTE[currentColorIdx]! });
          }
          currentText = char;
          currentColorIdx = colorIdx;
        }
      }
      if (currentText) {
        segments.push({ text: currentText, color: GRAY_PALETTE[currentColorIdx]! });
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
  }, [time]);

  return <box flexDirection="column">{elements}</box>;
}

/** Block characters for plasma intensity (5 levels: empty to full) */
const PLASMA_CHARS = " ░▒▓█";

/**
 * Calculate plasma value at a point using layered sine waves.
 * Returns normalized value in range [0, 1].
 */
function plasmaValue(x: number, y: number, time: number): number {
  let value = 0;
  value += Math.sin(x * 0.3 + time);           // Horizontal wave
  value += Math.sin(y * 0.5 + time * 1.3);     // Vertical wave
  value += Math.sin((x + y) * 0.3 + time * 0.7); // Diagonal wave

  // Circular wave from offset center
  const cx = x - 4;
  const cy = y - 4;
  value += Math.sin(Math.sqrt(cx * cx + cy * cy) * 0.5 + time);

  return (value + 4) / 8; // Normalize to [0, 1]
}

/**
 * Mini plasma preview for the menu card.
 * Shows a simplified plasma effect using sine waves.
 */
function PlasmaPreview({ time }: { time: number }) {
  const elements = useMemo(() => {
    const rows: JSX.Element[] = [];

    for (let y = 0; y < PREVIEW_HEIGHT; y++) {
      const segments: { text: string; color: string }[] = [];
      let currentText = "";
      let currentColorIdx = -1;

      for (let x = 0; x < PREVIEW_WIDTH; x++) {
        const value = plasmaValue(x * 0.5, y * 1.0, time);
        const colorIdx = Math.floor(value * (GRAY_PALETTE.length - 0.01));
        const charIdx = Math.floor(value * (PLASMA_CHARS.length - 0.01));
        const char = PLASMA_CHARS[charIdx] ?? " ";

        // Batch characters with same color
        if (colorIdx === currentColorIdx) {
          currentText += char;
        } else {
          if (currentText) {
            segments.push({ text: currentText, color: GRAY_PALETTE[currentColorIdx]! });
          }
          currentText = char;
          currentColorIdx = colorIdx;
        }
      }
      if (currentText) {
        segments.push({ text: currentText, color: GRAY_PALETTE[currentColorIdx]! });
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
  }, [time]);

  return <box flexDirection="column">{elements}</box>;
}

/**
 * Mini marquee preview for the menu card.
 * Simple scrolling text with LED-style appearance.
 */
function MarqueePreview({ time, width = PREVIEW_WIDTH }: { time: number; width?: number }) {
  const message = "  BREAKING NEWS: MATT IS BAD AT JAVASCRIPT  ";
  const offset = Math.floor(time * 12) % message.length;

  // Create seamless loop by doubling the message
  const repeated = message + message;
  const visible = repeated.slice(offset, offset + width);

  return (
    <box flexDirection="column">
      <box><text fg="#996600">{"=".repeat(width)}</text></box>
      <box><text fg="#333">{" ".repeat(width)}</text></box>
      <box><text fg="#ffcc00">{visible.padEnd(width)}</text></box>
      <box><text fg="#333">{" ".repeat(width)}</text></box>
      <box><text fg="#996600">{"=".repeat(width)}</text></box>
    </box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Menu Components
// ─────────────────────────────────────────────────────────────────────────────

interface ExperimentCardProps {
  number: string;
  title: string;
  description: string;
  color: string;
  preview: JSX.Element;
  width?: number;
}

/**
 * Card component displaying an experiment preview with title and description.
 * Used in the main menu grid.
 */
function ExperimentCard({ number, title, description, color, preview, width = 28 }: ExperimentCardProps) {
  return (
    <box
      flexDirection="column"
      borderStyle="rounded"
      borderColor="#333"
      padding={1}
      width={width}
    >
      <box marginBottom={1} overflow="hidden">
        {preview}
      </box>

      <box flexDirection="row" marginBottom={1}>
        <text fg="#666">[</text>
        <text fg="#fff">{number}</text>
        <text fg="#666">] </text>
        <text fg={color}>{title}</text>
      </box>

      <text fg="#555">{description}</text>
    </box>
  );
}

/**
 * Main menu screen with animated preview cards for each experiment.
 */
function Menu({ onSelect }: { onSelect: (exp: Experiment) => void }) {
  const [time, setTime] = useState(0);

  // Animation timer for preview cards (~20fps for previews)
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => t + 0.015);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Keyboard navigation
  useKeyboard((key) => {
    if (key.raw === "1") onSelect("flow");
    if (key.raw === "2") onSelect("plasma");
    if (key.raw === "3") onSelect("marquee");
    if (key.name === "q") renderer.destroy();
  });

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      {/* Header */}
      <box flexDirection="column" alignItems="center" marginBottom={2}>
        <text fg="#FFCC00">TUI Generative Art</text>
        <text fg="#555">terminal visual experiments</text>
      </box>

      {/* Experiment cards in a 2x2 grid layout */}
      <box flexDirection="column" alignItems="center" rowGap={1}>
        <box flexDirection="row" justifyContent="center" columnGap={2}>
          <ExperimentCard
            number="1"
            title="Flow Field"
            description="Simplex noise vectors"
            color="#FF6600"
            preview={<FlowPreview time={time} />}
          />
          <ExperimentCard
            number="2"
            title="Plasma"
            description="Demoscene classic"
            color="#FF00FF"
            preview={<PlasmaPreview time={time} />}
          />
        </box>
        <box flexDirection="row" justifyContent="center">
          <ExperimentCard
            number="3"
            title="Marquee"
            description="Scrolling banner"
            color="#FFCC00"
            width={58}
            preview={<MarqueePreview time={time} width={54} />}
          />
        </box>
      </box>

      {/* Navigation hints */}
      <box flexDirection="row" justifyContent="center" marginTop={2}>
        <text fg="#444">[1-3] Select</text>
        <text fg="#444" marginLeft={2}>[Q] Quit</text>
      </box>
    </box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Application Root
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Root application component.
 * Manages navigation between the menu and individual experiments.
 */
function App() {
  const [experiment, setExperiment] = useState<Experiment>("menu");

  const goToMenu = () => setExperiment("menu");

  return (
    <box flexDirection="column" flexGrow={1}>
      {experiment === "menu" && <Menu onSelect={setExperiment} />}

      {experiment === "flow" && (
        <FlowField
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onBack={goToMenu}
          renderer={renderer}
        />
      )}

      {experiment === "plasma" && (
        <Plasma
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onBack={goToMenu}
          renderer={renderer}
        />
      )}

      {experiment === "marquee" && (
        <Marquee
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onBack={goToMenu}
          renderer={renderer}
        />
      )}
    </box>
  );
}

// Mount the application
// @ts-ignore - OpenTUI types not fully compatible with React 19
createRoot(renderer).render(<App />);
