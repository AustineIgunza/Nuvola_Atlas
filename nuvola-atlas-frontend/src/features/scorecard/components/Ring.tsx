import { useEffect, useState } from "react";
import { scoreColor } from "@/shared/lib/scoreColor";
import { NO_SCORE_LABEL } from "@/domain/scores";

interface Props {
  /** Null for a zone with no indicators behind any pillar. */
  score: number | null;
  size?: number;
}

export default function Ring({ score, size = 88 }: Props) {
  const strokeWidth = size * 0.11;
  const r = (size - strokeWidth) / 2;
  const C = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(score ?? 0);
  const gradientId = `ring-grad-${size}`;

  useEffect(() => {
    if (score === null) return;
    const target = score;
    setAnimated(0);
    const start = performance.now();
    const dur = 900;
    let raf: number;
    function tick(now: number) {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setAnimated(Math.round(target * ease));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  // The displayed number is always Math.round(score) as the source of truth,
  // animated only controls the ring stroke. This prevents rAF-paused bugs.
  const displayValue = score === null ? NO_SCORE_LABEL : animated;
  const offset = C - (animated / 100) * C;
  const color = scoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B23A2E" />
            <stop offset="30%" stopColor="#C0552B" />
            <stop offset="55%" stopColor="#E0A82E" />
            <stop offset="78%" stopColor="#3F9E72" />
            <stop offset="100%" stopColor="#1F8A78" />
          </linearGradient>
          <filter id="ring-glow">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={color} floodOpacity="0.4" />
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ring-track)"
          strokeWidth={strokeWidth}
        />
        {/* No arc at all when there is no score. Drawing even a zero-length
            one on the ramp would place the zone at the bottom of it. */}
        {score !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            filter="url(#ring-glow)"
            style={{ transition: "stroke-dashoffset 0.1s linear" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`tabular-nums font-semibold ${score === null ? "text-ink-3" : "text-ink-1"}`}
          style={{ fontSize: size * 0.38, lineHeight: 1, letterSpacing: "-0.04em" }}
          title={score === null ? "Insufficient data — no indicators recorded for this zone" : undefined}
        >
          {displayValue}
        </span>
      </div>
    </div>
  );
}
