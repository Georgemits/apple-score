import type { Category } from "@prisma/client";
import { CATEGORY_EMOJI, CATEGORY_LABEL } from "@/lib/categories";
import type { CategoryBreakdown } from "@/lib/score";
import { formatUSD } from "@/lib/utils";
import { categoryLeadCopy } from "@/components/profile/compare-copy";

export type CompareCategorySide = {
  username: string;
  breakdown: readonly CategoryBreakdown[];
  /** Avatar gradient stops; each collector's bars wear their own colours. */
  gradient: { from: string; to: string };
};

type CompareCategoriesProps = {
  left: CompareCategorySide;
  right: CompareCategorySide;
};

function Bar({
  username,
  amount,
  share,
  gradient,
}: {
  username: string;
  amount: number;
  share: number;
  gradient: { from: string; to: string };
}) {
  const width = amount === 0 ? 0 : Math.max(share * 100, 2);
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 truncate text-xs text-muted-foreground sm:w-28">
        @{username}
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${width}%`,
            backgroundImage: `linear-gradient(90deg, ${gradient.from}, ${gradient.to})`,
          }}
        />
      </div>
      <span className="tabular w-20 shrink-0 text-right text-sm font-semibold">
        {formatUSD(amount)}
      </span>
    </div>
  );
}

/**
 * Category by category: one row per category either collector owns, two bars
 * each scaled to the bigger of the two amounts so every row is its own duel.
 */
export function CompareCategories({ left, right }: CompareCategoriesProps) {
  const totals = new Map<Category, { a: number; b: number }>();
  for (const entry of left.breakdown) {
    totals.set(entry.category, { a: entry.total, b: 0 });
  }
  for (const entry of right.breakdown) {
    const current = totals.get(entry.category) ?? { a: 0, b: 0 };
    totals.set(entry.category, { ...current, b: entry.total });
  }

  const rows = [...totals.entries()]
    .map(([category, { a, b }]) => ({ category, a, b, max: Math.max(a, b) }))
    .sort((x, y) => y.max - x.max || x.category.localeCompare(y.category));

  return (
    <div className="space-y-5">
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Legend">
        {[left, right].map((side) => (
          <li key={side.username} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{
                backgroundImage: `linear-gradient(135deg, ${side.gradient.from}, ${side.gradient.to})`,
              }}
              aria-hidden="true"
            />
            <span className="font-medium">@{side.username}</span>
          </li>
        ))}
      </ul>

      <ol className="space-y-5" aria-label="Spending by category, both collectors">
        {rows.map((row, index) => (
          <li
            key={row.category}
            className="animate-enter-up"
            style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold">
                <span aria-hidden="true">{CATEGORY_EMOJI[row.category]} </span>
                {CATEGORY_LABEL[row.category]}
              </h3>
              <span className="truncate text-xs text-muted-foreground">
                {categoryLeadCopy(left.username, right.username, row.a, row.b)}
              </span>
            </div>
            <div className="mt-2 space-y-1.5">
              <Bar
                username={left.username}
                amount={row.a}
                share={row.max === 0 ? 0 : row.a / row.max}
                gradient={left.gradient}
              />
              <Bar
                username={right.username}
                amount={row.b}
                share={row.max === 0 ? 0 : row.b / row.max}
                gradient={right.gradient}
              />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
