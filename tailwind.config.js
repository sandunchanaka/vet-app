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
        'netstripes-teal': '#20B2AA',
        'netstripes-dark': '#2C3E50',
        'netstripes-light': '#E8F8F5',
      },
    },
  },
  plugins: [],
}

