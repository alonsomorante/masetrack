'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [userName, setUserName] = useState('')
  const router = useRouter()

  useEffect(() => {
    const phone = localStorage.getItem('userPhone')
    const name = localStorage.getItem('userName')
    
    if (!phone) {
      router.push('/login')
      return
    }
    
    setUserName(name || '')
  }, [router])

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      <Sidebar userName={userName} />
      
      {/* Main Content */}
      <main className="flex-1 lg:ml-72 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
