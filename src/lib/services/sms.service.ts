import Twilio from 'twilio';

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio environment variables are missing.');
  }

  return Twilio(accountSid, authToken);
}

function getTwilioPhoneNumber() {
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!phoneNumber) {
    throw new Error('TWILIO_PHONE_NUMBER is missing.');
  }
  return phoneNumber;
}

export async function sendSMS(to: string, body: string): Promise<void> {
  try {
    const client = getTwilioClient();
    const phoneNumber = getTwilioPhoneNumber();

    // Asegurar que el número tenga formato internacional
    let formattedNumber = to;
    if (!to.startsWith('+')) {
      formattedNumber = '+' + to.replace(/\D/g, '');
    }

    await client.messages.create({
      from: phoneNumber,
      to: formattedNumber,
      body,
    });
    
    console.log(`SMS enviado a ${formattedNumber}: ${body.substring(0, 50)}...`);
  } catch (error) {
    console.error('Error enviando SMS:', error);
    throw error;
  }
}

export async function sendVerificationCode(phone: string, code: string, name?: string): Promise<void> {
  const greeting = name ? `Hola ${name},` : 'Hola,';
  const message = `${greeting}\n\nTu código de verificación para Masetrack es: ${code}\n\nEste código expira en 10 minutos.\n\nNo compartas este código con nadie.`;
  
  await sendSMS(phone, message);
}

export async function sendWelcomeMessage(phone: string, name: string): Promise<void> {
  const message = `¡Bienvenido a Masetrack, ${name}! 🎉\n\nTu cuenta está activa.\n\n📱 Para registrar entrenamientos:\n• Escríbenos por WhatsApp a este mismo número\n• Ejemplo: "Press de banca 80kg 10 reps 3 series"\n\n💻 Para ver tu progreso:\n• Entra a la web con tu número\n• Revisa tu historial y estadísticas\n\n¿Preguntas? Responde aquí o escribe "ayuda"\n\n¡A entrenar! 💪`;
  
  await sendSMS(phone, message);
}
