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
        background: '#0F1115',
        surface: '#171A21',
        'surface-elevated': '#1E222B',
        accent: '#4ADE80',
        'accent-hover': '#22C55E',
        gold: '#C8A951',
        // Marketing / shared tokens
        primary: {
          DEFAULT: '#4ADE80',
          foreground: '#0F1115',
        },
        secondary: {
          DEFAULT: '#4ADE80',
          foreground: '#0F1115',
        },
        foreground: '#F2F0EB',
        'muted-foreground': '#9BA1AC',
        'surface-2': '#1E222B',
        card: '#171A21',
        border: '#262A33',
        danger: {
          DEFAULT: '#E5484D',
          foreground: '#F2F0EB',
        },
        success: {
          DEFAULT: '#4ADE80',
          foreground: '#0F1115',
        },
        warning: {
          DEFAULT: '#E8A73C',
          foreground: '#0F1115',
        },
      },
      boxShadow: {
        'glow': '0 0 24px rgba(74,222,128,0.35)',
        'glow-soft': '0 0 12px rgba(74,222,128,0.15)',
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
