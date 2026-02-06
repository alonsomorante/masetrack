require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listExercises() {
  console.log('📚 CATÁLOGO DE EJERCICIOS\n');
  
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('*')
    .order('muscle_group')
    .order('name');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  // Agrupar por grupo muscular
  const byGroup = exercises.reduce((acc, ex) => {
    if (!acc[ex.muscle_group]) acc[ex.muscle_group] = [];
    acc[ex.muscle_group].push(ex);
    return acc;
  }, {});

  Object.entries(byGroup).forEach(([group, exs]) => {
    console.log(`\n🏋️  ${group.toUpperCase()} (${exs.length} ejercicios):`);
    exs.forEach(ex => {
      console.log(`   • ${ex.name}`);
      if (ex.aliases && ex.aliases.length > 0) {
        console.log(`     Aliases: ${ex.aliases.join(', ')}`);
      }
    });
  });

  console.log(`\n✅ Total: ${exercises.length} ejercicios`);
}

// Si pasan argumento, busca ejercicios específicos
const searchTerm = process.argv[2];

if (searchTerm) {
  console.log(`🔍 Buscando: "${searchTerm}"\n`);
  
  supabase
    .from('exercises')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,muscle_group.ilike.%${searchTerm}%`)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Error:', error.message);
        return;
      }
      
      if (data.length === 0) {
        console.log('No se encontraron ejercicios.');
      } else {
        data.forEach(ex => {
          console.log(`✓ ${ex.name} (${ex.muscle_group})`);
        });
      }
    });
} else {
  listExercises();
}