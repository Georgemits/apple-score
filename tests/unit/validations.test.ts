import { describe, expect, it } from "vitest";
import {
  addProductSchema,
  loginSchema,
  onboardingSchema,
  profileSchema,
  signupSchema,
  updateOwnedItemSchema,
  usernameSchema,
} from "@/lib/validations";
import { familyOf } from "@/lib/families";
import {
  formatCompactUSD,
  formatRelative,
  formatSignedUSD,
  formatUSD,
  hueFromString,
  initials,
  ordinal,
  safeCallbackUrl,
} from "@/lib/utils";

describe("username", () => {
  it("normalises to lower case and enforces the pattern", () => {
    expect(usernameSchema.parse("  GeorgeMits ")).toBe("georgemits");
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse("has space").success).toBe(false);
    expect(usernameSchema.safeParse("émoji").success).toBe(false);
    expect(usernameSchema.safeParse("a".repeat(21)).success).toBe(false);
  });

  it("rejects reserved handles that would collide with routes", () => {
    for (const reserved of ["admin", "Apple", "settings", "leaderboard", "api"]) {
      expect(usernameSchema.safeParse(reserved).success).toBe(false);
    }
  });
});

describe("signup and login", () => {
  it("requires matching passwords of a sensible length", () => {
    const base = { username: "tim", email: "Tim@Example.com", password: "password123" };
    expect(signupSchema.safeParse({ ...base, confirmPassword: "password123" }).success).toBe(true);
    expect(signupSchema.parse({ ...base, confirmPassword: "password123" }).email).toBe(
      "tim@example.com"
    );
    expect(signupSchema.safeParse({ ...base, confirmPassword: "nope" }).success).toBe(false);
    expect(
      signupSchema.safeParse({ ...base, password: "short", confirmPassword: "short" }).success
    ).toBe(false);
  });

  it("validates login fields", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });
});

describe("inventory input", () => {
  it("coerces and bounds quantities", () => {
    expect(addProductSchema.parse({ productId: "p", quantity: "3" }).quantity).toBe(3);
    expect(addProductSchema.safeParse({ productId: "p", quantity: 0 }).success).toBe(false);
    expect(addProductSchema.safeParse({ productId: "p", quantity: 100 }).success).toBe(false);
    expect(addProductSchema.safeParse({ productId: "p", quantity: 1.5 }).success).toBe(false);
  });

  it("keeps a null price distinct from zero", () => {
    expect(
      updateOwnedItemSchema.parse({ productId: "p", quantity: 1, pricePaidUSD: null }).pricePaidUSD
    ).toBeNull();
    expect(
      updateOwnedItemSchema.parse({ productId: "p", quantity: 1, pricePaidUSD: "0" }).pricePaidUSD
    ).toBe(0);
    expect(
      updateOwnedItemSchema.safeParse({ productId: "p", quantity: 1, pricePaidUSD: -1 }).success
    ).toBe(false);
    expect(
      updateOwnedItemSchema.safeParse({ productId: "p", quantity: 1, pricePaidUSD: 60_000 }).success
    ).toBe(false);
  });

  it("limits onboarding batches", () => {
    const items = Array.from({ length: 13 }, (_, index) => ({
      productId: `p${index}`,
      quantity: 1,
    }));
    expect(onboardingSchema.safeParse({ items }).success).toBe(false);
    expect(onboardingSchema.safeParse({ items: items.slice(0, 12) }).success).toBe(true);
  });
});

describe("profile input", () => {
  it("accepts a single emoji and empties to null", () => {
    const parsed = profileSchema.parse({
      displayName: "  ",
      bio: "hi",
      avatarEmoji: "🍎",
      avatarHue: "215",
      isPublic: true,
    });
    expect(parsed.displayName).toBeNull();
    expect(parsed.avatarEmoji).toBe("🍎");
    expect(parsed.avatarHue).toBe(215);
    expect(
      profileSchema.safeParse({
        displayName: "",
        bio: "",
        avatarEmoji: "ab",
        avatarHue: null,
        isPublic: true,
      }).success
    ).toBe(false);
    expect(
      profileSchema.safeParse({
        displayName: "",
        bio: "",
        avatarEmoji: "👩‍💻",
        avatarHue: null,
        isPublic: false,
      }).success
    ).toBe(true);
    expect(
      profileSchema.safeParse({
        displayName: "",
        bio: "x".repeat(161),
        avatarEmoji: "",
        avatarHue: null,
        isPublic: true,
      }).success
    ).toBe(false);
  });
});

