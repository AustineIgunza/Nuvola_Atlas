import { useQuery } from "@tanstack/react-query";
import { useUIStore } from "@/stores/ui";
import { api } from "@/api";

export default function TimeScrubber() {
  const scrubMonthIdx = useUIStore((s) => s.scrubMonthIdx);
  const setScrubMonth = useUIStore((s) => s.setScrubMonth);

  const { data: history } = useQuery({
    queryKey: ["history"],
    queryFn: api.getHistory,
  });

  if (!history) return null;

  const current = history[scrubMonthIdx] ?? history[history.length - 1];

  return (
    <div className="glass rounded-card px-5 py-3 shadow-chrome w-[480px] max-w-[calc(100vw-2rem)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-ink-2">{current.month}</span>
        <span className="text-[11px] text-ink-4 tabular-nums">
          Avg vitality: {Math.round(current.overallAvg)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={history.length - 1}
        value={scrubMonthIdx}
        onChange={(e) => setScrubMonth(Number(e.target.value))}
        className="w-full h-1 appearance-none bg-[rgba(255,255,255,0.1)] rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-chrome"
        aria-label="Time scrubber"
      />
      <div className="flex justify-between mt-1">
        {history.map((h, i) => (
          <span
            key={i}
            className="text-[8px] text-ink-4 tabular-nums"
            style={{ opacity: i % 3 === 0 ? 1 : 0 }}
          >
            {h.month}
          </span>
        ))}
      </div>
    </div>
  );
}
