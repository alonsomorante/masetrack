import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/client'
import { storeCode } from '@/lib/auth/codes'
import { sendVerificationCode } from '@/lib/services/sms.service'
import { formatPhoneNumber, validatePhoneNumber } from '@/lib/data/countries'

export async function POST(request: NextRequest) {
  try {
    const { name, phone, countryCode } = await request.json()

    if (!name || !phone || !countryCode) {
      return NextResponse.json(
        { error: 'Nombre, teléfono y país requeridos' },
        { status: 400 }
      )
    }

    // Formatear y validar número de teléfono
    const formattedPhone = formatPhoneNumber(phone, countryCode)
    
    if (!validatePhoneNumber(formattedPhone, countryCode)) {
      return NextResponse.json(
        { error: 'Número de teléfono inválido para el país seleccionado' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Verificar si el usuario ya existe
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('phone_number, name')
      .eq('phone_number', formattedPhone)

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
        phone_number: formattedPhone,
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
    await storeCode(formattedPhone, code)

    // Enviar código por SMS
    try {
      await sendVerificationCode(formattedPhone, code, name)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Código enviado por SMS',
        phone: formattedPhone
      })
    } catch (smsError) {
      console.error('Error enviando SMS:', smsError)
      return NextResponse.json(
        { error: 'Error al enviar SMS. Verifica que el número sea correcto.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
