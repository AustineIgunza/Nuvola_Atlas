interface Props {
  name: string;
  score: number;
  x: number;
  y: number;
}

export default function HoverCard({ name, score, x, y }: Props) {
  return (
    <div
      className="fixed z-40 glass rounded-chip px-3 py-2 shadow-chrome pointer-events-none"
      style={{ left: x + 12, top: y - 10 }}
    >
      <div className="text-[13px] font-medium text-ink-1">{name}</div>
      <div className="text-[11px] text-ink-3 tabular-nums">Vitality {score}</div>
      <div className="text-[10px] text-ink-4 mt-0.5">Click for scorecard</div>
    </div>
  );
}
