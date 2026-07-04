import { useLayoutEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Corner } from "./CornerCard";

export interface ConnectorDef {
  corner: Corner;
  accent: string;
}

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>;
  cardsRef: React.MutableRefObject<(HTMLDivElement | null)[]>;
  defs: ConnectorDef[];
  zoneKey: string;
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  accent: string;
}

/** Thin brand-tinted lines from each corner card's inner corner toward the
 *  map centre, where the selected zone sits after the selection flyTo. */
export default function Connectors({ containerRef, cardsRef, defs, zoneKey }: Props) {
  const [lines, setLines] = useState<Line[]>([]);
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function measure() {
      const c = containerRef.current;
      if (!c || c.clientWidth === 0) return;
      const cx = c.clientWidth / 2;
      const cy = c.clientHeight / 2;
      const next: Line[] = [];
      defs.forEach((d, i) => {
        const el = cardsRef.current[i];
        if (!el) return;
        // offset* ignores framer transforms, so lines target resting positions.
        const x = d.corner === "tl" || d.corner === "bl" ? el.offsetLeft + el.offsetWidth : el.offsetLeft;
        const y = d.corner === "tl" || d.corner === "tr" ? el.offsetTop + el.offsetHeight : el.offsetTop;
        const dx = cx - x;
        const dy = cy - y;
        const dist = Math.hypot(dx, dy);
        if (dist < 90) return;
        const k = (dist - 70) / dist;
        next.push({ x1: x, y1: y, x2: x + dx * k, y2: y + dy * k, accent: d.accent });
      });
      setLines(next);
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    cardsRef.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneKey]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      {lines.map((l, i) => (
        <g key={i}>
          <motion.line
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={l.accent}
            strokeWidth={1.5}
            strokeDasharray="5 6"
            strokeLinecap="round"
            initial={reduce ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
            animate={reduce ? { opacity: 0.5 } : { pathLength: 1, opacity: 0.5 }}
            transition={{ delay: 0.25 + i * 0.07, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          />
          <motion.circle
            cx={l.x2}
            cy={l.y2}
            r={3}
            fill={l.accent}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.55 + i * 0.07, duration: 0.25 }}
          />
        </g>
      ))}
    </svg>
  );
}
