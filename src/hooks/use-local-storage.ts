"use client";

import * as React from "react";

/** Persisted state that degrades gracefully when storage is unavailable. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = React.useState<T>(initial);
  const [hydrated, setHydrated] = React.useState(false);

  // Reading persisted state has to happen after mount: doing it in the state
  // initialiser would make the server and client render different markup.
  // This is the "subscribe to an external system" case the rule allows for.
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      /* private mode or blocked storage — keep the initial value */
    }
    setHydrated(true);
  }, [key]);

  const update = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* ignore */
        }
        return resolved;
      });
    },
    [key],
  );

  const clear = React.useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setValue(initial);
  }, [key, initial]);

  return { value, setValue: update, clear, hydrated };
}
