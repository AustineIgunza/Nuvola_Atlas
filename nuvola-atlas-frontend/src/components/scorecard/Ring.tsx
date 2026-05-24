import { useEffect, useState } from "react";
import { scoreColor, SCORE_GRADIENT_CSS } from "@/lib/scoreColor";

interface Props {
  score: number;
  size?: number;
}

export default function Ring({ score, size = 88 }: Props) {
  const strokeWidth = size * 0.11;
  const r = (size - strokeWidth) / 2;
  const C = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(score);
  const gradientId = `ring-grad-${size}`;

  useEffect(() => {
    setAnimated(0);
    const start = performance.now();
    const dur = 900;
    let raf: number;
    function tick(now: number) {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setAnimated(Math.round(score * ease));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  // The displayed number is always Math.round(score) as the source of truth,
  // animated only controls the ring stroke. This prevents rAF-paused bugs.
  const displayValue = animated;
  const offset = C - (animated / 100) * C;
  const color = scoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff5d5d" />
            <stop offset="25%" stopColor="#ff9a3c" />
            <stop offset="50%" stopColor="#ffd23c" />
            <stop offset="75%" stopColor="#8de26a" />
            <stop offset="100%" stopColor="#34c97a" />
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
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
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
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="tabular-nums font-semibold text-ink-1"
          style={{ fontSize: size * 0.38, lineHeight: 1, letterSpacing: "-0.04em" }}
        >
          {displayValue}
        </span>
      </div>
    </div>
  );
}
