/**
 * Marquee Experiment
 * News ticker / scrolling banner with large block letters
 */

import { useState, useMemo, useEffect } from "react";
import { useKeyboard } from "@opentui/react";
import { ExperimentFrame, Slider } from "../../components";

interface MarqueeProps {
  width?: number;
  height?: number;
  onBack?: () => void;
}

type FocusedSlider = "speed" | null;

// 5x5 block letter font (each letter is 5 chars wide, 5 rows tall)
const FONT: Record<string, string[]> = {
  A: [
    " ### ",
    "#   #",
    "#####",
    "#   #",
    "#   #",
  ],
  B: [
    "#### ",
    "#   #",
    "#### ",
    "#   #",
    "#### ",
  ],
  C: [
    " ####",
    "#    ",
    "#    ",
    "#    ",
    " ####",
  ],
  D: [
    "#### ",
    "#   #",
    "#   #",
    "#   #",
    "#### ",
  ],
  E: [
    "#####",
    "#    ",
    "###  ",
    "#    ",
    "#####",
  ],
  F: [
    "#####",
    "#    ",
    "###  ",
    "#    ",
    "#    ",
  ],
  G: [
    " ####",
    "#    ",
    "#  ##",
    "#   #",
    " ### ",
  ],
  H: [
    "#   #",
    "#   #",
    "#####",
    "#   #",
    "#   #",
  ],
  I: [
    "#####",
    "  #  ",
    "  #  ",
    "  #  ",
    "#####",
  ],
  J: [
    "#####",
    "   # ",
    "   # ",
    "#  # ",
    " ##  ",
  ],
  K: [
    "#   #",
    "#  # ",
    "###  ",
    "#  # ",
    "#   #",
  ],
  L: [
    "#    ",
    "#    ",
    "#    ",
    "#    ",
    "#####",
  ],
  M: [
    "#   #",
    "## ##",
    "# # #",
    "#   #",
    "#   #",
  ],
  N: [
    "#   #",
    "##  #",
    "# # #",
    "#  ##",
    "#   #",
  ],
  O: [
    " ### ",
    "#   #",
    "#   #",
    "#   #",
    " ### ",
  ],
  P: [
    "#### ",
    "#   #",
    "#### ",
    "#    ",
    "#    ",
  ],
  Q: [
    " ### ",
    "#   #",
    "#   #",
    "#  # ",
    " ## #",
  ],
  R: [
    "#### ",
    "#   #",
    "#### ",
    "#  # ",
    "#   #",
  ],
  S: [
    " ####",
    "#    ",
    " ### ",
    "    #",
    "#### ",
  ],
  T: [
    "#####",
    "  #  ",
    "  #  ",
    "  #  ",
    "  #  ",
  ],
  U: [
    "#   #",
    "#   #",
    "#   #",
    "#   #",
    " ### ",
  ],
  V: [
    "#   #",
    "#   #",
    "#   #",
    " # # ",
    "  #  ",
  ],
  W: [
    "#   #",
    "#   #",
    "# # #",
    "## ##",
    "#   #",
  ],
  X: [
    "#   #",
    " # # ",
    "  #  ",
    " # # ",
    "#   #",
  ],
  Y: [
    "#   #",
    " # # ",
    "  #  ",
    "  #  ",
    "  #  ",
  ],
  Z: [
    "#####",
    "   # ",
    "  #  ",
    " #   ",
    "#####",
  ],
  " ": [
    "     ",
    "     ",
    "     ",
    "     ",
    "     ",
  ],
  "!": [
    "  #  ",
    "  #  ",
    "  #  ",
    "     ",
    "  #  ",
  ],
  ".": [
    "     ",
    "     ",
    "     ",
    "     ",
    "  #  ",
  ],
  ":": [
    "     ",
    "  #  ",
    "     ",
    "  #  ",
    "     ",
  ],
  "?": [
    " ### ",
    "#   #",
    "  ## ",
    "     ",
    "  #  ",
  ],
  "0": [
    " ### ",
    "#  ##",
    "# # #",
    "##  #",
    " ### ",
  ],
  "1": [
    " ##  ",
    "  #  ",
    "  #  ",
    "  #  ",
    "#####",
  ],
  "2": [
    " ### ",
    "#   #",
    "  ## ",
    " #   ",
    "#####",
  ],
  "3": [
    "#####",
    "   # ",
    "  ## ",
    "    #",
    "#### ",
  ],
  "4": [
    "#   #",
    "#   #",
    "#####",
    "    #",
    "    #",
  ],
  "5": [
    "#####",
    "#    ",
    "#### ",
    "    #",
    "#### ",
  ],
  "6": [
    " ### ",
    "#    ",
    "#### ",
    "#   #",
    " ### ",
  ],
  "7": [
    "#####",
    "    #",
    "   # ",
    "  #  ",
    "  #  ",
  ],
  "8": [
    " ### ",
    "#   #",
    " ### ",
    "#   #",
    " ### ",
  ],
  "9": [
    " ### ",
    "#   #",
    " ####",
    "    #",
    " ### ",
  ],
};

