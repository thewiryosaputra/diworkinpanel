/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#0d1512',
        panel: 'rgba(17, 27, 23, 0.82)',
        panelStrong: 'rgba(12, 19, 17, 0.94)',
        line: 'rgba(215, 230, 218, 0.12)',
        cream: '#eff7f0',
        muted: '#a8b8ad',
      },
      boxShadow: {
        panel: '0 24px 80px rgba(0, 0, 0, 0.34)',
      },
    },
  },
  plugins: [],
};
