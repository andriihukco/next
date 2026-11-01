import { useLayoutEffect, useRef, type RefObject } from "react";

/** Keeps the latest value in a ref so long-lived map listeners never read stale state. */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
