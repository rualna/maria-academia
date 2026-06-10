import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('student_events')
    .select('*')
    .eq('student_id', student_id)
    .eq('event_type', 'ai_response')
    .order('created_at', { ascending: true })
    .limit(20)

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }

  return Response.json({ success: true, history: data })
}