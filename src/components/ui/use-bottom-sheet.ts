import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { animate, useMotionValue, type MotionValue } from "motion/react";
import { nearest, projectMomentum, rubberband, spring } from "../../lib/motion";

export type SheetDetent = "peek" | "half" | "full";

const PEEK_HEIGHT = 152;
const HALF_RATIO = 0.55;
const DRAG_THRESHOLD = 6;

type Sample = { y: number; t: number };

/**
 * Drag behavior for a mobile bottom sheet (DESIGN.md §5, §8).
 * - Tracks the pointer 1:1 from where it was grabbed.
 * - Resists past the top and bottom detents instead of stopping hard.
 * - On release, projects the flick's momentum and settles on the nearest
 *   detent with a spring that starts at the finger's velocity.
 * - Grabbing a moving sheet stops it where it is (springs are interruptible).
 */
export function useBottomSheet({ enabled, sheetHeight }: { enabled: boolean; sheetHeight: number }): {
  y: MotionValue<number>;
  detent: SheetDetent;
  /** Bottom padding that keeps the end of the scroll content above the screen edge. */
  hiddenHeight: number;
  setDetent: (detent: SheetDetent) => void;
  handleProps: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  };
} {
  const y = useMotionValue(0);
  const [detent, setDetentState] = useState<SheetDetent>("half");
  const [hiddenHeight, setHiddenHeight] = useState(0);
  const drag = useRef<{ startY: number; origin: number; samples: Sample[]; moved: boolean } | null>(null);

  const offsets = useCallback((): Record<SheetDetent, number> => {
    const viewport = window.innerHeight;
    return {
      full: 0,
      half: Math.max(0, sheetHeight - Math.round(viewport * HALF_RATIO)),
      peek: Math.max(0, sheetHeight - PEEK_HEIGHT),
    };
  }, [sheetHeight]);

  const settle = useCallback(
    (target: SheetDetent, velocity = 0) => {
      const to = offsets()[target];
      setDetentState(target);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // A flick carried momentum, so it may overshoot a little; a tap does not.
      const transition = reduced
        ? { duration: 0 }
        : { ...(Math.abs(velocity) > 200 ? spring.momentum : spring.default), velocity };
      void animate(y, to, transition).then(() => setHiddenHeight(to));
    },
    [offsets, y],
  );

  useEffect(() => {
    if (!enabled) {
      y.stop();
      y.set(0);
      setHiddenHeight(0);
      return;
    }
    const to = offsets()[detent];
    y.set(to);
    setHiddenHeight(to);
    // Re-snap only when the sheet or viewport size changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sheetHeight]);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>): void => {
    if (!enabled || (event.pointerType === "mouse" && event.button !== 0)) return;
    y.stop();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      startY: event.clientY,
      origin: y.get(),
      samples: [{ y: event.clientY, t: event.timeStamp }],
      moved: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>): void => {
    const state = drag.current;
    if (!state) return;
    const delta = event.clientY - state.startY;
    if (!state.moved && Math.abs(delta) < DRAG_THRESHOLD) return;
    state.moved = true;
    const { full, peek } = offsets();
    const raw = state.origin + delta;
    const next =
      raw < full
        ? full - rubberband(full - raw, sheetHeight)
        : raw > peek
          ? peek + rubberband(raw - peek, sheetHeight)
          : raw;
    y.set(next);
    state.samples.push({ y: event.clientY, t: event.timeStamp });
    if (state.samples.length > 5) state.samples.shift();
  };

  const finish = (event: ReactPointerEvent<HTMLElement>, cancelled: boolean): void => {
    const state = drag.current;
    drag.current = null;
    if (!state) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!state.moved) {
      // A tap on the handle cycles detents, the same as Enter on the button.
      if (!cancelled) settle(detent === "full" ? "half" : detent === "half" ? "full" : "half");
      return;
    }
    const first = state.samples[0];
    const last = state.samples[state.samples.length - 1];
    const elapsed = Math.max(1, last.t - first.t);
    const velocity = ((last.y - first.y) / elapsed) * 1000;
    const points = offsets();
    const projected = y.get() + projectMomentum(velocity);
    const targetOffset = nearest(projected, [points.full, points.half, points.peek]);
    const target = (Object.keys(points) as SheetDetent[]).find((key) => points[key] === targetOffset) ?? "half";
    settle(target, velocity);
  };

  return {
    y,
    detent,
    hiddenHeight,
    setDetent: (next) => settle(next),
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event) => finish(event, false),
      onPointerCancel: (event) => finish(event, true),
    },
  };
}
