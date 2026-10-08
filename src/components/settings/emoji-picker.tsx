"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** A curated grid: Apple things, money things, and a few animals for the rest of us. */
export const AVATAR_EMOJI = [
  "🍎",
  "🍏",
  "💻",
  "📱",
  "⌚",
  "🎧",
  "🥽",
  "🖥️",
  "📟",
  "🕹️",
  "🚀",
  "✨",
  "🔥",
  "👑",
  "💎",
  "🧢",
  "🦄",
  "🐋",
  "🐧",
  "🍕",
  "☕",
  "🎸",
  "🎮",
  "🏄",
  "🧪",
  "🪐",
  "🌈",
  "🥇",
  "🎯",
  "🧲",
  "🪩",
  "🛸",
  "🐱",
  "🐶",
  "🦊",
  "🐼",
  "🦁",
  "🐸",
  "🐙",
  "🤖",
] as const;

type EmojiPickerProps = {
  /** The chosen emoji, or "" for initials. */
  value: string;
  onChange: (value: string) => void;
  /** Id of the element that labels the group. */
  labelledBy: string;
  disabled?: boolean;
};

/**
 * Avatar emoji as a row of toggle buttons. Every option carries `aria-pressed`,
 * and the chosen one also gets a check badge so the selection never relies on
 * colour alone. Targets are 44px for thumbs.
 */
export function EmojiPicker({ value, onChange, labelledBy, disabled = false }: EmojiPickerProps) {
  const noneSelected = value === "";

  return (
    <div role="group" aria-labelledby={labelledBy} className="space-y-2">
      <button
        type="button"
        onClick={() => onChange("")}
        aria-pressed={noneSelected}
        disabled={disabled}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          noneSelected
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
        )}
      >
        {noneSelected && <Check className="size-3.5" aria-hidden="true" />}
        None (initials)
      </button>

      <div className="flex flex-wrap gap-1.5">
        {AVATAR_EMOJI.map((emoji) => {
          const selected = value === emoji;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange(emoji)}
              aria-pressed={selected}
              aria-label={`Use ${emoji} as avatar`}
              disabled={disabled}
              className={cn(
                "relative flex size-11 items-center justify-center rounded-xl border text-xl leading-none transition-[transform,background-color,border-color] duration-150 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:hover:scale-110 motion-safe:active:scale-95",
                selected
                  ? "border-accent bg-accent/12 ring-2 ring-accent/40"
                  : "border-border bg-background/60 hover:border-foreground/30"
              )}
            >
              <span aria-hidden="true">{emoji}</span>
              {selected && (
                <span
                  className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm"
                  aria-hidden="true"
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
