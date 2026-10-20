import type { Transition } from "motion/react";

// Spring presets from DESIGN.md §8. Springs are interruptible: they start
// from the on-screen value and carry velocity when re-targeted.
// `visualDuration` maps to Apple's "response"; `bounce` 0 is critically damped.
export const spring = {
  /** Default for anything that enters, moves, or changes state. */
  default: { type: "spring", bounce: 0, visualDuration: 0.32 },
  /** Small state changes: selection, progress, toggles. */
  state: { type: "spring", bounce: 0, visualDuration: 0.2 },
  /** Released after a drag or flick: a little overshoot, because the gesture carried momentum. */
  momentum: { type: "spring", bounce: 0.18, visualDuration: 0.3 },
} as const satisfies Record<string, Transition>;

/** Exit motion uses ease-in at panel duration (DESIGN.md §8). */
export const exitTransition: Transition = {
  duration: 0.2,
  ease: [0.4, 0, 1, 1],
};

/**
 * Where a flick would come to rest, using exponential deceleration
 * (the same projection iOS scroll views use).
 */
export function projectMomentum(
  velocityPxPerSecond: number,
  decelerationRate = 0.998,
): number {
  return ((velocityPxPerSecond / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Progressive resistance past a boundary instead of a hard stop. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** The snap point nearest to `value`. */
export function nearest(value: number, points: readonly number[]): number {
  return points.reduce((best, point) =>
    Math.abs(point - value) < Math.abs(best - value) ? point : best,
  );
}
