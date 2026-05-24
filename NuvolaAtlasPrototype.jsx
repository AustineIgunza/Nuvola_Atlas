import React, { useState, useEffect, useRef, useCallback } from "react";

/**
 * NUVOLA ATLAS — Frontend Prototype (design north star)
 * ------------------------------------------------------
 * Austine's deliverables, made concrete:
 *   1. Atlas map of Nairobi with 3 toggleable layers (Road Progress, Smart Grid, Density)
 *   2. Vitality Scorecard: one 0–100 score + 4 pillars, animated on zone change
 *
 * In the REAL build (Inertia + React inside Laravel 11):
 *   - Replace <StylizedMap> with Mapbox GL JS
 *   - Replace the easing helpers with Framer Motion springs
 *   - Replace MOCK_ZONES with the useLiveData() hook (Laravel Echo / Reverb)
 * The Zone data shape below is the contract to hand Khillon.
 */

// ----------------------------------------------------------------------------
// MOCK DATA  — mirror this exact shape on the backend (resources/js/mock/zones.ts)
// ----------------------------------------------------------------------------
const PILLAR_META = [
  { key: "socialWellbeing", label: "Social Wellbeing & Human Capital" },
  { key: "safetySecurity", label: "Safety & Security" },
  { key: "densityScaling", label: "Density & Scaling Dynamics" },
  { key: "infraEnvironmental", label: "Infrastructure & Environmental Safeguards" },
];

const MOCK_ZONES = [
  {
    id: "westlands",
    name: "Westlands",
    vitalityScore: 78,
    pillars: { socialWellbeing: 82, safetySecurity: 71, densityScaling: 64, infraEnvironmental: 80 },
    path: "M120,90 L250,70 L300,150 L240,210 L140,200 L100,140 Z",
    centroid: [195, 138],
  },
  {
    id: "starehe",
    name: "Starehe",
    vitalityScore: 64,
    pillars: { socialWellbeing: 60, safetySecurity: 55, densityScaling: 48, infraEnvironmental: 72 },
    path: "M300,150 L420,140 L450,230 L370,280 L300,250 L240,210 Z",
    centroid: [355, 210],
  },
  {
    id: "dagoretti",
    name: "Dagoretti",
    vitalityScore: 71,
    pillars: { socialWellbeing: 74, safetySecurity: 68, densityScaling: 70, infraEnvironmental: 66 },
    path: "M100,140 L140,200 L240,210 L300,250 L250,340 L120,330 L70,240 Z",
    centroid: [185, 270],
  },
  {
    id: "kasarani",
    name: "Kasarani",
    vitalityScore: 58,
    pillars: { socialWellbeing: 55, safetySecurity: 62, densityScaling: 44, infraEnvironmental: 60 },
    path: "M420,140 L540,160 L560,260 L470,320 L450,230 Z",
    centroid: [495, 225],
  },
  {
    id: "embakasi",
    name: "Embakasi",
    vitalityScore: 52,
    pillars: { socialWellbeing: 48, safetySecurity: 50, densityScaling: 38, infraEnvironmental: 64 },
    path: "M300,250 L370,280 L450,230 L470,320 L560,260 L540,380 L380,420 L250,340 Z",
    centroid: [410, 340],
  },
];

const LAYERS = [
  { key: "roadProgress", label: "Road Progress" },
  { key: "smartGrid", label: "Smart Grid Status" },
  { key: "density", label: "Density" },
];

