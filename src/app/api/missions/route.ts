import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCurrentWeek, getPhrasesForWeek } from '@/lib/maria-context'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')

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
