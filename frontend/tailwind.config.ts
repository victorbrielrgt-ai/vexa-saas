import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Brand Colors ──────────────────────────────────────────────────────
      colors: {
        brand: {
          purple: "#5B2EFF",
          "purple-light": "#7B52FF",
          "purple-dim": "#3D1ECC",
          "purple-glow": "rgba(91,46,255,0.15)",
          green: "#00D084",
          "green-light": "#00E894",
          "green-dim": "#00A068",
          "green-glow": "rgba(0,208,132,0.15)",
          red: "#FF4444",
          "red-light": "#FF6B6B",
          "red-glow": "rgba(255,68,68,0.15)",
          amber: "#FFB800",
          "amber-glow": "rgba(255,184,0,0.15)",
        },
        // ── Base / Neutral ────────────────────────────────────────────────
        base: {
          bg: "#0B1020",
          surface: "#111827",
          "surface-2": "#1A2235",
          "surface-3": "#212D44",
          border: "#1E2D4A",
          "border-light": "#2A3A5A",
          muted: "#4A5568",
          subtle: "#2D3748",
        },
        // ── Text ──────────────────────────────────────────────────────────
        ink: {
          primary: "#F0F4FF",
          secondary: "#8B9AB5",
          muted: "#5A6680",
          accent: "#5B2EFF",
        },
      },
      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      // ── Spacing & Sizing ──────────────────────────────────────────────────
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      // ── Shadows ───────────────────────────────────────────────────────────
      boxShadow: {
        "purple-glow": "0 0 40px rgba(91,46,255,0.25), 0 0 80px rgba(91,46,255,0.08)",
        "green-glow": "0 0 30px rgba(0,208,132,0.2)",
        "card": "0 4px 24px rgba(0,0,0,0.4), 0 1px 0px rgba(255,255,255,0.04) inset",
        "card-hover": "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(91,46,255,0.3)",
        "inset-border": "inset 0 0 0 1px rgba(255,255,255,0.06)",
      },
      // ── Animations ────────────────────────────────────────────────────────
      animation: {
        "fade-up": "fadeUp 0.5s ease-out forwards",
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "score-fill": "scoreFill 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(91,46,255,0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(91,46,255,0.4)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        scoreFill: {
          "0%": { strokeDashoffset: "283" },
          "100%": { strokeDashoffset: "var(--score-offset)" },
        },
      },
      // ── Backgrounds ───────────────────────────────────────────────────────
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91,46,255,0.25), transparent)",
        "card-gradient": "linear-gradient(135deg, rgba(26,34,53,0.9) 0%, rgba(17,24,39,0.95) 100%)",
        "purple-gradient": "linear-gradient(135deg, #5B2EFF 0%, #3D1ECC 100%)",
        "green-gradient": "linear-gradient(135deg, #00D084 0%, #00A068 100%)",
        "shimmer-gradient": "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