const LETTER_WIDTH = 5;
const LETTER_HEIGHT = 5;
const LETTER_SPACING = 1;

// Preset messages
const MESSAGES = [
  "BREAKING NEWS: MATT IS BAD AT JAVASCRIPT",
  "HELLO WORLD",
  "LIVE UPDATE",
  "GENERATIVE ART",
  "TUI ROCKS",
];

// Color palettes
const PALETTES = {
  amber: ["#3d2800", "#5c3d00", "#7a5200", "#996600", "#b87a00", "#d68f00", "#f5a300", "#ffb700"],
  green: ["#002200", "#003300", "#004400", "#005500", "#006600", "#007700", "#008800", "#00aa00"],
  blue: ["#001133", "#001a4d", "#002266", "#002b80", "#003399", "#003db3", "#0047cc", "#0052e6"],
  red: ["#330000", "#4d0000", "#660000", "#800000", "#990000", "#b30000", "#cc0000", "#e60000"],
  white: ["#222", "#333", "#444", "#666", "#888", "#aaa", "#ccc", "#fff"],
};

type PaletteKey = keyof typeof PALETTES;
const PALETTE_KEYS: PaletteKey[] = ["amber", "green", "blue", "red", "white"];

// Render text to a 2D grid of characters
function renderText(text: string): string[] {
  const rows: string[] = ["", "", "", "", ""];
  
  for (const char of text.toUpperCase()) {
    const letter = FONT[char] ?? FONT[" "]!;
    for (let row = 0; row < LETTER_HEIGHT; row++) {
      rows[row] += letter[row] + " ".repeat(LETTER_SPACING);
    }
  }
  
  return rows;
}

