import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      user_phone, 
      exercise_id, 
      custom_exercise_id,
      weight_kg, 
      reps, 
      sets, 
      rir, 
      notes 
    } = body

    // Validaciones
    if (!user_phone) {
      return NextResponse.json({ error: 'Teléfono de usuario requerido' }, { status: 400 })
    }

    if (!exercise_id && !custom_exercise_id) {
      return NextResponse.json({ error: 'Debes seleccionar un ejercicio' }, { status: 400 })
    }

    if (!weight_kg || weight_kg <= 0) {
      return NextResponse.json({ error: 'Peso debe ser mayor a 0' }, { status: 400 })
    }

    if (!reps || reps <= 0) {
      return NextResponse.json({ error: 'Repeticiones deben ser mayor a 0' }, { status: 400 })
    }

    if (!sets || sets <= 0) {
      return NextResponse.json({ error: 'Series deben ser mayor a 0' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Insertar entrenamiento
    const { data, error } = await supabase
      .from('workout_entries')
      .insert({
        user_phone,
        exercise_id: exercise_id || null,
        custom_exercise_id: custom_exercise_id || null,
        weight_kg,
        reps,
        sets,
        rir: rir !== undefined ? rir : null,
        notes: notes || null,
        source: 'web'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating workout:', error)
      return NextResponse.json({ error: 'Error al guardar entrenamiento' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      workout: data,
      message: 'Entrenamiento registrado correctamente'
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}