/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-emerald-500', 'bg-sky-400', 'bg-amber-400', 'bg-rose-400', 'bg-violet-400', 'bg-pink-400', 'bg-slate-400',
    'text-emerald-500', 'text-sky-400', 'text-amber-400', 'text-rose-400', 'text-violet-400', 'text-pink-400', 'text-slate-400'
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#3bb9f3ff",
        "background-light": "#f1f5f9",
        "background-dark": "#0f172a",
      },
      fontFamily: {
        "display": ["Manrope", "sans-serif"]
      },
      borderRadius: { "DEFAULT": "0.5rem", "lg": "1rem", "xl": "1.5rem", "full": "9999px" },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
