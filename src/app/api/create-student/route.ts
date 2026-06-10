import { supabaseAdmin } from '@/lib/supabase-admin'

// ============================================================
// POST /api/create-student
// Crea (o devuelve) el perfil del estudiante en la tabla `students`.
// El frontend (page.tsx) lo llama al entrar, con el id+email del usuario auth.
// Usa supabaseAdmin (service role) para evitar bloqueos de RLS en el insert.
// ============================================================
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, email } = body

    if (!id || !email) {
      return Response.json({ success: false, error: 'id and email required' }, { status: 400 })
    }

    // ¿Ya existe? → idempotente, no duplica
    const { data: existing } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', id)
      .single()

    if (existing) {
      return Response.json({ success: true, student: existing, created: false })
    }

    // Alta del estudiante nuevo
    const { data, error } = await supabaseAdmin
      .from('students')
      .insert([
        {
          id,
          email,
          full_name: email.split('@')[0],
          current_level: 'A1',
          current_module: 'Speaking',
        },
      ])
      .select()
      .single()

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, student: data, created: true })
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
