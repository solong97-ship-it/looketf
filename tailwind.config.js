/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        slate: {
          940: '#0a0f1b',
          930: '#0f1525',
        },
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', '"SF Pro Display"', '"Noto Sans KR"', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 20px 80px rgba(5, 10, 25, 0.45)',
      },
    },
  },
  plugins: [],
};
