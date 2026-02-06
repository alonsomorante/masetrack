import { NextRequest, NextResponse } from 'next/server'
import { verifyCode } from '@/lib/auth/codes'
import { getUserByPhone } from '@/lib/supabase/client'

// Números de admin (puedes configurar los tuyos)
const ADMIN_NUMBERS = ['+51997184232'] // Agrega tu número aquí

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Teléfono y código requeridos' },
        { status: 400 }
      )
    }

    // Verificar código
    const isValid = await verifyCode(phone, code)
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Código incorrecto o expirado' },
        { status: 401 }
      )
    }

    // Obtener usuario
    const user = await getUserByPhone(phone)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si es admin
    const isAdmin = ADMIN_NUMBERS.includes(phone)

    return NextResponse.json({
      success: true,
      user: {
        phone: user.phone_number,
        name: user.name,
      },
      isAdmin,
    })
  } catch (error) {
    console.error('Error verifying code:', error)
    return NextResponse.json(
      { error: 'Error al verificar código' },
      { status: 500 }
    )
  }
}