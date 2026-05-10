/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0f172a',
        card: '#1e293b',
        elevated: '#334155',
        primary: '#3b82f6',
      },
    },
  },
  plugins: [],
}
