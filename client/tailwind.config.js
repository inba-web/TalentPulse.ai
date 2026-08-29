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
        },
        secondary: {
          DEFAULT: 'var(--color-warning)',
          hover: 'var(--color-warning-hover)',
          active: 'var(--color-warning-hover)',
          soft: 'var(--color-warning-soft)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          hover: 'var(--color-success-hover)',
          soft: 'var(--color-success-soft)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          hover: 'var(--color-warning-hover)',
          soft: 'var(--color-warning-soft)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          hover: 'var(--color-error-hover)',
          soft: 'var(--color-error-soft)',
        },
        danger: {
          DEFAULT: 'var(--color-error)',
          dark: 'var(--color-error-hover)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
        },
        cyan: {
          DEFAULT: '#06B6D4',
        },
        background: {
          DEFAULT: 'var(--color-background-primary)',
          secondary: 'var(--color-background-secondary)',
          tertiary: 'var(--color-background-tertiary)',
        },
        surface: {
          DEFAULT: 'var(--color-surface-1)',
          1: 'var(--color-surface-1)',
          2: 'var(--color-surface-2)',
          3: 'var(--color-surface-3)',
          elevated: 'var(--color-surface-elevated)',
        },
        text: {
          DEFAULT: 'var(--color-text-primary)',
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          disabled: 'var(--color-text-disabled)',
        },
        border: {
          DEFAULT: 'var(--color-border-primary)',
          primary: 'var(--color-border-primary)',
          secondary: 'var(--color-border-secondary)',
          hover: 'var(--color-border-hover)',
          selected: 'var(--color-border-selected)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
