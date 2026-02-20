import Anthropic from '@anthropic-ai/sdk';
import { ParsedWorkout, ExerciseType } from '@/types';
import { EXERCISES_DATA, ExerciseDataExtended, detectExerciseTypeFromContext } from '@/lib/data/exercises.catalog';

export async function parseWorkoutMessage(message: string): Promise<ParsedWorkout> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is missing.');
  }

  const anthropic = new Anthropic({ apiKey });
  
  const systemPrompt = `You are a workout tracking assistant. Extract workout data from user messages with extreme precision.

IMPORTANT: Users can name their exercises however they want. There is NO fixed catalog. Extract the EXACT name the user writes.

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

1. EXERCISE NAME EXTRACTION - CRITICAL - EXTRACT EXACT USER INPUT:
    - Extract the exercise name from the BEGINNING of the message, BEFORE any numbers/weight/reps
    - **DO NOT normalize or change the exercise name** - Use EXACTLY what the user wrote
    - Examples of correct extraction:
      * "Sentadillas con barra olímpica 95 kilos" → exercise_name: "Sentadillas con barra olímpica"
      * "Press banca inclinado 80kg" → exercise_name: "Press banca inclinado"
      * "Pull-down agarre neutral 50kg" → exercise_name: "Pull-down agarre neutral"
      * "Curl martillo con mancuernas 15kg" → exercise_name: "Curl martillo con mancuernas"
      * "Sentadilla 100kg" → exercise_name: "Sentadilla"
      * "Press de banca 70 kilos" → exercise_name: "Press de banca"
    - STOP reading the exercise name when you encounter:
      * Any number (80, 100, etc.)
      * Weight units (kg, kilos, lbs, pounds)
      * Rep indicators (reps, repeticiones)
      * Set indicators (sets, series)
      * Time indicators (segundos, minutos, horas)
      * Distance indicators (km, metros, millas)
    - DO NOT match against any catalog or normalize names
    - DO NOT change "Sentadillas" to "Sentadilla" - keep it as written
    - DO NOT add or remove words - use EXACTLY what the user wrote
      * "martillo", "curl martillo", "hammer curl" → "Curl Martillo"
      * "press", "press banca", "pecho", "press de pecho" → "Press de Banca"
      * "dominadas", "pull ups", "chin ups" → "Dominadas"
      * "sentadilla", "squat" → "Sentadilla"
    - For custom exercises: Use the SAME fuzzy matching logic. Match partial words and ignore prepositions.
    - If you can't find an exact match, look for the CLOSEST match in the catalog based on word overlap
    - Return null ONLY if NO exercise name can be reasonably inferred

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

8. RIR (Repetitions in Reserve) - OBLIGATORY FIELD:
    - RIR is REQUIRED. Extract it from the FIRST message whenever possible.
    - RIR represents how many MORE reps the user could have done before stopping.
    - 0 = reached failure (couldn't do any more)
    - 1-5 = could have done that many more reps
    
    EXTRACTION PATTERNS from natural language:
    - "RIR 0" / "rir 0" / "RIR: 0" → rir: 0 or [0, 0, 0]
    - "RIR 1 en todos" / "rir 1" → rir: 1 or [1, 1, 1]
    - "todos al fallo" / "todas al fallo" → rir: [0, 0, 0]
    - "lo di todo" / "di todo" / "al fallo" → rir: 0
    - "no podía más" / "no podia mas" → rir: 0
    - "una más" / "una mas" / "dejé una" → rir: 1
    - "dos más" / "dos mas" / "dejé dos" → rir: 2
    - "primer set al fallo, segundo una más" → rir: [0, 1]
    - "set 1: 0, set 2: 2" → rir: [0, 2]
    - "pude haber hecho 1 más" → rir: 1
    - "pude haber hecho 2 más" → rir: 2
    
    If RIR is NOT provided in first message, set rir: null.
    If RIR is provided as single number for multiple sets, use that number for all sets.
    If RIR varies by set, return as array: [0, 1, 2]

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

- Input: "Press banca 70 kilos"
  Output: {"exercise_name": "Press de Banca", "exercise_type": "strength_weighted", "weight_kg": 70, "sets": null, "reps": null, "rir": null, "notes": null}

- Input: "Sentadilla 100kg"
   Output: {"exercise_name": "Sentadilla", "exercise_type": "strength_weighted", "weight_kg": 100, "sets": null, "reps": null, "rir": null, "notes": null}

- Input: "Curl con barra 30kg 12 reps 3 series"
   Output: {"exercise_name": "Curl con Barra", "exercise_type": "strength_weighted", "weight_kg": 30, "sets": 3, "reps": 12, "rir": null, "notes": null}

- Input: "curl barra 25kg 10 reps"
   Output: {"exercise_name": "Curl con Barra", "exercise_type": "strength_weighted", "weight_kg": 25, "sets": null, "reps": 10, "rir": null, "notes": null}

- Input: "Curl de biceps con barra 20 kilos"
   Output: {"exercise_name": "Curl con Barra", "exercise_type": "strength_weighted", "weight_kg": 20, "sets": null, "reps": null, "rir": null, "notes": null}

 - Input: "bench press 80 kilos"
   Output: {"exercise_name": "Press de Banca", "exercise_type": "strength_weighted", "weight_kg": 80, "sets": null, "reps": null, "rir": null, "notes": null}

 - Input: "Bench press 3 sets, 1er set 80 kilos 3 reps, 2 set 3 reps 75 kilos, 3er set 5 reps 75 kilos. Rir 0 en todas"
   Output: {"exercise_name": "Press de Banca", "exercise_type": "strength_weighted", "weight_kg": [80, 75, 75], "sets": 3, "reps": [3, 3, 5], "rir": [0, 0, 0], "notes": null}
 
 - Input: "bench press 3 sets, 1er set 5 reps rir 1, 2do y 3er set rir 0"
   Output: {"exercise_name": "Press de Banca", "exercise_type": "strength_weighted", "weight_kg": null, "sets": 3, "reps": 5, "rir": [1, 0, 0], "notes": null}

- Input: "Press banca 3 sets, set 1: 80kg x 5 reps rir 1, set 2: 75kg x 6 reps rir 0, set 3: 75kg x 5 reps rir 0"
   Output: {"exercise_name": "Press de Banca", "exercise_type": "strength_weighted", "weight_kg": [80, 75, 75], "sets": 3, "reps": [5, 6, 5], "rir": [1, 0, 0], "notes": null}

- Input: "Press militar 3 series con 60kg, primer set al fallo, segundo una más, tercero dos más"
   Output: {"exercise_name": "Press Militar", "exercise_type": "strength_weighted", "weight_kg": 60, "sets": 3, "reps": null, "rir": [0, 1, 2], "notes": null}

- Input: "Dominadas 10 reps 3 sets, todas al fallo"
   Output: {"exercise_name": "Dominadas", "exercise_type": "strength_bodyweight", "weight_kg": null, "sets": 3, "reps": 10, "rir": [0, 0, 0], "notes": null}

- Input: "Curl de biceps 15kg 12 reps 2 series, una más en cada set"
   Output: {"exercise_name": "Curl de Bíceps", "exercise_type": "strength_weighted", "weight_kg": 15, "sets": 2, "reps": 12, "rir": [1, 1], "notes": null}

- Input: "Sentadilla 100kg 8 reps 3 series rir 2"
   Output: {"exercise_name": "Sentadilla", "exercise_type": "strength_weighted", "weight_kg": 100, "sets": 3, "reps": 8, "rir": 2, "notes": null}

- Input: "Press banca 80kg 6 reps 4 sets RIR 0"
   Output: {"exercise_name": "Press de Banca", "exercise_type": "strength_weighted", "weight_kg": 80, "sets": 4, "reps": 6, "rir": 0, "notes": null}

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
    console.log('🤖 Claude raw response:', text);
    
    const jsonMatch = text.match(/\{[^}]+\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('📊 Parsed workout:', JSON.stringify(parsed, null, 2));
      
      // Clean exercise name - remove weight/reps that might have been included
      let exerciseName = parsed.exercise_name;
      if (exerciseName) {
        // Remove numbers followed by kg, kilos, kilo, lbs, etc.
        exerciseName = exerciseName.replace(/\s+\d+\s*(kg|kilo|kilos|lbs|lb|pounds?)\b/gi, '');
        // Remove standalone numbers at the end
        exerciseName = exerciseName.replace(/\s+\d+$/g, '');
        // Trim whitespace
        exerciseName = exerciseName.trim();
        console.log('🧹 Cleaned exercise name:', exerciseName);
      }
      
      // Find the exercise in catalog to check if type is ambiguous
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

export interface FollowUpParseResult {
  extracted: {
    reps: number | number[] | null;
    sets: number | null;
    rir: number | number[] | null;
    weight_kg: number | number[] | null;
    duration_seconds: number | null;
    distance_km: number | null;
  };
  merged: ParsedWorkout;
  is_complete: boolean;
  missing_fields: string[];
  clarification_needed: string | null;
}

export async function parseFollowUpResponse(
  message: string,
  pendingWorkout: ParsedWorkout
): Promise<FollowUpParseResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is missing.');
  }

  const anthropic = new Anthropic({ apiKey });

  const pendingWorkoutJson = JSON.stringify(pendingWorkout, null, 2);

  const systemPrompt = `You are a parser that extracts workout data from user follow-up responses.

