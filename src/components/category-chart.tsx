import type { CategoryBreakdown } from "@/lib/score";
import { CATEGORY_LABEL } from "@/lib/categories";
import { formatNumber } from "@/lib/utils";

const BAR_COLORS = [
  "bg-sky-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-lime-500",
] as const;

function colorAt(index: number): string {
  return BAR_COLORS[index % BAR_COLORS.length] ?? "bg-slate-500";
}

/** Spending split by product family — a stacked bar plus a readable list. */
export function CategoryChart({ breakdown }: { breakdown: readonly CategoryBreakdown[] }) {
  if (breakdown.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add a product to see how your score splits across categories.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-secondary"
        role="img"
        aria-label={`Score split: ${breakdown
          .map((entry) => `${CATEGORY_LABEL[entry.category]} ${Math.round(entry.share * 100)}%`)
          .join(", ")}`}
      >
        {breakdown.map((entry, index) => (
          <span
            key={entry.category}
            className={colorAt(index)}
            style={{ width: `${Math.max(entry.share * 100, 1)}%` }}
          />
        ))}
      </div>

      <ul className="space-y-3">
        {breakdown.map((entry, index) => (
          <li key={entry.category} className="flex items-center gap-3">
            <span
              className={`size-2.5 shrink-0 rounded-full ${colorAt(index)}`}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {CATEGORY_LABEL[entry.category]}
            </span>
            <span className="tabular text-sm text-muted-foreground">
              {entry.units} {entry.units === 1 ? "item" : "items"}
            </span>
            <span className="tabular w-24 text-right text-sm font-semibold">
              {formatNumber(entry.total)}
            </span>
            <span className="tabular w-12 text-right text-xs text-muted-foreground">
              {Math.round(entry.share * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
