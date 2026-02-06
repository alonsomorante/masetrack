import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppMessage } from '@/lib/services/twilio.service'
import { getUserByPhone } from '@/lib/supabase/client'
import { storeCode } from '@/lib/auth/codes'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Número de teléfono requerido' },
        { status: 400 }
      )
    }

    // Verificar si el usuario existe
    const user = await getUserByPhone(phone)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado. Primero debes registrar entrenamientos por WhatsApp.' },
        { status: 404 }
      )
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Guardar código
    storeCode(phone, code)

    // Enviar código por WhatsApp
    const message = `Tu código de verificación para Masetrack es: ${code}\n\nEste código expira en 10 minutos.`
    await sendWhatsAppMessage(phone, message)

    return NextResponse.json({ success: true, message: 'Código enviado' })
  } catch (error) {
    console.error('Error sending code:', error)
    return NextResponse.json(
      { error: 'Error al enviar código' },
      { status: 500 }
    )
  }
}