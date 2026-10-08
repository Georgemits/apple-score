import { formatUSD } from "@/lib/utils";

/**
 * The verdict line under the VS badge. Jokes are about the money, never about
 * the person: the trailing collector is always told it is fixable.
 */
export function compareVerdict(leader: string, trailer: string, gap: number, sameUser: boolean) {
  if (sameUser)
    return "Comparing yourself with yourself. It's a tie, and it's a little suspicious.";
  if (gap === 0) return "Dead heat. Two wallets, equally lighter.";

  const lead = `@${leader}`;
  const trail = `@${trailer}`;
  const dollars = formatUSD(gap);

  if (gap < 100) return `${lead} leads by ${dollars}. That's a cable. ${trail}, buy a cable.`;
  if (gap < 1_000) return `${lead} is ${dollars} ahead. One pair of AirPods flips this, ${trail}.`;
  if (gap < 5_000) return `${lead} is ${dollars} richer in Apple. ${trail}, this is fixable.`;
  if (gap < 25_000) {
    return `${lead} is ${dollars} richer in Apple. ${trail}, that is a Mac Pro-sized gap.`;
  }
  return `${lead} is ${dollars} richer in Apple. ${trail}, we recommend a payment plan.`;
}

/** The short label beside a category row: who leads it, by how much. */
export function categoryLeadCopy(left: string, right: string, a: number, b: number): string {
  if (a === b) return a === 0 ? "Neither" : "Tied";
  return a > b ? `@${left} by ${formatUSD(a - b)}` : `@${right} by ${formatUSD(b - a)}`;
}
