import type * as React from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
};

/**
 * Fades + lifts content into view.
 *
 * Deliberately CSS-driven rather than JS-driven: a requestAnimationFrame-based
 * entrance leaves `opacity: 0` in the server-rendered HTML, so the content is
 * invisible until hydration runs — and stays invisible entirely if the page
 * loads in a background tab (where rAF is paused) or if JS fails. A keyframe
 * animation needs neither hydration nor rAF, and `prefers-reduced-motion`
 * collapses it to an instant, fully visible final state.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <div
      className={cn("animate-enter-up", className)}
      style={{ animationDelay: `${Math.round(delay * 1000)}ms` }}
    >
      {children}
    </div>
  );
}
