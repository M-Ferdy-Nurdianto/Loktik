/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#39FF14',
          purple: '#8B5CF6',
          blue: '#06B6D4',
          yellow: '#FFE600',
          red: '#FF3333',
          dark: '#121212',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'Poppins', 'sans-serif'],
        display: ['Bebas Neue', 'Montserrat', 'sans-serif'],
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #000000',
        'brutal-sm': '2px 2px 0px 0px #000000',
        'brutal-lg': '6px 6px 0px 0px #000000',
        'brutal-white': '4px 4px 0px 0px #ffffff',
        'brutal-white-sm': '2px 2px 0px 0px #ffffff',
      }
    },
  },
  plugins: [],
}
