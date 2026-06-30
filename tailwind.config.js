/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          darkBg: '#090d16',
          panelBg: '#121824',
          border: '#1f293d',
          accent: '#3b82f6',
          accentHover: '#2563eb',
          textMuted: '#9ca3af',
          textActive: '#f3f4f6',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          gold: '#f59e0b'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
