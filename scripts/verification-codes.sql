-- Crear tabla para códigos de verificación
CREATE TABLE IF NOT EXISTS verification_codes (
  phone_number TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires 
ON verification_codes(expires_at);

-- Política RLS (opcional, pero recomendado)
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Permitir acceso al service role
CREATE POLICY "Service role access" ON verification_codes
  FOR ALL USING (true) WITH CHECK (true);

-- Función para limpiar códigos expirados (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;