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
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
        },
        background: '#F8FAFC',
        surface: '#FFFFFF',
        text: '#0F172A',
        secondary: '#64748B',
        border: '#E2E8F0',
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
        info: '#0891B2',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
