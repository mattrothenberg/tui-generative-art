/**
 * Tunnel Experiment
 * Infinite forward-traveling tunnel with concentric rings
 */

import { useState, useMemo, useEffect } from "react";
import { useKeyboard } from "@opentui/react";
import { ExperimentFrame, Slider } from "../../components";

interface TunnelProps {
  width?: number;
  height?: number;
  onBack?: () => void;
}

type FocusedSlider = "speed" | "ringCount" | null;

// Characters for ring intensity (closer = brighter)
const RING_CHARS = " ·:=≡#";
const RING_CHARS_ALT = " ░▒▓█";

// Grayscale palette
const GRAY_PALETTE = ["#222", "#444", "#666", "#888", "#aaa", "#ddd"];

type CharSet = "lines" | "blocks";

export function Tunnel({
  width = 80,
  height = 24,
  onBack,
}: TunnelProps) {
  const [speed, setSpeed] = useState(100);
  const [ringCount, setRingCount] = useState(12);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [charSet, setCharSet] = useState<CharSet>("lines");
  const [focusedSlider, setFocusedSlider] = useState<FocusedSlider>("speed");

  // Animation loop
  useEffect(() => {
    if (!playing) return;

    const frameTime = 16;
    const timeIncrement = 0.04 * (speed / 100);

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
    
    if (key.name === "d") {
      setCharSet((c) => c === "lines" ? "blocks" : "lines");
    }

    if (key.name === "tab") {
      setFocusedSlider((prev) => prev === "speed" ? "ringCount" : "speed");
    }

    if (key.name === "left" || key.name === "right") {
      const delta = key.name === "right" ? 1 : -1;
      if (focusedSlider === "speed") {
        setSpeed((s) => Math.max(10, Math.min(200, s + delta * 10)));
      } else if (focusedSlider === "ringCount") {
        setRingCount((r) => Math.max(4, Math.min(20, r + delta)));
      }
    }
  });

  // Render tunnel
  const tunnelElements = useMemo(() => {
    const chars = charSet === "lines" ? RING_CHARS : RING_CHARS_ALT;
    const rows: JSX.Element[] = [];
    
    // Center of the tunnel
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Maximum distance from center (corner distance)
    const maxDist = Math.sqrt(centerX * centerX + (centerY * 2) * (centerY * 2));

    for (let y = 0; y < height; y++) {
      const segments: { text: string; color: string }[] = [];
      let currentText = "";
      let currentColorIdx = -1;

      for (let x = 0; x < width; x++) {
        // Distance from center (adjust for character aspect ratio)
        const dx = x - centerX;
        const dy = (y - centerY) * 2; // Characters are ~2x tall as wide
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize distance to 0-1
        const normalizedDist = dist / maxDist;
        
        // Create ring effect - rings expand outward over time
        // Use log scale for more rings near center (perspective effect)
        const logDist = normalizedDist > 0 ? Math.log(normalizedDist * 10 + 1) / Math.log(11) : 0;
        
        // Animate rings moving outward
        const ringPhase = (logDist * ringCount - time) % 1;
        const adjustedPhase = ringPhase < 0 ? ringPhase + 1 : ringPhase;
        
        // Intensity based on ring phase (sharp rings)
        const ringIntensity = Math.pow(Math.sin(adjustedPhase * Math.PI), 0.5);
        
        // Fade out towards edges, bright at center
        const depthFade = 1 - normalizedDist * 0.7;
        const intensity = ringIntensity * depthFade;
        
        // Map to character and color
        const charIdx = Math.floor(intensity * (chars.length - 0.01));
        const colorIdx = Math.floor(intensity * (GRAY_PALETTE.length - 0.01));
        const char = chars[Math.max(0, Math.min(chars.length - 1, charIdx))] ?? " ";

        if (colorIdx === currentColorIdx) {
          currentText += char;
        } else {
          if (currentText) {
            segments.push({ text: currentText, color: GRAY_PALETTE[currentColorIdx] ?? "#222" });
          }
          currentText = char;
          currentColorIdx = colorIdx;
        }
      }

      if (currentText) {
        segments.push({ text: currentText, color: GRAY_PALETTE[currentColorIdx] ?? "#222" });
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
  }, [width, height, ringCount, time, charSet]);

  const sidebar = (
    <>
      <text fg="#FFCC00" marginBottom={1}>Tunnel</text>

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

      <Slider
        label="Rings"
        value={ringCount}
        min={4}
        max={20}
        step={1}
        width={18}
        focused={focusedSlider === "ringCount"}
        onChange={setRingCount}
      />

      <box marginTop={1} flexDirection="column">
        <text fg="#888">[D] {charSet}</text>
      </box>
    </>
  );

  const footer = (
    <>
      <text fg="#666">[Space] {playing ? "Pause" : "Play"}</text>
      <text fg="#666" marginLeft={2}>[D] Style</text>
      <text fg="#666" marginLeft={2}>[Arrows] Adjust</text>
      <text fg="#666" marginLeft={2}>[Esc] Back</text>
    </>
  );

  return (
    <ExperimentFrame title="Tunnel" sidebar={sidebar} footer={footer}>
      <box flexDirection="column" overflow="hidden">
        {tunnelElements}
      </box>
    </ExperimentFrame>
  );
}
