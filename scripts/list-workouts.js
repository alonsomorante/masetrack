require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listAllWorkouts() {
  console.log('📊 TODOS LOS ENTRENAMIENTOS REGISTRADOS\n');
  
  const { data: workouts, error } = await supabase
    .from('workout_entries')
    .select('*, exercises(name, muscle_group)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!workouts || workouts.length === 0) {
    console.log('❌ No hay entrenamientos registrados aún.');
    return;
  }

  console.log('Total de entrenamientos: ' + workouts.length + '\n');
  
  workouts.forEach((w, i) => {
    const exerciseName = w.exercises?.name || 'Ejercicio #' + w.exercise_id;
    const muscleGroup = w.exercises?.muscle_group || 'N/A';
    
    console.log('#' + (i + 1) + '. ' + exerciseName + ' (' + muscleGroup + ')');
    console.log('   💪 Peso: ' + w.weight_kg + 'kg');
    console.log('   🔄 Reps: ' + w.reps + ' | Series: ' + w.sets);
    if (w.rir !== null) console.log('   📊 RIR: ' + w.rir);
    if (w.notes) console.log('   📝 Notas: ' + w.notes);
    console.log('   👤 Usuario: ' + w.user_phone);
    console.log('   📅 Fecha: ' + new Date(w.created_at).toLocaleString('es-ES'));
    console.log('');
  });
}

listAllWorkouts();