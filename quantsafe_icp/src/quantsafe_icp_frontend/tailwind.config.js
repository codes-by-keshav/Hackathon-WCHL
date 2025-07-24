/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'cookie': ['Cookie', 'cursive'],
        'exo': ['Exo 2', 'sans-serif'],
      },
      colors: {
        'cyber-cyan': '#06b6d4',
        'cyber-blue': '#0ea5e9',
        'cyber-teal': '#14b8a6',
      },
      backgroundColor: {
        'primary': '#0a0a0a',
        'secondary': '#111111',
        'tertiary': '#1a1a1a',
      },
      textColor: {
        'primary': '#e5e5e5',
        'secondary': '#a0a0a0',
        'muted': '#666666',
      }
    },
  },
  plugins: [],
}