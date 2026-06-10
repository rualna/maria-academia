import { supabaseAdmin } from './supabase-admin'

// ============================================================
// SISTEMA DE DETECCIÓN AUTOMÁTICA DE PERFILES DE APRENDIZAJE
// Corre una vez al día por estudiante.
// El perfil se detecta por comportamiento — nunca se le dice
// al estudiante qué perfil tiene.
// Mínimo para activar: profile_confidence >= 30 (7 días datos)
// ============================================================

export type LearningAdaptations = {
  // Perfiles activos
  reading_support_mode:     boolean
  short_session_mode:       boolean
  audio_support_mode:       boolean
  low_stakes_speaking_mode: boolean

  // Adaptaciones derivadas
  time_multiplier:          number
  default_audio_speed:      number
  show_transcript_option:   boolean
  max_exercise_length:      number
  reminder_frequency:       number
  first_attempt_no_score:   boolean
  show_numeric_score:       boolean
  preferred_modality:       string | null

  // Metadata
  profile_confidence:       number
  any_profile_active:       boolean
}

// ============================================================
// RECOLECTAR MÉTRICAS DE LOS ÚLTIMOS 7 DÍAS
// ============================================================
async function collectMetrics(studentId: string) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [speakingRes, exercisesRes, eventsRes, videoRes] = await Promise.all([
    // Speaking attempts últimos 7 días
    supabaseAdmin
      .from('student_speaking_attempts')
      .select('score, created_at')
      .eq('student_id', studentId)
      .gte('created_at', since),

    // Exercise attempts últimos 7 días
    supabaseAdmin
      .from('student_exercise_attempts')
      .select('final_score, time_spent_seconds, abandoned, stuck_flag, lesson_id, created_at, exercise_id')
      .eq('student_id', studentId)
      .gte('created_at', since),

    // Eventos de sesión y actividad últimos 7 días
    supabaseAdmin
      .from('student_events')
      .select('event_type, created_at, event_data')
      .eq('student_id', studentId)
      .gte('created_at', since),

    // Video events (rewatches) últimos 7 días
    supabaseAdmin
      .from('student_video_events')
      .select('rewatch_count, completion_pct, created_at')
      .eq('student_id', studentId)
      .gte('created_at', since),
  ])

  const speaking      = speakingRes.data      || []
  const exercises     = exercisesRes.data     || []
  const events        = eventsRes.data        || []
  const videoEvents   = videoRes.data         || []

  // ── Días únicos activos en los últimos 7 días ──
  const activeDays = new Set(
    events.map(e => e.created_at.substring(0, 10))
  ).size
  const daysWindow = 7

  // ── MÉTRICAS DE SPEAKING ──
  const speakingScores = speaking.map(s => s.score || 0)
  const speaking_avg = speakingScores.length > 0
    ? speakingScores.reduce((a, b) => a + b, 0) / speakingScores.length : null

  const speaking_attempts_per_day = speaking.length / daysWindow

  // ── MÉTRICAS DE EJERCICIOS POR TIPO ──
  const writingEx   = exercises.filter(e => e.exercise_id?.includes('writing') || e.exercise_id?.includes('write'))
  const grammarEx   = exercises.filter(e => e.exercise_id?.includes('grammar') || e.exercise_id?.includes('fill') || e.exercise_id?.includes('multiple'))
  const listeningEx = exercises.filter(e => e.exercise_id?.includes('listening') || e.exercise_id?.includes('audio'))

  const avgScore = (arr: any[]) => arr.length > 0
    ? arr.reduce((s, e) => s + (e.final_score || 0), 0) / arr.length : null

  const abandonRate = (arr: any[]) => arr.length > 0
    ? arr.filter(e => e.abandoned).length / arr.length : 0

  const writing_avg_score   = avgScore(writingEx)   ?? avgScore(exercises.filter(e => !e.exercise_id?.includes('speaking')))
  const grammar_avg_score   = avgScore(grammarEx)   ?? avgScore(exercises)
  const listening_avg_score = avgScore(listeningEx)

  const writing_abandoned_rate  = abandonRate(writingEx.length > 0 ? writingEx : exercises)
  const listening_abandoned     = abandonRate(listeningEx)

  // ── TIEMPO PROMEDIO EN EJERCICIOS ──
  const avgTime = (arr: any[]) => arr.length > 0
    ? arr.reduce((s, e) => s + (e.time_spent_seconds || 0), 0) / arr.length : null

  const writing_avg_time   = avgTime(writingEx)
  const speaking_avg_time_sec = speaking.length > 0 ? 45 : null // estimado por sesión

  // ── MID-SESSION ABANDONED RATE ──
  const totalEx = exercises.length
  const abandoned = exercises.filter(e => e.abandoned).length
  const mid_session_abandoned_rate = totalEx > 0 ? abandoned / totalEx : 0

  // ── SESIONES ──
  const staminaEvents = events.filter(e => e.event_type === 'speaking_stamina')
  const sessionDurations = staminaEvents.map(e => e.event_data?.duration_minutes || 0).filter(d => d > 0)
  const avg_session_duration = sessionDurations.length > 0
    ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length : null

  const sessionsPerWeek = staminaEvents.length
  const shortSessions = sessionDurations.filter(d => d < 15).length

  // ── SESIONES QUE TERMINAN SIN SPEAKING ──
  const totalSessions = Math.max(staminaEvents.length, activeDays)
  const speakingDays = new Set(speaking.map(s => s.created_at.substring(0, 10))).size
  const session_ends_before_speaking = totalSessions > 0
    ? Math.max(0, (activeDays - speakingDays)) / totalSessions : 0

  // ── AUDIO REWATCH COUNT ──
  const rewatchCounts = videoEvents.map(v => v.rewatch_count || 0)
  const avg_rewatch_count = rewatchCounts.length > 0
    ? rewatchCounts.reduce((a, b) => a + b, 0) / rewatchCounts.length : 0

  // ── SPELLING ERROR RATE (aproximado desde transcript) ──
  // Estimamos por diferencia entre texto transcrito y corrected_version
  const spelling_error_rate = 0.15 // placeholder — mejora cuando tengamos más datos

  // ── EXERCISE SKIP RATE ──
  const exercise_skip_rate = exercises.filter(e => (e.time_spent_seconds || 0) < 10 && e.abandoned).length
    / Math.max(exercises.length, 1)

  // ── SPEAKING DURATION PROMEDIO ──
  const avg_speaking_duration_sec = speaking.length > 0 ? 45 : 0 // estimado

  // ── CONFIANZA DEL PERFIL ──
  // 30 = 7 días de datos mínimos para activar
  const dataPoints = speaking.length + exercises.length + events.length
  const profile_confidence = Math.min(100, Math.round(
    (activeDays / 7) * 50 +
    (Math.min(dataPoints, 30) / 30) * 50
  ))

  return {
    speaking_avg,
    speaking_attempts_per_day,
    writing_avg_score,
    grammar_avg_score,
    listening_avg_score,
    writing_avg_time,
    speaking_avg_time_sec,
    writing_abandoned_rate,
    listening_abandoned,
    mid_session_abandoned_rate,
    avg_session_duration,
    sessionsPerWeek,
    shortSessions,
    session_ends_before_speaking,
    avg_rewatch_count,
    spelling_error_rate,
    exercise_skip_rate,
    avg_speaking_duration_sec,
    profile_confidence,
    activeDays,
  }
}