## Context
The user is in the middle of registering a workout. They have already provided some data. Your job is to:
1. Extract NEW data from their response
2. Combine with existing data
3. Determine if complete or what is missing

## Existing Data (pending_workout)
${pendingWorkoutJson}

## EXTRACTION PATTERNS (Reference):

### Reps
- "10 reps", "10 repeticiones", "10" → reps: 10

### Sets
- "3 sets", "3 series", "3" → sets: 3

### RIR (0-5)
- Simple: "RIR 2", "rir: 2", "2" → rir: 2
- Per-set: "set 1: 0, set 2: 1" → rir: [0, 1]
- Natural: "al fallo" → 0, "una más" → 1, "dos más" → 2
- "RIR 1 en el primer set RIR 0 en los otros" → [1, 0, 0]
- "set 1 rir 2, los otros rir 1" → [2, 1, 1]
- Ordinal: "primer set rir 0", "segundo set rir 1"

### Weight
- "80kg", "80 kilos", "80" → weight_kg: 80
- Per-set: "set 1: 80kg, set 2: 75kg" → [80, 75]

### Duration
- "60 segundos" → 60
- "2 minutos" → 120

### Distance
- "5 km" → 5

## RULES:
1. If single number and reps already defined → assume it's sets
2. If single value (RIR), apply to ALL sets
3. If partial per-set data, fill remaining with last value
4. "los otros"/"los demás" → apply to remaining sets
5. If user asks "qué es RIR?" or "no sé" → set clarification_needed: "explain_rir"
6. RIR must be 0-5, ignore invalid values

