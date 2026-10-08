import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { boardHref } from "@/components/leaderboard/types";

type BoardPaginationProps = {
  boardKey: string;
  page: number;
  pageCount: number;
  className?: string;
};

/** Previous / Page X of Y / Next. Hidden when the board fits on one page. */
export function BoardPagination({ boardKey, page, pageCount, className }: BoardPaginationProps) {
  if (pageCount <= 1) return null;

  const previous = page > 1 ? boardHref(boardKey, page - 1) : null;
  const next = page < pageCount ? boardHref(boardKey, page + 1) : null;
  const buttonClass = "h-11 sm:h-10";

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-between gap-3", className)}
    >
      {previous ? (
        <Button asChild variant="outline" className={buttonClass}>
          <Link href={previous} rel="prev">
            <ChevronLeft aria-hidden="true" />
            Previous
          </Link>
        </Button>
      ) : (
        <Button variant="outline" className={buttonClass} disabled aria-disabled="true">
          <ChevronLeft aria-hidden="true" />
          Previous
        </Button>
      )}

      <p className="tabular text-sm text-muted-foreground">
        Page {formatNumber(page)} of {formatNumber(pageCount)}
      </p>

      {next ? (
        <Button asChild variant="outline" className={buttonClass}>
          <Link href={next} rel="next">
            Next
            <ChevronRight aria-hidden="true" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" className={buttonClass} disabled aria-disabled="true">
          Next
          <ChevronRight aria-hidden="true" />
        </Button>
      )}
    </nav>
  );
}
