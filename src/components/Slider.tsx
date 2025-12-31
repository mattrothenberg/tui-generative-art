/**
 * Slider Component
 *
 * A focusable range input control for TUI applications.
 * Renders a visual track using Unicode block characters:
 * - Filled portion: █ (full block)
 * - Empty portion: ░ (light shade)
 *
 * Highlights in yellow when focused for visual feedback.
 */

import { memo, useMemo } from "react";

interface SliderProps {
  /** Label text shown above the slider */
  label: string;
  /** Current value */
  value: number;
  /** Minimum value (default: 0) */
  min?: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Step increment (default: 5) */
  step?: number;
  /** Track width in characters (default: 20) */
  width?: number;
  /** Whether this slider is currently focused */
  focused?: boolean;
  /** Optional value formatter (e.g., adding "%" suffix) */
  formatValue?: (value: number) => string;
  /** Change handler (called when value changes) */
  onChange: (value: number) => void;
}

/**
 * Memoized slider component for performance.
 * Only re-renders when props change.
 */
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
  // Calculate filled and empty portions of the track
  const { filledTrack, emptyTrack } = useMemo(() => {
    const position = (value - min) / (max - min);
    const handlePos = Math.round(position * width);

    return {
      filledTrack: "\u2588".repeat(handlePos),    // █
      emptyTrack: "\u2591".repeat(width - handlePos), // ░
    };
  }, [value, min, max, width]);

  // Format display value
  const displayValue = formatValue ? formatValue(value) : String(value);
  
  // Color scheme based on focus state
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
