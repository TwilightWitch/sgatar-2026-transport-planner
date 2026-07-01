import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2f7",
          100: "#d4dde8",
          200: "#a9bbcf",
          500: "#1a3a5c",
          600: "#142d4a",
          700: "#0f2239",
          800: "#0a1827",
          900: "#0c1f36",
        },
        accent: {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#c8102e",
          600: "#a50d24",
          700: "#82091a",
        },
        sos: {
          DEFAULT: "#c8102e",
          pulse: "#fecaca",
        },
      },
      animation: {
        "sos-pulse": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fids-scroll": "scroll 30s linear infinite",
      },
      keyframes: {
        scroll: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