// ============================================================
// EVALUACIÓN DE LOS 4 PERFILES
// ============================================================
function evaluateProfiles(m: Awaited<ReturnType<typeof collectMetrics>>) {
  const result = {
    // Perfiles
    reading_support_mode:     false,
    short_session_mode:       false,
    audio_support_mode:       false,
    low_stakes_speaking_mode: false,

    // Adaptaciones
    time_multiplier:         1.0,
    default_audio_speed:     1.0,
    show_transcript_option:  false,
    max_exercise_length:     5,
    reminder_frequency:      1,
    first_attempt_no_score:  false,
    show_numeric_score:      true,
    preferred_modality:      null as string | null,
  }

  // Solo evalúa si hay suficientes datos
  if (m.profile_confidence < 30) return result

  // ── PERFIL 1: DISLEXIA ──
  // Activa con 3 de 4 señales
  const dislexiaSignals = [
    m.writing_avg_score !== null && m.speaking_avg !== null
      && m.writing_avg_score < m.speaking_avg * 0.70,
    m.writing_avg_time !== null && m.speaking_avg_time_sec !== null
      && m.writing_avg_time > m.speaking_avg_time_sec * 2.0,
    m.writing_abandoned_rate > 0.40,
    m.spelling_error_rate > 0.35,
  ].filter(Boolean).length

  const dislexiaActive = dislexiaSignals >= 3

  // Desactivación automática: writing mejoró al nivel de speaking
  const dislexiaDeactivate = m.writing_avg_score !== null && m.speaking_avg !== null
    && m.writing_avg_score >= m.speaking_avg * 0.80
    && m.writing_abandoned_rate < 0.20

  if (dislexiaActive && !dislexiaDeactivate) {
    result.reading_support_mode = true
    result.time_multiplier = 1.5
    result.preferred_modality = 'audio'
  }

  // ── PERFIL 2: TDAH ──
  // Activa con 3 de 4 señales
  const tdahSignals = [
    m.avg_session_duration !== null && m.avg_session_duration < 20,
    m.mid_session_abandoned_rate > 0.35,
    m.sessionsPerWeek > 6 && m.shortSessions / Math.max(m.sessionsPerWeek, 1) > 0.5,
    m.exercise_skip_rate > 0.30,
  ].filter(Boolean).length

  const tdahActive = tdahSignals >= 3

  // Desactivación: sesiones más largas y menos abandono
  const tdahDeactivate = m.avg_session_duration !== null
    && m.avg_session_duration >= 25
    && m.mid_session_abandoned_rate < 0.15

  if (tdahActive && !tdahDeactivate) {
    result.short_session_mode = true
    result.max_exercise_length = 3
    result.reminder_frequency = 2
  }

  // ── PERFIL 3: AUDITIVO ──
  // Activa con 2 de 3 señales
  const audioSignals = [
    m.listening_avg_score !== null && m.grammar_avg_score !== null
      && m.listening_avg_score < m.grammar_avg_score * 0.65,
    m.avg_rewatch_count > 2.5,
    m.listening_abandoned > 0.45,
  ].filter(Boolean).length

  const audioActive = audioSignals >= 2

  // Desactivación: listening mejoró
  const audioDeactivate = m.listening_avg_score !== null && m.grammar_avg_score !== null
    && m.listening_avg_score >= m.grammar_avg_score * 0.80
    && m.avg_rewatch_count < 1.5

  if (audioActive && !audioDeactivate) {
    result.audio_support_mode = true
    result.default_audio_speed = 0.85
    result.show_transcript_option = true
  }

  // ── PERFIL 4: ANSIEDAD DE SPEAKING ──
  // Activa con 3 de 5 señales
  const ansiedadSignals = [
    m.speaking_attempts_per_day < 3,
    m.speaking_avg !== null && m.grammar_avg_score !== null
      && m.speaking_avg < m.grammar_avg_score * 0.60,
    m.session_ends_before_speaking > 0.40,
    m.avg_speaking_duration_sec < 8,
  ].filter(Boolean).length

  // señal extra: speaking abandoned — usando mid_session como proxy
  const speakingAbandonProxy = m.mid_session_abandoned_rate > 0.50
  const totalAnsiedadSignals = ansiedadSignals + (speakingAbandonProxy ? 1 : 0)

  const ansiedadActive = totalAnsiedadSignals >= 3

  // Desactivación: speaking mejoró y el estudiante practica más
  const ansiedadDeactivate = m.speaking_attempts_per_day >= 4
    && m.session_ends_before_speaking < 0.20
    && m.speaking_avg !== null && m.speaking_avg >= 60

  if (ansiedadActive && !ansiedadDeactivate) {
    result.low_stakes_speaking_mode = true
    result.first_attempt_no_score = true
    result.show_numeric_score = false
  }

  // Preferred modality final
  if (!result.preferred_modality) {
    if (result.audio_support_mode) result.preferred_modality = 'audio'
    else if (result.reading_support_mode) result.preferred_modality = 'visual'
    else if (result.low_stakes_speaking_mode) result.preferred_modality = 'speaking_gentle'
    else result.preferred_modality = 'balanced'
  }

  return result
}

