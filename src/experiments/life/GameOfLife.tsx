/**
 * Game of Life Experiment
 * Conway's Game of Life cellular automaton
 */

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useKeyboard } from "@opentui/react";
import { ExperimentFrame, Slider } from "../../components";
import {
  createGrid,
  randomizeGrid,
  step,
  countLiveCells,
  placePattern,
  type Grid,
} from "./simulation";
import { getPattern, getPatternCount, PATTERNS } from "./patterns";

interface GameOfLifeProps {
  width?: number;
  height?: number;
  onBack?: () => void;
}

type FocusedSlider = "speed" | "density" | null;

export function GameOfLife({
  width = 80,
  height = 24,
  onBack,
}: GameOfLifeProps) {
  const [grid, setGrid] = useState<Grid>(() => createGrid(width, height));
  const [generation, setGeneration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(100); // ms per generation
  const [density, setDensity] = useState(30); // percentage for randomize
  const [wrap, setWrap] = useState(true);
  const [patternIndex, setPatternIndex] = useState(0);
  const [focusedSlider, setFocusedSlider] = useState<FocusedSlider>("speed");

  // Animation loop
  useEffect(() => {
    if (!playing) return;

    const interval = setInterval(() => {
      setGrid((g) => step(g, wrap));
      setGeneration((gen) => gen + 1);
    }, speed);

    return () => clearInterval(interval);
  }, [playing, speed, wrap]);

  // Reset grid when dimensions change
  useEffect(() => {
    setGrid(createGrid(width, height));
    setGeneration(0);
  }, [width, height]);

  const stepOnce = useCallback(() => {
    setGrid((g) => step(g, wrap));
    setGeneration((gen) => gen + 1);
  }, [wrap]);

  const clear = useCallback(() => {
    setGrid(createGrid(width, height));
    setGeneration(0);
    setPlaying(false);
  }, [width, height]);

  const randomize = useCallback(() => {
    setGrid(randomizeGrid(width, height, density / 100));
    setGeneration(0);
  }, [width, height, density]);

  const loadPattern = useCallback((index: number) => {
    const pattern = getPattern(index);
    const newGrid = createGrid(width, height);
    // Center the pattern
    const offsetX = Math.floor((width - (pattern.data[0]?.length ?? 0)) / 2);
    const offsetY = Math.floor((height - pattern.data.length) / 2);
    setGrid(placePattern(newGrid, pattern.data, offsetX, offsetY));
    setGeneration(0);
    setPatternIndex(index);
  }, [width, height]);

  // Keyboard controls
  useKeyboard((key) => {
    // Back to menu
    if (key.name === "escape" || key.name === "backspace") {
      onBack?.();
      return;
    }

    // Play/Pause
    if (key.name === "space") {
      setPlaying((p) => !p);
    }

    // Step
    if (key.name === "n" || key.raw === ".") {
      if (!playing) stepOnce();
    }

    // Clear
    if (key.name === "x") {
      clear();
    }

    // Randomize
    if (key.name === "r") {
      randomize();
    }

    // Toggle wrap
    if (key.name === "w") {
      setWrap((w) => !w);
    }

    // Load patterns with number keys
    if (key.raw && key.raw >= "1" && key.raw <= "9") {
      const index = parseInt(key.raw, 10) - 1;
      if (index < getPatternCount()) {
        loadPattern(index);
      }
    }

    // Cycle patterns with P
    if (key.name === "p") {
      const nextIndex = (patternIndex + 1) % getPatternCount();
      loadPattern(nextIndex);
    }

    // Tab to cycle sliders
    if (key.name === "tab") {
      setFocusedSlider((prev) => (prev === "speed" ? "density" : "speed"));
    }

    // Adjust focused slider with < and >
    if (focusedSlider === "speed") {
      if (key.raw === "," || key.raw === "<") {
        setSpeed((s) => Math.min(500, s + 25));
      }
      if (key.raw === "." || key.raw === ">") {
        setSpeed((s) => Math.max(25, s - 25));
      }
    }
    if (focusedSlider === "density") {
      if (key.raw === "," || key.raw === "<") {
        setDensity((d) => Math.max(10, d - 10));
      }
      if (key.raw === "." || key.raw === ">") {
        setDensity((d) => Math.min(90, d + 10));
      }
    }
  });

  // Render grid
  const gridElements = useMemo(() => {
    return grid.map((row, y) => {
      // Batch consecutive cells with same state for performance
      const segments: { chars: string; alive: boolean }[] = [];
      let currentChars = "";
      let currentAlive = false;

      for (const cell of row) {
        const char = cell ? "█" : " ";
        if (cell === currentAlive || currentChars === "") {
          currentChars += char;
          currentAlive = cell;
        } else {
          segments.push({ chars: currentChars, alive: currentAlive });
          currentChars = char;
          currentAlive = cell;
        }
      }
      if (currentChars) {
        segments.push({ chars: currentChars, alive: currentAlive });
      }

      return (
        <box key={y} flexDirection="row">
          {segments.map((seg, i) => (
            <text key={i} fg={seg.alive ? "#00FF00" : "#1a1a1a"}>
              {seg.chars}
            </text>
          ))}
        </box>
      );
    });
  }, [grid]);

  const liveCells = countLiveCells(grid);
  const currentPattern = getPattern(patternIndex);

  const sidebar = (
    <>
      <text fg="#FFCC00" marginBottom={1}>
        <b>Game of Life</b>
      </text>

      <box marginBottom={1} flexDirection="column">
        <text fg="#888888">Generation: {generation}</text>
        <text fg="#888888">Live cells: {liveCells}</text>
        <text fg={playing ? "#00FF00" : "#FF6600"}>
          {playing ? "Playing" : "Paused"}
        </text>
      </box>

      <Slider
        label="Speed (ms)"
        value={speed}
        min={25}
        max={500}
        step={25}
        width={18}
        focused={focusedSlider === "speed"}
        onChange={setSpeed}
      />

      <Slider
        label="Density (%)"
        value={density}
        min={10}
        max={90}
        step={10}
        width={18}
        focused={focusedSlider === "density"}
        onChange={setDensity}
      />

      <box marginTop={1} flexDirection="column">
        <text fg="#FFCC00" marginBottom={1}>
          <b>Toggles</b>
        </text>
        <text fg={wrap ? "#00FF00" : "#666666"}>
          [W] Wrap: {wrap ? "ON" : "OFF"}
        </text>
      </box>

      <box marginTop={1} flexDirection="column">
        <text fg="#FFCC00" marginBottom={1}>
          <b>Pattern</b>
        </text>
        <text fg="#888888">{currentPattern.name}</text>
        <text fg="#555555" marginTop={1}>
          [P] Next pattern
        </text>
        <text fg="#555555">
          [1-9] Load preset
        </text>
      </box>
    </>
  );

  const footer = (
    <>
      <text fg="#666666">[Space] {playing ? "Pause" : "Play"}</text>
      <text fg="#666666" marginLeft={2}>[N] Step</text>
      <text fg="#666666" marginLeft={2}>[R] Random</text>
      <text fg="#666666" marginLeft={2}>[X] Clear</text>
      <text fg="#666666" marginLeft={2}>[Esc] Back</text>
    </>
  );

  return (
    <ExperimentFrame
      title="Game of Life"
      sidebar={sidebar}
      footer={footer}
    >
      <box flexDirection="column" overflow="hidden">
        {gridElements}
      </box>
    </ExperimentFrame>
  );
}
