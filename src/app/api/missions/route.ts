import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCurrentWeek, getPhrasesForWeek } from '@/lib/maria-context'
import { getAuthUser, unauthorized } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getAuthUser(request)
  if (!user) return unauthorized()
  const student_id = user.id

  let level = 'A1'
  let currentWeek = 1

  if (student_id) {
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('current_level')
      .eq('id', student_id)
      .single()

    if (student?.current_level) level = student.current_level
    currentWeek = await getCurrentWeek(student_id)
  }

  const { data, error } = await supabaseAdmin
    .from('speaking_missions')
    .select('*')
    .eq('target_level', level)
    .limit(1)
    .single()

  if (error) {
    return Response.json({ success: false, error: error.message })
  }

  // Frases reales del mes 1 — selección aleatoria según semana
  const phrases = getPhrasesForWeek(currentWeek, 5)

  return Response.json({
    success: true,
    mission: {
      ...data,
      phrases,
      min_score: data.min_score ?? 7,
      current_week: currentWeek,
    },
  })
}
