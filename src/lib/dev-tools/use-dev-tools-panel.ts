import { useCallback, useEffect, useRef, useState } from "react";
import type { DevToolsDragState } from "../../types/ui";

/**
 * @file use-dev-tools-panel.ts
 * @description Owns the developer panel shell: visibility, active tab, the
 * draggable floating button position and the global keyboard shortcuts.
 */

export type DevToolsTab = "fixtures" | "runtime" | "diagnostics" | "admin";

const POSITION_KEY = "un.dev-tools.position";
/** Distance kept between the button and the viewport edges. */
const EDGE = 8;
/** Size of the floating button in pixels. */
const FAB_SIZE = 52;

type Position = { x: number; y: number };

function readPosition(): Position {
  const fallback: Position = {
    x: Math.max(EDGE, window.innerWidth - FAB_SIZE - 16),
    y: 20,
  };
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Position>;
    if (
      typeof parsed.x !== "number" ||
      typeof parsed.y !== "number" ||
      !Number.isFinite(parsed.x) ||
      !Number.isFinite(parsed.y)
    ) {
      return fallback;
    }
    return clamp({ x: parsed.x, y: parsed.y });
  } catch (error) {
    console.error("Could not read the saved developer panel position.", error);
    return fallback;
  }
}

function clamp(position: Position): Position {
  return {
    x: Math.max(EDGE, Math.min(window.innerWidth - FAB_SIZE - EDGE, position.x)),
    y: Math.max(EDGE, Math.min(window.innerHeight - FAB_SIZE - EDGE, position.y)),
  };
}

function persistPosition(position: Position): void {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify(position));
  } catch (error) {
    console.error("Could not save the developer panel position.", error);
  }
}

export function useDevToolsPanel(active: boolean) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<DevToolsTab>("fixtures");
  const [position, setPosition] = useState<Position>(readPosition);
  const dragRef = useRef<DevToolsDragState | null>(null);
  const suppressClickRef = useRef(false);

  // Leaving the `/dev` route always closes the panel.
  useEffect(() => {
    if (!active) setOpen(false);
  }, [active]);

  useEffect(() => {
    persistPosition(position);
  }, [position]);

  // Keep the button reachable after a viewport resize.
  useEffect(() => {
    const keepInViewport = (): void => {
      setPosition((current) => clamp(current));
    };
    window.addEventListener("resize", keepInViewport);
    return () => window.removeEventListener("resize", keepInViewport);
  }, []);

  // Global shortcut: Ctrl/Cmd + Shift + D toggles the panel, Escape closes it.
  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "d"
      ) {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active]);

  const toggle = useCallback(() => setOpen((current) => !current), []);
  const close = useCallback(() => setOpen(false), []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        left: position.x,
        top: position.y,
        moved: false,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [position.x, position.y],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;
      const moved = drag.moved || Math.hypot(deltaX, deltaY) > 4;
      if (moved) {
        suppressClickRef.current = true;
        setPosition(
          clamp({ x: drag.left + deltaX, y: drag.top + deltaY }),
        );
      }
      dragRef.current = { ...drag, moved };
    },
    [],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  const onClick = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    toggle();
  }, [toggle]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const step = event.shiftKey ? 24 : 8;
      const movement: Record<string, [number, number]> = {
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
      };
      const delta = movement[event.key];
      if (!delta) return;
      event.preventDefault();
      setPosition((current) =>
        clamp({ x: current.x + delta[0], y: current.y + delta[1] }),
      );
    },
    [],
  );

  const resetPosition = useCallback(() => {
    setPosition({
      x: Math.max(EDGE, window.innerWidth - FAB_SIZE - 16),
      y: 20,
    });
  }, []);

  return {
    open,
    tab,
    position,
    setTab,
    toggle,
    close,
    resetPosition,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onKeyDown,
      onClick,
    },
  };
}
