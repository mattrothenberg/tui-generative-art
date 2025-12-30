/**
 * ExperimentFrame Component
 * Generic frame wrapper for generative art experiments
 */

import type { ReactNode } from "react";

interface ExperimentFrameProps {
  children: ReactNode;
  title: string;
  sidebar?: ReactNode;
  footer?: ReactNode;
}

export function ExperimentFrame({ children, title, sidebar, footer }: ExperimentFrameProps) {
  return (
    <box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <box flexDirection="row" marginBottom={1}>
        <text fg="#FFCC00" bold>{title}</text>
      </box>

      {/* Main content area */}
      <box flexDirection="row" flexGrow={1}>
        {/* Canvas area */}
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

        {/* Sidebar */}
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

      {/* Footer */}
      {footer && (
        <box marginTop={1} flexDirection="row">
          {footer}
        </box>
      )}
    </box>
  );
}
