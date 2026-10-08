"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@prisma/client";
import {
  Award,
  Boxes,
  CornerDownLeft,
  Home as HomeIcon,
  Loader2,
  Plus,
  Search,
  Settings,
  Trophy,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import { addProductAction } from "@/actions/products";
import { useScoreAction } from "@/hooks/use-score-action";
import { CATEGORY_EMOJI, CATEGORY_KEYWORDS, CATEGORY_LABEL } from "@/lib/categories";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { cn, formatUSD } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/** Fired by the nav button; the palette also opens on ⌘K / Ctrl+K. */
export const OPEN_PALETTE_EVENT = "apple-score:open-palette";

type SlimProduct = {
  id: string;
  slug: string;
  name: string;
  family: string;
  category: Category;
  priceUSD: number;
  year: number;
  legacy: boolean;
};

type NavCommand = { kind: "nav"; href: string; label: string; icon: LucideIcon; keywords: string };
type ProductCommand = { kind: "product"; product: SlimProduct };
type Command = NavCommand | ProductCommand;

const NAV_COMMANDS: NavCommand[] = [
  { kind: "nav", href: "/home", label: "Go to Home", icon: HomeIcon, keywords: "dashboard home" },
  {
    kind: "nav",
    href: "/collection",
    label: "Go to my collection",
    icon: Boxes,
    keywords: "collection products owned",
  },
  {
    kind: "nav",
    href: "/catalog",
    label: "Browse the catalogue",
    icon: Plus,
    keywords: "catalog add product browse",
  },
  {
    kind: "nav",
    href: "/leaderboard",
    label: `Open ${LEADERBOARD_NAME}`,
    icon: Trophy,
    keywords: "leaderboard board rank band",
  },
  {
    kind: "nav",
    href: "/achievements",
    label: "View achievements",
    icon: Award,
    keywords: "achievements badges",
  },
  {
    kind: "nav",
    href: "/profile",
    label: "My profile",
    icon: UserIcon,
    keywords: "profile me share",
  },
  {
    kind: "nav",
    href: "/settings",
    label: "Settings",
    icon: Settings,
    keywords: "settings account password",
  },
];

function score(product: SlimProduct, terms: string[]): number {
  const haystack = [
    product.name.toLowerCase(),
    product.family.toLowerCase(),
    CATEGORY_LABEL[product.category].toLowerCase(),
    ...CATEGORY_KEYWORDS[product.category],
    String(product.year),
  ].join(" ");
  let total = 0;
  for (const term of terms) {
    if (!haystack.includes(term)) return 0;
    total += product.name.toLowerCase().startsWith(term)
      ? 3
      : product.name.toLowerCase().includes(term)
        ? 2
        : 1;
  }
  return total + (product.legacy ? 0 : 0.5) + product.year / 10_000;
}

/**
 * ⌘K quick-add: type a product, press Enter, it's in your collection. Also
 * jumps between pages. Catalogue data is fetched lazily the first time it opens.
 */
export function CommandPalette() {
  const router = useRouter();
  const { run, isPending } = useScoreAction();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [index, setIndex] = React.useState(0);
  const [products, setProducts] = React.useState<SlimProduct[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const listRef = React.useRef<HTMLUListElement>(null);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  React.useEffect(() => {
    if (!open || products || loading) return;
    setLoading(true);
    fetch("/api/catalog")
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error("unauthorized"))
      )
      .then((data: { products: SlimProduct[] }) => setProducts(data.products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [open, products, loading]);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setIndex(0);
    }
  }, [open]);

  const commands = React.useMemo<Command[]>(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const nav = NAV_COMMANDS.filter(
      (command) =>
        terms.length === 0 ||
        terms.every((term) => `${command.label} ${command.keywords}`.toLowerCase().includes(term))
    );
    if (terms.length === 0) return nav;

    const matched = (products ?? [])
      .map((product) => ({ product, weight: score(product, terms) }))
      .filter((entry) => entry.weight > 0)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 8)
      .map<Command>((entry) => ({ kind: "product", product: entry.product }));

    return [...matched, ...nav.slice(0, 3)];
  }, [products, query]);

  React.useEffect(() => setIndex(0), [query]);

  React.useEffect(() => {
    const item = listRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`);
    item?.scrollIntoView({ block: "nearest" });
  }, [index]);

  const execute = (command: Command) => {
    if (command.kind === "nav") {
      setOpen(false);
      router.push(command.href);
      return;
    }
    const { product } = command;
    setOpen(false);
    run(() => addProductAction({ productId: product.id, quantity: 1 }), `Added ${product.name}.`);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIndex((value) => Math.min(commands.length - 1, value + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIndex((value) => Math.max(0, value - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const command = commands[index];
      if (command) execute(command);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="top-[12%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
        onKeyDown={onKeyDown}
      >
        <DialogTitle className="sr-only">Quick add</DialogTitle>
        <DialogDescription className="sr-only">
          Search the catalogue and press Enter to add a product, or jump to a page.
        </DialogDescription>

        <div className="flex items-center gap-3 border-b border-border pl-4 pr-12">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Add a product… try “iPhone 17 Pro” or “Mac Studio”"
            aria-label="Search the catalogue or pages"
            aria-controls="palette-results"
            aria-activedescendant={commands[index] ? `palette-item-${index}` : undefined}
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          {(loading || isPending) && (
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
          )}
        </div>

        <ul
          id="palette-results"
          ref={listRef}
          role="listbox"
          aria-label="Results"
          className="max-h-[22rem] overflow-y-auto p-2"
        >
          {commands.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">
              {loading || products === null
                ? "Loading the catalogue…"
                : products.length === 0
                  ? "Could not load the catalogue. Try again in a moment."
                  : `Nothing matches “${query}”. Try a product name, family or year.`}
            </li>
          )}
          {commands.map((command, commandIndex) => {
            const active = commandIndex === index;
            const common =
              "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors";
            if (command.kind === "nav") {
              return (
                <li
                  key={command.href}
                  id={`palette-item-${commandIndex}`}
                  data-index={commandIndex}
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setIndex(commandIndex)}
                  onClick={() => execute(command)}
                  className={cn(common, active ? "bg-secondary" : "hover:bg-secondary/60")}
                >
                  <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                    <command.icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex-1">{command.label}</span>
                  {active && (
                    <CornerDownLeft className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  )}
                </li>
              );
            }
            const { product } = command;
            return (
              <li
                key={product.id}
                id={`palette-item-${commandIndex}`}
                data-index={commandIndex}
                role="option"
                aria-selected={active}
                onMouseEnter={() => setIndex(commandIndex)}
                onClick={() => execute(command)}
                className={cn(common, active ? "bg-secondary" : "hover:bg-secondary/60")}
              >
                <span
                  className="flex size-8 items-center justify-center rounded-md bg-accent/12 text-base"
                  aria-hidden="true"
                >
                  {CATEGORY_EMOJI[product.category]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{product.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {product.family} · {product.year}
                    {product.legacy ? " · legacy" : ""}
                  </span>
                </span>
                <span className="tabular text-sm font-semibold">{formatUSD(product.priceUSD)}</span>
                <span
                  className={cn(
                    "ml-1 hidden items-center gap-1 text-xs text-muted-foreground sm:flex",
                    !active && "invisible"
                  )}
                >
                  add <CornerDownLeft className="size-3" aria-hidden="true" />
                </span>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span>↑↓ to move · Enter to add · Esc to close</span>
          <span>Adds one unit. Change quantities in your collection.</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
