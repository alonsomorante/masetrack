import { createClient } from '@supabase/supabase-js';
import { User, Exercise, WorkoutEntry } from '@/types';
import type { Database } from '@/types/database';

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are missing.');
    }

    supabaseClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseClient;
}

export async function getUserByPhone(phoneNumber: string): Promise<User | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching user:', error);
    throw error;
  }

  return data as User;
}

export async function createUser(phoneNumber: string, name: string): Promise<User> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .insert({
      phone_number: phoneNumber,
      name,
      conversation_state: 'new_user',
      conversation_context: {},
      last_message_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }

  return data as User;
}

export async function updateUser(phoneNumber: string, updates: Partial<User>): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('users')
    .update({
      ...updates,
      last_message_at: new Date().toISOString(),
    })
    .eq('phone_number', phoneNumber);

  if (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function getExerciseByName(name: string): Promise<Exercise | null> {
  console.log(`🔍 Buscando ejercicio por nombre: "${name}"`);
  const supabase = getSupabaseClient();
  
  // First try exact match (case insensitive)
  const { data: exactData, error: exactError } = await supabase
    .from('exercises')
    .select('*')
    .ilike('name', name)
    .single();

  if (exactData) {
    console.log(`✅ Ejercicio encontrado (exacto):`, (exactData as Exercise)?.name, `ID: ${(exactData as Exercise)?.id}`);
    return exactData as Exercise;
  }
  
  // If no exact match, get all exercises and do fuzzy matching
  const { data: allExercises, error } = await supabase
    .from('exercises')
    .select('*');

  if (error) {
    if (error.code === 'PGRST116') {
      console.log(`⚠️ No hay ejercicios en la base de datos`);
      return null;
    }
    console.error('Error fetching exercises:', error);
    throw error;
  }

  if (!allExercises || allExercises.length === 0) {
    return null;
  }

  // Fuzzy matching
  const normalizedSearch = normalizeText(name);
  const searchWords = normalizedSearch.split(' ').filter(w => w.length > 0);
  
  let bestMatch: Exercise | null = null;
  let bestScore = 0;
  const MIN_SCORE_THRESHOLD = 0.5;
  
  const exercises = allExercises as Exercise[];
  
  for (const exercise of exercises) {
    const normalizedExerciseName = normalizeText(exercise.name);
    const exerciseWords = normalizedExerciseName.split(' ').filter(w => w.length > 0);
    
    const score = calculateWordOverlap(searchWords, exerciseWords);
    const normalizedScore = score / Math.max(searchWords.length, 1);
    
    if (normalizedScore > bestScore && normalizedScore >= MIN_SCORE_THRESHOLD) {
      bestScore = normalizedScore;
      bestMatch = exercise;
    }
  }
  
  if (bestMatch) {
    console.log(`✅ Ejercicio encontrado (fuzzy):`, bestMatch.name, `ID: ${bestMatch.id}`, `Score: ${bestScore.toFixed(2)}`);
  } else {
    console.log(`⚠️ Ejercicio "${name}" no encontrado (mejor score: ${bestScore.toFixed(2)})`);
  }
  
  return bestMatch;
}

export async function createWorkoutEntry(entry: Omit<WorkoutEntry, 'id' | 'created_at'>): Promise<WorkoutEntry> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('workout_entries')
    .insert(entry)
    .select()
    .single();

  if (error) {
    console.error('Error creating workout entry:', error);
    throw error;
  }

  return data as WorkoutEntry;
}

export async function createCustomExercise(exercise: {
  user_phone: string;
  name: string;
  muscle_group: string;
  image_url?: string;
}): Promise<{ id: number; name: string; muscle_group: string }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('custom_exercises')
    .insert(exercise)
    .select('id, name, muscle_group')
    .single();

  if (error) {
    console.error('Error creating custom exercise:', error);
    throw error;
  }

  return data as { id: number; name: string; muscle_group: string };
}

// Helper function to normalize text for fuzzy matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\b(con|de|en|por|para|del|la|el|los|las|un|una)\b/g, ' ') // Remove common prepositions/articles
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to calculate word overlap score
function calculateWordOverlap(searchWords: string[], targetWords: string[]): number {
  const searchSet = new Set(searchWords);
  const targetSet = new Set(targetWords);
  let overlap = 0;
  
  for (const word of searchSet) {
    if (targetSet.has(word)) {
      overlap += 1;
    } else {
      // Check for partial matches
      for (const targetWord of targetSet) {
        if (targetWord.includes(word) || word.includes(targetWord)) {
          overlap += 0.5;
          break;
        }
      }
    }
  }
  
  return overlap;
}

export async function getCustomExerciseByName(phoneNumber: string, name: string): Promise<{ id: number; name: string; muscle_group: string } | null> {
  const supabase = getSupabaseClient();
  
  // First try exact match (case insensitive)
  const { data: exactData, error: exactError } = await supabase
    .from('custom_exercises')
    .select('id, name, muscle_group')
    .eq('user_phone', phoneNumber)
    .ilike('name', name)
    .single();

  if (exactData) {
    return exactData as { id: number; name: string; muscle_group: string };
  }
  
  // If no exact match, get all user's exercises and do fuzzy matching
  const { data: allExercises, error } = await supabase
    .from('custom_exercises')
    .select('id, name, muscle_group')
    .eq('user_phone', phoneNumber);

  if (error) {
    console.error('Error fetching custom exercises:', error);
    throw error;
  }

  if (!allExercises || allExercises.length === 0) {
    return null;
  }

  // Fuzzy matching
  const normalizedSearch = normalizeText(name);
  const searchWords = normalizedSearch.split(' ').filter(w => w.length > 0);
  
  let bestMatch: { id: number; name: string; muscle_group: string } | null = null;
  let bestScore = 0;
  const MIN_SCORE_THRESHOLD = 0.5;
  
  const exercises = allExercises as { id: number; name: string; muscle_group: string }[];
  
  for (const exercise of exercises) {
    const normalizedExerciseName = normalizeText(exercise.name);
    const exerciseWords = normalizedExerciseName.split(' ').filter(w => w.length > 0);
    
    const score = calculateWordOverlap(searchWords, exerciseWords);
    const normalizedScore = score / Math.max(searchWords.length, 1);
    
    if (normalizedScore > bestScore && normalizedScore >= MIN_SCORE_THRESHOLD) {
      bestScore = normalizedScore;
      bestMatch = exercise;
    }
  }
  
  return bestMatch;
}

export async function updateCustomExerciseImage(exerciseId: number, imageUrl: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('custom_exercises')
    .update({ image_url: imageUrl })
    .eq('id', exerciseId);

  if (error) {
    console.error('Error updating custom exercise image:', error);
    throw error;
  }
}
