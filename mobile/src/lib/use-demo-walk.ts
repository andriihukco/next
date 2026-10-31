import { useCallback, useEffect, useRef, useState } from "react";

const FRAME_MS = 1000 / 30; // Map updates at 30 fps; enough for a walking pace.

/**
 * Advances progress 0 → 1 over `durationMs`, like a walk along the track.
 * Pausing lets the user scrub; resuming continues from the current value.
 */
export function useDemoWalk(durationMs: number) {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const progressRef = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      if (now - last >= FRAME_MS) {
        last = now;
        const next = Math.min(progressRef.current + FRAME_MS / durationMs, 1);
        progressRef.current = next;
        setProgress(next);
        if (next >= 1) {
          setPlaying(false);
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, durationMs]);

  const seek = useCallback((value: number) => {
    const clamped = Math.min(Math.max(value, 0), 1);
    progressRef.current = clamped;
    setProgress(clamped);
  }, []);

  const pause = useCallback(() => setPlaying(false), []);

  return { progress, seek, pause, finished: progress >= 1 };
}
