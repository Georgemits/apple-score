import { expect, test, type Page } from "@playwright/test";

/**
 * The critical user journey, end to end against a production build:
 *
 *   sign up → welcome flow → add a product → score increases →
 *   product in collection → leaderboard shows the user → public profile →
 *   log out → log back in.
 *
 * Each run creates its own user so the suite is safe to re-run against a
 * shared database. The catalogue must be seeded.
 */

const PASSWORD = "playwright-pass-123";

function uniqueUsername() {
  return `e2e_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`.slice(
    0,
    20
  );
}

async function signUp(page: Page, username: string) {
  await page.goto("/signup");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Email").fill(`${username}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel(/confirm password/i).fill(PASSWORD);
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL(/\/(welcome|home)/, { timeout: 30_000 });
}

test.describe("critical journey", () => {
  test("sign up, add a product, see the score everywhere, log out and back in", async ({
    page,
  }) => {
    const username = uniqueUsername();

    await signUp(page, username);

    // The welcome flow can be skipped; the dashboard then shows a $0 score.
    if (page.url().includes("/welcome")) {
      await page.getByRole("button", { name: /skip/i }).click();
      await page.waitForURL(/\/home/);
    }
    await expect(page.getByText("$0").first()).toBeVisible();

    // Add an iPhone 17 Pro Max ($1,199) from the catalogue.
    await page.goto("/catalog");
    const search = page.getByRole("searchbox").first();
    await search.fill("iPhone 17 Pro Max");
    await page
      .getByRole("button", { name: /iPhone 17 Pro Max/ })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /^add/i }).click();
    await expect(page.getByText(/added/i).first()).toBeVisible();

    // Score increased on the dashboard.
    await page.goto("/home");
    await expect(page.getByText("$1,199").first()).toBeVisible();

    // Product appears in the collection.
    await page.goto("/collection");
    await expect(page.getByText("iPhone 17 Pro Max").first()).toBeVisible();

    // Leaderboard lists the user.
    await page.goto("/leaderboard");
    await expect(page.getByText(`@${username}`).first()).toBeVisible();

    // Public profile shows the score.
    await page.goto(`/u/${username}`);
    await expect(page.getByText("$1,199").first()).toBeVisible();

    // Share card renders.
    const card = await page.request.get(`/api/card/${username}?format=og`);
    expect(card.status()).toBe(200);
    expect(card.headers()["content-type"]).toContain("image/png");

    // Log out, then log back in.
    await page.goto("/home");
    await page.getByRole("button", { name: /account menu/i }).click();
    await page.getByRole("menuitem", { name: /log out/i }).click();
    await page.waitForURL(/\/$/);

    await page.goto("/login");
    await page.getByLabel("Email").fill(`${username}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();
    await page.waitForURL(/\/home/);
    await expect(page.getByText("$1,199").first()).toBeVisible();
  });

  test("protected routes redirect guests to login with a safe callback", async ({ page }) => {
    await page.goto("/collection");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fcollection/);
    await page.goto("/login?callbackUrl=https://evil.example");
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("unknown profiles respond with 404", async ({ page }) => {
    const response = await page.goto("/u/this_user_does_not_exist_404");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /home/i }).first()).toBeVisible();
  });

  test("public pages render for guests", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/leaderboard");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/band for band/i);
    await page.goto("/achievements");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/achievements/i);
  });
});
