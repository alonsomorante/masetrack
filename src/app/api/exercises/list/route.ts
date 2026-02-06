import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json({ error: 'Teléfono requerido' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Obtener ejercicios oficiales
    const { data: officialExercises, error: officialError } = await supabase
      .from('exercises')
      .select('*')
      .order('muscle_group')
      .order('name')

    if (officialError) {
      console.error('Error fetching official exercises:', officialError)
      return NextResponse.json({ error: 'Error al obtener ejercicios' }, { status: 500 })
    }

    // Obtener ejercicios personalizados del usuario
    const { data: customExercises, error: customError } = await supabase
      .from('custom_exercises')
      .select('*')
      .eq('user_phone', phone)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (customError) {
      console.error('Error fetching custom exercises:', customError)
    }

    return NextResponse.json({
      official: officialExercises || [],
      custom: customExercises || []
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}