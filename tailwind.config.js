/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          400: '#d4a843',
          500: '#c49a2f',
          600: '#a8821f',
        },
      },
    },
  },
  plugins: [],
}
