/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sakura: {
          50: '#FDF0F5',
          100: '#FCE4EE',
          200: '#F9C9DD',
          400: '#F2A7C3',
          500: '#ED89AB',
        },
        sky: { 200: '#A8D8EA' },
        cream: { DEFAULT: '#FAF3E0' },
        ink: { DEFAULT: '#2C2C2C' },
        accent: { DEFAULT: '#C0392B' },
      },
      fontFamily: {
        serif: ['"Noto Serif JP"', 'serif'],
        sans: ['"Noto Sans TC"', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        sakura: '2px 4px 12px rgba(242,167,195,0.3)',
        'sakura-lg': '2px 8px 24px rgba(242,167,195,0.4)',
      },
    },
  },
  plugins: [],
}
