"use client";

import * as React from "react";

export interface AsyncResult<T> {
  data: T | undefined;
  status: "loading" | "success" | "error";
  error: Error | undefined;
  reload: () => void;
}

type State<T> =
  | { status: "loading"; data?: undefined; error?: undefined }
  | { status: "success"; data: T; error?: undefined }
  | { status: "error"; data?: undefined; error: Error };

/**
 * Minimal data-fetching hook over the service layer, so pages get real
 * loading/error/empty states without pulling in a query library.
 *
 * `deps` are serialised into a key: when it changes, the state is reset during
 * render (React's documented "adjust state when props change" pattern) rather
 * than in an effect, so there is no extra render pass showing stale data.
 */
export function useAsync<T>(
  factory: () => Promise<T>,
  deps: React.DependencyList = [],
): AsyncResult<T> {
  const key = JSON.stringify(deps);
  const [nonce, setNonce] = React.useState(0);
  const [state, setState] = React.useState<State<T>>({ status: "loading" });
  const [lastKey, setLastKey] = React.useState(key);

  if (lastKey !== key) {
    setLastKey(key);
    setState({ status: "loading" });
  }

  // Keep the latest factory without making it an effect dependency: callers
  // pass inline closures, which would otherwise refetch on every render.
  const factoryRef = React.useRef(factory);
  React.useEffect(() => {
    factoryRef.current = factory;
  });

  React.useEffect(() => {
    let cancelled = false;
    factoryRef
      .current()
      .then((result) => {
        if (!cancelled) setState({ status: "success", data: result });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            error: err instanceof Error ? err : new Error("Request failed"),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key, nonce]);

  return {
    data: state.data,
    status: state.status,
    error: state.error,
    reload: React.useCallback(() => setNonce((n) => n + 1), []),
  };
}
