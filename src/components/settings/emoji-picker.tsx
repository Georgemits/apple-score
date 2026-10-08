"use client";

import { cn } from "@/lib/utils";

export const AVATAR_EMOJI = [
  "🍎", "🍏", "💻", "📱", "⌚", "🎧", "🥽", "🖥️", "📟", "🕹️",
  "🚀", "✨", "🔥", "👑", "💎", "🧢", "🦄", "🐋", "🐧", "🍕",
  "☕", "🎸", "🎮", "🏄", "🧪", "🪐", "🌈", "🥇", "🎯", "🧲",
  "🪩", "🛸", "🐱", "🐶", "🦊", "🐼", "🦁", "🐸", "🐙", "🤖",
] as const;

type EmojiPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

/** A curated emoji grid for the avatar; "" means initials. */
export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Avatar emoji">
      <button
        type="button"
        onClick={() => onChange("")}
        aria-pressed={value === ""}
        className={cn(
          "h-10 rounded-full border px-3 text-xs font-medium transition-colors",
          value === ""
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
        )}
      >
        Initials
      </button>
      {AVATAR_EMOJI.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          aria-pressed={value === emoji}
          aria-label={`Use ${emoji} as avatar`}
          className={cn(
            "flex size-10 items-center justify-center rounded-full border text-lg transition-transform hover:scale-110",
            value === emoji
              ? "border-accent bg-accent/12 ring-2 ring-accent/50"
              : "border-border bg-background/60"
          )}
        >
          <span aria-hidden="true">{emoji}</span>
        </button>
      ))}
    </div>
  );
}
