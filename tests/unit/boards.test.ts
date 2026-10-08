import { describe, expect, it } from "vitest";
import { BOARDS, DEFAULT_BOARD, getBoardDefinition } from "@/lib/leaderboard";
import { CATEGORIES, CATEGORY_SLUG, categoryFromSlug } from "@/lib/categories";

describe("board definitions", () => {
  it("have unique keys and complete copy", () => {
    const keys = new Set(BOARDS.map((board) => board.key));
    expect(keys.size).toBe(BOARDS.length);
    for (const board of BOARDS) {
      expect(board.label.length).toBeGreaterThan(0);
      expect(board.description.length).toBeGreaterThan(0);
      expect(board.emoji.length).toBeGreaterThan(0);
      expect(["score", "units", "biggest"]).toContain(board.metric);
    }
  });

  it("fall back to the overall board for unknown keys", () => {
    expect(getBoardDefinition("overall")).toBe(DEFAULT_BOARD);
    expect(getBoardDefinition("nope")).toBe(DEFAULT_BOARD);
    expect(getBoardDefinition(null)).toBe(DEFAULT_BOARD);
    expect(getBoardDefinition("iphone").filter.category).toBe("IPHONE");
    expect(getBoardDefinition("vintage").filter.legacy).toBe(true);
    expect(getBoardDefinition("following").requiresViewer).toBe(true);
  });
});

describe("category slugs", () => {
  it("round-trip for every category", () => {
    for (const category of CATEGORIES) {
      expect(categoryFromSlug(CATEGORY_SLUG[category])).toBe(category);
    }
    expect(categoryFromSlug("nope")).toBeNull();
  });
});
