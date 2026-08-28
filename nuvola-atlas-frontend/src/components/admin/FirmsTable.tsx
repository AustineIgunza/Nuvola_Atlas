import { useState } from "react";
import { Building2, Users, Star } from "lucide-react";
import { FIRMS } from "@/api/firms";
import { BRAND } from "@/shared/lib/scoreColor";

/**
 * Firm-management surface. In mock mode reads from FIRMS fixture; when the
 * backend lands (Phase E migrations) this swaps for /admin/firms.
 */
export default function FirmsTable() {
  const [expanded, setExpanded] = useState<string | null>(FIRMS[0]?.id ?? null);

  const tierAccent: Record<"basic" | "deal" | "sovereign", string> = {
    basic: BRAND.steel,
    deal: BRAND.teal,
    sovereign: BRAND.gold,
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11.5px] text-ink-3">
          {FIRMS.length} firms · {FIRMS.reduce((a, f) => a + f.watchlist.length, 0)} zones under
          watch
        </div>
        <button
          disabled
          title="Create-firm workflow lands with the Phase E migrations"
          className="text-[11.5px] font-semibold text-ink-4 border border-border rounded-control px-2.5 h-7 cursor-not-allowed opacity-50"
        >
          + Create firm
        </button>
      </div>

      {FIRMS.map((f) => {
        const isOpen = expanded === f.id;
        return (
          <div
            key={f.id}
            className="rounded-card border border-border bg-[rgba(255,255,255,0.02)] overflow-hidden"
          >
            <button
              onClick={() => setExpanded(isOpen ? null : f.id)}
              className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-3.5 py-2.5 text-left hover:bg-[rgba(255,255,255,0.03)] transition-colors"
            >
              <div
                className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
                style={{ background: `${tierAccent[f.tier]}22`, color: tierAccent[f.tier] }}
              >
                <Building2 size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-ink-1 truncate">{f.name}</div>
                {/* Full contact only on sm+ — on mobile show contact name + zone count so nothing overflows */}
                <div className="text-[10px] text-ink-4 mt-0.5 truncate">
                  <span className="hidden sm:inline">
                    {f.contactName} · {f.contactEmail}
                  </span>
                  <span className="sm:hidden">
                    {f.contactName} · {f.watchlist.length} zones
                  </span>
                </div>
              </div>
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-[0.06em] shrink-0"
                style={{ background: `${tierAccent[f.tier]}22`, color: tierAccent[f.tier] }}
              >
                {f.tier}
              </span>
              {/* Watchlist count column only visible on sm+ — on mobile it's in the contact line */}
              <div className="hidden sm:flex items-center gap-1 text-[10.5px] text-ink-3 min-w-[80px] justify-end shrink-0">
                <Star size={11} /> {f.watchlist.length} zones
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-border p-3.5 bg-[rgba(255,255,255,0.02)] space-y-3">
                <div>
                  <div className="text-[9.5px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-1">
                    Investment thesis
                  </div>
                  <p className="text-[11.5px] text-ink-2 leading-relaxed">{f.thesis}</p>
                </div>
                <div>
                  <div className="text-[9.5px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-1.5">
                    Watchlist
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {f.watchlist.map((z) => (
                      <span
                        key={z}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-ink-2 bg-[rgba(255,255,255,0.05)]"
                      >
                        <Star size={9} className="opacity-60" />
                        {z}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-[10px] text-ink-4 break-all leading-relaxed">
                  <Users size={10} className="inline mr-1" />
                  Test logins:
                  <br className="sm:hidden" />
                  <span className="sm:ml-1">
                    investor+{f.slug}@navuuna.dev · investor-lead+{f.slug}@navuuna.dev
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
