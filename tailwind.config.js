/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom color scheme for Arkham Ventures
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0f172a', // Navy
          600: '#0e141b',
          900: '#020617',
        },
        accent: {
          500: '#fbbf24', // Gold
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
