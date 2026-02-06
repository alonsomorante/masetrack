import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/client'
import { storeCode } from '@/lib/auth/codes'
import { sendWhatsAppMessage } from '@/lib/services/twilio.service'

export async function POST(request: NextRequest) {
  try {
    const { name, phone } = await request.json()

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Nombre y teléfono requeridos' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Verificar si el usuario ya existe
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('phone_number, name')
      .eq('phone_number', phone)

    if (checkError) {
      console.error('Error checking existing user:', checkError)
      return NextResponse.json(
        { error: 'Error al verificar usuario existente' },
        { status: 500 }
      )
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { 
          error: 'Ya tienes una cuenta registrada. Por favor inicia sesión con tu número.' 
        },
        { status: 409 }
      )
    }

    // Crear usuario en estado "pending_verification"
    const { error: createError } = await supabase
      .from('users')
      .insert({
        phone_number: phone,
        name: name,
        conversation_state: 'pending_verification',
        conversation_context: {},
        last_message_at: new Date().toISOString(),
      })

    if (createError) {
      console.error('Error creating user:', createError)
      return NextResponse.json(
        { error: 'Error al crear usuario' },
        { status: 500 }
      )
    }

    // Generar código de verificación
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Guardar código
    await storeCode(phone, code)

    // Enviar código por WhatsApp
    const message = `¡Bienvenido a Masetrack! 👋\n\nTu código de verificación es: ${code}\n\nIngresa este código en la web para activar tu cuenta.\n\nEste código expira en 10 minutos.`
    await sendWhatsAppMessage(phone, message)

    return NextResponse.json({ 
      success: true, 
      message: 'Código enviado a tu WhatsApp' 
    })

  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}