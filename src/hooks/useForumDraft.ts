import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 500;

type UseForumDraftResult<T> = {
  /** Current draft value. Starts as `emptyValue` until the stored draft loads. */
  draft: T;
  /** Update the draft; schedules a debounced write to storage. */
  setDraft: (updater: T | ((prev: T) => T)) => void;
  /** Clear the draft from state and storage (call after a successful submit). */
  clearDraft: () => void;
  /** True once the stored draft has been read (or confirmed absent). */
  hydrated: boolean;
};

/**
 * Persist a composer draft to AsyncStorage, keyed by `key`. Writes are debounced
 * while typing and flushed immediately on unmount so navigating away does not
 * lose an unsent draft. Empty drafts (per `isEmpty`) are removed rather than
 * stored, so a cleared composer leaves no stale draft behind.
 */
export function useForumDraft<T>(
  key: string,
  emptyValue: T,
  isEmpty: (value: T) => boolean,
): UseForumDraftResult<T> {
  const [draft, setDraftState] = useState<T>(emptyValue);
  const [hydrated, setHydrated] = useState(false);

  const keyRef = useRef(key);
  keyRef.current = key;
  const isEmptyRef = useRef(isEmpty);
  isEmptyRef.current = isEmpty;
  const latestRef = useRef<T>(emptyValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const writeNow = useCallback((value: T) => {
    const storageKey = keyRef.current;
    if (isEmptyRef.current(value)) {
      void AsyncStorage.removeItem(storageKey);
    } else {
      void AsyncStorage.setItem(storageKey, JSON.stringify(value));
    }
  }, []);

  // Load the stored draft whenever the key changes.
  useEffect(() => {
    let active = true;
    setHydrated(false);
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!active) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as T;
            latestRef.current = parsed;
            setDraftState(parsed);
          } catch {
            latestRef.current = emptyValue;
            setDraftState(emptyValue);
          }
        } else {
          latestRef.current = emptyValue;
          setDraftState(emptyValue);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
    // emptyValue is a stable constant per call site; intentionally keyed on `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setDraft = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setDraftState((prev) => {
        const next =
          typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
        latestRef.current = next;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => writeNow(next), DEBOUNCE_MS);
        return next;
      });
    },
    [writeNow],
  );

  const clearDraft = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    latestRef.current = emptyValue;
    setDraftState(emptyValue);
    void AsyncStorage.removeItem(keyRef.current);
    // emptyValue is stable per call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flush a pending debounced write immediately on unmount so navigating away
  // mid-draft does not lose it.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        writeNow(latestRef.current);
      }
    };
  }, [writeNow]);

  return { draft, setDraft, clearDraft, hydrated };
}
