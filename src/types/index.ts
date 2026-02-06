export type ConversationState =
  | 'new_user'
  | 'registration_complete'
  | 'parsing_workout'
  | 'waiting_for_weight'
  | 'waiting_for_rir'
  | 'waiting_for_comment'
  | 'confirm_save'
  | 'session_closed'
  | 'creating_custom_exercise_name'
  | 'creating_custom_exercise_muscle'
  | 'resolving_exercise_type';  // Nuevo estado para ejercicios ambiguos

export type ExerciseType = 
  | 'strength_weighted'      // Con peso (barra, mancuerna)
  | 'strength_bodyweight'    // Peso corporal con reps (dominadas, fondos dinámicos)
  | 'isometric_time'         // Tiempo estático (plancha, wall sit)
  | 'cardio_time'           // Cardio por tiempo (caminadora 30min)
  | 'cardio_distance'       // Cardio por distancia (correr 5km)
  | 'cardio_both';          // Cardio con tiempo + distancia

export interface User {
  phone_number: string;
  name: string;
  conversation_state: ConversationState;
  conversation_context: Record<string, any>;
  last_message_at: string;
  created_at: string;
}

export interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  equipment_type: string | null;
  aliases: string[];
  description: string | null;
  exercise_type?: ExerciseType;
  default_type?: ExerciseType;
  created_at: string;
}

export interface CustomExercise {
  id: number;
  user_phone: string;
  name: string;
  muscle_group: string;
  image_url: string | null;
  exercise_type?: ExerciseType;
  is_active: boolean;
  created_at: string;
}

export interface WorkoutEntry {
  id: number;
  user_phone: string;
  exercise_id: number | null;
  custom_exercise_id: number | null;
  weight_kg: number | null;  // Ahora opcional
  reps: number | null;       // Ahora opcional
  sets: number | null;       // Ahora opcional
  rir: number | null;
  notes: string | null;
  // Nuevos campos para diferentes tipos de ejercicio
  exercise_type?: ExerciseType;
  duration_seconds?: number | null;
  distance_km?: number | null;
  calories?: number | null;
  avg_heart_rate?: number | null;
  created_at: string;
}

export interface ParsedWorkout {
  exercise_name: string | null;
  exercise_type?: ExerciseType | null;  // Tipo detectado
  weight_kg: number | number[] | null;
  reps: number | number[] | null;
  sets: number | null;
  rir: number | number[] | null;
  notes: string | null;
  is_custom?: boolean;
  custom_exercise_id?: number;
  // Nuevos campos
  duration_seconds?: number | null;
  distance_km?: number | null;
  calories?: number | null;
  is_ambiguous?: boolean;  // Indica si el tipo es ambiguo y necesita confirmación
}

export interface ExerciseData {
  name: string;
  muscle_group: string;
  equipment_type: string | null;
  aliases: string[];
  description: string | null;
  exercise_type?: ExerciseType;
  default_type?: ExerciseType;
  allowed_types?: ExerciseType[];
}
