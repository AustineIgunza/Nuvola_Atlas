import { motion } from "framer-motion";
import { useUIStore } from "@/stores/ui";
import { scoreColor } from "@/lib/scoreColor";
import { springSettle } from "@/lib/motion";
import Legend from "./Legend";
import TimeScrubber from "./TimeScrubber";
import type { Zone } from "@/types";

const ZONE_POSITIONS: Record<string, { cx: number; cy: number; r: number }> = {
  westlands: { cx: 260, cy: 160, r: 38 },
  "dagoretti-north": { cx: 180, cy: 170, r: 34 },
  "dagoretti-south": { cx: 160, cy: 250, r: 32 },
  langata: { cx: 140, cy: 340, r: 40 },
  kibra: { cx: 240, cy: 280, r: 30 },
  roysambu: { cx: 360, cy: 110, r: 36 },
  kasarani: { cx: 420, cy: 140, r: 38 },
  ruaraka: { cx: 380, cy: 180, r: 30 },
  "embakasi-south": { cx: 440, cy: 320, r: 32 },
  "embakasi-north": { cx: 430, cy: 230, r: 34 },
  "embakasi-central": { cx: 400, cy: 280, r: 30 },
  "embakasi-east": { cx: 490, cy: 260, r: 36 },
  "embakasi-west": { cx: 360, cy: 310, r: 28 },
  makadara: { cx: 340, cy: 250, r: 28 },
  kamukunji: { cx: 300, cy: 220, r: 26 },
  starehe: { cx: 290, cy: 200, r: 30 },
  mathare: { cx: 330, cy: 170, r: 26 },
};

interface Props {
  zones: Zone[];
}

export default function MapFallback({ zones }: Props) {
  const selectedZoneId = useUIStore((s) => s.selectedZoneId);
  const setSelectedZone = useUIStore((s) => s.setSelectedZone);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-atlas-base overflow-hidden">
      <svg viewBox="0 0 600 500" className="w-full h-full max-w-[800px]">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {zones.map((z, i) => {
          const pos = ZONE_POSITIONS[z.id];
          if (!pos) return null;
          const selected = z.id === selectedZoneId;
          const color = scoreColor(z.score);
          const dimmed = selectedZoneId && !selected;

          return (
            <g key={z.id} onClick={() => setSelectedZone(z.id)} style={{ cursor: "pointer" }}>
              <motion.circle
                cx={pos.cx}
                cy={pos.cy}
                r={pos.r}
                fill={color}
                initial={{ fillOpacity: 0, r: 0 }}
                animate={{
                  fillOpacity: selected ? 0.3 : dimmed ? 0.05 : 0.12,
                  r: pos.r,
                  strokeWidth: selected ? 2 : 1,
                  strokeOpacity: selected ? 0.9 : dimmed ? 0.15 : 0.4,
                }}
                transition={{ delay: i * 0.03, ...springSettle }}
                stroke={color}
                filter={selected ? "url(#glow)" : undefined}
              />
              <motion.text
                x={pos.cx}
                y={pos.cy - 6}
                textAnchor="middle"
                className="pointer-events-none"
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  fill: dimmed ? "rgba(255,255,255,0.15)" : "rgba(200,205,214,0.8)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 + 0.2 }}
              >
                {z.name.length > 12 ? z.name.split(" ").slice(0, 2).join(" ") : z.name}
              </motion.text>
              <motion.text
                x={pos.cx}
                y={pos.cy + 9}
                textAnchor="middle"
                className="pointer-events-none tabular-nums"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  fill: dimmed ? "rgba(255,255,255,0.2)" : "#f4f6fa",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 + 0.25 }}
              >
                {z.score}
              </motion.text>
            </g>
          );
        })}
      </svg>

      {/* Notice */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-3 left-3 z-10 glass rounded-chip px-3 py-1.5"
      >
        <span className="text-[11px] text-ink-3">
          Map fallback - set VITE_MAPBOX_TOKEN for Mapbox
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute bottom-20 sm:bottom-16 left-3 sm:left-4 z-10"
      >
        <Legend />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10"
      >
        <TimeScrubber />
      </motion.div>
    </div>
  );
}
