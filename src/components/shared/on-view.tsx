"use client";

import * as React from "react";

/**
 * Renders its children only once it is about to scroll into view.
 *
 * Wrap a below-the-fold section whose code is heavy (e.g. a charts section
 * behind React.lazy): the browser then doesn't download that code for a
 * visitor who never scrolls that far, and doesn't compete with the content
 * they are actually looking at. `minHeight` reserves the space so the page
 * doesn't jump when the section appears. `rootMargin` starts loading a bit
 * BEFORE it is visible, so it is normally ready by the time it is reached.
 */
export function OnView({
  children,
  minHeight = 480,
  rootMargin = "600px",
}: {
  children: React.ReactNode;
  minHeight?: number;
  rootMargin?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    // No IntersectionObserver (very old browsers): just show it.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  );
}
