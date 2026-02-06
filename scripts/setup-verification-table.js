require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createVerificationCodesTable() {
  console.log('🔧 Creando tabla de códigos de verificación...\n');

  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS verification_codes (
        phone_number TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });

  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Intentando método alternativo...\n');
    
    // Intentar crear directamente
    const { error: directError } = await supabase
      .from('verification_codes')
      .select('phone_number')
      .limit(1);
    
    if (directError && directError.code === '42P01') {
      console.log('La tabla no existe. Por favor créala manualmente en Supabase:');
      console.log('\n📋 SQL para ejecutar:');
      console.log(`
CREATE TABLE IF NOT EXISTS verification_codes (
  phone_number TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Política para limpiar códigos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
      `);
    } else {
      console.log('✅ La tabla ya existe!');
    }
  } else {
    console.log('✅ Tabla verification_codes creada correctamente');
  }
}

createVerificationCodesTable().catch(console.error);