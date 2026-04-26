/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          forest: '#1f3d2e',
          leaf: '#4f8f6c',
          soft: '#a9c88a',
          olive: '#2f5d50',
          sage: '#7faf9b',
          mint: '#cfe8d5',
          brown: '#8b6a3d',
          beige: '#f3e8d5',
          cream: '#faf6f0',
          ink: '#1f2b24',
          muted: '#64706a',
        },
      },
      boxShadow: {
        soft: '0 18px 44px rgba(31, 61, 46, 0.06)',
        panel: '0 24px 60px rgba(31, 61, 46, 0.08)',
      },
    },
  },
  plugins: [],
};
