import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal focus handling: moves focus into the dialog, keeps Tab inside it,
 * closes on Escape, and returns focus to the element that opened it.
 * `focusKey` re-focuses when the dialog's content changes. When content
 * cross-fades, the incoming part is marked `data-focus-scope={focusKey}` so the
 * outgoing copy is never focused.
 */
export function useDialogFocus(
  ref: RefObject<HTMLElement | null>,
  { onEscape, focusKey }: { onEscape: () => void; focusKey?: unknown },
): void {
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const focusable = (): HTMLElement[] =>
      Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => !element.closest("[inert]"),
      );
    const frame = window.requestAnimationFrame(() => {
      const scope =
        (focusKey !== undefined &&
          dialog.querySelector<HTMLElement>(`[data-focus-scope="${String(focusKey)}"]`)) ||
        dialog;
      const preferred = scope.querySelector<HTMLElement>("[data-autofocus]");
      const first = scope.querySelector<HTMLElement>(FOCUSABLE);
      (preferred ?? first)?.focus({ preventScroll: true });
    });
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscapeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [ref, focusKey]);
}
