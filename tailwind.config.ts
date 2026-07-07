import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "beam-black":    "#000000",
        "beam-void":     "#030712",
        "beam-deep":     "#060d1f",
        "beam-navy":     "#0a1628",
        "beam-blue":     "#2563EB",
        "beam-blue-mid": "#3B82F6",
        "beam-blue-lit": "#60A5FA",
        "beam-cyan":     "#22D3EE",
        "beam-glow":     "#93C5FD",
        "beam-white":    "#F8FAFC",
        "beam-muted":    "#94A3B8",
        "beam-border":   "rgba(96,165,250,0.15)",
        "beam-glass":    "rgba(10,22,40,0.6)",
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
        display: ["Almarena Neue", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.25), transparent), linear-gradient(180deg, #000000 0%, #060d1f 50%, #000000 100%)",
        "blue-glow":
          "radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 70%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(10,22,40,0.8) 0%, rgba(6,13,31,0.9) 100%)",
        "button-gradient":
          "linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1E40AF 100%)",
        "button-hover":
          "linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)",
      },
      boxShadow: {
        "glow-sm":   "0 0 10px rgba(37,99,235,0.4), 0 0 20px rgba(37,99,235,0.15)",
        "glow-md":   "0 0 20px rgba(37,99,235,0.5), 0 0 40px rgba(37,99,235,0.2), 0 0 80px rgba(37,99,235,0.05)",
        "glow-lg":   "0 0 40px rgba(96,165,250,0.6), 0 0 80px rgba(37,99,235,0.3), 0 0 120px rgba(37,99,235,0.1)",
        "glow-xl":   "0 0 60px rgba(96,165,250,0.7), 0 0 120px rgba(37,99,235,0.4), 0 0 200px rgba(37,99,235,0.15)",
        "glass":     "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        "card":      "0 25px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(96,165,250,0.1)",
        "card-hover":"0 25px 50px rgba(0,0,0,0.9), 0 0 0 1px rgba(96,165,250,0.25), 0 0 40px rgba(37,99,235,0.15)",
      },
      animation: {
        "glow-pulse":    "glowPulse 3s ease-in-out infinite",
        "float":         "float 6s ease-in-out infinite",
        "scan-line":     "scanLine 4s linear infinite",
        "border-glow":   "borderGlow 3s ease-in-out infinite",
        "fade-up":       "fadeUp 0.8s ease-out forwards",
        "fade-in":       "fadeIn 1s ease-out forwards",
        "spin-slow":     "spin 3s linear infinite",
        "shimmer":       "shimmer 2.5s linear infinite",
        "warp":          "warpPulse 2s ease-in-out infinite",
      },
      keyframes: {
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(37,99,235,0.5), 0 0 40px rgba(37,99,235,0.2)" },
          "50%":      { boxShadow: "0 0 30px rgba(96,165,250,0.7), 0 0 60px rgba(37,99,235,0.4), 0 0 100px rgba(37,99,235,0.15)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-12px)" },
        },
        scanLine: {
          "0%":   { top: "0%", opacity: "0" },
          "5%":   { opacity: "1" },
          "95%":  { opacity: "1" },
          "100%": { top: "100%", opacity: "0" },
        },
        borderGlow: {
          "0%, 100%": { borderColor: "rgba(37,99,235,0.3)" },
          "50%":      { borderColor: "rgba(96,165,250,0.7)" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        warpPulse: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.7" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