describe("families", () => {
  it("derives product lines from names", () => {
    expect(familyOf("iPhone 17 Pro Max", "IPHONE")).toBe("iPhone Pro");
    expect(familyOf("iPhone Air", "IPHONE")).toBe("iPhone");
    expect(familyOf("iPhone SE (3rd generation)", "IPHONE")).toBe("iPhone SE");
    expect(familyOf('MacBook Pro 16" (M4 Max)', "MAC")).toBe("MacBook Pro");
    expect(familyOf("Mac Studio (M3 Ultra)", "MAC")).toBe("Mac Studio");
    expect(familyOf("Apple Watch Series 11", "WATCH")).toBe("Apple Watch");
    expect(familyOf("Apple Watch SE (2nd generation)", "WATCH")).toBe("Apple Watch SE");
    expect(familyOf("Apple Watch Ocean Band", "ACCESSORY")).toBe("Watch Bands");
    expect(familyOf("Apple Watch Magnetic Fast Charger", "ACCESSORY")).toBe("Power & Cables");
    expect(familyOf("AirPods Max (USB-C)", "AIRPODS")).toBe("AirPods Max");
    expect(familyOf("Twentieth Anniversary Macintosh", "MAC")).toBe("Macintosh");
    expect(familyOf("Something New", "DISPLAY")).toBe("Displays");
  });
});

describe("formatting helpers", () => {
  it("prints dollars", () => {
    expect(formatUSD(12_482)).toBe("$12,482");
    expect(formatUSD(0)).toBe("$0");
    expect(formatCompactUSD(999)).toBe("$999");
    expect(formatCompactUSD(18_492)).toBe("$18.5K");
    expect(formatCompactUSD(1_250_000)).toBe("$1.25M");
    expect(formatSignedUSD(1_599)).toBe("+$1,599");
    expect(formatSignedUSD(-250)).toBe("−$250");
    expect(formatSignedUSD(0)).toBe("$0");
  });

  it("formats ordinals, initials, hues and relative times", () => {
    expect(ordinal(1)).toBe("1st");
    expect(ordinal(2)).toBe("2nd");
    expect(ordinal(3)).toBe("3rd");
    expect(ordinal(11)).toBe("11th");
    expect(ordinal(22)).toBe("22nd");
    expect(initials("georgemits")).toBe("GE");
    expect(initials("george_mits")).toBe("GM");
    expect(hueFromString("tim")).toBe(hueFromString("tim"));
    expect(hueFromString("tim")).toBeLessThan(360);
    const now = new Date("2026-10-08T12:00:00Z");
    expect(formatRelative(new Date("2026-10-08T11:59:50Z"), now)).toBe("just now");
    expect(formatRelative(new Date("2026-10-08T11:30:00Z"), now)).toBe("30 minutes ago");
    expect(formatRelative(new Date("2026-10-05T12:00:00Z"), now)).toBe("3 days ago");
    expect(formatRelative(new Date("2026-09-20T12:00:00Z"), now)).toBe("3 weeks ago");
  });
});

describe("safe redirects", () => {
  it("only allows same-origin paths", () => {
    expect(safeCallbackUrl("/collection?x=1")).toBe("/collection?x=1");
    expect(safeCallbackUrl("https://evil.example")).toBe("/home");
    expect(safeCallbackUrl("//evil.example")).toBe("/home");
    expect(safeCallbackUrl("/\\evil.example")).toBe("/home");
    expect(safeCallbackUrl("javascript:alert(1)")).toBe("/home");
    expect(safeCallbackUrl(null)).toBe("/home");
    expect(safeCallbackUrl("", "/x")).toBe("/x");
  });
});
