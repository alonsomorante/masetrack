import { ExerciseData } from '@/types';

export type ExerciseType = 
  | 'strength_weighted'      // Con peso (barra, mancuerna)
  | 'strength_bodyweight'    // Peso corporal con reps (dominadas, fondos dinámicos)
  | 'isometric_time'         // Tiempo estático (plancha, wall sit)
  | 'cardio_time'           // Cardio por tiempo (caminadora 30min)
  | 'cardio_distance'       // Cardio por distancia (correr 5km)
  | 'cardio_both';          // Cardio con tiempo + distancia

export interface ExerciseDataExtended extends ExerciseData {
  exercise_type: ExerciseType;
  default_type: ExerciseType;
  allowed_types: ExerciseType[];
}

export const EXERCISES_DATA: ExerciseDataExtended[] = [
  // Cardio (2) - Por tiempo por defecto
  { 
    name: "Caminadora", 
    muscle_group: "cardio", 
    equipment_type: "máquina", 
    aliases: ["treadmill", "cinta", "caminar"], 
    description: "Caminata o trote en cinta",
    exercise_type: "cardio_time",
    default_type: "cardio_time",
    allowed_types: ["cardio_time", "cardio_distance", "cardio_both"]
  },
  { 
    name: "Bicicleta Estática", 
    muscle_group: "cardio", 
    equipment_type: "máquina", 
    aliases: ["bicicleta", "bike", "spinning"], 
    description: "Bicicleta estática",
    exercise_type: "cardio_time",
    default_type: "cardio_time",
    allowed_types: ["cardio_time", "cardio_distance", "cardio_both"]
  },
  
  // Pecho (2) - Fuerza con peso
  { 
    name: "Press de Banca", 
    muscle_group: "pecho", 
    equipment_type: "barra", 
    aliases: ["press plano", "bench press", "pecho plano"], 
    description: "Press con barra en banca plana",
    exercise_type: "strength_weighted",
    default_type: "strength_weighted",
    allowed_types: ["strength_weighted"]
  },
  { 
    name: "Press Inclinado", 
    muscle_group: "pecho", 
    equipment_type: "barra", 
    aliases: ["press inclinado", "incline bench"], 
    description: "Press en banca inclinada",
    exercise_type: "strength_weighted",
    default_type: "strength_weighted",
    allowed_types: ["strength_weighted"]
  },
  
  // Espalda (2) - Fondos pueden ser peso corporal o isométricos
  { 
    name: "Dominadas", 
    muscle_group: "espalda", 
    equipment_type: "peso corporal", 
    aliases: ["pull ups", "chin ups"], 
    description: "Dominadas en barra",
    exercise_type: "strength_bodyweight",
    default_type: "strength_bodyweight",
    allowed_types: ["strength_bodyweight"]
  },
  { 
    name: "Remo con Barra", 
    muscle_group: "espalda", 
    equipment_type: "barra", 
    aliases: ["remo barra", "barbell row"], 
    description: "Remo horizontal con barra",
    exercise_type: "strength_weighted",
    default_type: "strength_weighted",
    allowed_types: ["strength_weighted"]
  },
  
  // Piernas (2)
  { 
    name: "Sentadilla", 
    muscle_group: "piernas", 
    equipment_type: "barra", 
    aliases: ["squat", "sentadilla libre"], 
    description: "Sentadilla con barra",
    exercise_type: "strength_weighted",
    default_type: "strength_weighted",
    allowed_types: ["strength_weighted"]
  },
  { 
    name: "Prensa 45°", 
    muscle_group: "piernas", 
    equipment_type: "máquina", 
    aliases: ["prensa", "leg press"], 
    description: "Prensa de piernas en máquina",
    exercise_type: "strength_weighted",
    default_type: "strength_weighted",
    allowed_types: ["strength_weighted"]
  },
  
  // Hombros (2)
  { 
    name: "Press Militar", 
    muscle_group: "hombros", 
    equipment_type: "barra", 
    aliases: ["press hombros", "overhead press"], 
    description: "Press de hombros de pie con barra",
    exercise_type: "strength_weighted",
    default_type: "strength_weighted",
    allowed_types: ["strength_weighted"]
  },
  { 
    name: "Elevaciones Laterales", 
    muscle_group: "hombros", 
    equipment_type: "mancuerna", 
    aliases: ["laterales", "lateral raise"], 
    description: "Elevaciones laterales con mancuernas",
    exercise_type: "strength_weighted",
    default_type: "strength_weighted",
    allowed_types: ["strength_weighted"]
  },
  
  // Bíceps (2)
  { 
    name: "Curl con Barra", 
    muscle_group: "biceps", 
    equipment_type: "barra", 
    aliases: ["curl barra", "barbell curl"], 
    description: "Curl de biceps con barra",
    exercise_type: "strength_weighted",
    default_type: "strength_weighted",
    allowed_types: ["strength_weighted"]
  },
  { 
    name: "Curl Martillo", 
    muscle_group: "biceps", 
    equipment_type: "mancuerna", 
    aliases: ["martillo", "hammer curl"], 
    description: "Curl martillo con mancuernas",
    exercise_type: "strength_weighted",
    default_type: "strength_weighted",
    allowed_types: ["strength_weighted"]
  },
  
  // Tríceps (2) - Fondos pueden ser dinámicos o isométricos
  { 
    name: "Fondos en Banco", 
    muscle_group: "triceps", 
    equipment_type: "peso corporal", 
    aliases: ["fondos triceps", "bench dips"], 
    description: "Fondos para triceps en banco",
    exercise_type: "strength_bodyweight",
    default_type: "strength_bodyweight",
    allowed_types: ["strength_bodyweight", "isometric_time"]
  },
  { 
    name: "Extensión de Tríceps", 
    muscle_group: "triceps", 
    equipment_type: "cable", 
    aliases: ["pushdown", "extensión polea"], 
    description: "Extensión de triceps en polea",
    exercise_type: "strength_weighted",
    default_type: "strength_weighted",
    allowed_types: ["strength_weighted"]
  },
  
  // Core (2) - Plancha puede ser isométrica o dinámica
  { 
    name: "Plancha", 
    muscle_group: "core", 
    equipment_type: "peso corporal", 
    aliases: ["plank", "isométrico"], 
    description: "Plancha abdominal",
    exercise_type: "isometric_time",
    default_type: "isometric_time",
    allowed_types: ["isometric_time", "strength_bodyweight"]
  },
  { 
    name: "Crunch", 
    muscle_group: "core", 
    equipment_type: "peso corporal", 
    aliases: ["abdominales", "crunches"], 
    description: "Crunch abdominal básico",
    exercise_type: "strength_bodyweight",
    default_type: "strength_bodyweight",
    allowed_types: ["strength_bodyweight"]
  }
];

