require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const EXERCISES_DATA = [
  { name: "Caminadora", muscle_group: "cardio", equipment_type: "máquina", aliases: ["treadmill", "cinta", "caminar"], description: "Caminata o trote en cinta" },
  { name: "Bicicleta Estática", muscle_group: "cardio", equipment_type: "máquina", aliases: ["bicicleta", "bike", "spinning"], description: "Bicicleta estática" },
  { name: "Escaladora", muscle_group: "cardio", equipment_type: "máquina", aliases: ["stairmaster", "escaleras"], description: "Máquina de escaleras" },
  { name: "Elíptica", muscle_group: "cardio", equipment_type: "máquina", aliases: ["eliptica", "cross trainer"], description: "Máquina elíptica" },
  { name: "Press de Banca", muscle_group: "pecho", equipment_type: "barra", aliases: ["press plano", "bench press", "pecho plano"], description: "Press con barra en banca plana" },
  { name: "Press Inclinado", muscle_group: "pecho", equipment_type: "barra", aliases: ["press inclinado", "incline bench"], description: "Press en banca inclinada" },
  { name: "Cruzada en Polea", muscle_group: "pecho", equipment_type: "cable", aliases: ["cruzada", "cable crossover", "flies"], description: "Aperturas cruzadas en polea" },
  { name: "Flexiones", muscle_group: "pecho", equipment_type: "peso corporal", aliases: ["push ups", "lagartijas"], description: "Flexiones de pecho en el suelo" },
  { name: "Dominadas", muscle_group: "espalda", equipment_type: "peso corporal", aliases: ["pull ups", "chin ups"], description: "Dominadas en barra" },
  { name: "Remo con Barra", muscle_group: "espalda", equipment_type: "barra", aliases: ["remo barra", "barbell row"], description: "Remo horizontal con barra" },
  { name: "Pull-down", muscle_group: "espalda", equipment_type: "máquina", aliases: ["pulldown", "jalón al pecho"], description: "Jalón al pecho en polea" },
  { name: "Peso Muerto", muscle_group: "espalda", equipment_type: "barra", aliases: ["deadlift", "levantamiento tierra"], description: "Peso muerto con barra" },
  { name: "Sentadilla", muscle_group: "piernas", equipment_type: "barra", aliases: ["squat", "sentadilla libre"], description: "Sentadilla con barra" },
  { name: "Prensa 45°", muscle_group: "piernas", equipment_type: "máquina", aliases: ["prensa", "leg press"], description: "Prensa de piernas en máquina" },
  { name: "Extensiones de Cuádriceps", muscle_group: "piernas", equipment_type: "máquina", aliases: ["extensiones", "leg extension"], description: "Extensiones de piernas sentado" },
  { name: "Curl Femoral", muscle_group: "piernas", equipment_type: "máquina", aliases: ["curl piernas", "leg curl"], description: "Curl de piernas para femoral" },
  { name: "Press Militar", muscle_group: "hombros", equipment_type: "barra", aliases: ["press hombros", "overhead press"], description: "Press de hombros de pie con barra" },
  { name: "Elevaciones Laterales", muscle_group: "hombros", equipment_type: "mancuerna", aliases: ["laterales", "lateral raise"], description: "Elevaciones laterales con mancuernas" },
  { name: "Elevaciones Frontales", muscle_group: "hombros", equipment_type: "mancuerna", aliases: ["frontales", "front raise"], description: "Elevaciones frontales con mancuernas" },
  { name: "Elevaciones Posteriores", muscle_group: "hombros", equipment_type: "mancuerna", aliases: ["posteriores", "rear delt"], description: "Elevaciones posteriores con mancuernas" },
  { name: "Curl con Barra", muscle_group: "biceps", equipment_type: "barra", aliases: ["curl barra", "barbell curl"], description: "Curl de biceps con barra" },
  { name: "Curl con Mancuernas", muscle_group: "biceps", equipment_type: "mancuerna", aliases: ["curl mancuerna", "dumbbell curl"], description: "Curl de biceps con mancuernas" },
  { name: "Curl Martillo", muscle_group: "biceps", equipment_type: "mancuerna", aliases: ["martillo", "hammer curl"], description: "Curl martillo con mancuernas" },
  { name: "Curl Concentrado", muscle_group: "biceps", equipment_type: "mancuerna", aliases: ["concentrado", "concentration curl"], description: "Curl concentrado a una mano" },
  { name: "Fondos en Banco", muscle_group: "triceps", equipment_type: "peso corporal", aliases: ["fondos triceps", "bench dips"], description: "Fondos para triceps en banco" },
  { name: "Extensión de Tríceps", muscle_group: "triceps", equipment_type: "cable", aliases: ["pushdown", "extensión polea"], description: "Extensión de triceps en polea" },
  { name: "Press Francés", muscle_group: "triceps", equipment_type: "barra", aliases: ["french press", "skullcrushers"], description: "Press francés acostado" },
  { name: "Patada de Tríceps", muscle_group: "triceps", equipment_type: "mancuerna", aliases: ["kickback", "patada"], description: "Patada de triceps con mancuerna" },
  { name: "Plancha", muscle_group: "core", equipment_type: "peso corporal", aliases: ["plank", "isométrico"], description: "Plancha abdominal isométrica" },
  { name: "Crunch", muscle_group: "core", equipment_type: "peso corporal", aliases: ["abdominales", "crunches"], description: "Crunch abdominal básico" },
  { name: "Elevación de Piernas", muscle_group: "core", equipment_type: "peso corporal", aliases: ["leg raise", "elevación piernas"], description: "Elevación de piernas colgado" },
  { name: "Russian Twist", muscle_group: "core", equipment_type: "mancuerna", aliases: ["twist", "giro ruso"], description: "Russian twist para oblicuos" }
];

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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

  console.log('\n🎉 Done! 32 exercises loaded into Supabase.');
}

seedExercises().catch(console.error);