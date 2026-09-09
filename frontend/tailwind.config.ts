import type { Config } from 'tailwindcss'

/**
 * Taken from the approved UI/UX concept: deep navy ground, gold as the
 * ceremonial accent, cream page surfaces, white cards with hairline borders.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#071A33',
          900: '#0B2140',
          800: '#122E52',
          700: '#1B3E68',
          600: '#2A5286',
        },
        gold: {
          500: '#C9A227',
          400: '#D9B84A',
          300: '#E7CE7E',
          600: '#A8861B',
          // gold-600 on cream measures about 3:1 — fine for large display type,
          // short of the 4.5:1 small text needs. This is the small-text gold.
          700: '#755C12',
        },
        cream: {
          DEFAULT: '#FBF8F1',
          deep: '#F4EEE1',
        },
        ink: '#12233D',
        slate: { DEFAULT: '#5A6A80' },
        hair: '#E4DCC9',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'var(--font-display-local)', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'var(--font-sans-local)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        micro: ['0.75rem', { lineHeight: '1.45' }],
        small: ['0.875rem', { lineHeight: '1.6' }],
        body: ['1rem', { lineHeight: '1.7' }],
        lead: ['1.125rem', { lineHeight: '1.7' }],
        h3: ['1.375rem', { lineHeight: '1.3' }],
        section: ['clamp(1.75rem, 3.2vw, 2.5rem)', { lineHeight: '1.15', letterSpacing: '0.01em' }],
        hero: ['clamp(2.25rem, 5.4vw, 4.25rem)', { lineHeight: '1.05', letterSpacing: '0.005em' }],
      },
      maxWidth: {
        measure: '68ch',
        shell: '80rem',
      },
      spacing: {
        section: 'clamp(3.5rem, 7vw, 6.5rem)',
      },
      boxShadow: {
        card: '0 2px 14px rgba(11, 33, 64, 0.07)',
        cardHover: '0 12px 30px rgba(11, 33, 64, 0.14)',
        bar: '0 -2px 16px rgba(11, 33, 64, 0.10)',
      },
      transitionTimingFunction: {
        gentle: 'cubic-bezier(0.22, 0.68, 0.28, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config
