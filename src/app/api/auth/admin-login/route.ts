import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabaseClient } from '@/lib/supabase/client'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'alonso'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña requeridos' },
        { status: 400 }
      )
    }

    // Verificar credenciales hardcodeadas (en producción usar DB)
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    // Crear token de sesión simple
    const sessionToken = Buffer.from(`${username}:${Date.now()}`).toString('base64')

    return NextResponse.json({
      success: true,
      token: sessionToken,
      user: {
        username: ADMIN_USERNAME,
        role: 'admin'
      }
    })
  } catch (error) {
    console.error('Error en login admin:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}