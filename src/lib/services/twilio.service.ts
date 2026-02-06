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

export async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  try {
    const client = getTwilioClient();
    // Usar número de WhatsApp Sandbox (diferente al número de SMS)
    const whatsappNumber = '+14155238886';

    await client.messages.create({
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${to}`,
      body,
    });
    console.log(`WhatsApp sent to ${to}: ${body.substring(0, 50)}...`);
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    throw error;
  }
}
