const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDatabase() {
  console.log('🗑️  Limpiando base de datos...\n');

  try {
    // 1. Borrar workout_entries
    console.log('1. Borrando entradas de entrenamiento...');
    const { error: workoutsError } = await supabase
      .from('workout_entries')
      .delete()
      .neq('id', 0); // Borrar todos
    
    if (workoutsError) throw workoutsError;
    console.log('   ✅ Entradas de entrenamiento borradas\n');

    // 2. Borrar custom_exercises
    console.log('2. Borrando ejercicios personalizados...');
    const { error: customError } = await supabase
      .from('custom_exercises')
      .delete()
      .neq('id', 0);
    
    if (customError) throw customError;
    console.log('   ✅ Ejercicios personalizados borrados\n');

    // 3. Borrar verification_codes
    console.log('3. Borrando códigos de verificación...');
    const { error: codesError } = await supabase
      .from('verification_codes')
      .delete()
      .neq('phone_number', '');
    
    if (codesError) throw codesError;
    console.log('   ✅ Códigos de verificación borrados\n');

    // 4. Borrar users
    console.log('4. Borrando usuarios...');
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .neq('phone_number', '');
    
    if (usersError) throw usersError;
    console.log('   ✅ Usuarios borrados\n');

    // Verificar
    console.log('5. Verificando...');
    const tables = ['workout_entries', 'custom_exercises', 'verification_codes', 'users'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      console.log(`   ${table}: ${count} registros`);
    }

    console.log('\n✅ Base de datos limpiada exitosamente!');
    console.log('🚀 Todo listo para comenzar de nuevo');

  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error);
    process.exit(1);
  }
}

clearDatabase();
