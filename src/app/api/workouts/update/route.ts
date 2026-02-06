import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/client'

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { weight_kg, reps, sets, rir, notes } = body

    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('workout_entries')
      .update({
        weight_kg,
        reps,
        sets,
        rir,
        notes,
      })
      .eq('id', parseInt(id))

    if (error) {
      console.error('Error updating workout:', error)
      return NextResponse.json(
        { error: 'Error al actualizar entrenamiento' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in update API:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}
