/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        dark: {
          950: '#060B12', // Obsidian Navy Deepest
          900: '#0B131F', // Deep Obsidian Navy (Image 1 Canvas Background)
          800: '#111C2E', // Elevated Navy Slate (Image 1 Cards/Surfaces)
          700: '#17243B', // Inset Navy Slate (Secondary Surfaces)
          600: '#1E2D44', // Slate Border / Divider
          500: '#2A3C57',
        },
        mint: {
          50: '#E6FAF4',
          100: '#CEF5E9',
          200: '#9DEBD3',
          300: '#6CE1BD',
          400: '#3BD7A7',
          500: '#00D492', // Electric Mint (Image 1 Primary Accent / Highlights)
          600: '#00B87E',
          700: '#009667',
          800: '#007550',
          900: '#00543A',
        },
        azure: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0099D8', // Ocean Azure (Image 2 Primary Accent)
          600: '#0284C7',
          700: '#0369A1',
          800: '#0F3868', // Deep Midnight Royal Navy (Image 2 Hero Card)
          900: '#0D1F36', // Midnight Slate (Image 2 Primary Text)
          950: '#071324',
        },
        slateNavy: {
          50: '#F3F6FA',  // Soft Cloud Gray (Image 2 Canvas Background)
          100: '#E5EBF2',
          200: '#CDD7E5',
          300: '#AFC0D4',
          400: '#8E9BAE', // Cool Slate (Image 1 Body Text)
          500: '#5B6D82', // Medium Slate (Image 2 Body Text)
          600: '#425368',
          700: '#2D3A4B',
          800: '#1C2735',
          900: '#0D1F36',
        },
        primary: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#00D492', // Electric Mint
          500: '#0099D8', // Ocean Azure
          600: '#0284c7',
          700: '#0369a1',
          800: '#0F3868', // Deep Midnight Navy
          900: '#0D1F36',
          950: '#071324',
        },
        lightBlue: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0099D8',
          600: '#0284c7',
          700: '#0369a1',
          800: '#0F3868',
          900: '#0D1F36',
          950: '#071324',
        },
        cyanBlue: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#00C4CC', // Vibrant Cyan
          500: '#0099D8',
          600: '#0891b2',
          700: '#0e7490',
          800: '#0F3868',
          900: '#0D1F36',
          950: '#071324',
        },
        seafoam: {
          50: '#E6FAF4',
          100: '#CEF5E9',
          200: '#9DEBD3',
          300: '#6CE1BD',
          400: '#3BD7A7',
          500: '#00D492',
          600: '#00B87E',
          700: '#009667',
          800: '#007550',
          900: '#00543A',
          950: '#0B131F',
        },
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0099D8',
          600: '#0284c7',
          700: '#0F3868',
        },
        accent: {
          300: '#6CE1BD',
          400: '#00D492',
          500: '#0099D8',
          600: '#0F3868',
        },
        // Map legacy purple classes directly to azure/mint scale for 100% theme consistency
        purple: {
          50: '#E6FAF4',
          100: '#CEF5E9',
          200: '#9DEBD3',
          300: '#6CE1BD',
          400: '#00D492',
          500: '#0099D8',
          600: '#0284c7',
          700: '#0F3868',
          800: '#075985',
          900: '#0D1F36',
          950: '#071324',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 10px rgba(14, 165, 233, 0.65))' },
          '50%': { opacity: '.7', filter: 'drop-shadow(0 0 20px rgba(56, 189, 248, 0.9))' },
        }
      }
    },
  },
  plugins: [],
}
