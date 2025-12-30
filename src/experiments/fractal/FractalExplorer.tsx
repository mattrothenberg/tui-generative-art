/**
 * Fractal Explorer Experiment
 * Interactive Mandelbrot and Julia set visualization
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { useKeyboard } from "@opentui/react";
import { ExperimentFrame, Slider } from "../../components";
import { hueToHex, brightnessToHex } from "../../utils";
import {
  generateFractal,
  iterationToChar,
  iterationToHue,
  type FractalParams,
} from "./mandelbrot";

interface FractalExplorerProps {
  width?: number;
  height?: number;
  onBack?: () => void;
}

type FocusedSlider = "iterations" | "juliaReal" | "juliaImag" | null;

const DEFAULT_PARAMS: Omit<FractalParams, "width" | "height"> = {
  centerX: -0.5,
  centerY: 0,
  zoom: 1,
  maxIterations: 100,
  juliaMode: false,
  juliaReal: -0.7,
  juliaImag: 0.27015,
};

export function FractalExplorer({
  width = 80,
  height = 24,
  onBack,
}: FractalExplorerProps) {
  const [centerX, setCenterX] = useState(DEFAULT_PARAMS.centerX);
  const [centerY, setCenterY] = useState(DEFAULT_PARAMS.centerY);
  const [zoom, setZoom] = useState(DEFAULT_PARAMS.zoom);
  const [maxIterations, setMaxIterations] = useState(DEFAULT_PARAMS.maxIterations);
  const [juliaMode, setJuliaMode] = useState(DEFAULT_PARAMS.juliaMode);
  const [juliaReal, setJuliaReal] = useState(DEFAULT_PARAMS.juliaReal);
  const [juliaImag, setJuliaImag] = useState(DEFAULT_PARAMS.juliaImag);
  const [colorMode, setColorMode] = useState(true);
  const [focusedSlider, setFocusedSlider] = useState<FocusedSlider>("iterations");

  // Generate fractal
  const fractalResult = useMemo(() => {
    return generateFractal({
      width,
      height,
      centerX,
      centerY,
      zoom,
      maxIterations,
      juliaMode,
      juliaReal,
      juliaImag,
    });
  }, [width, height, centerX, centerY, zoom, maxIterations, juliaMode, juliaReal, juliaImag]);

  // Keyboard controls
  useKeyboard((key) => {
    // Back to menu
    if (key.name === "escape" || key.name === "backspace") {
      onBack?.();
      return;
    }

    // Pan with arrow keys
    const panAmount = 0.5 / zoom;
    if (key.name === "left") setCenterX((x) => x - panAmount);
    if (key.name === "right") setCenterX((x) => x + panAmount);
    if (key.name === "up") setCenterY((y) => y - panAmount);
    if (key.name === "down") setCenterY((y) => y + panAmount);

    // Zoom with +/- or [/]
    if (key.raw === "+" || key.raw === "=" || key.raw === "]") {
      setZoom((z) => z * 1.5);
    }
    if (key.raw === "-" || key.raw === "_" || key.raw === "[") {
      setZoom((z) => Math.max(0.1, z / 1.5));
    }

    // Toggle modes
    if (key.name === "m") {
      setJuliaMode((m) => !m);
    }
    if (key.name === "c") {
      setColorMode((c) => !c);
    }

    // Reset view
    if (key.name === "r") {
      setCenterX(juliaMode ? 0 : DEFAULT_PARAMS.centerX);
      setCenterY(DEFAULT_PARAMS.centerY);
      setZoom(DEFAULT_PARAMS.zoom);
    }

    // Tab to cycle sliders
    if (key.name === "tab") {
      setFocusedSlider((prev) => {
        if (juliaMode) {
          if (prev === "iterations") return "juliaReal";
          if (prev === "juliaReal") return "juliaImag";
          return "iterations";
        }
        return "iterations";
      });
    }

    // Adjust focused slider with < and >
    if (focusedSlider === "iterations") {
      if (key.raw === "," || key.raw === "<") {
        setMaxIterations((i) => Math.max(20, i - 20));
      }
      if (key.raw === "." || key.raw === ">") {
        setMaxIterations((i) => Math.min(500, i + 20));
      }
    }
    if (focusedSlider === "juliaReal") {
      if (key.raw === "," || key.raw === "<") {
        setJuliaReal((r) => Math.max(-2, r - 0.05));
      }
      if (key.raw === "." || key.raw === ">") {
        setJuliaReal((r) => Math.min(2, r + 0.05));
      }
    }
    if (focusedSlider === "juliaImag") {
      if (key.raw === "," || key.raw === "<") {
        setJuliaImag((i) => Math.max(-2, i - 0.05));
      }
      if (key.raw === "." || key.raw === ">") {
        setJuliaImag((i) => Math.min(2, i + 0.05));
      }
    }
  });

  // Render fractal as elements
  const fractalElements = useMemo(() => {
    return fractalResult.pixels.map((row, y) => {
      // Batch consecutive pixels with same color
      const segments: { chars: string; color: string }[] = [];
      let currentChars = "";
      let currentColor = "";

      for (const pixel of row) {
        let color: string;
        const char = iterationToChar(pixel, maxIterations, false);

        if (colorMode) {
          if (!pixel.escaped) {
            color = "#000000";
          } else {
            const hue = iterationToHue(pixel, maxIterations);
            color = hueToHex(hue, 0.8, 0.5);
          }
        } else {
          const brightness = pixel.escaped
            ? Math.floor((pixel.smooth / maxIterations) * 255)
            : 0;
          color = brightnessToHex(brightness);
        }

        if (color === currentColor) {
          currentChars += char;
        } else {
          if (currentChars) {
            segments.push({ chars: currentChars, color: currentColor });
          }
          currentChars = char;
          currentColor = color;
        }
      }
      if (currentChars) {
        segments.push({ chars: currentChars, color: currentColor });
      }

      return (
        <box key={y} flexDirection="row">
          {segments.map((seg, i) => (
            <text key={i} fg={seg.color}>
              {seg.chars}
            </text>
          ))}
        </box>
      );
    });
  }, [fractalResult, maxIterations, colorMode]);

  const sidebar = (
    <>
      <text fg="#FFCC00" marginBottom={1}>
        <b>{juliaMode ? "Julia Set" : "Mandelbrot"}</b>
      </text>

      <Slider
        label="Iterations"
        value={maxIterations}
        min={20}
        max={500}
        step={20}
        width={18}
        focused={focusedSlider === "iterations"}
        onChange={setMaxIterations}
      />

      {juliaMode && (
        <>
          <Slider
            label="Julia Real (c.r)"
            value={Math.round(juliaReal * 100)}
            min={-200}
            max={200}
            step={5}
            width={18}
            focused={focusedSlider === "juliaReal"}
            formatValue={(v) => (v / 100).toFixed(2)}
            onChange={(v) => setJuliaReal(v / 100)}
          />
          <Slider
            label="Julia Imag (c.i)"
            value={Math.round(juliaImag * 100)}
            min={-200}
            max={200}
            step={5}
            width={18}
            focused={focusedSlider === "juliaImag"}
            formatValue={(v) => (v / 100).toFixed(2)}
            onChange={(v) => setJuliaImag(v / 100)}
          />
        </>
      )}

      <box marginTop={1} flexDirection="column">
        <text fg="#888888" marginBottom={1}>
          Zoom: {zoom.toFixed(1)}x
        </text>
        <text fg="#888888" marginBottom={1}>
          Center: ({centerX.toFixed(3)}, {centerY.toFixed(3)})
        </text>
      </box>

      <box marginTop={1} flexDirection="column">
        <text fg={juliaMode ? "#00FF00" : "#666666"}>
          [M] Mode: {juliaMode ? "Julia" : "Mandelbrot"}
        </text>
        <text fg={colorMode ? "#00FF00" : "#666666"}>
          [C] Color: {colorMode ? "ON" : "OFF"}
        </text>
      </box>
    </>
  );

  const footer = (
    <>
      <text fg="#666666">[Arrows] Pan</text>
      <text fg="#666666" marginLeft={2}>[+/-] Zoom</text>
      <text fg="#666666" marginLeft={2}>[&lt;/&gt;] Adjust</text>
      <text fg="#666666" marginLeft={2}>[R] Reset</text>
      <text fg="#666666" marginLeft={2}>[Esc] Back</text>
    </>
  );

  return (
    <ExperimentFrame
      title="Fractal Explorer"
      sidebar={sidebar}
      footer={footer}
    >
      <box flexDirection="column" overflow="hidden">
        {fractalElements}
      </box>
    </ExperimentFrame>
  );
}
