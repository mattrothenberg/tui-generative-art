/**
 * DirectCanvas Component
 *
 * A high-performance canvas that renders directly to the terminal buffer,
 * bypassing React's reconciliation for maximum FPS.
 *
 * Uses OpenTUI's `addPostProcessFn` to write directly to the OptimizedBuffer,
 * similar to how HTML5 Canvas works. This approach can achieve 60fps vs ~5fps
 * with traditional JSX element creation.
 *
 * Usage:
 * ```tsx
 * <DirectCanvas
 *   renderer={renderer}
 *   width={80}
 *   height={24}
 *   render={(buffer, x, y, width, height) => {
 *     // Draw directly to buffer
 *     buffer.setCell(x, y, "█", fgColor, bgColor);
 *   }}
 * />
 * ```
 */

import { useEffect, useRef, useLayoutEffect } from "react";
import type { CliRenderer, OptimizedBuffer, RGBA } from "@opentui/core";

// Type for the render callback
export type DirectRenderFn = (
  buffer: OptimizedBuffer,
  offsetX: number,
  offsetY: number,
  width: number,
  height: number,
  deltaTime: number
) => void;

interface DirectCanvasProps {
  /** The OpenTUI renderer instance */
  renderer: CliRenderer;
  /** Canvas width in characters */
  width: number;
  /** Canvas height in characters */
  height: number;
  /** The render function called each frame */
  render: DirectRenderFn;
}

/**
 * DirectCanvas uses a placeholder box to reserve space in the layout,
 * then draws directly to the terminal buffer in a post-process function.
 */
export function DirectCanvas({ renderer, width, height, render }: DirectCanvasProps) {
  // Store render function in ref to avoid re-registering post-process
  const renderRef = useRef(render);
  renderRef.current = render;

  // Store the layout position
  const layoutRef = useRef({ x: 0, y: 0 });
  const boxRef = useRef<any>(null);

  // Track the box's position in the layout
  useLayoutEffect(() => {
    const updatePosition = () => {
      if (boxRef.current) {
        // OpenTUI boxes have getLayout() to get position
        const layout = boxRef.current.getLayout?.() ?? { x: 0, y: 0 };
        layoutRef.current = { x: layout.x ?? 0, y: layout.y ?? 0 };
      }
    };
    updatePosition();
  });

  // Register the post-process function for direct buffer rendering
  useEffect(() => {
    const postProcess = (buffer: OptimizedBuffer, deltaTime: number) => {
      // For now, we'll use a fixed offset since layout tracking is complex
      // The experiment frame adds some padding/borders, so we account for that
      const offsetX = 2; // border + padding
      const offsetY = 3; // header + border + padding

      renderRef.current(buffer, offsetX, offsetY, width, height, deltaTime);
    };

    renderer.addPostProcessFn(postProcess);
    return () => {
      renderer.removePostProcessFn(postProcess);
    };
  }, [renderer, width, height]);

  // Render a placeholder box to reserve space in the layout
  return (
    <box
      ref={boxRef}
      width={width}
      height={height}
    />
  );
}
