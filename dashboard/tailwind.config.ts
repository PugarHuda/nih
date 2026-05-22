import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Mezo-inspired Bitcoin-warm palette
        bg: "hsl(20 14% 5%)",
        surface: "hsl(20 14% 8%)",
        border: "hsl(20 10% 16%)",
        muted: "hsl(20 8% 60%)",
        fg: "hsl(30 20% 96%)",
        brand: "hsl(22 90% 56%)",        // BTC orange
        brandSoft: "hsl(22 80% 65%)",
        accent: "hsl(140 60% 50%)",      // money green
        danger: "hsl(0 70% 60%)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
