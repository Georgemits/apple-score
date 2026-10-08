"use client";

import { Check } from "lucide-react";
import { AVATAR_HUES } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { avatarGradient } from "@/components/user-avatar";

/** Human names for the preset hues, so the swatches read out as colours. */
const HUE_NAME: Record<number, string> = {
  0: "Red",
  25: "Orange",
  45: "Amber",
  90: "Lime",
  150: "Green",
  190: "Cyan",
  215: "Blue",
  250: "Indigo",
  280: "Purple",
  320: "Pink",
};

function hueName(hue: number): string {
  return HUE_NAME[hue] ?? `Hue ${hue}°`;
}

function gradientStyle(username: string, hue: number | null) {
  const { from, to } = avatarGradient({ username, avatarHue: hue });
  return { backgroundImage: `linear-gradient(135deg, ${from}, ${to})` };
}

type HuePickerProps = {
  /** The chosen hue, or null to derive one from the username. */
  value: number | null;
  onChange: (value: number | null) => void;
  /** Needed for the "Auto" swatch, which hashes the username. */
  username: string;
  /** Id of the element that labels the group. */
  labelledBy: string;
  disabled?: boolean;
};

/**
 * Avatar gradient as a row of colour swatches, each filled with the exact
 * gradient the avatar would use. "Auto" is the hash-of-username default.
 */
export function HuePicker({
  value,
  onChange,
  username,
  labelledBy,
  disabled = false,
}: HuePickerProps) {
  const autoSelected = value === null;

  return (
    <div role="group" aria-labelledby={labelledBy} className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(null)}
        aria-pressed={autoSelected}
        aria-label="Auto (a colour picked from your username)"
        disabled={disabled}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-full border py-1 pl-1.5 pr-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          autoSelected
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
        )}
      >
        <span
          className="flex size-8 items-center justify-center rounded-full text-white"
          style={gradientStyle(username, null)}
          aria-hidden="true"
        >
          {autoSelected && <Check className="size-4" strokeWidth={3} />}
        </span>
        Auto
      </button>

      {AVATAR_HUES.map((hue) => {
        const selected = value === hue;
        return (
          <button
            key={hue}
            type="button"
            onClick={() => onChange(hue)}
            aria-pressed={selected}
            aria-label={hueName(hue)}
            title={hueName(hue)}
            disabled={disabled}
            style={gradientStyle(username, hue)}
            className={cn(
              "flex size-11 items-center justify-center rounded-full text-white transition-[transform,box-shadow] duration-150 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:hover:scale-110 motion-safe:active:scale-95",
              selected
                ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                : "ring-1 ring-foreground/10"
            )}
          >
            {selected && (
              <Check className="size-5 drop-shadow" strokeWidth={3} aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}
