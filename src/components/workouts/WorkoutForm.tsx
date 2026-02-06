'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Dumbbell, ChevronDown, Search, Loader2 } from 'lucide-react'

interface Exercise {
  id: number
  name: string
  muscle_group: string
  equipment_type: string | null
  description: string | null
  image_url?: string
  isCustom?: boolean
}

interface WorkoutFormProps {
  isOpen: boolean
  onClose: () => void
  userPhone: string
  onSuccess: () => void
}

export default function WorkoutForm({ isOpen, onClose, userPhone, onSuccess }: WorkoutFormProps) {
  const [step, setStep] = useState(1)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [customExercises, setCustomExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [formData, setFormData] = useState({
    weight_kg: '',
    reps: '',
    sets: '',
    rir: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && userPhone) {
      fetchExercises()
    }
  }, [isOpen, userPhone])

  const fetchExercises = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/exercises/list?phone=${userPhone}`)
      const data = await response.json()
      
      if (response.ok) {
        setExercises(data.official.map((e: Exercise) => ({ ...e, isCustom: false })))
        setCustomExercises(data.custom.map((e: Exercise) => ({ ...e, isCustom: true })))
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const payload = {
        user_phone: userPhone,
        exercise_id: selectedExercise?.isCustom ? null : selectedExercise?.id,
        custom_exercise_id: selectedExercise?.isCustom ? selectedExercise?.id : null,
        weight_kg: parseFloat(formData.weight_kg),
        reps: parseInt(formData.reps),
        sets: parseInt(formData.sets),
        rir: formData.rir ? parseInt(formData.rir) : null,
        notes: formData.notes
      }

      const response = await fetch('/api/workouts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
        onClose()
        // Reset form
        setStep(1)
        setSelectedExercise(null)
        setFormData({ weight_kg: '', reps: '', sets: '', rir: '', notes: '' })
      } else {
        setError(data.error || 'Error al guardar')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const allExercises = [...exercises, ...customExercises]
  const filteredExercises = searchTerm 
    ? allExercises.filter(e => 
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.muscle_group.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allExercises

  const groupedExercises = filteredExercises.reduce((acc, exercise) => {
    const group = exercise.muscle_group
    if (!acc[group]) acc[group] = []
    acc[group].push(exercise)
    return acc
  }, {} as Record<string, Exercise[]>)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-6 h-6" />
            <h2 className="text-xl font-bold">
              {step === 1 ? 'Seleccionar Ejercicio' : 'Registrar Entrenamiento'}
            </h2>
          </div>
          <button onClick={onClose} className="hover:bg-blue-700 p-2 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {step === 1 ? (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar ejercicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Exercise List */}
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                  <p className="text-gray-500 mt-2">Cargando ejercicios...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedExercises).map(([group, groupExercises]) => (
                    <div key={group}>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        {group}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupExercises.map((exercise) => (
                          <button
                            key={`${exercise.isCustom ? 'custom-' : ''}${exercise.id}`}
                            onClick={() => handleSelectExercise(exercise)}
                            className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900 group-hover:text-blue-700">
                                  {exercise.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {exercise.equipment_type || 'Sin equipo'}
                                </p>
                              </div>
                              {exercise.isCustom && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                  Personalizado
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selected Exercise */}
              <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Ejercicio seleccionado</p>
                  <p className="font-semibold text-blue-900">{selectedExercise?.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Cambiar
                </button>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="80"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repeticiones *
                  </label>
                  <input
                    type="number"
                    value={formData.reps}
                    onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Series *
                  </label>
                  <input
                    type="number"
                    value={formData.sets}
                    onChange={(e) => setFormData({ ...formData, sets: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RIR (0-5)
                  </label>
                  <select
                    value={formData.rir}
                    onChange={(e) => setFormData({ ...formData, rir: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar</option>
                    <option value="0">0 - Fallo</option>
                    <option value="1">1 - Casi fallo</option>
                    <option value="2">2 - 2 reps en reserva</option>
                    <option value="3">3 - 3 reps en reserva</option>
                    <option value="4">4 - 4 reps en reserva</option>
                    <option value="5">5 - Muy fácil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="¿Cómo te sentiste? ¿Alguna observación?"
                  rows={3}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Guardar Entrenamiento
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}