// ----------------------------------------------------------------------------
// MOTION HELPER — count-up with "settle" easing (stand-in for a Framer spring)
// ----------------------------------------------------------------------------
function useCountUp(target, reduced) {
  const [value, setValue] = useState(reduced ? target : 0);
  const raf = useRef();
  useEffect(() => {
    if (reduced) { setValue(target); return; }
    const start = performance.now();
    const from = 0;
    const dur = 1100;
    const ease = (t) => 1 - Math.pow(1 - t, 4); // quartic ease-out, calm + Apple-ish
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      setValue(Math.round(from + (target - from) * ease(p)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, reduced]);
  return value;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = (e) => setReduced(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return reduced;
}

// ----------------------------------------------------------------------------
// SCORE RING
// ----------------------------------------------------------------------------
function VitalityRing({ score, reduced }) {
  const animated = useCountUp(score, reduced);
  const R = 76, C = 2 * Math.PI * R;
  const offset = C - (animated / 100) * C;
  const tone = score >= 70 ? "#1B9C6B" : score >= 55 ? "#C9A227" : "#C7603F";
  return (
    <div style={{ position: "relative", width: 200, height: 200 }}>
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="14" />
        <circle
          cx="100" cy="100" r={R} fill="none" stroke={tone} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
          style={{ transition: reduced ? "none" : "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 52, fontWeight: 600, letterSpacing: "-0.04em", color: "#1A1A18", lineHeight: 1 }}>
          {animated}
        </div>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
          color: "rgba(0,0,0,0.4)", marginTop: 6 }}>Vitality</div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// PILLAR BAR (staggered fill)
// ----------------------------------------------------------------------------
function PillarBar({ label, value, index, reduced }) {
  const [w, setW] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced) { setW(value); return; }
    setW(0);
    const t = setTimeout(() => setW(value), 120 + index * 110);
    return () => clearTimeout(t);
  }, [value, index, reduced]);
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "rgba(0,0,0,0.62)", fontWeight: 450, maxWidth: 220 }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A18", fontVariantNumeric: "tabular-nums" }}>{value}</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: "rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${w}%`, borderRadius: 999, background: "#1A1A18",
          transition: reduced ? "none" : "width 0.9s cubic-bezier(0.22,1,0.36,1)" }} />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// STYLIZED MAP  (placeholder for Mapbox GL JS)
// ----------------------------------------------------------------------------
function StylizedMap({ zones, selectedId, activeLayers, onSelect }) {
  return (
    <svg viewBox="0 0 640 480" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <pattern id="density" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.4" fill="rgba(199,96,63,0.55)" />
        </pattern>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="rgba(0,0,0,0.10)" />
        </filter>
      </defs>

      {zones.map((z) => {
        const selected = z.id === selectedId;
        return (
          <g key={z.id} onClick={() => onSelect(z.id)} style={{ cursor: "pointer" }}>
            <path d={z.path}
              fill={selected ? "rgba(27,156,107,0.16)" : "rgba(0,0,0,0.035)"}
              stroke={selected ? "#1B9C6B" : "rgba(0,0,0,0.16)"}
              strokeWidth={selected ? 2.5 : 1.2}
              filter={selected ? "url(#soft)" : undefined}
              style={{ transition: "fill 0.5s cubic-bezier(0.22,1,0.36,1), stroke 0.5s ease" }} />

            {/* Density layer overlay */}
            <path d={z.path} fill="url(#density)"
              style={{ opacity: activeLayers.density ? 1 : 0, transition: "opacity 0.6s ease", pointerEvents: "none" }} />

            {/* Road Progress overlay */}
            <path d={z.path} fill="none" stroke="#2C6FB0" strokeWidth="2" strokeDasharray="6 7"
              style={{ opacity: activeLayers.roadProgress ? 0.85 : 0, transition: "opacity 0.6s ease", pointerEvents: "none" }} />

            {/* Smart Grid overlay (node at centroid) */}
            <circle cx={z.centroid[0]} cy={z.centroid[1]} r="6" fill="#C9A227"
              style={{ opacity: activeLayers.smartGrid ? 1 : 0, transition: "opacity 0.6s ease", pointerEvents: "none" }} />
            <circle cx={z.centroid[0]} cy={z.centroid[1]} r="12" fill="none" stroke="#C9A227" strokeWidth="1.5"
              style={{ opacity: activeLayers.smartGrid ? 0.5 : 0, transition: "opacity 0.6s ease", pointerEvents: "none" }} />

            <text x={z.centroid[0]} y={z.centroid[1]} textAnchor="middle"
              style={{ fontSize: 13, fontWeight: 500, fill: selected ? "#0F5C3F" : "rgba(0,0,0,0.55)",
                pointerEvents: "none", transition: "fill 0.4s ease" }}>{z.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ----------------------------------------------------------------------------
// APP
// ----------------------------------------------------------------------------
export default function NuvolaAtlasPrototype() {
  const reduced = usePrefersReducedMotion();
  const [selectedId, setSelectedId] = useState("westlands");
  const [activeLayers, setActiveLayers] = useState({ roadProgress: false, smartGrid: false, density: false });
  const selected = MOCK_ZONES.find((z) => z.id === selectedId);

  const toggleLayer = useCallback((k) => setActiveLayers((s) => ({ ...s, [k]: !s[k] })), []);

  const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif';

  return (
    <div style={{ fontFamily: FONT, background: "#FAFAF7", color: "#1A1A18", minHeight: "100vh",
      display: "flex", flexDirection: "column" }}>
      <style>{`* { box-sizing: border-box; } button { font-family: inherit; }`}</style>

      {/* Header */}
      <header style={{ padding: "26px 34px 0", display: "flex", alignItems: "baseline", gap: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em" }}>Nuvola Atlas</h1>
        <span style={{ fontSize: 13, color: "rgba(0,0,0,0.4)", letterSpacing: "-0.01em" }}>
          Nairobi County · Spatial Intelligence
        </span>
      </header>

      <div style={{ display: "flex", gap: 24, padding: "22px 34px 34px", flexWrap: "wrap", flex: 1 }}>
        {/* MAP CARD */}
        <section style={{ flex: "1 1 540px", minWidth: 320 }}>
          {/* Layer toggles */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {LAYERS.map((l) => {
              const on = activeLayers[l.key];
              return (
                <button key={l.key} onClick={() => toggleLayer(l.key)}
                  style={{ border: "none", cursor: "pointer", padding: "9px 16px", borderRadius: 999,
                    fontSize: 13, fontWeight: 500, letterSpacing: "-0.01em",
                    background: on ? "#1A1A18" : "rgba(0,0,0,0.05)",
                    color: on ? "#FAFAF7" : "rgba(0,0,0,0.6)",
                    transition: "all 0.45s cubic-bezier(0.22,1,0.36,1)",
                    boxShadow: on ? "0 4px 14px rgba(0,0,0,0.18)" : "none" }}>
                  {l.label}
                </button>
              );
            })}
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: 26, padding: 18,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 18px 50px rgba(0,0,0,0.06)",
            aspectRatio: "4 / 3" }}>
            <StylizedMap zones={MOCK_ZONES} selectedId={selectedId}
              activeLayers={activeLayers} onSelect={setSelectedId} />
          </div>
          <p style={{ fontSize: 12, color: "rgba(0,0,0,0.35)", marginTop: 12, letterSpacing: "-0.01em" }}>
            Stylized map — replaced by Mapbox GL JS in the production build. Tap a zone to view its scorecard.
          </p>
        </section>

        {/* SCORECARD CARD */}
        <aside style={{ flex: "0 1 360px", minWidth: 300 }}>
          <div key={selectedId} style={{ background: "#FFFFFF", borderRadius: 26, padding: "30px 28px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 18px 50px rgba(0,0,0,0.06)",
            animation: reduced ? "none" : "rise 0.6s cubic-bezier(0.22,1,0.36,1)" }}>
            <style>{`@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }`}</style>

            <div style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase",
              color: "rgba(0,0,0,0.38)" }}>Sub-county</div>
            <h2 style={{ margin: "6px 0 22px", fontSize: 28, fontWeight: 600, letterSpacing: "-0.03em" }}>
              {selected.name}
            </h2>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
              <VitalityRing score={selected.vitalityScore} reduced={reduced} />
            </div>

            <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: 22 }}>
              {PILLAR_META.map((p, i) => (
                <PillarBar key={p.key} label={p.label} value={selected.pillars[p.key]}
                  index={i} reduced={reduced} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
