-- Create users table
CREATE TABLE IF NOT EXISTS users (
  phone_number TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  conversation_state TEXT DEFAULT 'new_user',
  conversation_context JSONB DEFAULT '{}',
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment_type TEXT,
  aliases TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workout_entries_user_phone ON workout_entries(user_phone);
CREATE INDEX IF NOT EXISTS idx_workout_entries_created_at ON workout_entries(created_at);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_entries ENABLE ROW LEVEL SECURITY;

-- Service role policies
CREATE POLICY "Service role all access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all access" ON exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all access" ON workout_entries FOR ALL USING (true) WITH CHECK (true);