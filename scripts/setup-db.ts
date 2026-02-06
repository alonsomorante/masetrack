import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupDatabase() {
  console.log('🔧 Setting up database...\n');

  // Create users table
  const { error: usersError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        phone_number TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        conversation_state TEXT DEFAULT 'new_user',
        conversation_context JSONB DEFAULT '{}',
        last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });

  if (usersError) {
    console.error('❌ Error creating users table:', usersError);
  } else {
    console.log('✅ Users table created');
  }

  // Create exercises table
  const { error: exercisesError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        muscle_group TEXT NOT NULL,
        equipment_type TEXT,
        aliases TEXT[] DEFAULT '{}',
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });

  if (exercisesError) {
    console.error('❌ Error creating exercises table:', exercisesError);
  } else {
    console.log('✅ Exercises table created');
  }

  // Create workout_entries table
  const { error: entriesError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS workout_entries (
        id SERIAL PRIMARY KEY,
        user_phone TEXT REFERENCES users(phone_number) ON DELETE CASCADE,
        exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
        weight_kg DECIMAL(5,2) NOT NULL,
        reps INTEGER NOT NULL,
        sets INTEGER NOT NULL,
        rir INTEGER CHECK (rir >= 0 AND rir <= 5),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });

  if (entriesError) {
    console.error('❌ Error creating workout_entries table:', entriesError);
  } else {
    console.log('✅ Workout entries table created');
  }

  console.log('\n🎉 Database setup complete!');
}

setupDatabase().catch(console.error);