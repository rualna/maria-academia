import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { student_id, lesson_id, week, month = 1, video_completion_pct, exercise_score } = body

    if (!student_id || !lesson_id || !week) {
      return Response.json({ success: false, error: 'student_id, lesson_id and week required' }, { status: 400 })
    }

    const completed = video_completion_pct >= 80 && exercise_score >= 80

    const { data, error } = await supabaseAdmin
      .from('student_lesson_progress')
      .upsert({
        student_id,
        lesson_id,
        week,
        month,
        video_completion_pct,
        exercise_score,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      }, { onConflict: 'student_id,lesson_id' })
      .select()
      .single()

    if (error) return Response.json({ success: false, error: error.message }, { status: 500 })

    // Si completó la lección, dar XP
    if (completed) {
      await supabaseAdmin
        .from('students')
        .update({ xp: supabaseAdmin.rpc('increment', { x: 10 }) })
        .eq('id', student_id)
    }

    return Response.json({ success: true, progress: data, completed })
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('student_lesson_progress')
    .select('*')
    .eq('student_id', student_id)
    .order('week', { ascending: true })

  if (error) return Response.json({ success: false, error: error.message }, { status: 500 })

  return Response.json({ success: true, lessons: data })
}
