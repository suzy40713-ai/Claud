import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0c",
        surface: "#131318",
        surface2: "#1b1b22",
        border: "#26262f",
        accent: {
          DEFAULT: "#7c5cff",
          light: "#9b82ff",
          dark: "#5f3fe0",
        },
        blueaccent: "#3b82f6",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #7c5cff 0%, #3b82f6 100%)",
        "hero-glow":
          "radial-gradient(60% 60% at 50% 0%, rgba(124,92,255,0.25) 0%, rgba(10,10,12,0) 70%)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out both",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
