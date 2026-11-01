import { useLayoutEffect, useRef, useState } from "react";
import { useTransform } from "motion/react";
import { useBottomSheet } from "../components/ui/use-bottom-sheet";

/** The side rail becomes a draggable bottom sheet on mobile. Its height is measured before paint. */
export function useRailSheet(enabled: boolean) {
  const railRef = useRef<HTMLElement>(null);
  const [railHeight, setRailHeight] = useState(0);
  // Measured before paint so the sheet never flashes fully open on load.
  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    setRailHeight(rail.offsetHeight);
    const observer = new ResizeObserver(() => setRailHeight(rail.offsetHeight));
    observer.observe(rail);
    return () => observer.disconnect();
  }, []);
  const sheet = useBottomSheet({ enabled, sheetHeight: railHeight });
  const hiddenPx = useTransform(sheet.hiddenHeight, (value) => `${value}px`);
  return { railRef, sheet, hiddenPx };
}
