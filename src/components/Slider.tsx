/**
 * Slider Component
 * A focusable range input for TUI
 */

import { memo, useMemo } from "react";

interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  width?: number;
  focused?: boolean;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}

export const Slider = memo(function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 5,
  width = 20,
  focused = false,
  formatValue,
  onChange,
}: SliderProps) {
  const { filledTrack, emptyTrack } = useMemo(() => {
    const position = (value - min) / (max - min);
    const handlePos = Math.round(position * width);

    return {
      filledTrack: "\u2588".repeat(handlePos),
      emptyTrack: "\u2591".repeat(width - handlePos),
    };
  }, [value, min, max, width]);

  const displayValue = formatValue ? formatValue(value) : String(value);
  const accentColor = focused ? "#FFCC00" : "#888888";
  const dimColor = focused ? "#555555" : "#333333";
  const labelColor = focused ? "#FFFFFF" : "#AAAAAA";

  return (
    <box flexDirection="column" marginBottom={1}>
      <text fg={labelColor}>{label}</text>
      <box flexDirection="row">
        {filledTrack && <text fg={accentColor}>{filledTrack}</text>}
        {emptyTrack && <text fg={dimColor}>{emptyTrack}</text>}
        <text fg="#666666" marginLeft={1}>
          {displayValue}
        </text>
      </box>
    </box>
  );
});
