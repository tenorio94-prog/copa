/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#121214",
        "surface-2": "#1a1a1e",
        border: "#222226",
        "text-secondary": "#a1a1aa",
        "text-tertiary": "#71717a",
        accent: "#6366f1",
        "accent-2": "#818cf8",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
    },
  },
  plugins: [],
}

module.exports = config
