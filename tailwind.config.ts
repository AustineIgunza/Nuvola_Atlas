import type { Config } from "tailwindcss";

/**
 * Design tokens extracted from NuvolaAtlasPrototype.jsx
 */
const config: Config = {
  content: ["./resources/js/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        atlas: {
          bg: "#FAFAF7",
          ink: "#1A1A18",
          "ink-soft": "rgba(0,0,0,0.62)",
          "ink-muted": "rgba(0,0,0,0.4)",
          "ink-faint": "rgba(0,0,0,0.35)",
          border: "rgba(0,0,0,0.07)",
          surface: "#FFFFFF",
        },
        vitality: {
          green: "#1B9C6B",
          "green-dark": "#0F5C3F",
          amber: "#C9A227",
          terracotta: "#C7603F",
        },
        layer: {
          road: "#2C6FB0",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"Helvetica Neue"',
          "sans-serif",
        ],
      },
      fontSize: {
        title: ["22px", { lineHeight: "1.2", letterSpacing: "-0.03em", fontWeight: "600" }],
        heading: ["28px", { lineHeight: "1.15", letterSpacing: "-0.03em", fontWeight: "600" }],
        score: ["52px", { lineHeight: "1", letterSpacing: "-0.04em", fontWeight: "600" }],
        "label-sm": ["13px", { lineHeight: "1.4", fontWeight: "450" }],
        "label-xs": ["12px", { lineHeight: "1.4", letterSpacing: "0.16em", fontWeight: "400" }],
        "label-vitality": ["11px", { lineHeight: "1.4", letterSpacing: "0.18em", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "400" }],
        "pillar-value": ["14px", { lineHeight: "1.4", fontWeight: "600" }],
      },
      borderRadius: {
        card: "26px",
        pill: "999px",
      },
      spacing: {
        "page-x": "34px",
        "page-t": "26px",
        "card-map": "18px",
        "card-score-x": "28px",
        "card-score-y": "30px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 18px 50px rgba(0,0,0,0.06)",
        "toggle-active": "0 4px 14px rgba(0,0,0,0.18)",
        "zone-selected": "0 6px 10px rgba(0,0,0,0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
