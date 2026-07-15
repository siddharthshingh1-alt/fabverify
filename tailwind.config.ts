import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#07101F",
        card: "#0D1B33",
        "border-dark": "#1C3050",
        gold: "#f2ca50",
        "text-primary": "#E2E8F0",
        "text-secondary": "#7A8FA8",

        background: "#07122a",
        surface: "#07122a",
        "surface-container": "#151f37",
        "surface-container-low": "#101b33",
        "surface-container-high": "#1f2942",
        "surface-container-highest": "#2a344e",
        "surface-container-lowest": "#030d25",
        primary: "#f2ca50",
        "primary-container": "#d4af37",
        "on-primary": "#3c2f00",
        "on-surface": "#d9e2ff",
        "on-surface-variant": "#d0c5af",
        outline: "#99907c",
        "outline-variant": "#4d4635",
        secondary: "#b9c7e4",
        "secondary-container": "#3c4962",
        error: "#ffb4ab",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "9999px",
      },
    },
  },
};

export default config;
