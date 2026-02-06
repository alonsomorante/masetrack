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
  
  // Buscar código
  const { data, error } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('phone_number', phone)
    .single();

  if (error || !data) {
    return false;
  }

  const record = data as VerificationCode;

  // Verificar si expiró
  if (new Date(record.expires_at) < new Date()) {
    // Eliminar código expirado
    await supabase
      .from('verification_codes')
      .delete()
      .eq('phone_number', phone);
    return false;
  }

  // Verificar si coincide
  const isValid = record.code === code;
  
  if (isValid) {
    // Eliminar código usado
    await supabase
      .from('verification_codes')
      .delete()
      .eq('phone_number', phone);
  }
  
  return isValid;
}