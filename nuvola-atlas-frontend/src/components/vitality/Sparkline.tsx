import { scoreColor } from "@/lib/scoreColor";

interface Props {
  points: number[];
  width?: number;
  height?: number;
  color?: string;
}

export default function Sparkline({
  points,
  width = 80,
  height = 24,
  color,
}: Props) {
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * width,
    y: height - ((p - min) / range) * (height - 4) - 2,
  }));

  const d = coords
    .map((c, i) => (i === 0 ? `M${c.x},${c.y}` : `L${c.x},${c.y}`))
    .join(" ");

  const last = coords[coords.length - 1];
  const c = color ?? scoreColor(points[points.length - 1]);

  return (
    <svg width={width} height={height} className="block">
      <path d={d} fill="none" stroke={c} strokeWidth="1.5" opacity="0.6" />
      <circle cx={last.x} cy={last.y} r="2.5" fill={c} />
    </svg>
  );
}
