"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ShowMoreProps = {
  /** Id of the list, referenced by the toggle's `aria-controls`. */
  id: string;
  /** Element used for the list container. */
  as?: "div" | "ul" | "ol";
  className?: string;
  ariaLabel?: string;
  /** Always-visible items. */
  children: React.ReactNode;
  /** Items revealed by the toggle, rendered inside the same container. */
  more?: React.ReactNode;
  moreCount: number;
  label: string;
  collapseLabel?: string;
};

/**
 * A list whose tail is hidden behind a "Show all N" toggle. The hidden items
 * are rendered inside the same container as the visible ones, so grids stay
 * continuous, and are server-rendered content passed in as props.
 */
export function ShowMore({
  id,
  as: Tag = "div",
  className,
  ariaLabel,
  children,
  more,
  moreCount,
  label,
  collapseLabel = "Show fewer",
}: ShowMoreProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div>
      <Tag id={id} className={className} aria-label={ariaLabel}>
        {children}
        {expanded ? more : null}
      </Tag>
      {moreCount > 0 && (
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={expanded}
            aria-controls={id}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? collapseLabel : label}
            <ChevronDown
              className={cn("transition-transform duration-200", expanded && "rotate-180")}
              aria-hidden="true"
            />
          </Button>
        </div>
      )}
    </div>
  );
}
