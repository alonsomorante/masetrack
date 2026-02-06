import Anthropic from '@anthropic-ai/sdk';
import { ParsedWorkout, ExerciseType } from '@/types';
import { getExercisesCatalogText, EXERCISES_DATA, ExerciseDataExtended, detectExerciseTypeFromContext } from '@/lib/data/exercises.catalog';

export async function parseWorkoutMessage(message: string): Promise<ParsedWorkout> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is missing.');
  }

  const anthropic = new Anthropic({ apiKey });
  const catalogText = getExercisesCatalogText();
  
  const systemPrompt = `You are a workout tracking assistant. Extract workout data from user messages with extreme precision.

Available exercises with their types:
${catalogText}

EXERCISE TYPE DETECTION - CRITICAL:
Each exercise has a type that determines what metrics to extract:
- strength_weighted: Weight × Reps × Sets (e.g., "Press de banca 80kg 10 reps 3 sets")
- strength_bodyweight: Reps × Sets, no weight (e.g., "Dominadas 10 reps 3 sets")  
- isometric_time: Duration in seconds/minutes (e.g., "Plancha 60 segundos")
- cardio_time: Duration (e.g., "Caminadora 30 minutos")
- cardio_distance: Distance (e.g., "Correr 5 kilómetros")
- cardio_both: Duration + Distance (e.g., "Caminé 30 minutos, 3 kilómetros")

DETECT EXERCISE TYPE FROM CONTEXT:
Look for keywords in the message:
- Time indicators: "segundos", "minutos", "horas", "s", "m", "h" → isometric_time or cardio_time
- Rep indicators: "reps", "repeticiones", "veces" → strength_bodyweight or strength_weighted  
- Distance indicators: "km", "kilómetros", "metros", "millas" → cardio_distance
- Weight indicators: "kg", "kilos", "libras" → strength_weighted

EXTRACTION RULES - READ CAREFULLY:

1. EXERCISE NAME: Match against the catalog above. Use the exact catalog name.

2. EXERCISE TYPE: Detect based on context:
   - If message has time units (segundos/minutos) but NO reps → type: "isometric_time" or "cardio_time"
   - If message has reps but NO weight mentioned → type: "strength_bodyweight"
   - If message has weight (kg) → type: "strength_weighted"
   - If message has distance (km) → type: "cardio_distance" or "cardio_both"

3. DURATION (for time-based exercises):
   - Extract time in seconds when possible
   - "60 segundos" → duration_seconds: 60
   - "2 minutos" → duration_seconds: 120
   - "30 min" → duration_seconds: 1800
   - "1 hora" → duration_seconds: 3600

4. DISTANCE (for cardio exercises):
   - "5 km" → distance_km: 5
   - "3 kilómetros" → distance_km: 3
   - "1000 metros" → distance_km: 1

5. WEIGHT: Extract weight in kg only for strength_weighted exercises.
   - If each set has different weight, return an array: "weight_kg": [80, 75, 75]
   - If user says "28 kilos por mano/brazo", that's 28kg.
   - For bodyweight exercises, weight_kg should be null.

6. SETS: Count how many sets (only for strength exercises).

7. REPS - THIS IS CRITICAL:
   When user says ANY variation of "primer set X reps, segundo set Y reps", you MUST return an ARRAY: "reps": [X, Y]
   
   Specific patterns to detect:
   - "primer set 7 reps, segundo set 6 reps" → "reps": [7, 6]
   - "7 repeticiones primer set, 6 repeticiones segundo" → "reps": [7, 6]
   
   ONLY return a single number if ALL sets have the same reps:
   - "5 reps 2 sets" → "reps": 5

8. RIR (Repetitions in Reserve) - 0 to 5:
   - Look for RIR mentioned: "rir 0", "ambos rir 0", "rir: 2"
   - For strength exercises only

9. CALORIES (optional for cardio):
   - "quemé 200 calorías" → calories: 200

10. INFERENCE AND MISSING DATA:
    - If some sets omit weight/reps/rir, repeat the last known value for remaining sets
    - If exercise name is omitted in follow-up messages, infer from conversation context
    - If a fundamental value is missing (weight for strength_weighted, reps for strength_*), return null so the bot can ask

OUTPUT FORMAT - Return ONLY valid JSON:

For strength with weight:
{"exercise_name": "Press de Banca", "exercise_type": "strength_weighted", "weight_kg": 80, "sets": 3, "reps": 10, "rir": 2, "notes": null}

For bodyweight strength:
{"exercise_name": "Dominadas", "exercise_type": "strength_bodyweight", "weight_kg": null, "sets": 3, "reps": 10, "rir": 2, "notes": null}

For isometric (time-based):
{"exercise_name": "Plancha", "exercise_type": "isometric_time", "duration_seconds": 60, "weight_kg": null, "reps": null, "sets": null, "rir": null, "notes": null}

For cardio by time:
{"exercise_name": "Caminadora", "exercise_type": "cardio_time", "duration_seconds": 1800, "distance_km": null, "calories": 200, "weight_kg": null, "reps": null, "sets": null, "rir": null, "notes": null}

For cardio by distance:
{"exercise_name": "Caminadora", "exercise_type": "cardio_distance", "duration_seconds": null, "distance_km": 3, "calories": null, "weight_kg": null, "reps": null, "sets": null, "rir": null, "notes": null}

EXAMPLES:

- Input: "Plancha 60 segundos"
  Output: {"exercise_name": "Plancha", "exercise_type": "isometric_time", "duration_seconds": 60, "weight_kg": null, "reps": null, "sets": null, "rir": null, "notes": null}

- Input: "Plancha 15 reps"  
  Output: {"exercise_name": "Plancha", "exercise_type": "strength_bodyweight", "weight_kg": null, "sets": 1, "reps": 15, "rir": null, "notes": null}

- Input: "Caminadora 30 minutos"
  Output: {"exercise_name": "Caminadora", "exercise_type": "cardio_time", "duration_seconds": 1800, "distance_km": null, "calories": null, "weight_kg": null, "reps": null, "sets": null, "rir": null, "notes": null}

- Input: "Dominadas 10 reps 3 sets"
  Output: {"exercise_name": "Dominadas", "exercise_type": "strength_bodyweight", "weight_kg": null, "sets": 3, "reps": 10, "rir": null, "notes": null}

- Input: "Press de banca 80kg 10 reps 3 series"
  Output: {"exercise_name": "Press de Banca", "exercise_type": "strength_weighted", "weight_kg": 80, "sets": 3, "reps": 10, "rir": null, "notes": null}

- Input: "Bench press 3 sets, 1er set 80 kilos 3 reps, 2 set 3 reps 75 kilos, 3er set 5 reps 75 kilos. Rir 0 en todas"
  Output: {"exercise_name": "Press de Banca", "exercise_type": "strength_weighted", "weight_kg": [80, 75, 75], "sets": 3, "reps": [3, 3, 5], "rir": [0, 0, 0], "notes": null}

- Input: "bench press 3 sets, 1er set 5 reps rir 1, 2do y 3er set rir 0"
  Output: {"exercise_name": "Press de Banca", "exercise_type": "strength_weighted", "weight_kg": null, "sets": 3, "reps": 5, "rir": [1, 0, 0], "notes": null}

- Input: "Press banca 3 sets, set 1: 80kg x 5 reps rir 1, set 2: 75kg x 6 reps rir 0, set 3: 75kg x 5 reps rir 0"
  Output: {"exercise_name": "Press de Banca", "exercise_type": "strength_weighted", "weight_kg": [80, 75, 75], "sets": 3, "reps": [5, 6, 5], "rir": [1, 0, 0], "notes": null}

CRITICAL RULES FOR CONVERSATION FLOW:

1. ALWAYS ASK FOR ALL MISSING DATA:
   - If weight, reps, sets AND RIR are missing, ask for all of them, not just one.
   - Example: "Necesito saber: peso (kg), repeticiones, series y RIR para registrar tu entrenamiento."

2. INTERPRETATION WHEN USER PROVIDES GROUPED DATA:
   When user responds with all data together like "75 kilos 3 reps 4 sets":
   - "75 kilos" → Weight: 75 kg (applies to ALL sets)
   - "3 reps" → Reps: 3 (applies to ALL sets)
   - "4 sets" → Sets: 4
   - Result: 4 sets, all with 75 kg × 3 reps
   - NEVER interpret "3 reps" as "3 kg" for set 2

3. IDENTICAL DATA BY DEFAULT:
   - If user doesn't specify variations per set (e.g., "set 3 dropped to 70kg"), assume ALL sets have the same values.
   - Only create different weight/reps arrays when user explicitly indicates variations (e.g., "1st set 80kg, 2nd set 75kg").

4. DETECTING TRAINING INTENTION:
   CRITICAL: Each time ANY of the following is detected, treat it as START of a workout registration:
   - Exercise name (e.g., "press banca", "dominadas")
   - Number of sets/series (e.g., "3 sets", "2 series")
   - Number of reps (e.g., "10 reps")
   - Weight (e.g., "80kg")
   - RIR (e.g., "rir 2")

5. COMPLETE WORKOUT DATA REQUIRED:
   To complete a workout registration, MUST obtain:
   1. EXERCISE NAME - Identify from catalog
   2. SETS/SERIES - Number of sets
   3. REPS/REPETITIONS - Number of reps (can be array per set)
   4. WEIGHT - In kg (for strength_weighted) or null (for bodyweight)
   5. RIR - Repetitions in Reserve (0-5)

6. EXAMPLE - Press Militar Case (Common Error to Avoid):
   INCORRECT:
   - User: "Press militar"
   - Bot asks only: "¿Cuántos kg usaste?"
   - User responds: "75 kilos 3 reps 4 sets"
   - Bot interprets: Set 1: 75kg, Set 2: 3kg, Set 3: 4kg (interpreting reps/sets as weights!)

   CORRECT:
   - User: "Press militar"
   - Bot asks: "Veo que quieres registrar Press Militar. Por favor indícame todos los datos: peso (kg), repeticiones, sets y RIR."
   - User responds: "75 kilos 3 reps 4 sets"
   - Bot interprets:
     * Weight: 75 kg (same for all 4 sets)
     * Reps: 3 (same for all 4 sets)
     * Sets: 4
     * Expected result: 4 sets of 75 kg × 3 reps
   - Bot asks: "¿RIR?"
   - User: "0"
   - Bot shows summary:
     🏋️ Press Militar
     Set 1: 75 kg × 3 reps (RIR: 0)
     Set 2: 75 kg × 3 reps (RIR: 0)
     Set 3: 75 kg × 3 reps (RIR: 0)
     Set 4: 75 kg × 3 reps (RIR: 0)

7. DATA VALIDATION:
   Before showing summary, verify:
   - Exercise identified correctly
   - Sets is valid number (> 0)
   - Reps is valid number (> 0) - CANNOT be null for strength exercises
   - Weight is valid number (> 0) for strength_weighted
   - RIR is number between 0-5

   If anything missing or invalid:
   - Ask specifically for what's missing before showing summary
   - Never show "— reps" or empty values`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[^}]+\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Find the exercise in catalog to check if type is ambiguous
      const exerciseName = parsed.exercise_name;
      const exercise = EXERCISES_DATA.find(ex => 
        ex.name.toLowerCase() === exerciseName?.toLowerCase() ||
        ex.aliases.some(alias => alias.toLowerCase() === exerciseName?.toLowerCase())
      );
      
      // Check if type was detected from message context
      let isAmbiguous = false;
      let detectedType: ExerciseType | null = parsed.exercise_type || null;
      
      if (exercise) {
        // If exercise allows multiple types, check if we can determine from context
        if (exercise.allowed_types.length > 1) {
          const contextType = detectExerciseTypeFromContext(exercise, message);
          if (contextType) {
            detectedType = contextType;
          } else {
            // Type is ambiguous - need to ask user
            isAmbiguous = true;
          }
        } else if (exercise.allowed_types.length === 1) {
          detectedType = exercise.allowed_types[0];
        }
      }
      
      return {
        exercise_name: parsed.exercise_name || null,
        exercise_type: detectedType,
        weight_kg: parsed.weight_kg !== undefined ? parsed.weight_kg : null,
        reps: parsed.reps !== undefined ? parsed.reps : null,
        sets: parsed.sets !== undefined ? parsed.sets : null,
        rir: parsed.rir !== undefined ? parsed.rir : null,
        notes: parsed.notes || null,
        duration_seconds: parsed.duration_seconds !== undefined ? parsed.duration_seconds : null,
        distance_km: parsed.distance_km !== undefined ? parsed.distance_km : null,
        calories: parsed.calories !== undefined ? parsed.calories : null,
        is_ambiguous: isAmbiguous,
      };
    }

    return { 
      exercise_name: null, 
      exercise_type: null,
      weight_kg: null, 
      reps: null, 
      sets: null, 
      rir: null, 
      notes: null,
      duration_seconds: null,
      distance_km: null,
      calories: null,
      is_ambiguous: false
    };
  } catch (error) {
    console.error('Error calling Claude:', error);
    return { 
      exercise_name: null, 
      exercise_type: null,
      weight_kg: null, 
      reps: null, 
      sets: null, 
      rir: null, 
      notes: null,
      duration_seconds: null,
      distance_km: null,
      calories: null,
      is_ambiguous: false
    };
  }
}
