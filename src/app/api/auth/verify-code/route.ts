import { NextRequest, NextResponse } from 'next/server'
import { verifyCode } from '@/lib/auth/codes'
import { getUserByPhone } from '@/lib/supabase/client'
import { sendWhatsAppMessage } from '@/lib/services/twilio.service'

// Números de admin (puedes configurar los tuyos)
const ADMIN_NUMBERS = ['+51997184232'] // Agrega tu número aquí

export async function POST(request: NextRequest) {
  try {
    const { phone, code, isRegister } = await request.json()

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

    // Intentar enviar mensaje de bienvenida por WhatsApp (SOLO para usuarios nuevos)
    let whatsappJoined = true
    if (isRegister) {
      try {
        const welcomeMessage = `¡Bienvenido a Masetrack, ${user.name}! 🎉

Tu cuenta está activa.

📱 Para registrar entrenamientos:
• Escríbenos por WhatsApp a este número
• Ejemplo: "Press de banca 80kg 10 reps 3 series"
• Guardaré todo automáticamente

💻 Para ver tu progreso:
• Accede a: https://workout-wsp-tracker.vercel.app
• Revisa tu historial y estadísticas

¿Preguntas? Responde aquí o escribe "ayuda"

¡A entrenar! 💪`

        await sendWhatsAppMessage(phone, welcomeMessage)
      } catch (error: any) {
        // Si es error de Sandbox (número no válido para WhatsApp), ignorar silenciosamente
        if (error.message?.includes('not a valid WhatsApp') || 
            error.code === 21614 ||
            error.status === 400) {
          whatsappJoined = false
          console.log(`Usuario ${phone} no está en WhatsApp Sandbox, continuando sin enviar mensaje`)
        } else {
          // Otros errores sí los loggeamos pero no bloqueamos al usuario
          console.error('Error enviando WhatsApp de bienvenida:', error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        phone: user.phone_number,
        name: user.name,
      },
      isAdmin,
      whatsappJoined,
    })
  } catch (error) {
    console.error('Error verifying code:', error)
    return NextResponse.json(
      { error: 'Error al verificar código' },
      { status: 500 }
    )
  }
}