export function findExerciseByName(name: string): ExerciseDataExtended | undefined {
  const searchName = name.toLowerCase().trim();
  
  return EXERCISES_DATA.find(exercise => {
    const nameMatch = exercise.name.toLowerCase() === searchName;
    const aliasMatch = exercise.aliases.some(alias => alias.toLowerCase() === searchName);
    return nameMatch || aliasMatch;
  });
}

export function searchExercises(term: string): ExerciseDataExtended[] {
  const searchTerm = term.toLowerCase().trim();
  
  return EXERCISES_DATA.filter(exercise => {
    const nameMatch = exercise.name.toLowerCase().includes(searchTerm);
    const aliasMatch = exercise.aliases.some(alias => alias.toLowerCase().includes(searchTerm));
    return nameMatch || aliasMatch;
  });
}

export function getExercisesCatalogText(): string {
  return EXERCISES_DATA.map(ex => 
    `- ${ex.name} (${ex.muscle_group}) [${ex.exercise_type}] - aliases: ${ex.aliases.join(', ')}`
  ).join('\n');
}

export function getExercisesByMuscleGroup(): Record<string, ExerciseDataExtended[]> {
  const grouped: Record<string, ExerciseDataExtended[]> = {};
  
  EXERCISES_DATA.forEach(exercise => {
    if (!grouped[exercise.muscle_group]) {
      grouped[exercise.muscle_group] = [];
    }
    grouped[exercise.muscle_group].push(exercise);
  });
  
  return grouped;
}

export function getExercisesListText(): string {
  const grouped = getExercisesByMuscleGroup();
  let text = "📋 *Ejercicios disponibles:*\n\n";
  
  Object.entries(grouped).forEach(([group, exercises]) => {
    text += `*${group.toUpperCase()}:*\n`;
    exercises.forEach(ex => {
      const typeIcon = ex.exercise_type.includes('cardio') ? '🏃' : 
                      ex.exercise_type === 'isometric_time' ? '⏱️' : 
                      ex.exercise_type === 'strength_bodyweight' ? '💪' : '🏋️';
      text += `  ${typeIcon} ${ex.name}\n`;
    });
    text += "\n";
  });
  
  text += "💡 Escribe el nombre del ejercicio seguido de los detalles.\n";
  text += "Ejemplos:\n";
  text += "• \"Plancha 60 segundos\" (tiempo)\n";
  text += "• \"Plancha 15 reps\" (repeticiones)\n";
  text += "• \"Press de banca 80kg 10 reps 3 series\"";
  
  return text;
}

// Check if exercise type is ambiguous (has multiple allowed types)
export function isExerciseTypeAmbiguous(exercise: ExerciseDataExtended): boolean {
  return exercise.allowed_types.length > 1;
}

// Get exercise type based on user context (time vs reps mentioned)
export function detectExerciseTypeFromContext(
  exercise: ExerciseDataExtended, 
  message: string
): ExerciseType | null {
  const msg = message.toLowerCase();
  
  // Check for time indicators
  const hasTime = /\d+\s*(segundo|segundos|minuto|minutos|hora|horas|s|m|h)\b/.test(msg);
  // Check for rep indicators  
  const hasReps = /\d+\s*(rep|reps|repeticion|repeticiones)\b/.test(msg);
  // Check for distance indicators
  const hasDistance = /\d+\s*(km|kilometro|kilometros|metro|metros|m|millas)\b/.test(msg);
  
  // If both time and reps mentioned, use exercise default
  if (hasTime && hasReps) {
    return exercise.default_type;
  }
  
  // If only time mentioned
  if (hasTime) {
    const timeType = exercise.allowed_types.find(t => t.includes('time') || t === 'isometric_time');
    if (timeType) return timeType;
  }
  
  // If only reps mentioned
  if (hasReps) {
    const repType = exercise.allowed_types.find(t => 
      t === 'strength_weighted' || t === 'strength_bodyweight'
    );
    if (repType) return repType;
  }
  
  // If only distance mentioned
  if (hasDistance) {
    const distType = exercise.allowed_types.find(t => t.includes('distance'));
    if (distType) return distType;
  }
  
  // Return null if ambiguous (need to ask user)
  return null;
}
