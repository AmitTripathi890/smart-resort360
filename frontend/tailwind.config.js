/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy utility aliases keep existing page markup on the new system.
        slate: {
          50: '#fdfcf9', 100: '#F7F5EF', 200: '#EEF3EF', 300: '#E3E4DF',
          400: '#adb3ae', 500: '#69716D', 600: '#535a55', 700: '#454b47',
          800: '#FFFFFF', 900: '#173F35', 950: '#F7F5EF',
        },
        sky: {
          200: '#d2e3d8', 300: '#aecbba', 400: '#7A9488', 500: '#5f7d6e',
          600: '#336b63', 700: '#2a5750',
        },
        indigo: {
          300: '#aecbba', 400: '#7A9488', 500: '#5f7d6e', 600: '#336b63',
        },
        emerald: {
          300: '#8fb99f', 400: '#5f9875', 500: '#3d7a5f', 600: '#2d6049',
          900: '#eef6f1', 950: '#eef6f1',
        },
        orange: { 400: '#b08d57', 500: '#9a7540' },
        purple: { 300: '#7A9488', 400: '#5f7d6e' },
        red: { 200: '#f2d4d4', 300: '#d99a9a', 400: '#b54a4a', 500: '#b54a4a', 600: '#8f2f2f' },
        // === BRAND PALETTE ===
        forest: {
          50:  '#f0f5f4',
          100: '#d9e8e5',
          200: '#b3d1cb',
          300: '#7fafa7',
          400: '#4f8880',
          500: '#336b63',
          600: '#2a5750',
          700: '#234742',
          800: '#1e3c38',
          900: '#173F35',   // Deep Forest Green — primary
          950: '#0f2922',
        },
        sage: {
          50:  '#f4f7f5',
          100: '#e8f0eb',
          200: '#d2e3d8',
          300: '#aecbba',
          400: '#7A9488',   // Sage — secondary
          500: '#5f7d6e',
          600: '#4c6558',
          700: '#3e5247',
          800: '#34443b',
          900: '#2c3a32',
        },
        ivory: {
          50:  '#fdfcf9',
          100: '#F7F5EF',   // Warm Ivory — background
          200: '#eeeae0',
          300: '#e3ddd0',
          400: '#d4ccbc',
          500: '#c0b5a0',
        },
        brass: {
          50:  '#faf6ed',
          100: '#f3ecd6',
          200: '#e7d7ac',
          300: '#d5bc78',
          400: '#C4A25A',
          500: '#B08D57',   // Muted Brass/Gold — premium accent
          600: '#9a7540',
          700: '#7d5d32',
          800: '#664c2a',
          900: '#553f24',
        },
        charcoal: {
          50:  '#f5f6f5',
          100: '#e7e9e7',
          200: '#d0d4d1',
          300: '#adb3ae',
          400: '#848d86',
          500: '#69716D',   // Muted Gray — secondary text
          600: '#535a55',
          700: '#454b47',
          800: '#3a3f3c',
          900: '#202624',   // Deep Charcoal — primary text
        },

        // === SEMANTIC STATUS (muted) ===
        status: {
          success:     '#3d7a5f',
          successBg:   '#eef6f1',
          successText: '#2d6049',
          warning:     '#9a7b2e',
          warningBg:   '#fdf8ed',
          warningText: '#7a5e18',
          critical:    '#b54a4a',
          criticalBg:  '#fdf1f1',
          criticalText:'#8f2f2f',
          info:        '#3a6b8a',
          infoBg:      '#eef4f9',
          infoText:    '#2d5470',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        'xs':  ['0.75rem',  { lineHeight: '1.125rem' }],
        'sm':  ['0.875rem', { lineHeight: '1.375rem' }],
        'base':['1rem',     { lineHeight: '1.625rem' }],
        'lg':  ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':  ['1.25rem',  { lineHeight: '1.875rem' }],
        '2xl': ['1.5rem',   { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.375rem' }],
      },

      borderRadius: {
        'sm':   '6px',
        DEFAULT:'8px',
        'md':   '10px',
        'lg':   '12px',
        'xl':   '14px',
        '2xl':  '16px',
        '3xl':  '20px',
      },

      boxShadow: {
        'card':  '0 1px 4px 0 rgba(32,38,36,0.06), 0 1px 2px -1px rgba(32,38,36,0.04)',
        'panel': '0 2px 8px 0 rgba(32,38,36,0.08), 0 1px 3px -1px rgba(32,38,36,0.05)',
        'modal': '0 12px 40px 0 rgba(32,38,36,0.18), 0 4px 12px -2px rgba(32,38,36,0.10)',
        'btn':   '0 1px 3px 0 rgba(23,63,53,0.18)',
        'inset': 'inset 0 1px 2px 0 rgba(32,38,36,0.06)',
        'none':  'none',
      },

      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
        '26':  '6.5rem',
      },

      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
      },
    },
  },
  plugins: [],
}
