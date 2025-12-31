/**
 * ExperimentFrame Component
 *
 * A reusable layout wrapper for all generative art experiments.
 * Provides a consistent structure with:
 * - Header with experiment title
 * - Main canvas area (bordered)
 * - Optional sidebar for controls (28 chars wide)
 * - Optional footer for keyboard hints
 */

import type { ReactNode } from "react";

interface ExperimentFrameProps {
  /** The main visualization content */
  children: ReactNode;
  /** Experiment title shown in the header */
  title: string;
  /** Optional control panel content */
  sidebar?: ReactNode;
  /** Optional footer content (typically keyboard hints) */
  footer?: ReactNode;
}

export function ExperimentFrame({ children, title, sidebar, footer }: ExperimentFrameProps) {
  return (
    <box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <box flexDirection="row" marginBottom={1}>
        <text fg="#FFCC00">{title}</text>
      </box>

      {/* Main content area with optional sidebar */}
      <box flexDirection="row" flexGrow={1}>
        {/* Canvas area - bordered box for the visualization */}
        <box
          flexDirection="column"
          flexGrow={1}
          borderStyle="rounded"
          borderColor="#444444"
          padding={1}
          justifyContent="center"
          alignItems="center"
        >
          {children}
        </box>

        {/* Sidebar - fixed width control panel */}
        {sidebar && (
          <box
            flexDirection="column"
            width={28}
            marginLeft={1}
            borderStyle="rounded"
            borderColor="#444444"
            padding={1}
          >
            {sidebar}
          </box>
        )}
      </box>

      {/* Footer - keyboard hints */}
      {footer && (
        <box marginTop={1} flexDirection="row">
          {footer}
        </box>
      )}
    </box>
  );
}
