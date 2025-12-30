/**
 * TUI Generative Art - Entry Point
 *
 * Interactive generative art experiments for your terminal.
 * Run with: bun start
 */

import { useState } from "react";
import { createCliRenderer } from "@opentui/core";
import { createRoot, useKeyboard } from "@opentui/react";
import { FlowField, Plasma } from "./experiments";

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
});

type Experiment = "menu" | "flow" | "plasma";

// Canvas dimensions (10:3 aspect ratio)
const CANVAS_WIDTH = 100;
const CANVAS_HEIGHT = 30;

function Menu({ onSelect }: { onSelect: (exp: Experiment) => void }) {
  useKeyboard((key) => {
    if (key.raw === "1") onSelect("flow");
    if (key.raw === "2") onSelect("plasma");
    if (key.name === "q") renderer.destroy();
  });

  return (
    <box flexDirection="column" padding={2}>
      <box marginBottom={2}>
        <text fg="#FFCC00">TUI Generative Art</text>
      </box>

      <box marginBottom={1}>
        <text fg="#888888">Select an experiment:</text>
      </box>

      <box flexDirection="column" marginLeft={2}>
        <box marginBottom={1}>
          <text fg="#FFFFFF">[1] </text>
          <text fg="#FF6600">Flow Field</text>
          <text fg="#666666"> - Simplex noise visualization</text>
        </box>

        <box marginBottom={1}>
          <text fg="#FFFFFF">[2] </text>
          <text fg="#FF00FF">Plasma</text>
          <text fg="#666666"> - Classic demoscene effect</text>
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
    </box>
  );
}

// @ts-ignore
createRoot(renderer).render(<App />);
