import { describe, it, expect } from "vitest";
import { ZONES } from "@/api/fixtures";
import { waterProfile, type WaterProfile } from "./waterSanitation";

const byId = (id: string) => {
  const z = ZONES.find((zone) => zone.id === id);
  if (!z) throw new Error(`fixture zone ${id} missing`);
  return z;
};

// The public signature returns `WaterProfile | null` to cover sub-counties
// with no water & sanitation reading. Every fixture zone has one, so a null
// here is a test regression — assert-and-narrow.
const profileOf = (id: string): WaterProfile => {
  const p = waterProfile(byId(id));
  if (!p) throw new Error(`fixture zone ${id} unexpectedly has no water profile`);
  return p;
};

describe("waterProfile — Clean Water & Sanitation (SDG 6)", () => {
  it("flags informal settlements as decentralized-sanitation opportunities", () => {
    const kibra = profileOf("kibra");
    expect(kibra.context).toBe("informal");
    expect(kibra.sewerViable).toBe(false);
    expect(kibra.opportunity).toBe(true);
    // Named ground-truth override applied.
    expect(kibra.solutionTag).toBe("Container-based + FSM");
    expect(kibra.solution.toLowerCase()).toContain("faecal-sludge");

    const mathare = profileOf("mathare");
    expect(mathare.context).toBe("informal");
    expect(mathare.opportunity).toBe(true);
    expect(mathare.rationale.toLowerCase()).toContain("flood");
  });

  it("recommends conventional sewerage only where the trunk network is in reach", () => {
    const westlands = profileOf("westlands");
    expect(westlands.context).toBe("established");
    expect(westlands.sewerViable).toBe(true);
    expect(westlands.opportunity).toBe(false);
    expect(westlands.solutionTag).toBe("Sewer extension");
  });

  it("classifies low-coverage peri-urban zones as DEWATS opportunities", () => {
    const p = profileOf("embakasi-south");
    expect(p.context).toBe("peri-urban");
    expect(p.sewerViable).toBe(false);
    expect(p.opportunity).toBe(true);
    expect(p.solutionTag).toBe("DEWATS + desludging");
  });

  it("keeps every zone's need within bounds and always names a solution", () => {
    for (const z of ZONES) {
      const p = waterProfile(z);
      // Fixture zones all carry a water reading, so a null profile is a signal
      // that something regressed in the fixture data itself.
      expect(p).not.toBeNull();
      if (!p) continue;
      expect(p.needPct).toBeGreaterThanOrEqual(0);
      expect(p.needPct).toBeLessThanOrEqual(100);
      expect(p.solution.length).toBeGreaterThan(0);
      expect(p.rationale.length).toBeGreaterThan(0);
      // Opportunity zones are exactly the non-sewer-viable ones.
      expect(p.opportunity).toBe(!p.sewerViable);
    }
  });

  it("inverts the measured pillar rather than composing a second weighting", () => {
    const westlands = byId("westlands");
    const p = profileOf("westlands");
    expect(p.needPct).toBe(100 - westlands.pillars.water_sanitation!);
  });

  it("returns null when the water & sanitation pillar has no reading", () => {
    const seed = byId("westlands");
    const stripped = {
      ...seed,
      pillars: { ...seed.pillars, water_sanitation: null },
    };
    expect(waterProfile(stripped)).toBeNull();
  });
});