export function Marquee({
  width = 80,
  height = 24,
  onBack,
}: MarqueeProps) {
  const [speed, setSpeed] = useState(50);
  const [offset, setOffset] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [focusedSlider, setFocusedSlider] = useState<FocusedSlider>("speed");

  const message = MESSAGES[messageIndex] ?? "HELLO";
  const renderedText = useMemo(() => renderText(message), [message]);
  const textWidth = renderedText[0]?.length ?? 0;
  const palette = PALETTES[PALETTE_KEYS[paletteIndex] ?? "amber"];

  // Animation loop
  useEffect(() => {
    if (!playing) return;

    const frameTime = 50;
    const increment = speed / 50;

    const interval = setInterval(() => {
      setOffset((o) => {
        const newOffset = o + increment;
        // Reset when text has fully scrolled through
        if (newOffset > textWidth + width) {
          return 0;
        }
        return newOffset;
      });
    }, frameTime);

    return () => clearInterval(interval);
  }, [playing, speed, textWidth, width]);

  useKeyboard((key) => {
    if (key.name === "escape" || key.name === "backspace") {
      onBack?.();
      return;
    }

    if (key.name === "space") setPlaying((p) => !p);
    if (key.name === "m") {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
      setOffset(0);
    }
    if (key.name === "c") {
      setPaletteIndex((i) => (i + 1) % PALETTE_KEYS.length);
    }

    if (key.name === "left" || key.name === "right") {
      const delta = key.name === "right" ? 1 : -1;
      if (focusedSlider === "speed") {
        setSpeed((s) => Math.max(10, Math.min(200, s + delta * 10)));
      }
    }
  });

  // Render the marquee banner
  const bannerElements = useMemo(() => {
    const rows: JSX.Element[] = [];
    
    // Calculate vertical centering
    const bannerHeight = LETTER_HEIGHT + 4; // letters + padding + borders
    const topPadding = Math.floor((height - bannerHeight) / 2);
    
    // Add top spacing
    for (let i = 0; i < topPadding; i++) {
      rows.push(<box key={`top-${i}`}><text> </text></box>);
    }
    
    // Top border
    rows.push(
      <box key="border-top">
        <text fg={palette[3]}>{"=".repeat(width)}</text>
      </box>
    );
    
    // Empty row above text
    rows.push(
      <box key="pad-top">
        <text fg={palette[1]}>{" ".repeat(width)}</text>
      </box>
    );
    
    // Render each row of the large text
    for (let row = 0; row < LETTER_HEIGHT; row++) {
      const textRow = renderedText[row] ?? "";
      const segments: { text: string; color: string }[] = [];
      
      let currentText = "";
      let currentColorIdx = -1;
      
      for (let x = 0; x < width; x++) {
        // Calculate position in the scrolling text
        const textX = Math.floor(x + offset - width);
        
        let char = " ";
        let colorIdx = 0;
        
        if (textX >= 0 && textX < textRow.length) {
          const sourceChar = textRow[textX];
          if (sourceChar === "#") {
            char = "\u2588"; // Full block character
            // Use brightest color from palette
            colorIdx = palette.length - 1;
          }
        }
        
        if (colorIdx === currentColorIdx) {
          currentText += char;
        } else {
          if (currentText) {
            segments.push({ text: currentText, color: palette[currentColorIdx] ?? palette[0]! });
          }
          currentText = char;
          currentColorIdx = colorIdx;
        }
      }
      
      if (currentText) {
        segments.push({ text: currentText, color: palette[currentColorIdx] ?? palette[0]! });
      }
      
      rows.push(
        <box key={`text-${row}`} flexDirection="row">
          {segments.map((seg, i) => (
            <text key={i} fg={seg.color}>{seg.text}</text>
          ))}
        </box>
      );
    }
    
    // Empty row below text
    rows.push(
      <box key="pad-bottom">
        <text fg={palette[1]}>{" ".repeat(width)}</text>
      </box>
    );
    
    // Bottom border
    rows.push(
      <box key="border-bottom">
        <text fg={palette[3]}>{"=".repeat(width)}</text>
      </box>
    );
    
    // Add bottom spacing
    const bottomPadding = height - topPadding - bannerHeight;
    for (let i = 0; i < bottomPadding; i++) {
      rows.push(<box key={`bottom-${i}`}><text> </text></box>);
    }
    
    return rows;
  }, [width, height, offset, renderedText, palette]);

  const sidebar = (
    <>
      <text fg="#FFCC00" marginBottom={1}>Marquee</text>

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

      <box marginTop={1} flexDirection="column">
        <text fg="#888">[M] Message</text>
        <text fg="#555" marginLeft={2}>{message}</text>
        <text fg="#888" marginTop={1}>[C] {PALETTE_KEYS[paletteIndex]}</text>
      </box>
    </>
  );

  const footer = (
    <>
      <text fg="#666">[Space] {playing ? "Pause" : "Play"}</text>
      <text fg="#666" marginLeft={2}>[M] Next Message</text>
      <text fg="#666" marginLeft={2}>[C] Color</text>
      <text fg="#666" marginLeft={2}>[Arrows] Speed</text>
      <text fg="#666" marginLeft={2}>[Esc] Back</text>
    </>
  );

  return (
    <ExperimentFrame title="Marquee" sidebar={sidebar} footer={footer}>
      <box flexDirection="column" overflow="hidden">
        {bannerElements}
      </box>
    </ExperimentFrame>
  );
}
