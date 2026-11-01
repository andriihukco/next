import type { useBottomSheet } from "./ui/use-bottom-sheet";

type BottomSheet = ReturnType<typeof useBottomSheet>;

/** Drag handle for the mobile bottom sheet. Arrow keys and Enter move between detents. */
export function SheetHandle({ sheet }: { sheet: BottomSheet }) {
  return (
    <button
      type="button"
      className="sheet-handle"
      aria-label={sheet.detent === "full" ? "Згорнути панель" : "Розгорнути панель"}
      aria-expanded={sheet.detent === "full"}
      {...sheet.handleProps}
      onClick={(event) => {
        // Pointer taps are handled in onPointerUp; this is the keyboard path.
        if (event.detail === 0) sheet.setDetent(sheet.detent === "full" ? "half" : "full");
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          sheet.setDetent(sheet.detent === "peek" ? "half" : "full");
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          sheet.setDetent(sheet.detent === "full" ? "half" : "peek");
        }
      }}
    >
      <span aria-hidden="true" />
    </button>
  );
}