// ============================================================
// FUNCIÓN PRINCIPAL — corre una vez al día por estudiante
// ============================================================
export async function evaluateLearningProfile(studentId: string): Promise<LearningAdaptations> {
  // Verificar si ya se evaluó hoy
  const today = new Date().toISOString().split('T')[0]
  const { data: existing } = await supabaseAdmin
    .from('student_learning_profile')
    .select('last_evaluated_at, profile_confidence, reading_support_mode, short_session_mode, audio_support_mode, low_stakes_speaking_mode, time_multiplier, default_audio_speed, show_transcript_option, max_exercise_length, reminder_frequency, first_attempt_no_score, show_numeric_score, preferred_modality')
    .eq('student_id', studentId)
    .single()

  const lastEval = existing?.last_evaluated_at?.substring(0, 10)

  // Si ya se evaluó hoy, retornar el perfil existente sin recalcular
  if (lastEval === today && existing) {
    return buildAdaptations(existing)
  }

  // Recolectar métricas
  const metrics = await collectMetrics(studentId)

  // Evaluar perfiles
  const profiles = evaluateProfiles(metrics)

  // Guardar en DB
  const profileData = {
    student_id: studentId,
    ...profiles,
    avg_session_duration_7d:          metrics.avg_session_duration,
    writing_avg_score_7d:             metrics.writing_avg_score,
    speaking_avg_score_7d:            metrics.speaking_avg,
    grammar_avg_score_7d:             metrics.grammar_avg_score,
    listening_avg_score_7d:           metrics.listening_avg_score,
    avg_audio_rewatch_count_7d:       metrics.avg_rewatch_count,
    mid_session_abandoned_rate_7d:    metrics.mid_session_abandoned_rate,
    speaking_attempts_per_day_7d:     metrics.speaking_attempts_per_day,
    session_ends_before_speaking_7d:  metrics.session_ends_before_speaking,
    profile_confidence:               metrics.profile_confidence,
    last_evaluated_at:                new Date().toISOString(),
    updated_at:                       new Date().toISOString(),
  }

  await supabaseAdmin
    .from('student_learning_profile')
    .upsert(profileData, { onConflict: 'student_id' })

  return buildAdaptations(profiles, metrics.profile_confidence)
}

