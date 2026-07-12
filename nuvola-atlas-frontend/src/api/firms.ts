import type { AuthUser } from "@/stores/auth";

/**
 * Investor firms — mock parity with the future firms table on the backend.
 * Watchlists here map 1:1 to what the future firm_watchlists table will hold.
 *
 * Each firm carries three demo login emails (viewer / analyst / lead) so
 * different investor personas can be exercised without seed churn:
 *   - viewer:  investor+{slug}@navuuna.dev             → basic browse rights
 *   - analyst: investor-analyst+{slug}@navuuna.dev     → can add notes to watchlist
 *   - lead:    investor-lead+{slug}@navuuna.dev        → can edit watchlist
 * Password is not checked in mock — any value signs in.
 */
export interface FirmDef {
  id: string;
  slug: string;
  name: string;
  tier: "basic" | "deal" | "sovereign";
  watchlist: string[];
  thesis: string;
  contactName: string;
  contactEmail: string;
}

export const FIRMS: FirmDef[] = [
  {
    id: "firm-acumen",
    slug: "acumen",
    name: "Acumen East Africa",
    tier: "deal",
    watchlist: ["westlands", "kibra", "mathare", "kasarani"],
    thesis: "Impact-first blended finance. Peri-urban infra with strong social pillar prospects.",
    contactName: "Njoki Wanjiru",
    contactEmail: "njoki@acumen.example",
  },
  {
    id: "firm-andela",
    slug: "andela",
    name: "Andela Ventures",
    tier: "basic",
    watchlist: ["kasarani", "embakasi-east", "roysambu"],
    thesis: "Digital-first growth corridors. Weighting connectivity + density signals.",
    contactName: "Peter Ochieng",
    contactEmail: "peter@andelaventures.example",
  },
  {
    id: "firm-gcf",
    slug: "gcf",
    name: "GCF Nairobi Corridor",
    tier: "sovereign",
    watchlist: [
      "westlands", "dagoretti-north", "dagoretti-south", "langata", "kibra",
      "roysambu", "kasarani", "ruaraka", "embakasi-south", "embakasi-north",
      "embakasi-central", "embakasi-east", "embakasi-west", "makadara",
      "kamukunji", "starehe", "mathare",
    ],
    thesis: "County-wide corridor programme. Track every ward against SDG 9 + 11 mandate.",
    contactName: "Fatma Mohammed",
    contactEmail: "fatma@gcf.example",
  },
];

export function firmFromEmail(email: string): FirmDef | null {
  const lc = email.toLowerCase();
  for (const f of FIRMS) {
    if (
      lc === `investor+${f.slug}@navuuna.dev` ||
      lc === `investor-analyst+${f.slug}@navuuna.dev` ||
      lc === `investor-lead+${f.slug}@navuuna.dev`
    ) {
      return f;
    }
  }
  return null;
}

/**
 * Given an email that matches a firm, return the AuthUser.firm slice ready
 * to persist into the auth store. Never called for non-investor emails.
 */
export function firmSliceFor(firm: FirmDef): NonNullable<AuthUser["firm"]> {
  return {
    id: firm.id,
    name: firm.name,
    tier: firm.tier,
    watchlist: [...firm.watchlist],
  };
}
