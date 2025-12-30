/**
 * TUI Generative Art - Entry Point
 *
 * Interactive generative art experiments for your terminal.
 * Run with: bun start
 */

import { useState, useEffect, useMemo } from "react";
import { createCliRenderer } from "@opentui/core";
import { createRoot, useKeyboard } from "@opentui/react";
import { FlowField, Plasma, Tunnel } from "./experiments";
import { simplex3 } from "./experiments/flow/noise";

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
});

type Experiment = "menu" | "flow" | "plasma" | "tunnel";

// Canvas dimensions (10:3 aspect ratio)
const CANVAS_WIDTH = 100;
const CANVAS_HEIGHT = 30;

// Preview dimensions
const PREVIEW_WIDTH = 24;
const PREVIEW_HEIGHT = 6;

// Shared palette
const GRAY_PALETTE = ["#333", "#555", "#777", "#999", "#bbb", "#ddd"];

// Mini flow field preview
const ARROWS = ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"];

function FlowPreview({ time }: { time: number }) {
  const elements = useMemo(() => {
    const noiseScale = 0.1;
    const rows: JSX.Element[] = [];

    for (let y = 0; y < PREVIEW_HEIGHT; y++) {
      const segments: { text: string; color: string }[] = [];
      let currentText = "";
      let currentColorIdx = -1;

      for (let x = 0; x < PREVIEW_WIDTH; x++) {
        const noiseValue = simplex3(x * noiseScale, y * noiseScale * 2, time);
        const angle = (noiseValue + 1) * Math.PI;
        const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const arrowIdx = Math.round(normalized / (Math.PI / 4)) % 8;
        const char = ARROWS[arrowIdx] ?? "→";
        const colorIdx = Math.floor(((noiseValue + 1) / 2) * (GRAY_PALETTE.length - 0.01));

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

// Mini plasma preview
const PLASMA_CHARS = " ░▒▓█";

function plasmaValue(x: number, y: number, time: number): number {
  let value = 0;
  value += Math.sin(x * 0.3 + time);
  value += Math.sin(y * 0.5 + time * 1.3);
  value += Math.sin((x + y) * 0.3 + time * 0.7);
  const cx = x - 4;
  const cy = y - 4;
  value += Math.sin(Math.sqrt(cx * cx + cy * cy) * 0.5 + time);
  return (value + 4) / 8;
}

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

// Mini tunnel preview
const TUNNEL_CHARS = " ·:=≡#";

function TunnelPreview({ time }: { time: number }) {
  const elements = useMemo(() => {
    const rows: JSX.Element[] = [];
    const centerX = PREVIEW_WIDTH / 2;
    const centerY = PREVIEW_HEIGHT / 2;
    const maxDist = Math.sqrt(centerX * centerX + (centerY * 2) * (centerY * 2));
    const ringCount = 8;

    for (let y = 0; y < PREVIEW_HEIGHT; y++) {
      const segments: { text: string; color: string }[] = [];
      let currentText = "";
      let currentColorIdx = -1;

      for (let x = 0; x < PREVIEW_WIDTH; x++) {
        const dx = x - centerX;
        const dy = (y - centerY) * 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const normalizedDist = dist / maxDist;
        const logDist = normalizedDist > 0 ? Math.log(normalizedDist * 10 + 1) / Math.log(11) : 0;
        const ringPhase = (logDist * ringCount - time) % 1;
        const adjustedPhase = ringPhase < 0 ? ringPhase + 1 : ringPhase;
        const ringIntensity = Math.pow(Math.sin(adjustedPhase * Math.PI), 0.5);
        const depthFade = 1 - normalizedDist * 0.7;
        const intensity = ringIntensity * depthFade;

        const charIdx = Math.floor(intensity * (TUNNEL_CHARS.length - 0.01));
        const colorIdx = Math.floor(intensity * (GRAY_PALETTE.length - 0.01));
        const char = TUNNEL_CHARS[Math.max(0, Math.min(TUNNEL_CHARS.length - 1, charIdx))] ?? " ";

        if (colorIdx === currentColorIdx) {
          currentText += char;
        } else {
          if (currentText) {
            segments.push({ text: currentText, color: GRAY_PALETTE[currentColorIdx] ?? "#333" });
          }
          currentText = char;
          currentColorIdx = colorIdx;
        }
      }
      if (currentText) {
        segments.push({ text: currentText, color: GRAY_PALETTE[currentColorIdx] ?? "#333" });
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

interface ExperimentCardProps {
  number: string;
  title: string;
  description: string;
  color: string;
  preview: JSX.Element;
}

function ExperimentCard({ number, title, description, color, preview }: ExperimentCardProps) {
  return (
    <box
      flexDirection="column"
      borderStyle="rounded"
      borderColor="#333"
      padding={1}
      width={28}
    >
      {/* Preview */}
      <box marginBottom={1} overflow="hidden">
        {preview}
      </box>

      {/* Title bar */}
      <box flexDirection="row" marginBottom={1}>
        <text fg="#666">[</text>
        <text fg="#fff">{number}</text>
        <text fg="#666">] </text>
        <text fg={color}>{title}</text>
      </box>

      {/* Description */}
      <text fg="#555">{description}</text>
    </box>
  );
}

function Menu({ onSelect }: { onSelect: (exp: Experiment) => void }) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => t + 0.015);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useKeyboard((key) => {
    if (key.raw === "1") onSelect("flow");
    if (key.raw === "2") onSelect("plasma");
    if (key.raw === "3") onSelect("tunnel");
    if (key.name === "q") renderer.destroy();
  });

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      {/* Header */}
      <box flexDirection="column" alignItems="center" marginBottom={2}>
        <text fg="#FFCC00">TUI Generative Art</text>
        <text fg="#555">terminal visual experiments</text>
      </box>

      {/* Cards */}
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
        <ExperimentCard
          number="3"
          title="Tunnel"
          description="Infinite forward"
          color="#00CCFF"
          preview={<TunnelPreview time={time} />}
        />
      </box>

      {/* Footer */}
      <box flexDirection="row" justifyContent="center" marginTop={2}>
        <text fg="#444">[1-3] Select</text>
        <text fg="#444" marginLeft={2}>[Q] Quit</text>
      </box>
    </box>
  );
}

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
        />
      )}

      {experiment === "plasma" && (
        <Plasma
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onBack={goToMenu}
        />
      )}

      {experiment === "tunnel" && (
        <Tunnel
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onBack={goToMenu}
        />
      )}
    </box>
  );
}

// @ts-ignore
createRoot(renderer).render(<App />);
