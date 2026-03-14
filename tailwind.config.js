/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#b9d9ce',
        'accent-dark': '#9dc5b8',
      },
    },
  },
  plugins: [],
}
