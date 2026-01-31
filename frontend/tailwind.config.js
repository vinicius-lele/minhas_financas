/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef3e2',
          100: '#fde6d2',
          200: '#fbd2b0',
          300: '#f8b98b',
          400: '#f59e61',
          500: '#f18539',
          600: '#d96b27',
          700: '#b5531e',
          800: '#8f4018',
          900: '#723414',
          950: '#431e09',
        },
      }
    },
  },
  plugins: [],
}
