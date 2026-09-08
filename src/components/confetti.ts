"use client";

/** Fires a short, celebratory burst. No-ops when the user prefers less motion. */
export async function celebrate(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const { default: confetti } = await import("canvas-confetti");

  const defaults = {
    startVelocity: 32,
    spread: 360,
    ticks: 70,
    zIndex: 100,
    colors: ["#0071e3", "#a855f7", "#f59e0b", "#10b981", "#ef4444"],
  };

  const end = Date.now() + 900;

  const frame = () => {
    confetti({ ...defaults, particleCount: 24, origin: { x: 0.1, y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount: 24, origin: { x: 0.9, y: Math.random() - 0.2 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  };

  frame();
}
