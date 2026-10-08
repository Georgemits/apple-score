import Link from "next/link";
import { BOARDS } from "@/lib/leaderboard";
import { cn } from "@/lib/utils";
import { boardHref } from "@/components/leaderboard/types";
import { ScrollToActive } from "@/components/leaderboard/scroll-to-active";

type BoardTabsProps = {
  activeKey: string;
  signedIn: boolean;
  className?: string;
};

/**
 * One chip per board. A horizontally scrolling row on phones with faded
 * edges, wrapping on wider screens. Switching boards always lands on page 1.
 */
export function BoardTabs({ activeKey, signedIn, className }: BoardTabsProps) {
  const boards = BOARDS.filter((board) => !board.requiresViewer || signedIn);

  return (
    <nav aria-label="Boards" className={cn("-mx-4 sm:mx-0", className)}>
      <ul className="scrollbar-none fade-x flex gap-2 overflow-x-auto px-4 py-1 sm:flex-wrap sm:overflow-visible sm:px-0 sm:[mask-image:none]">
        {boards.map((board) => {
          const active = board.key === activeKey;
          return (
            <li key={board.key} className="shrink-0">
              <Link
                href={boardHref(board.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors sm:h-9 sm:px-3.5",
                  active
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border/70 bg-background/60 text-foreground backdrop-blur hover:bg-secondary"
                )}
              >
                <span aria-hidden="true">{board.emoji}</span>
                {board.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <ScrollToActive />
    </nav>
  );
}
