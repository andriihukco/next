import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "motion/react";
import { exitTransition, spring } from "../../lib/motion";

/** Tour spotlight: finds the step target, cuts a rounded hole in the scrim, and places the card next to it. */

export type Rect = { x: number; y: number; width: number; height: number };

export const SPOTLIGHT_PADDING = 6;
export const EDGE = 16;
export const GAP = 16;

/** Measures the live `data-tour` target and follows it while it moves. */
export function useSpotlight(target: string | null, viewKey: string): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  useEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }
    let element: HTMLElement | null = null;
    let observer: ResizeObserver | null = null;
    const update = (): void => {
      if (!element) return;
      const box = element.getBoundingClientRect();
      if (!box.width && !box.height) {
        setRect(null);
        return;
      }
      setRect({
        x: box.left - SPOTLIGHT_PADDING,
        y: box.top - SPOTLIGHT_PADDING,
        width: box.width + SPOTLIGHT_PADDING * 2,
        height: box.height + SPOTLIGHT_PADDING * 2,
      });
    };
    // Wait one frame so a view switch has mounted the target.
    const frame = window.requestAnimationFrame(() => {
      element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
      if (!element) {
        setRect(null);
        return;
      }
      element.scrollIntoView({ block: "nearest", behavior: "smooth" });
      update();
      observer = new ResizeObserver(update);
      observer.observe(element);
    });
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [target, viewKey]);
  return rect;
}

export const roundedRect = (x: number, y: number, w: number, h: number, r: number): string =>
  `M${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}` +
  `A${r},${r} 0 0 1 ${x + w - r},${y + h}H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}` +
  `V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`;

/**
 * Dims everything except the target. The cutout is an even-odd path driven by
 * springs, so it glides between targets and can be re-targeted mid-flight.
 * (SVG masks and huge box-shadows both fail to paint over the WebGL map.)
 */
export function Spotlight({ rect }: { rect: Rect }) {
  const x = useSpring(rect.x, spring.default);
  const y = useSpring(rect.y, spring.default);
  const width = useSpring(rect.width, spring.default);
  const height = useSpring(rect.height, spring.default);
  useEffect(() => {
    x.set(rect.x);
    y.set(rect.y);
    width.set(rect.width);
    height.set(rect.height);
  }, [rect, x, y, width, height]);
  const hole = useTransform(() =>
    roundedRect(x.get(), y.get(), Math.max(width.get(), 16), Math.max(height.get(), 16), 8),
  );
  const scrim = useTransform(
    () => `M0,0H${window.innerWidth}V${window.innerHeight}H0Z ${hole.get()}`,
  );
  return (
    <motion.svg
      className="onboarding-spotlight"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: exitTransition }}
      transition={{ duration: 0.2 }}
    >
      <motion.path className="onboarding-spotlight-scrim" d={scrim} fillRule="evenodd" />
      <motion.path className="onboarding-spotlight-ring" d={hole} />
    </motion.svg>
  );
}

/** Places the tour card next to the spotlight, below it when there is room. */
export function cardPosition(rect: Rect, card: { width: number; height: number }): { x: number; y: number } {
  const maxX = window.innerWidth - card.width - EDGE;
  const x = Math.max(EDGE, Math.min(rect.x, maxX));
  const below = rect.y + rect.height + GAP;
  const y =
    below + card.height <= window.innerHeight - EDGE
      ? below
      : Math.max(EDGE, rect.y - card.height - GAP);
  return { x, y };
}
