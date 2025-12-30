/**
 * TUI Generative Art - Entry Point
 *
 * Interactive generative art experiments for your terminal.
 * Run with: bun start
 */

import { useState } from "react";
import { createCliRenderer } from "@opentui/core";
import { createRoot, useKeyboard } from "@opentui/react";
import { FractalExplorer, GameOfLife, FlowField } from "./experiments";

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
});

type Experiment = "menu" | "fractal" | "life" | "flow";

// Canvas dimensions - optimized for performance
const CANVAS_WIDTH = 80;
const CANVAS_HEIGHT = 24;

function Menu({ onSelect }: { onSelect: (exp: Experiment) => void }) {
  useKeyboard((key) => {
    if (key.raw === "1") onSelect("fractal");
    if (key.raw === "2") onSelect("life");
    if (key.raw === "3") onSelect("flow");
    if (key.name === "q") renderer.destroy();
  });

  return (
    <box flexDirection="column" padding={2}>
      <box marginBottom={2}>
        <text fg="#FFCC00" bold>
          TUI Generative Art
        </text>
      </box>

      <box marginBottom={1}>
        <text fg="#888888">Select an experiment:</text>
      </box>

      <box flexDirection="column" marginLeft={2}>
        <box marginBottom={1}>
          <text fg="#FFFFFF">[1] </text>
          <text fg="#00AAFF">Fractal Explorer</text>
          <text fg="#666666"> - Mandelbrot & Julia sets</text>
        </box>

        <box marginBottom={1}>
          <text fg="#FFFFFF">[2] </text>
          <text fg="#00FF00">Game of Life</text>
          <text fg="#666666"> - Conway's cellular automaton</text>
        </box>

        <box marginBottom={1}>
          <text fg="#FFFFFF">[3] </text>
          <text fg="#FF6600">Flow Field</text>
          <text fg="#666666"> - Simplex noise visualization</text>
        </box>
      </box>

      <box marginTop={2}>
        <text fg="#666666">[Q] Quit</text>
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

      {experiment === "fractal" && (
        <FractalExplorer
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onBack={goToMenu}
        />
      )}

      {experiment === "life" && (
        <GameOfLife
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onBack={goToMenu}
        />
      )}

      {experiment === "flow" && (
        <FlowField
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
