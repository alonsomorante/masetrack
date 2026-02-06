/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Modo oscuro (industrial)
        industrial: {
          black: '#0D0D0D',
          dark: '#1A1A1A',
          metal: '#3D3D3D',
          grey: '#6B6B6B',
          light: '#A3A3A3',
          panel: '#E8E8E8',
          white: '#F0F0F0',
          yellow: '#FFB800',
          'yellow-dark': '#CC9200',
          green: '#00C853',
          red: '#FF1744',
        },
        // Modo claro (industrial light)
        industrialLight: {
          bg: '#F5F5F0',
          panel: '#FFFFFF',
          'panel-hover': '#F0F0EB',
          border: '#D4D4CF',
          text: '#2A2A2A',
          'text-muted': '#6B6B6B',
          yellow: '#E6A600',
          'yellow-light': '#FFD966',
        },
      },
      fontFamily: {
        display: ['var(--font-chakra)', 'sans-serif'],
        mono: ['var(--font-roboto-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}
