import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Ground & Harvest palette (Navuuna brand board) ──────────────
        atlas: {
          base: "#0B2235", // Sovereign Navy — foundation
          deep: "#07141F", // deeper navy for wells / insets
          raised: "#123049", // elevated navy surface
        },
        navy: "#0B2235",
        bone: "#F4EFE6", // warm white — paper / verified record
        surface: {
          DEFAULT: "rgba(15,37,56,0.72)",
          solid: "#0F2A40",
        },
        border: {
          DEFAULT: "rgba(244,239,230,0.10)",
          strong: "rgba(244,239,230,0.18)",
        },
        ink: {
          1: "#F4EFE6", // Bone
          2: "#CBC7BC",
          3: "#94A2AF",
          4: "#66757F",
        },
        // Harvest Terracotta is the signature colour → primary accent / CTA
        accent: {
          DEFAULT: "#C0552B",
          soft: "#D26C41",
        },
        terracotta: "#C0552B", // signature — earth / infrastructure
        teal: "#1F8A78", // freedom — human wellbeing (Social pillar)
        gold: "#E0A82E", // value — used sparingly (Density pillar)
        steel: "#3E6E93", // navy-family — Safety pillar
        success: "#1F8A78",
        warn: "#E0A82E",
        danger: "#D3402E",
        violet: "#E0A82E", // legacy alias → gold
      },
      fontFamily: {
        sans: [
          '"Poppins"',
          "-apple-system",
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Inter"',
          "system-ui",
          "sans-serif",
        ],
        display: ['"Sora"', '"Poppins"', "system-ui", "sans-serif"],
        brand: ['"Poppins"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        chip: "8px",
        control: "11px",
        card: "14px",
        modal: "18px",
        login: "22px",
      },
      boxShadow: {
        chrome: "0 10px 30px rgba(0,0,0,0.18)",
        legend: "0 14px 40px rgba(0,0,0,0.22)",
        modal: "0 30px 80px rgba(0,0,0,0.55)",
      },
    },
  },
  plugins: [],
};

export default config;
