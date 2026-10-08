import { Activity, Award, Download, Package, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const INCLUDED = [
  { icon: UserRound, label: "Profile", detail: "Name, bio, avatar, privacy" },
  { icon: Package, label: "Collection", detail: "Every product, quantity and price paid" },
  { icon: Award, label: "Achievements", detail: "What you unlocked, and when" },
  { icon: Activity, label: "Activity", detail: "Your last 500 inventory changes" },
] as const;

/**
 * The data export: what is in the file, and a plain link that downloads it.
 * The route sets `Content-Disposition`, so no JavaScript is involved.
 */
export function ExportData() {
  return (
    <div className="space-y-5">
      <ul className="grid gap-2 sm:grid-cols-2" aria-label="What the export includes">
        {INCLUDED.map(({ icon: Icon, label, detail }) => (
          <li
            key={label}
            className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/40 px-3.5 py-3"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground"
              aria-hidden="true"
            >
              <Icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-xs text-muted-foreground">{detail}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          One JSON file, a few kilobytes, no tracking pixels. Yours to keep.
        </p>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <a href="/api/me/export" download>
            <Download aria-hidden="true" />
            Export my data
          </a>
        </Button>
      </div>
    </div>
  );
}
