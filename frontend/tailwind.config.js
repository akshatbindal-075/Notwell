/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    "#f0fdf8",
          surface: "#e8faf3",
          card:    "#ffffff",
          hover:   "#f0fdf8",
        },
        em: {
          50:  "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        tl: {
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
        },
        txt: {
          primary:   "#064e3b",
          secondary: "#047857",
          muted:     "#6b7280",
          soft:      "#9ca3af",
        },
        bdr: {
          DEFAULT: "#a7f3d0",
          soft:    "#d1fae5",
          strong:  "#6ee7b7",
        },
        rose:  { 50:"#fff1f2", 100:"#ffe4e6", 400:"#fb7185", 500:"#f43f5e", 700:"#be123c" },
        amber: { 50:"#fffbeb", 100:"#fef3c7", 400:"#fbbf24", 500:"#f59e0b", 700:"#b45309" },
        // No blue — ocean alias points to emerald
        ocean: {
          50:  "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        surface: { light:"#f0fdf8", DEFAULT:"#a7f3d0", dark:"#6ee7b7" },
        ink:     { DEFAULT:"#064e3b", soft:"#047857" },
      },
      boxShadow: {
        card:      "0 1px 3px rgba(5,150,105,0.06), 0 4px 16px rgba(5,150,105,0.08)",
        cardHover: "0 4px 24px rgba(5,150,105,0.14)",
        btn:       "0 4px 14px rgba(5,150,105,0.35)",
        input:     "0 0 0 3px rgba(5,150,105,0.12)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
    },
  },
  plugins: [],
};
