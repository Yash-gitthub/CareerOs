/** @type {import('tailwindcss').Config} */

// Warm editorial theme: cream paper, charcoal ink, terracotta accent, sage and peach tints.
// Components are written with Tailwind's standard palette names (bg-white, text-slate-900,
// bg-indigo-600 …); the palettes below give those names the theme's colours.
//   slate   → warm stone neutrals (cream → charcoal)
//   indigo  → terracotta (primary accent)
//   emerald → sage (success / positive)
//   amber   → ochre, red → brick, sky/blue → dusty blue

const stone = {
  50: '#f5f0e7',
  100: '#ede6d9',
  200: '#e3d9c7',
  300: '#cfc2ac',
  400: '#a69a86',
  500: '#7f7566',
  600: '#5f574b',
  700: '#443e35',
  800: '#2e2a25',
  900: '#1f1c19',
  950: '#141210',
};

const terracotta = {
  50: '#fbefe7',
  100: '#f6dece',
  200: '#edc0a6',
  300: '#e19f7d',
  400: '#d48159',
  500: '#c4643f',
  600: '#b5552f',
  700: '#964427',
  800: '#773723',
  900: '#5c2c1e',
  950: '#33170f',
};

const sage = {
  50: '#eff2e9',
  100: '#e1e7d6',
  200: '#c9d4b6',
  300: '#a9b98f',
  400: '#899b6b',
  500: '#6d8152',
  600: '#576a40',
  700: '#465535',
  800: '#39442d',
  900: '#2f3826',
  950: '#181e12',
};

const dusty = {
  50: '#eef2f4',
  100: '#dde5ea',
  200: '#c2d0d9',
  300: '#9db3c1',
  400: '#7493a6',
  500: '#58788c',
  600: '#476275',
  700: '#3b5060',
  800: '#334350',
  900: '#2c3944',
  950: '#1b242c',
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        white: '#fcfaf5', // card paper
        slate: stone,
        indigo: terracotta,
        brand: terracotta,
        emerald: sage,
        sky: dusty,
        blue: dusty,
        amber: {
          50: '#fbf3e2',
          100: '#f5e5c3',
          200: '#ebcf94',
          300: '#ddb363',
          400: '#cf983e',
          500: '#b97f27',
          600: '#9c681e',
          700: '#7c521b',
          800: '#64431a',
          900: '#523718',
          950: '#2e1d0a',
        },
        red: {
          50: '#fbeeec',
          100: '#f6dbd6',
          200: '#ecb8ae',
          300: '#df8f81',
          400: '#cf6a59',
          500: '#bb4d3c',
          600: '#a13d2f',
          700: '#823228',
          800: '#6a2b24',
          900: '#572621',
          950: '#2f110e',
        },
        // Section tints from the reference design.
        tint: {
          sage: '#dfe4d3',
          peach: '#f3ddd0',
          sand: '#ece2cf',
        },
        ink: {
          DEFAULT: '#1f1c19',
          900: '#141210',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(31, 28, 25, 0.04)',
        'card': '0 1px 2px rgba(31, 28, 25, 0.04), 0 6px 20px -12px rgba(31, 28, 25, 0.12)',
        'card-hover': '0 2px 4px rgba(31, 28, 25, 0.05), 0 18px 36px -18px rgba(31, 28, 25, 0.22)',
        'soft': '0 10px 30px -16px rgba(150, 68, 39, 0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'status-pulse': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(196, 100, 63, 0.45)' },
          '50%': { opacity: '0.85', boxShadow: '0 0 0 5px rgba(196, 100, 63, 0)' },
        },
        'orbit-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'status-pulse': 'status-pulse 2.2s ease-in-out infinite',
        'orbit-spin': 'orbit-spin 120s linear infinite',
      },
    },
  },
  plugins: [],
}
