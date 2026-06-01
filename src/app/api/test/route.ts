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