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
    const { image_url, name, muscle_group } = body

    const supabase = getSupabaseClient()

    const updateData: any = {}
    if (image_url !== undefined) updateData.image_url = image_url
    if (name !== undefined) updateData.name = name
    if (muscle_group !== undefined) updateData.muscle_group = muscle_group

    const { error } = await supabase
      .from('custom_exercises')
      .update(updateData)
      .eq('id', parseInt(id))

    if (error) {
      console.error('Error updating custom exercise:', error)
      return NextResponse.json(
        { error: 'Error al actualizar ejercicio' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in update custom exercise API:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('custom_exercises')
      .delete()
      .eq('id', parseInt(id))

    if (error) {
      console.error('Error deleting custom exercise:', error)
      return NextResponse.json(
        { error: 'Error al eliminar ejercicio' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete custom exercise API:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}
