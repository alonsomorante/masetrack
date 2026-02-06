'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Trash2,
  Edit2,
  ChevronDown,
  Filter,
  X,
  History,
  Database,
  Loader2
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import EditWorkoutModal from '@/components/workouts/EditWorkoutModal'

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

const MUSCLE_GROUPS = ['todos', 'pecho', 'espalda', 'piernas', 'hombros', 'biceps', 'triceps', 'core']

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [filterGroup, setFilterGroup] = useState('todos')
  const [filterExercise, setFilterExercise] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const phone = localStorage.getItem('userPhone')
    
    if (!phone) {
      router.push('/login')
      return
    }
    
    fetchWorkouts(phone)
  }, [router])

  const fetchWorkouts = async (phone: string) => {
    try {
      const response = await fetch(`/api/dashboard/stats?phone=${encodeURIComponent(phone)}`)
      const data = await response.json()

      if (response.ok) {
        setWorkouts(data.workouts)
      }
    } catch (error) {
      console.error('Error fetching workouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWorkout = async (id: number) => {
    if (!confirm('¿CONFIRMAR ELIMINACIÓN DE REGISTRO?')) return
    
    try {
      const response = await fetch(`/api/workouts/delete?id=${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        const phone = localStorage.getItem('userPhone')
        if (phone) fetchWorkouts(phone)
      }
    } catch (error) {
      console.error('Error deleting workout:', error)
    }
  }

  const handleEditWorkout = async (id: number, data: Partial<Workout>) => {
    try {
      const response = await fetch(`/api/workouts/update?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (response.ok) {
        setEditingWorkout(null)
        const phone = localStorage.getItem('userPhone')
        if (phone) fetchWorkouts(phone)
      }
    } catch (error) {
      console.error('Error updating workout:', error)
    }
  }

  // Lista única de ejercicios para el filtro
  const uniqueExercises = useMemo(() => {
    const exercises = new Set<string>()
    workouts.forEach(w => {
      const name = w.exercise_name || w.exercises?.name || w.custom_exercises?.name
      if (name) exercises.add(name)
    })
    return Array.from(exercises).sort()
  }, [workouts])

  // Filtrar workouts
  const filteredWorkouts = useMemo(() => {
    return workouts.filter(w => {
      const muscleGroup = w.muscle_group || w.exercises?.muscle_group || w.custom_exercises?.muscle_group || ''
      const exerciseName = w.exercise_name || w.exercises?.name || w.custom_exercises?.name || ''
      
      const matchesGroup = filterGroup === 'todos' || muscleGroup.toLowerCase() === filterGroup.toLowerCase()
      const matchesExercise = !filterExercise || exerciseName.toLowerCase().includes(filterExercise.toLowerCase())
      
      return matchesGroup && matchesExercise
    })
  }, [workouts, filterGroup, filterExercise])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[var(--accent)] mx-auto" />
            <p className="mt-4 font-mono text-sm text-[var(--text-muted)]">CARGANDO REGISTROS...</p>
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
            <History className="w-5 h-5 text-[var(--accent)]" />
            <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider">REGISTROS</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] uppercase tracking-wide">
              HISTORIAL
            </h1>
            
            {/* Filter Button - Mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden tech-btn flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" />
              FILTROS
              {showFilters ? <X className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`tech-panel p-4 mb-6 ${showFilters ? 'block' : 'hidden sm:block'}`}>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--border-color)]">
            <Database className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider">FILTROS DE BÚSQUEDA</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Grupo Muscular
              </label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="tech-input w-full"
              >
                {MUSCLE_GROUPS.map(group => (
                  <option key={group} value={group}>
                    {group.charAt(0).toUpperCase() + group.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Ejercicio
              </label>
              <input
                type="text"
                value={filterExercise}
                onChange={(e) => setFilterExercise(e.target.value)}
                placeholder="[BUSCAR EJERCICIO]"
                className="tech-input w-full"
              />
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block tech-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--table-header-bg)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="px-6 py-3 text-left font-mono text-xs text-white uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left font-mono text-xs text-white uppercase tracking-wider">Ejercicio</th>
                  <th className="px-6 py-3 text-left font-mono text-xs text-white uppercase tracking-wider">Grupo</th>
                  <th className="px-6 py-3 text-left font-mono text-xs text-white uppercase tracking-wider">Peso</th>
                  <th className="px-6 py-3 text-left font-mono text-xs text-white uppercase tracking-wider">Reps</th>
                  <th className="px-6 py-3 text-left font-mono text-xs text-white uppercase tracking-wider">RIR</th>
                  <th className="px-6 py-3 text-left font-mono text-xs text-white uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--table-divider)]">
                {filteredWorkouts.map((workout) => {
                  const exerciseName = workout.exercise_name || workout.exercises?.name || workout.custom_exercises?.name || 'Ejercicio personalizado'
                  const muscleGroup = workout.muscle_group || workout.exercises?.muscle_group || workout.custom_exercises?.muscle_group || 'Personalizado'
                  const isCustom = workout.is_custom || workout.custom_exercise_id !== null
                  
                  return (
                    <tr key={workout.id} className="hover:bg-[var(--table-row-hover)] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-[var(--text-secondary)]">
                        {new Date(workout.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm text-[var(--text-primary)]">{exerciseName}</span>
                          {isCustom && (
                            <span className="inline-flex items-center px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider bg-[var(--accent)] text-[var(--bg-primary)]">
                              Custom
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-[var(--text-secondary)] capitalize">
                        {muscleGroup}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-display text-sm text-[var(--text-primary)] font-bold">
                        {workout.weight_kg} kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-[var(--text-secondary)]">
                        {workout.reps} reps
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-[var(--text-secondary)]">
                        {workout.rir !== null ? `${workout.rir} RIR` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingWorkout({ ...workout, exercise_name: exerciseName })}
                            className="text-[var(--accent)] hover:text-[var(--text-primary)] p-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--border-color)] transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWorkout(workout.id)}
                            className="text-[var(--error)] hover:text-[var(--text-primary)] p-2 bg-[var(--error)]/10 border border-[var(--error)]/30 hover:bg-[var(--error)] transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {filteredWorkouts.map((workout) => {
            const exerciseName = workout.exercise_name || workout.exercises?.name || workout.custom_exercises?.name || 'Ejercicio personalizado'
            const muscleGroup = workout.muscle_group || workout.exercises?.muscle_group || workout.custom_exercises?.muscle_group || 'Personalizado'
            const isCustom = workout.is_custom || workout.custom_exercise_id !== null
            
            return (
              <div key={workout.id} className="tech-panel p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-display text-sm text-[var(--text-primary)] flex items-center gap-2">
                      {exerciseName}
                      {isCustom && (
                        <span className="px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider bg-[var(--accent)] text-[var(--bg-primary)]">
                          Custom
                        </span>
                      )}
                    </h3>
                    <p className="font-mono text-xs text-[var(--text-secondary)] capitalize">{muscleGroup}</p>
                  </div>
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {new Date(workout.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3 py-3 border-y border-[var(--border-color)]">
                  <div className="text-center">
                    <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase">Peso</p>
                    <p className="font-display text-lg text-[var(--text-primary)] font-bold">{workout.weight_kg} kg</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase">Reps</p>
                    <p className="font-display text-lg text-[var(--text-primary)] font-bold">{workout.reps}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase">RIR</p>
                    <p className="font-display text-lg text-[var(--text-primary)] font-bold">{workout.rir !== null ? workout.rir : '-'}</p>
                  </div>
                </div>

                {workout.notes && (
                  <p className="font-mono text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] p-2 mb-3">
                    {workout.notes}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingWorkout({ ...workout, exercise_name: exerciseName })}
                    className="flex-1 px-4 py-2 bg-[var(--bg-secondary)] text-[var(--accent)] border border-[var(--border-color)] font-mono text-xs uppercase tracking-wider hover:bg-[var(--border-color)] transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteWorkout(workout.id)}
                    className="flex-1 px-4 py-2 bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/30 font-mono text-xs uppercase tracking-wider hover:bg-[var(--error)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filteredWorkouts.length === 0 && (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4 opacity-30" />
            <p className="font-mono text-sm text-[var(--text-muted)] uppercase tracking-wider">No se encontraron registros</p>
            <p className="font-mono text-xs text-[var(--text-secondary)] mt-2">Registra tu primer entrenamiento por WhatsApp</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditWorkoutModal
        isOpen={!!editingWorkout}
        onClose={() => setEditingWorkout(null)}
        workout={editingWorkout}
        onSave={handleEditWorkout}
      />
    </DashboardLayout>
  )
}
