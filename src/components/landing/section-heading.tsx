import type * as React from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  /** The id the parent `<section aria-labelledby>` points at. */
  id: string;
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
};

/** Eyebrow + title + description row used at the top of every landing section. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center"
          ? "items-center text-center"
          : "sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">{eyebrow}</p>
        )}
        <h2
          id={id}
          className="mt-2 text-balance text-3xl font-semibold tracking-tighter sm:text-4xl"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-pretty text-base text-muted-foreground sm:text-lg">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
