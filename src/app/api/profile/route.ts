import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const body = await request.json()
  const { id, email } = body

  if (!id || !email) {
    return Response.json({ success: false, error: 'id and email required' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single()

  if (existing) {
    return Response.json({ success: true, student: existing })
  }

  const { data, error } = await supabase
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

  return Response.json({ success: true, student: data })
}