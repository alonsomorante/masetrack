-- ============================================
-- ACTUALIZACIÓN BASE DE DATOS - SISTEMA COMPLETO
-- ============================================

-- 1. Tabla para usuarios administradores
CREATE TABLE IF NOT EXISTS admin_users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar admin (password: alonso)
-- Nota: En producción usar bcrypt, aquí es solo para demo
INSERT INTO admin_users (username, password_hash) 
VALUES ('admin', '$2b$10$YourHashedPasswordHere')
ON CONFLICT (username) DO NOTHING;

-- 2. Modificar tabla users para registro web
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS registration_source TEXT DEFAULT 'web',
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Tabla para ejercicios personalizados de usuarios
CREATE TABLE IF NOT EXISTS custom_exercises (
  id SERIAL PRIMARY KEY,
  user_phone TEXT REFERENCES users(phone_number) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment_type TEXT,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla para códigos de verificación
CREATE TABLE IF NOT EXISTS verification_codes (
  phone_number TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_expires 
ON verification_codes(expires_at);

-- 5. Tabla para imágenes de ejercicios oficiales
CREATE TABLE IF NOT EXISTS exercise_images (
  id SERIAL PRIMARY KEY,
  exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Modificar workout_entries para soportar ejercicios personalizados
ALTER TABLE workout_entries 
ADD COLUMN IF NOT EXISTS custom_exercise_id INTEGER REFERENCES custom_exercises(id),
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web'; -- 'web' o 'whatsapp'

-- 7. Tabla para sesiones de usuario (opcional, para manejo de sesiones web)
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_phone TEXT REFERENCES users(phone_number) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- 8. Políticas RLS para nuevas tablas
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para service_role (acceso total desde backend)
CREATE POLICY "Service role access admin" ON admin_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role access custom" ON custom_exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role access verification" ON verification_codes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role access images" ON exercise_images FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role access sessions" ON user_sessions FOR ALL USING (true) WITH CHECK (true);

-- 9. Función para limpiar códigos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger para actualizar last_message_at en users
CREATE OR REPLACE FUNCTION update_user_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET last_message_at = NOW() WHERE phone_number = NEW.user_phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workout_entry_created
AFTER INSERT ON workout_entries
FOR EACH ROW
EXECUTE FUNCTION update_user_last_activity();

-- ============================================
-- FIN DE ACTUALIZACIÓN
-- ============================================