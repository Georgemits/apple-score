"use client";

import * as React from "react";
import { MotionConfig } from "framer-motion";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Theme plus motion preferences. `reducedMotion="user"` makes every
 * framer-motion transform and layout animation respect the OS "reduce
 * motion" setting; CSS animations are handled in globals.css.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </NextThemesProvider>
  );
}
