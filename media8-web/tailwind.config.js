/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          deep: '#400404',
          warm: '#5c1212',
          vibrant: '#7b0a0a',
        },
        cream: {
          soft: '#fffbed',
        },
        dark: {
          bg: '#120303',
          surface: '#1f0606',
          border: '#3a0a0a',
        }
      }
    },
  },
  plugins: [],
}
