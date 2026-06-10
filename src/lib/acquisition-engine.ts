import { supabaseAdmin } from './supabase-admin'

// ============================================================
// 169 — BEHAVIORAL LEARNING ENGINE
// 170 — LANGUAGE ACQUISITION INTELLIGENCE ENGINE
// ============================================================
// EL MOTOR MÁS IMPORTANTE.
//
// 169 — Aprende de cómo CADA estudiante aprende mejor
// 170 — Entiende cómo hispanohablantes adquieren inglés
//       y usa eso para acelerar el aprendizaje
//
// Con 10 estudiantes: útil
// Con 100 estudiantes: poderoso
// Con 1000 estudiantes: imposible de copiar
// ============================================================

// ── 169 — BEHAVIORAL LEARNING ENGINE ──
// Aprende del comportamiento del estudiante para personalizar
export type BehaviorPattern = {
  student_id: string
  best_performance_hour: number      // hora del día con mejor score
  best_session_length_minutes: number // duración óptima de sesión
  optimal_exercise_sequence: string[] // orden de ejercicios que mejor funciona
  learning_velocity: number           // puntos de mejora por sesión
  engagement_triggers: string[]       // qué lo mantiene enganchado
  disengagement_signals: string[]     // qué señales preceden el abandono
  personalization_confidence: number  // 0-100 qué tan confiable es el perfil
}

