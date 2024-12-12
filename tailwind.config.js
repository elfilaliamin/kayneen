/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        'primary' : {
          100: '#e5c2ff',
          200: '#c1a1ff',
          300: '#9c82ff',
          400: '#7763ff',
          500: '#4f46e5',
          600: '#4940d6',
          700: '#3a32b3'
        } 
      },
    },
  },
  plugins: [],
}

