import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          navy: "var(--brand-navy)",
          blue: "var(--brand-blue)",
          "blue-light": "var(--brand-blue-light)",
          teal: "var(--brand-teal)",
          gold: "var(--brand-gold)",
          green: "var(--brand-green)",
          red: "var(--brand-red)",
        },
        surface: {
          white: "var(--surface-white)",
          gray: "var(--surface-gray)",
          border: "var(--surface-border)",
        },
        escrow: "var(--escrow-bg)",
        sidebar: {
          DEFAULT: "var(--sidebar-bg)",
          active: "var(--sidebar-active)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
