import { useSyncExternalStore } from "react";
import type { TabId } from "./section-tabs";

/**
 * Where the bottom sheet sits and which tab is active. Pages call `requestSheet` (for example
 * «Показати на мапі» goes to `minimised`); the sheet animates to the new snap.
 * Snaps: `minimised` shows only the tab bar, `half` leaves the map most of the screen, `full` is near the top.
 */
export type SheetSnap = "minimised" | "half" | "full";

type State = { snap: SheetSnap; tab: TabId };
let state: State = { snap: "half", tab: "transport" };
const listeners = new Set<() => void>();
const sheetListeners = new Set<(snap: SheetSnap) => void>();

const emit = () => listeners.forEach((listener) => listener());

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSheetSnap(): SheetSnap {
  return state.snap;
}

/** Animates the sheet (the sheet listens) and records the snap. */
export function requestSheet(snap: SheetSnap): void {
  state = { ...state, snap };
  sheetListeners.forEach((listener) => listener(snap));
  emit();
}

/** Records a snap the user dragged to. The sheet is already there, so nothing animates. */
export function recordSheetSnap(snap: SheetSnap): void {
  if (state.snap === snap) return;
  state = { ...state, snap };
  emit();
}

export function setActiveTab(tab: TabId): void {
  if (state.tab === tab) return;
  state = { ...state, tab };
  emit();
}

export function subscribeSheetRequests(listener: (snap: SheetSnap) => void): () => void {
  sheetListeners.add(listener);
  return () => sheetListeners.delete(listener);
}

export function useSheetState(): State {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
