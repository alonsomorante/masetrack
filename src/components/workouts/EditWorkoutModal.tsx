'use client'

import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'

interface Workout {
  id: number
  weight_kg: number
  reps: number
  sets: number
  rir: number | null
  notes: string | null
  exercise_name?: string
}

interface EditWorkoutModalProps {
  isOpen: boolean
  onClose: () => void
  workout: Workout | null
  onSave: (id: number, data: Partial<Workout>) => void
}

export default function EditWorkoutModal({ isOpen, onClose, workout, onSave }: EditWorkoutModalProps) {
  const [formData, setFormData] = useState({
    weight_kg: 0,
    reps: 0,
    sets: 0,
    rir: null as number | null,
    notes: '',
  })

  useEffect(() => {
    if (workout) {
      setFormData({
        weight_kg: workout.weight_kg,
        reps: workout.reps,
        sets: workout.sets,
        rir: workout.rir,
        notes: workout.notes || '',
      })
    }
  }, [workout])

  if (!isOpen || !workout) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(workout.id, formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Editar Entrenamiento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="mb-4">
            <p className="text-sm text-gray-500">Ejercicio</p>
            <p className="text-lg font-medium text-gray-900">{workout.exercise_name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repeticiones
              </label>
              <input
                type="number"
                value={formData.reps}
                onChange={(e) => setFormData({ ...formData, reps: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Series
              </label>
              <input
                type="number"
                value={formData.sets}
                onChange={(e) => setFormData({ ...formData, sets: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RIR
              </label>
              <input
                type="number"
                value={formData.rir || ''}
                onChange={(e) => setFormData({ ...formData, rir: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Agrega comentarios..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
