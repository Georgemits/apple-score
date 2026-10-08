"use client";

import * as React from "react";
import { Download, RefreshCw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { absoluteUrl, canShare, copyText, isAbortError } from "@/components/share/clipboard";
import { cn, formatNumber } from "@/lib/utils";

export type CardPreviewProps = {
  username: string;
  label: string;
  hint: string;
  width: number;
  height: number;
  /** The PNG endpoint for this format, e.g. `/api/card/steve?format=og`. */
  src: string;
  /** Same endpoint with `download=1`. */
  downloadHref: string;
  filename: string;
  /** Copied when the browser cannot share files. */
  profilePath: string;
  shareTitle: string;
  shareText: string;
  /** Entrance stagger in milliseconds. */
  delay?: number;
};

type Status = "loading" | "ready" | "error";

/** Tallest a preview may grow, so the 9:16 story stays a thumbnail, not a wall. */
const MAX_PREVIEW_REM = 30;

/**
 * One share-card format: a live preview from the PNG endpoint with a skeleton
 * while it renders, a download link and a Share button that hands the PNG to
 * the native share sheet where files are supported.
 */
export function CardPreview({
  username,
  label,
  hint,
  width,
  height,
  src,
  downloadHref,
  filename,
  profilePath,
  shareTitle,
  shareText,
  delay = 0,
}: CardPreviewProps) {
  const [status, setStatus] = React.useState<Status>("loading");
  const [attempt, setAttempt] = React.useState(0);
  const [sharing, setSharing] = React.useState(false);
  const imageRef = React.useRef<HTMLImageElement>(null);

  // A cache-buster only on retries, so the first load can hit the browser cache.
  const imageSrc = attempt === 0 ? src : `${src}&retry=${attempt}`;

  // The image may finish loading before hydration, in which case `onLoad`
  // already fired into the void.
  React.useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) setStatus("ready");
  }, [imageSrc]);

  const retry = () => {
    setStatus("loading");
    setAttempt((count) => count + 1);
  };

  const share = async () => {
    setSharing(true);
    try {
      const response = await fetch(imageSrc);
      if (!response.ok) throw new Error(`Card request failed with ${response.status}`);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: "image/png" });

      if (canShare() && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: shareTitle, text: shareText });
          return;
        } catch (error) {
          if (isAbortError(error)) return;
          throw error;
        }
      }

      const url = absoluteUrl(profilePath);
      if (await copyText(url)) {
        toast.success("Profile link copied", {
          description:
            "This browser can't share images directly, so the link is on your clipboard. Download the PNG to post it.",
        });
      } else {
        toast.error("Couldn't share the card.", { description: "Download the PNG instead." });
      }
    } catch (error) {
      console.error(error);
      toast.error("Couldn't share the card.", { description: "Try the download instead." });
    } finally {
      setSharing(false);
    }
  };

  const maxWidthRem = MAX_PREVIEW_REM * (width / height);

  return (
    <Card
      className="animate-enter-up overflow-hidden"
      style={{ animationDelay: `${Math.min(Math.max(delay, 0), 240)}ms` }}
    >
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-center">
        <div
          className="relative mx-auto w-full overflow-hidden rounded-xl bg-secondary"
          style={{ aspectRatio: `${width} / ${height}`, maxWidth: `${maxWidthRem}rem` }}
        >
          {status !== "ready" && <Skeleton className="absolute inset-0 rounded-xl" />}

          {status === "error" ? (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
              role="status"
            >
              <p className="text-pretty text-sm text-muted-foreground">
                This card didn&apos;t render. The server may be busy drawing someone else&apos;s.
              </p>
              <Button type="button" size="sm" variant="outline" onClick={retry}>
                <RefreshCw aria-hidden="true" />
                Try again
              </Button>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={imageSrc}
              ref={imageRef}
              src={imageSrc}
              width={width}
              height={height}
              alt={`${label} Apple Score card for @${username}`}
              decoding="async"
              onLoad={() => setStatus("ready")}
              onError={() => setStatus("error")}
              className={cn(
                "block size-full object-cover transition-opacity duration-500",
                status === "ready" ? "opacity-100" : "opacity-0"
              )}
            />
          )}
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">{label}</h2>
          <p className="tabular mt-0.5 text-xs text-muted-foreground">
            {formatNumber(width)} × {formatNumber(height)} PNG
          </p>
          <p className="mt-2 text-pretty text-sm text-muted-foreground">{hint}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <a href={downloadHref} download={filename}>
                <Download aria-hidden="true" />
                Download PNG
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={share}
              disabled={sharing || status === "error"}
            >
              <Share2 aria-hidden="true" className={cn(sharing && "animate-pulse-soft")} />
              {sharing ? "Preparing…" : "Share"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
