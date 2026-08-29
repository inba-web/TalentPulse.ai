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
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-hover)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
          soft: 'var(--color-primary-soft)',
          bg: 'var(--color-primary-background)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          hover: 'var(--color-secondary-hover)',
          active: 'var(--color-secondary-active)',
          soft: 'var(--color-secondary-soft)',
          bg: 'var(--color-secondary-background)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          hover: 'var(--color-success-hover)',
          soft: 'var(--color-success-soft)',
          bg: 'var(--color-success-background)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          hover: 'var(--color-warning-hover)',
          soft: 'var(--color-warning-soft)',
          bg: 'var(--color-warning-background)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          hover: 'var(--color-error-hover)',
          soft: 'var(--color-error-soft)',
          bg: 'var(--color-error-background)',
        },
        danger: {
          DEFAULT: 'var(--color-error)',
          dark: 'var(--color-error-hover)',
        },
        info: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-hover)',
        },
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        text: 'var(--color-text-primary)',
        border: 'var(--color-border)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
