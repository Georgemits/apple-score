"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, pluralize } from "@/lib/utils";

type ProductSearchProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  /** Announced politely so screen-reader users hear how many chips matched. */
  resultCount: number;
  className?: string;
};

export function ProductSearch({
  id,
  value,
  onChange,
  label,
  placeholder,
  resultCount,
  className,
}: ProductSearchProps) {
  const active = value.trim().length > 0;

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        className="pl-10 pr-11"
      />
      {active && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-offset-0"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
      <p className="sr-only" aria-live="polite">
        {active ? pluralize(resultCount, "match", "matches") : ""}
      </p>
    </div>
  );
}
