import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0F1115",
        surface: "#161922",
        elevated: "#1E222C",
        border: "#2A2F3A",
        muted: "#8B92A3",
        accent: { DEFAULT: "#4F7CFF", dim: "#2F4DAE" },
        signal: { green: "#2ECC71", yellow: "#F5C518", red: "#EF4444" },
      },
      fontFamily: {
        display: ["Manrope", "ui-sans-serif", "system-ui"],
        body: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular"],
      },
      borderRadius: { DEFAULT: "10px" },
    },
  },
  plugins: [],
} satisfies Config;
