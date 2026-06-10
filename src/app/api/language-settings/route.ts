import { supabaseAdmin } from '@/lib/supabase-admin'
import { getActiveLanguages, getLanguageConfig, isLanguageActive, getNextLanguage, LANGUAGE_CONFIGS } from '@/lib/language-config'

// ============================================================
// 96 — LANGUAGE SWITCHING
// 97 — UNIVERSAL MISSION ENGINE (config)
// 98 — SHARED STUDENT PROFILE (cross-language)
// 99 — CROSS-LANGUAGE ANALYTICS
// ============================================================

// GET — idiomas disponibles + estado del estudiante
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')

  const activeLanguages = getActiveLanguages()
  const allLanguages = Object.values(LANGUAGE_CONFIGS)
  const nextLanguage = getNextLanguage()

  // 98 — Shared student profile: qué idiomas tiene el estudiante
  let studentLanguages = null
  if (student_id) {
    const { data } = await supabaseAdmin
      .from('students')
      .select('current_level, current_language, completed_languages, xp, chokis, streak_days')
      .eq('id', student_id)
      .single()
    studentLanguages = data
  }

  return Response.json({
    success: true,
    active_languages: activeLanguages.map(l => ({
      code: l.code,
      name: l.name_es,
      flag: l.flag,
      tutor: l.tutor_name,
      levels: l.levels,
    })),
    all_languages: allLanguages.map(l => ({
      code: l.code,
      name: l.name_es,
      flag: l.flag,
      active: l.active,
      unlock_trigger: l.unlock_trigger,
      tutor: l.tutor_name,
    })),
    next_language: {
      code: nextLanguage,
      config: getLanguageConfig(nextLanguage),
      unlock_trigger: LANGUAGE_CONFIGS[nextLanguage].unlock_trigger,
      message: 'Se activa cuando AcademIA tenga 100 estudiantes activos o los primeros estudiantes lleguen a B1 en inglés',
    },
    student_profile: studentLanguages,
  })
}

// POST — cambiar idioma del estudiante (96 — Language switching)
export async function POST(request: Request) {
  const { student_id, language_code } = await request.json()

  if (!student_id || !language_code) {
    return Response.json({ success: false, error: 'student_id and language_code required' }, { status: 400 })
  }

  // Verificar que el idioma está activo
  if (!isLanguageActive(language_code)) {
    const config = getLanguageConfig(language_code)
    return Response.json({
      success: false,
      error: `${config.name_es} no está disponible aún`,
      unlock_trigger: config.unlock_trigger,
      message: 'Próximamente en AcademIA',
    }, { status: 403 })
  }

  // 98 — Shared student profile: guardar idioma actual
  await supabaseAdmin
    .from('students')
    .update({ current_language: language_code })
    .eq('id', student_id)

  const config = getLanguageConfig(language_code)

  return Response.json({
    success: true,
    language: language_code,
    tutor: config.tutor_name,
    message: `Ahora estás aprendiendo ${config.name_es} con ${config.tutor_name}`,
  })
}

// ── 99 — CROSS-LANGUAGE ANALYTICS (separado) ──
export async function PATCH(request: Request) {
  const { student_id } = await request.json()

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  // Estadísticas del estudiante por idioma
  const { data: events } = await supabaseAdmin
    .from('student_events')
    .select('level, skill, created_at, event_data')
    .eq('student_id', student_id)
    .order('created_at', { ascending: false })

  const { data: speaking } = await supabaseAdmin
    .from('student_speaking_attempts')
    .select('score, created_at')
    .eq('student_id', student_id)

  // Por ahora todo inglés — cuando agreguen idiomas esto se separa por current_language
  const analytics = {
    english: {
      total_events: events?.length || 0,
      speaking_attempts: speaking?.length || 0,
      avg_score: speaking && speaking.length > 0
        ? Math.round(speaking.reduce((s, a) => s + (a.score || 0), 0) / speaking.length)
        : 0,
      first_activity: events?.[events.length - 1]?.created_at || null,
      last_activity: events?.[0]?.created_at || null,
    },
    portuguese: { status: 'not_started' },
    french: { status: 'not_started' },
  }

  return Response.json({ success: true, cross_language_analytics: analytics })
}
