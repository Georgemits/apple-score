"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  className?: string;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

/**
 * The catalogue search. Press "/" anywhere on the page to jump into it,
 * Escape clears it (then blurs), and the clear button is a full-height
 * 44px target on phones.
 */
export function SearchBox({ value, onChange, inputRef, className }: SearchBoxProps) {
  const id = React.useId();
  const active = value.length > 0;

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      // A dialog is open: leave the focus trap alone.
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;
      event.preventDefault();
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      input.select();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inputRef]);

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Search the catalogue
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
        placeholder="Search iPhone, MacBook Pro, 2019, headphones…"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        className="h-12 rounded-full pl-11 pr-12 text-base sm:h-11 md:text-sm"
      />
      {active ? (
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
      ) : (
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 hidden h-6 -translate-y-1/2 items-center rounded-md border border-border/70 bg-secondary/70 px-1.5 font-mono text-[11px] text-muted-foreground sm:inline-flex"
        >
          /
        </kbd>
      )}
    </div>
  );
}
