import { NextRequest, NextResponse } from 'next/server';
import { ConversationService } from '@/lib/services/conversation.service';
import { sendWhatsAppMessage } from '@/lib/services/twilio.service';

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
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
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

    return NextResponse.json({ success: true });
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
    
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}