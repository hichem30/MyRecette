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
        cream: "#FAF7F2",
        // My Recette color palette
        recette: {
          50:  "#FFFBF5",
          100: "#FEF3E8",
          200: "#FDE4D6",
          300: "#FCD3B8",
          400: "#FBC195",
          500: "#FA9A58",
          600: "#F57A30",
          700: "#E85A20",
          800: "#D64518",
          900: "#BF3815",
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: "0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
