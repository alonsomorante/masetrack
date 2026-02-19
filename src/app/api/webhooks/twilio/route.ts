import { NextRequest, NextResponse } from 'next/server';
import { ConversationService } from '@/lib/services/conversation.service';
import { sendWhatsAppMessage } from '@/lib/services/twilio.service';

// Helper para crear respuesta TwiML (XML que Twilio espera)
function createTwiMLResponse(message?: string): Response {
  const twiml = message 
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  
  return new Response(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function POST(request: NextRequest) {
  let phoneNumber = '';
  
  try {
    console.log('🚀 Webhook iniciado');
    
    const formData = await request.formData();
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;

    console.log('📨 Datos recibidos:', { from, body });

    if (!from || !body) {
      console.log('❌ Faltan campos');
      return createTwiMLResponse('❌ Error: Datos incompletos');
    }

    phoneNumber = from.replace('whatsapp:', '').trim();
    // Asegurar que el número tenga el formato correcto con +
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+' + phoneNumber;
    }
    console.log(`📱 Procesando: ${phoneNumber} - "${body}"`);

    console.log('🔧 Creando ConversationService...');
    const conversationService = new ConversationService();
    
    console.log('💬 Llamando processMessage...');
    const responseMessage = await conversationService.processMessage(phoneNumber, body);
    console.log(`✅ Respuesta generada: "${responseMessage}"`);

    console.log('📤 Enviando respuesta por WhatsApp...');
    await sendWhatsAppMessage(phoneNumber, responseMessage);
    console.log('✅ Mensaje enviado exitosamente');

    // Twilio espera TwiML (XML), no JSON
    return createTwiMLResponse();
  } catch (error) {
    console.error('❌ Error en webhook:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    
    // Siempre intentar enviar mensaje de error al usuario
    if (phoneNumber) {
      try {
        await sendWhatsAppMessage(phoneNumber, '❌ Ocurrió un error procesando tu mensaje. Por favor intenta de nuevo en unos segundos.');
      } catch (sendError) {
        console.error('❌ Error al enviar mensaje de error:', sendError);
      }
    }
    
    // Twilio espera TwiML incluso en errores
    return createTwiMLResponse('❌ Error interno. Por favor intenta de nuevo.');
  }
}