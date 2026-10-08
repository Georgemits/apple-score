"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type BoardSearchProps = {
  value: string;
  onChange: (value: string) => void;
  /** Describes what is being searched, e.g. "this page". */
  scope?: string;
  className?: string;
};

/**
 * Filters the loaded page by name. Escape clears it (then blurs), and the
 * clear button is a full-height 44px target on phones.
 */
export function BoardSearch({ value, onChange, scope = "this page", className }: BoardSearchProps) {
  const id = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const active = value.length > 0;

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Search collectors on {scope}
      </label>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          if (active) {
            event.preventDefault();
            onChange("");
          } else {
            event.currentTarget.blur();
          }
        }}
        placeholder={`Search collectors on ${scope}…`}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        className="h-12 rounded-full pl-11 pr-12 text-base sm:h-11 md:text-sm"
      />
      {active && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute inset-y-0 right-1 flex w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-offset-0"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
