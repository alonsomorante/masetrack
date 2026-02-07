'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Loader2, CheckCircle, Lock, Shield } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

function VerifyForm() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone') || ''
  const isRegister = searchParams.get('register') === 'true'

  useEffect(() => {
    if (!phone) {
      router.push('/login')
    }
  }, [phone, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, isRegister }),
      })

      const data = await response.json()

      if (response.ok) {
        setVerified(true)
        
        // Guardar sesión
        localStorage.setItem('userPhone', phone)
        localStorage.setItem('userName', data.user?.name || '')
        
        // Guardar estado de WhatsApp Sandbox
        if (data.whatsappJoined === false) {
          localStorage.setItem('whatsappJoined', 'false')
        } else {
          localStorage.setItem('whatsappJoined', 'true')
        }
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setError(data.error || 'CÓDIGO INVÁLIDO O EXPIRADO')
      }
    } catch (err) {
      setError('ERROR: CONEXIÓN PERDIDA')
    } finally {
      setLoading(false)
    }
  }

  if (verified) {
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

        <div className="relative z-10 max-w-md w-full tech-panel p-8 text-center">
          <div className="w-16 h-16 bg-[var(--success)] mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-[var(--bg-primary)]" />
          </div>
          <h1 className="font-display text-xl font-bold text-[var(--text-primary)] uppercase mb-2">
            {isRegister ? 'CUENTA VERIFICADA' : 'BIENVENIDO'}
          </h1>
          <p className="font-mono text-sm text-[var(--text-secondary)]">
            REDIRIGIENDO AL SISTEMA...
          </p>
        </div>
      </div>
    )
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
                <Lock className="w-5 h-5 text-[var(--bg-primary)]" />
              </div>
              <div>
                <span className="font-display text-sm font-bold text-[var(--text-primary)] tracking-wider">MASETRACK</span>
                <span className="font-mono text-[10px] text-[var(--accent)] block">VERIFICACIÓN DE ACCESO</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Verify Panel */}
        <div className="tech-panel p-6">
          {/* Panel Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div>
                <span className="font-mono text-[10px] text-[var(--accent)] uppercase tracking-wider block">MÓDULO</span>
                <span className="font-display text-lg font-bold text-[var(--text-primary)] uppercase">VERIFICACIÓN</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs text-[var(--text-muted)] block">{phone}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                CÓDIGO DE VERIFICACIÓN // AUTH-001
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="[000000]"
                maxLength={6}
                className="tech-input w-full text-center text-2xl tracking-[0.5em]"
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
                  <span className="font-mono">VERIFICANDO...</span>
                </>
              ) : (
                <>
                  <span className="font-display">VERIFICAR</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[var(--border-color)]">
            <button
              onClick={() => router.push(isRegister ? '/' : '/login')}
              className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors uppercase"
            >
              ← VOLVER
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
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
        <div className="relative z-10 max-w-md w-full tech-panel p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--accent)]" />
          <p className="font-mono text-sm text-[var(--text-muted)]">CARGANDO...</p>
        </div>
      </div>
    }>
      <VerifyForm />
    </Suspense>
  )
}
