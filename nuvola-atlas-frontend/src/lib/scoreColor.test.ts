import { describe, it, expect } from "vitest";
import { scoreColor, scoreColorHex } from "./scoreColor";

describe("scoreColor", () => {
  it("returns brick-ish for score 0", () => {
    expect(scoreColor(0)).toBe("rgb(178,58,46)");
  });

  it("returns teal-ish for score 100", () => {
    expect(scoreColor(100)).toBe("rgb(31,138,120)");
  });

  it("returns gold-ish for score 50", () => {
    expect(scoreColor(50)).toBe("rgb(218,151,45)");
  });

  it("interpolates between stops", () => {
    const c = scoreColor(75);
    expect(c).toBe("rgb(84,159,105)");
  });

  it("clamps below 0", () => {
    expect(scoreColor(-10)).toBe("rgb(178,58,46)");
  });

  it("clamps above 100", () => {
    expect(scoreColor(120)).toBe("rgb(31,138,120)");
  });
});

describe("scoreColorHex", () => {
  it("returns hex for score 0", () => {
    expect(scoreColorHex(0)).toBe("#b23a2e");
  });

  it("returns hex for score 100", () => {
    expect(scoreColorHex(100)).toBe("#1f8a78");
  });
});
