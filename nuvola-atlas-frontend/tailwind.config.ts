import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        atlas: {
          base: "#0a0d12",
        },
        surface: {
          DEFAULT: "rgba(22,27,36,0.72)",
          solid: "#161b24",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.14)",
        },
        ink: {
          1: "#f4f6fa",
          2: "#c8cdd6",
          3: "#8a91a0",
          4: "#5d6373",
        },
        accent: {
          DEFAULT: "#4a9eff",
        },
        success: "#34c97a",
        warn: "#ffb340",
        danger: "#ff5d5d",
        violet: "#b888ff",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Inter"',
          "system-ui",
          "sans-serif",
        ],
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
