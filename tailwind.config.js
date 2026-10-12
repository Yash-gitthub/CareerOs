/** @type {import('tailwindcss').Config} */

// Cyberpunk terminal theme.
// The UI is written with Tailwind's light-theme palette names (bg-white, text-slate-900,
// bg-indigo-600 …). Each palette below is redefined for a dark terminal: low shades are
// near-black surfaces and high shades are bright text, so every light-on-dark pairing in
// the components keeps its contrast. `indigo` is the primary accent (neon green),
// `emerald`/`sky` are cyan, `red` is neon red and `neon` is the magenta highlight.

const surface = {
  50: '#0a0c0a',
  100: '#101410',
  200: '#18211a',
  300: '#243128',
  400: '#56657a',
  500: '#7b8a9c',
  600: '#9eabb9',
  700: '#c1cad3',
  800: '#dfe5e9',
  900: '#eef3f0',
  950: '#ffffff',
};

const green = {
  50: '#06140a',
  100: '#0a2111',
  200: '#0e3518',
  300: '#145c27',
  400: '#1fd94a',
  500: '#00ff41',
  600: '#00ff41',
  700: '#39ff14',
  800: '#6dff86',
  900: '#a8ffb6',
  950: '#e2ffe7',
};

const cyan = {
  50: '#04131a',
  100: '#061f28',
  200: '#0a343f',
  300: '#0f5a66',
  400: '#1fd5e6',
  500: '#00e5f5',
  600: '#00f5ff',
  700: '#5cf8ff',
  800: '#9cfbff',
  900: '#cbfdff',
  950: '#ebffff',
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        white: '#0b0e0c', // panels
        slate: surface,
        indigo: green,
        brand: green,
        emerald: cyan,
        sky: cyan,
        blue: cyan,
        amber: {
          50: '#161004',
          100: '#231a06',
          200: '#3a2b09',
          300: '#6b4f10',
          400: '#ffc233',
          500: '#ffb800',
          600: '#ffc533',
          700: '#ffd166',
          800: '#ffdf8f',
          900: '#ffedbf',
          950: '#fff7e3',
        },
        red: {
          50: '#190509',
          100: '#28080f',
          200: '#46101b',
          300: '#7a1a2c',
          400: '#ff4d6d',
          500: '#ff2e57',
          600: '#ff2e57',
          700: '#ff6b86',
          800: '#ff9db0',
          900: '#ffc6d1',
          950: '#ffe5ea',
        },
        neon: {
          green: '#00ff41',
          lime: '#39ff14',
          magenta: '#ff00d4',
          cyan: '#00f5ff',
        },
        ink: {
          DEFAULT: '#050505',
          900: '#080808',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        // Sharper corners across the app.
        lg: '0.375rem',
        xl: '0.375rem',
        '2xl': '0.5rem',
        '3xl': '0.625rem',
      },
      boxShadow: {
        'subtle': '0 0 0 1px rgba(0, 255, 65, 0.04)',
        'card': '0 0 0 1px rgba(0, 255, 65, 0.03), 0 8px 24px -12px rgba(0, 0, 0, 0.8)',
        'card-hover': '0 0 0 1px rgba(0, 255, 65, 0.18), 0 0 28px -6px rgba(0, 255, 65, 0.22)',
        'glow': '0 0 18px rgba(0, 255, 65, 0.45), 0 0 2px rgba(0, 255, 65, 0.9)',
        'glow-sm': '0 0 10px rgba(0, 255, 65, 0.35)',
        'glow-magenta': '0 0 18px rgba(255, 0, 212, 0.45)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        'status-pulse': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(0, 255, 65, 0.6)' },
          '50%': { opacity: '0.75', boxShadow: '0 0 0 5px rgba(0, 255, 65, 0)' },
        },
        sweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        blink: 'blink 1.1s steps(1) infinite',
        'status-pulse': 'status-pulse 2s ease-in-out infinite',
        sweep: 'sweep 3.5s linear infinite',
      },
    },
  },
  plugins: [],
}
