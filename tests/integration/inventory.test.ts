import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ current: null as { id: string; username: string } | null }));

vi.mock("@/auth", () => ({
  auth: async () =>
    session.current
      ? { user: { id: session.current.id, username: session.current.username } }
      : null,
  signIn: async () => undefined,
  signOut: async () => undefined,
}));

import { prisma } from "@/lib/prisma";
import {
  addProductAction,
  completeOnboardingAction,
  removeOneAction,
  removeProductAction,
  setQuantityAction,
  updateOwnedItemAction,
} from "@/actions/products";
import { toggleFollowAction, toggleWishlistAction } from "@/actions/social";
import { getActivity, getInventory, getScoreHistory, getUserStats } from "@/lib/queries";
import { createTestUser, deleteTestUsers, product } from "./helpers";

describe("inventory actions", () => {
  let me: Awaited<ReturnType<typeof createTestUser>>;
  let other: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    await deleteTestUsers();
    [me, other] = await Promise.all([createTestUser(), createTestUser()]);
  });

  beforeEach(() => {
    session.current = { id: me.id, username: me.username };
  });

  afterAll(async () => {
    await deleteTestUsers();
    await prisma.$disconnect();
  });

  it("refuses anonymous requests", async () => {
    session.current = null;
    const iphone = await product("iphone-17");
    const result = await addProductAction({ productId: iphone.id, quantity: 1 });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid input before touching the database", async () => {
    const result = await addProductAction({ productId: "", quantity: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors).toBeDefined();

    const unknown = await addProductAction({ productId: "does-not-exist", quantity: 1 });
    expect(unknown.ok).toBe(false);
  });

  it("adds products, raises the score, logs an event and unlocks the first achievement", async () => {
    const iphone = await product("iphone-17-pro-max"); // $1,199
    const result = await addProductAction({ productId: iphone.id, quantity: 1 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.score).toBe(1_199);
    expect(result.data.delta).toBe(1_199);
    expect(result.data.productCount).toBe(1);
    expect(result.data.milestone).toBe(1_000);
    expect(result.data.unlocked.map((u) => u.id)).toContain("first-purchase");
    expect(result.data.unlocked.map((u) => u.id)).toContain("apple-starter");
    expect(result.data.rank).not.toBeNull();

    const stats = await getUserStats(me.id);
    expect(stats.score).toBe(1_199);

    const activity = await getActivity(me.id);
    expect(activity[0]?.type).toBe("ADD");
    expect(activity[0]?.scoreAfter).toBe(1_199);
    expect(activity[0]?.quantityDelta).toBe(1);

    const unlocked = await prisma.userAchievement.findMany({ where: { userId: me.id } });
    expect(unlocked.map((row) => row.achievementId)).toContain("first-purchase");
  });

  it("merges repeat additions into one row and caps the quantity", async () => {
    const iphone = await product("iphone-17-pro-max");
    const again = await addProductAction({ productId: iphone.id, quantity: 2 });
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.data.score).toBe(3 * 1_199);

    const rows = await prisma.userProduct.findMany({
      where: { userId: me.id, productId: iphone.id },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.quantity).toBe(3);

    // Adding past the per-product cap is refused outright rather than clamped,
    // so a double-submitted form never silently re-prices the line.
    const overflow = await addProductAction({ productId: iphone.id, quantity: 99 });
    expect(overflow.ok).toBe(false);
    if (!overflow.ok) expect(overflow.fieldErrors?.quantity).toBeDefined();
    const after = await prisma.userProduct.findUnique({
      where: { userId_productId: { userId: me.id, productId: iphone.id } },
    });
    expect(after?.quantity).toBe(3);
  });

  it("sets exact quantities and records what was paid", async () => {
    const iphone = await product("iphone-17-pro-max");
    const set = await setQuantityAction({ productId: iphone.id, quantity: 2 });
    expect(set.ok).toBe(true);
    if (set.ok) expect(set.data.score).toBe(2 * 1_199);

    const repriced = await updateOwnedItemAction({
      productId: iphone.id,
      quantity: 2,
      pricePaidUSD: 900,
    });
    expect(repriced.ok).toBe(true);
    if (repriced.ok) {
      expect(repriced.data.score).toBe(1_800);
      expect(repriced.data.delta).toBe(1_800 - 2 * 1_199);
    }

    const activity = await getActivity(me.id, 1);
    expect(activity[0]?.type).toBe("REPRICE");
    expect(activity[0]?.quantityDelta).toBe(0);

    const reset = await updateOwnedItemAction({
      productId: iphone.id,
      quantity: 2,
      pricePaidUSD: null,
    });
    expect(reset.ok).toBe(true);
    if (reset.ok) expect(reset.data.score).toBe(2 * 1_199);
  });

  it("removes one unit at a time and then the whole product", async () => {
    const iphone = await product("iphone-17-pro-max");
    const one = await removeOneAction({ productId: iphone.id });
    expect(one.ok).toBe(true);
    if (one.ok) expect(one.data.productCount).toBe(1);

    const all = await removeProductAction({ productId: iphone.id });
    expect(all.ok).toBe(true);
    if (all.ok) {
      expect(all.data.score).toBe(0);
      expect(all.data.productCount).toBe(0);
      expect(all.data.rank).toBeNull();
    }
    expect(await getInventory(me.id)).toHaveLength(0);

    const missing = await removeOneAction({ productId: iphone.id });
    expect(missing.ok).toBe(false);
  });

  it("never lets one user touch another user's collection", async () => {
    const watch = await product("apple-watch-ultra-3");
    session.current = { id: other.id, username: other.username };
    const theirs = await addProductAction({ productId: watch.id, quantity: 1 });
    expect(theirs.ok).toBe(true);

    session.current = { id: me.id, username: me.username };
    const attempt = await setQuantityAction({ productId: watch.id, quantity: 0 });
    // The action only ever operates on the signed-in user's rows; nothing to remove here.
    expect(attempt.ok).toBe(true);

    const stillTheirs = await prisma.userProduct.findUnique({
      where: { userId_productId: { userId: other.id, productId: watch.id } },
    });
    expect(stillTheirs?.quantity).toBe(1);
  });

  it("keeps a score history that ends at the current score", async () => {
    const history = await getScoreHistory(me.id);
    expect(history[0]?.score).toBe(0);
    expect(history.at(-1)?.score).toBe(0);
    expect(history.length).toBeGreaterThan(2);
    for (let index = 1; index < history.length; index += 1) {
      expect(history[index]!.at.getTime()).toBeGreaterThanOrEqual(history[index - 1]!.at.getTime());
    }
  });

  it("completes onboarding with several products at once", async () => {
    const [mac, pods] = await Promise.all([product("macbook-air-13-m4"), product("airpods-pro-3")]);
    const result = await completeOnboardingAction({
      items: [
        { productId: mac.id, quantity: 1 },
        { productId: pods.id, quantity: 1 },
        { productId: pods.id, quantity: 1 },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.score).toBe(999 + 2 * 249);
    expect(result.data.productCount).toBe(3);

    const user = await prisma.user.findUnique({ where: { id: me.id } });
    expect(user?.onboardedAt).not.toBeNull();
  });
});

describe("social actions", () => {
  let me: Awaited<ReturnType<typeof createTestUser>>;
  let other: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    [me, other] = await Promise.all([createTestUser(), createTestUser()]);
    session.current = { id: me.id, username: me.username };
  });

  afterAll(async () => {
    await deleteTestUsers();
  });

  it("follows and unfollows, but never yourself", async () => {
    const self = await toggleFollowAction({ username: me.username });
    expect(self.ok).toBe(false);

    const follow = await toggleFollowAction({ username: other.username });
    expect(follow.ok).toBe(true);
    if (follow.ok) {
      expect(follow.data.following).toBe(true);
      expect(follow.data.followers).toBe(1);
    }

    const unfollow = await toggleFollowAction({ username: other.username });
    expect(unfollow.ok).toBe(true);
    if (unfollow.ok) expect(unfollow.data.following).toBe(false);

    const ghost = await toggleFollowAction({ username: "nobody_here_404" });
    expect(ghost.ok).toBe(false);
  });

  it("toggles wishlist entries", async () => {
    const vision = await product("apple-vision-pro-m5");
    const add = await toggleWishlistAction({ productId: vision.id });
    expect(add.ok).toBe(true);
    if (add.ok) expect(add.data.wished).toBe(true);

    const remove = await toggleWishlistAction({ productId: vision.id });
    expect(remove.ok).toBe(true);
    if (remove.ok) expect(remove.data.wished).toBe(false);
  });
});
