'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  History, 
  Dumbbell,
  Menu,
  X,
  Activity,
  Settings,
  LogOut
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

interface SidebarProps {
  userName: string
}

const menuItems = [
  { href: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard, id: 'MOD-01' },
  { href: '/dashboard/history', label: 'HISTORIAL', icon: History, id: 'MOD-02' },
  { href: '/dashboard/exercises', label: 'EJERCICIOS', icon: Dumbbell, id: 'MOD-03' },
]

export default function Sidebar({ userName }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--accent)] flex items-center justify-center">
            <Activity className="w-5 h-5 text-[var(--bg-primary)]" />
          </div>
          <div>
            <span className="font-display text-sm font-bold text-[var(--text-primary)] tracking-wider">FITTRACK</span>
            <span className="font-mono text-[10px] text-[var(--accent)] block">v2.1.4</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-8 h-8 bg-[var(--bg-panel)] border border-[var(--border-color)] flex items-center justify-center hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-colors"
          >
            {isOpen ? <X className="w-4 h-4 text-[var(--text-primary)]" /> : <Menu className="w-4 h-4 text-[var(--text-primary)]" />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-[var(--bg-primary)]/80 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen w-72 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] z-50
        transform transition-transform duration-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo - Desktop */}
          <div className="hidden lg:block p-4 border-b border-[var(--border-color)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--accent)] flex items-center justify-center">
                  <Activity className="w-6 h-6 text-[var(--bg-primary)]" />
                </div>
                <div>
                  <h1 className="font-display text-lg font-bold text-[var(--text-primary)] tracking-wider">FITTRACK PRO</h1>
                  <p className="font-mono text-[10px] text-[var(--accent)] uppercase">SISTEMA DE CONTROL</p>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Toggle - Desktop */}
          <div className="hidden lg:block p-4 border-b border-[var(--border-color)]">
            <ThemeToggle />
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-[var(--border-color)]">
            <div className="tech-panel-inset p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">OPERADOR</span>
                <span className="status-indicator status-active"></span>
              </div>
              <p className="font-display text-sm text-[var(--text-primary)] truncate">{userName || 'USUARIO'}</p>
              <p className="font-mono text-[10px] text-[var(--text-muted)] mt-1">ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <div className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3 px-3">
              MÓDULOS DEL SISTEMA
            </div>
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-3 transition-all
                    ${active 
                      ? 'bg-[var(--accent)] text-[var(--bg-primary)]' 
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-panel)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <div className="flex-1">
                    <span className="font-display text-xs font-semibold tracking-wider block">{item.label}</span>
                    <span className={`font-mono text-[10px] ${active ? 'text-[var(--bg-primary)]/60' : 'text-[var(--text-muted)]'}`}>{item.id}</span>
                  </div>
                  {active && <div className="w-1 h-8 bg-[var(--bg-primary)]"></div>}
                </Link>
              )
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[var(--border-color)] space-y-2">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] transition-colors">
              <Settings className="w-4 h-4" />
              <span className="font-mono text-xs uppercase tracking-wider">CONFIGURACIÓN</span>
            </button>
            <button 
              onClick={() => {
                localStorage.clear()
                window.location.href = '/login'
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--bg-panel)] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-mono text-xs uppercase tracking-wider">CERRAR SESIÓN</span>
            </button>
          </div>

          {/* Footer Status */}
          <div className="p-3 bg-[var(--bg-primary)] border-t border-[var(--border-color)]">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-[var(--text-muted)]">SYS v2.1.4</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[var(--success)]">ONLINE</span>
                <span className="status-indicator status-active"></span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
