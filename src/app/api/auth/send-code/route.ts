import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationCode } from '@/lib/services/sms.service'
import { getUserByPhone } from '@/lib/supabase/client'
import { storeCode } from '@/lib/auth/codes'
import { formatPhoneNumber } from '@/lib/data/countries'

export async function POST(request: NextRequest) {
  try {
    const { phone, countryCode } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Número de teléfono requerido' },
        { status: 400 }
      )
    }

    // Formatear número si se proporciona countryCode
    let formattedPhone = phone
    if (countryCode) {
      formattedPhone = formatPhoneNumber(phone, countryCode)
    } else if (!phone.startsWith('+')) {
      // Si no hay countryCode y no empieza con +, asumimos que ya viene formateado
      formattedPhone = '+' + phone.replace(/\D/g, '')
    }

    // Verificar si el usuario existe
    const user = await getUserByPhone(formattedPhone)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado. Primero debes registrarte.' },
        { status: 404 }
      )
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Guardar código
    await storeCode(formattedPhone, code)

    // Enviar código por SMS
    try {
      await sendVerificationCode(formattedPhone, code, user.name)
      
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
    console.error('Error sending code:', error)
    return NextResponse.json(
      { error: 'Error al enviar código' },
      { status: 500 }
    )
  }
}
