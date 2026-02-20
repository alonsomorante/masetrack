import { getSupabaseClient } from '@/lib/supabase/client';

interface VerificationCode {
  phone_number: string;
  code: string;
  expires_at: string;
  created_at: string | null;
}

export async function storeCode(phone: string, code: string) {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('verification_codes')
    .upsert({
      phone_number: phone,
      code: code,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutos
    }, {
      onConflict: 'phone_number'
    });

  if (error) {
    console.error('Error storing code:', error);
    throw error;
  }
}

export async function verifyCode(phone: string, code: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  console.log(`🔍 Buscando código para ${phone}, código a verificar: "${code}"`);
  
  // Buscar código
  const { data, error } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('phone_number', phone)
    .single();

  if (error || !data) {
    console.log(`❌ No se encontró código para ${phone}:`, error);
    return false;
  }

  const record = data as VerificationCode;
  console.log(`📋 Código en DB: "${record.code}", expires_at: ${record.expires_at}`);
  console.log(`⏰ Hora actual: ${new Date().toISOString()}`);

  // Verificar si expiró
  if (new Date(record.expires_at) < new Date()) {
    console.log(`❌ Código expirado para ${phone}`);
    // Eliminar código expirado
    await supabase
      .from('verification_codes')
      .delete()
      .eq('phone_number', phone);
    return false;
  }

  // Verificar si coincide
  const isValid = record.code === code;
  console.log(`🔑 Comparación: DB="${record.code}" vs input="${code}" → ${isValid}`);
  
  if (isValid) {
    // Eliminar código usado
    await supabase
      .from('verification_codes')
      .delete()
      .eq('phone_number', phone);
  }
  
  return isValid;
}