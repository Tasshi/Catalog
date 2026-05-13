/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        mono: ['"DM Mono"', 'monospace'],
        sans: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
