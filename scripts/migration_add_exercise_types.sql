-- Migration: Add exercise type support for cardio, isometric, and bodyweight exercises
-- Date: 2025-02-05

-- 1. Add exercise_type to exercises table
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS exercise_type VARCHAR(30) 
CHECK (exercise_type IN (
  'strength_weighted',      -- Weighted exercises (barbell, dumbbell)
  'strength_bodyweight',    -- Bodyweight with reps (pull-ups, dynamic push-ups)
  'isometric_time',         -- Time-based static (plank, wall sit)
  'cardio_time',           -- Cardio by time (treadmill 30min)
  'cardio_distance',       -- Cardio by distance (run 5km)
  'cardio_both'            -- Cardio with time + distance
));

-- 2. Add exercise_type to custom_exercises table
ALTER TABLE custom_exercises 
ADD COLUMN IF NOT EXISTS exercise_type VARCHAR(30) 
CHECK (exercise_type IN (
  'strength_weighted',
  'strength_bodyweight',
  'isometric_time',
  'cardio_time',
  'cardio_distance',
  'cardio_both'
));

-- 3. Update workout_entries table to make fields nullable and add new fields
ALTER TABLE workout_entries 
ALTER COLUMN weight_kg DROP NOT NULL,
ALTER COLUMN reps DROP NOT NULL,
ALTER COLUMN sets DROP NOT NULL;

-- 4. Add new fields for different exercise types
ALTER TABLE workout_entries 
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS calories INTEGER,
ADD COLUMN IF NOT EXISTS avg_heart_rate INTEGER,
ADD COLUMN IF NOT EXISTS exercise_type VARCHAR(30);

-- 5. Add default_type to exercises for ambiguous cases
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS default_type VARCHAR(30);

-- 6. Update existing exercises with their types
UPDATE exercises SET 
  exercise_type = 'strength_weighted',
  default_type = 'strength_weighted'
WHERE muscle_group IN ('pecho', 'espalda', 'piernas', 'hombros', 'biceps', 'triceps');

UPDATE exercises SET 
  exercise_type = 'isometric_time',
  default_type = 'isometric_time'
WHERE name = 'Plancha';

UPDATE exercises SET 
  exercise_type = 'strength_bodyweight',
  default_type = 'strength_bodyweight'
WHERE name IN ('Dominadas', 'Fondos en Banco', 'Flexiones');

UPDATE exercises SET 
  exercise_type = 'cardio_time',
  default_type = 'cardio_time'
WHERE muscle_group = 'cardio';

-- 7. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_workout_entries_exercise_type ON workout_entries(exercise_type);
CREATE INDEX IF NOT EXISTS idx_exercises_type ON exercises(exercise_type);

-- 8. Update constraint to allow NULL for weight and reps based on exercise type
ALTER TABLE workout_entries 
ADD CONSTRAINT check_exercise_metrics 
CHECK (
  (exercise_type IN ('strength_weighted', 'strength_bodyweight') AND weight_kg IS NOT NULL AND reps IS NOT NULL) OR
  (exercise_type IN ('isometric_time', 'cardio_time') AND duration_seconds IS NOT NULL) OR
  (exercise_type = 'cardio_distance' AND distance_km IS NOT NULL) OR
  (exercise_type = 'cardio_both' AND (duration_seconds IS NOT NULL OR distance_km IS NOT NULL))
);

-- Migration completed successfully
SELECT 'Migration completed successfully' as status;
