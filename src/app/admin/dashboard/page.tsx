'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Dumbbell, TrendingUp, LogOut } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin-login')
      return
    }
    fetchAdminData()
  }, [router])

  const fetchAdminData = async () => {
    try {
      // Datos de ejemplo - en producción vendrían de una API
      setStats({
        totalUsers: 5,
        totalWorkouts: 25,
        totalVolume: 12500
      })
      setUsers([
        { phone: '+51997184232', name: 'Usuario 1', workouts: 5 },
        { phone: '+51999999999', name: 'Usuario 2', workouts: 3 },
      ])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    router.push('/admin-login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Panel de Administración</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 hover:text-gray-300">
            <LogOut className="w-5 h-5" />
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6">
            <Users className="w-8 h-8 text-blue-400 mb-2" />
            <p className="text-gray-400">Usuarios</p>
            <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <Dumbbell className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-gray-400">Entrenamientos</p>
            <p className="text-3xl font-bold">{stats?.totalWorkouts || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <TrendingUp className="w-8 h-8 text-orange-400 mb-2" />
            <p className="text-gray-400">Volumen Total</p>
            <p className="text-3xl font-bold">{stats?.totalVolume?.toLocaleString() || 0} kg</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Usuarios Registrados</h2>
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400">
                <th className="pb-4">Teléfono</th>
                <th className="pb-4">Nombre</th>
                <th className="pb-4">Entrenamientos</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={i} className="border-t border-gray-700">
                  <td className="py-4">{user.phone}</td>
                  <td className="py-4">{user.name}</td>
                  <td className="py-4">{user.workouts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}