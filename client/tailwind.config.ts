import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        bg: {
          base: "#0a0a0f",
          card: "#13131a",
          elevated: "#1a1a24",
        },
        brand: {
          green: "#34d399",
          cyan: "#22d3ee",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #34d399, #22d3ee)",
      },
    },
  },
  plugins: [],
} satisfies Config;
