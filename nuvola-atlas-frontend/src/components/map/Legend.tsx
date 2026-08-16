import { SCORE_GRADIENT_CSS } from "@/lib/scoreColor";

export default function Legend() {
  return (
    <div className="glass rounded-card px-4 py-3 shadow-legend w-[220px]">
      <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.08em] mb-2">
        Vitality Index
      </div>
      <div className="h-2 rounded-full mb-1.5" style={{ background: SCORE_GRADIENT_CSS }} />
      <div className="flex justify-between text-[10px] text-ink-4 tabular-nums">
        <span>Low risk-ready</span>
        <span>50</span>
        <span>Investment-ready</span>
      </div>
    </div>
  );
}
