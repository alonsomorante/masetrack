-- Script para limpiar completamente la base de datos
-- ⚠️ ADVERTENCIA: Esto borrará TODOS los datos

-- Borrar entradas de entrenamiento
DELETE FROM workout_entries;

-- Borrar ejercicios personalizados
DELETE FROM custom_exercises;

-- Borrar códigos de verificación
DELETE FROM verification_codes;

-- Borrar usuarios
DELETE FROM users;

-- Verificar que todo está vacío
SELECT 'workout_entries' as tabla, COUNT(*) as registros FROM workout_entries
UNION ALL
SELECT 'custom_exercises', COUNT(*) FROM custom_exercises
UNION ALL
SELECT 'verification_codes', COUNT(*) FROM verification_codes
UNION ALL
SELECT 'users', COUNT(*) FROM users;
