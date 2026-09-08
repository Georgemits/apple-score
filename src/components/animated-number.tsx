"use client";

import * as React from "react";
import { animate, useReducedMotion } from "framer-motion";
import { formatNumber } from "@/lib/utils";

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  className?: string;
};

/** Counts from the previous value to the next one whenever `value` changes. */
export function AnimatedNumber({ value, duration = 0.9, className }: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = React.useState(value);
  const previous = React.useRef(value);

  React.useEffect(() => {
    if (reduceMotion) {
      previous.current = value;
      setDisplay(value);
      return;
    }

    const controls = animate(previous.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
      onComplete: () => setDisplay(value),
    });

    previous.current = value;
    return () => controls.stop();
  }, [value, duration, reduceMotion]);

  return (
    <span className={className} aria-label={formatNumber(value)}>
      <span aria-hidden="true">{formatNumber(display)}</span>
    </span>
  );
}