## EXAMPLES:

**Existing:** {exercise_name: "Press Banca", weight_kg: 80, sets: null, reps: null, rir: null}
**User says:** "10 reps 3 series"
**Result:**
{
  "extracted": { "reps": 10, "sets": 3 },
  "merged": { "exercise_name": "Press Banca", "weight_kg": 80, "sets": 3, "reps": 10, "rir": null },
  "is_complete": false,
  "missing_fields": ["rir"],
  "clarification_needed": null
}

**Existing:** {exercise_name: "Press Banca", weight_kg: 80, sets: 3, reps: 10, rir: null}
**User says:** "RIR 1 en el primer set RIR 0 en los otros"
**Result:**
{
  "extracted": { "rir": [1, 0, 0] },
  "merged": { "exercise_name": "Press Banca", "weight_kg": 80, "sets": 3, "reps": 10, "rir": [1, 0, 0] },
  "is_complete": true,
  "missing_fields": [],
  "clarification_needed": null
}

**Existing:** {exercise_name: "Press Banca", weight_kg: 80, sets: 3, reps: 10, rir: null}
**User says:** "Qué es el RIR?"
**Result:**
{
  "extracted": {},
  "merged": { "exercise_name": "Press Banca", "weight_kg": 80, "sets": 3, "reps": 10, "rir": null },
  "is_complete": false,
  "missing_fields": ["rir"],
  "clarification_needed": "explain_rir"
}

## OUTPUT:
Return ONLY valid JSON with this structure:
{
  "extracted": { "reps": null, "sets": null, "rir": null, "weight_kg": null, "duration_seconds": null, "distance_km": null },
  "merged": { ...merged workout object... },
  "is_complete": boolean,
  "missing_fields": string[],
  "clarification_needed": string | null
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('🤖 Claude follow-up raw response:', text);

    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('📊 Follow-up parsed result:', JSON.stringify(parsed, null, 2));

      return {
        extracted: {
          reps: parsed.extracted?.reps ?? null,
          sets: parsed.extracted?.sets ?? null,
          rir: parsed.extracted?.rir ?? null,
          weight_kg: parsed.extracted?.weight_kg ?? null,
          duration_seconds: parsed.extracted?.duration_seconds ?? null,
          distance_km: parsed.extracted?.distance_km ?? null,
        },
        merged: parsed.merged || pendingWorkout,
        is_complete: parsed.is_complete || false,
        missing_fields: parsed.missing_fields || [],
        clarification_needed: parsed.clarification_needed || null,
      };
    }

    return {
      extracted: {
        reps: null,
        sets: null,
        rir: null,
        weight_kg: null,
        duration_seconds: null,
        distance_km: null,
      },
      merged: pendingWorkout,
      is_complete: false,
      missing_fields: getMissingFields(pendingWorkout),
      clarification_needed: null,
    };
  } catch (error) {
    console.error('Error calling Claude for follow-up:', error);
    return {
      extracted: {
        reps: null,
        sets: null,
        rir: null,
        weight_kg: null,
        duration_seconds: null,
        distance_km: null,
      },
      merged: pendingWorkout,
      is_complete: false,
      missing_fields: getMissingFields(pendingWorkout),
      clarification_needed: null,
    };
  }
}

