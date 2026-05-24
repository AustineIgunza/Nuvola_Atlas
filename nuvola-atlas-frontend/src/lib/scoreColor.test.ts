import { describe, it, expect } from "vitest";
import { scoreColor, scoreColorHex } from "./scoreColor";

describe("scoreColor", () => {
  it("returns red-ish for score 0", () => {
    expect(scoreColor(0)).toBe("rgb(255,93,93)");
  });

  it("returns green-ish for score 100", () => {
    expect(scoreColor(100)).toBe("rgb(52,201,122)");
  });

  it("returns yellow-ish for score 50", () => {
    expect(scoreColor(50)).toBe("rgb(255,210,60)");
  });

  it("interpolates between stops", () => {
    const c = scoreColor(75);
    expect(c).toBe("rgb(141,226,106)");
  });

  it("clamps below 0", () => {
    expect(scoreColor(-10)).toBe("rgb(255,93,93)");
  });

  it("clamps above 100", () => {
    expect(scoreColor(120)).toBe("rgb(52,201,122)");
  });
});

describe("scoreColorHex", () => {
  it("returns hex for score 0", () => {
    expect(scoreColorHex(0)).toBe("#ff5d5d");
  });

  it("returns hex for score 100", () => {
    expect(scoreColorHex(100)).toBe("#34c97a");
  });
});
