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
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .ilike('name', name)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log(`⚠️ Ejercicio "${name}" no encontrado (PGRST116)`);
      return null;
    }
    console.error('Error fetching exercise:', error);
    throw error;
  }

  console.log(`✅ Ejercicio encontrado:`, (data as Exercise)?.name, `ID: ${(data as Exercise)?.id}`);
  return data as Exercise;
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

export async function getCustomExerciseByName(phoneNumber: string, name: string): Promise<{ id: number; name: string; muscle_group: string } | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('custom_exercises')
    .select('id, name, muscle_group')
    .eq('user_phone', phoneNumber)
    .ilike('name', name)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching custom exercise:', error);
    throw error;
  }

  return data as { id: number; name: string; muscle_group: string };
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
