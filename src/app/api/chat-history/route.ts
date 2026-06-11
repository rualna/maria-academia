import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { getAuthUser, unauthorized } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getAuthUser(request)
  if (!user) return unauthorized()
  const student_id = user.id

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