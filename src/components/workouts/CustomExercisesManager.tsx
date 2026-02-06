'use client'

import { useState } from 'react'
import { X, Plus, Upload, Camera, Trash2, Edit2, Save } from 'lucide-react'

interface CustomExercise {
  id: number
  name: string
  muscle_group: string
  image_url: string | null
  created_at: string
}

interface CustomExercisesManagerProps {
  isOpen: boolean
  onClose: () => void
  exercises: CustomExercise[]
  userPhone: string
  onUpdate: () => void
}

const MUSCLE_GROUPS = ['pecho', 'espalda', 'piernas', 'hombros', 'biceps', 'triceps', 'core', 'cardio', 'otros']

export default function CustomExercisesManager({ 
  isOpen, 
  onClose, 
  exercises, 
  userPhone,
  onUpdate 
}: CustomExercisesManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<CustomExercise | null>(null)
  const [newExercise, setNewExercise] = useState({ name: '', muscle_group: 'pecho' })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  if (!isOpen) return null

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    // Aquí implementarías la subida a un servicio como Cloudinary, AWS S3, etc.
    // Por ahora, simulamos con una URL local
    return URL.createObjectURL(file)
  }

  const handleCreateExercise = async () => {
    if (!newExercise.name.trim()) return

    try {
      let imageUrl = null
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage)
      }

      const response = await fetch('/api/custom-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_phone: userPhone,
          name: newExercise.name,
          muscle_group: newExercise.muscle_group,
          ...(imageUrl && { image_url: imageUrl })
        })
      })

      if (response.ok) {
        setNewExercise({ name: '', muscle_group: 'pecho' })
        setSelectedImage(null)
        setImagePreview(null)
        setShowCreateForm(false)
        onUpdate()
      }
    } catch (error) {
      console.error('Error creating exercise:', error)
    }
  }

  const handleUpdateExercise = async () => {
    if (!editingExercise) return

    try {
      let imageUrl = editingExercise.image_url
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage)
      }

      const response = await fetch(`/api/custom-exercises/update?id=${editingExercise.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingExercise.name,
          muscle_group: editingExercise.muscle_group,
          image_url: imageUrl
        })
      })

      if (response.ok) {
        setEditingExercise(null)
        setSelectedImage(null)
        setImagePreview(null)
        onUpdate()
      }
    } catch (error) {
      console.error('Error updating exercise:', error)
    }
  }

  const handleDeleteExercise = async (id: number) => {
    if (!confirm('¿Eliminar este ejercicio? Se perderán los registros asociados.')) return

    try {
      const response = await fetch(`/api/custom-exercises/update?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error deleting exercise:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Mis Ejercicios Personalizados</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Create Button */}
          {!showCreateForm && !editingExercise && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full mb-6 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Agregar ejercicio personalizado
            </button>
          )}

          {/* Create Form */}
          {showCreateForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-gray-900 mb-4">Nuevo Ejercicio</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={newExercise.name}
                    onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Curl Martillo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grupo Muscular</label>
                  <select
                    value={newExercise.muscle_group}
                    onChange={(e) => setNewExercise({ ...newExercise, muscle_group: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {MUSCLE_GROUPS.map(group => (
                      <option key={group} value={group}>
                        {group.charAt(0).toUpperCase() + group.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Foto (opcional)</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                      <Camera className="w-4 h-4" />
                      <span className="text-sm">Seleccionar foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowCreateForm(false)
                      setSelectedImage(null)
                      setImagePreview(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateExercise}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Crear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Form */}
          {editingExercise && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-gray-900 mb-4">Editar Ejercicio</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editingExercise.name}
                    onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grupo Muscular</label>
                  <select
                    value={editingExercise.muscle_group}
                    onChange={(e) => setEditingExercise({ ...editingExercise, muscle_group: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {MUSCLE_GROUPS.map(group => (
                      <option key={group} value={group}>
                        {group.charAt(0).toUpperCase() + group.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Foto</label>
                  <div className="flex items-center gap-4">
                    {editingExercise.image_url && !imagePreview && (
                      <img src={editingExercise.image_url} alt={editingExercise.name} className="w-16 h-16 object-cover rounded-lg" />
                    )}
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                    )}
                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Cambiar foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingExercise(null)
                      setSelectedImage(null)
                      setImagePreview(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdateExercise}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Exercises List */}
          <div className="space-y-3">
            {exercises.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No tienes ejercicios personalizados</p>
            ) : (
              exercises.map(exercise => (
                <div key={exercise.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  {exercise.image_url ? (
                    <img 
                      src={exercise.image_url} 
                      alt={exercise.name} 
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{exercise.name}</h4>
                    <p className="text-sm text-gray-500 capitalize">{exercise.muscle_group}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingExercise(exercise)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteExercise(exercise.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
