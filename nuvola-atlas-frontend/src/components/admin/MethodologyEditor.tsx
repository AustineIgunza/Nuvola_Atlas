import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, RotateCcw, Save, Scale } from "lucide-react";
import { api } from "@/api";
import { BRAND, PILLAR_COLORS, PILLAR_LABELS, PILLAR_SHORT } from "@/lib/scoreColor";
import type { PillarKey, Zone } from "@/types";

/**
 * Methodology editor — sliders for pillar weights + a live diff preview
 * against the current zones so admins see what a publish would do before
 * pressing the button. In mock mode this is client-only; when the Phase E
 * migrations land it POSTs to /admin/methodology and /publish.
 */
const PILLAR_KEYS: PillarKey[] = ["social", "safety", "density", "infra"];

interface Weights {
  social: number;
  safety: number;
  density: number;
  infra: number;
}

const CURRENT_WEIGHTS: Weights = { social: 0.25, safety: 0.25, density: 0.25, infra: 0.25 };

export default function MethodologyEditor() {
  const { data: zones = [] } = useQuery({ queryKey: ["zones"], queryFn: api.getZones });

  const [draft, setDraft] = useState<Weights>({ ...CURRENT_WEIGHTS });
  const [confirmToken, setConfirmToken] = useState("");
  const [saved, setSaved] = useState(false);

  const weightsSum = draft.social + draft.safety + draft.density + draft.infra;
  const normalized = weightsSum > 0
    ? {
        social: draft.social / weightsSum,
        safety: draft.safety / weightsSum,
        density: draft.density / weightsSum,
        infra: draft.infra / weightsSum,
      }
    : CURRENT_WEIGHTS;

  const changed = PILLAR_KEYS.some((k) => normalized[k].toFixed(3) !== CURRENT_WEIGHTS[k].toFixed(3));

  // Projected score under proposed weights = sum(pillar * proposed weight).
  // Zone.score is already the current-weights composite, so we just recompute.
  const projected = useMemo(() =>
    zones.map((z: Zone) => {
      const nextScore = Math.round(
        z.pillars.social * normalized.social +
          z.pillars.safety * normalized.safety +
          z.pillars.density * normalized.density +
          z.pillars.infra * normalized.infra,
      );
      return { z, currentScore: z.score, nextScore, delta: nextScore - z.score };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
  [zones, normalized]);

  const canPublish = changed && confirmToken.trim().toLowerCase() === "publish";

  const publish = () => {
    if (!canPublish) return;
    // Mock — no wire call. Backend controller lands in Phase E.
    setSaved(true);
    setConfirmToken("");
    window.setTimeout(() => setSaved(false), 2400);
  };

  const reset = () => {
    setDraft({ ...CURRENT_WEIGHTS });
    setConfirmToken("");
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      {/* Weights column */}
      <section className="rounded-card border border-border bg-[rgba(255,255,255,0.02)] p-3.5">
        <div className="flex items-center gap-2 mb-3">
          <Scale size={13} style={{ color: BRAND.teal }} />
          <h3 className="text-[13px] font-semibold text-ink-1">Pillar weights</h3>
          <span className="ml-auto text-[10px] text-ink-4 tabular-nums">
            Sum {weightsSum.toFixed(2)}
          </span>
        </div>

        <div className="space-y-3">
          {PILLAR_KEYS.map((k) => (
            <div key={k}>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: PILLAR_COLORS[k] }}
                />
                <span className="text-[10.5px] font-medium text-ink-2 flex-1 truncate">
                  {PILLAR_LABELS[k]}
                </span>
                <span className="text-[11px] font-semibold tabular-nums" style={{ color: PILLAR_COLORS[k] }}>
                  {(normalized[k] * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={draft[k]}
                onChange={(e) => setDraft({ ...draft, [k]: Number(e.target.value) })}
                className="w-full accent-accent"
                aria-label={`${PILLAR_LABELS[k]} weight`}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-border">
          <div className="text-[10px] text-ink-4 mb-1.5">Confirmation</div>
          <input
            value={confirmToken}
            onChange={(e) => setConfirmToken(e.target.value)}
            placeholder='Type "publish" to enable'
            className="w-full rounded-control bg-[rgba(255,255,255,0.04)] border border-border px-2.5 py-1.5 text-[11.5px] text-ink-1 placeholder-ink-4 focus:outline-none focus:border-[rgba(255,255,255,0.16)]"
            disabled={!changed}
          />
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={publish}
              disabled={!canPublish}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-control bg-accent text-white text-[11.5px] font-semibold disabled:opacity-40 hover:brightness-110 btn-press"
            >
              <Save size={12} /> Publish v1.1.0
            </button>
            <button
              onClick={reset}
              disabled={!changed}
              className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-control bg-[rgba(255,255,255,0.04)] border border-border text-[11.5px] text-ink-3 disabled:opacity-40 btn-press"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>
          {saved && (
            <div className="mt-2 text-[10.5px]" style={{ color: BRAND.teal }}>
              Preview saved locally. Publish to production will queue a RecalculateAllZones job once the Phase E migrations ship.
            </div>
          )}
          {changed && !saved && (
            <div className="mt-2 flex items-start gap-1.5 text-[10px] text-ink-4">
              <AlertTriangle size={10} className="shrink-0 mt-0.5" style={{ color: BRAND.gold }} />
              <span>
                A publish creates a new methodology_versions row and recomputes every zone. Snapshots under the previous version are preserved.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Diff column */}
      <section className="rounded-card border border-border bg-[rgba(255,255,255,0.02)] p-3.5">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-[13px] font-semibold text-ink-1">Live diff · projected scores</h3>
          <span className="ml-auto text-[10.5px] text-ink-4">
            {changed
              ? `${projected.filter((p) => p.delta !== 0).length} zones would move`
              : "No change from current weights"}
          </span>
        </div>

        <div className="max-h-[520px] overflow-x-auto overflow-y-auto">
          <table className="w-full text-[10.5px] sm:text-[11px] min-w-[420px]">
            <thead>
              <tr className="text-ink-4 text-left">
                <th className="px-2 py-1.5 font-medium">Zone</th>
                {PILLAR_KEYS.map((k) => (
                  <th key={k} className="px-1.5 py-1.5 font-medium text-center">
                    {PILLAR_SHORT[k]}
                  </th>
                ))}
                <th className="px-2 py-1.5 font-medium text-right">Now</th>
                <th className="px-2 py-1.5 font-medium text-right">Next</th>
                <th className="px-2 py-1.5 font-medium text-right">Δ</th>
              </tr>
            </thead>
            <tbody>
              {projected.map(({ z, currentScore, nextScore, delta }) => {
                const dColor = delta > 0 ? BRAND.teal : delta < 0 ? BRAND.rose : "rgba(255,255,255,0.4)";
                return (
                  <tr key={z.id} className="border-t border-border">
                    <td className="px-2 py-1.5 text-ink-1 font-medium">{z.name}</td>
                    {PILLAR_KEYS.map((k) => (
                      <td key={k} className="px-1.5 py-1.5 text-center tabular-nums text-ink-3">
                        {z.pillars[k]}
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-right tabular-nums text-ink-2">{currentScore}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-ink-1 font-semibold">{nextScore}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-semibold" style={{ color: dColor }}>
                      {delta > 0 ? "+" : ""}{delta}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
