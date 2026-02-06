import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'Teléfono requerido' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    const { data: exercises, error } = await supabase
      .from('custom_exercises')
      .select('*')
      .eq('user_phone', phone)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching custom exercises:', error)
      return NextResponse.json(
        { error: 'Error al obtener ejercicios' },
        { status: 500 }
      )
    }

    return NextResponse.json({ exercises: exercises || [] })
  } catch (error) {
    console.error('Error in custom exercises API:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_phone, name, muscle_group } = body

    if (!user_phone || !name || !muscle_group) {
      return NextResponse.json(
        { error: 'Teléfono, nombre y grupo muscular requeridos' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('custom_exercises')
      .insert({ user_phone, name, muscle_group })
      .select()
      .single()

    if (error) {
      console.error('Error creating custom exercise:', error)
      return NextResponse.json(
        { error: 'Error al crear ejercicio' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, exercise: data })
  } catch (error) {
    console.error('Error in custom exercises API:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}
