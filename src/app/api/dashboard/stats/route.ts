import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawPhone = searchParams.get('phone') || ''
    const phone = rawPhone.replace(/\s/g, '+').trim()
    const isAdmin = searchParams.get('admin') === 'true'

    if (!phone) {
      return NextResponse.json(
        { error: 'Teléfono requerido' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    let workoutsQuery = supabase
      .from('workout_entries')
      .select('*')

    // Si no es admin, filtrar por teléfono del usuario
    if (!isAdmin) {
      workoutsQuery = workoutsQuery.eq('user_phone', phone)
    }

    const { data: workoutsData, error: workoutsError } = await workoutsQuery
      .order('created_at', { ascending: false })

    if (workoutsError) {
      console.error('Error fetching workouts:', workoutsError)
      return NextResponse.json(
        { error: 'Error al obtener entrenamientos' },
        { status: 500 }
      )
    }

    const workouts = workoutsData || []

    const exerciseIds = Array.from(
      new Set(workouts.map((w: any) => w.exercise_id).filter((id: any) => id))
    )

    const customExerciseIds = Array.from(
      new Set(workouts.map((w: any) => w.custom_exercise_id).filter((id: any) => id))
    )

    const [exercisesResult, customExercisesResult] = await Promise.all([
      exerciseIds.length > 0
        ? supabase.from('exercises').select('id, name, muscle_group').in('id', exerciseIds)
        : Promise.resolve({ data: [], error: null }),
      customExerciseIds.length > 0
        ? supabase.from('custom_exercises').select('id, name, muscle_group').in('id', customExerciseIds)
        : Promise.resolve({ data: [], error: null })
    ])

    if (exercisesResult.error) {
      console.error('Error fetching exercises:', exercisesResult.error)
      return NextResponse.json(
        { error: 'Error al obtener entrenamientos' },
        { status: 500 }
      )
    }

    if (customExercisesResult.error) {
      console.error('Error fetching custom exercises:', customExercisesResult.error)
    }

    const exercisesMap = new Map(
      (exercisesResult.data || []).map((exercise: any) => [exercise.id, exercise])
    )

    const customExercisesMap = new Map(
      (customExercisesResult.data || []).map((exercise: any) => [exercise.id, exercise])
    )

    const normalizedWorkouts = workouts.map((workout: any) => {
      const officialExercise = workout.exercise_id
        ? exercisesMap.get(workout.exercise_id)
        : null
      const customExercise = workout.custom_exercise_id
        ? customExercisesMap.get(workout.custom_exercise_id)
        : null
      const exerciseName = officialExercise?.name || customExercise?.name
      const muscleGroup = officialExercise?.muscle_group || customExercise?.muscle_group

      return {
        ...workout,
        exercise_name: exerciseName,
        muscle_group: muscleGroup,
        is_custom: Boolean(customExercise),
        exercises: officialExercise || customExercise || null,
        custom_exercises: customExercise || null
      }
    })

    // Calcular estadísticas
    const stats = calculateStats(normalizedWorkouts)

    return NextResponse.json({
      workouts: normalizedWorkouts,
      stats,
    })
  } catch (error) {
    console.error('Error in dashboard API:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}

function calculateStats(workouts: any[]) {
  if (workouts.length === 0) {
    return {
      totalWorkouts: 0,
      totalVolume: 0,
      uniqueExercises: 0,
      muscleGroups: {},
    }
  }

  // Agrupar sets por ejercicio y fecha para contar "entrenamientos" (no sets individuales)
  const workoutSessions = new Set()
  workouts.forEach(w => {
    const date = new Date(w.created_at).toDateString()
    const exerciseKey = w.exercise_id || w.custom_exercise_id
    workoutSessions.add(`${date}-${exerciseKey}`)
  })

  // Calcular volumen total (peso × reps × sets, donde sets siempre es 1 ahora)
  const totalVolume = workouts.reduce((sum, w) => {
    return sum + (w.weight_kg * w.reps * w.sets)
  }, 0)

  // Contar ejercicios únicos (oficiales + personalizados)
  const uniqueExercises = new Set(
    workouts.map(w => w.exercise_id || `custom_${w.custom_exercise_id}`)
  ).size

  // Contar sets por grupo muscular (ahora cada registro es 1 set)
  const muscleGroups = workouts.reduce((acc, w) => {
    const group = w.muscle_group || w.exercises?.muscle_group || 'otros'
    acc[group] = (acc[group] || 0) + (w.sets || 1)
    return acc
  }, {})

  return {
    totalWorkouts: workoutSessions.size, // Sesiones únicas (ejercicio + fecha)
    totalVolume: Math.round(totalVolume),
    uniqueExercises,
    muscleGroups,
  }
}
