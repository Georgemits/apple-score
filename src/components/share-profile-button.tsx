"use client";

import * as React from "react";
import { Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareProfileButton({ username }: { username: string }) {
  const [copied, setCopied] = React.useState(false);

  const share = async () => {
    const url = `${window.location.origin}/u/${username}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: `${username} on Apple Score`, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Profile link copied to clipboard.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // AbortError just means the user dismissed the native share sheet.
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Could not copy the link. Copy it from the address bar instead.");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={share}>
      {copied ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
      {copied ? "Copied" : "Share profile"}
    </Button>
  );
}
