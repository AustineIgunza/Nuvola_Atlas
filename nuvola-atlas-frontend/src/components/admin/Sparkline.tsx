import { useId, useMemo } from "react";
import { cn } from "@/lib/cn";

interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  className?: string;
  ariaLabel?: string;
}

export default function Sparkline({
  data,
  width = 96,
  height = 28,
  color = "#C0552B",
  fillOpacity = 0.18,
  strokeWidth = 1.5,
  className,
  ariaLabel,
}: Props) {
  const id = useId();
  const gradientId = `spark-${id}`;

  const paths = useMemo(() => {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const span = Math.max(1, max - min);
    const padY = 2;
    const innerH = height - padY * 2;
    const step = data.length > 1 ? width / (data.length - 1) : 0;

    const points = data.map((v, i) => {
      const x = data.length > 1 ? i * step : width / 2;
      const y = padY + innerH - ((v - min) / span) * innerH;
      return [x, y] as const;
    });

    const stroke = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
    const area = `${stroke} L${width.toFixed(2)},${height} L0,${height} Z`;

    return { stroke, area };
  }, [data, height, width]);

  if (!paths) {
    return (
      <svg
        width={width}
        height={height}
        className={cn("block", className)}
        role={ariaLabel ? "img" : undefined}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("block overflow-visible", className)}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={paths.area} fill={`url(#${gradientId})`} />
      <path
        d={paths.stroke}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
