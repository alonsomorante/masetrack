'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar,
  Dumbbell,
  Activity,
  BarChart3,
  Loader2
} from 'lucide-react'
import { 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Workout {
  id: number
  weight_kg: number
  reps: number
  sets: number
  rir: number | null
  notes: string | null
  created_at: string
  exercise_id: number | null
  custom_exercise_id: number | null
  exercises: {
    name: string
    muscle_group: string
  } | null
  custom_exercises: {
    name: string
    muscle_group: string
  } | null
  is_custom?: boolean
  exercise_name?: string
  muscle_group?: string
}

interface Stats {
  totalWorkouts: number
  uniqueExercises: number
  muscleGroups: Record<string, number>
}

// Chart colors that work in both modes
const COLORS = ['#FFB800', '#00C853', '#FF1744', '#00B0FF', '#AA00FF', '#FF6D00', '#2979FF', '#76FF03', '#FF3D00']

export default function DashboardPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSandboxBanner, setShowSandboxBanner] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const phone = localStorage.getItem('userPhone')
    
    if (!phone) {
      router.push('/login')
      return
    }
    
    // Verificar si el usuario necesita unirse al WhatsApp Sandbox
    const whatsappJoined = localStorage.getItem('whatsappJoined')
    if (whatsappJoined === 'false') {
      setShowSandboxBanner(true)
    }
    
    fetchDashboardData(phone)
  }, [router])

  const fetchDashboardData = async (phone: string) => {
    try {
      const response = await fetch(`/api/dashboard/stats?phone=${encodeURIComponent(phone)}`)
      const data = await response.json()

      if (response.ok) {
        setWorkouts(data.workouts)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Datos para el pie chart (sets por grupo muscular)
  const muscleGroupData = useMemo(() => {
    const groupSets: Record<string, number> = {}
    
    workouts.forEach(w => {
      const group = w.muscle_group || w.exercises?.muscle_group || w.custom_exercises?.muscle_group || 'otros'
      groupSets[group] = (groupSets[group] || 0) + w.sets
    })
    
    return Object.entries(groupSets)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [workouts])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[var(--accent)] mx-auto" />
            <p className="mt-4 font-mono text-sm text-[var(--text-muted)]">CARGANDO DATOS DEL SISTEMA...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-[var(--accent)]" />
            <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider">PANEL DE CONTROL</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] uppercase tracking-wide">
            DASHBOARD PRINCIPAL
          </h1>
        </div>

        {/* WhatsApp Sandbox Banner */}
        {showSandboxBanner && (
          <div className="bg-yellow-500/10 border border-yellow-500 p-4 mb-6">
            <h3 className="font-bold text-yellow-500 mb-2">⚠️ Activa WhatsApp</h3>
            <p className="text-sm">Para registrar entrenamientos por WhatsApp:</p>
            <ol className="list-decimal ml-5 mt-2 space-y-1 text-sm">
              <li>Abre WhatsApp</li>
              <li>Envía mensaje a: <strong>+14155238886</strong></li>
              <li>Escribe: <code>join needs-policeman</code></li>
            </ol>
            <p className="mt-2 text-xs text-gray-500">
              Una vez hecho, podrás escribirnos tus entrenamientos por WhatsApp.
            </p>
          </div>
        )}
         
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="tech-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[var(--accent)]" />
                <span className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider">MÉTRICA 001</span>
              </div>
              <div className="status-indicator status-active"></div>
            </div>
            <p className="font-mono text-xs text-[var(--text-muted)] uppercase mb-1">Total Entrenamientos</p>
            <p className="font-display text-4xl font-bold text-[var(--text-primary)]">{stats?.totalWorkouts || 0}</p>
          </div>

          <div className="tech-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-[var(--success)]" />
                <span className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider">MÉTRICA 002</span>
              </div>
              <div className="status-indicator status-active"></div>
            </div>
            <p className="font-mono text-xs text-[var(--text-muted)] uppercase mb-1">Ejercicios Diferentes</p>
            <p className="font-display text-4xl font-bold text-[var(--text-primary)]">{stats?.uniqueExercises || 0}</p>
          </div>
        </div>

        {/* Sets por Grupo Muscular */}
        <div className="tech-panel p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-[var(--accent)]" />
              <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider">VISUALIZACIÓN</span>
            </div>
            <div className="font-mono text-xs text-[var(--text-muted)]">
              ID: CHART-001
            </div>
          </div>
          
          <h2 className="font-display text-lg font-bold text-[var(--text-primary)] uppercase tracking-wide mb-4">
            Sets por Grupo Muscular
          </h2>
          
          <div className="h-80">
            {muscleGroupData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={muscleGroupData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, value }: any) => 
                      `${name || ''}: ${value} sets (${((percent || 0) * 100).toFixed(0)}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {muscleGroupData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any) => [`${value} sets`, name]}
                    contentStyle={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-mono text-sm uppercase tracking-wider">No hay datos suficientes</p>
                  <p className="font-mono text-xs mt-2">Registra tu primer entrenamiento por WhatsApp</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
