import { describe, expect, it } from "vitest";

import {
  INDEX_ACRONYM,
  INDEX_ACRONYM_EXPANSION,
  INDEX_NAME_LONG,
  INDEX_NAME_SHORT,
} from "./branding";

describe("branding constants", () => {
  it("expands UE as Urban-Environmental", () => {
    // P7.2 in NAVUUNA_PROMPTS_ROUND2.md pinned the expansion. If this test
    // goes red because someone changed the label, take it to legal review
    // first — brand + trademark filings depend on the current spelling.
    expect(INDEX_ACRONYM).toBe("UE");
    expect(INDEX_ACRONYM_EXPANSION).toBe("Urban-Environmental");
    expect(INDEX_NAME_LONG).toBe("Urban-Environmental Vitality Index");
    expect(INDEX_NAME_SHORT).toBe("UE Vitality Index");
  });

  it("short form embeds the acronym", () => {
    expect(INDEX_NAME_SHORT).toContain(INDEX_ACRONYM);
  });

  it("long form embeds the expansion", () => {
    expect(INDEX_NAME_LONG).toContain(INDEX_ACRONYM_EXPANSION);
  });
});
