import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // App tokens
        background: '#0a0a0a',
        surface: '#111111',
        'surface-elevated': '#1a1a1a',
        accent: '#6366f1',
        'accent-hover': '#4f46e5',
        // Marketing / shared tokens
        primary: {
          DEFAULT: '#6366f1',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#818cf8',
          foreground: '#ffffff',
        },
        foreground: '#ffffff',
        'muted-foreground': '#a1a1aa',
        'surface-2': '#1a1a1a',
        card: '#111111',
        border: '#27272a',
        danger: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#22c55e',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#f59e0b',
          foreground: '#ffffff',
        },
      },
      boxShadow: {
        'glow': '0 0 24px rgba(99,102,241,0.35)',
        'glow-soft': '0 0 12px rgba(99,102,241,0.15)',
        'card': '0 4px 32px rgba(0,0,0,0.5)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
