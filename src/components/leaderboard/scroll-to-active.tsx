"use client";

import * as React from "react";

/**
 * Nudges the chip row so the active board is visible on phones, where eleven
 * chips do not fit. Renders nothing; runs once after mount and only scrolls
 * horizontally so the page itself never jumps.
 */
export function ScrollToActive() {
  const anchor = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const row = anchor.current?.parentElement?.querySelector<HTMLElement>("ul");
    const active = row?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!row || !active) return;
    if (row.scrollWidth <= row.clientWidth) return;

    const target = active.offsetLeft - (row.clientWidth - active.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, target), behavior: "auto" });
  }, []);

  return <span ref={anchor} hidden aria-hidden="true" />;
}