// ============================================================
// CONSTRUIR EL OBJETO DE ADAPTACIONES PARA buildMariaContext
// ============================================================
function buildAdaptations(data: any, confidence?: number): LearningAdaptations {
  const anyActive =
    !!data.reading_support_mode ||
    !!data.short_session_mode ||
    !!data.audio_support_mode ||
    !!data.low_stakes_speaking_mode

  return {
    reading_support_mode:     !!data.reading_support_mode,
    short_session_mode:       !!data.short_session_mode,
    audio_support_mode:       !!data.audio_support_mode,
    low_stakes_speaking_mode: !!data.low_stakes_speaking_mode,
    time_multiplier:          data.time_multiplier    ?? 1.0,
    default_audio_speed:      data.default_audio_speed ?? 1.0,
    show_transcript_option:   !!data.show_transcript_option,
    max_exercise_length:      data.max_exercise_length ?? 5,
    reminder_frequency:       data.reminder_frequency  ?? 1,
    first_attempt_no_score:   !!data.first_attempt_no_score,
    show_numeric_score:       data.show_numeric_score  ?? true,
    preferred_modality:       data.preferred_modality  ?? null,
    profile_confidence:       confidence ?? data.profile_confidence ?? 0,
    any_profile_active:       anyActive,
  }
}

// ============================================================
// GETTER rápido (sin recalcular) para usar en contexto de María
// ============================================================
export async function getLearningAdaptations(studentId: string): Promise<LearningAdaptations> {
  const { data } = await supabaseAdmin
    .from('student_learning_profile')
    .select('*')
    .eq('student_id', studentId)
    .single()

  if (!data) {
    // No hay perfil aún — retornar defaults neutros
    return buildAdaptations({})
  }

  // Si el perfil tiene más de 24 horas, recalcular
  const lastEval = new Date(data.last_evaluated_at || 0)
  const hoursSince = (Date.now() - lastEval.getTime()) / (1000 * 60 * 60)

  if (hoursSince > 24) {
    return evaluateLearningProfile(studentId)
  }

  return buildAdaptations(data)
}
