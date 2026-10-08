"use client";

import * as React from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { absoluteUrl, canShare, copyText, isAbortError } from "@/components/share/clipboard";

type ShareButtonProps = {
  /** Same-origin path to share, e.g. `/u/steve`. Resolved to an absolute URL on click. */
  path: string;
  title?: string;
  text?: string;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
};

function useCopiedFlag(): [boolean, () => void] {
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);
  return [copied, () => setCopied(true)];
}

async function copyWithToast(url: string, flag: () => void): Promise<void> {
  if (await copyText(url)) {
    flag();
    toast.success("Link copied", { description: url });
  } else {
    toast.error("Couldn't copy the link.", { description: url });
  }
}

/**
 * Opens the native share sheet where one exists (phones, Safari) and copies
 * the link to the clipboard everywhere else.
 */
export function ShareButton({
  path,
  title,
  text,
  label = "Share",
  variant = "outline",
  size = "default",
  className,
}: ShareButtonProps) {
  const [copied, markCopied] = useCopiedFlag();
  const [busy, setBusy] = React.useState(false);

  const share = async () => {
    const url = absoluteUrl(path);
    setBusy(true);
    try {
      if (canShare()) {
        try {
          await navigator.share({ url, title, text });
          return;
        } catch (error) {
          if (isAbortError(error)) return;
          // Share failed outright (e.g. unsupported data); copying still works.
        }
      }
      await copyWithToast(url, markCopied);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={share}
      disabled={busy}
    >
      {copied ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

type CopyLinkButtonProps = Omit<ShareButtonProps, "title" | "text">;

/** Always copies; for the people who want the URL rather than a share sheet. */
export function CopyLinkButton({
  path,
  label = "Copy link",
  variant = "ghost",
  size = "default",
  className,
}: CopyLinkButtonProps) {
  const [copied, markCopied] = useCopiedFlag();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => copyWithToast(absoluteUrl(path), markCopied)}
    >
      {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
