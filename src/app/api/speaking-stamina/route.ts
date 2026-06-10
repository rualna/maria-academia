import { supabaseAdmin } from '@/lib/supabase-admin'

// ============================================================
// 60 — SPEAKING STAMINA TRACKING
// Rastrea cuántos minutos habla el estudiante por sesión
// y si mejora semana a semana
// ============================================================

// POST — registrar una sesión de speaking con su duración
export async function POST(request: Request) {
  const { student_id, duration_seconds, word_count, session_type } = await request.json()
  // session_type: 'daily_speaking' | 'monthly_exam' | 'free_practice'

  if (!student_id || !duration_seconds) {
    return Response.json({ success: false, error: 'student_id and duration_seconds required' }, { status: 400 })
  }

  const duration_minutes = Math.round(duration_seconds / 60 * 10) / 10

  await supabaseAdmin.from('student_events').insert([{
    student_id,
    event_type: 'speaking_stamina',
    level: null,
    module_name: 'Speaking Stamina',
    lesson_id: null,
    skill: 'speaking',
    score: null,
    event_data: {
      duration_seconds,
      duration_minutes,
      word_count: word_count || 0,
      words_per_minute: word_count && duration_seconds > 0
        ? Math.round(word_count / (duration_seconds / 60))
        : 0,
      session_type: session_type || 'daily_speaking',
      recorded_at: new Date().toISOString(),
    },
  }])

  return Response.json({ success: true, duration_minutes })
}

// GET — historial de stamina del estudiante + progresión
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  const { data } = await supabaseAdmin
    .from('student_events')
    .select('event_data, created_at')
    .eq('student_id', student_id)
    .eq('event_type', 'speaking_stamina')
    .order('created_at', { ascending: true })
    .limit(30)

  if (!data || data.length === 0) {
    return Response.json({
      success: true,
      stamina: { sessions: 0, avg_minutes: 0, best_minutes: 0, trend: 'no_data' },
    })
  }

  const sessions = data.map((d: any) => d.event_data.duration_minutes)
  const avgMinutes = Math.round(sessions.reduce((a: number, b: number) => a + b, 0) / sessions.length * 10) / 10
  const bestMinutes = Math.max(...sessions)

  // Calcular tendencia: comparar primera mitad vs segunda mitad
  const half = Math.floor(sessions.length / 2)
  const firstHalfAvg = sessions.slice(0, half).reduce((a: number, b: number) => a + b, 0) / half
  const secondHalfAvg = sessions.slice(half).reduce((a: number, b: number) => a + b, 0) / (sessions.length - half)
  const trend = secondHalfAvg > firstHalfAvg * 1.1 ? 'improving' :
                secondHalfAvg < firstHalfAvg * 0.9 ? 'declining' : 'stable'

  // Nivel de stamina según minutos promedio
  const staminaLevel =
    avgMinutes >= 10 ? 'excellent' :
    avgMinutes >= 5  ? 'good' :
    avgMinutes >= 2  ? 'developing' : 'starting'

  return Response.json({
    success: true,
    stamina: {
      sessions: sessions.length,
      avg_minutes: avgMinutes,
      best_minutes: bestMinutes,
      trend,
      stamina_level: staminaLevel,
      history: data.map((d: any) => ({
        date: d.created_at,
        minutes: d.event_data.duration_minutes,
        words_per_minute: d.event_data.words_per_minute,
      })),
    },
  })
}
