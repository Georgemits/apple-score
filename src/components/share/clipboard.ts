/**
 * Browser-only helpers shared by the share buttons. Plain functions, so the
 * client components that use them stay small.
 */

/** Absolute URL for a same-origin path, resolved against the current origin. */
export function absoluteUrl(path: string): string {
  return new URL(path, window.location.origin).toString();
}

/** The Web Share API is available (secure context, supporting browser). */
export function canShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/** The user dismissed the share sheet — not an error worth reporting. */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/** Copies text, falling back to the legacy command where the async API is blocked. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or insecure context; try the legacy path below.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.setAttribute("aria-hidden", "true");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}
