import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /**
         * Brand palette — derived from the SGATAR 2026 logo navy (#1D3272).
         * Used for headers, nav, buttons, and interactive chrome.
         */
        brand: {
          50: "#eaecf8",
          100: "#c8ceec",
          200: "#9aa5d8",
          300: "#6172B6", // logo periwinkle (wave stripes)
          400: "#3d56a0",
          500: "#1D3272", // logo primary navy
          600: "#172c63",
          700: "#112252",
          800: "#0c1840",
          900: "#090f2c", // darkest — used for page headers/nav
        },
        /**
         * Accent palette — derived from the SGATAR 2026 crimson (#E52030).
         * Used for "SINGAPORE" callouts, SOS states, and danger indicators.
         */
        accent: {
          50: "#fde8ea",
          100: "#f8bcc1",
          500: "#E52030", // logo crimson
          600: "#c41c29",
          700: "#9e1621",
        },
        /** Logo gold (#F5B200) — used sparingly for highlight accents. */
        gold: {
          400: "#FAC107",
          500: "#F5B200",
          600: "#D99E00",
        },
        /**
         * Cream — warm ivory drawn from the lion's face in the logo.
         * Used as the main page background to carry the logo's palette
         * into the content area.
         */
        cream: {
          50: "#fefcf7",
          100: "#fdf6e8",
          200: "#f9ead0",
          300: "#f4dab5",
        },
        sos: {
          DEFAULT: "#E52030",
          pulse: "#fecaca",
        },
        /**
         * Slate (#2E3B4E) — the dark charcoal used for headings in SGATAR
         * 2026 print collaterals.  WCAG contrast on cream-100: ~13:1 (AAA).
         */
        slate: {
          700: "#2E3B4E",
          800: "#1f2a38",
          900: "#141c25",
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
