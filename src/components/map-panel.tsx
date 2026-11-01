import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { MaterialIcon } from "./ui/material-icon";
import { exitTransition, panelMotion, scrimMotion, spring } from "../lib/motion";
import { useDialogFocus } from "../lib/use-dialog-focus";
import { useMediaQuery } from "../lib/use-media-query";
import "./map-panel.css";

const sidebarMotion = {
  initial: { x: "-100%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "-100%", opacity: 0, transition: exitTransition },
  transition: spring.default,
} as const;

type MapPanelProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * A map panel as one modal surface (DESIGN.md §5, §7): a left sidebar on desktop, a bottom sheet
 * on mobile. Escape and the scrim close it. Map popovers on mobile use this too, so no popover
 * opens on a phone.
 */
export function MapPanel({ title, onClose, children }: MapPanelProps) {
  const id = useId();
  const mobile = useMediaQuery("(max-width: 800px)");
  const panelRef = useRef<HTMLElement>(null);
  useDialogFocus(panelRef, { onEscape: onClose, focusKey: title });

  return createPortal(
    <motion.div
      className={`map-panel-overlay${mobile ? " is-sheet" : ""}`}
      {...scrimMotion}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.section
        ref={panelRef}
        className="map-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        {...(mobile ? panelMotion(true) : sidebarMotion)}
      >
        <header className="map-panel-header">
          <h2 id={`${id}-title`}>{title}</h2>
          <Button type="button" variant="ghost" size="icon" aria-label="Закрити" onClick={onClose}>
            <MaterialIcon name="close" size={20} />
          </Button>
        </header>
        <div className="map-panel-body">{children}</div>
      </motion.section>
    </motion.div>,
    document.body,
  );
}
