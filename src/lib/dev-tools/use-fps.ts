import { useEffect, useState } from "react";

/**
 * @file use-fps.ts
 * @description Lightweight frames-per-second meter used by the stress test.
 */

export function useFps(enabled: boolean): number {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setFps(0);
      return;
    }
    let frame = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number): void => {
      frame += 1;
      if (now - last >= 1000) {
        setFps(Math.round((frame * 1000) / (now - last)));
        frame = 0;
        last = now;
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [enabled]);

  return fps;
}
