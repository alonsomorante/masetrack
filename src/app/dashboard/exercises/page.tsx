'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Camera, 
  Trash2, 
  Edit2, 
  Save,
  X,
  Search,
  Filter,
  Dumbbell,
  Loader2,
  BookOpen
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { EXERCISES_DATA } from '@/lib/data/exercises.catalog'

interface CustomExercise {
  id: number
  name: string
  muscle_group: string
  image_url: string | null
  created_at: string
}

const MUSCLE_GROUPS = ['todos', 'pecho', 'espalda', 'piernas', 'hombros', 'biceps', 'triceps', 'core', 'cardio', 'otros']

export default function ExercisesPage() {
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<CustomExercise | null>(null)
  const [newExercise, setNewExercise] = useState({ name: '', muscle_group: 'pecho' })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroup, setFilterGroup] = useState('todos')
  const [activeTab, setActiveTab] = useState<'default' | 'custom'>('default')
  const router = useRouter()

  useEffect(() => {
    const phone = localStorage.getItem('userPhone')
    
    if (!phone) {
      router.push('/login')
      return
    }
    
    fetchCustomExercises(phone)
  }, [router])

  const fetchCustomExercises = async (phone: string) => {
    try {
      const response = await fetch(`/api/custom-exercises?phone=${encodeURIComponent(phone)}`)
      const data = await response.json()

      if (response.ok) {
        setCustomExercises(data.exercises || [])
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    } finally {
      setLoading(false)
    }
  }

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
    return URL.createObjectURL(file)
  }

  const handleCreateExercise = async () => {
    if (!newExercise.name.trim()) return

    const phone = localStorage.getItem('userPhone')
    if (!phone) return

    try {
      let imageUrl = null
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage)
      }

      const response = await fetch('/api/custom-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_phone: phone,
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
        fetchCustomExercises(phone)
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
        const phone = localStorage.getItem('userPhone')
        if (phone) fetchCustomExercises(phone)
      }
    } catch (error) {
      console.error('Error updating exercise:', error)
    }
  }

  const handleDeleteExercise = async (id: number) => {
    if (!confirm('¿CONFIRMAR ELIMINACIÓN? SE PERDERÁN LOS REGISTROS ASOCIADOS')) return

    try {
      const response = await fetch(`/api/custom-exercises/update?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const phone = localStorage.getItem('userPhone')
        if (phone) fetchCustomExercises(phone)
      }
    } catch (error) {
      console.error('Error deleting exercise:', error)
    }
  }

  // Filtrar ejercicios por defecto
  const filteredDefaultExercises = EXERCISES_DATA.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.aliases.some(alias => alias.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesGroup = filterGroup === 'todos' || exercise.muscle_group === filterGroup
    return matchesSearch && matchesGroup
  })

  // Filtrar ejercicios personalizados
  const filteredCustomExercises = customExercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGroup = filterGroup === 'todos' || exercise.muscle_group === filterGroup
    return matchesSearch && matchesGroup
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[var(--accent)] mx-auto" />
            <p className="mt-4 font-mono text-sm text-[var(--text-muted)]">CARGANDO CATÁLOGO...</p>
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
            <Dumbbell className="w-5 h-5 text-[var(--accent)]" />
            <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider">CATÁLOGO</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] uppercase tracking-wide">
              MIS EJERCICIOS
            </h1>
            {activeTab === 'custom' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="tech-btn-primary flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>AGREGAR</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-[var(--border-color)]">
          <button
            onClick={() => setActiveTab('default')}
            className={`px-4 py-3 font-mono text-sm uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'default' 
                ? 'border-[var(--accent)] text-[var(--accent)]' 
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Ejercicios del Sistema ({EXERCISES_DATA.length})
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-3 font-mono text-sm uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'custom' 
                ? 'border-[var(--accent)] text-[var(--accent)]' 
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Dumbbell className="w-4 h-4 inline mr-2" />
            Mis Ejercicios ({customExercises.length})
          </button>
        </div>

        {/* Search and Filter */}
        <div className="tech-panel p-4 mb-6">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--border-color)]">
            <Filter className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider">FILTROS</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="[BUSCAR EJERCICIO]"
                className="tech-input w-full pl-10"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="tech-input w-full pl-10 appearance-none"
              >
                {MUSCLE_GROUPS.map(group => (
                  <option key={group} value={group}>
                    {group.charAt(0).toUpperCase() + group.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Create Form - Solo para ejercicios personalizados */}
        {showCreateForm && activeTab === 'custom' && (
          <div className="tech-panel p-6 mb-6 border-l-4 border-l-[var(--accent)]">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-[var(--accent)]" />
                <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider">NUEVO REGISTRO</span>
              </div>
              <button 
                onClick={() => {
                  setShowCreateForm(false)
                  setSelectedImage(null)
                  setImagePreview(null)
                }}
                className="w-8 h-8 bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--error)] transition-colors border border-[var(--border-color)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Nombre // ID-NAME
                  </label>
                  <input
                    type="text"
                    value={newExercise.name}
                    onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                    className="tech-input w-full"
                    placeholder="[EJ: CURL MARTILLO]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Grupo Muscular // ID-GROUP
                  </label>
                  <select
                    value={newExercise.muscle_group}
                    onChange={(e) => setNewExercise({ ...newExercise, muscle_group: e.target.value })}
                    className="tech-input w-full"
                  >
                    {MUSCLE_GROUPS.filter(g => g !== 'todos').map(group => (
                      <option key={group} value={group}>
                        {group.charAt(0).toUpperCase() + group.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Imagen // ID-IMG [OPCIONAL]
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] cursor-pointer hover:border-[var(--accent)] transition-colors">
                    <Camera className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                    <span className="font-mono text-xs text-[var(--text-muted)] uppercase">Seleccionar archivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover border border-[var(--border-color)]" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setSelectedImage(null)
                  setImagePreview(null)
                }}
                className="tech-btn flex-1"
              >
                CANCELAR
              </button>
              <button
                onClick={handleCreateExercise}
                className="tech-btn-primary flex-1"
              >
                CREAR REGISTRO
              </button>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {editingExercise && (
          <div className="tech-panel p-6 mb-6 border-l-4 border-l-[var(--accent)]">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <Edit2 className="w-5 h-5 text-[var(--accent)]" />
                <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider">EDITAR REGISTRO</span>
              </div>
              <button 
                onClick={() => {
                  setEditingExercise(null)
                  setSelectedImage(null)
                  setImagePreview(null)
                }}
                className="w-8 h-8 bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--error)] transition-colors border border-[var(--border-color)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Nombre // ID-NAME
                  </label>
                  <input
                    type="text"
                    value={editingExercise.name}
                    onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })}
                    className="tech-input w-full"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Grupo Muscular // ID-GROUP
                  </label>
                  <select
                    value={editingExercise.muscle_group}
                    onChange={(e) => setEditingExercise({ ...editingExercise, muscle_group: e.target.value })}
                    className="tech-input w-full"
                  >
                    {MUSCLE_GROUPS.filter(g => g !== 'todos').map(group => (
                      <option key={group} value={group}>
                        {group.charAt(0).toUpperCase() + group.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Imagen // ID-IMG
                </label>
                <div className="flex items-center gap-4">
                  {(editingExercise.image_url || imagePreview) && (
                    <img 
                      src={imagePreview || editingExercise.image_url!} 
                      alt={editingExercise.name} 
                      className="w-24 h-24 object-cover border border-[var(--border-color)]" 
                    />
                  )}
                  <label className="flex flex-col items-center justify-center px-4 py-3 border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] cursor-pointer hover:border-[var(--accent)] transition-colors">
                    <Camera className="w-6 h-6 text-[var(--text-muted)] mb-1" />
                    <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase">Cambiar</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setEditingExercise(null)
                  setSelectedImage(null)
                  setImagePreview(null)
                }}
                className="tech-btn flex-1"
              >
                CANCELAR
              </button>
              <button
                onClick={handleUpdateExercise}
                className="tech-btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                GUARDAR CAMBIOS
              </button>
            </div>
          </div>
        )}

        {/* Default Exercises Grid */}
        {activeTab === 'default' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDefaultExercises.map((exercise, index) => (
              <div key={`${exercise.name}-${index}`} className="tech-panel overflow-hidden">
                <div className="aspect-video bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-center">
                  <Dumbbell className="w-12 h-12 text-[var(--border-color)]" />
                </div>
                
                <div className="p-4">
                  <h3 className="font-display text-sm text-[var(--text-primary)] font-bold mb-1">{exercise.name}</h3>
                  <p className="font-mono text-xs text-[var(--text-muted)] uppercase mb-2">{exercise.muscle_group}</p>
                  <p className="font-mono text-xs text-[var(--text-secondary)] mb-3">{exercise.description}</p>
                  
                  <div className="text-xs text-[var(--text-muted)]">
                    <span className="font-mono">Alias: </span>
                    {exercise.aliases.slice(0, 2).join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Exercises Grid */}
        {activeTab === 'custom' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomExercises.map(exercise => (
                <div key={exercise.id} className="tech-panel overflow-hidden hover:border-[var(--accent)] transition-colors">
                  <div className="aspect-video bg-[var(--bg-secondary)] border-b border-[var(--border-color)] relative">
                    {exercise.image_url ? (
                      <img 
                        src={exercise.image_url} 
                        alt={exercise.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-12 h-12 text-[var(--border-color)]" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-display text-sm text-[var(--text-primary)] font-bold mb-1">{exercise.name}</h3>
                    <p className="font-mono text-xs text-[var(--text-muted)] uppercase mb-3">{exercise.muscle_group}</p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingExercise(exercise)}
                        className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] text-[var(--accent)] border border-[var(--border-color)] font-mono text-[10px] uppercase tracking-wider hover:bg-[var(--border-color)] transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteExercise(exercise.id)}
                        className="flex-1 px-3 py-2 bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/30 font-mono text-[10px] uppercase tracking-wider hover:bg-[var(--error)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredCustomExercises.length === 0 && (
              <div className="text-center py-12">
                <Camera className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4 opacity-30" />
                <p className="font-mono text-sm text-[var(--text-muted)] uppercase tracking-wider">No hay ejercicios personalizados</p>
                <p className="font-mono text-xs text-[var(--text-secondary)] mt-2">Crea tu primer ejercicio personalizado</p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
