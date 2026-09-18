"use client";

import * as React from "react";

/** Same-tab change notification (the native `storage` event only fires in *other* tabs). */
const SYNC_EVENT = "nirvona:storage-sync";

/**
 * Persisted state that degrades gracefully when storage is unavailable.
 *
 * Every component calling this with the same key stays in sync - within
 * the tab via SYNC_EVENT, across tabs via the native `storage` event.
 * Previously each instance read storage once on mount and never again,
 * so e.g. saving a new name in the profile page left the portal header
 * (its own instance) showing the old one, and signing in on one page
 * left an already-mounted navbar still showing "Login".
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = React.useState<T>(initial);
  const [hydrated, setHydrated] = React.useState(false);
  // The raw string this instance last knew about - lets sync handlers
  // ignore the echo of their own writes.
  const lastRaw = React.useRef<string | null>(null);

  // Reading persisted state has to happen after mount: doing it in the state
  // initialiser would make the server and client render different markup.
  // This is the "subscribe to an external system" case the rule allows for.
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      lastRaw.current = raw;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      /* private mode or blocked storage — keep the initial value */
    }
    setHydrated(true);
  }, [key]);

  React.useEffect(() => {
    const sync = (event: Event) => {
      if (event instanceof StorageEvent) {
        if (event.key !== null && event.key !== key) return;
      } else if ((event as CustomEvent<{ key: string }>).detail?.key !== key) {
        return;
      }
      try {
        const raw = window.localStorage.getItem(key);
        if (raw === lastRaw.current) return;
        lastRaw.current = raw;
        setValue(raw ? (JSON.parse(raw) as T) : initial);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", sync);
    window.addEventListener(SYNC_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SYNC_EVENT, sync);
    };
    // `initial` is only the fallback for "cleared elsewhere"; it is a
    // constant for every caller, so it is deliberately not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const notify = React.useCallback(() => {
    // Deferred: dispatching from inside a state updater would make other
    // components set state while this one is still rendering.
    queueMicrotask(() =>
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key } })),
    );
  }, [key]);

  const update = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          const raw = JSON.stringify(resolved);
          window.localStorage.setItem(key, raw);
          lastRaw.current = raw;
          notify();
        } catch {
          /* ignore */
        }
        return resolved;
      });
    },
    [key, notify],
  );

  const clear = React.useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      lastRaw.current = null;
      notify();
    } catch {
      /* ignore */
    }
    setValue(initial);
  }, [key, initial, notify]);

  return { value, setValue: update, clear, hydrated };
}
