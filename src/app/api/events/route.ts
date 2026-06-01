import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const body = await request.json()

  const { data, error } = await supabase
    .from('student_events')
    .insert([
      {
        student_id: body.student_id,
        event_type: body.event_type,
        level: body.level,
        module_name: body.module_name,
        lesson_id: body.lesson_id,
        skill: body.skill,
        score: body.score,
        event_data: body.event_data,
      },
    ])
    .select()

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }

  return Response.json({ success: true, event: data?.[0] })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')

  if (!student_id) {
    return Response.json(
      { success: false, error: 'student_id is required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('student_events')
    .select('*')
    .eq('student_id', student_id)
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return Response.json({
    success: true,
    events: data,
  })
}