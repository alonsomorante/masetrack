'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Activity, BarChart3, Database, Settings } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export default function LandingPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/verify?phone=${encodeURIComponent(phone)}&register=true`)
        }, 2000)
      } else {
        setError(data.error || 'ERROR: REGISTRO FALLIDO')
      }
    } catch (err) {
      setError('ERROR: CONEXIÓN PERDIDA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* TOP STATUS BAR */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-4 py-2">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="status-indicator status-active"></span>
              <span className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider">SISTEMA ONLINE</span>
            </div>
            <div className="font-mono text-xs text-[var(--text-muted)]">v2.1.4</div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="font-mono text-xs text-[var(--text-muted)]">
              {new Date().toLocaleDateString()} // {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[var(--accent)] flex items-center justify-center">
              <Activity className="w-6 h-6 text-[var(--bg-primary)]" />
            </div>
            <div>
              <span className="font-display text-xl font-bold text-[var(--text-primary)] tracking-wider">
                FITTRACK PRO
              </span>
              <span className="font-mono text-xs text-[var(--accent)] block">SISTEMA DE CONTROL</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* LEFT SIDE - SYSTEM INFO */}
          <div className="space-y-6">
            {/* TITLE BLOCK */}
            <div className="tech-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-[var(--accent)]" />
                <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider">MÓDULO DE REGISTRO</span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--text-primary)] uppercase tracking-wide mb-2">
                CONTROL DE ENTRENAMIENTO
              </h1>
              <div className="tech-separator my-4"></div>
              <p className="font-mono text-sm text-[var(--text-secondary)] leading-relaxed">
                Sistema de registro y monitoreo de actividad física. 
                Almacenamiento de datos de rendimiento y métricas de progreso.
              </p>
            </div>

            {/* STATS PANEL */}
            <div className="tech-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-[var(--accent)]" />
                <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider">ESPECIFICACIONES</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'REGISTRO', value: 'WHATSAPP/WEB', status: 'ACTIVE' },
                  { label: 'VISUALIZACIÓN', value: 'GRÁFICOS', status: 'ACTIVE' },
                  { label: 'CATÁLOGO', value: 'EJERCICIOS', status: 'ACTIVE' },
                  { label: 'PERSONALIZACIÓN', value: 'CUSTOM', status: 'ACTIVE' },
                ].map((item, i) => (
                  <div key={i} className="tech-panel-inset p-3">
                    <div className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">{item.label}</div>
                    <div className="font-display text-sm text-[var(--text-primary)]">{item.value}</div>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="status-indicator status-active"></span>
                      <span className="font-mono text-[10px] text-[var(--success)]">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - REGISTRATION FORM */}
          <div>
            <div className="tech-panel p-6">
              {/* FORM HEADER */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
                <div>
                  <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider block mb-1">
                    NUEVO USUARIO
                  </span>
                  <h2 className="font-display text-xl font-bold text-[var(--text-primary)] uppercase tracking-wide">
                    REGISTRO DE ACCESO
                  </h2>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs text-[var(--text-muted)] block">ID: AUTO</span>
                  <span className="font-mono text-xs text-[var(--text-muted)]">STATUS: PENDING</span>
                </div>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <div className="inline-block bg-[var(--success)] p-4 mb-4">
                    <Activity className="w-8 h-8 text-[var(--bg-primary)]" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-[var(--text-primary)] uppercase mb-2">
                    REGISTRO EXITOSO
                  </h3>
                  <p className="font-mono text-sm text-[var(--text-secondary)]">
                    CÓDIGO DE VERIFICACIÓN ENVIADO
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                      NOMBRE COMPLETO // ID-001
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="[INGRESAR NOMBRE]"
                      className="tech-input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                      WHATSAPP // ID-002
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="[+XX XXXXXXXXX]"
                      className="tech-input w-full"
                      required
                    />
                    <p className="font-mono text-[10px] text-[var(--text-muted)] mt-2 uppercase">
                      Formato: +51 para Perú
                    </p>
                  </div>

                  {error && (
                    <div className="bg-[var(--error)]/10 border border-[var(--error)] p-3">
                      <p className="font-mono text-xs text-[var(--error)] uppercase">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="tech-btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="font-mono">PROCESANDO...</span>
                      </>
                    ) : (
                      <span className="font-display">INICIAR REGISTRO →</span>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-6 pt-4 border-t border-[var(--border-color)] text-center">
                <p className="font-mono text-xs text-[var(--text-muted)]">
                  USUARIO EXISTENTE?{' '}
                  <a href="/login" className="text-[var(--accent)] hover:text-[var(--text-primary)] transition-colors uppercase">
                    ACCEDER AL SISTEMA →
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)] mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="font-mono text-xs text-[var(--text-muted)]">
              SISTEMA DE CONTROL // FITTRACK PRO v2.1.4
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-[var(--text-muted)]">MEM: 64%</span>
              <span className="font-mono text-xs text-[var(--text-muted)]">CPU: 23%</span>
              <div className="flex items-center gap-1">
                <span className="status-indicator status-active"></span>
                <span className="font-mono text-xs text-[var(--success)]">ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
