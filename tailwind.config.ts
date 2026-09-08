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
        brand: {
          blue: "#2563EB",
          "blue-deep": "#1741C4",
          green: "#00C896",
          "green-soft": "#EAFBF5",
          ink: "#0B1220",
          slate: "#5B6472",
          "slate-light": "#8A93A3",
          line: "#E6EAF2",
          "bg-tint": "#F5F8FF",
          pink: "#FF4D8D",
          "pink-soft": "#FFF1F5",
          amber: "#F5A524",
          "amber-soft": "#FFF8E8",
        },
      },
      borderRadius: {
        sm: "12px",
        md: "18px",
        lg: "28px",
        xl: "32px",
        "2xl": "40px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        btn: "0 8px 20px -8px rgba(37,99,235,0.6)",
        "btn-green": "0 12px 28px -10px rgba(0,200,150,0.55)",
        card: "0 20px 45px -18px rgba(15,23,42,0.18)",
        "card-hover": "0 22px 40px -22px rgba(15,23,42,0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
