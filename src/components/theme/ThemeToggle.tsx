'use client'

import { useTheme } from './ThemeProvider'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider transition-colors
        dark:bg-industrial-metal dark:text-industrial-light dark:hover:text-industrial-white dark:hover:bg-industrial-grey
        bg-industrialLight-panel border border-industrialLight-border text-industrialLight-text hover:bg-industrialLight-panel-hover"
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4" />
          <span className="hidden sm:inline">CLARO</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4" />
          <span className="hidden sm:inline">OSCURO</span>
        </>
      )}
    </button>
  )
}
