"use client";

import * as React from "react";
import { animate, useReducedMotion } from "framer-motion";
import { formatNumber, formatUSD } from "@/lib/utils";

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  className?: string;
  /** How to print the number. Defaults to a plain thousands-separated integer. */
  format?: (value: number) => string;
  /** Start from zero on first render (for hero figures) instead of snapping. */
  fromZero?: boolean;
};

/** Counts from the previous value to the next one whenever `value` changes. */
export function AnimatedNumber({
  value,
  duration = 1.1,
  className,
  format = formatNumber,
  fromZero = false,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = React.useState(fromZero ? 0 : value);
  const previous = React.useRef(fromZero ? 0 : value);

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

  // Assistive tech reads the settled value; sighted users watch it count.
  return (
    <span className={className}>
      <span className="sr-only">{format(value)}</span>
      <span aria-hidden="true">{format(display)}</span>
    </span>
  );
}

/** An Apple Score, printed as dollars and counted up when it changes. */
export function AnimatedMoney(props: Omit<AnimatedNumberProps, "format">) {
  return <AnimatedNumber {...props} format={formatUSD} />;
}