export async function buildBehaviorPattern(studentId: string): Promise<BehaviorPattern> {
  const [eventsRes, speakingRes, exercisesRes] = await Promise.all([
    supabaseAdmin
      .from('student_events')
      .select('created_at, event_type, event_data')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true })
      .limit(100),
    supabaseAdmin
      .from('student_speaking_attempts')
      .select('score, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('student_exercise_attempts')
      .select('final_score, time_spent_seconds, abandoned, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true }),
  ])

  const events = eventsRes.data || []
  const speaking = speakingRes.data || []
  const exercises = exercisesRes.data || []

  // Mejor hora del día
  const hourScores: Record<number, number[]> = {}
  for (const s of speaking) {
    const hour = new Date(s.created_at).getHours()
    if (!hourScores[hour]) hourScores[hour] = []
    hourScores[hour].push(s.score || 0)
  }
  const bestHour = Object.entries(hourScores)
    .map(([h, scores]) => ({ hour: parseInt(h), avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
    .sort((a, b) => b.avg - a.avg)[0]?.hour || 19

  // Velocidad de aprendizaje
  let learningVelocity = 0
  if (speaking.length >= 4) {
    const firstHalf = speaking.slice(0, Math.floor(speaking.length / 2))
    const secondHalf = speaking.slice(Math.floor(speaking.length / 2))
    const firstAvg = firstHalf.reduce((s, a) => s + (a.score || 0), 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((s, a) => s + (a.score || 0), 0) / secondHalf.length
    learningVelocity = Math.round((secondAvg - firstAvg) / (speaking.length / 2) * 10) / 10
  }

  // Señales de desenganche
  const disengagementSignals: string[] = []
  const abandoned = exercises.filter(e => e.abandoned).length
  const shortSessions = exercises.filter(e => (e.time_spent_seconds || 0) < 60).length
  if (abandoned > 2) disengagementSignals.push('Abandona ejercicios frecuentemente')
  if (shortSessions > 3) disengagementSignals.push('Sesiones muy cortas (<1 min)')

  // Triggers de engagement
  const engagementTriggers: string[] = []
  if (speaking.length > 5) engagementTriggers.push('Practica speaking regularmente')
  const chatEvents = events.filter(e => e.event_type === 'ai_response').length
  if (chatEvents > 10) engagementTriggers.push('Usa el chat activamente')

  const confidence = Math.min(100, Math.round(
    (speaking.length / 10) * 30 +
    (exercises.length / 20) * 30 +
    (events.length / 30) * 40
  ))

  return {
    student_id: studentId,
    best_performance_hour: bestHour,
    best_session_length_minutes: 25, // default hasta tener más datos
    optimal_exercise_sequence: ['speaking', 'grammar', 'vocabulary'], // default
    learning_velocity: learningVelocity,
    engagement_triggers: engagementTriggers,
    disengagement_signals: disengagementSignals,
    personalization_confidence: confidence,
  }
}

// ── 170 — LANGUAGE ACQUISITION INTELLIGENCE ENGINE ──
// El corazón de la ventaja competitiva.
// Entiende CÓMO los hispanohablantes adquieren inglés
// y usa ese conocimiento para cada estudiante.
export type AcquisitionIntelligence = {
  acquisition_stage: 'silent_period' | 'early_production' | 'speech_emergence' | 'intermediate_fluency' | 'advanced_fluency'
  stage_description: string
  what_maria_does: string
  next_stage_triggers: string[]
  estimated_sessions_to_next_stage: number
  latam_specific_insights: string[]
}

// Etapas de adquisición para hispanohablantes (basado en investigación real)
const ACQUISITION_STAGES: Record<string, AcquisitionIntelligence> = {
  silent_period: {
    acquisition_stage: 'silent_period',
    stage_description: 'El estudiante absorbe pero no produce. Normal en primeras sesiones.',
    what_maria_does: 'Input comprensible masivo. No forzar producción. Mucho modelo y repetición.',
    next_stage_triggers: ['Responde con frases cortas', 'Repite correctamente 5+ veces'],
    estimated_sessions_to_next_stage: 3,
    latam_specific_insights: [
      'Hispanohablantes tienden a querer hablar antes de estar listos — frenarlos ayuda',
      'El silencio inicial no es falla — es procesamiento',
    ],
  },
  early_production: {
    acquisition_stage: 'early_production',
    stage_description: 'Produce palabras sueltas y frases de 2-3 palabras. Semanas 1-2.',
    what_maria_does: 'Yes/No questions. Fill-in-the-blank. Repetición con modelo claro.',
    next_stage_triggers: ['Completa oraciones de 4+ palabras', 'Score > 6 consistente'],
    estimated_sessions_to_next_stage: 8,
    latam_specific_insights: [
      'El español ayuda: cognates dan confianza rápida (telephone, natural, possible)',
      'Evitar gramática explícita al inicio — flujo primero',
    ],
  },
  speech_emergence: {
    acquisition_stage: 'speech_emergence',
    stage_description: 'Forma oraciones completas con errores. Puede comunicarse básicamente. A1 completo.',
    what_maria_does: 'Open-ended questions. Corrección recasts (sin señalar el error). Expansión de respuestas.',
    next_stage_triggers: ['Sostiene 2 min de conversación', 'Score > 7 promedio'],
    estimated_sessions_to_next_stage: 15,
    latam_specific_insights: [
      'Este es el punto donde más estudiantes se frustran — el progreso se siente lento pero es real',
      'El refuerzo de Chokis/XP es crítico aquí para mantener motivación',
      'Los errores de Verb BE disminuyen naturalmente — no sobre-corregir',
    ],
  },
  intermediate_fluency: {
    acquisition_stage: 'intermediate_fluency',
    stage_description: 'Conversa con fluidez sobre temas conocidos. A2-B1. Traducción mental disminuye.',
    what_maria_does: 'Conversación libre. Corrección de precisión. Expansión de vocabulario.',
    next_stage_triggers: ['Habla 5+ min sin bloqueo total', 'Usa conectores naturalmente'],
    estimated_sessions_to_next_stage: 25,
    latam_specific_insights: [
      'Punto de inflexión: dejan de traducir mentalmente del español',
      'Errores de interferencia del español (denglish) son señal de progreso, no regresión',
      'Los mejores estudiantes de LATAM en esta etapa practican fuera de la app — incentivar',
    ],
  },
  advanced_fluency: {
    acquisition_stage: 'advanced_fluency',
    stage_description: 'Habla con confianza sobre cualquier tema. B2-C1. Piensa en inglés.',
    what_maria_does: 'Matices, registro formal/informal, expresiones idiomáticas. Desafiar con temas complejos.',
    next_stage_triggers: ['C1 mastery confirmado', 'Evaluación trimestral aprobada'],
    estimated_sessions_to_next_stage: 0,
    latam_specific_insights: [
      'Hispanohablantes en C1 tienen acento latinoamericano — celebrarlo, no eliminarlo',
      'El objetivo es fluidez comunicativa, no perfección de nativo',
      'Estos estudiantes son los mejores embajadores de AcademIA',
    ],
  },
}

// Determinar etapa de adquisición del estudiante
export function determineAcquisitionStage(params: {
  speaking_sessions: number
  avg_score: number
  avg_words_per_session: number
  conversation_minutes: number
}): AcquisitionIntelligence {
  const { speaking_sessions, avg_score, avg_words_per_session, conversation_minutes } = params

  if (speaking_sessions <= 2 || avg_words_per_session < 5) {
    return ACQUISITION_STAGES.silent_period
  }
  if (avg_score < 55 || avg_words_per_session < 15) {
    return ACQUISITION_STAGES.early_production
  }
  if (avg_score < 65 || conversation_minutes < 2) {
    return ACQUISITION_STAGES.speech_emergence
  }
  if (avg_score < 78 || conversation_minutes < 5) {
    return ACQUISITION_STAGES.intermediate_fluency
  }
  return ACQUISITION_STAGES.advanced_fluency
}

// API helper completo para el motor de adquisición
export async function getAcquisitionProfile(studentId: string) {
  const [speakingRes, behaviorPattern] = await Promise.all([
    supabaseAdmin
      .from('student_speaking_attempts')
      .select('score, transcript, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(20),
    buildBehaviorPattern(studentId),
  ])

  const speaking = speakingRes.data || []
  const avgScore = speaking.length > 0
    ? speaking.reduce((s, a) => s + (a.score || 0), 0) / speaking.length
    : 0
  const avgWords = speaking.length > 0
    ? speaking.filter(s => s.transcript).map(s => s.transcript.split(' ').length).reduce((a, b) => a + b, 0) / speaking.length
    : 0

  const stage = determineAcquisitionStage({
    speaking_sessions: speaking.length,
    avg_score: avgScore,
    avg_words_per_session: avgWords,
    conversation_minutes: avgWords / 130, // ~130 palabras/minuto en A1
  })

  return {
    acquisition_stage: stage,
    behavior_pattern: behaviorPattern,
    learning_velocity: behaviorPattern.learning_velocity,
    personalization_ready: behaviorPattern.personalization_confidence >= 50,
    maria_recommendation: stage.what_maria_does,
    latam_insights: stage.latam_specific_insights,
  }
}
