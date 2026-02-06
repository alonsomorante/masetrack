'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Activity, Lock } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export default function UserLoginPage() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/verify?phone=${encodeURIComponent(phone)}`)
      } else {
        setError(data.error || 'ERROR: ENVÍO FALLIDO')
      }
    } catch (err) {
      setError('ERROR: CONEXIÓN PERDIDA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background Grid - uses CSS variables */}
      <div 
        className="fixed inset-0 bg-[var(--bg-primary)]" 
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)
          `,
          backgroundSize: '8px 8px'
        }}
      />

      <div className="relative z-10 max-w-md w-full">
        {/* System Header */}
        <div className="tech-panel p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[var(--accent)] flex items-center justify-center">
                <Activity className="w-5 h-5 text-[var(--bg-primary)]" />
              </div>
              <div>
                <span className="font-display text-sm font-bold text-[var(--text-primary)] tracking-wider">FITTRACK PRO</span>
                <span className="font-mono text-[10px] text-[var(--accent)] block">SISTEMA DE CONTROL</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Login Panel */}
        <div className="tech-panel p-6">
          {/* Panel Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center">
                <Lock className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div>
                <span className="font-mono text-[10px] text-[var(--accent)] uppercase tracking-wider block">MÓDULO</span>
                <span className="font-display text-lg font-bold text-[var(--text-primary)] uppercase">AUTENTICACIÓN</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs text-[var(--text-muted)] block">v2.1.4</span>
              <span className="font-mono text-[10px] text-[var(--success)]">ONLINE</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                WHATSAPP // ID-USER
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="[+XX XXXXXXXXX]"
                className="tech-input w-full"
                required
              />
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
                <>
                  <span className="font-display">CONTINUAR</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[var(--border-color)] text-center">
            <p className="font-mono text-xs text-[var(--text-muted)]">
              ¿NUEVO USUARIO?{' '}
              <a href="/" className="text-[var(--accent)] hover:text-[var(--text-primary)] transition-colors uppercase">
                REGISTRARSE →
              </a>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 tech-panel-inset p-3">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[10px] text-[var(--text-muted)]">SISTEMA DE CONTROL</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[var(--text-muted)]">MEM: 42%</span>
              <span className="status-indicator status-active"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
