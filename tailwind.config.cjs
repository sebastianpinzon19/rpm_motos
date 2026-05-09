/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#e63312',
        accent: '#f5a623',
        bg: '#0d0d0d',
        surface: '#1a1a1a',
        surface2: '#242424'
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['Nunito', 'sans-serif']
      }
    }
  },
  plugins: []
}
