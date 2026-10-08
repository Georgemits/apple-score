import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 18500 → "18,500" */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** 1599 → "$1,599" — the canonical way to print an Apple Score. */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/** 18492 → "$18.5K", 1250000 → "$1.25M" — for tight spaces like share cards and axes. */
export function formatCompactUSD(value: number): string {
  const abs = Math.abs(value);
  if (abs < 10_000) return formatUSD(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: abs < 1_000_000 ? 1 : 2,
  }).format(value);
}

/** +1599 → "+$1,599", -250 → "−$250" */
export function formatSignedUSD(value: number): string {
  if (value === 0) return formatUSD(0);
  return `${value > 0 ? "+" : "−"}${formatUSD(Math.abs(value))}`;
}

/** 2024-03-01 → "March 2024" */
export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

/** 2024-03-01 → "Mar 1, 2024" */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** "just now", "4 minutes ago", "3 days ago", or the date once it is old. */
export function formatRelative(date: Date, now: Date = new Date()): string {
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }
  return formatDate(date);
}

/** pluralize(3, "product") → "3 products" */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

/** "george" → "GE" */
export function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/[\s_-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

/** Deterministic hue (0–359) for a string, so every username gets a stable colour. */
export function hueFromString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash % 360;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** "#1", "#42" — ordinal rank display. */
export function formatRank(rank: number): string {
  return `#${formatNumber(rank)}`;
}

/** The first value of a `searchParams` entry, or "" when absent. */
export function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Keeps a download filename to characters every OS accepts. */
export function safeFilename(username: string): string {
  return username.toLowerCase().replace(/[^a-z0-9_-]/g, "") || "collector";
}

/** A collector's display name, falling back to their handle. */
export function profileName(user: { displayName: string | null; username: string }): string {
  return user.displayName ?? `@${user.username}`;
}

/**
 * Evenly samples a series down to about `max` points, always keeping the
 * first and the last so the ends of a chart stay honest.
 */
export function downsample<T>(points: readonly T[], max: number): T[] {
  if (points.length <= max) return [...points];
  const step = points.length / max;
  const sampled: T[] = [];
  for (let index = 0; index < max; index += 1) sampled.push(points[Math.floor(index * step)]!);
  sampled.push(points[points.length - 1]!);
  return sampled;
}

/**
 * Only allows same-origin relative paths for post-login redirects, so a crafted
 * `?callbackUrl=https://evil.example` (or `//evil.example`) can never bounce a
 * user off-site.
 */
export function safeCallbackUrl(value: string | null | undefined, fallback = "/home"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\r\n]/.test(value)) return fallback;
  return value;
}
