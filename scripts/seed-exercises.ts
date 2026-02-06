import { createClient } from '@supabase/supabase-js';
import { EXERCISES_DATA } from '../src/lib/data/exercises.catalog';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedExercises() {
  console.log(`🌱 Seeding ${EXERCISES_DATA.length} exercises...\n`);

  for (const exercise of EXERCISES_DATA) {
    const { error } = await supabase
      .from('exercises')
      .upsert({
        name: exercise.name,
        muscle_group: exercise.muscle_group,
        equipment_type: exercise.equipment_type,
        aliases: exercise.aliases,
        description: exercise.description,
      }, { onConflict: 'name' });

    if (error) {
      console.error(`❌ ${exercise.name}:`, error.message);
    } else {
      console.log(`✅ ${exercise.name}`);
    }
  }

  console.log('\n🎉 Done!');
}

seedExercises().catch(console.error);