function getMissingFields(workout: ParsedWorkout): string[] {
  const fields: string[] = [];
  const type = workout.exercise_type;

  if (type === 'strength_weighted') {
    if (!workout.weight_kg) fields.push('weight_kg');
  }
  if (type === 'strength_weighted' || type === 'strength_bodyweight') {
    if (!workout.reps) fields.push('reps');
    if (!workout.sets) fields.push('sets');
    if (!workout.rir) fields.push('rir');
  }
  if (type === 'isometric_time' || type === 'cardio_time') {
    if (!workout.duration_seconds) fields.push('duration_seconds');
  }
  if (type === 'cardio_distance' || type === 'cardio_both') {
    if (!workout.distance_km) fields.push('distance_km');
  }
  if (type === 'cardio_both') {
    if (!workout.duration_seconds) fields.push('duration_seconds');
  }

  return fields;
}

export interface UserIntent {
  intent: 'create_workout' | 'cancel' | 'help' | 'exercises_list' | 'web_dashboard' | 'continue_workout' | 'unknown';
  confidence: number;
  suggested_action?: string;
}

export async function detectUserIntent(
  message: string,
  currentState: string,
  hasPendingWorkout: boolean
): Promise<UserIntent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is missing.');
  }

  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are an intent detection system for a workout tracking WhatsApp bot.

## Current Context
- Current conversation state: ${currentState}
- Has pending workout: ${hasPendingWorkout}

## Possible Intents

1. **create_workout** - User wants to start/register a new workout/exercise
   - Examples: "quiero registrar un ejercicio", "agregar entrenamiento", "nuevo ejercicio", "añadir press banca", "voy a hacer sentadillas"
   - Even if they say "ejercicio nuevo" or "nuevo ejercicio" - they want to CREATE, not cancel

2. **cancel** - User wants to cancel/stop current operation
   - Examples: "cancelar", "parar", "detener", "no quiero continuar", "borra esto", "empezar de nuevo", "olvidalo"
   - ONLY if they clearly want to abort current operation

3. **help** - User needs help/instructions
   - Examples: "ayuda", "no sé cómo", "cómo funciona", "no entiendo", "instrucciones", "help"

4. **exercises_list** - User wants to see available exercises
   - Examples: "lista de ejercicios", "qué ejercicios hay", "catálogo", "mostrar ejercicios"

5. **web_dashboard** - User wants the web dashboard link
   - Examples: "web", "dashboard", "link", "quiero ver mi progreso", "página web"

6. **continue_workout** - User is providing data to continue current workout registration
   - Examples: specific numbers like "80kg", "10 reps", "3 series", "RIR 2"
   - Use this when they're in the middle of a workout registration flow

7. **unknown** - Cannot determine intent clearly

## IMPORTANT RULES

- If user says "ejercicio nuevo", "nuevo ejercicio", "registrar nuevo" → intent: "create_workout" (NOT cancel)
- If user says "quiero parar", "detener", "cancelar esto" → intent: "cancel"
- Be generous interpreting workout creation intent - if they mention any exercise or wanting to add/register, it's create_workout
- If they have a pending workout and provide numbers/data, it's likely "continue_workout"

## OUTPUT
Return ONLY valid JSON:
{
  "intent": "create_workout" | "cancel" | "help" | "exercises_list" | "web_dashboard" | "continue_workout" | "unknown",
  "confidence": 0.0 to 1.0,
  "suggested_action": "brief description of what to do"
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('🤖 Claude intent detection raw response:', text);

    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('📊 Intent detected:', parsed);

      return {
        intent: parsed.intent || 'unknown',
        confidence: parsed.confidence || 0.5,
        suggested_action: parsed.suggested_action || '',
      };
    }

    return { intent: 'unknown', confidence: 0, suggested_action: '' };
  } catch (error) {
    console.error('Error detecting intent:', error);
    return { intent: 'unknown', confidence: 0, suggested_action: '' };
  }
}
