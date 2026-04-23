/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted:   '#f4f6fb',
          subtle:  '#eef1f7',
          sunken:  '#e8ecf4',
        },
        ink: {
          DEFAULT: '#0f172a',
          muted:   '#475569',
          soft:    '#64748b',
          faint:   '#94a3b8',
        },
        // Legacy aliases — keep old pages rendering until migrated
        sakura: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        washi: '#f8fafc',
      },
      fontFamily: {
        sans: [
          'Inter',
          '"Hiragino Kaku Gothic ProN"',
          '"Hiragino Sans"',
          'Meiryo',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        'card': '0 1px 2px rgba(15, 23, 42, 0.04)',
        'elevated': '0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
        'focus': '0 0 0 3px rgba(99, 102, 241, 0.25)',
      },
      borderRadius: {
        'xl': '0.875rem',
      },
    },
  },
  plugins: [],
};
